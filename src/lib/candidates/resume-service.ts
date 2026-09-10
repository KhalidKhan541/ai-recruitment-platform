import { prisma } from "@/lib/prisma";
import { ResumeMatchScore, ResumeParsedData } from "@/types/candidate";

// ─── Resume Service ──────────────────────────────────────────────────────────
// Handles resume upload, parsing, storage, skill extraction,
// job-candidate matching scoring, and document versioning.

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
  totalSize: number;
  averageSize: number;
  byMimeType: { mimeType: string; count: number; totalSize: number }[];
  parsedCount: number;
  unparsedCount: number;
  averageMatchScore: number;
}

export class ResumeService {
  // ─── Upload & Management ───────────────────────────────────────────────────

  async upload(input: ResumeUploadInput): Promise<Resume> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw new Error("Candidate not found");

    await prisma.candidateResume.updateMany({
      where: { candidateId: input.candidateId, status: "current" },
      data: { status: "outdated" },
    });

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
      },
    });

    return this.formatResume(resume);
  }

  async getById(resumeId: string): Promise<Resume | null> {
    const resume = await prisma.candidateResume.findUnique({
      where: { id: resumeId },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return resume ? this.formatResume(resume) : null;
  }

  async getByCandidate(candidateId: string): Promise<Resume[]> {
    const resumes = await prisma.candidateResume.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: "desc" },
    });
    return resumes.map((r) => this.formatResume(r));
  }

  async getCurrentResume(candidateId: string): Promise<Resume | null> {
    const resume = await prisma.candidateResume.findFirst({
      where: { candidateId, status: "current" },
    });
    return resume ? this.formatResume(resume) : null;
  }

  async delete(resumeId: string): Promise<void> {
    const existing = await prisma.candidateResume.findUnique({ where: { id: resumeId } });
    if (!existing) throw new Error("Resume not found");

    await prisma.candidateResume.delete({ where: { id: resumeId } });

    if (existing.status === "current") {
      const mostRecent = await prisma.candidateResume.findFirst({
        where: { candidateId: existing.candidateId },
        orderBy: { uploadedAt: "desc" },
      });
      if (mostRecent) {
        await prisma.candidateResume.update({
          where: { id: mostRecent.id },
          data: { status: "current" },
        });
      }
    }
  }

  async setStatus(resumeId: string, status: "current" | "outdated" | "in_review"): Promise<Resume> {
    const existing = await prisma.candidateResume.findUnique({ where: { id: resumeId } });
    if (!existing) throw new Error("Resume not found");

    if (status === "current") {
      await prisma.candidateResume.updateMany({
        where: { candidateId: existing.candidateId, status: "current", id: { not: resumeId } },
        data: { status: "outdated" },
      });
    }

    const updated = await prisma.candidateResume.update({ where: { id: resumeId }, data: { status } });
    return this.formatResume(updated);
  }

  // ─── Parsing ───────────────────────────────────────────────────────────────

  async parseResume(input: ParseResumeInput): Promise<Resume> {
    const existing = await prisma.candidateResume.findUnique({ where: { id: input.resumeId } });
    if (!existing) throw new Error("Resume not found");

    const updated = await prisma.candidateResume.update({
      where: { id: input.resumeId },
      data: {
        parsedContent: input.content,
        parsedData: JSON.stringify(input.parsedData),
        lastParsedAt: new Date(),
      },
    });

    if (input.parsedData.skills?.length) {
      const candidateId = existing.candidateId;
      const existingSkills = await prisma.candidateSkill.findMany({ where: { candidateId } });
      const existingNames = new Set(existingSkills.map((s) => s.skillName));
      const newSkills = input.parsedData.skills.filter((s) => !existingNames.has(s));

      if (newSkills.length > 0) {
        await prisma.candidateSkill.createMany({
          data: newSkills.map((skill) => ({
            candidateId,
            skillName: skill,
            level: "INTERMEDIATE",
            isVerified: false,
            endorsements: 0,
          })),
        });
      }
    }

    return this.formatResume(updated);
  }

  async getUnparsedResumes(limit = 50): Promise<Resume[]> {
    const resumes = await prisma.candidateResume.findMany({
      where: { parsedContent: null, status: "current" },
      orderBy: { uploadedAt: "asc" },
      take: limit,
    });
    return resumes.map((r) => this.formatResume(r));
  }

  async getResumeContent(resumeId: string): Promise<string | null> {
    const resume = await prisma.candidateResume.findUnique({
      where: { id: resumeId },
      select: { parsedContent: true },
    });
    return resume?.parsedContent ?? null;
  }

  // ─── Job-Candidate Matching ────────────────────────────────────────────────

  async matchJob(input: MatchJobInput): Promise<ResumeMatchScore> {
    const resume = await prisma.candidateResume.findUnique({
      where: { id: input.resumeId },
      include: {
        candidate: { include: { skills: true } },
      },
    });
    if (!resume) throw new Error("Resume not found");
    if (!resume.parsedData) throw new Error("Resume has not been parsed yet");

    const parsedData: ResumeParsedData = typeof resume.parsedData === "string"
      ? JSON.parse(resume.parsedData) : resume.parsedData;

    const candidateSkills = new Set([
      ...parsedData.skills.map((s) => s.toLowerCase()),
      ...(resume.candidate.skills ?? []).map((s) => s.skillName.toLowerCase()),
    ]);

    const matchedSkills = input.requiredSkills.filter((skill) => candidateSkills.has(skill.toLowerCase()));
    const skillsMatch = input.requiredSkills.length > 0
      ? Math.round((matchedSkills.length / input.requiredSkills.length) * 100) : 100;

    const totalYears = (parsedData.experience ?? []).reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    }, 0);

    const experienceMatch = Math.min(100, Math.round((totalYears / Math.max(input.requiredExperience, 1)) * 100));

    let educationMatch = 100;
    if (input.requiredEducation) {
      const levelMap: Record<string, number> = { "high school": 1, associate: 2, bachelor: 3, master: 4, phd: 5 };
      const requiredLevel = Object.entries(levelMap).find(([k]) => input.requiredEducation!.toLowerCase().includes(k))?.[1] ?? 3;
      const degrees = (parsedData.education ?? []).map((e) => e.degree.toLowerCase());
      const highest = Math.max(...degrees.map((d) => Object.entries(levelMap).find(([k]) => d.includes(k))?.[1] ?? 0), 0);
      educationMatch = highest >= requiredLevel ? 100 : Math.round((highest / requiredLevel) * 100);
    }

    let locationMatch = 100;
    if (input.preferredLocation) {
      const loc = (resume.candidate as any).location?.toLowerCase() ?? "";
      const city = (resume.candidate as any).city?.toLowerCase() ?? "";
      const target = input.preferredLocation.toLowerCase();
      if (loc.includes(target) || city.includes(target)) locationMatch = 100;
      else locationMatch = 40;
    }

    let salaryMatch = 100;
    if (input.salaryRange) {
      const prefs = resume.candidate.preferences;
      if (prefs) {
        const p = typeof prefs === "string" ? JSON.parse(prefs) : prefs;
        if (p.desiredSalary) {
          const mid = (p.desiredSalary.min + p.desiredSalary.max) / 2;
          const jobMid = (input.salaryRange.min + input.salaryRange.max) / 2;
          salaryMatch = Math.max(0, Math.round((1 - Math.abs(mid - jobMid) / jobMid) * 100));
        }
      }
    }

    const overallScore = Math.round(skillsMatch * 0.35 + experienceMatch * 0.30 + educationMatch * 0.15 + locationMatch * 0.10 + salaryMatch * 0.10);

    const matchScore: ResumeMatchScore = {
      jobId: input.jobId, jobTitle: input.jobTitle, overallScore, skillsMatch, experienceMatch, educationMatch, locationMatch, salaryMatch, scoredAt: new Date(),
    };

    const currentScores: ResumeMatchScore[] = typeof resume.matchScores === "string"
      ? JSON.parse(resume.matchScores as string || "[]") : resume.matchScores ?? [];

    const idx = currentScores.findIndex((s) => s.jobId === input.jobId);
    if (idx >= 0) currentScores[idx] = matchScore;
    else currentScores.push(matchScore);

    await prisma.candidateResume.update({ where: { id: input.resumeId }, data: { matchScores: JSON.stringify(currentScores) } });

    const application = await prisma.application.findFirst({
      where: { candidateId: resume.candidateId, jobId: input.jobId },
    });
    if (application) {
      await prisma.application.update({ where: { id: application.id }, data: { matchScore: overallScore } });
    }

    return matchScore;
  }

  async getMatchScores(resumeId: string): Promise<ResumeMatchScore[]> {
    const resume = await prisma.candidateResume.findUnique({ where: { id: resumeId }, select: { matchScores: true } });
    if (!resume) throw new Error("Resume not found");
    return typeof resume.matchScores === "string" ? JSON.parse(resume.matchScores as string || "[]") : resume.matchScores ?? [];
  }

  async getTopMatchesForJob(
    jobId: string, jobTitle: string, requiredSkills: string[],
    requiredExperience: number, requiredEducation: string | null,
    preferredLocation: string | null, salaryRange: { min: number; max: number } | null,
    limit = 20
  ): Promise<{ resumeId: string; candidateId: string; score: ResumeMatchScore }[]> {
    const resumes = await prisma.candidateResume.findMany({
      where: { status: "current", parsedContent: { not: null } },
      include: { candidate: { include: { skills: true } } },
    });

    const scored: { resumeId: string; candidateId: string; score: ResumeMatchScore }[] = [];

    for (const resume of resumes) {
      try {
        const score = await this.matchJob({
          resumeId: resume.id, jobId, jobTitle, requiredSkills,
          requiredExperience, requiredEducation, preferredLocation, salaryRange,
        });
        scored.push({ resumeId: resume.id, candidateId: resume.candidateId, score });
      } catch { continue; }
    }

    return scored.sort((a, b) => b.score.overallScore - a.score.overallScore).slice(0, limit);
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  async bulkDelete(resumeIds: string[]): Promise<number> {
    const result = await prisma.candidateResume.deleteMany({ where: { id: { in: resumeIds } } });
    return result.count;
  }

  async getAll(firmId: string, filters?: ResumeFilter, page = 1, limit = 20): Promise<{ resumes: Resume[]; total: number }> {
    const where: Record<string, unknown> = { candidate: { firmId } };
    if (filters) {
      if (filters.candidateId) where.candidateId = filters.candidateId;
      if (filters.status?.length) where.status = { in: filters.status };
      if (filters.mimeType?.length) where.mimeType = { in: filters.mimeType };
      if (filters.dateRange) where.uploadedAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };
    }

    const skip = (page - 1) * limit;
    const [resumes, total] = await Promise.all([
      prisma.candidateResume.findMany({ where, skip, take: limit, orderBy: { uploadedAt: "desc" } }),
      prisma.candidateResume.count({ where }),
    ]);
    return { resumes: resumes.map((r) => this.formatResume(r)), total };
  }

  async getStats(firmId: string): Promise<ResumeStats> {
    const [totalResumes, sizeAgg, byMimeType, parsedCount] = await Promise.all([
      prisma.candidateResume.count({ where: { candidate: { firmId } } }),
      prisma.candidateResume.aggregate({ where: { candidate: { firmId } }, _sum: { size: true }, _avg: { size: true } }),
      prisma.candidateResume.groupBy({ by: ["mimeType"], where: { candidate: { firmId } }, _count: true, _sum: { size: true } }),
      prisma.candidateResume.count({ where: { candidate: { firmId }, parsedContent: { not: null } } }),
    ]);

    return {
      totalResumes,
      totalSize: Number(sizeAgg._sum.size ?? 0),
      averageSize: Number(sizeAgg._avg.size ?? 0),
      byMimeType: byMimeType.map((m) => ({ mimeType: m.mimeType, count: m._count, totalSize: Number(m._sum.size ?? 0) })),
      parsedCount,
      unparsedCount: totalResumes - parsedCount,
      averageMatchScore: 0,
    };
  }

  private formatResume(resume: any): Resume {
    return {
      id: resume.id,
      candidateId: resume.candidateId,
      fileName: resume.fileName,
      originalName: resume.originalName,
      url: resume.url,
      storageKey: resume.storageKey,
      mimeType: resume.mimeType,
      size: resume.size,
      status: resume.status,
      parsedContent: resume.parsedContent,
      parsedData: resume.parsedData ? (typeof resume.parsedData === "string" ? JSON.parse(resume.parsedData) : resume.parsedData) : null,
      matchScores: typeof resume.matchScores === "string" ? JSON.parse(resume.matchScores || "[]") : resume.matchScores ?? [],
      uploadedAt: resume.uploadedAt,
      lastParsedAt: resume.lastParsedAt,
    };
  }
}

export const resumeService = new ResumeService();
