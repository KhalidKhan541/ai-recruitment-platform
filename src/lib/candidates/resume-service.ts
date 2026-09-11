import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { ResumeMatchScore, ResumeParsedData } from "@/types/candidate";

// ─── Resume Service ──────────────────────────────────────────────────────────
// Handles resume upload, parsing, storage, skill extraction,
// job-candidate matching scoring, document versioning, and ATS optimization.

export interface Resume {
  id: string;
  candidateId: string;
  fileName: string;
  originalName: string;
  url: string;
  storageKey: string;
  mimeType: string;
  size: number;
  status: "current" | "outdated" | "in_review";
  parsedContent: string | null;
  parsedData: ResumeParsedData | null;
  matchScores: ResumeMatchScore[];
  uploadedAt: Date;
  lastParsedAt: Date | null;
}

export interface ResumeUploadInput {
  candidateId: string;
  fileName: string;
  originalName: string;
  url: string;
  storageKey: string;
  mimeType: string;
  size: number;
}

export interface ParseResumeInput {
  resumeId: string;
  content: string;
  parsedData: ResumeParsedData;
}

export interface MatchJobInput {
  resumeId: string;
  jobId: string;
  jobTitle: string;
  requiredSkills: string[];
  requiredExperience: number;
  requiredEducation: string | null;
  preferredLocation: string | null;
  salaryRange: { min: number; max: number } | null;
}

export interface ResumeFilter {
  candidateId?: string;
  status?: ("current" | "outdated" | "in_review")[];
  mimeType?: string[];
  dateRange?: { start: Date; end: Date };
}

export interface ResumeStats {
  totalResumes: number;
  parsedCount: number;
  unparsedCount: number;
  averageSize: number;
  byMimeType: { mimeType: string; count: number }[];
  matchScoreDistribution: { range: string; count: number }[];
}

export interface ATSAnalysis {
  score: number;
  keywords: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  recommendations: string[];
  sections: {
    contact: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
  };
}

