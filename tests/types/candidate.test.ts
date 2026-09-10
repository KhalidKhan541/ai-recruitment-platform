import { describe, it, expect } from "vitest";
import type {
  CandidateStatus,
  ResumeStatus,
  SkillLevel,
  AssessmentStatus,
  CertificationStatus,
  CandidateEducation,
  CandidateExperience,
  CandidateProject,
  CandidateLink,
  CandidatePreferences,
  Candidate,
  CandidateWithDetails,
  CandidateBasic,
  CandidateSkill,
  CandidateResume,
  ResumeParsedData,
  ResumeMatchScore,
  CandidateApplicationSummary,
  CandidateCertification,
  CandidateAssessmentSummary,
  CandidateFilter,
  CandidateStats,
  CreateCandidateInput,
  UpdateCandidateInput,
} from "@/types/candidate";

describe("CandidateStatus type", () => {
  it("has correct values", () => {
    const statuses: CandidateStatus[] = [
      "active", "passive", "not_interested", "blacklisted", "hired", "archived",
    ];
    expect(statuses).toHaveLength(6);
  });
});

describe("ResumeStatus type", () => {
  it("has correct values", () => {
    const statuses: ResumeStatus[] = ["current", "outdated", "in_review"];
    expect(statuses).toHaveLength(3);
  });
});

describe("CertificationStatus type", () => {
  it("has correct values", () => {
    const statuses: CertificationStatus[] = ["active", "expired", "pending", "revoked"];
    expect(statuses).toHaveLength(4);
  });
});

describe("CandidateEducation interface", () => {
  it("creates valid education entry", () => {
    const edu: CandidateEducation = {
      institution: "MIT",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startDate: new Date("2016-09-01"),
      endDate: new Date("2020-06-01"),
      gpa: 3.8,
      honors: ["Magna Cum Laude"],
      activities: ["CS Club"],
    };
    expect(edu.institution).toBe("MIT");
    expect(edu.gpa).toBeGreaterThan(3.0);
  });

  it("allows null endDate for current studies", () => {
    const edu: CandidateEducation = {
      institution: "Stanford",
      degree: "MS",
      fieldOfStudy: "AI",
      startDate: new Date("2023-09-01"),
      endDate: null,
      gpa: null,
      honors: [],
      activities: [],
    };
    expect(edu.endDate).toBeNull();
  });
});

describe("CandidateExperience interface", () => {
  it("creates valid experience entry", () => {
    const exp: CandidateExperience = {
      company: "Google",
      title: "Senior Engineer",
      location: "Mountain View, CA",
      startDate: new Date("2020-01-01"),
      endDate: null,
      isCurrent: true,
      description: "Built distributed systems",
      achievements: ["Reduced latency by 50%"],
      skills: ["Go", "Kubernetes"],
    };
    expect(exp.isCurrent).toBe(true);
    expect(exp.achievements).toHaveLength(1);
  });
});

describe("CandidateProject interface", () => {
  it("creates valid project", () => {
    const project: CandidateProject = {
      name: "Open Source Tool",
      description: "A useful tool",
      url: "https://github.com/example/tool",
      technologies: ["TypeScript", "React"],
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-06-01"),
    };
    expect(project.technologies).toContain("TypeScript");
  });
});

