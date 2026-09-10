import { describe, it, expect } from "vitest";
import type {
  JobStatus,
  JobType,
  JobExperienceLevel,
  ApplicationStatus,
  InterviewType,
  InterviewStatus,
  OfferStatus,
  SkillLevel,
  AssessmentStatus,
  Priority,
  EmploymentType,
  JobSalary,
  JobBenefits,
  ScreeningQuestion,
  Job,
  JobRequiredSkill,
  JobWithDetails,
  JobApplicationSummary,
  JobFilter,
  JobStats,
  CreateJobInput,
  UpdateJobInput,
} from "@/types/job";

describe("Job type definitions", () => {
  it("JobStatus has correct values", () => {
    const statuses: JobStatus[] = [
      "draft", "open", "on_hold", "closed", "archived", "cancelled",
    ];
    expect(statuses).toHaveLength(6);
  });

  it("JobType has correct values", () => {
    const types: JobType[] = [
      "full_time", "part_time", "contract", "internship",
      "temporary", "remote", "freelance",
    ];
    expect(types).toHaveLength(7);
  });

  it("JobExperienceLevel has correct values", () => {
    const levels: JobExperienceLevel[] = ["entry", "mid", "senior", "lead", "executive"];
    expect(levels).toHaveLength(5);
  });

  it("ApplicationStatus has correct values", () => {
    const statuses: ApplicationStatus[] = [
      "submitted", "screening", "review", "phone_interview",
      "technical_interview", "final_interview", "offer_pending",
      "offer_extended", "offer_accepted", "offer_declined", "hired",
      "rejected", "withdrawn",
    ];
    expect(statuses).toHaveLength(13);
  });

  it("InterviewType has correct values", () => {
    const types: InterviewType[] = [
      "phone", "video", "onsite", "technical", "panel", "cultural", "executive",
    ];
    expect(types).toHaveLength(7);
  });

  it("InterviewStatus has correct values", () => {
    const statuses: InterviewStatus[] = [
      "scheduled", "in_progress", "completed", "cancelled", "rescheduled", "no_show",
    ];
    expect(statuses).toHaveLength(6);
  });

  it("OfferStatus has correct values", () => {
    const statuses: OfferStatus[] = [
      "draft", "pending_approval", "sent", "negotiating",
      "accepted", "declined", "expired", "withdrawn",
    ];
    expect(statuses).toHaveLength(8);
  });

  it("SkillLevel has correct values", () => {
    const levels: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];
    expect(levels).toHaveLength(4);
  });

  it("AssessmentStatus has correct values", () => {
    const statuses: AssessmentStatus[] = ["not_started", "in_progress", "completed", "expired"];
    expect(statuses).toHaveLength(4);
  });

  it("Priority has correct values", () => {
    const priorities: Priority[] = ["low", "medium", "high", "urgent"];
    expect(priorities).toHaveLength(4);
  });

  it("EmploymentType has correct values", () => {
    const types: EmploymentType[] = ["permanent", "temporary", "contract", "internship", "apprenticeship"];
    expect(types).toHaveLength(5);
  });
});

describe("JobSalary interface", () => {
  it("has required fields", () => {
    const salary: JobSalary = {
      min: 50000,
      max: 100000,
      currency: "USD",
      period: "yearly",
      isNegotiable: false,
    };
    expect(salary.min).toBeLessThan(salary.max);
    expect(salary.currency).toHaveLength(3);
  });

  it("supports all periods", () => {
    const periods: JobSalary["period"][] = ["hourly", "daily", "weekly", "monthly", "yearly"];
    expect(periods).toHaveLength(5);
  });
});

describe("JobBenefits interface", () => {
  it("has boolean benefit flags", () => {
    const benefits: JobBenefits = {
      healthInsurance: true,
      dentalInsurance: false,
      visionInsurance: true,
      retirementPlan: true,
      paidTimeOff: 20,
      remoteWork: true,
      stockOptions: false,
      educationBudget: 5000,
      signingBonus: null,
      relocationAssistance: false,
      wellnessStipend: 500,
      parentalLeave: 12,
      customBenefits: ["Free lunch"],
    };
    expect(benefits.paidTimeOff).toBeGreaterThan(0);
    expect(benefits.customBenefits).toContain("Free lunch");
  });
});

