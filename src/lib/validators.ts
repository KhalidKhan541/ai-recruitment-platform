import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
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
    companyId: z.string().uuid().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  linkedInUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

export const companySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(5000).optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size: z
    .enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"])
    .optional(),
  logoUrl: z.string().url().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
});

export const companyDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    "EMPLOYMENT_AGREEMENT",
    "NDA",
    "POLICY",
    "CERTIFICATE",
    "LICENSE",
    "OTHER",
  ]),
  fileUrl: z.string().url(),
  expiresAt: z.string().datetime().optional(),
});

export const jobPostingSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z
    .string()
    .min(5)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().min(50).max(10000),
  requirements: z.string().max(10000).optional(),
  responsibilities: z.string().max(10000).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(200),
  isRemote: z.boolean().default(false),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
    "FREELANCE",
  ]),
  experienceLevel: z.enum([
    "ENTRY",
    "JUNIOR",
    "MID",
    "SENIOR",
    "LEAD",
    "EXECUTIVE",
  ]),
  educationLevel: z.enum([
    "HIGH_SCHOOL",
    "ASSOCIATE",
    "BACHELOR",
    "MASTER",
    "DOCTORATE",
    "NONE",
  ]),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().length(3).default("USD"),
  vacancies: z.number().min(1).default(1),
  applicationDeadline: z.string().datetime().optional(),
  screeningQuestions: z
    .array(
      z.object({
        question: z.string().min(1).max(500),
        type: z.enum(["TEXT", "YES_NO", "NUMBER", "SELECT"]),
        required: z.boolean().default(true),
        options: z.array(z.string()).optional(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
});

export const jobApplicationSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().max(5000).optional(),
  resumeId: z.string().uuid().optional(),
  screeningAnswers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
  referredById: z.string().uuid().optional(),
});

export const candidateProfileSchema = z.object({
  headline: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  desiredSalary: z.number().min(0).optional(),
  desiredSalaryCurrency: z.string().length(3).default("USD"),
  availableFrom: z.string().datetime().optional(),
  willingToRelocate: z.boolean().default(false),
  workPreference: z
    .enum(["REMOTE", "ONSITE", "HYBRID", "FLEXIBLE"])
    .optional(),
  expectedExperienceLevel: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .optional(),
});

export const resumeUploadSchema = z.object({
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  fileName: z.string().max(200),
  fileSize: z.number().max(10 * 1024 * 1024),
  mimeType: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  isDefault: z.boolean().default(false),
});

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"]),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  endorsements: z.number().min(0).optional(),
  isVerified: z.boolean().default(false),
});

export const experienceSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"])
    .optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(5000).optional(),
  achievements: z.array(z.string()).optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.enum([
    "HIGH_SCHOOL",
    "ASSOCIATE",
    "BACHELOR",
    "MASTER",
    "DOCTORATE",
    "CERTIFICATE",
    "DIPLOMA",
  ]),
  fieldOfStudy: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().default(false),
  gpa: z.number().min(0).max(4).optional(),
  description: z.string().max(2000).optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  credentialId: z.string().max(200).optional(),
  credentialUrl: z.string().url().optional(),
});

export const referenceSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  relationship: z.enum([
    "SUPERVISOR",
    "COLLEAGUE",
    "SUBORDINATE",
    "CLIENT",
    "MENTOR",
    "OTHER",
  ]),
  canContact: z.boolean().default(true),
});

export const recruiterSchema = z.object({
  userId: z.string().uuid(),
  agencyName: z.string().max(200).optional(),
  specialization: z.array(z.string()).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  placementRate: z.number().min(0).max(100).optional(),
  totalPlacements: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  isVerified: z.boolean().default(false),
});

export const interviewSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
  type: z.enum([
    "PHONE_SCREEN",
    "VIDEO",
    "IN_PERSON",
    "TECHNICAL",
    "PANEL",
    "VIRTUAL_ONSITE",
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().min(15).max(480),
  location: z.string().max(500).optional(),
  meetingUrl: z.string().url().optional(),
  interviewerIds: z.array(z.string().uuid()).min(1),
  notes: z.string().max(5000).optional(),
});

export const interviewScoreSchema = z.object({
  interviewId: z.string().uuid(),
  interviewerId: z.string().uuid(),
  criterionId: z.string().uuid(),
  score: z.number().min(1).max(10),
  comments: z.string().max(2000).optional(),
});

