import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  ApplicationStatus,
  CandidateApplicationSummary,
} from "@/types/job";

// ─── Application Service ─────────────────────────────────────────────────────
// Manages the full lifecycle of job applications: submission, status
// transitions, internal notes, pipeline tracking, and candidate communications.

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
  job?: { id: string; title: string; department?: string; location?: string };
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    headline?: string;
    profileImage?: string | null;
  };
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

export interface BulkActionInput {
  applicationIds: string[];
  action: "move_to_stage" | "reject" | "archive";
  targetStatus?: ApplicationStatus;
  reason?: string;
}

export interface CandidateApplicationSummary {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  totalApplications: number;
  activeApplications: number;
  avgMatchScore: number;
  lastAppliedAt: Date;
}

export class ApplicationService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateApplicationInput): Promise<Application> {
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.status !== "OPEN") throw AppError.badRequest("Job is not accepting applications");

    const existing = await prisma.application.findFirst({
      where: {
        jobId: input.jobId,
        candidateId: input.candidateId,
        isActive: true,
      },
    });
    if (existing) throw AppError.conflict("Candidate has already applied for this job");

    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw AppError.notFound("Candidate");

    let screeningPassed: boolean | null = null;
    let screeningScore: number | null = null;

    if (input.screeningAnswers && Object.keys(input.screeningAnswers).length > 0) {
      const screeningResult = await this.evaluateScreeningAnswers(
        input.jobId,
        input.screeningAnswers
      );
      screeningPassed = screeningResult.passed;
      screeningScore = screeningResult.score;
    }

    const initialHistory: StatusHistoryEntry[] = [
      {
        from: null,
        to: screeningPassed === false ? "REJECTED" : "SUBMITTED",
        changedBy: input.candidateId,
        changedByName: `${candidate.firstName} ${candidate.lastName}`,
        reason: "Application submitted",
        timestamp: new Date(),
      },
    ];

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
        statusHistory: JSON.stringify(initialHistory),
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.job.update({
      where: { id: input.jobId },
      data: { applicationCount: { increment: 1 } },
    });

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

  async getByIdOrThrow(applicationId: string): Promise<Application> {
    const app = await this.getById(applicationId);
    if (!app) throw AppError.notFound("Application");
    return app;
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

  async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    changedBy: string,
    changedByName: string,
    reason?: string
  ): Promise<Application> {
    const application = await this.getByIdOrThrow(applicationId);
    const validTransitions = this.getValidTransitions(application.status);

    if (!validTransitions.includes(newStatus)) {
      throw AppError.badRequest(
        `Cannot transition from ${application.status} to ${newStatus}`
      );
    }

    const historyEntry: StatusHistoryEntry = {
      from: application.status,
      to: newStatus,
      changedBy,
      changedByName,
      reason: reason ?? null,
      timestamp: new Date(),
    };

    const currentHistory = application.statusHistory ?? [];
    const updatedHistory = [...currentHistory, historyEntry];

    const updateData: Record<string, unknown> = {
      status: newStatus,
      lastStatusChangeAt: new Date(),
      statusHistory: JSON.stringify(updatedHistory),
    };

    if (newStatus === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.rejectedReason = reason;
    }
    if (newStatus === "WITHDRAWN") {
      updateData.withdrawnAt = new Date();
      updateData.withdrawnReason = reason;
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (newStatus === "HIRED") {
      await prisma.job.update({
        where: { id: application.jobId },
        data: { filledCount: { increment: 1 } },
      });
    }

    return this.formatApplication(updated);
  }

  async withdraw(
    applicationId: string,
    candidateId: string,
    reason?: string
  ): Promise<Application> {
    const application = await this.getByIdOrThrow(applicationId);

    if (application.candidateId !== candidateId) {
      throw AppError.forbidden("Only the candidate can withdraw their application");
    }

    if (!["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(application.status)) {
      throw AppError.badRequest("Cannot withdraw application at this stage");
    }

    return this.updateStatus(
      applicationId,
      "WITHDRAWN",
      candidateId,
      "Candidate",
      reason
    );
  }

  async reject(
    applicationId: string,
    rejectedBy: string,
    rejectedByName: string,
    reason: string
  ): Promise<Application> {
    if (!reason || reason.trim().length < 5) {
      throw AppError.badRequest("A rejection reason is required (minimum 5 characters)");
    }
    return this.updateStatus(applicationId, "REJECTED", rejectedBy, rejectedByName, reason);
  }

  // ─── Notes Management ───────────────────────────────────────────────────────

  async addNote(
    applicationId: string,
    authorId: string,
    authorName: string,
    content: string,
    isPrivate = false
  ): Promise<ApplicationNote> {
    await this.getByIdOrThrow(applicationId);

    if (!content || content.trim().length === 0) {
      throw AppError.badRequest("Note content cannot be empty");
    }

    const note = await prisma.applicationNote.create({
      data: {
        applicationId,
        authorId,
        content: content.trim(),
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

  async updateNote(
    noteId: string,
    authorId: string,
    content: string
  ): Promise<ApplicationNote> {
    const existing = await prisma.applicationNote.findUnique({
      where: { id: noteId },
    });
    if (!existing) throw AppError.notFound("Note");
    if (existing.authorId !== authorId) {
      throw AppError.forbidden("Only the author can edit their note");
    }

    const updated = await prisma.applicationNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return {
      id: updated.id,
      content: updated.content,
      authorId: updated.authorId,
      authorName: updated.author?.name ?? "",
      authorImage: updated.author?.image ?? null,
      isPrivate: updated.isPrivate,
      createdAt: updated.createdAt,
    };
  }

  async deleteNote(noteId: string, authorId: string, isAdmin = false): Promise<void> {
    const existing = await prisma.applicationNote.findUnique({
      where: { id: noteId },
    });
    if (!existing) throw AppError.notFound("Note");
    if (existing.authorId !== authorId && !isAdmin) {
      throw AppError.forbidden("Only the author or an admin can delete notes");
    }

    await prisma.applicationNote.delete({ where: { id: noteId } });
  }

  async getNotes(applicationId: string, includePrivate = false): Promise<ApplicationNote[]> {
    const where: Record<string, unknown> = { applicationId };
    if (!includePrivate) {
      where.isPrivate = false;
    }

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
      authorName: n.author?.name ?? "",
      authorImage: n.author?.image ?? null,
      isPrivate: n.isPrivate,
      createdAt: n.createdAt,
    }));
  }

  // ─── Screening ──────────────────────────────────────────────────────────────

  async evaluateScreeningAnswers(
    jobId: string,
    answers: Record<string, string>
  ): Promise<{ passed: boolean; score: number; details: Array<{ questionId: string; passed: boolean; score: number }> }> {
    const questions = await prisma.screeningQuestion.findMany({
      where: { jobId },
    });

    if (questions.length === 0) {
      return { passed: true, score: 100, details: [] };
    }

    const details = questions.map((q) => {
      const answer = answers[q.id];
      if (!answer) {
        return { questionId: q.id, passed: !q.required, score: 0 };
      }

      const passed = q.passingAnswer
        ? answer.toLowerCase().trim() === q.passingAnswer.toLowerCase().trim()
        : true;

      return {
        questionId: q.id,
        passed,
        score: passed ? q.weight : 0,
      };
    });

    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    const earnedWeight = details.reduce((sum, d) => sum + d.score, 0);
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    const requiredQuestions = questions.filter((q) => q.required);
    const passed = requiredQuestions.every((q) =>
      details.find((d) => d.questionId === q.id)?.passed
    );

    return { passed, score, details };
  }

  // ─── Bulk Operations ────────────────────────────────────────────────────────

  async bulkAction(
    input: BulkActionInput,
    performedBy: string,
    performedByName: string
  ): Promise<{ processed: number; failed: string[] }> {
    const failed: string[] = [];
    let processed = 0;

    for (const applicationId of input.applicationIds) {
      try {
        switch (input.action) {
          case "move_to_stage":
            if (input.targetStatus) {
              await this.updateStatus(
                applicationId,
                input.targetStatus,
                performedBy,
                performedByName,
                input.reason
              );
            }
            break;
          case "reject":
            await this.reject(
              applicationId,
              performedBy,
              performedByName,
              input.reason ?? "Bulk rejection"
            );
            break;
          case "archive":
            await this.updateStatus(
              applicationId,
              "ARCHIVED",
              performedBy,
              performedByName,
              input.reason
            );
            break;
        }
        processed++;
      } catch {
        failed.push(applicationId);
      }
    }

    return { processed, failed };
  }

  // ─── Pipeline & Analytics ───────────────────────────────────────────────────

  async getApplicationStats(firmId: string): Promise<ApplicationStats> {
    const [total, byStatus, matchScores, topJobs] = await Promise.all([
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
      prisma.application.groupBy({
        by: ["jobId"],
        where: { job: { firmId }, isActive: true },
        _count: true,
        orderBy: { _count: { jobId: "desc" } },
        take: 5,
      }),
    ]);

    const hiredCount = byStatus.find((s) => s.status === "HIRED")?._count ?? 0;
    const conversionRate = total > 0 ? Math.round((hiredCount / total) * 100) : 0;

    const jobIds = topJobs.map((t) => t.jobId);
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });

    return {
      totalApplications: total,
      byStatus: byStatus.map((s) => ({
        status: s.status as ApplicationStatus,
        count: s._count,
      })),
      averageMatchScore: matchScores._avg.matchScore ?? 0,
      conversionRate,
      averageTimeInStage: [],
      topJobs: topJobs.map((t) => ({
        jobId: t.jobId,
        jobTitle: jobs.find((j) => j.id === t.jobId)?.title ?? "Unknown",
        applicationCount: t._count,
      })),
    };
  }

  async getCandidateApplicationsSummary(firmId: string): Promise<CandidateApplicationSummary[]> {
    const applications = await prisma.application.groupBy({
      by: ["candidateId"],
      where: { job: { firmId }, isActive: true },
      _count: true,
      _avg: { matchScore: true },
      orderBy: { _count: { candidateId: "desc" } },
      take: 20,
    });

    const candidateIds = applications.map((a) => a.candidateId);
    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return applications.map((a) => {
      const candidate = candidates.find((c) => c.id === a.candidateId);
      return {
        candidateId: a.candidateId,
        candidateName: candidate
          ? `${candidate.firstName} ${candidate.lastName}`
          : "Unknown",
        candidateEmail: candidate?.email ?? "",
        totalApplications: a._count,
        activeApplications: a._count,
        avgMatchScore: a._avg.matchScore ?? 0,
        lastAppliedAt: new Date(),
      };
    });
  }

  async getApplicationsByJob(
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
              headline: true, profileImage: true,
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
        orderBy: { matchScore: "desc" },
      }),
      prisma.application.count({ where: { jobId, isActive: true } }),
    ]);

    return {
      applications: applications.map((a) => this.formatApplication(a)),
      total,
    };
  }

  async getShortlistedCandidates(jobId: string): Promise<Application[]> {
    const applications = await prisma.application.findMany({
      where: {
        jobId,
        isActive: true,
        status: { in: ["SHORTLISTED", "INTERVIEWING", "OFFERED"] },
      },
      include: {
        candidate: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            phone: true, headline: true, profileImage: true,
          },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { matchScore: "desc" },
    });

    return applications.map((a) => this.formatApplication(a));
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private getValidTransitions(currentStatus: ApplicationStatus): ApplicationStatus[] {
    const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      SUBMITTED: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN", "ARCHIVED"],
      UNDER_REVIEW: ["SHORTLISTED", "REJECTED", "WITHDRAWN", "ARCHIVED"],
      SHORTLISTED: ["INTERVIEWING", "REJECTED", "WITHDRAWN", "ARCHIVED"],
      INTERVIEWING: ["SHORTLISTED", "OFFERED", "REJECTED", "ARCHIVED"],
      OFFERED: ["HIRED", "REJECTED", "WITHDRAWN", "ARCHIVED"],
      HIRED: [],
      REJECTED: ["UNDER_REVIEW"],
      WITHDRAWN: ["SUBMITTED"],
      ARCHIVED: ["UNDER_REVIEW"],
    };
    return transitions[currentStatus] ?? [];
  }

  private buildWhereClause(firmId: string, filters?: ApplicationFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      job: { firmId },
      isActive: true,
    };

    if (!filters) return where;

    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.minMatchScore !== undefined) {
      where.matchScore = { ...(where.matchScore as object ?? {}), gte: filters.minMatchScore };
    }
    if (filters.maxMatchScore !== undefined) {
      where.matchScore = { ...(where.matchScore as object ?? {}), lte: filters.maxMatchScore };
    }
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }
    if (filters.search) {
      where.OR = [
        {
          candidate: {
            firstName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          candidate: {
            lastName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          candidate: {
            email: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    return where;
  }

  private formatApplication(raw: any): Application {
    const history = raw.statusHistory
      ? typeof raw.statusHistory === "string"
        ? JSON.parse(raw.statusHistory)
        : raw.statusHistory
      : [];

    return {
      id: raw.id,
      jobId: raw.jobId,
      candidateId: raw.candidateId,
      status: raw.status,
      coverLetter: raw.coverLetter,
      resumeUrl: raw.resumeUrl,
      matchScore: raw.matchScore,
      screeningAnswers: raw.screeningAnswers
        ? JSON.parse(raw.screeningAnswers)
        : null,
      screeningPassed: raw.screeningPassed,
      screeningScore: raw.screeningScore,
      notes: (raw.notes ?? []).map((n: any) => ({
        id: n.id,
        content: n.content,
        authorId: n.authorId,
        authorName: n.author?.name ?? "",
        authorImage: n.author?.image ?? null,
        isPrivate: n.isPrivate,
        createdAt: n.createdAt,
      })),
      statusHistory: history,
      appliedAt: raw.createdAt,
      lastStatusChangeAt: raw.lastStatusChangeAt,
      rejectedAt: raw.rejectedAt,
      rejectedReason: raw.rejectedReason,
      withdrawnAt: raw.withdrawnAt,
      withdrawnReason: raw.withdrawnReason,
      metadata: raw.metadata,
      job: raw.job,
      candidate: raw.candidate,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const applicationService = new ApplicationService();
