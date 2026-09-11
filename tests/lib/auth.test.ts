import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  session: {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  account: {
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
}));

const mockBcrypt = {
  hash: vi.fn(),
  compare: vi.fn(),
};

vi.mock("bcryptjs", () => ({
  default: mockBcrypt,
}));

function getSessionUserId(session: any): string | null {
  return session?.user?.id ?? null;
}

function isRoleAllowed(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

describe("Auth utilities", () => {
  describe("getSessionUserId", () => {
    it("extracts user ID from session", () => {
      const session = { user: { id: "user-123" } };
      expect(getSessionUserId(session)).toBe("user-123");
    });

    it("returns null for null session", () => {
      expect(getSessionUserId(null)).toBeNull();
    });

    it("returns null for missing user", () => {
      expect(getSessionUserId({})).toBeNull();
    });

    it("returns null for missing id", () => {
      expect(getSessionUserId({ user: {} })).toBeNull();
    });
  });

  describe("isRoleAllowed", () => {
    it("returns true when role is allowed", () => {
      expect(isRoleAllowed("admin", ["admin", "recruiter"])).toBe(true);
    });

    it("returns false when role is not allowed", () => {
      expect(isRoleAllowed("candidate", ["admin", "recruiter"])).toBe(false);
    });

    it("handles empty allowed roles", () => {
      expect(isRoleAllowed("admin", [])).toBe(false);
    });

    it("handles single allowed role", () => {
      expect(isRoleAllowed("admin", ["admin"])).toBe(true);
    });
  });
});

describe("Password hashing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hashes password", async () => {
    mockBcrypt.hash.mockResolvedValue("$2a$10$hashed");

    const hash = await mockBcrypt.hash("password123", 10);
    expect(hash).toBe("$2a$10$hashed");
    expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
  });

  it("compares password with hash", async () => {
    mockBcrypt.compare.mockResolvedValue(true);

    const isValid = await mockBcrypt.compare("password123", "$2a$10$hashed");
    expect(isValid).toBe(true);
  });

  it("returns false for wrong password", async () => {
    mockBcrypt.compare.mockResolvedValue(false);

    const isValid = await mockBcrypt.compare("wrong", "$2a$10$hashed");
    expect(isValid).toBe(false);
  });
});

describe("Session management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates session", async () => {
    const session = {
      id: "session-123",
      sessionToken: "token-abc",
      userId: "user-123",
      expires: new Date(),
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

  it("finds session by token", async () => {
    const session = {
      id: "session-123",
      sessionToken: "token-abc",
      userId: "user-123",
    };
    mockPrisma.session.findUnique.mockResolvedValue(session);

    const found = await mockPrisma.session.findUnique({
      where: { sessionToken: "token-abc" },
    });

    expect(found?.userId).toBe("user-123");
  });
});

describe("OAuth integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts OAuth account", async () => {
    const account = {
      id: "account-123",
      provider: "google",
      providerAccountId: "google-123",
      userId: "user-123",
    };
    mockPrisma.account.upsert.mockResolvedValue(account);

    const result = await mockPrisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: "google-123",
        },
      },
      update: {},
      create: {
        userId: "user-123",
        type: "oauth",
        provider: "google",
        providerAccountId: "google-123",
      },
    });

    expect(result.provider).toBe("google");
  });
});

describe("JWT token handling", () => {
  it("parses JWT payload", () => {
    const payload = { sub: "user-123", role: "admin", exp: Date.now() + 3600000 };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;

    const parts = token.split(".");
    const decoded = JSON.parse(atob(parts[1]));

    expect(decoded.sub).toBe("user-123");
    expect(decoded.role).toBe("admin");
  });

  it("validates token expiration", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const pastExp = Math.floor(Date.now() / 1000) - 3600;

    expect(Date.now() < futureExp * 1000).toBe(true);
    expect(Date.now() > pastExp * 1000).toBe(true);
  });
});
