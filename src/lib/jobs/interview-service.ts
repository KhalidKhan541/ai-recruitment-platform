import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { InterviewType, InterviewStatus } from "@/types/job";

// ─── Interview Service ───────────────────────────────────────────────────────
// Handles interview scheduling, panel management, scoring rubrics,
// feedback collection, availability conflict detection, and reminders.

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  type: InterviewType;
  status: InterviewStatus;
  title: string;
  description: string | null;
  scheduledAt: Date;
  duration: number;
  location: string | null;
  meetingUrl: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
  panelMembers: PanelMember[];
  scorecard: Scorecard | null;
  notes: InterviewNote[];
  feedback: InterviewFeedback[];
  overallScore: number | null;
  recommendation: Recommendation | null;
  scheduledBy: string;
  scheduledByName: string;
  rescheduledFrom: string | null;
  cancelReason: string | null;
  noShowReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PanelMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  scorecard: Scorecard | null;
}

export interface Scorecard {
  id: string;
  technicalScore: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  culturalFitScore: number | null;
  leadershipScore: number | null;
  overallScore: number | null;
  strengths: string[];
  weaknesses: string[];
  recommendation: Recommendation;
  notes: string | null;
  submittedAt: Date | null;
}

export interface InterviewNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  isPrivate: boolean;
  createdAt: Date;
}

export interface InterviewFeedback {
  id: string;
  panelMemberId: string;
  panelMemberName: string;
  scorecard: Scorecard;
  comments: string;
  submittedAt: Date;
}

export type Recommendation =
  | "STRONG_YES"
  | "YES"
  | "MAYBE"
  | "NO"
  | "STRONG_NO";

export interface InterviewSlot {
  start: Date;
  end: Date;
  interviewerId: string;
  available: boolean;
}

export interface CreateInterviewInput {
  applicationId: string;
  type: InterviewType;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  meetingUrl?: string;
  panelMemberIds: string[];
  scheduledBy: string;
  scheduledByName: string;
  firmId: string;
}

export interface UpdateInterviewInput {
  type?: InterviewType;
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  meetingUrl?: string;
  status?: InterviewStatus;
  cancelReason?: string;
}

export interface InterviewFilter {
  jobId?: string;
  candidateId?: string;
  applicationId?: string;
  type?: InterviewType[];
  status?: InterviewStatus[];
  panelMemberId?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface InterviewStats {
  totalInterviews: number;
  byType: { type: InterviewType; count: number }[];
  byStatus: { status: InterviewStatus; count: number }[];
  averageScore: number;
  averageDuration: number;
  upcomingCount: number;
  completionRate: number;
  noShowRate: number;
  averageTimeToSchedule: number;
}

export class InterviewService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateInterviewInput): Promise<Interview> {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      include: {
        job: { select: { id: true, firmId: true } },
        candidate: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!application) throw AppError.notFound("Application");

