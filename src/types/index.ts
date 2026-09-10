import {
  UserRole,
  JobStatus,
  ApplicationStatus,
  InterviewStatus,
  OfferStatus,
  ResumeStatus,
  SkillLevel,
  ExperienceLevel,
  EducationLevel,
  CommunicationType,
  AssessmentType,
} from "@prisma/client";

// ─── Base Types ──────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export type { UserRole };

export interface User extends BaseEntity {
  email: string;
  name: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date | null;
  emailVerified?: Date | null;
  companyId?: string | null;
  company?: Company | null;
}

export interface UserWithoutPassword extends Omit<User, "passwordHash"> {}

export interface UserSession {
  user: UserWithoutPassword;
  expires: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  companyId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilter {
  role?: UserRole;
  isActive?: boolean;
  companyId?: string;
  search?: string;
}

// ─── Company Types ───────────────────────────────────────────────────────────

export type CompanySize = "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";

export type CompanyDocumentType =
  | "EMPLOYMENT_AGREEMENT"
  | "NDA"
  | "POLICY"
  | "CERTIFICATE"
  | "LICENSE"
  | "OTHER";

export interface Company extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: CompanySize | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  email?: string | null;
  isVerified: boolean;
  isActive: boolean;
  ownerId?: string | null;
  owner?: User | null;
  users?: User[];
  jobPostings?: JobPosting[];
  documents?: CompanyDocument[];
  _count?: {
    users: number;
    jobPostings: number;
    candidates: number;
  };
}

export interface CompanyDocument extends BaseEntity {
  name: string;
  type: CompanyDocumentType;
  fileUrl: string;
  expiresAt?: Date | null;
  companyId: string;
  company?: Company;
}

