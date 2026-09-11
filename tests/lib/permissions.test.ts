import { describe, it, expect } from "vitest";

enum Permission {
  USER_CREATE = "USER_CREATE",
  USER_READ = "USER_READ",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",
  JOB_CREATE = "JOB_CREATE",
  JOB_READ = "JOB_READ",
  JOB_UPDATE = "JOB_UPDATE",
  JOB_DELETE = "JOB_DELETE",
  APPLICATION_CREATE = "APPLICATION_CREATE",
  APPLICATION_READ = "APPLICATION_READ",
  INTERVIEW_CREATE = "INTERVIEW_CREATE",
  INTERVIEW_READ = "INTERVIEW_READ",
  OFFER_CREATE = "OFFER_CREATE",
  OFFER_READ = "OFFER_READ",
  CANDIDATE_READ = "CANDIDATE_READ",
  CANDIDATE_UPDATE = "CANDIDATE_UPDATE",
  ANALYTICS_VIEW = "ANALYTICS_VIEW",
  REPORT_CREATE = "REPORT_CREATE",
  SYSTEM_SETTINGS = "SYSTEM_SETTINGS",
}

const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.APPLICATION_READ,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.OFFER_CREATE,
    Permission.CANDIDATE_READ,
    Permission.ANALYTICS_VIEW,
    Permission.REPORT_CREATE,
  ],
  RECRUITER: [
    Permission.USER_READ,
    Permission.JOB_CREATE,
    Permission.JOB_READ,
    Permission.JOB_UPDATE,
    Permission.APPLICATION_READ,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.OFFER_CREATE,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_UPDATE,
  ],
  HIRING_MANAGER: [
    Permission.USER_READ,
    Permission.JOB_READ,
    Permission.APPLICATION_READ,
    Permission.INTERVIEW_READ,
    Permission.OFFER_READ,
    Permission.CANDIDATE_READ,
    Permission.ANALYTICS_VIEW,
  ],
  CANDIDATE: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.JOB_READ,
    Permission.APPLICATION_CREATE,
    Permission.APPLICATION_READ,
  ],
};

function hasPermission(role: string, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

function getRolePermissions(role: string): Permission[] {
  return rolePermissions[role] ?? [];
}

describe("Permission system", () => {
  describe("hasPermission", () => {
    it("returns true when role has permission", () => {
      expect(hasPermission("ADMIN", Permission.USER_CREATE)).toBe(true);
    });

    it("returns false when role lacks permission", () => {
      expect(hasPermission("CANDIDATE", Permission.USER_CREATE)).toBe(false);
    });

    it("returns false for unknown role", () => {
      expect(hasPermission("UNKNOWN", Permission.USER_READ)).toBe(false);
    });

    it("SUPER_ADMIN has all permissions", () => {
      const allPermissions = Object.values(Permission);
      allPermissions.forEach((p) => {
        expect(hasPermission("SUPER_ADMIN", p)).toBe(true);
      });
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true when role has any of the permissions", () => {
      expect(
        hasAnyPermission("ADMIN", [Permission.USER_CREATE, Permission.SYSTEM_SETTINGS])
      ).toBe(true);
    });

    it("returns false when role has none of the permissions", () => {
      expect(
        hasAnyPermission("CANDIDATE", [Permission.USER_CREATE, Permission.JOB_DELETE])
      ).toBe(false);
    });

    it("handles empty permissions array", () => {
      expect(hasAnyPermission("ADMIN", [])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true when role has all permissions", () => {
      expect(
        hasAllPermissions("ADMIN", [Permission.USER_READ, Permission.JOB_READ])
      ).toBe(true);
    });

    it("returns false when role lacks any permission", () => {
      expect(
        hasAllPermissions("ADMIN", [Permission.USER_READ, Permission.SYSTEM_SETTINGS])
      ).toBe(false);
    });

    it("handles empty permissions array", () => {
      expect(hasAllPermissions("ADMIN", [])).toBe(true);
    });
  });

  describe("getRolePermissions", () => {
    it("returns permissions for valid role", () => {
      const perms = getRolePermissions("ADMIN");
      expect(perms).toContain(Permission.USER_CREATE);
      expect(perms).toContain(Permission.JOB_READ);
    });

    it("returns empty array for unknown role", () => {
      expect(getRolePermissions("UNKNOWN")).toEqual([]);
    });

    it("SUPER_ADMIN has all permissions", () => {
      const perms = getRolePermissions("SUPER_ADMIN");
      expect(perms.length).toBe(Object.values(Permission).length);
    });
  });
});

describe("Role hierarchy", () => {
  const roleHierarchy: Record<string, number> = {
    CANDIDATE: 1,
    HIRING_MANAGER: 2,
    RECRUITER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5,
  };

  it("SUPER_ADMIN has highest level", () => {
    expect(roleHierarchy["SUPER_ADMIN"]).toBe(5);
  });

  it("CANDIDATE has lowest level", () => {
    expect(roleHierarchy["CANDIDATE"]).toBe(1);
  });

  it("ADMIN outranks RECRUITER", () => {
    expect(roleHierarchy["ADMIN"]).toBeGreaterThan(roleHierarchy["RECRUITER"]);
  });

  it("checks minimum role requirement", () => {
    const hasMinRole = (userRole: string, minRole: string): boolean => {
      return (roleHierarchy[userRole] || 0) >= (roleHierarchy[minRole] || 0);
    };

    expect(hasMinRole("ADMIN", "RECRUITER")).toBe(true);
    expect(hasMinRole("CANDIDATE", "ADMIN")).toBe(false);
  });
});
