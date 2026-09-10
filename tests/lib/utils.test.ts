import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  generateId,
  generateSlug,
  generateToken,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  isDatePast,
  isDateFuture,
  truncate,
  capitalize,
  slugToTitle,
  initials,
  debounce,
  throttle,
  pick,
  omit,
  groupBy,
  sortBy,
  chunk,
  unique,
  isEmpty,
  calculateMatchScore,
  getInitialsColor,
  getStatusColor,
  getFileExtension,
  formatFileSize,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  extractTextFromHtml,
  highlightText,
} from "@/lib/utils";

describe("cn (className merger)", () => {
  it("merges class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).not.toContain("hidden");
    expect(result).toContain("extra");
  });

  it("deduplicates conflicting tailwind classes", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("generateId", () => {
  it("returns a UUID string", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("generateSlug", () => {
  it("converts text to slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello, World!")).toBe("hello-world");
  });

  it("handles multiple spaces and underscores", () => {
    expect(generateSlug("Hello   World_  ")).toBe("hello-world");
  });

  it("trims leading and trailing dashes", () => {
    expect(generateSlug("--hello--")).toBe("hello");
  });
});

describe("generateToken", () => {
  it("generates token of specified length", () => {
    expect(generateToken(16)).toHaveLength(16);
    expect(generateToken(64)).toHaveLength(64);
  });

  it("defaults to 32 characters", () => {
    expect(generateToken()).toHaveLength(32);
  });

  it("only contains alphanumeric characters", () => {
    const token = generateToken(100);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    const result = formatCurrency(50000);
    expect(result).toContain("50,000");
  });

  it("formats with specific currency", () => {
    const result = formatCurrency(1000, "EUR");
    expect(result).toContain("1,000");
  });
});

describe("formatNumber", () => {
  it("formats large numbers", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatPercentage", () => {
  it("formats with default decimals", () => {
    expect(formatPercentage(85.678)).toBe("85.7%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercentage(85.678, 2)).toBe("85.68%");
  });
});

describe("formatDate", () => {
  it("formats date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBeTruthy();
  });

  it("formats Date object", () => {
    const result = formatDate(new Date("2024-01-15"));
    expect(result).toBeTruthy();
  });

  it("accepts custom format", () => {
    const result = formatDate("2024-01-15", "yyyy-MM-dd");
    expect(result).toBe("2024-01-15");
  });
});

describe("isDatePast and isDateFuture", () => {
  it("detects past date", () => {
    expect(isDatePast("2020-01-01")).toBe(true);
  });

  it("detects future date", () => {
    expect(isDateFuture("2099-12-31")).toBe(true);
  });

  it("future date is not past", () => {
    expect(isDatePast("2099-12-31")).toBe(false);
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("does not truncate short text", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("lowercases rest", () => {
    expect(capitalize("hELLO")).toBe("Hello");
  });
});

describe("slugToTitle", () => {
  it("converts slug to title case", () => {
    expect(slugToTitle("hello-world")).toBe("Hello World");
  });

  it("handles single word", () => {
    expect(slugToTitle("hello")).toBe("Hello");
  });
});

describe("initials", () => {
  it("returns first letters of name", () => {
    expect(initials("John Doe")).toBe("JD");
  });

  it("limits to 2 characters", () => {
    expect(initials("John Michael Doe")).toBe("JM");
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays function execution", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("resets timer on subsequent calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);
    debounced();
    vi.advanceTimersByTime(300);
    debounced();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("limits function calls", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("allows calls after delay", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);
    throttled();
    vi.advanceTimersByTime(500);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("pick", () => {
  it("picks specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("ignores missing keys", () => {
    const obj = { a: 1 };
    expect(pick(obj, ["a", "b" as any])).toEqual({ a: 1 });
  });
});

describe("omit", () => {
  it("omits specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
  });
});

describe("groupBy", () => {
  it("groups items by key", () => {
    const items = [
      { type: "a", value: 1 },
      { type: "b", value: 2 },
      { type: "a", value: 3 },
    ];
    const grouped = groupBy(items, (i) => i.type);
    expect(grouped.a).toHaveLength(2);
    expect(grouped.b).toHaveLength(1);
  });
});

describe("sortBy", () => {
  it("sorts ascending by default", () => {
    const items = [3, 1, 2];
    expect(sortBy(items, (i) => i)).toEqual([1, 2, 3]);
  });

  it("sorts descending", () => {
    const items = [3, 1, 2];
    expect(sortBy(items, (i) => i, "desc")).toEqual([3, 2, 1]);
  });
});

describe("chunk", () => {
  it("splits array into chunks", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles empty array", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("unique", () => {
  it("removes duplicates", () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });
});

describe("isEmpty", () => {
  it("detects null/undefined", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it("detects empty string", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("  ")).toBe(true);
  });

  it("detects empty array", () => {
    expect(isEmpty([])).toBe(true);
  });

  it("detects empty object", () => {
    expect(isEmpty({})).toBe(true);
  });

  it("non-empty values return false", () => {
    expect(isEmpty("hello")).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe("calculateMatchScore", () => {
  it("returns 100 when no required skills", () => {
    expect(calculateMatchScore(["JS"], [])).toBe(100);
  });

  it("calculates score with required skills", () => {
    const score = calculateMatchScore(["JavaScript", "React"], ["JavaScript", "React"]);
    expect(score).toBe(100);
  });

  it("reduces score for missing skills", () => {
    const score = calculateMatchScore(["JavaScript"], ["JavaScript", "React"]);
    expect(score).toBeLessThan(100);
  });

  it("accounts for preferred skills", () => {
    const score = calculateMatchScore(
      ["JavaScript", "TypeScript"],
      ["JavaScript"],
      ["TypeScript"]
    );
    expect(score).toBeGreaterThan(70);
  });
});

describe("getInitialsColor", () => {
  it("returns a tailwind color class", () => {
    const color = getInitialsColor("John");
    expect(color).toMatch(/^bg-/);
  });

  it("returns consistent color for same name", () => {
    expect(getInitialsColor("John")).toBe(getInitialsColor("John"));
  });
});

describe("getStatusColor", () => {
  it("returns color for known status", () => {
    expect(getStatusColor("ACTIVE")).toContain("green");
  });

  it("returns default for unknown status", () => {
    expect(getStatusColor("UNKNOWN")).toContain("gray");
  });
});

describe("getFileExtension", () => {
  it("extracts extension", () => {
    expect(getFileExtension("resume.pdf")).toBe("pdf");
  });

  it("handles no extension", () => {
    expect(getFileExtension("README")).toBe("");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1048576)).toBe("1 MB");
  });
});

describe("isValidEmail", () => {
  it("validates correct emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@domain.co")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("test@")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("validates phone numbers", () => {
    expect(isValidPhone("+1 (555) 123-4567")).toBe(true);
    expect(isValidPhone("5551234567")).toBe(true);
  });

  it("rejects short numbers", () => {
    expect(isValidPhone("123")).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("validates URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });
});

describe("extractTextFromHtml", () => {
  it("strips HTML tags", () => {
    expect(extractTextFromHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
  });

  it("trims whitespace", () => {
    expect(extractTextFromHtml("  <div>text</div>  ")).toBe("text");
  });
});

describe("highlightText", () => {
  it("highlights matching text", () => {
    expect(highlightText("Hello World", "World")).toBe("Hello <mark>World</mark>");
  });

  it("returns original for empty query", () => {
    expect(highlightText("Hello World", "")).toBe("Hello World");
  });
});