export interface CreateCompanyInput {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  logoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

// ─── Job Types ───────────────────────────────────────────────────────────────

export type { JobStatus };

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "FREELANCE";

export type { ExperienceLevel };
export type { EducationLevel };

export interface JobPosting extends BaseEntity {
  title: string;
  slug: string;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  department?: string | null;
  location: string;
  isRemote: boolean;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  educationLevel?: EducationLevel | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  vacancies: number;
  status: JobStatus;
  applicationDeadline?: Date | null;
  publishedAt?: Date | null;
  closedAt?: Date | null;
  screeningQuestions?: ScreeningQuestion[] | null;
  tags?: string[] | null;
  companyId: string;
  company?: Company;
  applications?: JobApplication[];
  interviews?: Interview[];
  offers?: Offer[];
  _count?: {
    applications: number;
    interviews: number;
  };
}

export interface ScreeningQuestion {
  question: string;
  type: "TEXT" | "YES_NO" | "NUMBER" | "SELECT";
  required: boolean;
  options?: string[];
}

export interface CreateJobInput {
  title: string;
  slug?: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  department?: string;
  location: string;
  isRemote?: boolean;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  educationLevel?: EducationLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  vacancies?: number;
  applicationDeadline?: Date;
  screeningQuestions?: ScreeningQuestion[];
  tags?: string[];
}

export interface JobFilter {
  status?: JobStatus;
  department?: string;
  location?: string;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  datePosted?: "TODAY" | "WEEK" | "MONTH" | "ANY";
  search?: string;
}

// ─── Application Types ───────────────────────────────────────────────────────

export type { ApplicationStatus };

export interface JobApplication extends BaseEntity {
  coverLetter?: string | null;
  status: ApplicationStatus;
  source?: string | null;
  referredById?: string | null;
  screeningAnswers?: ScreeningAnswer[] | null;
  notes?: string | null;
  rating?: number | null;
  rejectedReason?: string | null;
  jobId: string;
  job?: JobPosting;
  candidateId: string;
  candidate?: Candidate;
  screenings?: JobScreening[];
  interviews?: Interview[];
  offers?: Offer[];
}

export interface ScreeningAnswer {
  questionId: string;
  answer: string;
}

export interface CreateApplicationInput {
  jobId: string;
  coverLetter?: string;
  resumeId?: string;
  screeningAnswers?: ScreeningAnswer[];
  referredById?: string;
}

export interface ApplicationFilter {
  status?: ApplicationStatus;
  jobId?: string;
  candidateId?: string;
  rating?: number;
  search?: string;
}

// ─── Candidate Types ─────────────────────────────────────────────────────────

export interface Candidate extends BaseEntity {
  headline?: string | null;
  summary?: string | null;
  desiredSalary?: number | null;
  desiredSalaryCurrency: string;
  availableFrom?: Date | null;
  willingToRelocate: boolean;
  workPreference?: string | null;
  expectedExperienceLevel?: ExperienceLevel | null;
  profileCompleteness: number;
  isAvailable: boolean;
  linkedInUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  userId: string;
  user?: User;
  companyId?: string | null;
  company?: Company | null;
  resumes?: CandidateResume[];
  skills?: CandidateSkill[];
  experiences?: CandidateExperience[];
  educations?: CandidateEducation[];
  certifications?: CandidateCertification[];
  references?: CandidateReference[];
  notes?: CandidateNote[];
  applications?: JobApplication[];
  interviews?: Interview[];
  poolMemberships?: TalentPoolMember[];
  assessmentResults?: AssessmentResult[];
}

export interface CandidateResume extends BaseEntity {
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isDefault: boolean;
  status: ResumeStatus;
  parsedAt?: Date | null;
  candidateId: string;
  candidate?: Candidate;
  resumes?: Resume[];
}

export interface CandidateSkill extends BaseEntity {
  name: string;
  level: SkillLevel;
  yearsOfExperience?: number | null;
  endorsements: number;
  isVerified: boolean;
  candidateId: string;
}

export interface CandidateExperience extends BaseEntity {
  title: string;
  company: string;
  location?: string | null;
  employmentType?: EmploymentType | null;
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
  description?: string | null;
  achievements?: string[] | null;
  candidateId: string;
}

export interface CandidateEducation extends BaseEntity {
  institution: string;
  degree: EducationLevel | string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
  gpa?: number | null;
  description?: string | null;
  candidateId: string;
}

export interface CandidateCertification extends BaseEntity {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  candidateId: string;
}

export interface CandidateReference extends BaseEntity {
  name: string;
  title?: string | null;
  company?: string | null;
  email: string;
  phone?: string | null;
  relationship: string;
  canContact: boolean;
  candidateId: string;
}

export interface CandidateNote extends BaseEntity {
  content: string;
  authorId: string;
  candidateId: string;
}

export interface CandidateFilter {
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  location?: string;
  isAvailable?: boolean;
  workPreference?: string;
  salaryMin?: number;
  salaryMax?: number;
  search?: string;
}

// ─── Recruiter Types ─────────────────────────────────────────────────────────

export interface Recruiter extends BaseEntity {
  agencyName?: string | null;
  specialization?: string[] | null;
  yearsOfExperience?: number | null;
  placementRate?: number | null;
  totalPlacements: number;
  commissionRate?: number | null;
  isVerified: boolean;
  userId: string;
  user?: User;
  companyId?: string | null;
  company?: Company | null;
  pipelines?: RecruiterPipeline[];
  analytics?: RecruiterAnalytics[];
}

export interface RecruiterPipeline extends BaseEntity {
  stage: string;
  notes?: string | null;
  expectedCloseDate?: Date | null;
  recruiterId: string;
  recruiter?: Recruiter;
  jobId: string;
  job?: JobPosting;
  candidateId?: string | null;
  candidate?: Candidate | null;
}

export interface RecruiterAnalytics extends BaseEntity {
  period: string;
  totalPlacements: number;
  avgTimeToFill?: number | null;
  avgTimeToHire?: number | null;
  successRate?: number | null;
  totalRevenue?: number | null;
  metrics?: Record<string, any> | null;
  recruiterId: string;
}

// ─── Interview Types ─────────────────────────────────────────────────────────

export type { InterviewStatus };

export type InterviewType =
  | "PHONE_SCREEN"
  | "VIDEO"
  | "IN_PERSON"
  | "TECHNICAL"
  | "PANEL"
  | "VIRTUAL_ONSITE";

export interface Interview extends BaseEntity {
  type: InterviewType;
  title: string;
  description?: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  location?: string | null;
  meetingUrl?: string | null;
  status: InterviewStatus;
  notes?: string | null;
  completedAt?: Date | null;
  jobId: string;
  job?: JobPosting;
  applicationId?: string | null;
  application?: JobApplication | null;
  candidateId: string;
  candidate?: Candidate;
  panels?: InterviewPanel[];
  questions?: InterviewQuestion[];
  scores?: InterviewScore[];
  feedback?: InterviewFeedback[];
}

export interface InterviewPanel extends BaseEntity {
  role: string;
  userId: string;
  userName: string;
  interviewId: string;
}

export interface InterviewQuestion extends BaseEntity {
  question: string;
  category?: string | null;
  order: number;
  timeLimit?: number | null;
  interviewId: string;
  scores?: InterviewScore[];
}

export interface InterviewScore extends BaseEntity {
  score: number;
  comments?: string | null;
  interviewId: string;
  interviewerId: string;
  interviewerName: string;
  questionId?: string | null;
  question?: InterviewQuestion | null;
}

export interface InterviewFeedback extends BaseEntity {
  recommendation: string;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  notes?: string | null;
  wouldInterviewAgain?: boolean | null;
  interviewId: string;
  interviewerId: string;
  interviewerName: string;
}

export interface CreateInterviewInput {
  jobId: string;
  candidateId: string;
  type: InterviewType;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  interviewerIds: string[];
  notes?: string;
}

// ─── Resume Types ────────────────────────────────────────────────────────────

export type { ResumeStatus };

export interface Resume extends BaseEntity {
  rawText?: string | null;
  parsedData?: ParsedResume | null;
  skills?: string[] | null;
  experience?: ParsedExperience[] | null;
  education?: ParsedEducation[] | null;
  summary?: string | null;
  candidateResumeId: string;
  candidateResume?: CandidateResume;
  parsedAt?: Date | null;
  version: number;
  matches?: ResumeMatch[];
}

export interface ParsedResume {
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
  };
  summary?: string;
  skills?: string[];
  experience?: ParsedExperience[];
  education?: ParsedEducation[];
  certifications?: { name: string; issuer: string; date?: string }[];
  languages?: { name: string; proficiency: string }[];
}

