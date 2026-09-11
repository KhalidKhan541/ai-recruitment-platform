import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

function createAuthStore(): AuthState {
  let user: User | null = null;
  let token: string | null = null;

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json();
    user = data.user;
    token = data.token;
  };

  const logout = () => {
    user = null;
    token = null;
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    user = { ...user, ...data };
  };

  const getState = () => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
  });

  return {
    get user() { return getState().user; },
    get token() { return getState().token; },
    get isAuthenticated() { return getState().isAuthenticated; },
    login,
    logout,
    updateUser,
  };
}

describe("useAuthStore", () => {
  let store: AuthState;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    store = createAuthStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with no user", () => {
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it("logs in successfully", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: "1", name: "John", email: "john@test.com", role: "admin" },
        token: "jwt-token-123",
      }),
    });

    await store.login("john@test.com", "password123");

    expect(store.user?.name).toBe("John");
    expect(store.token).toBe("jwt-token-123");
    expect(store.isAuthenticated).toBe(true);
  });

  it("throws on login failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    await expect(store.login("wrong@test.com", "wrong")).rejects.toThrow("Login failed");
    expect(store.isAuthenticated).toBe(false);
  });

  it("logs out and clears state", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: "1", name: "John", email: "john@test.com", role: "admin" },
        token: "jwt-token-123",
      }),
    });

    await store.login("john@test.com", "password123");
    expect(store.isAuthenticated).toBe(true);

    store.logout();
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it("updates user data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: "1", name: "John", email: "john@test.com", role: "admin" },
        token: "jwt-token-123",
      }),
    });

    await store.login("john@test.com", "password123");
    store.updateUser({ name: "John Doe" });

    expect(store.user?.name).toBe("John Doe");
  });

  it("does not update when no user is logged in", () => {
    store.updateUser({ name: "Test" });
    expect(store.user).toBeNull();
  });
});

describe("Auth token validation", () => {
  it("validates JWT token format", () => {
    const isValidJWT = (token: string): boolean => {
      const parts = token.split(".");
      return parts.length === 3;
    };

    expect(isValidJWT("header.payload.signature")).toBe(true);
    expect(isValidJWT("invalid-token")).toBe(false);
    expect(isValidJWT("a.b")).toBe(false);
  });

  it("checks token expiration", () => {
    const isTokenExpired = (exp: number): boolean => {
      return Date.now() >= exp * 1000;
    };

    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const pastExp = Math.floor(Date.now() / 1000) - 3600;

    expect(isTokenExpired(futureExp)).toBe(false);
    expect(isTokenExpired(pastExp)).toBe(true);
  });
});

describe("Role-based access", () => {
  it("checks if user has required role", () => {
    const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
      return requiredRoles.includes(userRole);
    };

    expect(hasRole("admin", ["admin", "recruiter"])).toBe(true);
    expect(hasRole("candidate", ["admin", "recruiter"])).toBe(false);
    expect(hasRole("recruiter", ["recruiter"])).toBe(true);
  });

  it("checks role hierarchy", () => {
    const roleHierarchy: Record<string, number> = {
      CANDIDATE: 1,
      HIRING_MANAGER: 2,
      RECRUITER: 3,
      ADMIN: 4,
      SUPER_ADMIN: 5,
    };

    const hasMinRole = (userRole: string, minRole: string): boolean => {
      return (roleHierarchy[userRole] || 0) >= (roleHierarchy[minRole] || 0);
    };

    expect(hasMinRole("ADMIN", "RECRUITER")).toBe(true);
    expect(hasMinRole("CANDIDATE", "ADMIN")).toBe(false);
    expect(hasMinRole("SUPER_ADMIN", "ADMIN")).toBe(true);
  });
});
