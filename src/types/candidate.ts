export type CandidateStatus =
  | "active"
  | "passive"
  | "not_interested"
  | "blacklisted"
  | "hired"
  | "archived";

export type ResumeStatus = "current" | "outdated" | "in_review";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type AssessmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "expired"
  | "failed";

export type CertificationStatus = "active" | "expired" | "pending" | "revoked";

export interface CandidateEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate: Date | null;
  gpa: number | null;
  honors: string[];
  activities: string[];
}

export interface CandidateExperience {
  company: string;
  title: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}

export interface CandidateProject {
  name: string;
  description: string;
  url: string | null;
  technologies: string[];
  startDate: Date;
  endDate: Date | null;
}

export interface CandidateLink {
  type: "linkedin" | "github" | "portfolio" | "website" | "twitter" | "other";
  url: string;
  label: string | null;
}

export interface CandidatePreferences {
  desiredSalary: {
    min: number;
    max: number;
    currency: string;
  } | null;
  desiredLocations: string[];
  isRemoteOnly: boolean;
  isWillingToRelocate: boolean;
  desiredJobTypes: string[];
  desiredIndustries: string[];
  earliestStartDate: Date | null;
  noticePeriodWeeks: number | null;
}

export interface Candidate extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  headline: string | null;
  summary: string | null;
  profileImage: string | null;
  status: CandidateStatus;
  source: string | null;
  referredBy: string | null;
  education: CandidateEducation[];
  experience: CandidateExperience[];
  skills: CandidateSkill[];
  projects: CandidateProject[];
  links: CandidateLink[];
  preferences: CandidatePreferences | null;
  tags: string[];
  notes: string | null;
  lastContactedAt: Date | null;
  lastActiveAt: Date | null;
  applicationCount: number;
  interviewCount: number;
  offerCount: number;
  metadata: Record<string, unknown> | null;
  firmId: string;
}

export interface CandidateWithDetails extends Candidate {
  resumes: CandidateResume[];
  applications: CandidateApplicationSummary[];
  certifications: CandidateCertification[];
  assessments: CandidateAssessmentSummary[];
  _count: {
    applications: number;
    interviews: number;
    offers: number;
  };
}

export interface CandidateBasic extends Pick<Candidate, "id" | "firstName" | "lastName" | "email" | "headline" | "profileImage" | "status"> {}

export interface CandidateSkill {
  skillName: string;
  level: SkillLevel;
  yearsExperience: number | null;
  lastUsed: Date | null;
  isVerified: boolean;
  endorsements: number;
}

export interface CandidateResume {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  storageKey: string;
  mimeType: string;
  size: number;
  status: ResumeStatus;
  parsedContent: string | null;
  parsedData: ResumeParsedData | null;
  matchScores: ResumeMatchScore[];
  uploadedAt: Date;
  lastParsedAt: Date | null;
  candidateId: string;
}

export interface ResumeParsedData {
  skills: string[];
  education: CandidateEducation[];
  experience: CandidateExperience[];
  certifications: string[];
  languages: string[];
  summary: string | null;
}

export interface ResumeMatchScore {
  jobId: string;
  jobTitle: string;
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  salaryMatch: number;
  scoredAt: Date;
}

export interface CandidateApplicationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  appliedAt: Date;
  matchScore: number | null;
}

export interface CandidateCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date | null;
  credentialId: string | null;
  credentialUrl: string | null;
  status: CertificationStatus;
  skills: string[];
}

export interface CandidateAssessmentSummary {
  id: string;
  name: string;
  score: number | null;
  maxScore: number;
  status: AssessmentStatus;
  completedAt: Date | null;
}

export interface CandidateFilter {
  status?: CandidateStatus[];
  location?: string[];
  skills?: string[];
  experienceLevel?: string[];
  education?: string[];
  source?: string[];
  tags?: string[];
  hasResume?: boolean;
  minMatchScore?: number;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface CandidateStats {
  totalCandidates: number;
  activeCandidates: number;
  newThisMonth: number;
  candidatesByStatus: Record<CandidateStatus, number>;
  topSkills: { skill: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  averageMatchScore: number;
}

export interface CreateCandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  city?: string;
  country?: string;
  timezone?: string;
  headline?: string;
  summary?: string;
  education?: CandidateEducation[];
  experience?: CandidateExperience[];
  skills?: CandidateSkill[];
  projects?: CandidateProject[];
  links?: CandidateLink[];
  preferences?: CandidatePreferences;
  tags?: string[];
  source?: string;
  referredBy?: string;
  firmId: string;
}

export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  city?: string;
  country?: string;
  timezone?: string;
  headline?: string;
  summary?: string;
  status?: CandidateStatus;
  education?: CandidateEducation[];
  experience?: CandidateExperience[];
  skills?: CandidateSkill[];
  projects?: CandidateProject[];
  links?: CandidateLink[];
  preferences?: CandidatePreferences;
  tags?: string[];
  notes?: string;
}