    const conflicts = await this.checkConflicts(
      input.panelMemberIds,
      input.scheduledAt,
      input.duration
    );
    if (conflicts.length > 0) {
      throw AppError.badRequest(
        `Scheduling conflict for interviewer(s): ${conflicts.map((c) => c.interviewerName).join(", ")}`
      );
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: input.applicationId,
        jobId: application.jobId,
        candidateId: application.candidateId,
        type: input.type,
        status: "SCHEDULED",
        title: input.title,
        description: input.description ?? null,
        scheduledAt: input.scheduledAt,
        duration: input.duration,
        location: input.location ?? null,
        meetingUrl: input.meetingUrl ?? null,
        scheduledBy: input.scheduledBy,
        panelMembers: {
          create: input.panelMemberIds.map((userId) => ({
            userId,
            role: "INTERVIEWER",
          })),
        },
      },
      include: {
        panelMembers: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        scorecard: true,
        notes: true,
        feedback: true,
      },
    });

    await prisma.application.update({
      where: { id: input.applicationId },
      data: { status: "INTERVIEWING" },
    });

    return this.formatInterview(interview);
  }

  async getById(interviewId: string): Promise<Interview | null> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        panelMembers: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            scorecard: true,
          },
        },
        scorecard: true,
        notes: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        feedback: {
          include: {
            panelMember: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return interview ? this.formatInterview(interview) : null;
  }

  async getByIdOrThrow(interviewId: string): Promise<Interview> {
    const interview = await this.getById(interviewId);
    if (!interview) throw AppError.notFound("Interview");
    return interview;
  }

  async getAll(
    firmId: string,
    filters?: InterviewFilter,
    page = 1,
    limit = 20
  ): Promise<{ interviews: Interview[]; total: number }> {
    const where = this.buildWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: {
          panelMembers: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
              scorecard: true,
            },
          },
          scorecard: true,
          application: {
            select: {
              id: true,
              candidate: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.interview.count({ where }),
    ]);

    return {
      interviews: interviews.map((i) => this.formatInterview(i)),
      total,
    };
  }

  async update(
    interviewId: string,
    input: UpdateInterviewInput,
    updatedBy: string
  ): Promise<Interview> {
    const existing = await this.getByIdOrThrow(interviewId);

    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
      throw AppError.badRequest("Cannot update a completed, cancelled, or no-show interview");
    }

    const data: Record<string, unknown> = {};

    if (input.type !== undefined) data.type = input.type;
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.location !== undefined) data.location = input.location;
    if (input.meetingUrl !== undefined) data.meetingUrl = input.meetingUrl;
    if (input.status !== undefined) data.status = input.status;

    if (input.scheduledAt !== undefined) {
      data.scheduledAt = input.scheduledAt;
      data.rescheduledFrom = existing.scheduledAt.toISOString();
      data.status = "RESCHEDULED";
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data,
      include: {
        panelMembers: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            scorecard: true,
          },
        },
        scorecard: true,
        notes: true,
        feedback: true,
      },
    });

    return this.formatInterview(updated);
  }

  async cancel(
    interviewId: string,
    cancelledBy: string,
    reason: string
  ): Promise<Interview> {
    const interview = await this.getByIdOrThrow(interviewId);

    if (["COMPLETED", "CANCELLED"].includes(interview.status)) {
      throw AppError.badRequest("Interview is already completed or cancelled");
    }

    return this.update(
      interviewId,
      { status: "CANCELLED", cancelReason: reason },
      cancelledBy
    );
  }

  async reschedule(
    interviewId: string,
    newScheduledAt: Date,
    rescheduledBy: string,
    reason?: string
  ): Promise<Interview> {
    const interview = await this.getByIdOrThrow(interviewId);

    if (["COMPLETED", "CANCELLED"].includes(interview.status)) {
      throw AppError.badRequest("Cannot reschedule a completed or cancelled interview");
    }

    const panelMemberIds = interview.panelMembers.map((p) => p.userId);
    const conflicts = await this.checkConflicts(
      panelMemberIds,
      newScheduledAt,
      interview.duration
    );
    if (conflicts.length > 0) {
      throw AppError.badRequest(
        `Scheduling conflict for interviewer(s): ${conflicts.map((c) => c.interviewerName).join(", ")}`
      );
    }

    return this.update(
      interviewId,
      { scheduledAt: newScheduledAt },
      rescheduledBy
    );
  }

  // ─── Panel Management ───────────────────────────────────────────────────────

  async addPanelMember(
    interviewId: string,
    userId: string,
    role = "INTERVIEWER"
  ): Promise<void> {
    const interview = await this.getByIdOrThrow(interviewId);

    if (["COMPLETED", "CANCELLED"].includes(interview.status)) {
      throw AppError.badRequest("Cannot modify panel for a completed or cancelled interview");
    }

    const existingMember = interview.panelMembers.find((p) => p.userId === userId);
    if (existingMember) {
      throw AppError.conflict("User is already on the interview panel");
    }

    const conflicts = await this.checkConflicts(
      [userId],
      interview.scheduledAt,
      interview.duration
    );
    if (conflicts.length > 0) {
      throw AppError.badRequest(
        `Scheduling conflict for the proposed panel member`
      );
    }

    await prisma.interviewPanelMember.create({
      data: {
        interviewId,
        userId,
        role,
      },
    });
  }

  async removePanelMember(interviewId: string, userId: string): Promise<void> {
    const interview = await this.getByIdOrThrow(interviewId);

    if (interview.panelMembers.length <= 1) {
      throw AppError.badRequest("Cannot remove the last panel member");
    }

    await prisma.interviewPanelMember.deleteMany({
      where: { interviewId, userId },
    });
  }

  // ─── Scoring & Feedback ─────────────────────────────────────────────────────

  async submitScorecard(
    interviewId: string,
    panelMemberId: string,
    scorecard: Omit<Scorecard, "id" | "submittedAt">
  ): Promise<void> {
    const interview = await this.getByIdOrThrow(interviewId);

    if (interview.status === "CANCELLED") {
      throw AppError.badRequest("Cannot submit scorecard for a cancelled interview");
    }

    this.validateScorecard(scorecard);

    const existingScorecard = await prisma.interviewScorecard.findFirst({
      where: { interviewId, panelMemberId },
    });

    if (existingScorecard) {
      await prisma.interviewScorecard.update({
        where: { id: existingScorecard.id },
        data: {
          technicalScore: scorecard.technicalScore,
          communicationScore: scorecard.communicationScore,
          problemSolvingScore: scorecard.problemSolvingScore,
          culturalFitScore: scorecard.culturalFitScore,
          leadershipScore: scorecard.leadershipScore,
          overallScore: this.calculateOverallScore(scorecard),
          strengths: JSON.stringify(scorecard.strengths),
          weaknesses: JSON.stringify(scorecard.weaknesses),
          recommendation: scorecard.recommendation,
          notes: scorecard.notes,
          submittedAt: new Date(),
        },
      });
    } else {
      await prisma.interviewScorecard.create({
        data: {
          interviewId,
          panelMemberId,
          technicalScore: scorecard.technicalScore,
          communicationScore: scorecard.communicationScore,
          problemSolvingScore: scorecard.problemSolvingScore,
          culturalFitScore: scorecard.culturalFitScore,
          leadershipScore: scorecard.leadershipScore,
          overallScore: this.calculateOverallScore(scorecard),
          strengths: JSON.stringify(scorecard.strengths),
          weaknesses: JSON.stringify(scorecard.weaknesses),
          recommendation: scorecard.recommendation,
          notes: scorecard.notes,
          submittedAt: new Date(),
        },
      });
    }

    await this.recalculateInterviewScore(interviewId);
  }

  async submitFeedback(
    interviewId: string,
    panelMemberId: string,
    comments: string,
    scorecard: Omit<Scorecard, "id" | "submittedAt">
  ): Promise<void> {
    await this.submitScorecard(interviewId, panelMemberId, scorecard);

    const panelMember = await prisma.interviewPanelMember.findFirst({
      where: { interviewId, userId: panelMemberId },
    });
    if (!panelMember) throw AppError.badRequest("User is not on the interview panel");

    await prisma.interviewFeedback.create({
      data: {
        interviewId,
        panelMemberId: panelMember.id,
        comments,
      },
    });
  }

  private validateScorecard(scorecard: Omit<Scorecard, "id" | "submittedAt">): void {
    const scores = [
      scorecard.technicalScore,
      scorecard.communicationScore,
      scorecard.problemSolvingScore,
      scorecard.culturalFitScore,
      scorecard.leadershipScore,
    ];

    for (const score of scores) {
      if (score !== null && (score < 0 || score > 10)) {
        throw AppError.badRequest("All scores must be between 0 and 10");
      }
    }

    if (!["STRONG_YES", "YES", "MAYBE", "NO", "STRONG_NO"].includes(scorecard.recommendation)) {
      throw AppError.badRequest("Invalid recommendation value");
    }
  }

  private calculateOverallScore(scorecard: Omit<Scorecard, "id" | "submittedAt">): number {
    const scores = [
      scorecard.technicalScore,
      scorecard.communicationScore,
      scorecard.problemSolvingScore,
      scorecard.culturalFitScore,
      scorecard.leadershipScore,
    ].filter((s): s is number => s !== null);

    if (scores.length === 0) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  private async recalculateInterviewScore(interviewId: string): Promise<void> {
    const scorecards = await prisma.interviewScorecard.findMany({
      where: { interviewId, submittedAt: { not: null } },
    });

    if (scorecards.length === 0) return;

    const overallScores = scorecards
      .map((s) => s.overallScore)
      .filter((s): s is number => s !== null);

    const avgScore = overallScores.length > 0
      ? Math.round((overallScores.reduce((a, b) => a + b, 0) / overallScores.length) * 10) / 10
      : null;

    const recommendations = scorecards.map((s) => s.recommendation);
    const overallRecommendation = this.calculateOverallRecommendation(recommendations);

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        overallScore: avgScore,
        recommendation: overallRecommendation,
      },
    });
  }

  private calculateOverallRecommendation(recommendations: string[]): Recommendation {
    const scoreMap: Record<string, number> = {
      STRONG_YES: 5,
      YES: 4,
      MAYBE: 3,
      NO: 2,
      STRONG_NO: 1,
    };

    const avg = recommendations.reduce((sum, r) => sum + (scoreMap[r] ?? 3), 0) / recommendations.length;

    if (avg >= 4.5) return "STRONG_YES";
    if (avg >= 3.5) return "YES";
    if (avg >= 2.5) return "MAYBE";
    if (avg >= 1.5) return "NO";
    return "STRONG_NO";
  }

  // ─── Notes ──────────────────────────────────────────────────────────────────

  async addNote(
    interviewId: string,
    authorId: string,
    authorName: string,
    content: string,
    isPrivate = false
  ): Promise<InterviewNote> {
    await this.getByIdOrThrow(interviewId);

    const note = await prisma.interviewNote.create({
      data: {
        interviewId,
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
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
    };
  }

  // ─── Availability & Conflict Detection ──────────────────────────────────────

  async checkConflicts(
    interviewerIds: string[],
    scheduledAt: Date,
    durationMinutes: number
  ): Promise<Array<{ interviewerId: string; interviewerName: string; conflictStart: Date; conflictEnd: Date }>> {
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

    const conflictingInterviews = await prisma.interview.findMany({
      where: {
        panelMembers: {
          some: { userId: { in: interviewerIds } },
        },
        status: { in: ["SCHEDULED", "RESCHEDULED", "IN_PROGRESS"] },
        scheduledAt: { lt: endTime },
        OR: [
          { duration: { gte: durationMinutes } },
          {
            scheduledAt: {
              gte: new Date(scheduledAt.getTime() - 120 * 60 * 1000),
            },
          },
        ],
      },
      include: {
        panelMembers: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    const conflicts: Array<{
      interviewerId: string;
      interviewerName: string;
      conflictStart: Date;
      conflictEnd: Date;
    }> = [];

    for (const interview of conflictingInterviews) {
      const interviewEnd = new Date(
        interview.scheduledAt.getTime() + interview.duration * 60 * 1000
      );

      const hasOverlap =
        scheduledAt < interviewEnd && endTime > interview.scheduledAt;

      if (hasOverlap) {
        for (const member of interview.panelMembers) {
          if (interviewerIds.includes(member.userId)) {
            conflicts.push({
              interviewerId: member.userId,
              interviewerName: member.user?.name ?? "Unknown",
              conflictStart: interview.scheduledAt,
              conflictEnd: interviewEnd,
            });
          }
        }
      }
    }

    return conflicts;
  }

  async getAvailableSlots(
    interviewerIds: string[],
    date: Date,
    durationMinutes: number,
    slotInterval = 30
  ): Promise<InterviewSlot[]> {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    const existingInterviews = await prisma.interview.findMany({
      where: {
        panelMembers: {
          some: { userId: { in: interviewerIds } },
        },
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
    });

    const slots: InterviewSlot[] = [];
    let current = new Date(dayStart);

    while (current.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);

      const isAvailable = !existingInterviews.some((interview) => {
        const interviewEnd = new Date(
          interview.scheduledAt.getTime() + interview.duration * 60 * 1000
        );
        return current < interviewEnd && slotEnd > interview.scheduledAt;
      });

      for (const interviewerId of interviewerIds) {
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          interviewerId,
          available: isAvailable,
        });
      }

      current = new Date(current.getTime() + slotInterval * 60 * 1000);
    }

    return slots;
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<InterviewStats> {
    const where = { job: { firmId } };

    const [total, byType, byStatus, scoreAgg, durationAgg, completedCount, noShowCount] =
      await Promise.all([
        prisma.interview.count({ where }),
        prisma.interview.groupBy({
          by: ["type"],
          where,
          _count: true,
        }),
        prisma.interview.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),
        prisma.interview.aggregate({
          where: { ...where, overallScore: { not: null } },
          _avg: { overallScore: true },
        }),
        prisma.interview.aggregate({
          where,
          _avg: { duration: true },
        }),
        prisma.interview.count({
          where: { ...where, status: "COMPLETED" },
        }),
        prisma.interview.count({
          where: { ...where, status: "NO_SHOW" },
        }),
      ]);

    const upcoming = await prisma.interview.count({
      where: {
        ...where,
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
        scheduledAt: { gte: new Date() },
      },
    });

    return {
      totalInterviews: total,
      byType: byType.map((t) => ({ type: t.type as InterviewType, count: t._count })),
      byStatus: byStatus.map((s) => ({ status: s.status as InterviewStatus, count: s._count })),
      averageScore: scoreAgg._avg.overallScore ?? 0,
      averageDuration: durationAgg._avg.duration ?? 0,
      upcomingCount: upcoming,
      completionRate: total > 0 ? Math.round((completedCount / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShowCount / total) * 100) : 0,
      averageTimeToSchedule: 0,
    };
  }

  async getUpcomingInterviews(
    firmId: string,
    days = 7
  ): Promise<Interview[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const interviews = await prisma.interview.findMany({
      where: {
        job: { firmId },
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
        scheduledAt: {
          gte: new Date(),
          lte: futureDate,
        },
      },
      include: {
        panelMembers: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return interviews.map((i) => this.formatInterview(i));
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: InterviewFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      job: { firmId },
    };

    if (!filters) return where;

    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.applicationId) where.applicationId = filters.applicationId;
    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.panelMemberId) {
      where.panelMembers = {
        some: { userId: filters.panelMemberId },
      };
    }
    if (filters.dateRange) {
      where.scheduledAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        {
          application: {
            candidate: {
              firstName: { contains: filters.search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    return where;
  }

  private formatInterview(raw: any): Interview {
    return {
      id: raw.id,
      applicationId: raw.applicationId,
      jobId: raw.jobId,
      candidateId: raw.candidateId,
      type: raw.type,
      status: raw.status,
      title: raw.title,
      description: raw.description,
      scheduledAt: raw.scheduledAt,
      duration: raw.duration,
      location: raw.location,
      meetingUrl: raw.meetingUrl,
      meetingId: raw.meetingId,
      meetingPassword: raw.meetingPassword,
      panelMembers: (raw.panelMembers ?? []).map((pm: any) => ({
        id: pm.id,
        userId: pm.userId,
        name: pm.user?.name ?? "",
        email: pm.user?.email ?? "",
        image: pm.user?.image ?? null,
        role: pm.role,
        scorecard: pm.scorecard
          ? {
              ...pm.scorecard,
              strengths: pm.scorecard.strengths
                ? JSON.parse(pm.scorecard.strengths)
                : [],
              weaknesses: pm.scorecard.weaknesses
                ? JSON.parse(pm.scorecard.weaknesses)
                : [],
            }
          : null,
      })),
      scorecard: raw.scorecard
        ? {
            ...raw.scorecard,
            strengths: raw.scorecard.strengths
              ? JSON.parse(raw.scorecard.strengths)
              : [],
            weaknesses: raw.scorecard.weaknesses
              ? JSON.parse(raw.scorecard.weaknesses)
              : [],
          }
        : null,
      notes: (raw.notes ?? []).map((n: any) => ({
        id: n.id,
        content: n.content,
        authorId: n.authorId,
        authorName: n.author?.name ?? "",
        isPrivate: n.isPrivate,
        createdAt: n.createdAt,
      })),
      feedback: (raw.feedback ?? []).map((f: any) => ({
        id: f.id,
        panelMemberId: f.panelMemberId,
        panelMemberName: f.panelMember?.user?.name ?? "",
        scorecard: f.scorecard ?? null,
        comments: f.comments,
        submittedAt: f.submittedAt,
      })),
      overallScore: raw.overallScore,
      recommendation: raw.recommendation,
      scheduledBy: raw.scheduledBy,
      scheduledByName: raw.scheduledByName ?? "",
      rescheduledFrom: raw.rescheduledFrom,
      cancelReason: raw.cancelReason,
      noShowReason: raw.noShowReason,
      metadata: raw.metadata,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const interviewService = new InterviewService();
