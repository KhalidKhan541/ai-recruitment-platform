import { z } from "zod";

// ─── Provider Configuration ──────────────────────────────────────────────────

export const ProviderConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "azure", "ollama"]),
  model: z.string().min(1),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().default(4096),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  timeout: z.number().int().positive().default(60000),
  retries: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().int().positive().default(1000),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ─── Message Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  stream?: boolean;
  functions?: FunctionDefinition[];
  functionCall?: "auto" | "none" | { name: string };
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatCompletionResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  finishReason: "stop" | "length" | "function_call" | "content_filter";
  usage: TokenUsage;
  functionCall?: {
    name: string;
    arguments: string;
  };
  latencyMs: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

// ─── Provider Interface ──────────────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  readonly isAvailable: boolean;
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  stream(
    request: ChatCompletionRequest
  ): AsyncIterable<ChatCompletionStreamChunk>;
  embed(texts: string[]): Promise<number[][]>;
  validate(): Promise<boolean>;
}

export interface ChatCompletionStreamChunk {
  id: string;
  delta: string;
  finishReason?: "stop" | "length" | "function_call" | "content_filter";
  usage?: Partial<TokenUsage>;
}

// ─── Pricing per 1K tokens ───────────────────────────────────────────────────

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
};

// ─── OpenAI Provider ─────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private config: ProviderConfig;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  get isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = performance.now();
    const body = {
      model: this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      top_p: request.topP ?? this.config.topP,
      frequency_penalty: request.frequencyPenalty ?? this.config.frequencyPenalty,
      presence_penalty: request.presencePenalty ?? this.config.presencePenalty,
      stop: request.stop,
      functions: request.functions,
      function_call: request.functionCall,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;
    const choice = data.choices[0];

    return {
      id: data.id,
      provider: this.name,
      model: this.config.model,
      content: choice.message?.content || "",
      finishReason: choice.finish_reason,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        estimatedCost: this.calculateCost(
          data.usage?.prompt_tokens || 0,
          data.usage?.completion_tokens || 0
        ),
      },
      functionCall: choice.message?.function_call,
      latencyMs,
    };
  }

  async *stream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamChunk> {
    const body = {
      model: this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices[0]?.delta;
          if (delta?.content) {
            yield {
              id: parsed.id,
              delta: delta.content,
              finishReason: parsed.choices[0]?.finish_reason,
            };
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[this.config.model] || { input: 0.01, output: 0.03 };
    return (
      (promptTokens / 1000) * pricing.input +
      (completionTokens / 1000) * pricing.output
    );
  }

  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(this.config.timeout),
        });
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.config.retryDelay * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retries) {
          await new Promise((r) =>
            setTimeout(r, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }
    throw lastError || new Error("Request failed after retries");
  }
}

// ─── Anthropic Provider ──────────────────────────────────────────────────────

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private config: ProviderConfig;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
  }

  get isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = performance.now();
    const systemMessage = request.messages.find((m) => m.role === "system");
    const nonSystemMessages = request.messages.filter((m) => m.role !== "system");

    const body = {
      model: this.config.model,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      top_p: request.topP ?? this.config.topP,
      system: systemMessage?.content,
      stop_sequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;
    const content = data.content?.[0]?.text || "";

    return {
      id: data.id,
      provider: this.name,
      model: this.config.model,
      content,
      finishReason: data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        estimatedCost: this.calculateCost(
          data.usage?.input_tokens || 0,
          data.usage?.output_tokens || 0
        ),
      },
      latencyMs,
    };
  }

  async *stream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamChunk> {
    const systemMessage = request.messages.find((m) => m.role === "system");
    const nonSystemMessages = request.messages.filter((m) => m.role !== "system");

    const body = {
      model: this.config.model,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      system: systemMessage?.content,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta") {
            yield {
              id: parsed.message_id || "",
              delta: parsed.delta?.text || "",
            };
          } else if (parsed.type === "message_stop") {
            yield {
              id: "",
              delta: "",
              finishReason: "stop",
            };
          }
        } catch {
          // skip
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Anthropic does not provide embedding API; fallback to simple hash-based vectors
    return texts.map((text) => this.simpleHashEmbedding(text));
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
        }),
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[this.config.model] || { input: 0.003, output: 0.015 };
    return (
      (inputTokens / 1000) * pricing.input +
      (outputTokens / 1000) * pricing.output
    );
  }

  private simpleHashEmbedding(text: string): number[] {
    const vec = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      vec[i % 384] += charCode;
      vec[(i * 7 + 13) % 384] ^= charCode;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(this.config.timeout),
        });
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.config.retryDelay * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retries) {
          await new Promise((r) =>
            setTimeout(r, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }
    throw lastError || new Error("Request failed after retries");
  }
}

