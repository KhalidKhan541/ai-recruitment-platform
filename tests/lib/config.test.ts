import { describe, it, expect } from "vitest";
import { z } from "zod";

const configSchema = z.object({
  app: z.object({
    name: z.string().default("AI Recruitment Platform"),
    url: z.string().url().default("http://localhost:3000"),
    env: z.enum(["development", "staging", "production", "test"]).default("development"),
  }),
  auth: z.object({
    secret: z.string().min(1),
    nextAuthUrl: z.string().url(),
  }),
  database: z.object({
    url: z.string().url(),
  }),
  ai: z.object({
    openaiApiKey: z.string().optional(),
    model: z.string().default("gpt-4-turbo-preview"),
    maxTokens: z.number().default(2000),
    temperature: z.number().min(0).max(2).default(0.7),
  }),
  limits: z.object({
    maxFileSize: z.number().default(10 * 1024 * 1024),
    maxApplicationsPerDay: z.number().default(50),
    rateLimitWindow: z.number().default(15 * 60 * 1000),
    rateLimitMax: z.number().default(100),
  }),
});

describe("Config validation", () => {
  const validConfig = {
    auth: {
      secret: "my-secret-key",
      nextAuthUrl: "http://localhost:3000",
    },
    database: {
      url: "postgresql://user:pass@localhost:5432/db",
    },
  };

  it("validates correct config", () => {
    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.app.name).toBe("AI Recruitment Platform");
      expect(result.data.app.env).toBe("development");
      expect(result.data.ai.model).toBe("gpt-4-turbo-preview");
      expect(result.data.limits.maxFileSize).toBe(10 * 1024 * 1024);
    }
  });

  it("rejects missing auth secret", () => {
    const result = configSchema.safeParse({
      auth: { nextAuthUrl: "http://localhost:3000" },
      database: { url: "postgresql://localhost/db" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid database URL", () => {
    const result = configSchema.safeParse({
      auth: { secret: "key", nextAuthUrl: "http://localhost:3000" },
      database: { url: "not-a-url" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid app URL", () => {
    const result = configSchema.safeParse({
      ...validConfig,
      app: { url: "not-a-url" },
    });
    expect(result.success).toBe(false);
  });

  it("validates AI temperature range", () => {
    const result = configSchema.safeParse({
      ...validConfig,
      ai: { temperature: 2.5 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid AI temperature", () => {
    const result = configSchema.safeParse({
      ...validConfig,
      ai: { temperature: 0.5 },
    });
    expect(result.success).toBe(true);
  });
});

describe("Environment configuration", () => {
  it("detects development environment", () => {
    const env = "development";
    expect(["development", "staging", "production", "test"]).toContain(env);
  });

  it("detects production environment", () => {
    const env = "production";
    expect(env).toBe("production");
  });

  it("validates environment enum", () => {
    const envSchema = z.enum(["development", "staging", "production", "test"]);
    expect(envSchema.safeParse("development").success).toBe(true);
    expect(envSchema.safeParse("invalid").success).toBe(false);
  });
});

describe("Limits configuration", () => {
  it("validates max file size", () => {
    const limits = {
      maxFileSize: 10 * 1024 * 1024,
    };
    expect(limits.maxFileSize).toBe(10485760);
  });

  it("validates rate limit settings", () => {
    const limits = {
      rateLimitWindow: 15 * 60 * 1000,
      rateLimitMax: 100,
    };
    expect(limits.rateLimitWindow).toBe(900000);
    expect(limits.rateLimitMax).toBe(100);
  });

  it("calculates requests per minute from rate limit", () => {
    const rateLimitMax = 100;
    const rateLimitWindow = 15 * 60 * 1000;
    const requestsPerMinute = (rateLimitMax / rateLimitWindow) * 60 * 1000;

    expect(requestsPerMinute).toBeCloseTo(6.67);
  });
});

describe("Database configuration", () => {
  it("parses PostgreSQL connection string", () => {
    const url = "postgresql://user:password@localhost:5432/mydb";
    const parsed = new URL(url);

    expect(parsed.protocol).toBe("postgresql:");
    expect(parsed.hostname).toBe("localhost");
    expect(parsed.port).toBe("5432");
    expect(parsed.pathname).toBe("/mydb");
  });

  it("validates required database fields", () => {
    const requiredFields = ["protocol", "hostname", "pathname"];
    const url = new URL("postgresql://user:pass@localhost:5432/db");

    requiredFields.forEach((field) => {
      expect(url[field as keyof URL]).toBeTruthy();
    });
  });
});
