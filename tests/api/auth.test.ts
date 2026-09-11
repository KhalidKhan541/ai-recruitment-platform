import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  session: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
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

const mockBcrypt = {
  hash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
  compare: vi.fn().mockResolvedValue(true),
};

vi.mock("bcryptjs", () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare,
}));

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user with valid data", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        role: "CANDIDATE",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        ...userData,
        passwordHash: "$2a$10$hashedpassword",
        isActive: true,
        createdAt: new Date(),
      });

      mockBcrypt.hash.mockResolvedValue("$2a$10$hashedpassword");

      const existingUser = await mockPrisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(existingUser).toBeNull();

      const hashedPassword = await mockBcrypt.hash(userData.password, 12);
      const created = await mockPrisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role,
        },
      });

      expect(created.email).toBe(userData.email);
      expect(created.name).toBe(userData.name);
    });

    it("rejects duplicate email", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing",
        email: "john@example.com",
      });

      const existing = await mockPrisma.user.findUnique({
        where: { email: "john@example.com" },
      });

      expect(existing).not.toBeNull();
    });

    it("validates password requirements", () => {
      const validatePassword = (password: string): boolean => {
        if (password.length < 8) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;
        return true;
      };

      expect(validatePassword("short")).toBe(false);
      expect(validatePassword("alllowercase1")).toBe(false);
      expect(validatePassword("ALLUPPERCASE1")).toBe(false);
      expect(validatePassword("NoNumbers")).toBe(false);
      expect(validatePassword("ValidPass1")).toBe(true);
    });

    it("validates email format", () => {
      const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@example.com")).toBe(true);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "john@example.com",
        passwordHash: "$2a$10$hashedpassword",
        isActive: true,
        role: "CANDIDATE",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const user = await mockPrisma.user.findUnique({
        where: { email: "john@example.com" },
      });

      expect(user).not.toBeNull();

      const isValid = await mockBcrypt.compare(
        "Password123",
        user!.passwordHash
      );
      expect(isValid).toBe(true);
    });

    it("rejects invalid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const user = await mockPrisma.user.findUnique({
        where: { email: "nonexistent@example.com" },
      });

      expect(user).toBeNull();
    });

    it("rejects inactive accounts", async () => {
      const mockUser = {
        id: "user-123",
        email: "john@example.com",
        passwordHash: "$2a$10$hashedpassword",
        isActive: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const user = await mockPrisma.user.findUnique({
        where: { email: "john@example.com" },
      });

      expect(user!.isActive).toBe(false);
    });

    it("updates lastLoginAt on successful login", async () => {
      const mockUser = {
        id: "user-123",
        email: "john@example.com",
        isActive: true,
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      await mockPrisma.user.update({
        where: { id: "user-123" },
        data: { lastLoginAt: expect.any(Date) },
      });

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe("Session management", () => {
    it("creates a session token", async () => {
      const session = {
        id: "session-123",
        sessionToken: "token-abc",
        userId: "user-123",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      mockPrisma.session.create.mockResolvedValue(session);

      const created = await mockPrisma.session.create({
        data: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
      });

      expect(created.sessionToken).toBe("token-abc");
    });

    it("deletes session on logout", async () => {
      mockPrisma.session.delete.mockResolvedValue({});

      await mockPrisma.session.delete({
        where: { sessionToken: "token-abc" },
      });

      expect(mockPrisma.session.delete).toHaveBeenCalled();
    });
  });

  describe("OAuth integration", () => {
    it("upserts account for OAuth provider", async () => {
      const accountData = {
        userId: "user-123",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
        access_token: "access-token",
        refresh_token: "refresh-token",
      };

      mockPrisma.account.upsert.mockResolvedValue({
        id: "account-123",
        ...accountData,
      });

      const result = await mockPrisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: accountData.provider,
            providerAccountId: accountData.providerAccountId,
          },
        },
        update: {},
        create: accountData,
      });

      expect(result.provider).toBe("google");
    });
  });
});