export class ResumeService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async upload(input: ResumeUploadInput): Promise<Resume> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw AppError.notFound("Candidate");

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(input.mimeType)) {
      throw AppError.badRequest(
        "Invalid file type. Accepted formats: PDF, DOC, DOCX, TXT"
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (input.size > maxSize) {
      throw AppError.badRequest("File size must be less than 10MB");
    }

    const currentResume = await prisma.candidateResume.findFirst({
      where: { candidateId: input.candidateId, status: "current" },
    });
    if (currentResume) {
      await prisma.candidateResume.update({
        where: { id: currentResume.id },
        data: { status: "outdated" },
      });
    }

    const resume = await prisma.candidateResume.create({
      data: {
        candidateId: input.candidateId,
        fileName: input.fileName,
        originalName: input.originalName,
        url: input.url,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        size: input.size,
        status: "current",
        parsedContent: null,
        parsedData: null,
      },
    });

    return this.formatResume(resume);
  }

  async getById(resumeId: string): Promise<Resume | null> {
    const resume = await prisma.candidateResume.findUnique({
      where: { id: resumeId },
    });
    return resume ? this.formatResume(resume) : null;
  }

  async getByIdOrThrow(resumeId: string): Promise<Resume> {
    const resume = await this.getById(resumeId);
    if (!resume) throw AppError.notFound("Resume");
    return resume;
  }

  async getByCandidate(candidateId: string): Promise<Resume[]> {
    const resumes = await prisma.candidateResume.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });
    return resumes.map((r) => this.formatResume(r));
  }

  async getCurrentResume(candidateId: string): Promise<Resume | null> {
    const resume = await prisma.candidateResume.findFirst({
      where: { candidateId, status: "current" },
    });
    return resume ? this.formatResume(resume) : null;
  }

  async getAll(
    firmId: string,
    filters?: ResumeFilter,
    page = 1,
    limit = 20
  ): Promise<{ resumes: Resume[]; total: number }> {
    const where = this.buildWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      prisma.candidateResume.findMany({
        where,
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidateResume.count({ where }),
    ]);

    return {
      resumes: resumes.map((r) => this.formatResume(r)),
      total,
    };
  }

  async delete(resumeId: string): Promise<void> {
    const resume = await this.getByIdOrThrow(resumeId);

    await prisma.resumeMatchScore.deleteMany({ where: { resumeId } });
    await prisma.candidateResume.delete({ where: { id: resumeId } });

    if (resume.status === "current") {
      const nextResume = await prisma.candidateResume.findFirst({
        where: { candidateId: resume.candidateId },
        orderBy: { createdAt: "desc" },
      });
      if (nextResume) {
        await prisma.candidateResume.update({
          where: { id: nextResume.id },
          data: { status: "current" },
        });
      }
    }
  }

  async setAsCurrent(resumeId: string): Promise<Resume> {
    const resume = await this.getByIdOrThrow(resumeId);

    await prisma.candidateResume.updateMany({
      where: { candidateId: resume.candidateId, status: "current" },
      data: { status: "outdated" },
    });

    const updated = await prisma.candidateResume.update({
      where: { id: resumeId },
      data: { status: "current" },
    });

    return this.formatResume(updated);
  }

  // ─── Parsing ───────────────────────────────────────────────────────────────

  async parseResume(input: ParseResumeInput): Promise<Resume> {
    const resume = await this.getByIdOrThrow(input.resumeId);

    const updated = await prisma.candidateResume.update({
      where: { id: input.resumeId },
      data: {
        parsedContent: input.content,
        parsedData: JSON.stringify(input.parsedData),
        lastParsedAt: new Date(),
      },
    });

    if (input.parsedData.skills && input.parsedData.skills.length > 0) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: resume.candidateId },
        include: { skills: true },
      });

      if (candidate) {
        const existingSkills = new Set(
          candidate.skills.map((s) => s.skillName.toLowerCase())
        );
        const newSkills = input.parsedData.skills.filter(
          (s) => !existingSkills.has(s.name.toLowerCase())
        );

        if (newSkills.length > 0) {
          await prisma.candidateSkill.createMany({
            data: newSkills.map((skill) => ({
              candidateId: resume.candidateId,
              skillName: skill.name,
              level: skill.level ?? "BEGINNER",
              isVerified: false,
              endorsements: 0,
            })),
          });
        }
      }
    }

    return this.formatResume(updated);
  }

  // ─── Matching ──────────────────────────────────────────────────────────────

  async matchWithJob(input: MatchJobInput): Promise<ResumeMatchScore> {
    const resume = await this.getByIdOrThrow(input.resumeId);

    const parsedData = resume.parsedData as ResumeParsedData | null;
    const candidateSkills = parsedData?.skills?.map((s) => s.name.toLowerCase()) ?? [];

    const requiredSkillsLower = input.requiredSkills.map((s) => s.toLowerCase());
    const matchedSkills = candidateSkills.filter((s) =>
      requiredSkillsLower.some((r) => s.includes(r) || r.includes(s))
    );
    const missingSkills = requiredSkillsLower.filter(
      (r) => !candidateSkills.some((s) => s.includes(r) || r.includes(s))
    );

    const skillMatchPercent =
      requiredSkillsLower.length > 0
        ? Math.round((matchedSkills.length / requiredSkillsLower.length) * 100)
        : 100;

    const candidateExp = parsedData?.totalExperience ?? 0;
    const expMatchPercent =
      input.requiredExperience > 0
        ? Math.min(100, Math.round((candidateExp / input.requiredExperience) * 100))
        : 100;

    const candidateEducation = parsedData?.education?.[0]?.level ?? null;
    const educationLevels = ["high_school", "associate", "bachelor", "master", "doctorate"];
    const candidateEduIndex = candidateEducation
      ? educationLevels.indexOf(candidateEducation.toLowerCase())
      : -1;
    const requiredEduIndex = input.requiredEducation
      ? educationLevels.indexOf(input.requiredEducation.toLowerCase())
      : 0;
    const educationMatchPercent =
      candidateEduIndex >= requiredEduIndex ? 100 : 50;

    const locationMatchPercent =
      !input.preferredLocation || !parsedData?.location
        ? 100
        : parsedData.location.toLowerCase().includes(input.preferredLocation.toLowerCase())
          ? 100
          : resume.parsedContent?.toLowerCase().includes("remote")
            ? 80
            : 30;

    const overallScore = Math.round(
      skillMatchPercent * 0.4 +
      expMatchPercent * 0.3 +
      educationMatchPercent * 0.15 +
      locationMatchPercent * 0.15
    );

    const existingScore = await prisma.resumeMatchScore.findFirst({
      where: { resumeId: input.resumeId, jobId: input.jobId },
    });

    let matchScore: ResumeMatchScore;
    if (existingScore) {
      const updated = await prisma.resumeMatchScore.update({
        where: { id: existingScore.id },
        data: {
          overallScore,
          skillMatchScore: skillMatchPercent,
          experienceMatchScore: expMatchPercent,
          educationMatchScore: educationMatchPercent,
          locationMatchScore: locationMatchPercent,
          matchedSkills: JSON.stringify(matchedSkills),
          missingSkills: JSON.stringify(missingSkills),
        },
      });
      matchScore = this.formatMatchScore(updated);
    } else {
      const created = await prisma.resumeMatchScore.create({
        data: {
          resumeId: input.resumeId,
          jobId: input.jobId,
          overallScore,
          skillMatchScore: skillMatchPercent,
          experienceMatchScore: expMatchPercent,
          educationMatchScore: educationMatchPercent,
          locationMatchScore: locationMatchPercent,
          matchedSkills: JSON.stringify(matchedSkills),
          missingSkills: JSON.stringify(missingSkills),
        },
      });
      matchScore = this.formatMatchScore(created);
    }

    return matchScore;
  }

  async getMatchScores(resumeId: string): Promise<ResumeMatchScore[]> {
    const scores = await prisma.resumeMatchScore.findMany({
      where: { resumeId },
      orderBy: { overallScore: "desc" },
    });
    return scores.map((s) => this.formatMatchScore(s));
  }

  // ─── ATS Analysis ──────────────────────────────────────────────────────────

  async analyzeATS(
    resumeId: string,
    targetKeywords: string[] = []
  ): Promise<ATSAnalysis> {
    const resume = await this.getByIdOrThrow(resumeId);
    const content = resume.parsedContent ?? "";
    const parsedData = resume.parsedData as ResumeParsedData | null;

    const contentLower = content.toLowerCase();
    const foundKeywords = targetKeywords.filter((kw) =>
      contentLower.includes(kw.toLowerCase())
    );
    const missingKeywords = targetKeywords.filter(
      (kw) => !contentLower.includes(kw.toLowerCase())
    );

    const formattingIssues: string[] = [];
    if (content.includes("\t")) formattingIssues.push("Contains tab characters");
    if (content.length > 10000) formattingIssues.push("Resume may be too long");
    if (!content.includes("@")) formattingIssues.push("No email address detected");
    if (!/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(content)) {
      formattingIssues.push("No phone number detected");
    }

    const sections = {
      contact: !!(contentLower.includes("email") || contentLower.includes("@")),
      summary: !!(
        contentLower.includes("summary") ||
        contentLower.includes("objective") ||
        contentLower.includes("profile")
      ),
      experience: !!(
        contentLower.includes("experience") ||
        contentLower.includes("employment") ||
        contentLower.includes("work history")
      ),
      education: !!(
        contentLower.includes("education") ||
        contentLower.includes("university") ||
        contentLower.includes("degree")
      ),
      skills: !!(
        contentLower.includes("skills") ||
        contentLower.includes("technologies") ||
        contentLower.includes("competencies")
      ),
    };

    const sectionsPresent = Object.values(sections).filter(Boolean).length;
    const keywordScore = targetKeywords.length > 0
      ? Math.round((foundKeywords.length / targetKeywords.length) * 100)
      : 70;
    const sectionScore = Math.round((sectionsPresent / 5) * 100);
    const formattingScore = Math.max(0, 100 - formattingIssues.length * 15);
    const overallScore = Math.round(
      keywordScore * 0.4 + sectionScore * 0.35 + formattingScore * 0.25
    );

    const recommendations: string[] = [];
    if (missingKeywords.length > 0) {
      recommendations.push(
        `Add these keywords: ${missingKeywords.slice(0, 5).join(", ")}`
      );
    }
    if (!sections.summary) recommendations.push("Add a professional summary section");
    if (!sections.skills) recommendations.push("Add a dedicated skills section");
    if (formattingIssues.includes("Resume may be too long")) {
      recommendations.push("Keep resume to 2 pages or less");
    }

    return {
      score: overallScore,
      keywords: foundKeywords,
      missingKeywords,
      formattingIssues,
      recommendations,
      sections,
    };
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<ResumeStats> {
    const where = {
      candidate: { firmId },
    };

    const [total, parsedCount, byMimeType, avgSize] = await Promise.all([
      prisma.candidateResume.count({ where }),
      prisma.candidateResume.count({
        where: { ...where, parsedContent: { not: null } },
      }),
      prisma.candidateResume.groupBy({
        by: ["mimeType"],
        where,
        _count: true,
      }),
      prisma.candidateResume.aggregate({
        where,
        _avg: { size: true },
      }),
    ]);

    const matchScores = await prisma.resumeMatchScore.groupBy({
      by: ["resumeId"],
      where: { resume: { candidate: { firmId } } },
      _avg: { overallScore: true },
    });

    const distribution = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];

    for (const ms of matchScores) {
      const score = ms._avg.overallScore ?? 0;
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    }

    return {
      totalResumes: total,
      parsedCount,
      unparsedCount: total - parsedCount,
      averageSize: avgSize._avg.size ?? 0,
      byMimeType: byMimeType.map((m) => ({
        mimeType: m.mimeType,
        count: m._count,
      })),
      matchScoreDistribution: distribution,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: ResumeFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      candidate: { firmId, isActive: true },
    };

    if (!filters) return where;

    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.mimeType && filters.mimeType.length > 0) {
      where.mimeType = { in: filters.mimeType };
    }
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  private formatResume(raw: any): Resume {
    return {
      id: raw.id,
      candidateId: raw.candidateId,
      fileName: raw.fileName,
      originalName: raw.originalName,
      url: raw.url,
      storageKey: raw.storageKey,
      mimeType: raw.mimeType,
      size: raw.size,
      status: raw.status,
      parsedContent: raw.parsedContent,
      parsedData: raw.parsedData
        ? typeof raw.parsedData === "string"
          ? JSON.parse(raw.parsedData)
          : raw.parsedData
        : null,
      matchScores: [],
      uploadedAt: raw.createdAt,
      lastParsedAt: raw.lastParsedAt,
    };
  }

  private formatMatchScore(raw: any): ResumeMatchScore {
    return {
      id: raw.id,
      resumeId: raw.resumeId,
      jobId: raw.jobId,
      overallScore: raw.overallScore,
      skillMatchScore: raw.skillMatchScore,
      experienceMatchScore: raw.experienceMatchScore,
      educationMatchScore: raw.educationMatchScore,
      locationMatchScore: raw.locationMatchScore,
      matchedSkills: JSON.parse(raw.matchedSkills ?? "[]"),
      missingSkills: JSON.parse(raw.missingSkills ?? "[]"),
      createdAt: raw.createdAt,
    };
  }
}

export const resumeService = new ResumeService();
