import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
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
  job?: { id: string; title: string; department: string };
  candidate?: { id: string; firstName: string; lastName: string; email: string };
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
  paidTimeOff: number | null;
  sickDays: number | null;
  parentalLeave: boolean;
  remoteWork: boolean;
  homeOfficeStipend: number | null;
  learningBudget: number | null;
  gymMembership: boolean;
  otherBenefits: string[];
}

export interface Negotiation {
  id: string;
  offerId: string;
  proposedBy: string;
  proposedByName: string;
  field: string;
  previousValue: string;
  proposedValue: string;
  reason: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";
  respondedAt: Date | null;
  createdAt: Date;
}

export interface OfferApproval {
  id: string;
  offerId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments: string | null;
  respondedAt: Date | null;
  createdAt: Date;
}

export interface CreateOfferInput {
  applicationId: string;
  title: string;
  department: string;
  salary: OfferSalary;
  equity?: OfferEquity | null;
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
  equity?: OfferEquity | null;
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
  offerId: string;
  proposedBy: string;
  proposedByName: string;
  field: string;
  proposedValue: string;
  reason?: string;
}

export interface OfferFilter {
  jobId?: string;
  candidateId?: string;
  status?: OfferStatus[];
  minSalary?: number;
  maxSalary?: number;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export interface OfferStats {
  totalOffers: number;
  byStatus: { status: OfferStatus; count: number }[];
  averageSalary: number;
  acceptanceRate: number;
  averageTimeToAccept: number;
  totalValue: number;
  negotiationRate: number;
}

export class OfferService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateOfferInput): Promise<Offer> {
    const application = await prisma.application.findUnique({
      where: { id: input.applicationId },
      include: {
        job: { select: { id: true, title: true, department: true, firmId: true } },
        candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!application) throw AppError.notFound("Application");

    if (application.status !== "SHORTLISTED" && application.status !== "INTERVIEWING") {
      throw AppError.badRequest(
        "Application must be shortlisted or in interview stage to create an offer"
      );
    }

    const existingOffer = await prisma.offer.findFirst({
      where: {
        applicationId: input.applicationId,
        status: { notIn: ["DECLINED", "WITHDRAWN", "EXPIRED"] },
      },
    });
    if (existingOffer) {
      throw AppError.conflict("An active offer already exists for this application");
    }

    if (input.startDate <= new Date()) {
      throw AppError.badRequest("Start date must be in the future");
    }
    if (input.offerExpiresAt <= new Date()) {
      throw AppError.badRequest("Offer expiration date must be in the future");
    }

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
        salaryMinAcceptable: input.salary.minAcceptable,
        equity: input.equity ? JSON.stringify(input.equity) : null,
        benefits: JSON.stringify(input.benefits),
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
        createdAtByName: input.createdByName,
        approvals: {
          create: input.approverIds.map((approverId) => ({
            approverId,
            status: "PENDING",
          })),
        },
      },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
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
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: {
          orderBy: { createdAt: "desc" },
        },
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return offer ? this.formatOffer(offer) : null;
  }