export interface ParsedExperience {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  achievements?: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string;
  endDate?: string;
  gpa?: number;
}

export interface ResumeParse extends BaseEntity {
  status: string;
  rawText?: string | null;
  parsedData?: ParsedResume | null;
  error?: string | null;
  duration?: number | null;
  modelUsed?: string | null;
  candidateResumeId: string;
}

export interface ResumeMatch extends BaseEntity {
  score: number;
  breakdown?: MatchBreakdown | null;
  notes?: string | null;
  resumeId: string;
  resume?: Resume;
  candidateId: string;
  candidate?: Candidate;
}

export interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  keywords: number;
  overall: number;
}

// ─── Skill Assessment Types ──────────────────────────────────────────────────

export type { AssessmentType };

export interface SkillAssessment extends BaseEntity {
  title: string;
  description?: string | null;
  type: AssessmentType;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  questions: AssessmentQuestion[];
  results?: AssessmentResult[];
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "CODING" | "FILE_UPLOAD";
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface AssessmentResult extends BaseEntity {
  score: number;
  passed: boolean;
  answers: AssessmentAnswer[];
  duration?: number | null;
  completedAt?: Date | null;
  attempt: number;
  assessmentId: string;
  assessment?: SkillAssessment;
  candidateId: string;
  candidate?: Candidate;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points: number;
}

// ─── Offer Types ─────────────────────────────────────────────────────────────

export type { OfferStatus };

export type SalaryFrequency =
  | "HOURLY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "ANNUAL";

export type WorkArrangement = "REMOTE" | "ONSITE" | "HYBRID";

export interface Offer extends BaseEntity {
  status: OfferStatus;
  sentAt?: Date | null;
  viewedAt?: Date | null;
  respondedAt?: Date | null;
  declinedReason?: string | null;
  signedAt?: Date | null;
  signedDocumentUrl?: string | null;
  negotiationNotes?: string | null;
  jobId: string;
  job?: JobPosting;
  candidateId: string;
  candidate?: Candidate;
  jobOffer?: JobOffer | null;
  documents?: OfferDocument[];
  approvedById?: string | null;
}

export interface JobOffer extends BaseEntity {
  title: string;
  salary: number;
  salaryCurrency: string;
  salaryFrequency: SalaryFrequency;
  equityPercentage?: number | null;
  signingBonus?: number | null;
  relocationBonus?: number | null;
  startDate: Date;
  expirationDate: Date;
  employmentType: EmploymentType;
  workLocation: string;
  workArrangement: WorkArrangement;
  benefits?: string[] | null;
  terms?: string | null;
  notes?: string | null;
  status: OfferStatus;
  offerId?: string | null;
}

export interface OfferDocument extends BaseEntity {
  name: string;
  type: string;
  fileUrl: string;
  offerId: string;
}

export interface CreateOfferInput {
  jobId: string;
  candidateId: string;
  title: string;
  salary: number;
  salaryCurrency?: string;
  salaryFrequency: SalaryFrequency;
  equityPercentage?: number;
  signingBonus?: number;
  relocationBonus?: number;
  startDate: Date;
  expirationDate: Date;
  employmentType: EmploymentType;
  workLocation: string;
  workArrangement: WorkArrangement;
  benefits?: string[];
  terms?: string;
  notes?: string;
}

// ─── Talent Pool Types ───────────────────────────────────────────────────────

export interface TalentPool extends BaseEntity {
  name: string;
  description?: string | null;
  criteria?: PoolCriteria | null;
  tags?: string[] | null;
  members?: TalentPoolMember[];
  companyId: string;
  _count?: {
    members: number;
  };
}

export interface PoolCriteria {
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  location?: string;
  availableFrom?: Date;
}

export interface TalentPoolMember extends BaseEntity {
  status: string;
  addedById?: string | null;
  notes?: string | null;
  poolId: string;
  pool?: TalentPool;
  candidateId: string;
  candidate?: Candidate;
}

// ─── Communication Types ─────────────────────────────────────────────────────

export type { CommunicationType };

export interface Communication extends BaseEntity {
  subject: string;
  body: string;
  type: CommunicationType;
  status: string;
  readAt?: Date | null;
  sentAt?: Date | null;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  templateId?: string | null;
  template?: CommunicationTemplate | null;
  relatedType?: string | null;
  relatedId?: string | null;
}

export interface CommunicationTemplate extends BaseEntity {
  name: string;
  subject: string;
  body: string;
  type: CommunicationType;
  isActive: boolean;
  variables?: string[] | null;
  companyId?: string | null;
  company?: Company | null;
}

export interface SendCommunicationInput {
  toUserId: string;
  subject: string;
  body: string;
  type: CommunicationType;
  relatedType?: string;
  relatedId?: string;
  templateId?: string;
  scheduledAt?: Date;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string | null;
  userId: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  interviewReminders: boolean;
  applicationUpdates: boolean;
  newMessages: boolean;
  offerUpdates: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
}

// ─── Onboarding Types ────────────────────────────────────────────────────────

export type OnboardingTaskCategory =
  | "DOCUMENTATION"
  | "EQUIPMENT"
  | "TRAINING"
  | "COMPLIANCE"
  | "WELCOME"
  | "OTHER";

export interface OnboardingChecklist extends BaseEntity {
  title: string;
  description?: string | null;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  offerId: string;
  offer?: Offer;
  tasks?: OnboardingTask[];
  progress?: number;
}

export interface OnboardingTask extends BaseEntity {
  title: string;
  description?: string | null;
  category: OnboardingTaskCategory;
  dueDaysBeforeStart?: number | null;
  isRequired: boolean;
  order: number;
  isCompleted: boolean;
  completedAt?: Date | null;
  dueDate?: Date | null;
  checklistId: string;
  checklist?: OnboardingChecklist;
  assigneeId?: string | null;
  assignee?: User | null;
}

// ─── Audit Log Types ─────────────────────────────────────────────────────────

export interface AuditLog extends BaseEntity {
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
  user?: User;
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "IMPORT"
  | "APPROVE"
  | "REJECT"
  | "SEND"
  | "ARCHIVE";

// ─── Report Types ────────────────────────────────────────────────────────────

export type ReportType =
  | "PIPELINE"
  | "TIME_TO_FILL"
  | "SOURCE_EFFECTIVENESS"
  | "INTERVIEW_SCORES"
  | "OFFER_ACCEPTANCE"
  | "CANDIDATE_DEMOGRAPHICS"
  | "RECRUITER_PERFORMANCE"
  | "CUSTOM";

export type ReportFormat = "PDF" | "CSV" | "XLSX";

export interface Report extends BaseEntity {
  title: string;
  type: ReportType;
  dateRange: DateRange;
  filters?: Record<string, any> | null;
  groupBy?: string[] | null;
  result?: any;
  format: ReportFormat;
  fileUrl?: string | null;
  companyId: string;
  company?: Company;
  schedules?: ReportSchedule[];
}

export interface ReportSchedule extends BaseEntity {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
  recipients: string[];
  format: ReportFormat;
  isActive: boolean;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
  reportId: string;
  report?: Report;
}

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  applicationsThisWeek: number;
  totalCandidates: number;
  newCandidatesThisWeek: number;
  interviewsScheduled: number;
  interviewsThisWeek: number;
  offersPending: number;
  offersThisMonth: number;
  hiredThisMonth: number;
  timeToFill?: number;
  timeToHire?: number;
  offerAcceptanceRate?: number;
  sourceBreakdown?: SourceMetric[];
  pipelineBreakdown?: PipelineMetric[];
  topSkills?: SkillMetric[];
  departmentBreakdown?: DepartmentMetric[];
}

export interface SourceMetric {
  source: string;
  count: number;
  percentage: number;
}

export interface PipelineMetric {
  stage: string;
  count: number;
  value: number;
}

export interface SkillMetric {
  skill: string;
  count: number;
  demand: "LOW" | "MEDIUM" | "HIGH";
}

export interface DepartmentMetric {
  department: string;
  openPositions: number;
  totalApplications: number;
  hired: number;
}

export interface RecruitmentFunnel {
  totalApplicants: number;
  screened: number;
  interviewed: number;
  offered: number;
  hired: number;
  conversionRates: {
    screening: number;
    interview: number;
    offer: number;
    acceptance: number;
  };
}

// ─── Types Index ─────────────────────────────────────────────────────────────

export type { SearchFilterInput } from "./validators";

// ─── Utility Types ───────────────────────────────────────────────────────────

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredPick<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & {
  id: string;
};

export type Entity<T> = WithId<WithTimestamps<T>>;

export type Serializable<T> = {
  [P in keyof T]: T[P] extends Date
    ? string
    : T[P] extends Date | null
    ? string | null
    : T[P] extends object
    ? Serializable<T[P]>
    : T[P];
};
