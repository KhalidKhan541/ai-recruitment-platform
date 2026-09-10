// ─── Jobs Module ─────────────────────────────────────────────────────────────

export { jobService, JobService } from "./job-service";
export { applicationService, ApplicationService } from "./application-service";
export { interviewService, InterviewService } from "./interview-service";
export { offerService, OfferService } from "./offer-service";

// ─── Type Re-exports ────────────────────────────────────────────────────────

export type {
  CreateJobInput,
  UpdateJobInput,
  JobFilter,
  JobStats,
  JobRequiredSkill,
  ScreeningQuestion,
  JobSalary,
  JobBenefits,
  Job,
  JobWithDetails,
  JobApplicationSummary,
  ApplicationStatus,
  InterviewType,
  InterviewStatus,
  OfferStatus,
  SkillLevel,
  AssessmentStatus,
  JobStatus,
  JobType,
  JobExperienceLevel,
  Priority,
} from "@/types/job";

export type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationFilter,
  ApplicationStats,
} from "./application-service";

export type {
  CreateInterviewInput,
  UpdateInterviewInput,
  InterviewFilter,
  InterviewStats,
  Recommendation,
  InterviewSlot,
} from "./interview-service";

export type {
  CreateOfferInput,
  UpdateOfferInput,
  NegotiationInput,
  OfferFilter,
  OfferStats,
} from "./offer-service";

// ─── Combined Pipeline Helper ────────────────────────────────────────────────

import { jobService } from "./job-service";
import { applicationService } from "./application-service";
import { interviewService } from "./interview-service";
import { offerService } from "./offer-service";

export const recruitmentPipeline = {
  jobs: jobService,
  applications: applicationService,
  interviews: interviewService,
  offers: offerService,

  async getDashboardStats(firmId: string) {
    const [jobStats, applicationStats, interviewStats, offerStats] = await Promise.all([
      jobService.getStats(firmId),
      applicationService.getApplicationStats(firmId),
      interviewService.getStats(firmId),
      offerService.getStats(firmId),
    ]);

    return {
      jobs: jobStats,
      applications: applicationStats,
      interviews: interviewStats,
      offers: offerStats,
    };
  },
};
