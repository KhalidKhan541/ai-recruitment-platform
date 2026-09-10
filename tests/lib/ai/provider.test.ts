import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ProviderConfigSchema,
  MultiProviderManager,
  createProviderManager,
} from "@/lib/ai/provider";
import type { ProviderConfig, ChatCompletionRequest } from "@/lib/ai/provider";

describe("ProviderConfigSchema", () => {
  it("validates correct config", () => {
    const config = {
      provider: "openai" as const,
      model: "gpt-4o",
      apiKey: "sk-test",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 60000,
      retries: 3,
      retryDelay: 1000,
    };
    const result = ProviderConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const config = {
      provider: "invalid",
      model: "test",
      apiKey: "key",
    };
    const result = ProviderConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects empty model", () => {
    const config = {
      provider: "openai",
      model: "",
      apiKey: "key",
    };
    const result = ProviderConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects empty apiKey", () => {
    const config = {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "",
    };
    const result = ProviderConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("applies default values", () => {
    const config = {
      provider: "openai" as const,
      model: "gpt-4o",
      apiKey: "sk-test",
    };
    const result = ProviderConfigSchema.parse(config);
    expect(result.temperature).toBe(0.7);
    expect(result.maxTokens).toBe(4096);
    expect(result.retries).toBe(3);
  });

  it("validates temperature range", () => {
    const config = {
      provider: "openai" as const,
      model: "gpt-4o",
      apiKey: "sk-test",
      temperature: 3,
    };
    const result = ProviderConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("validates all providers", () => {
    const providers = ["openai", "anthropic", "google", "azure", "ollama"];
    for (const provider of providers) {
      const config = {
        provider,
        model: "test-model",
        apiKey: "test-key",
      };
      const result = ProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    }
  });
});

describe("MultiProviderManager", () => {
  const mockConfigs: ProviderConfig[] = [
    {
      provider: "ollama",
      model: "llama3.1",
      apiKey: "local",
      baseUrl: "http://localhost:11434",
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 60000,
      retries: 1,
      retryDelay: 1000,
    },
  ];

  it("creates manager with configs", () => {
    const manager = new MultiProviderManager(mockConfigs);
    expect(manager).toBeDefined();
  });

  it("lists available providers", () => {
    const manager = new MultiProviderManager(mockConfigs);
    const available = manager.getAvailableProviders();
    expect(available).toContain("ollama");
  });

  it("adds routes", () => {
    const manager = new MultiProviderManager(mockConfigs);
    manager.addRoute({
      provider: "ollama",
      model: "llama3.1",
      weight: 1,
      maxTokensPerDay: 100000,
      costPer1k: 0,
    });
    expect(manager.getAvailableProviders()).toContain("ollama");
  });

  it("sets daily budget", () => {
    const manager = new MultiProviderManager(mockConfigs);
    manager.setDailyBudget(50);
    const usage = manager.getDailyUsage();
    expect(usage.totalCost).toBe(0);
  });

  it("gets model pricing", () => {
    const manager = new MultiProviderManager(mockConfigs);
    const pricing = manager.getModelPricing("gpt-4o");
    expect(pricing).toBeDefined();
    expect(pricing?.input).toBe(0.0025);
  });

  it("returns undefined for unknown model pricing", () => {
    const manager = new MultiProviderManager(mockConfigs);
    expect(manager.getModelPricing("unknown-model")).toBeUndefined();
  });

  it("tracks usage history", () => {
    const manager = new MultiProviderManager(mockConfigs);
    const history = manager.getUsageHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it("filters usage by feature", () => {
    const manager = new MultiProviderManager(mockConfigs);
    const history = manager.getUsageHistory("screening");
    expect(Array.isArray(history)).toBe(true);
  });

  it("health checks all providers", async () => {
    const manager = new MultiProviderManager(mockConfigs);
    const results = await manager.healthCheck();
    expect(typeof results).toBe("object");
    expect("ollama" in results).toBe(true);
  });
});

describe("createProviderManager factory", () => {
  it("creates manager from env vars", () => {
    const env = {
      OLLAMA_MODEL: "llama3.1",
      OLLAMA_URL: "http://localhost:11434",
    };
    const manager = createProviderManager(env);
    expect(manager).toBeDefined();
  });

  it("includes ollama by default", () => {
    const manager = createProviderManager({});
    const available = manager.getAvailableProviders();
    expect(available).toContain("ollama");
  });

  it("adds openai when key provided", () => {
    const env = { OPENAI_API_KEY: "sk-test" };
    const manager = createProviderManager(env);
    const available = manager.getAvailableProviders();
    expect(available).toContain("openai");
  });

  it("adds anthropic when key provided", () => {
    const env = { ANTHROPIC_API_KEY: "sk-ant-test" };
    const manager = createProviderManager(env);
    const available = manager.getAvailableProviders();
    expect(available).toContain("anthropic");
  });

  it("adds google when key provided", () => {
    const env = { GOOGLE_AI_KEY: "google-test" };
    const manager = createProviderManager(env);
    const available = manager.getAvailableProviders();
    expect(available).toContain("google");
  });

  it("uses custom model names from env", () => {
    const env = {
      OPENAI_API_KEY: "sk-test",
      OPENAI_MODEL: "gpt-4-turbo",
    };
    const manager = createProviderManager(env);
    expect(manager).toBeDefined();
  });
});
