import { prisma } from "@/lib/prisma";
import {
  ApplicationStatus,
  CandidateApplicationSummary,
} from "@/types/job";

// ─── Application Service ─────────────────────────────────────────────────────
// Manages the full lifecycle of job applications: submission, status
// transitions, internal notes, and pipeline stage tracking.

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  matchScore: number | null;
  screeningAnswers: Record<string, string> | null;
  screeningPassed: boolean | null;
  screeningScore: number | null;
  notes: ApplicationNote[];
  statusHistory: StatusHistoryEntry[];
  appliedAt: Date;
  lastStatusChangeAt: Date;
  rejectedAt: Date | null;
  rejectedReason: string | null;
  withdrawnAt: Date | null;
  withdrawnReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  isPrivate: boolean;
  createdAt: Date;
}

export interface StatusHistoryEntry {
  from: ApplicationStatus | null;
  to: ApplicationStatus;
  changedBy: string;
  changedByName: string;
  reason: string | null;
  timestamp: Date;
}

export interface CreateApplicationInput {
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  resumeUrl?: string;
  screeningAnswers?: Record<string, string>;
  firmId: string;
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  matchScore?: number;
  rejectedReason?: string;
  withdrawnReason?: string;
}

export interface ApplicationFilter {
  jobId?: string;
  candidateId?: string;
  status?: ApplicationStatus[];
  minMatchScore?: number;
  maxMatchScore?: number;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface ApplicationStats {
  totalApplications: number;
  byStatus: { status: ApplicationStatus; count: number }[];
  averageMatchScore: number;
  conversionRate: number;
  averageTimeInStage: { stage: string; avgDays: number }[];
  topJobs: { jobId: string; jobTitle: string; applicationCount: number }[];
}

export class ApplicationService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateApplicationInput): Promise<Application> {
    // Validate job exists and is open
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!job) throw new Error("Job not found");
    if (job.status !== "OPEN") throw new Error("Job is not accepting applications");

    // Check for duplicate application
    const existing = await prisma.application.findFirst({
      where: {
        jobId: input.jobId,
        candidateId: input.candidateId,
        isActive: true,
      },
    });
    if (existing) throw new Error("Candidate has already applied for this job");

    // Evaluate screening answers if provided
    let screeningPassed: boolean | null = null;
    let screeningScore: number | null = null;

    if (input.screeningAnswers && Object.keys(input.screeningAnswers).length > 0) {
      const questions = await prisma.screeningQuestion.findMany({
        where: { jobId: input.jobId },
      });

      const details = questions.map((q) => {
        const answer = input.screeningAnswers![q.id];
        if (!answer) return { passed: false, score: 0 };

        const passed = q.passingAnswer
          ? answer.toLowerCase().trim() === q.passingAnswer.toLowerCase().trim()
          : true;

        return {
          passed,
          score: passed ? q.weight : 0,
        };
      });

      const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
      const earnedWeight = details.reduce((sum, d) => sum + d.score, 0);
      screeningScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
      screeningPassed = details.every((d) => d.passed);
    }

    const application = await prisma.application.create({
      data: {
        jobId: input.jobId,
        candidateId: input.candidateId,
        status: screeningPassed === false ? "REJECTED" : "SUBMITTED",
        coverLetter: input.coverLetter ?? null,
        resumeUrl: input.resumeUrl ?? null,
        screeningAnswers: input.screeningAnswers ? JSON.stringify(input.screeningAnswers) : null,
        screeningPassed,
        screeningScore,
        lastStatusChangeAt: new Date(),
        statusHistory: JSON.stringify([
          {
            from: null,
            to: "SUBMITTED",
            changedBy: input.candidateId,
            changedByName: "System",
            reason: "Application submitted",
            timestamp: new Date().toISOString(),
          },
        ]),
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Increment job application count
    await prisma.job.update({
      where: { id: input.jobId },
      data: { applicationCount: { increment: 1 } },
    });

    // Increment candidate application count
    await prisma.candidate.update({
      where: { id: input.candidateId },
      data: { applicationCount: { increment: 1 } },
    });

    return this.formatApplication(application);
  }

  async getById(applicationId: string): Promise<Application | null> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { id: true, title: true, department: true, location: true } },
        candidate: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            phone: true, headline: true, profileImage: true,
          },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return application ? this.formatApplication(application) : null;
  }

  async getAll(
    firmId: string,
    filters?: ApplicationFilter,
    page = 1,
    limit = 20
  ): Promise<{ applications: Application[]; total: number }> {
    const where = this.buildWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: { select: { id: true, title: true, department: true } },
          candidate: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              profileImage: true,
            },
          },
          notes: {
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications: applications.map((a) => this.formatApplication(a)),
      total,
    };
  }

  async getByJob(
    jobId: string,
    page = 1,
    limit = 20
  ): Promise<{ applications: Application[]; total: number }> {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: { jobId, isActive: true },
        include: {
          candidate: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              profileImage: true, headline: true,
            },
          },
          notes: {
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: [
          { matchScore: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.application.count({ where: { jobId, isActive: true } }),
    ]);

    return {
      applications: applications.map((a) => this.formatApplication(a)),
      total,
    };
  }

  async getByCandidate(candidateId: string): Promise<Application[]> {
    const applications = await prisma.application.findMany({
      where: { candidateId, isActive: true },
      include: {
        job: {
          select: {
            id: true, title: true, department: true, location: true,
            status: true, type: true, experienceLevel: true,
          },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return applications.map((a) => this.formatApplication(a));
  }

  async update(applicationId: string, input: UpdateApplicationInput): Promise<Application> {
    const existing = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!existing) throw new Error("Application not found");

    const data: Record<string, unknown> = {};
    const history: StatusHistoryEntry[] = JSON.parse(existing.statusHistory as string || "[]");

    if (input.status !== undefined && input.status !== existing.status) {
      data.status = input.status;
      data.lastStatusChangeAt = new Date();

      history.push({
        from: existing.status,
        to: input.status,
        changedBy: "system",
        changedByName: "System",
        reason: input.rejectedReason ?? input.withdrawnReason ?? null,
        timestamp: new Date().toISOString(),
      });

      if (input.status === "REJECTED") {
        data.rejectedAt = new Date();
        data.rejectedReason = input.rejectedReason ?? null;
      }
      if (input.status === "WITHDRAWN") {
        data.withdrawnAt = new Date();
        data.withdrawnReason = input.withdrawnReason ?? null;
      }
      if (input.status === "HIRED") {
        await prisma.candidate.update({
          where: { id: existing.candidateId },
          data: { status: "HIRED" },
        });
        await prisma.job.update({
          where: { id: existing.jobId },
          data: { filledCount: { increment: 1 } },
        });
      }
    }

    if (input.coverLetter !== undefined) data.coverLetter = input.coverLetter;
    if (input.resumeUrl !== undefined) data.resumeUrl = input.resumeUrl;
    if (input.matchScore !== undefined) data.matchScore = input.matchScore;
    data.statusHistory = JSON.stringify(history);

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data,
      include: {
        job: { select: { id: true, title: true, department: true } },
        candidate: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            profileImage: true, headline: true,
          },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return this.formatApplication(updated);
  }

  async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    changedBy: string,
    changedByName: string,
    reason?: string
  ): Promise<Application> {
    return this.update(applicationId, {
      status: newStatus,
      rejectedReason: reason,
    });
  }

  async delete(applicationId: string): Promise<void> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) throw new Error("Application not found");

    await prisma.application.delete({ where: { id: applicationId } });

    await prisma.job.update({
      where: { id: existing.jobId },
      data: { applicationCount: { decrement: 1 } },
    });

    await prisma.candidate.update({
      where: { id: existing.candidateId },
      data: { applicationCount: { decrement: 1 } },
    });
  }

  // ─── Notes ─────────────────────────────────────────────────────────────────

  async addNote(
    applicationId: string,
    authorId: string,
    authorName: string,
    content: string,
    isPrivate = false
  ): Promise<ApplicationNote> {
    const note = await prisma.applicationNote.create({
      data: {
        applicationId,
        authorId,
        content,
        isPrivate,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return {
      id: note.id,
      content: note.content,
      authorId: note.authorId,
      authorName: note.author?.name ?? authorName,
      authorImage: note.author?.image ?? null,
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
    };
  }

  async updateNote(noteId: string, content: string): Promise<ApplicationNote> {
    const note = await prisma.applicationNote.update({
      where: { id: noteId },
      data: { content },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return {
      id: note.id,
      content: note.content,
      authorId: note.authorId,
      authorName: note.author?.name ?? "Unknown",
      authorImage: note.author?.image ?? null,
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
    };
  }

  async deleteNote(noteId: string): Promise<void> {
    await prisma.applicationNote.delete({ where: { id: noteId } });
  }

  async getNotes(applicationId: string, includePrivate = false): Promise<ApplicationNote[]> {
    const where: Record<string, unknown> = { applicationId };
    if (!includePrivate) where.isPrivate = false;

    const notes = await prisma.applicationNote.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorId: n.authorId,
      authorName: n.author?.name ?? "Unknown",
      authorImage: n.author?.image ?? null,
      isPrivate: n.isPrivate,
      createdAt: n.createdAt,
    }));
  }

  // ─── Status Tracking & Pipeline ────────────────────────────────────────────

  async getStatusHistory(applicationId: string): Promise<StatusHistoryEntry[]> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { statusHistory: true },
    });

    if (!application) throw new Error("Application not found");

    const history: StatusHistoryEntry[] = JSON.parse(application.statusHistory as string || "[]");
    return history;
  }

  async getApplicationStats(firmId: string): Promise<ApplicationStats> {
    const [
      totalApplications,
      byStatus,
      scoreAgg,
      hiredCount,
      totalCount,
    ] = await Promise.all([
      prisma.application.count({
        where: { job: { firmId }, isActive: true },
      }),
      prisma.application.groupBy({
        by: ["status"],
        where: { job: { firmId }, isActive: true },
        _count: true,
      }),
      prisma.application.aggregate({
        where: { job: { firmId }, isActive: true, matchScore: { not: null } },
        _avg: { matchScore: true },
      }),
      prisma.application.count({
        where: { job: { firmId }, status: "HIRED" },
      }),
      prisma.application.count({
        where: { job: { firmId }, isActive: true },
      }),
    ]);

    const topJobs = await prisma.application.groupBy({
      by: ["jobId"],
      where: { job: { firmId }, isActive: true },
      _count: true,
      orderBy: { _count: { jobId: "desc" } },
      take: 5,
    });

    const jobTitles = await prisma.job.findMany({
      where: { id: { in: topJobs.map((j) => j.jobId) } },
      select: { id: true, title: true },
    });

    const jobTitleMap = new Map(jobTitles.map((j) => [j.id, j.title]));

    return {
      totalApplications,
      byStatus: byStatus.map((s) => ({
        status: s.status as ApplicationStatus,
        count: s._count,
      })),
      averageMatchScore: scoreAgg._avg.matchScore ?? 0,
      conversionRate: totalCount > 0 ? Math.round((hiredCount / totalCount) * 100) : 0,
      averageTimeInStage: [],
      topJobs: topJobs.map((j) => ({
        jobId: j.jobId,
        jobTitle: jobTitleMap.get(j.jobId) ?? "Unknown",
        applicationCount: j._count,
      })),
    };
  }

  async bulkUpdateStatus(
    applicationIds: string[],
    newStatus: ApplicationStatus,
    changedBy: string,
    changedByName: string,
    reason?: string
  ): Promise<Application[]> {
    const results: Application[] = [];

    for (const id of applicationIds) {
      try {
        const updated = await this.update(id, {
          status: newStatus,
          rejectedReason: reason,
        });
        results.push(updated);
      } catch {
        // Skip failed updates
      }
    }

    return results;
  }

  async rejectInactive(
    jobId: string,
    daysSinceApplication = 30
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceApplication);

    const result = await prisma.application.updateMany({
      where: {
        jobId,
        status: "SUBMITTED",
        createdAt: { lt: cutoffDate },
        isActive: true,
      },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedReason: "Automatically rejected: no activity within threshold period",
      },
    });

    return result.count;
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: ApplicationFilter) {
    const where: Record<string, unknown> = {
      job: { firmId },
      isActive: true,
    };

    if (!filters) return where;

    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.minMatchScore !== undefined) {
      where.matchScore = { ...(where.matchScore as object ?? {}), gte: filters.minMatchScore };
    }
    if (filters.maxMatchScore !== undefined) {
      where.matchScore = { ...(where.matchScore as object ?? {}), lte: filters.maxMatchScore };
    }
    if (filters.dateRange) {
      where.createdAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };
    }

    return where;
  }

  private formatApplication(app: any): Application {
    return {
      id: app.id,
      jobId: app.jobId,
      candidateId: app.candidateId,
      status: app.status,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      matchScore: app.matchScore,
      screeningAnswers: app.screeningAnswers
        ? (typeof app.screeningAnswers === "string" ? JSON.parse(app.screeningAnswers) : app.screeningAnswers)
        : null,
      screeningPassed: app.screeningPassed,
      screeningScore: app.screeningScore,
      notes: (app.notes ?? []).map((n: any) => ({
        id: n.id,
        content: n.content,
        authorId: n.authorId,
        authorName: n.author?.name ?? "Unknown",
        authorImage: n.author?.image ?? null,
        isPrivate: n.isPrivate,
        createdAt: n.createdAt,
      })),
      statusHistory: typeof app.statusHistory === "string" ? JSON.parse(app.statusHistory) : (app.statusHistory ?? []),
      appliedAt: app.createdAt,
      lastStatusChangeAt: app.lastStatusChangeAt ?? app.updatedAt,
      rejectedAt: app.rejectedAt,
      rejectedReason: app.rejectedReason,
      withdrawnAt: app.withdrawnAt,
      withdrawnReason: app.withdrawnReason,
      metadata: app.metadata ? (typeof app.metadata === "string" ? JSON.parse(app.metadata) : app.metadata) : null,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }
}

export const applicationService = new ApplicationService();
