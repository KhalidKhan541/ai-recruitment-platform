// ─── Candidates Module ───────────────────────────────────────────────────────

export { candidateService, CandidateService } from "./candidate-service";
export { resumeService, ResumeService } from "./resume-service";
export { skillService, SkillService } from "./skill-service";

// ─── Type Re-exports ────────────────────────────────────────────────────────

export type {
  Candidate,
  CandidateWithDetails,
  CandidateBasic,
  CandidateFilter,
  CandidateStats,
  CreateCandidateInput,
  UpdateCandidateInput,
  CandidateSkill,
  CandidateResume,
  CandidateCertification,
  CandidateAssessmentSummary,
  CandidateApplicationSummary,
  ResumeParsedData,
  ResumeMatchScore,
  CandidateStatus,
  SkillLevel as CandidateSkillLevel,
  AssessmentStatus as CandidateAssessmentStatus,
  CertificationStatus,
} from "@/types/candidate";

export type {
  Resume,
  ResumeUploadInput,
  ParseResumeInput,
  MatchJobInput,
  ResumeFilter,
  ResumeStats,
} from "./resume-service";

export type {
  SkillAssessment,
  SkillCertification,
  SkillEndorsement,
  SkillGap,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  CreateCertificationInput,
  UpdateCertificationInput,
  SkillAssessmentFilter,
  CertificationFilter,
  SkillStats,
} from "./skill-service";

// ─── Combined Profile Helper ────────────────────────────────────────────────

import { candidateService } from "./candidate-service";
import { resumeService } from "./resume-service";
import { skillService } from "./skill-service";

export const candidateProfile = {
  candidates: candidateService,
  resumes: resumeService,
  skills: skillService,

  async getFullProfile(candidateId: string) {
    const [candidate, resumes, assessments, certifications] = await Promise.all([
      candidateService.getById(candidateId),
      resumeService.getByCandidate(candidateId),
      skillService.getCandidateAssessments(candidateId),
      skillService.getCandidateCertifications(candidateId),
    ]);

    return {
      candidate,
      resumes,
      assessments,
      certifications,
    };
  },
};
