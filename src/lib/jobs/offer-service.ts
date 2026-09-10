import { prisma } from "@/lib/prisma";
import { OfferStatus } from "@/types/job";

// ─── Offer Service ───────────────────────────────────────────────────────────
// Manages the full offer lifecycle: drafting, approval workflows,
// salary negotiations, electronic acceptance, and onboarding triggers.

export interface Offer {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  status: OfferStatus;
  title: string;
  department: string;
  salary: OfferSalary;
  equity: OfferEquity | null;
  benefits: OfferBenefits;
  startDate: Date;
  offerExpiresAt: Date;
  acceptanceDeadline: Date | null;
  signingBonus: number | null;
  relocationAssistance: number | null;
  remoteWorkDays: number | null;
  vacationDays: number | null;
  notes: string | null;
  specialConditions: string[];
  rejectionReason: string | null;
  rejectionNotes: string | null;
  negotiations: Negotiation[];
  approvals: OfferApproval[];
  sentAt: Date | null;
  viewedAt: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  expiresAt: Date | null;
  createdAtBy: string;
  createdAtByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferSalary {
  amount: number;
  currency: string;
  period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  isNegotiable: boolean;
  minAcceptable: number | null;
}

export interface OfferEquity {
  shares: number;
  vestingSchedule: string;
  cliffMonths: number;
  acceleration: string | null;
  type: "ISO" | "NSO" | "RSU" | "SAR" | null;
}

export interface OfferBenefits {
  healthInsurance: boolean;
  dentalInsurance: boolean;
  visionInsurance: boolean;
  retirementPlan: boolean;
  retirementMatchPercent: number | null;
  paidTimeOff: number;
  sickDays: number;
  parentalLeave: number;
  educationBudget: number | null;
  wellnessStipend: number | null;
  customBenefits: string[];
}

export interface Negotiation {
  id: string;
  offerId: string;
  field: string;
  originalValue: string;
  requestedValue: string;
  counterOfferValue: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";
  candidateNote: string | null;
  recruiterNote: string | null;
  negotiatedAt: Date;
  resolvedAt: Date | null;
}

export interface OfferApproval {
  id: string;
  approverId: string;
  approverName: string;
  approverImage: string | null;
  role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments: string | null;
  approvedAt: Date | null;
}

export interface CreateOfferInput {
  applicationId: string;
  title: string;
  department: string;
  salary: OfferSalary;
  equity?: OfferEquity;
  benefits: OfferBenefits;
  startDate: Date;
  offerExpiresAt: Date;
  acceptanceDeadline?: Date;
  signingBonus?: number;
  relocationAssistance?: number;
  remoteWorkDays?: number;
  vacationDays?: number;
  notes?: string;
  specialConditions?: string[];
  approverIds: string[];
  createdBy: string;
  createdByName: string;
  firmId: string;
}

export interface UpdateOfferInput {
  title?: string;
  department?: string;
  salary?: OfferSalary;
  equity?: OfferEquity;
  benefits?: OfferBenefits;
  startDate?: Date;
  offerExpiresAt?: Date;
  acceptanceDeadline?: Date;
  signingBonus?: number;
  relocationAssistance?: number;
  remoteWorkDays?: number;
  vacationDays?: number;
  notes?: string;
  specialConditions?: string[];
}

export interface NegotiationInput {
  field: string;
  originalValue: string;
  requestedValue: string;
  candidateNote?: string;
}

export interface OfferFilter {
  jobId?: string;
  candidateId?: string;
  status?: OfferStatus[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface OfferStats {
  totalOffers: number;
  byStatus: { status: OfferStatus; count: number }[];
  acceptanceRate: number;
  averageTimeToAccept: number;
  averageNegotiationRounds: number;
  topDeclineReasons: { reason: string; count: number }[];
  averageSalary: number;
  salaryRange: { min: number; max: number };
}

export class OfferService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateOfferInput): Promise<Offer> {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!application) throw new Error("Application not found");

    // Check if candidate already has an active offer for this job
    const existingOffer = await prisma.offer.findFirst({
      where: {
        applicationId: input.applicationId,
        status: { notIn: ["DECLINED", "WITHDRAWN", "EXPIRED"] },
      },
    });
    if (existingOffer) throw new Error("Candidate already has an active offer for this job");

