import { describe, it, expect } from "vitest";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    role: z.enum(["CANDIDATE", "RECRUITER", "HIRING_MANAGER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const jobPostingSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(10000),
  location: z.string().max(200),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]),
  experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
});

const offerSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
  title: z.string().min(1).max(200),
  salary: z.number().min(0),
  salaryCurrency: z.string().length(3).default("USD"),
  salaryFrequency: z.enum(["HOURLY", "WEEKLY", "BIWEEKLY", "MONTHLY", "ANNUAL"]),
  startDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
});

const searchFilterSchema = z.object({
  query: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  isRemote: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

describe("Login validation", () => {
  it("validates correct login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("Register validation", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123",
    confirmPassword: "Password123",
    role: "CANDIDATE" as const,
  };

  it("validates correct registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "PASSWORD123",
      confirmPassword: "PASSWORD123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "PasswordOnly",
      confirmPassword: "PasswordOnly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({
      ...validData,
      name: "J",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = registerSchema.safeParse({
      ...validData,
      role: "INVALID_ROLE",
    });
    expect(result.success).toBe(false);
  });
});

describe("Job posting validation", () => {
  const validJob = {
    title: "Senior Software Engineer",
    description: "We are looking for a senior software engineer with 5+ years of experience.",
    location: "San Francisco, CA",
    employmentType: "FULL_TIME" as const,
    experienceLevel: "SENIOR" as const,
  };

  it("validates correct job data", () => {
    const result = jobPostingSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = jobPostingSchema.safeParse({
      ...validJob,
      title: "Eng",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = jobPostingSchema.safeParse({
      ...validJob,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("validates optional salary", () => {
    const result = jobPostingSchema.safeParse({
      ...validJob,
      salaryMin: 100000,
      salaryMax: 150000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative salary", () => {
    const result = jobPostingSchema.safeParse({
      ...validJob,
      salaryMin: -1000,
    });
    expect(result.success).toBe(false);
  });
});

describe("Offer validation", () => {
  const validOffer = {
    jobId: "550e8400-e29b-41d4-a716-446655440000",
    candidateId: "550e8400-e29b-41d4-a716-446655440001",
    title: "Software Engineer Offer",
    salary: 120000,
    salaryFrequency: "ANNUAL" as const,
    startDate: "2024-06-01T00:00:00.000Z",
    expirationDate: "2024-06-15T00:00:00.000Z",
  };

  it("validates correct offer data", () => {
    const result = offerSchema.safeParse(validOffer);
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID for jobId", () => {
    const result = offerSchema.safeParse({
      ...validOffer,
      jobId: "invalid-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative salary", () => {
    const result = offerSchema.safeParse({
      ...validOffer,
      salary: -50000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid salary frequency", () => {
    const result = offerSchema.safeParse({
      ...validOffer,
      salaryFrequency: "YEARLY",
    });
    expect(result.success).toBe(false);
  });
});

describe("Search filter validation", () => {
  it("validates with defaults", () => {
    const result = searchFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("validates complete filter", () => {
    const result = searchFilterSchema.safeParse({
      query: "engineer",
      location: "Remote",
      salaryMin: 100000,
      salaryMax: 200000,
      isRemote: true,
      page: 2,
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects limit over 100", () => {
    const result = searchFilterSchema.safeParse({
      limit: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects page less than 1", () => {
    const result = searchFilterSchema.safeParse({
      page: 0,
    });
    expect(result.success).toBe(false);
  });
});