  async getByIdOrThrow(offerId: string): Promise<Offer> {
    const offer = await this.getById(offerId);
    if (!offer) throw AppError.notFound("Offer");
    return offer;
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
              approver: { select: { id: true, name: true, role: true } },
            },
          },
          negotiations: true,
          application: {
            select: {
              id: true,
              candidate: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          job: { select: { id: true, title: true, department: true } },
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
    const existing = await this.getByIdOrThrow(offerId);

    if (!["DRAFT", "PENDING_APPROVAL"].includes(existing.status)) {
      throw AppError.badRequest("Only draft or pending offers can be edited");
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

    if (input.salary !== undefined) {
      data.salaryAmount = input.salary.amount;
      data.salaryCurrency = input.salary.currency;
      data.salaryPeriod = input.salary.period;
      data.salaryNegotiable = input.salary.isNegotiable;
      data.salaryMinAcceptable = input.salary.minAcceptable;
    }
    if (input.equity !== undefined) {
      data.equity = input.equity ? JSON.stringify(input.equity) : null;
    }
    if (input.benefits !== undefined) {
      data.benefits = JSON.stringify(input.benefits);
    }
    if (input.specialConditions !== undefined) {
      data.specialConditions = JSON.stringify(input.specialConditions);
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data,
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return this.formatOffer(updated);
  }

  async delete(offerId: string): Promise<void> {
    const offer = await this.getByIdOrThrow(offerId);

    if (!["DRAFT", "PENDING_APPROVAL"].includes(offer.status)) {
      throw AppError.badRequest("Only draft or pending offers can be deleted");
    }

    await prisma.offerApproval.deleteMany({ where: { offerId } });
    await prisma.offerNegotiation.deleteMany({ where: { offerId } });
    await prisma.offer.delete({ where: { id: offerId } });
  }

  // ─── Approval Workflow ──────────────────────────────────────────────────────

  async submitForApproval(offerId: string, submittedBy: string): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.status !== "DRAFT") {
      throw AppError.badRequest("Only draft offers can be submitted for approval");
    }

    const approvals = await prisma.offerApproval.findMany({
      where: { offerId },
    });

    if (approvals.length === 0) {
      throw AppError.badRequest("At least one approver is required");
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "PENDING_APPROVAL" },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return this.formatOffer(updated);
  }

  async approve(
    offerId: string,
    approverId: string,
    comments?: string
  ): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.status !== "PENDING_APPROVAL") {
      throw AppError.badRequest("Offer is not pending approval");
    }

    const approval = offer.approvals.find((a) => a.approverId === approverId);
    if (!approval) throw AppError.forbidden("You are not an approver for this offer");

    if (approval.status !== "PENDING") {
      throw AppError.badRequest("You have already acted on this offer");
    }

    await prisma.offerApproval.update({
      where: { id: approval.id },
      data: {
        status: "APPROVED",
        comments: comments ?? null,
        respondedAt: new Date(),
      },
    });

    const allApprovals = await prisma.offerApproval.findMany({
      where: { offerId },
    });

    const allApproved = allApprovals.every((a) =>
      a.id === approval.id ? true : a.status === "APPROVED"
    );

    if (allApproved) {
      await prisma.offer.update({
        where: { id: offerId },
        data: {
          status: "APPROVED",
          approvedBy: approverId,
        },
      });
    }

    return this.getByIdOrThrow(offerId);
  }

  async rejectApproval(
    offerId: string,
    approverId: string,
    reason: string
  ): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.status !== "PENDING_APPROVAL") {
      throw AppError.badRequest("Offer is not pending approval");
    }

    const approval = offer.approvals.find((a) => a.approverId === approverId);
    if (!approval) throw AppError.forbidden("You are not an approver for this offer");

    await prisma.offerApproval.update({
      where: { id: approval.id },
      data: {
        status: "REJECTED",
        comments: reason,
        respondedAt: new Date(),
      },
    });

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "DRAFT" },
    });

    return this.getByIdOrThrow(offerId);
  }

  // ─── Sending & Acceptance ───────────────────────────────────────────────────

  async send(offerId: string): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.status !== "APPROVED") {
      throw AppError.badRequest("Only approved offers can be sent to candidates");
    }

    if (offer.offerExpiresAt <= new Date()) {
      throw AppError.badRequest("Offer expiration date has passed");
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return this.formatOffer(updated);
  }

  async markViewed(offerId: string): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.status !== "SENT") {
      throw AppError.badRequest("Offer must be in SENT status to mark as viewed");
    }

    if (offer.viewedAt) {
      return offer;
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { viewedAt: new Date() },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return this.formatOffer(updated);
  }

  async accept(offerId: string, candidateId: string): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.candidateId !== candidateId) {
      throw AppError.forbidden("Only the candidate can accept the offer");
    }

    if (offer.status !== "SENT") {
      throw AppError.badRequest("Offer must be in SENT status to accept");
    }

    if (offer.offerExpiresAt < new Date()) {
      throw AppError.badRequest("This offer has expired");
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
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    await prisma.application.update({
      where: { id: offer.applicationId },
      data: { status: "HIRED" },
    });

    await prisma.job.update({
      where: { id: offer.jobId },
      data: { filledCount: { increment: 1 } },
    });

    await prisma.candidate.update({
      where: { id: offer.candidateId },
      data: { status: "HIRED" },
    });

    return this.formatOffer(updated);
  }

  async decline(
    offerId: string,
    candidateId: string,
    reason?: string
  ): Promise<Offer> {
    const offer = await this.getByIdOrThrow(offerId);

    if (offer.candidateId !== candidateId) {
      throw AppError.forbidden("Only the candidate can decline the offer");
    }

    if (!["SENT", "NEGOTIATING"].includes(offer.status)) {
      throw AppError.badRequest("This offer cannot be declined at this stage");
    }

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
        rejectionReason: reason ?? null,
      },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
    });

    return this.formatOffer(updated);
  }

  // ─── Negotiations ──────────────────────────────────────────────────────────

  async startNegotiation(input: NegotiationInput): Promise<Offer> {
    const offer = await this.getByIdOrThrow(input.offerId);

    if (!["SENT", "NEGOTIATING"].includes(offer.status)) {
      throw AppError.badRequest("Cannot negotiate an offer that is not sent or in negotiation");
    }

    const validFields = [
      "salary", "signingBonus", "relocationAssistance",
      "vacationDays", "remoteWorkDays", "startDate", "equity",
    ];
    if (!validFields.includes(input.field)) {
      throw AppError.badRequest(`Invalid negotiation field: ${input.field}`);
    }

    const currentValue = this.getOfferFieldValue(offer, input.field);

    await prisma.offerNegotiation.create({
      data: {
        offerId: input.offerId,
        proposedBy: input.proposedBy,
        field: input.field,
        previousValue: currentValue,
        proposedValue: input.proposedValue,
        reason: input.reason ?? null,
        status: "PENDING",
      },
    });

    await prisma.offer.update({
      where: { id: input.offerId },
      data: { status: "NEGOTIATING" },
    });

    return this.getByIdOrThrow(input.offerId);
  }

  async respondToNegotiation(
    negotiationId: string,
    status: "ACCEPTED" | "REJECTED" | "COUNTERED",
    responderId: string,
    counterValue?: string
  ): Promise<Offer> {
    const negotiation = await prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
    });
    if (!negotiation) throw AppError.notFound("Negotiation");

    await prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    if (status === "ACCEPTED" && counterValue) {
      const offer = await this.getByIdOrThrow(negotiation.offerId);
      const updateInput: UpdateOfferInput = {};

      switch (negotiation.field) {
        case "salary":
          updateInput.salary = {
            ...offer.salary,
            amount: parseFloat(counterValue),
          };
          break;
        case "signingBonus":
          updateInput.signingBonus = parseFloat(counterValue);
          break;
        case "vacationDays":
          updateInput.vacationDays = parseInt(counterValue);
          break;
      }

      await this.update(negotiation.offerId, updateInput);
    }

    const pendingNegotiations = await prisma.offerNegotiation.findMany({
      where: {
        offerId: negotiation.offerId,
        status: "PENDING",
      },
    });

    if (pendingNegotiations.length === 0) {
      await prisma.offer.update({
        where: { id: negotiation.offerId },
        data: { status: "SENT" },
      });
    }

    return this.getByIdOrThrow(negotiation.offerId);
  }

  private getOfferFieldValue(offer: Offer, field: string): string {
    switch (field) {
      case "salary": return offer.salary.amount.toString();
      case "signingBonus": return (offer.signingBonus ?? 0).toString();
      case "relocationAssistance": return (offer.relocationAssistance ?? 0).toString();
      case "vacationDays": return (offer.vacationDays ?? 0).toString();
      case "remoteWorkDays": return (offer.remoteWorkDays ?? 0).toString();
      case "startDate": return offer.startDate.toISOString();
      default: return "";
    }
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<OfferStats> {
    const [total, byStatus, salaryAgg, acceptedCount, negotiationCount] = await Promise.all([
      prisma.offer.count({
        where: { job: { firmId } },
      }),
      prisma.offer.groupBy({
        by: ["status"],
        where: { job: { firmId } },
        _count: true,
      }),
      prisma.offer.aggregate({
        where: { job: { firmId }, status: { notIn: ["DRAFT", "DECLINED"] } },
        _avg: { salaryAmount: true },
        _sum: { salaryAmount: true },
      }),
      prisma.offer.count({
        where: { job: { firmId }, status: "ACCEPTED" },
      }),
      prisma.offer.count({
        where: { job: { firmId }, negotiations: { some: {} } },
      }),
    ]);

    const sentCount = byStatus
      .filter((s) => ["SENT", "ACCEPTED", "DECLINED", "NEGOTIATING"].includes(s.status))
      .reduce((sum, s) => sum + s._count, 0);

    return {
      totalOffers: total,
      byStatus: byStatus.map((s) => ({
        status: s.status as OfferStatus,
        count: s._count,
      })),
      averageSalary: salaryAgg._avg.salaryAmount ?? 0,
      acceptanceRate: sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0,
      averageTimeToAccept: 0,
      totalValue: salaryAgg._sum.salaryAmount ?? 0,
      negotiationRate: total > 0 ? Math.round((negotiationCount / total) * 100) : 0,
    };
  }

  async getExpiringOffers(firmId: string, withinDays = 3): Promise<Offer[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    const offers = await prisma.offer.findMany({
      where: {
        job: { firmId },
        status: "SENT",
        offerExpiresAt: { lte: futureDate, gte: new Date() },
      },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
        negotiations: true,
        application: {
          select: {
            id: true,
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
      orderBy: { offerExpiresAt: "asc" },
    });

    return offers.map((o) => this.formatOffer(o));
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: OfferFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      job: { firmId },
    };

    if (!filters) return where;

    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.minSalary) {
      where.salaryAmount = { ...(where.salaryAmount as object ?? {}), gte: filters.minSalary };
    }
    if (filters.maxSalary) {
      where.salaryAmount = { ...(where.salaryAmount as object ?? {}), lte: filters.maxSalary };
    }
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        {
          candidate: {
            firstName: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    return where;
  }

  private formatOffer(raw: any): Offer {
    return {
      id: raw.id,
      applicationId: raw.applicationId,
      jobId: raw.jobId,
      candidateId: raw.candidateId,
      status: raw.status,
      title: raw.title,
      department: raw.department,
      salary: {
        amount: raw.salaryAmount,
        currency: raw.salaryCurrency,
        period: raw.salaryPeriod,
        isNegotiable: raw.salaryNegotiable,
        minAcceptable: raw.salaryMinAcceptable,
      },
      equity: raw.equity ? JSON.parse(raw.equity) : null,
      benefits: JSON.parse(raw.benefits ?? "{}"),
      startDate: raw.startDate,
      offerExpiresAt: raw.offerExpiresAt,
      acceptanceDeadline: raw.acceptanceDeadline,
      signingBonus: raw.signingBonus,
      relocationAssistance: raw.relocationAssistance,
      remoteWorkDays: raw.remoteWorkDays,
      vacationDays: raw.vacationDays,
      notes: raw.notes,
      specialConditions: JSON.parse(raw.specialConditions ?? "[]"),
      rejectionReason: raw.rejectionReason,
      rejectionNotes: raw.rejectionNotes,
      negotiations: (raw.negotiations ?? []).map((n: any) => ({
        id: n.id,
        offerId: n.offerId,
        proposedBy: n.proposedBy,
        proposedByName: "",
        field: n.field,
        previousValue: n.previousValue,
        proposedValue: n.proposedValue,
        reason: n.reason,
        status: n.status,
        respondedAt: n.respondedAt,
        createdAt: n.createdAt,
      })),
      approvals: (raw.approvals ?? []).map((a: any) => ({
        id: a.id,
        offerId: a.offerId,
        approverId: a.approverId,
        approverName: a.approver?.name ?? "",
        approverRole: a.approver?.role ?? "",
        status: a.status,
        comments: a.comments,
        respondedAt: a.respondedAt,
        createdAt: a.createdAt,
      })),
      sentAt: raw.sentAt,
      viewedAt: raw.viewedAt,
      acceptedAt: raw.acceptedAt,
      declinedAt: raw.declinedAt,
      expiresAt: raw.expiresAt,
      createdAtBy: raw.createdAtBy,
      createdAtByName: raw.createdAtByName,
      approvedBy: raw.approvedBy,
      approvedByName: raw.approvedByName ?? null,
      metadata: raw.metadata,
      job: raw.job,
      candidate: raw.application?.candidate,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const offerService = new OfferService();
