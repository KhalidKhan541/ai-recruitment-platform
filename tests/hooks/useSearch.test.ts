import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface SearchFilter {
  query?: string;
  location?: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
}

function buildSearchQuery(filters: SearchFilter): string {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.location) params.set("location", filters.location);
  if (filters.department) params.set("department", filters.department);
  if (filters.employmentType) params.set("type", filters.employmentType);
  if (filters.experienceLevel) params.set("level", filters.experienceLevel);
  if (filters.salaryMin) params.set("salaryMin", String(filters.salaryMin));
  if (filters.salaryMax) params.set("salaryMax", String(filters.salaryMax));
  if (filters.isRemote !== undefined) params.set("remote", String(filters.isRemote));

  return params.toString();
}

function filterJobs(jobs: any[], filters: SearchFilter): any[] {
  return jobs.filter((job) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchesTitle = job.title.toLowerCase().includes(q);
      const matchesDept = job.department?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDept) return false;
    }

    if (filters.location && job.location !== filters.location) return false;
    if (filters.department && job.department !== filters.department) return false;
    if (filters.employmentType && job.type !== filters.employmentType) return false;
    if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) return false;
    if (filters.isRemote !== undefined && job.isRemote !== filters.isRemote) return false;

    if (filters.salaryMin && job.salary?.max < filters.salaryMin) return false;
    if (filters.salaryMax && job.salary?.min > filters.salaryMax) return false;

    return true;
  });
}

const mockJobs = [
  { id: 1, title: "Software Engineer", department: "Engineering", location: "Remote", type: "full_time", experienceLevel: "mid", salary: { min: 100000, max: 150000 }, isRemote: true },
  { id: 2, title: "Product Manager", department: "Product", location: "New York", type: "full_time", experienceLevel: "senior", salary: { min: 130000, max: 180000 }, isRemote: false },
  { id: 3, title: "Data Analyst", department: "Analytics", location: "San Francisco", type: "contract", experienceLevel: "junior", salary: { min: 80000, max: 120000 }, isRemote: false },
  { id: 4, title: "Frontend Developer", department: "Engineering", location: "Remote", type: "full_time", experienceLevel: "mid", salary: { min: 90000, max: 140000 }, isRemote: true },
];

describe("Search Query Builder", () => {
  it("builds query string from filters", () => {
    const query = buildSearchQuery({ query: "engineer" });
    expect(query).toBe("q=engineer");
  });

  it("builds query with multiple filters", () => {
    const query = buildSearchQuery({
      query: "developer",
      location: "Remote",
      isRemote: true,
    });
    expect(query).toContain("q=developer");
    expect(query).toContain("location=Remote");
    expect(query).toContain("remote=true");
  });

  it("omits empty filters", () => {
    const query = buildSearchQuery({ query: "test" });
    expect(query).not.toContain("location");
    expect(query).not.toContain("department");
  });

  it("handles salary range filters", () => {
    const query = buildSearchQuery({
      salaryMin: 100000,
      salaryMax: 150000,
    });
    expect(query).toContain("salaryMin=100000");
    expect(query).toContain("salaryMax=150000");
  });

  it("returns empty string for empty filters", () => {
    const query = buildSearchQuery({});
    expect(query).toBe("");
  });
});

describe("Job Filtering", () => {
  it("filters by query text", () => {
    const results = filterJobs(mockJobs, { query: "engineer" });
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Software Engineer");
    expect(results[1].title).toBe("Frontend Developer");
  });

  it("filters by department", () => {
    const results = filterJobs(mockJobs, { department: "Engineering" });
    expect(results).toHaveLength(2);
  });

  it("filters by location", () => {
    const results = filterJobs(mockJobs, { location: "Remote" });
    expect(results).toHaveLength(2);
  });

  it("filters by employment type", () => {
    const results = filterJobs(mockJobs, { employmentType: "contract" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Data Analyst");
  });

  it("filters by experience level", () => {
    const results = filterJobs(mockJobs, { experienceLevel: "senior" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Product Manager");
  });

  it("filters by remote status", () => {
    const results = filterJobs(mockJobs, { isRemote: true });
    expect(results).toHaveLength(2);
    expect(results.every((j) => j.isRemote)).toBe(true);
  });

  it("filters by minimum salary", () => {
    const results = filterJobs(mockJobs, { salaryMin: 130000 });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Product Manager");
  });

  it("filters by maximum salary", () => {
    const results = filterJobs(mockJobs, { salaryMax: 100000 });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Data Analyst");
  });

  it("combines multiple filters", () => {
    const results = filterJobs(mockJobs, {
      department: "Engineering",
      isRemote: true,
    });
    expect(results).toHaveLength(2);
  });

  it("returns empty when no matches", () => {
    const results = filterJobs(mockJobs, { query: "nonexistent" });
    expect(results).toHaveLength(0);
  });

  it("returns all jobs when no filters", () => {
    const results = filterJobs(mockJobs, {});
    expect(results).toHaveLength(4);
  });
});

describe("Search highlighting", () => {
  function highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  it("highlights matching text", () => {
    const result = highlightMatch("Software Engineer", "Engineer");
    expect(result).toBe("Software <mark>Engineer</mark>");
  });

  it("is case insensitive", () => {
    const result = highlightMatch("Software Engineer", "software");
    expect(result).toBe("<mark>Software</mark> Engineer");
  });

  it("highlights multiple occurrences", () => {
    const result = highlightMatch("a b a c a", "a");
    expect(result).toBe("<mark>a</mark> b <mark>a</mark> c <mark>a</mark>");
  });

  it("returns original text when query is empty", () => {
    const result = highlightMatch("test", "");
    expect(result).toBe("test");
  });
});
