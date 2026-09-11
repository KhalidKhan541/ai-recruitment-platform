import { describe, it, expect, vi } from "vitest";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date, formatStr: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function calculateMatchScore(
  candidateSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[] = []
): number {
  if (requiredSkills.length === 0) return 100;

  const requiredMatches = requiredSkills.filter((s) =>
    candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  ).length;

  const preferredMatches = preferredSkills.filter((s) =>
    candidateSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  ).length;

  const requiredScore = (requiredMatches / requiredSkills.length) * 70;
  const preferredScore =
    preferredSkills.length > 0
      ? (preferredMatches / preferredSkills.length) * 30
      : 30;

  return Math.round(requiredScore + preferredScore);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

describe("cn utility", () => {
  it("joins class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("filters out falsy values", () => {
    expect(cn("class1", null, undefined, false, "class2")).toBe("class1 class2");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });
});

describe("generateSlug", () => {
  it("converts text to slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello! @World#")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(generateSlug("Hello   World")).toBe("hello-world");
  });

  it("removes leading/trailing hyphens", () => {
    expect(generateSlug("-hello-world-")).toBe("hello-world");
  });

  it("handles single word", () => {
    expect(generateSlug("hello")).toBe("hello");
  });
});

describe("formatCurrency", () => {
  it("formats USD currency", () => {
    expect(formatCurrency(150000)).toBe("$150,000");
  });

  it("formats with different currency", () => {
    expect(formatCurrency(100000, "EUR")).toContain("100,000");
  });

  it("formats zero amount", () => {
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("formatDate", () => {
  it("formats date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats Date object", () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("does not truncate short text", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("handles exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("lowercases rest of string", () => {
    expect(capitalize("HELLO")).toBe("Hello");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });
});

describe("initials", () => {
  it("returns first letters of name", () => {
    expect(initials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(initials("John")).toBe("J");
  });

  it("limits to 2 characters", () => {
    expect(initials("John Michael Doe")).toBe("JM");
  });
});

describe("calculateMatchScore", () => {
  it("returns 100 when no required skills", () => {
    expect(calculateMatchScore(["TypeScript"], [])).toBe(100);
  });

  it("calculates score with all required skills matched", () => {
    const score = calculateMatchScore(
      ["TypeScript", "React"],
      ["TypeScript", "React"]
    );
    expect(score).toBe(100);
  });

  it("calculates score with partial required skills", () => {
    const score = calculateMatchScore(
      ["TypeScript"],
      ["TypeScript", "React"]
    );
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });

  it("includes preferred skills in score", () => {
    const score = calculateMatchScore(
      ["TypeScript", "React", "Node.js"],
      ["TypeScript"],
      ["React", "Node.js"]
    );
    expect(score).toBe(100);
  });

  it("is case insensitive", () => {
    const score = calculateMatchScore(
      ["typescript", "react"],
      ["TypeScript", "React"]
    );
    expect(score).toBe(100);
  });
});

describe("isValidEmail", () => {
  it("validates correct email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("validates correct URL", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("rejects invalid URL", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1 GB");
  });
});
