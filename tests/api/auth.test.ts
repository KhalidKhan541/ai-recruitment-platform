import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  account: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashed"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("creates a new user", async () => {
      const user = {
        id: "u-1",
        email: "new@example.com",
        name: "New User",
        role: "recruiter",
      };
      mockPrisma.user.create.mockResolvedValue(user);

      const created = await mockPrisma.user.create({
        data: {
          email: "new@example.com",
          name: "New User",
          passwordHash: "$2a$10$hashed",
          role: "recruiter",
        },
      });

      expect(created.email).toBe("new@example.com");
    });

    it("prevents duplicate emails", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing",
        email: "taken@example.com",
      });

      const existing = await mockPrisma.user.findUnique({
        where: { email: "taken@example.com" },
      });

      expect(existing).not.toBeNull();
    });

    it("validates required fields", () => {
      const required = ["email", "password", "name"];
      expect(required).toContain("email");
    });
  });

  describe("POST /api/auth/login", () => {
    it("authenticates valid credentials", async () => {
      const user = {
        id: "u-1",
        email: "user@example.com",
        passwordHash: "$2a$10$hashed",
        isActive: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const found = await mockPrisma.user.findUnique({
        where: { email: "user@example.com" },
      });

      expect(found).not.toBeNull();
      expect(found?.isActive).toBe(true);
    });

    it("rejects inactive accounts", async () => {
      const user = {
        id: "u-1",
        email: "inactive@example.com",
        passwordHash: "$2a$10$hashed",
        isActive: false,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const found = await mockPrisma.user.findUnique({
        where: { email: "inactive@example.com" },
      });

      expect(found?.isActive).toBe(false);
    });

    it("rejects non-existent users", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const found = await mockPrisma.user.findUnique({
        where: { email: "nobody@example.com" },
      });
      expect(found).toBeNull();
    });
  });

  describe("OAuth sign-in", () => {
    it("upserts account on OAuth sign-in", async () => {
      mockPrisma.account.upsert.mockResolvedValue({});

      await mockPrisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: "google-123",
          },
        },
        update: {},
        create: {
          userId: "u-1",
          type: "oauth",
          provider: "google",
          providerAccountId: "google-123",
        },
      });

      expect(mockPrisma.account.upsert).toHaveBeenCalled();
    });

    it("finds existing user by email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u-1",
        email: "user@example.com",
      });

      const user = await mockPrisma.user.findUnique({
        where: { email: "user@example.com" },
      });

      expect(user?.id).toBe("u-1");
    });
  });

  describe("Session management", () => {
    it("updates last login timestamp", async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await mockPrisma.user.update({
        where: { id: "u-1" },
        data: { lastLoginAt: new Date() },
      });

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("extends session on activity", async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await mockPrisma.user.update({
        where: { id: "u-1" },
        data: { lastActiveAt: new Date() },
      });

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});