    const offer = await prisma.offer.create({
      data: {
        applicationId: input.applicationId,
        jobId: application.jobId,
        candidateId: application.candidateId,
        status: "DRAFT",
        title: input.title,
        department: input.department,
        salaryAmount: input.salary.amount,
        salaryCurrency: input.salary.currency,
        salaryPeriod: input.salary.period,
        salaryNegotiable: input.salary.isNegotiable,
        salaryMinAcceptable: input.salary.minAcceptable ?? null,
        equityShares: input.equity?.shares ?? null,
        equityVestingSchedule: input.equity?.vestingSchedule ?? null,
        equityCliffMonths: input.equity?.cliffMonths ?? null,
        equityAcceleration: input.equity?.acceleration ?? null,
        equityType: input.equity?.type ?? null,
        benefitsHealth: input.benefits.healthInsurance,
        benefitsDental: input.benefits.dentalInsurance,
        benefitsVision: input.benefits.visionInsurance,
        benefitsRetirementPlan: input.benefits.retirementPlan,
        benefitsRetirementMatchPercent: input.benefits.retirementMatchPercent ?? null,
        benefitsPto: input.benefits.paidTimeOff,
        benefitsSickDays: input.benefits.sickDays,
        benefitsParentalLeave: input.benefits.parentalLeave,
        benefitsEducationBudget: input.benefits.educationBudget ?? null,
        benefitsWellnessStipend: input.benefits.wellnessStipend ?? null,
        benefitsCustom: JSON.stringify(input.benefits.customBenefits),
        startDate: input.startDate,
        offerExpiresAt: input.offerExpiresAt,
        acceptanceDeadline: input.acceptanceDeadline ?? null,
        signingBonus: input.signingBonus ?? null,
        relocationAssistance: input.relocationAssistance ?? null,
        remoteWorkDays: input.remoteWorkDays ?? null,
        vacationDays: input.vacationDays ?? null,
        notes: input.notes ?? null,
        specialConditions: JSON.stringify(input.specialConditions ?? []),
        createdAtBy: input.createdBy,
        approvals: {
          create: input.approverIds.map((userId) => ({
            userId,
            role: "APPROVER",
            status: "PENDING",
          })),
        },
      },
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
    });

    return this.formatOffer(offer);
  }