describe("CandidateLink interface", () => {
  it("supports all link types", () => {
    const types: CandidateLink["type"][] = [
      "linkedin", "github", "portfolio", "website", "twitter", "other",
    ];
    expect(types).toHaveLength(6);
  });

  it("creates valid link", () => {
    const link: CandidateLink = {
      type: "github",
      url: "https://github.com/user",
      label: "GitHub Profile",
    };
    expect(link.url).toMatch(/^https?:\/\//);
  });
});

describe("CandidatePreferences interface", () => {
  it("creates full preferences", () => {
    const prefs: CandidatePreferences = {
      desiredSalary: { min: 100000, max: 150000, currency: "USD" },
      desiredLocations: ["San Francisco", "New York"],
      isRemoteOnly: false,
      isWillingToRelocate: true,
      desiredJobTypes: ["full_time"],
      desiredIndustries: ["Technology"],
      earliestStartDate: new Date("2024-06-01"),
      noticePeriodWeeks: 2,
    };
    expect(prefs.isWillingToRelocate).toBe(true);
    expect(prefs.desiredLocations).toHaveLength(2);
  });

  it("allows null salary", () => {
    const prefs: CandidatePreferences = {
      desiredSalary: null,
      desiredLocations: [],
      isRemoteOnly: true,
      isWillingToRelocate: false,
      desiredJobTypes: [],
      desiredIndustries: [],
      earliestStartDate: null,
      noticePeriodWeeks: null,
    };
    expect(prefs.desiredSalary).toBeNull();
  });
});

describe("Candidate interface", () => {
  it("has all required fields", () => {
    const candidate: Candidate = {
      id: "c-1",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "+1555123456",
      location: "SF, CA",
      city: "San Francisco",
      country: "US",
      timezone: "America/Los_Angeles",
      headline: "Senior Engineer",
      summary: "Experienced engineer",
      profileImage: null,
      status: "active",
      source: "linkedin",
      referredBy: null,
      education: [],
      experience: [],
      skills: [],
      projects: [],
      links: [],
      preferences: null,
      tags: ["senior"],
      notes: null,
      lastContactedAt: null,
      lastActiveAt: new Date(),
      applicationCount: 0,
      interviewCount: 0,
      offerCount: 0,
      metadata: null,
      firmId: "firm-1",
    };
    expect(candidate.firstName).toBeTruthy();
    expect(candidate.status).toBe("active");
  });
});

describe("CandidateSkill interface", () => {
  it("creates valid skill", () => {
    const skill: CandidateSkill = {
      skillName: "React",
      level: "expert",
      yearsExperience: 5,
      lastUsed: new Date(),
      isVerified: true,
      endorsements: 10,
    };
    expect(skill.level).toBe("expert");
    expect(skill.endorsements).toBeGreaterThan(0);
  });
});

describe("CandidateResume interface", () => {
  it("creates valid resume", () => {
    const resume: CandidateResume = {
      id: "r-1",
      fileName: "resume.pdf",
      originalName: "Jane_Smith_Resume.pdf",
      url: "https://storage.example.com/resume.pdf",
      storageKey: "resumes/firm-1/c-1/resume.pdf",
      mimeType: "application/pdf",
      size: 102400,
      status: "current",
      parsedContent: "Full text content...",
      parsedData: null,
      matchScores: [],
      uploadedAt: new Date(),
      lastParsedAt: new Date(),
      candidateId: "c-1",
    };
    expect(resume.mimeType).toBe("application/pdf");
    expect(resume.size).toBeGreaterThan(0);
  });
});

describe("ResumeMatchScore interface", () => {
  it("has all score fields", () => {
    const score: ResumeMatchScore = {
      jobId: "job-1",
      jobTitle: "Frontend Engineer",
      overallScore: 85,
      skillsMatch: 90,
      experienceMatch: 80,
      educationMatch: 75,
      locationMatch: 100,
      salaryMatch: 70,
      scoredAt: new Date(),
    };
    expect(score.overallScore).toBeGreaterThan(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
  });
});

describe("CandidateFilter interface", () => {
  it("supports multi-criteria filtering", () => {
    const filter: CandidateFilter = {
      status: ["active"],
      location: ["San Francisco"],
      skills: ["React", "TypeScript"],
      minMatchScore: 80,
      search: "engineer",
    };
    expect(filter.skills).toHaveLength(2);
  });
});

describe("CandidateStats interface", () => {
  it("has all stat fields", () => {
    const stats: CandidateStats = {
      totalCandidates: 100,
      activeCandidates: 50,
      newThisMonth: 10,
      candidatesByStatus: {
        active: 50, passive: 20, not_interested: 5,
        blacklisted: 2, hired: 15, archived: 8,
      },
      topSkills: [{ skill: "TypeScript", count: 30 }],
      sourceBreakdown: [{ source: "LinkedIn", count: 40 }],
      averageMatchScore: 72.5,
    };
    expect(stats.totalCandidates).toBe(100);
    expect(stats.candidatesByStatus.active).toBe(50);
  });
});

describe("CreateCandidateInput interface", () => {
  it("requires minimum fields", () => {
    const input: CreateCandidateInput = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      firmId: "firm-1",
    };
    expect(input.firstName).toBeTruthy();
    expect(input.email).toMatch(/@/);
  });
});

describe("UpdateCandidateInput interface", () => {
  it("allows partial updates", () => {
    const input: UpdateCandidateInput = {
      firstName: "Updated",
    };
    expect(input.firstName).toBe("Updated");
  });

  it("allows status changes", () => {
    const input: UpdateCandidateInput = {
      status: "hired",
    };
    expect(input.status).toBe("hired");
  });
});