export const interviewFeedbackSchema = z.object({
  interviewId: z.string().uuid(),
  interviewerId: z.string().uuid(),
  recommendation: z.enum([
    "STRONG_HIRE",
    "HIRE",
    "LEAN_HIRE",
    "NO_OPINION",
    "LEAN_NO_HIRE",
    "NO_HIRE",
    "STRONG_NO_HIRE",
  ]),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
  wouldInterviewAgain: z.boolean().optional(),
});

export const offerSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
  title: z.string().min(1).max(200),
  salary: z.number().min(0),
  salaryCurrency: z.string().length(3).default("USD"),
  salaryFrequency: z.enum(["HOURLY", "WEEKLY", "BIWEEKLY", "MONTHLY", "ANNUAL"]),
  equityPercentage: z.number().min(0).max(100).optional(),
  signingBonus: z.number().min(0).optional(),
  relocationBonus: z.number().min(0).optional(),
  startDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
    "FREELANCE",
  ]),
  workLocation: z.string().max(200),
  workArrangement: z.enum(["REMOTE", "ONSITE", "HYBRID"]),
  benefits: z.array(z.string()).optional(),
  terms: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
});

export const onboardingTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    "DOCUMENTATION",
    "EQUIPMENT",
    "TRAINING",
    "COMPLIANCE",
    "WELCOME",
    "OTHER",
  ]),
  dueDaysBeforeStart: z.number().min(0).max(90).optional(),
  assigneeId: z.string().uuid().optional(),
  isRequired: z.boolean().default(true),
  order: z.number().min(0).default(0),
});

export const communicationSchema = z.object({
  toUserId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  type: z.enum([
    "EMAIL",
    "SMS",
    "IN_APP",
    "WHATSAPP",
    "LINKED_IN",
  ]),
  relatedType: z
    .enum(["JOB", "APPLICATION", "INTERVIEW", "OFFER", "CANDIDATE"])
    .optional(),
  relatedId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  interviewReminders: z.boolean().default(true),
  applicationUpdates: z.boolean().default(true),
  newMessages: z.boolean().default(true),
  offerUpdates: z.boolean().default(true),
  systemAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export const reportSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum([
    "PIPELINE",
    "TIME_TO_FILL",
    "SOURCE_EFFECTIVENESS",
    "INTERVIEW_SCORES",
    "OFFER_ACCEPTANCE",
    "CANDIDATE_DEMOGRAPHICS",
    "RECRUITER_PERFORMANCE",
    "CUSTOM",
  ]),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  filters: z.record(z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  format: z.enum(["PDF", "CSV", "XLSX"]).default("PDF"),
});

export const reportScheduleSchema = z.object({
  reportId: z.string().uuid(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
  recipients: z.array(z.string().email()).min(1),
  format: z.enum(["PDF", "CSV", "XLSX"]).default("PDF"),
  isActive: z.boolean().default(true),
});

export const talentPoolSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  criteria: z
    .object({
      skills: z.array(z.string()).optional(),
      experienceLevel: z
        .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
        .optional(),
      location: z.string().optional(),
      availableFrom: z.string().datetime().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

export const skillAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum([
    "TECHNICAL",
    "BEHAVIORAL",
    "PERSONALITY",
    "COGNITIVE",
    "SKILL_SPECIFIC",
  ]),
  durationMinutes: z.number().min(5).max(480),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().min(1).max(10).default(1),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER", "CODING", "FILE_UPLOAD"]),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string().optional(),
        points: z.number().min(1).default(1),
      })
    )
    .min(1),
});

export const searchFilterSchema = z.object({
  query: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"])
    .optional(),
  experienceLevel: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  isRemote: z.boolean().optional(),
  datePosted: z.enum(["TODAY", "WEEK", "MONTH", "ANY"]).default("ANY"),
  sortBy: z
    .enum(["RELEVANCE", "DATE", "SALARY", "RATING"])
    .default("RELEVANCE"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200),
});

export const dateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type JobPostingInput = z.infer<typeof jobPostingSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type ReferenceInput = z.infer<typeof referenceSchema>;
export type InterviewInput = z.infer<typeof interviewSchema>;
export type InterviewScoreInput = z.infer<typeof interviewScoreSchema>;
export type InterviewFeedbackInput = z.infer<typeof interviewFeedbackSchema>;
export type OfferInput = z.infer<typeof offerSchema>;
export type OnboardingTaskInput = z.infer<typeof onboardingTaskSchema>;
export type CommunicationInput = z.infer<typeof communicationSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ReportScheduleInput = z.infer<typeof reportScheduleSchema>;
export type TalentPoolInput = z.infer<typeof talentPoolSchema>;
export type SkillAssessmentInput = z.infer<typeof skillAssessmentSchema>;
export type SearchFilterInput = z.infer<typeof searchFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