// ─── Google Gemini Provider ──────────────────────────────────────────────────

class GoogleProvider implements AIProvider {
  readonly name = "google";
  private config: ProviderConfig;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl =
      config.baseUrl || `https://generativelanguage.googleapis.com/v1beta`;
  }

  get isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = performance.now();
    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const systemInstruction = request.messages.find((m) => m.role === "system");

    const body = {
      contents,
      systemInstruction: systemInstruction
        ? { parts: [{ text: systemInstruction.content }] }
        : undefined,
      generationConfig: {
        temperature: request.temperature ?? this.config.temperature,
        maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
        topP: request.topP ?? this.config.topP,
        stopSequences: Array.isArray(request.stop)
          ? request.stop
          : request.stop
          ? [request.stop]
          : undefined,
      },
    };

    const url = `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      id: `google-${Date.now()}`,
      provider: this.name,
      model: this.config.model,
      content,
      finishReason: data.candidates?.[0]?.finishReason === "STOP" ? "stop" : "length",
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
        estimatedCost: this.calculateCost(
          data.usageMetadata?.promptTokenCount || 0,
          data.usageMetadata?.candidatesTokenCount || 0
        ),
      },
      latencyMs,
    };
  }

  async *stream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamChunk> {
    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const url = `${this.baseUrl}/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}&alt=sse`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? this.config.temperature,
          maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
        },
      }),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield { id: `google-${Date.now()}`, delta: text };
          }
        } catch {
          // skip
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const url = `${this.baseUrl}/models/${this.config.model}:embedContent?key=${this.config.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${this.config.model}`,
          content: { parts: [{ text }] },
        }),
      });
      const data = await response.json();
      results.push(data.embedding?.values || []);
    }
    return results;
  }

  async validate(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/models?key=${this.config.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[this.config.model] || { input: 0.00125, output: 0.005 };
    return (
      (promptTokens / 1000) * pricing.input +
      (completionTokens / 1000) * pricing.output
    );
  }
}

// ─── Ollama (Local) Provider ─────────────────────────────────────────────────

class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  private config: ProviderConfig;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "http://localhost:11434";
  }

  get isAvailable(): boolean {
    return true;
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = performance.now();
    const body = {
      model: this.config.model,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? this.config.temperature,
        num_predict: request.maxTokens ?? this.config.maxTokens,
        top_p: request.topP ?? this.config.topP,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;

    return {
      id: `ollama-${Date.now()}`,
      provider: this.name,
      model: this.config.model,
      content: data.message?.content || "",
      finishReason: data.done ? "stop" : "length",
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        estimatedCost: 0,
      },
      latencyMs,
    };
  }

  async *stream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamChunk> {
    const body = {
      model: this.config.model,
      messages: request.messages,
      stream: true,
      options: {
        temperature: request.temperature ?? this.config.temperature,
        num_predict: request.maxTokens ?? this.config.maxTokens,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            yield {
              id: `ollama-${Date.now()}`,
              delta: parsed.message.content,
              finishReason: parsed.done ? "stop" : undefined,
            };
          }
        } catch {
          // skip
        }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.config.model, prompt: text }),
      });
      const data = await response.json();
      results.push(data.embedding || []);
    }
    return results;
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ─── Multi-Provider Manager ──────────────────────────────────────────────────

export interface ProviderRoute {
  provider: string;
  model: string;
  weight: number;
  maxTokensPerDay: number;
  costPer1k: number;
}

export interface UsageRecord {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  timestamp: Date;
  feature: string;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number }>;
}

export class MultiProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private routes: ProviderRoute[] = [];
  private usageLog: UsageRecord[] = [];
  private dailyBudget: number = 100;
  private currentDayTokens: number = 0;

  constructor(configs: ProviderConfig[]) {
    for (const config of configs) {
      const provider = this.createProvider(config);
      if (provider.isAvailable) {
        this.providers.set(config.provider, provider);
      }
    }
  }

  private createProvider(config: ProviderConfig): AIProvider {
    switch (config.provider) {
      case "openai":
        return new OpenAIProvider(config);
      case "anthropic":
        return new AnthropicProvider(config);
      case "google":
        return new GoogleProvider(config);
      case "ollama":
        return new OllamaProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  addRoute(route: ProviderRoute): void {
    this.routes.push(route);
  }

  setDailyBudget(budget: number): void {
    this.dailyBudget = budget;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([, p]) => p.isAvailable)
      .map(([name]) => name);
  }

  selectProvider(feature?: string): AIProvider {
    const available = this.getAvailableProviders();
    if (available.length === 0) {
      throw new Error("No AI providers available");
    }

    if (this.currentDayTokens > 0) {
      const dailyUsage = this.getDailyUsage();
      if (dailyUsage.totalCost >= this.dailyBudget) {
        const freeProvider = this.providers.get("ollama");
        if (freeProvider) return freeProvider;
      }
    }

    const sortedRoutes = [...this.routes]
      .filter((r) => available.includes(r.provider))
      .sort((a, b) => {
        const costScore = a.costPer1k - b.costPer1k;
        const weightScore = b.weight - a.weight;
        return costScore * 0.3 + weightScore * 0.7;
      });

    if (sortedRoutes.length > 0) {
      const selected = this.providers.get(sortedRoutes[0].provider);
      if (selected) return selected;
    }

    return this.providers.get(available[0])!;
  }

  async complete(
    request: ChatCompletionRequest,
    feature: string = "general"
  ): Promise<ChatCompletionResponse> {
    const provider = this.selectProvider(feature);
    const response = await provider.complete(request);

    this.logUsage({
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      cost: response.usage.estimatedCost,
      timestamp: new Date(),
      feature,
    });

    return response;
  }

  async *stream(
    request: ChatCompletionRequest,
    feature: string = "general"
  ): AsyncIterable<ChatCompletionStreamChunk> {
    const provider = this.selectProvider(feature);
    yield* provider.stream(request);
  }

  async embed(texts: string[], feature: string = "embedding"): Promise<number[][]> {
    const provider = this.selectProvider(feature);
    return provider.embed(texts);
  }

  private logUsage(record: UsageRecord): void {
    this.usageLog.push(record);
    this.currentDayTokens += record.promptTokens + record.completionTokens;
  }

  getDailyUsage(): DailyUsage {
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = this.usageLog.filter(
      (r) => r.timestamp.toISOString().split("T")[0] === today
    );

    const byProvider: Record<string, { tokens: number; cost: number }> = {};
    let totalTokens = 0;
    let totalCost = 0;

    for (const record of todayRecords) {
      if (!byProvider[record.provider]) {
        byProvider[record.provider] = { tokens: 0, cost: 0 };
      }
      const tokens = record.promptTokens + record.completionTokens;
      byProvider[record.provider].tokens += tokens;
      byProvider[record.provider].cost += record.cost;
      totalTokens += tokens;
      totalCost += record.cost;
    }

    return { date: today, totalTokens, totalCost, byProvider };
  }

  getUsageHistory(feature?: string): UsageRecord[] {
    if (feature) {
      return this.usageLog.filter((r) => r.feature === feature);
    }
    return [...this.usageLog];
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const checks = Array.from(this.providers.entries()).map(
      async ([name, provider]) => {
        results[name] = await provider.validate();
      }
    );
    await Promise.all(checks);
    return results;
  }

  getModelPricing(model: string): { input: number; output: number } | undefined {
    return MODEL_PRICING[model];
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createProviderManager(
  env: Record<string, string | undefined>
): MultiProviderManager {
  const configs: ProviderConfig[] = [];

  if (env.OPENAI_API_KEY) {
    configs.push({
      provider: "openai",
      model: env.OPENAI_MODEL || "gpt-4o",
      apiKey: env.OPENAI_API_KEY,
      temperature: 0.7,
      maxTokens: 4096,
      retries: 3,
      retryDelay: 1000,
      timeout: 60000,
    });
  }

  if (env.ANTHROPIC_API_KEY) {
    configs.push({
      provider: "anthropic",
      model: env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      apiKey: env.ANTHROPIC_API_KEY,
      temperature: 0.7,
      maxTokens: 4096,
      retries: 3,
      retryDelay: 1000,
      timeout: 60000,
    });
  }

  if (env.GOOGLE_AI_KEY) {
    configs.push({
      provider: "google",
      model: env.GOOGLE_MODEL || "gemini-1.5-pro",
      apiKey: env.GOOGLE_AI_KEY,
      temperature: 0.7,
      maxTokens: 4096,
      retries: 3,
      retryDelay: 1000,
      timeout: 60000,
    });
  }

  configs.push({
    provider: "ollama",
    model: env.OLLAMA_MODEL || "llama3.1",
    apiKey: "local",
    baseUrl: env.OLLAMA_URL || "http://localhost:11434",
    temperature: 0.7,
    maxTokens: 4096,
    retries: 1,
    retryDelay: 500,
    timeout: 120000,
  });

  return new MultiProviderManager(configs);
}