describe("ScreeningQuestion interface", () => {
  it("supports all question types", () => {
    const types: ScreeningQuestion["type"][] = ["yes_no", "text", "number", "multiple_choice"];
    expect(types).toHaveLength(4);
  });

  it("creates valid screening question", () => {
    const question: ScreeningQuestion = {
      id: "q1",
      question: "Are you authorized to work in the US?",
      type: "yes_no",
      options: null,
      required: true,
      passingAnswer: "yes",
      weight: 1,
    };
    expect(question.required).toBe(true);
    expect(question.weight).toBeGreaterThan(0);
  });
});

describe("Job interface", () => {
  it("has all required fields", () => {
    const job: Job = {
      id: "job-1",
      title: "Software Engineer",
      department: "Engineering",
      team: "Backend",
      location: "San Francisco, CA",
      isRemote: false,
      type: "full_time",
      experienceLevel: "senior",
      employmentType: "permanent",
      description: "Build great things",
      requirements: ["5+ years experience"],
      responsibilities: ["Design systems"],
      niceToHaves: ["Rust experience"],
      salary: null,
      benefits: null,
      requiredSkills: [],
      screeningQuestions: [],
      status: "open",
      priority: "high",
      headcount: 2,
      filledCount: 0,
      hiringManagerId: "user-1",
      recruiterId: null,
      publishedAt: new Date(),
      closingDate: null,
      filledAt: null,
      applicationCount: 0,
      viewCount: 0,
      tags: ["engineering"],
      metadata: null,
      firmId: "firm-1",
    };
    expect(job.title).toBeTruthy();
    expect(job.status).toBe("open");
  });
});

describe("JobRequiredSkill interface", () => {
  it("creates required skill", () => {
    const skill: JobRequiredSkill = {
      skillName: "TypeScript",
      minimumLevel: "intermediate",
      isRequired: true,
      yearsExperience: 3,
    };
    expect(skill.isRequired).toBe(true);
  });

  it("creates optional skill", () => {
    const skill: JobRequiredSkill = {
      skillName: "GraphQL",
      minimumLevel: "beginner",
      isRequired: false,
      yearsExperience: null,
    };
    expect(skill.isRequired).toBe(false);
  });
});

describe("JobFilter interface", () => {
  it("supports partial filters", () => {
    const filter: JobFilter = {
      status: ["open"],
      search: "engineer",
    };
    expect(filter.status).toContain("open");
  });

  it("supports date range filter", () => {
    const filter: JobFilter = {
      dateRange: { start: new Date("2024-01-01"), end: new Date("2024-12-31") },
    };
    expect(filter.dateRange?.start).toBeInstanceOf(Date);
  });
});

describe("JobStats interface", () => {
  it("has all stat fields", () => {
    const stats: JobStats = {
      totalJobs: 10,
      openJobs: 5,
      closedJobs: 3,
      totalApplications: 50,
      averageTimeToFill: 30,
      jobsByStatus: {
        draft: 2, open: 5, on_hold: 0, closed: 3, archived: 0, cancelled: 0,
      },
      jobsByType: {
        full_time: 5, part_time: 1, contract: 2, internship: 0,
        temporary: 1, remote: 1, freelance: 0,
      },
      jobsByDepartment: [{ department: "Engineering", count: 5 }],
      topSkills: [{ skill: "TypeScript", demand: 8 }],
      monthlyHires: [{ month: "2024-01", hires: 3 }],
    };
    expect(stats.totalJobs).toBe(10);
    expect(stats.jobsByDepartment).toHaveLength(1);
  });
});

describe("CreateJobInput interface", () => {
  it("requires hiringManagerId", () => {
    const input: CreateJobInput = {
      title: "New Role",
      department: "Engineering",
      location: "Remote",
      type: "full_time",
      experienceLevel: "mid",
      employmentType: "permanent",
      description: "Description",
      requirements: ["Req 1"],
      responsibilities: ["Resp 1"],
      hiringManagerId: "user-1",
    };
    expect(input.hiringManagerId).toBeTruthy();
  });
});

describe("UpdateJobInput interface", () => {
  it("allows partial updates", () => {
    const input: UpdateJobInput = {
      title: "Updated Title",
    };
    expect(input.title).toBe("Updated Title");
  });

  it("allows status updates", () => {
    const input: UpdateJobInput = {
      status: "closed",
    };
    expect(input.status).toBe("closed");
  });
});
