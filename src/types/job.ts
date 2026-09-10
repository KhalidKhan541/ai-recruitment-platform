export type JobStatus =
  | "draft"
  | "open"
  | "on_hold"
  | "closed"
  | "archived"
  | "cancelled";

export type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary"
  | "remote"
  | "freelance";

export type JobExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive";

export type ApplicationStatus =
  | "submitted"
  | "screening"
  | "review"
  | "phone_interview"
  | "technical_interview"
  | "final_interview"
  | "offer_pending"
  | "offer_extended"
  | "offer_accepted"
  | "offer_declined"
  | "hired"
  | "rejected"
  | "withdrawn";

export type InterviewType =
  | "phone"
  | "video"
  | "onsite"
  | "technical"
  | "panel"
  | "cultural"
  | "executive";

export type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export type OfferStatus =
  | "draft"
  | "pending_approval"
  | "sent"
  | "negotiating"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn";

export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type AssessmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "expired";

export type Priority = "low" | "medium" | "high" | "urgent";

export type EmploymentType =
  | "permanent"
  | "temporary"
  | "contract"
  | "internship"
  | "apprenticeship";

export interface JobSalary {
  min: number;
  max: number;
  currency: string;
  period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  isNegotiable: boolean;
}

export interface JobBenefits {
  healthInsurance: boolean;
  dentalInsurance: boolean;
  visionInsurance: boolean;
  retirementPlan: boolean;
  paidTimeOff: number;
  remoteWork: boolean;
  stockOptions: boolean;
  educationBudget: number | null;
  signingBonus: number | null;
  relocationAssistance: boolean;
  wellnessStipend: number | null;
  parentalLeave: number | null;
  customBenefits: string[];
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: "yes_no" | "text" | "number" | "multiple_choice";
  options: string[] | null;
  required: boolean;
  passingAnswer: string | null;
  weight: number;
}

export interface Job extends BaseEntity {
  title: string;
  department: string;
  team: string | null;
  location: string;
  isRemote: boolean;
  type: JobType;
  experienceLevel: JobExperienceLevel;
  employmentType: EmploymentType;
  description: string;
  requirements: string[];
  responsibilities: string[];
  niceToHaves: string[];
  salary: JobSalary | null;
  benefits: JobBenefits | null;
  requiredSkills: JobRequiredSkill[];
  screeningQuestions: ScreeningQuestion[];
  status: JobStatus;
  priority: Priority;
  headcount: number;
  filledCount: number;
  hiringManagerId: string;
  recruiterId: string;
  publishedAt: Date | null;
  closingDate: Date | null;
  filledAt: Date | null;
  applicationCount: number;
  viewCount: number;
  tags: string[];
  metadata: Record<string, unknown> | null;
  firmId: string;
}

export interface JobRequiredSkill {
  skillName: string;
  minimumLevel: SkillLevel;
  isRequired: boolean;
  yearsExperience: number | null;
}

export interface JobWithDetails extends Job {
  hiringManager: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  recruiter: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  applications: JobApplicationSummary[];
  _count: {
    applications: number;
    interviews: number;
  };
}

export interface JobApplicationSummary {
  id: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  appliedAt: Date;
  matchScore: number | null;
}

export interface JobFilter {
  status?: JobStatus[];
  type?: JobType[];
  experienceLevel?: JobExperienceLevel[];
  employmentType?: EmploymentType[];
  location?: string;
  isRemote?: boolean;
  department?: string;
  hiringManagerId?: string;
  recruiterId?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
  tags?: string[];
  hasOpenings?: boolean;
}

export interface JobStats {
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalApplications: number;
  averageTimeToFill: number;
  jobsByStatus: Record<JobStatus, number>;
  jobsByType: Record<JobType, number>;
  jobsByDepartment: { department: string; count: number }[];
  topSkills: { skill: string; demand: number }[];
  monthlyHires: { month: string; hires: number }[];
}

export interface CreateJobInput {
  title: string;
  department: string;
  team?: string;
  location: string;
  isRemote?: boolean;
  type: JobType;
  experienceLevel: JobExperienceLevel;
  employmentType: EmploymentType;
  description: string;
  requirements: string[];
  responsibilities: string[];
  niceToHaves?: string[];
  salary?: JobSalary;
  benefits?: JobBenefits;
  requiredSkills?: JobRequiredSkill[];
  screeningQuestions?: ScreeningQuestion[];
  priority?: Priority;
  headcount?: number;
  hiringManagerId: string;
  recruiterId?: string;
  closingDate?: Date;
  tags?: string[];
}

export interface UpdateJobInput {
  title?: string;
  department?: string;
  team?: string;
  location?: string;
  isRemote?: boolean;
  type?: JobType;
  experienceLevel?: JobExperienceLevel;
  employmentType?: EmploymentType;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  niceToHaves?: string[];
  salary?: JobSalary;
  benefits?: JobBenefits;
  requiredSkills?: JobRequiredSkill[];
  screeningQuestions?: ScreeningQuestion[];
  status?: JobStatus;
  priority?: Priority;
  headcount?: number;
  closingDate?: Date;
  tags?: string[];
}
