import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionUserId, isRoleAllowed } from "@/lib/auth";

vi.mock("@/lib/db", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    account: {
      upsert: vi.fn(),
    },
  },
}));

describe("getSessionUserId", () => {
  it("returns user id from session", () => {
    const session = { user: { id: "user-123" } };
    expect(getSessionUserId(session)).toBe("user-123");
  });

  it("returns null for undefined session", () => {
    expect(getSessionUserId(undefined)).toBeNull();
  });

  it("returns null for null session", () => {
    expect(getSessionUserId(null)).toBeNull();
  });

  it("returns null when user has no id", () => {
    expect(getSessionUserId({ user: {} })).toBeNull();
  });

  it("returns null for empty session", () => {
    expect(getSessionUserId({})).toBeNull();
  });
});

describe("isRoleAllowed", () => {
  it("allows matching role", () => {
    expect(isRoleAllowed("admin", ["admin", "recruiter"])).toBe(true);
  });

  it("rejects non-matching role", () => {
    expect(isRoleAllowed("viewer", ["admin", "recruiter"])).toBe(false);
  });

  it("allows single role match", () => {
    expect(isRoleAllowed("admin", ["admin"])).toBe(true);
  });

  it("rejects empty allowed roles", () => {
    expect(isRoleAllowed("admin", [])).toBe(false);
  });

  it("handles role case sensitivity", () => {
    expect(isRoleAllowed("Admin", ["admin"])).toBe(false);
  });
});

describe("authOptions configuration", () => {
  it("exports authOptions", async () => {
    const { authOptions } = await import("@/lib/auth");
    expect(authOptions).toBeDefined();
    expect(authOptions.session).toBeDefined();
    expect(authOptions.providers).toBeDefined();
  });

  it("has JWT session strategy", async () => {
    const { authOptions } = await import("@/lib/auth");
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("has custom pages configured", async () => {
    const { authOptions } = await import("@/lib/auth");
    expect(authOptions.pages?.signIn).toBe("/auth/login");
    expect(authOptions.pages?.signOut).toBe("/auth/logout");
  });

  it("has multiple providers", async () => {
    const { authOptions } = await import("@/lib/auth");
    expect(authOptions.providers?.length).toBeGreaterThanOrEqual(3);
  });
});
