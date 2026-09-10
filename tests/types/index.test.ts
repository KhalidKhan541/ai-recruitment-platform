import { describe, it, expect } from "vitest";
import type {
  User,
  Job,
  Candidate,
  Skill,
  Education,
  WorkExperience,
  Application,
  AIAnalysis,
  ApplicationNote,
  TimelineEvent,
  DashboardStats,
  SearchFilters,
  PaginatedResponse,
} from "@/types/index";

describe("User interface", () => {
  it("has required fields", () => {
    const user: User = {
      id: "u-1",
      email: "admin@company.com",
      name: "Admin User",
      role: "admin",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    expect(user.role).toBe("admin");
  });

  it("supports all roles", () => {
    const roles: User["role"][] = ["admin", "recruiter", "hiring_manager"];
    expect(roles).toHaveLength(3);
  });

  it("allows optional fields", () => {
    const user: User = {
      id: "u-2",
      email: "user@test.com",
      name: "User",
      role: "recruiter",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    expect(user.avatar).toBeUndefined();
    expect(user.company).toBeUndefined();
  });
});

describe("Job interface (index)", () => {
  it("supports all job types", () => {
    const types: Job["type"][] = ["full-time", "part-time", "contract", "internship"];
    expect(types).toHaveLength(4);
  });

  it("supports all remote options", () => {
    const remote: Job["remote"][] = ["onsite", "remote", "hybrid"];
    expect(remote).toHaveLength(3);
  });

  it("supports all statuses", () => {
    const statuses: Job["status"][] = ["draft", "published", "closed", "archived"];
    expect(statuses).toHaveLength(4);
  });

  it("creates full job", () => {
    const job: Job = {
      id: "j-1",
      title: "Software Engineer",
      department: "Engineering",
      location: "Remote",
      type: "full-time",
      remote: "remote",
      salary: { min: 100000, max: 150000, currency: "USD" },
      description: "Build things",
      requirements: ["5 years exp"],
      responsibilities: ["Write code"],
      benefits: ["Health insurance"],
      status: "published",
      applicationCount: 10,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      hiringManager: {
        id: "u-1",
        email: "hm@company.com",
        name: "HM",
        role: "hiring_manager",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    };
    expect(job.applicationCount).toBe(10);
  });
});

describe("Candidate interface (index)", () => {
  it("supports all statuses", () => {
    const statuses: Candidate["status"][] = [
      "new", "screening", "interview", "offer", "hired", "rejected",
    ];
    expect(statuses).toHaveLength(6);
  });

  it("creates candidate with skills", () => {
    const candidate: Candidate = {
      id: "c-1",
      name: "Jane Doe",
      email: "jane@test.com",
      title: "Engineer",
      location: "SF",
      experience: 5,
      skills: [{ name: "React", level: "advanced" }],
      education: [],
      workHistory: [],
      status: "new",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    expect(candidate.skills).toHaveLength(1);
  });
});

describe("Skill interface", () => {
  it("supports all levels", () => {
    const levels: Skill["level"][] = ["beginner", "intermediate", "advanced", "expert"];
    expect(levels).toHaveLength(4);
  });
});

describe("Education interface", () => {
  it("creates valid education", () => {
    const edu: Education = {
      institution: "MIT",
      degree: "BS",
      field: "CS",
      startDate: "2016",
      endDate: "2020",
      gpa: 3.8,
    };
    expect(edu.gpa).toBeGreaterThan(3.0);
  });
});

describe("WorkExperience interface", () => {
  it("creates valid work experience", () => {
    const work: WorkExperience = {
      company: "Google",
      title: "Engineer",
      startDate: "2020-01",
      current: true,
      description: "Built things",
      achievements: ["Shipped feature"],
    };
    expect(work.current).toBe(true);
  });
});

describe("Application interface", () => {
  it("supports all statuses", () => {
    const statuses: Application["status"][] = [
      "applied", "reviewing", "phone_screen", "technical",
      "onsite", "offer", "hired", "rejected", "withdrawn",
    ];
    expect(statuses).toHaveLength(9);
  });
});

describe("AIAnalysis interface", () => {
  it("supports all recommendations", () => {
    const recs: AIAnalysis["recommendation"][] = [
      "strongly_recommend", "recommend", "neutral", "not_recommend",
    ];
    expect(recs).toHaveLength(4);
  });

  it("creates full analysis", () => {
    const analysis: AIAnalysis = {
      overallScore: 85,
      skillsMatch: 90,
      experienceMatch: 80,
      educationMatch: 75,
      cultureFit: 70,
      strengths: ["Strong technical skills"],
      concerns: ["Limited leadership exp"],
      recommendation: "recommend",
      summary: "Strong candidate",
      keywords: ["React", "TypeScript"],
    };
    expect(analysis.overallScore).toBeGreaterThan(0);
  });
});

describe("ApplicationNote interface", () => {
  it("supports all note types", () => {
    const types: ApplicationNote["type"][] = ["general", "interview", "feedback", "system"];
    expect(types).toHaveLength(4);
  });
});

describe("TimelineEvent interface", () => {
  it("supports all event types", () => {
    const types: TimelineEvent["type"][] = [
      "applied", "status_change", "note_added",
      "interview_scheduled", "feedback_submitted",
      "offer_sent", "ai_analysis",
    ];
    expect(types).toHaveLength(7);
  });
});

describe("DashboardStats interface", () => {
  it("has all stat fields", () => {
    const stats: DashboardStats = {
      totalJobs: 20,
      activeJobs: 10,
      totalCandidates: 150,
      newApplications: 25,
      interviewsScheduled: 8,
      offersPending: 3,
      hiringRate: 0.15,
      averageTimeToHire: 30,
      applicationsByStatus: { applied: 50, reviewing: 20 },
      recentActivity: [],
    };
    expect(stats.hiringRate).toBeGreaterThan(0);
    expect(stats.hiringRate).toBeLessThan(1);
  });
});

describe("SearchFilters interface", () => {
  it("supports all filter fields", () => {
    const filters: SearchFilters = {
      query: "engineer",
      department: "Engineering",
      location: "SF",
      type: "full-time",
      remote: "remote",
      salaryMin: 100000,
      salaryMax: 200000,
      status: "published",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 20,
    };
    expect(filters.sortOrder).toBe("desc");
    expect(filters.page).toBe(1);
  });
});

describe("PaginatedResponse interface", () => {
  it("creates valid paginated response", () => {
    const response: PaginatedResponse<Job> = {
      data: [],
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
    };
    expect(response.totalPages).toBe(5);
  });

  it("handles generic types", () => {
    const response: PaginatedResponse<Candidate> = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
    expect(response.data).toHaveLength(0);
  });
});
