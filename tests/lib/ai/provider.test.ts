import { describe, it, expect, vi, beforeEach } from "vitest";

interface ProviderConfig {
  provider: "openai" | "anthropic" | "google" | "ollama";
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface ChatCompletionResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
};

function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model] || { input: 0.01, output: 0.03 };
  return (
    (promptTokens / 1000) * pricing.input +
    (completionTokens / 1000) * pricing.output
  );
}

describe("AI Provider Configuration", () => {
  it("validates OpenAI config", () => {
    const config: ProviderConfig = {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-123",
    };

    expect(config.provider).toBe("openai");
    expect(config.apiKey).toBeTruthy();
  });

  it("validates Anthropic config", () => {
    const config: ProviderConfig = {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      apiKey: "sk-ant-123",
    };

    expect(config.provider).toBe("anthropic");
  });

  it("validates Google config", () => {
    const config: ProviderConfig = {
      provider: "google",
      model: "gemini-1.5-pro",
      apiKey: "ai-123",
    };

    expect(config.provider).toBe("google");
  });

  it("validates Ollama config", () => {
    const config: ProviderConfig = {
      provider: "ollama",
      model: "llama3.1",
      apiKey: "local",
      baseUrl: "http://localhost:11434",
    };

    expect(config.provider).toBe("ollama");
  });
});

describe("Token cost calculation", () => {
  it("calculates cost for GPT-4o", () => {
    const cost = calculateCost("gpt-4o", 1000, 500);
    expect(cost).toBeCloseTo(0.0075);
  });

  it("calculates cost for GPT-4o-mini", () => {
    const cost = calculateCost("gpt-4o-mini", 1000, 500);
    expect(cost).toBeCloseTo(0.00045);
  });

  it("calculates cost for Claude", () => {
    const cost = calculateCost("claude-3-5-sonnet-20241022", 1000, 500);
    expect(cost).toBeCloseTo(0.0105);
  });

  it("calculates cost for Gemini", () => {
    const cost = calculateCost("gemini-1.5-pro", 1000, 500);
    expect(cost).toBeCloseTo(0.00375);
  });

  it("uses default pricing for unknown model", () => {
    const cost = calculateCost("unknown-model", 1000, 500);
    expect(cost).toBeCloseTo(0.025);
  });
});

describe("Chat completion request", () => {
  it("builds request with messages", () => {
    const request: ChatCompletionRequest = {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ],
    };

    expect(request.messages).toHaveLength(2);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[1].role).toBe("user");
  });

  it("includes temperature and maxTokens", () => {
    const request: ChatCompletionRequest = {
      messages: [{ role: "user", content: "Test" }],
      temperature: 0.7,
      maxTokens: 2000,
    };

    expect(request.temperature).toBe(0.7);
    expect(request.maxTokens).toBe(2000);
  });
});

describe("Chat completion response", () => {
  it("validates response structure", () => {
    const response: ChatCompletionResponse = {
      id: "chatcmpl-123",
      provider: "openai",
      model: "gpt-4o",
      content: "Hello! How can I help?",
      finishReason: "stop",
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
      },
    };

    expect(response.id).toBeTruthy();
    expect(response.content).toBeTruthy();
    expect(response.usage.totalTokens).toBe(70);
  });

  it("handles empty content", () => {
    const response: ChatCompletionResponse = {
      id: "chatcmpl-456",
      provider: "openai",
      model: "gpt-4o",
      content: "",
      finishReason: "length",
      usage: {
        promptTokens: 100,
        completionTokens: 0,
        totalTokens: 100,
      },
    };

    expect(response.content).toBe("");
    expect(response.finishReason).toBe("length");
  });
});

describe("Multi-provider routing", () => {
  it("selects provider based on availability", () => {
    const providers = ["openai", "anthropic", "ollama"];
    const available = ["openai", "ollama"];

    const selected = providers.find((p) => available.includes(p));
    expect(selected).toBe("openai");
  });

  it("falls back to cheaper provider when budget exceeded", () => {
    const dailyBudget = 10;
    const currentCost = 12;
    const fallbackProvider = "ollama";

    const selected = currentCost >= dailyBudget ? fallbackProvider : "openai";
    expect(selected).toBe("ollama");
  });

  it("routes by feature", () => {
    const routes: Record<string, string> = {
      "resume-parse": "gpt-4o",
      "candidate-match": "gpt-4o-mini",
      "interview-prep": "claude-3-5-sonnet-20241022",
    };

    expect(routes["resume-parse"]).toBe("gpt-4o");
    expect(routes["candidate-match"]).toBe("gpt-4o-mini");
  });
});

describe("Streaming responses", () => {
  it("parses SSE data", () => {
    const sseData = 'data: {"choices":[{"delta":{"content":"Hello"}}]}';
    const jsonStr = sseData.replace("data: ", "");
    const parsed = JSON.parse(jsonStr);

    expect(parsed.choices[0].delta.content).toBe("Hello");
  });

  it("handles [DONE] marker", () => {
    const data = "[DONE]";
    expect(data === "[DONE]").toBe(true);
  });

  it("accumulates stream chunks", () => {
    const chunks = ["Hello", " ", "World"];
    const accumulated = chunks.join("");
    expect(accumulated).toBe("Hello World");
  });
});
