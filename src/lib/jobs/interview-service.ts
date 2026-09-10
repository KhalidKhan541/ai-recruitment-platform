import { prisma } from "@/lib/prisma";
import { InterviewType, InterviewStatus } from "@/types/job";

// ─── Interview Service ───────────────────────────────────────────────────────
// Handles interview scheduling, panel management, scoring rubrics,
// feedback collection, and availability conflict detection.

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
}

export interface InterviewNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  isPrivate: boolean;
  createdAt: Date;
}

export interface InterviewFeedback {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImage: string | null;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  culturalFitScore: number;
  leadershipScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: Recommendation;
  notes: string;
  submittedAt: Date;
}

export type Recommendation = "STRONG_HIRE" | "HIRE" | "NEUTRAL" | "NO_HIRE" | "STRONG_NO_HIRE";

export interface InterviewSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  conflictReason: string | null;
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
  status?: InterviewStatus;
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  cancelReason?: string;
  noShowReason?: string;
}

export interface InterviewFilter {
  applicationId?: string;
  jobId?: string;
  candidateId?: string;
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
  noShowRate: number;
  completionRate: number;
  averageTimeToSchedule: number;
  upcomingInterviews: number;
}

export class InterviewService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateInterviewInput): Promise<Interview> {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!application) throw new Error("Application not found");

    // Check for scheduling conflicts with panel members
    const conflicts = await this.checkPanelConflicts(
      input.panelMemberIds,
      input.scheduledAt,
      input.duration
    );
    if (conflicts.length > 0) {
      throw new Error(`Panel member scheduling conflict: ${conflicts.map((c) => c.name).join(", ")}`);
    }

    // Check for candidate conflict
    const candidateConflict = await this.checkCandidateConflict(
      application.candidateId,
      input.scheduledAt,
      input.duration
    );
    if (candidateConflict) {
      throw new Error("Candidate has a conflicting interview at this time");
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
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        scorecard: true,
        notes: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
        feedback: {
          include: { reviewer: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    // Update application status
    const statusMap: Record<string, string> = {
      PHONE: "PHONE_INTERVIEW",
      VIDEO: "PHONE_INTERVIEW",
      ON_SITE: "FINAL_INTERVIEW",
      TECHNICAL: "TECHNICAL_INTERVIEW",
      PANEL: "FINAL_INTERVIEW",
      CULTURAL: "FINAL_INTERVIEW",
      EXECUTIVE: "FINAL_INTERVIEW",
    };

    const newStatus = statusMap[input.type] ?? "PHONE_INTERVIEW";
    await prisma.application.update({
      where: { id: input.applicationId },
      data: {
        status: newStatus as any,
        lastStatusChangeAt: new Date(),
      },
    });

    return this.formatInterview(interview);
  }

  async getById(interviewId: string): Promise<Interview | null> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        panelMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        scorecard: true,
        notes: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
        feedback: {
          include: { reviewer: { select: { id: true, name: true, image: true } } },
        },
        application: {
          select: {
            id: true, status: true,
            candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return interview ? this.formatInterview(interview) : null;
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
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          scorecard: true,
          notes: {
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          feedback: {
            include: { reviewer: { select: { id: true, name: true, image: true } } },
          },
          application: {
            select: {
              candidate: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          job: { select: { id: true, title: true } },
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

  async update(interviewId: string, input: UpdateInterviewInput): Promise<Interview> {
    const existing = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!existing) throw new Error("Interview not found");

    const data: Record<string, unknown> = {};

    if (input.type !== undefined) data.type = input.type;
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.location !== undefined) data.location = input.location;
    if (input.meetingUrl !== undefined) data.meetingUrl = input.meetingUrl;
    if (input.meetingId !== undefined) data.meetingId = input.meetingId;
    if (input.meetingPassword !== undefined) data.meetingPassword = input.meetingPassword;
    if (input.cancelReason !== undefined) data.cancelReason = input.cancelReason;
    if (input.noShowReason !== undefined) data.noShowReason = input.noShowReason;

    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "RESCHEDULED") {
        data.rescheduledFrom = existing.id;
        data.status = "SCHEDULED";
      }
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data,
      include: {
        panelMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        scorecard: true,
        notes: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
        feedback: {
          include: { reviewer: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    return this.formatInterview(updated);
  }

  async cancel(interviewId: string, reason: string): Promise<Interview> {
    return this.update(interviewId, {
      status: "CANCELLED",
      cancelReason: reason,
    });
  }

  async reschedule(
    interviewId: string,
    newScheduledAt: Date,
    reason?: string
  ): Promise<Interview> {
    const existing = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { panelMembers: true },
    });
    if (!existing) throw new Error("Interview not found");

    const panelMemberIds = existing.panelMembers.map((p) => p.userId);
    const conflicts = await this.checkPanelConflicts(
      panelMemberIds,
      newScheduledAt,
      existing.duration
    );
    if (conflicts.length > 0) {
      throw new Error(`Panel member scheduling conflict: ${conflicts.map((c) => c.name).join(", ")}`);
    }

    return this.update(interviewId, {
      scheduledAt: newScheduledAt,
      status: "RESCHEDULED",
    });
  }

  async delete(interviewId: string): Promise<void> {
    await prisma.interview.delete({ where: { id: interviewId } });
  }

  // ─── Panel Management ──────────────────────────────────────────────────────

  async addPanelMember(
    interviewId: string,
    userId: string,
    role = "INTERVIEWER"
  ): Promise<void> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { panelMembers: true },
    });
    if (!interview) throw new Error("Interview not found");

    const existing = interview.panelMembers.find((p) => p.userId === userId);
    if (existing) throw new Error("User is already a panel member");

    await prisma.interviewPanelMember.create({
      data: {
        interviewId,
        userId,
        role,
      },
    });
  }

  async removePanelMember(interviewId: string, userId: string): Promise<void> {
    await prisma.interviewPanelMember.deleteMany({
      where: { interviewId, userId },
    });
  }

  async getPanelAvailability(
    panelMemberIds: string[],
    dateRange: { start: Date; end: Date }
  ): Promise<Map<string, InterviewSlot[]>> {
    const availability = new Map<string, InterviewSlot[]>();

    for (const userId of panelMemberIds) {
      const existingInterviews = await prisma.interview.findMany({
        where: {
          panelMembers: { some: { userId } },
          scheduledAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: { notIn: ["CANCELLED"] },
        },
        select: { scheduledAt: true, duration: true },
      });

      const slots: InterviewSlot[] = [];
      const currentDate = new Date(dateRange.start);

      while (currentDate <= dateRange.end) {
        for (let hour = 9; hour < 18; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(hour + 1);

          const conflict = existingInterviews.find((interview) => {
            const interviewEnd = new Date(interview.scheduledAt);
            interviewEnd.setMinutes(interviewEnd.getMinutes() + interview.duration);
            return slotStart < interviewEnd && slotEnd > interview.scheduledAt;
          });

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: !conflict,
            conflictReason: conflict ? "Existing interview" : null,
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      availability.set(userId, slots);
    }

    return availability;
  }

  private async checkPanelConflicts(
    panelMemberIds: string[],
    scheduledAt: Date,
    duration: number
  ): Promise<{ userId: string; name: string }[]> {
    const interviewEnd = new Date(scheduledAt);
    interviewEnd.setMinutes(interviewEnd.getMinutes() + duration);

    const conflicts = await prisma.interviewPanelMember.findMany({
      where: {
        userId: { in: panelMemberIds },
        interview: {
          scheduledAt: {
            lt: interviewEnd,
          },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        interview: { select: { scheduledAt: true, duration: true } },
      },
    });

    const actualConflicts = conflicts.filter((c) => {
      const existingEnd = new Date(c.interview.scheduledAt);
      existingEnd.setMinutes(existingEnd.getMinutes() + c.interview.duration);
      return scheduledAt < existingEnd && interviewEnd > c.interview.scheduledAt;
    });

    return actualConflicts.map((c) => ({
      userId: c.userId,
      name: c.user.name ?? "Unknown",
    }));
  }

  private async checkCandidateConflict(
    candidateId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    const interviewEnd = new Date(scheduledAt);
    interviewEnd.setMinutes(interviewEnd.getMinutes() + duration);

    const conflict = await prisma.interview.findFirst({
      where: {
        candidateId,
        scheduledAt: { lt: interviewEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    if (!conflict) return false;

    const conflictEnd = new Date(conflict.scheduledAt);
    conflictEnd.setMinutes(conflictEnd.getMinutes() + conflict.duration);
    return scheduledAt < conflictEnd && interviewEnd > conflict.scheduledAt;
  }

  // ─── Scoring & Feedback ────────────────────────────────────────────────────

  async submitFeedback(
    interviewId: string,
    reviewerId: string,
    reviewerName: string,
    feedback: Omit<InterviewFeedback, "id" | "reviewerId" | "reviewerName" | "reviewerImage" | "submittedAt">
  ): Promise<InterviewFeedback> {
    const existing = await prisma.interviewFeedback.findFirst({
      where: { interviewId, reviewerId },
    });

    if (existing) {
      const updated = await prisma.interviewFeedback.update({
        where: { id: existing.id },
        data: {
          technicalScore: feedback.technicalScore,
          communicationScore: feedback.communicationScore,
          problemSolvingScore: feedback.problemSolvingScore,
          culturalFitScore: feedback.culturalFitScore,
          leadershipScore: feedback.leadershipScore,
          overallScore: feedback.overallScore,
          strengths: JSON.stringify(feedback.strengths),
          weaknesses: JSON.stringify(feedback.weaknesses),
          recommendation: feedback.recommendation,
          notes: feedback.notes,
        },
        include: {
          reviewer: { select: { id: true, name: true, image: true } },
        },
      });

      return {
        id: updated.id,
        reviewerId: updated.reviewerId,
        reviewerName: updated.reviewer?.name ?? reviewerName,
        reviewerImage: updated.reviewer?.image ?? null,
        technicalScore: updated.technicalScore,
        communicationScore: updated.communicationScore,
        problemSolvingScore: updated.problemSolvingScore,
        culturalFitScore: updated.culturalFitScore,
        leadershipScore: updated.leadershipScore,
        overallScore: updated.overallScore,
        strengths: JSON.parse(updated.strengths as string),
        weaknesses: JSON.parse(updated.weaknesses as string),
        recommendation: updated.recommendation as Recommendation,
        notes: updated.notes,
        submittedAt: updatedAt,
      };
    }

    const created = await prisma.interviewFeedback.create({
      data: {
        interviewId,
        reviewerId,
        technicalScore: feedback.technicalScore,
        communicationScore: feedback.communicationScore,
        problemSolvingScore: feedback.problemSolvingScore,
        culturalFitScore: feedback.culturalFitScore,
        leadershipScore: feedback.leadershipScore,
        overallScore: feedback.overallScore,
        strengths: JSON.stringify(feedback.strengths),
        weaknesses: JSON.stringify(feedback.weaknesses),
        recommendation: feedback.recommendation,
        notes: feedback.notes,
      },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
    });

    // Calculate average score
    const allFeedback = await prisma.interviewFeedback.findMany({
      where: { interviewId },
    });

    const avgScore =
      allFeedback.reduce((sum, f) => sum + f.overallScore, 0) / allFeedback.length;

    const recommendationCounts = allFeedback.reduce((acc, f) => {
      acc[f.recommendation] = (acc[f.recommendation] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const finalRecommendation: Recommendation =
      (recommendationCounts["STRONG_HIRE"] ?? 0) >= allFeedback.length / 2
        ? "STRONG_HIRE"
        : (recommendationCounts["HIRE"] ?? 0) >= allFeedback.length / 2
        ? "HIRE"
        : (recommendationCounts["NO_HIRE"] ?? 0) >= allFeedback.length / 2
        ? "NO_HIRE"
        : (recommendationCounts["STRONG_NO_HIRE"] ?? 0) >= allFeedback.length / 2
        ? "STRONG_NO_HIRE"
        : "NEUTRAL";

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        overallScore: avgScore,
        recommendation: finalRecommendation,
      },
    });

    return {
      id: created.id,
      reviewerId: created.reviewerId,
      reviewerName: created.reviewer?.name ?? reviewerName,
      reviewerImage: created.reviewer?.image ?? null,
      technicalScore: created.technicalScore,
      communicationScore: created.communicationScore,
      problemSolvingScore: created.problemSolvingScore,
      culturalFitScore: created.culturalFitScore,
      leadershipScore: created.leadershipScore,
      overallScore: created.overallScore,
      strengths: JSON.parse(created.strengths as string),
      weaknesses: JSON.parse(created.weaknesses as string),
      recommendation: created.recommendation as Recommendation,
      notes: created.notes,
      submittedAt: created.submittedAt,
    };
  }

  async getFeedback(interviewId: string): Promise<InterviewFeedback[]> {
    const feedbacks = await prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return feedbacks.map((f) => ({
      id: f.id,
      reviewerId: f.reviewerId,
      reviewerName: f.reviewer?.name ?? "Unknown",
      reviewerImage: f.reviewer?.image ?? null,
      technicalScore: f.technicalScore,
      communicationScore: f.communicationScore,
      problemSolvingScore: f.problemSolvingScore,
      culturalFitScore: f.culturalFitScore,
      leadershipScore: f.leadershipScore,
      overallScore: f.overallScore,
      strengths: JSON.parse(f.strengths as string),
      weaknesses: JSON.parse(f.weaknesses as string),
      recommendation: f.recommendation as Recommendation,
      notes: f.notes,
      submittedAt: f.submittedAt,
    }));
  }

  // ─── Notes ─────────────────────────────────────────────────────────────────

  async addNote(
    interviewId: string,
    authorId: string,
    authorName: string,
    content: string,
    isPrivate = false
  ): Promise<InterviewNote> {
    const note = await prisma.interviewNote.create({
      data: {
        interviewId,
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

  async getNotes(interviewId: string, includePrivate = false): Promise<InterviewNote[]> {
    const where: Record<string, unknown> = { interviewId };
    if (!includePrivate) where.isPrivate = false;

    const notes = await prisma.interviewNote.findMany({
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

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<InterviewStats> {
    const [
      totalInterviews,
      byType,
      byStatus,
      scoreAgg,
      noShowCount,
      completedCount,
      upcomingCount,
    ] = await Promise.all([
      prisma.interview.count({
        where: { job: { firmId } },
      }),
      prisma.interview.groupBy({
        by: ["type"],
        where: { job: { firmId } },
        _count: true,
      }),
      prisma.interview.groupBy({
        by: ["status"],
        where: { job: { firmId } },
        _count: true,
      }),
      prisma.interview.aggregate({
        where: { job: { firmId }, overallScore: { not: null } },
        _avg: { overallScore: true },
      }),
      prisma.interview.count({
        where: { job: { firmId }, status: "NO_SHOW" },
      }),
      prisma.interview.count({
        where: { job: { firmId }, status: "COMPLETED" },
      }),
      prisma.interview.count({
        where: { job: { firmId }, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      }),
    ]);

    return {
      totalInterviews,
      byType: byType.map((t) => ({ type: t.type as InterviewType, count: t._count })),
      byStatus: byStatus.map((s) => ({ status: s.status as InterviewStatus, count: s._count })),
      averageScore: scoreAgg._avg.overallScore ?? 0,
      noShowRate: totalInterviews > 0 ? Math.round((noShowCount / totalInterviews) * 100) : 0,
      completionRate: totalInterviews > 0 ? Math.round((completedCount / totalInterviews) * 100) : 0,
      averageTimeToSchedule: 0,
      upcomingInterviews: upcomingCount,
    };
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: InterviewFilter) {
    const where: Record<string, unknown> = {
      job: { firmId },
    };

    if (!filters) return where;

    if (filters.applicationId) where.applicationId = filters.applicationId;
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.type?.length) where.type = { in: filters.type };
    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.panelMemberId) {
      where.panelMembers = { some: { userId: filters.panelMemberId } };
    }
    if (filters.dateRange) {
      where.scheduledAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  private formatInterview(interview: any): Interview {
    return {
      ...interview,
      panelMembers: (interview.panelMembers ?? []).map((pm: any) => ({
        id: pm.id,
        userId: pm.userId,
        name: pm.user?.name ?? "Unknown",
        email: pm.user?.email ?? "",
        image: pm.user?.image ?? null,
        role: pm.role,
        scorecard: pm.scorecard,
      })),
      scorecard: interview.scorecard ? {
        ...interview.scorecard,
        strengths: typeof interview.scorecard.strengths === "string"
          ? JSON.parse(interview.scorecard.strengths)
          : interview.scorecard.strengths,
        weaknesses: typeof interview.scorecard.weaknesses === "string"
          ? JSON.parse(interview.scorecard.weaknesses)
          : interview.scorecard.weaknesses,
      } : null,
      notes: (interview.notes ?? []).map((n: any) => ({
        id: n.id,
        content: n.content,
        authorId: n.authorId,
        authorName: n.author?.name ?? "Unknown",
        authorImage: n.author?.image ?? null,
        isPrivate: n.isPrivate,
        createdAt: n.createdAt,
      })),
      metadata: interview.metadata
        ? (typeof interview.metadata === "string" ? JSON.parse(interview.metadata) : interview.metadata)
        : null,
    };
  }
}

export const interviewService = new InterviewService();
