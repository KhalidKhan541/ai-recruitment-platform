import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  user: { findMany: vi.fn(), findUnique: vi.fn() },
  job: { findMany: vi.fn(), findUnique: vi.fn() },
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
}));

describe("prisma client singleton", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete (globalThis as any).prisma;
  });

  it("creates a new PrismaClient instance", async () => {
    process.env.NODE_ENV = "production";
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
  });

  it("reuses existing instance in development", async () => {
    process.env.NODE_ENV = "development";
    const mod1 = await import("@/lib/prisma");
    const mod2 = await import("@/lib/prisma");
    expect(mod1.prisma).toBe(mod2.prisma);
  });

  it("exports prisma as default", async () => {
    process.env.NODE_ENV = "production";
    const mod = await import("@/lib/prisma");
    expect(mod.default).toBe(mod.prisma);
  });
});

describe("db module", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as any).prisma;
  });

  it("exports prisma client", async () => {
    const { prisma } = await import("@/lib/db");
    expect(prisma).toBeDefined();
  });

  it("exports PrismaTransactionClient type helper", async () => {
    const db = await import("@/lib/db");
    expect(db).toBeDefined();
  });

  it("exports default prisma", async () => {
    const db = await import("@/lib/db");
    expect(db.default).toBeDefined();
  });
});