  async getById(offerId: string): Promise<Offer | null> {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, department: true } },
          },
        },
      },
    });

    return offer ? this.formatOffer(offer) : null;
  }

  async getAll(
    firmId: string,
    filters?: OfferFilter,
    page = 1,
    limit = 20
  ): Promise<{ offers: Offer[]; total: number }> {
    const where = this.buildWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          approvals: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          negotiations: true,
          application: {
            select: {
              candidate: { select: { firstName: true, lastName: true, email: true } },
              job: { select: { title: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.offer.count({ where }),
    ]);

    return {
      offers: offers.map((o) => this.formatOffer(o)),
      total,
    };
  }

  async update(offerId: string, input: UpdateOfferInput): Promise<Offer> {
    const existing = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existing) throw new Error("Offer not found");
    if (existing.status !== "DRAFT" && existing.status !== "NEGOTIATING") {
      throw new Error(`Cannot update offer in ${existing.status} status`);
    }

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.department !== undefined) data.department = input.department;
    if (input.startDate !== undefined) data.startDate = input.startDate;
    if (input.offerExpiresAt !== undefined) data.offerExpiresAt = input.offerExpiresAt;
    if (input.acceptanceDeadline !== undefined) data.acceptanceDeadline = input.acceptanceDeadline;
    if (input.signingBonus !== undefined) data.signingBonus = input.signingBonus;
    if (input.relocationAssistance !== undefined) data.relocationAssistance = input.relocationAssistance;
    if (input.remoteWorkDays !== undefined) data.remoteWorkDays = input.remoteWorkDays;
    if (input.vacationDays !== undefined) data.vacationDays = input.vacationDays;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.specialConditions !== undefined) data.specialConditions = JSON.stringify(input.specialConditions);

    if (input.salary !== undefined) {
      data.salaryAmount = input.salary.amount;
      data.salaryCurrency = input.salary.currency;
      data.salaryPeriod = input.salary.period;
      data.salaryNegotiable = input.salary.isNegotiable;
      data.salaryMinAcceptable = input.salary.minAcceptable ?? null;
    }

    if (input.equity !== undefined) {
      data.equityShares = input.equity?.shares ?? null;
      data.equityVestingSchedule = input.equity?.vestingSchedule ?? null;
      data.equityCliffMonths = input.equity?.cliffMonths ?? null;
      data.equityAcceleration = input.equity?.acceleration ?? null;
      data.equityType = input.equity?.type ?? null;
    }

    if (input.benefits !== undefined) {
      data.benefitsHealth = input.benefits.healthInsurance;
      data.benefitsDental = input.benefits.dentalInsurance;
      data.benefitsVision = input.benefits.visionInsurance;
      data.benefitsRetirementPlan = input.benefits.retirementPlan;
      data.benefitsRetirementMatchPercent = input.benefits.retirementMatchPercent ?? null;
      data.benefitsPto = input.benefits.paidTimeOff;
      data.benefitsSickDays = input.benefits.sickDays;
      data.benefitsParentalLeave = input.benefits.parentalLeave;
      data.benefitsEducationBudget = input.benefits.educationBudget ?? null;
      data.benefitsWellnessStipend = input.benefits.wellnessStipend ?? null;
      data.benefitsCustom = JSON.stringify(input.benefits.customBenefits);
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data,
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, department: true } },
          },
        },
      },
    });

    return this.formatOffer(updated);
  }

  async delete(offerId: string): Promise<void> {
    const existing = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existing) throw new Error("Offer not found");

    if (existing.status === "ACCEPTED") {
      throw new Error("Cannot delete an accepted offer");
    }

    await prisma.offer.delete({ where: { id: offerId } });
  }

  // ─── Approval Workflow ─────────────────────────────────────────────────────

  async submitForApproval(offerId: string): Promise<Offer> {
    const existing = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existing) throw new Error("Offer not found");
    if (existing.status !== "DRAFT") throw new Error("Offer is not in draft status");

    const approvals = await prisma.offerApproval.findMany({
      where: { offerId },
    });
    if (approvals.length === 0) throw new Error("No approvers assigned");

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "PENDING_APPROVAL" },
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, department: true } },
          },
        },
      },
    });

    return this.formatOffer(updated);
  }

  async approveOffer(
    offerId: string,
    approverId: string,
    comments?: string
  ): Promise<Offer> {
    const approval = await prisma.offerApproval.findFirst({
      where: { offerId, userId: approverId },
    });
    if (!approval) throw new Error("Approver not found for this offer");
    if (approval.status !== "PENDING") throw new Error("Approval already processed");

    await prisma.offerApproval.update({
      where: { id: approval.id },
      data: {
        status: "APPROVED",
        comments: comments ?? null,
        approvedAt: new Date(),
      },
    });

    // Check if all approvals are done
    const allApprovals = await prisma.offerApproval.findMany({
      where: { offerId },
    });

    const allApproved = allApprovals.every((a) => a.status === "APPROVED");
    const anyRejected = allApprovals.some((a) => a.status === "REJECTED");

    if (anyRejected) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: "DRAFT" },
      });
    } else if (allApproved) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: "SENT" },
      });
    }

    return (await this.getById(offerId))!;
  }

  async rejectApproval(
    offerId: string,
    approverId: string,
    comments: string
  ): Promise<Offer> {
    const approval = await prisma.offerApproval.findFirst({
      where: { offerId, userId: approverId },
    });
    if (!approval) throw new Error("Approver not found");

    await prisma.offerApproval.update({
      where: { id: approval.id },
      data: {
        status: "REJECTED",
        comments,
      },
    });

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "DRAFT" },
    });

    return (await this.getById(offerId))!;
  }

  // ─── Negotiations ──────────────────────────────────────────────────────────

  async startNegotiation(offerId: string, input: NegotiationInput): Promise<Negotiation> {
    const existing = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existing) throw new Error("Offer not found");
    if (existing.status !== "SENT") throw new Error("Offer must be sent before negotiation");

    const negotiation = await prisma.negotiation.create({
      data: {
        offerId,
        field: input.field,
        originalValue: input.originalValue,
        requestedValue: input.requestedValue,
        status: "PENDING",
        candidateNote: input.candidateNote ?? null,
        negotiatedAt: new Date(),
      },
    });

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "NEGOTIATING" },
    });

    return {
      id: negotiation.id,
      offerId: negotiation.offerId,
      field: negotiation.field,
      originalValue: negotiation.originalValue,
      requestedValue: negotiation.requestedValue,
      counterOfferValue: negotiation.counterOfferValue,
      status: negotiation.status as Negotiation["status"],
      candidateNote: negotiation.candidateNote,
      recruiterNote: negotiation.recruiterNote,
      negotiatedAt: negotiation.negotiatedAt,
      resolvedAt: negotiation.resolvedAt,
    };
  }

  async counterOffer(
    negotiationId: string,
    counterValue: string,
    recruiterNote?: string
  ): Promise<Negotiation> {
    const negotiation = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        counterOfferValue: counterValue,
        recruiterNote: recruiterNote ?? null,
        status: "COUNTERED",
      },
    });

    return {
      id: negotiation.id,
      offerId: negotiation.offerId,
      field: negotiation.field,
      originalValue: negotiation.originalValue,
      requestedValue: negotiation.requestedValue,
      counterOfferValue: negotiation.counterOfferValue,
      status: negotiation.status as Negotiation["status"],
      candidateNote: negotiation.candidateNote,
      recruiterNote: negotiation.recruiterNote,
      negotiatedAt: negotiation.negotiatedAt,
      resolvedAt: negotiation.resolvedAt,
    };
  }

  async resolveNegotiation(
    negotiationId: string,
    status: "ACCEPTED" | "REJECTED"
  ): Promise<Negotiation> {
    const negotiation = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status,
        resolvedAt: new Date(),
      },
    });

    // Check if all negotiations are resolved
    const allNegotiations = await prisma.negotiation.findMany({
      where: { offerId: negotiation.offerId },
    });

    const allResolved = allNegotiations.every((n) => n.status !== "PENDING" && n.status !== "COUNTERED");
    const anyRejected = allNegotiations.some((n) => n.status === "REJECTED");

    if (allResolved) {
      if (anyRejected) {
        await prisma.offer.update({
          where: { id: negotiation.offerId },
          data: { status: "SENT" },
        });
      } else {
        // Apply negotiated values to offer
        await prisma.offer.update({
          where: { id: negotiation.offerId },
          data: { status: "SENT" },
        });
      }
    }

    return {
      id: negotiation.id,
      offerId: negotiation.offerId,
      field: negotiation.field,
      originalValue: negotiation.originalValue,
      requestedValue: negotiation.requestedValue,
      counterOfferValue: negotiation.counterOfferValue,
      status: negotiation.status as Negotiation["status"],
      candidateNote: negotiation.candidateNote,
      recruiterNote: negotiation.recruiterNote,
      negotiatedAt: negotiation.negotiatedAt,
      resolvedAt: negotiation.resolvedAt,
    };
  }

  // ─── Acceptance & Decline ──────────────────────────────────────────────────

  async accept(offerId: string): Promise<Offer> {
    const existing = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existing) throw new Error("Offer not found");
    if (existing.status !== "SENT" && existing.status !== "NEGOTIATING") {
      throw new Error(`Cannot accept offer in ${existing.status} status`);
    }

    if (existing.acceptanceDeadline && new Date() > existing.acceptanceDeadline) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: "EXPIRED" },
      });
      throw new Error("Offer has expired");
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, department: true } },
          },
        },
      },
    });

    // Update application and candidate status
    await prisma.application.update({
      where: { id: existing.applicationId },
      data: {
        status: "HIRED",
        lastStatusChangeAt: new Date(),
      },
    });

    await prisma.candidate.update({
      where: { id: existing.candidateId },
      data: { status: "HIRED" },
    });

    await prisma.job.update({
      where: { id: existing.jobId },
      data: { filledCount: { increment: 1 } },
    });

    return this.formatOffer(updated);
  }

  async decline(offerId: string, reason: string, notes?: string): Promise<Offer> {
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
        rejectionReason: reason,
        rejectionNotes: notes ?? null,
      },
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, department: true } },
          },
        },
      },
    });

    await prisma.application.update({
      where: { id: updated.applicationId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedReason: reason,
      },
    });

    return this.formatOffer(updated);
  }

  async withdraw(offerId: string, reason: string): Promise<Offer> {
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "WITHDRAWN",
      },
      include: {
        approvals: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            job: { select: { title: true, department: true } },
          },
        },
      },
    });

    await prisma.application.update({
      where: { id: updated.applicationId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedReason: `Offer withdrawn: ${reason}`,
      },
    });

    return this.formatOffer(updated);
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<OfferStats> {
    const [
      totalOffers,
      byStatus,
      acceptedCount,
      declinedCount,
      salaryAgg,
      declinedOffers,
    ] = await Promise.all([
      prisma.offer.count({
        where: { job: { firmId } },
      }),
      prisma.offer.groupBy({
        by: ["status"],
        where: { job: { firmId } },
        _count: true,
      }),
      prisma.offer.count({
        where: { job: { firmId }, status: "ACCEPTED" },
      }),
      prisma.offer.count({
        where: { job: { firmId }, status: "DECLINED" },
      }),
      prisma.offer.aggregate({
        where: { job: { firmId } },
        _avg: { salaryAmount: true },
        _min: { salaryAmount: true },
        _max: { salaryAmount: true },
      }),
      prisma.offer.findMany({
        where: { job: { firmId }, status: "DECLINED", rejectionReason: { not: null } },
        select: { rejectionReason: true },
      }),
    ]);

    // Count decline reasons
    const reasonCounts = new Map<string, number>();
    declinedOffers.forEach((o) => {
      if (o.rejectionReason) {
        reasonCounts.set(o.rejectionReason, (reasonCounts.get(o.rejectionReason) ?? 0) + 1);
      }
    });

    // Average time to accept
    const acceptedOffers = await prisma.offer.findMany({
      where: { job: { firmId }, status: "ACCEPTED", acceptedAt: { not: null } },
      select: { createdAt: true, acceptedAt: true },
    });

    const avgTimeToAccept = acceptedOffers.length > 0
      ? acceptedOffers.reduce((sum, o) => {
          const days = Math.ceil(
            (o.acceptedAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / acceptedOffers.length
      : 0;

    return {
      totalOffers,
      byStatus: byStatus.map((s) => ({
        status: s.status as OfferStatus,
        count: s._count,
      })),
      acceptanceRate: totalOffers > 0
        ? Math.round((acceptedCount / totalOffers) * 100)
        : 0,
      averageTimeToAccept: Math.round(avgTimeToAccept),
      averageNegotiationRounds: 0,
      topDeclineReasons: Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      averageSalary: salaryAgg._avg.salaryAmount ?? 0,
      salaryRange: {
        min: salaryAgg._min.salaryAmount ?? 0,
        max: salaryAgg._max.salaryAmount ?? 0,
      },
    };
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: OfferFilter) {
    const where: Record<string, unknown> = {
      job: { firmId },
    };

    if (!filters) return where;

    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.dateRange) {
      where.createdAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };
    }

    return where;
  }

  private formatOffer(offer: any): Offer {
    return {
      ...offer,
      salary: {
        amount: offer.salaryAmount,
        currency: offer.salaryCurrency,
        period: offer.salaryPeriod,
        isNegotiable: offer.salaryNegotiable,
        minAcceptable: offer.salaryMinAcceptable,
      },
      equity: offer.equityShares !== null ? {
        shares: offer.equityShares,
        vestingSchedule: offer.equityVestingSchedule,
        cliffMonths: offer.equityCliffMonths,
        acceleration: offer.equityAcceleration,
        type: offer.equityType,
      } : null,
      benefits: {
        healthInsurance: offer.benefitsHealth,
        dentalInsurance: offer.benefitsDental,
        visionInsurance: offer.benefitsVision,
        retirementPlan: offer.benefitsRetirementPlan,
        retirementMatchPercent: offer.benefitsRetirementMatchPercent,
        paidTimeOff: offer.benefitsPto,
        sickDays: offer.benefitsSickDays,
        parentalLeave: offer.benefitsParentalLeave,
        educationBudget: offer.benefitsEducationBudget,
        wellnessStipend: offer.benefitsWellnessStipend,
        customBenefits: typeof offer.benefitsCustom === "string"
          ? JSON.parse(offer.benefitsCustom)
          : offer.benefitsCustom ?? [],
      },
      specialConditions: typeof offer.specialConditions === "string"
        ? JSON.parse(offer.specialConditions)
        : offer.specialConditions ?? [],
      negotiations: (offer.negotiations ?? []).map((n: any) => ({
        ...n,
        status: n.status,
      })),
      approvals: (offer.approvals ?? []).map((a: any) => ({
        id: a.id,
        approverId: a.userId,
        approverName: a.user?.name ?? "Unknown",
        approverImage: a.user?.image ?? null,
        role: a.role,
        status: a.status,
        comments: a.comments,
        approvedAt: a.approvedAt,
      })),
      metadata: offer.metadata
        ? (typeof offer.metadata === "string" ? JSON.parse(offer.metadata) : offer.metadata)
        : null,
    };
  }
}

export const offerService = new OfferService();
