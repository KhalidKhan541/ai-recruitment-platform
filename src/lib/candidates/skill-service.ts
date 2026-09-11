import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { SkillLevel, AssessmentStatus, CertificationStatus } from "@/types/candidate";

// ─── Skill Service ───────────────────────────────────────────────────────────
// Manages skill assessments, certifications, endorsements,
// skill gap analysis, and candidate skill verification.

export interface SkillAssessment {
  id: string;
  candidateId: string;
  name: string;
  description: string | null;
  category: string;
  skillName: string;
  score: number | null;
  maxScore: number;
  passingScore: number;
  status: AssessmentStatus;
  assessmentUrl: string | null;
  duration: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  certificateUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillCertification {
  id: string;
  candidateId: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date | null;
  credentialId: string | null;
  credentialUrl: string | null;
  verificationUrl: string | null;
  status: CertificationStatus;
  skills: string[];
  description: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillEndorsement {
  id: string;
  candidateSkillId: string;
  endorserId: string;
  endorserName: string;
  endorserImage: string | null;
  relationship: string;
  comment: string | null;
  createdAt: Date;
}

export interface SkillGap {
  skill: string;
  requiredLevel: SkillLevel;
  currentLevel: SkillLevel;
  gap: number;
  isRequired: boolean;
  recommendedAssessments: string[];
}

export interface CreateAssessmentInput {
  candidateId: string;
  name: string;
  description?: string;
  category: string;
  skillName: string;
  maxScore?: number;
  passingScore?: number;
  assessmentUrl?: string;
  duration?: number;
  expiresAt?: Date;
}

export interface UpdateAssessmentInput {
  name?: string;
  description?: string;
  score?: number;
  status?: AssessmentStatus;
  assessmentUrl?: string;
  expiresAt?: Date;
}

export interface CreateCertificationInput {
  candidateId: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  verificationUrl?: string;
  skills: string[];
  description?: string;
  imageUrl?: string;
}

export interface UpdateCertificationInput {
  name?: string;
  issuer?: string;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  verificationUrl?: string;
  skills?: string[];
  description?: string;
  status?: CertificationStatus;
}

export interface SkillAssessmentFilter {
  candidateId?: string;
  category?: string;
  skillName?: string;
  status?: AssessmentStatus[];
  dateRange?: { start: Date; end: Date };
}

export interface CertificationFilter {
  candidateId?: string;
  issuer?: string;
  status?: CertificationStatus[];
  expiringBefore?: Date;
  dateRange?: { start: Date; end: Date };
}

export interface SkillStats {
  totalAssessments: number;
  totalCertifications: number;
  passRate: number;
  averageScore: number;
  topCategories: { category: string; count: number }[];
  expiringCertifications: number;
  verifiedSkillsCount: number;
  totalEndorsements: number;
}

const LEVEL_HIERARCHY: Record<string, number> = {
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  EXPERT: 5,
};

export class SkillService {
  // ─── Assessments ────────────────────────────────────────────────────────────

  async createAssessment(input: CreateAssessmentInput): Promise<SkillAssessment> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw AppError.notFound("Candidate");

    const assessment = await prisma.skillAssessment.create({
      data: {
        candidateId: input.candidateId,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        skillName: input.skillName,
        score: null,
        maxScore: input.maxScore ?? 100,
        passingScore: input.passingScore ?? 70,
        status: "PENDING",
        assessmentUrl: input.assessmentUrl ?? null,
        duration: input.duration ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });

    return this.formatAssessment(assessment);
  }

  async getAssessment(assessmentId: string): Promise<SkillAssessment | null> {
    const assessment = await prisma.skillAssessment.findUnique({
      where: { id: assessmentId },
    });
    return assessment ? this.formatAssessment(assessment) : null;
  }

  async getAssessmentOrThrow(assessmentId: string): Promise<SkillAssessment> {
    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) throw AppError.notFound("Assessment");
    return assessment;
  }

  async updateAssessment(
    assessmentId: string,
    input: UpdateAssessmentInput
  ): Promise<SkillAssessment> {
    const existing = await this.getAssessmentOrThrow(assessmentId);

    if (existing.status === "COMPLETED" || existing.status === "EXPIRED") {
      throw AppError.badRequest("Cannot update a completed or expired assessment");
    }

    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.assessmentUrl !== undefined) data.assessmentUrl = input.assessmentUrl;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;

    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "IN_PROGRESS" && !existing.startedAt) {
        data.startedAt = new Date();
      }
      if (input.status === "COMPLETED") {
        data.completedAt = new Date();
      }
    }

    if (input.score !== undefined) {
      if (input.score < 0 || input.score > existing.maxScore) {
        throw AppError.badRequest(
          `Score must be between 0 and ${existing.maxScore}`
        );
      }
      data.score = input.score;
      if (existing.status !== "COMPLETED") {
        data.status = "COMPLETED";
        data.completedAt = new Date();
      }

      if (input.score >= existing.passingScore) {
        await this.upsertCandidateSkill(
          existing.candidateId,
          existing.skillName,
          this.getLevelFromScore(input.score, existing.maxScore)
        );
      }
    }

    const updated = await prisma.skillAssessment.update({
      where: { id: assessmentId },
      data,
    });

    return this.formatAssessment(updated);
  }

  async startAssessment(assessmentId: string): Promise<SkillAssessment> {
    return this.updateAssessment(assessmentId, { status: "IN_PROGRESS" });
  }

  async completeAssessment(assessmentId: string, score: number): Promise<SkillAssessment> {
    return this.updateAssessment(assessmentId, { score, status: "COMPLETED" });
  }

  async getCandidateAssessments(candidateId: string): Promise<SkillAssessment[]> {
    const assessments = await prisma.skillAssessment.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });
    return assessments.map((a) => this.formatAssessment(a));
  }

  async getAssessments(
    firmId: string,
    filters?: SkillAssessmentFilter,
    page = 1,
    limit = 20
  ): Promise<{ assessments: SkillAssessment[]; total: number }> {
    const where = this.buildAssessmentWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      prisma.skillAssessment.findMany({
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
      prisma.skillAssessment.count({ where }),
    ]);

    return {
      assessments: assessments.map((a) => this.formatAssessment(a)),
      total,
    };
  }

  async deleteAssessment(assessmentId: string): Promise<void> {
    const assessment = await this.getAssessmentOrThrow(assessmentId);
    if (assessment.status === "COMPLETED") {
      throw AppError.badRequest("Cannot delete a completed assessment");
    }
    await prisma.skillAssessment.delete({ where: { id: assessmentId } });
  }

  // ─── Certifications ─────────────────────────────────────────────────────────

  async createCertification(input: CreateCertificationInput): Promise<SkillCertification> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: input.candidateId },
    });
    if (!candidate) throw AppError.notFound("Candidate");

    const certification = await prisma.skillCertification.create({
      data: {
        candidateId: input.candidateId,
        name: input.name,
        issuer: input.issuer,
        issueDate: input.issueDate,
        expiryDate: input.expiryDate ?? null,
        credentialId: input.credentialId ?? null,
        credentialUrl: input.credentialUrl ?? null,
        verificationUrl: input.verificationUrl ?? null,
        status: this.determineCertificationStatus(input.expiryDate),
        skills: JSON.stringify(input.skills),
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });

    for (const skill of input.skills) {
      await this.upsertCandidateSkill(input.candidateId, skill, "INTERMEDIATE", true);
    }

    return this.formatCertification(certification);
  }

  async getCertification(certId: string): Promise<SkillCertification | null> {
    const cert = await prisma.skillCertification.findUnique({
      where: { id: certId },
    });
    return cert ? this.formatCertification(cert) : null;
  }

  async getCertificationOrThrow(certId: string): Promise<SkillCertification> {
    const cert = await this.getCertification(certId);
    if (!cert) throw AppError.notFound("Certification");
    return cert;
  }

  async updateCertification(
    certId: string,
    input: UpdateCertificationInput
  ): Promise<SkillCertification> {
    await this.getCertificationOrThrow(certId);

    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.issuer !== undefined) data.issuer = input.issuer;
    if (input.expiryDate !== undefined) {
      data.expiryDate = input.expiryDate;
      data.status = this.determineCertificationStatus(input.expiryDate);
    }
    if (input.credentialId !== undefined) data.credentialId = input.credentialId;
    if (input.credentialUrl !== undefined) data.credentialUrl = input.credentialUrl;
    if (input.verificationUrl !== undefined) data.verificationUrl = input.verificationUrl;
    if (input.skills !== undefined) data.skills = JSON.stringify(input.skills);
    if (input.description !== undefined) data.description = input.description;
    if (input.status !== undefined) data.status = input.status;

    const updated = await prisma.skillCertification.update({
      where: { id: certId },
      data,
    });

    return this.formatCertification(updated);
  }

  async deleteCertification(certId: string): Promise<void> {
    await this.getCertificationOrThrow(certId);
    await prisma.skillCertification.delete({ where: { id: certId } });
  }

  async getCandidateCertifications(candidateId: string): Promise<SkillCertification[]> {
    const certs = await prisma.skillCertification.findMany({
      where: { candidateId },
      orderBy: { issueDate: "desc" },
    });
    return certs.map((c) => this.formatCertification(c));
  }

  async getCertifications(
    firmId: string,
    filters?: CertificationFilter,
    page = 1,
    limit = 20
  ): Promise<{ certifications: SkillCertification[]; total: number }> {
    const where = this.buildCertificationWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [certs, total] = await Promise.all([
      prisma.skillCertification.findMany({
        where,
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { issueDate: "desc" },
      }),
      prisma.skillCertification.count({ where }),
    ]);

    return {
      certifications: certs.map((c) => this.formatCertification(c)),
      total,
    };
  }

  async verifyCertification(certId: string, verified: boolean): Promise<SkillCertification> {
    const status: CertificationStatus = verified ? "VERIFIED" : "UNVERIFIED";
    return this.updateCertification(certId, { status });
  }

  async getExpiringCertifications(firmId: string, withinDays = 30): Promise<SkillCertification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    const certs = await prisma.skillCertification.findMany({
      where: {
        candidate: { firmId, isActive: true },
        expiryDate: { not: null, lte: futureDate, gte: new Date() },
        status: { not: "EXPIRED" },
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    return certs.map((c) => this.formatCertification(c));
  }

  // ─── Endorsements ──────────────────────────────────────────────────────────

  async addEndorsement(
    candidateSkillId: string,
    endorserId: string,
    endorserName: string,
    relationship: string,
    comment?: string
  ): Promise<SkillEndorsement> {
    const skill = await prisma.candidateSkill.findUnique({
      where: { id: candidateSkillId },
    });
    if (!skill) throw AppError.notFound("Candidate skill");

    if (skill.candidateId === endorserId) {
      throw AppError.badRequest("Cannot endorse your own skills");
    }

    const existing = await prisma.skillEndorsement.findFirst({
      where: { candidateSkillId, endorserId },
    });
    if (existing) throw AppError.conflict("You have already endorsed this skill");

    const endorsement = await prisma.skillEndorsement.create({
      data: {
        candidateSkillId,
        endorserId,
        relationship,
        comment: comment ?? null,
      },
      include: {
        endorser: { select: { id: true, name: true, image: true } },
      },
    });

    await prisma.candidateSkill.update({
      where: { id: candidateSkillId },
      data: { endorsements: { increment: 1 } },
    });

    return {
      id: endorsement.id,
      candidateSkillId: endorsement.candidateSkillId,
      endorserId: endorsement.endorserId,
      endorserName: endorsement.endorser?.name ?? endorserName,
      endorserImage: endorsement.endorser?.image ?? null,
      relationship: endorsement.relationship,
      comment: endorsement.comment,
      createdAt: endorsement.createdAt,
    };
  }

  async removeEndorsement(endorsementId: string, requestorId: string): Promise<void> {
    const endorsement = await prisma.skillEndorsement.findUnique({
      where: { id: endorsementId },
    });
    if (!endorsement) throw AppError.notFound("Endorsement");

    if (endorsement.endorserId !== requestorId) {
      throw AppError.forbidden("Only the endorser can remove their endorsement");
    }

    await prisma.skillEndorsement.delete({ where: { id: endorsementId } });

    await prisma.candidateSkill.update({
      where: { id: endorsement.candidateSkillId },
      data: { endorsements: { decrement: 1 } },
    });
  }

  async getEndorsements(candidateSkillId: string): Promise<SkillEndorsement[]> {
    const endorsements = await prisma.skillEndorsement.findMany({
      where: { candidateSkillId },
      include: {
        endorser: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return endorsements.map((e) => ({
      id: e.id,
      candidateSkillId: e.candidateSkillId,
      endorserId: e.endorserId,
      endorserName: e.endorser?.name ?? "",
      endorserImage: e.endorser?.image ?? null,
      relationship: e.relationship,
      comment: e.comment,
      createdAt: e.createdAt,
    }));
  }

  // ─── Skill Gap Analysis ─────────────────────────────────────────────────────

  async analyzeSkillGap(
    candidateId: string,
    jobId: string
  ): Promise<SkillGap[]> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { skills: true },
    });
    if (!candidate) throw AppError.notFound("Candidate");

    const jobSkills = await prisma.jobRequiredSkill.findMany({
      where: { jobId },
    });

    const candidateSkillMap = new Map(
      candidate.skills.map((s) => [s.skillName.toLowerCase(), s.level])
    );

    const gaps: SkillGap[] = [];

    for (const jobSkill of jobSkills) {
      const currentLevel = candidateSkillMap.get(jobSkill.skillName.toLowerCase()) ?? null;
      const currentNum = currentLevel ? LEVEL_HIERARCHY[currentLevel] ?? 0 : 0;
      const requiredNum = LEVEL_HIERARCHY[jobSkill.minimumLevel] ?? 3;
      const gap = Math.max(0, requiredNum - currentNum);

      if (gap > 0) {
        gaps.push({
          skill: jobSkill.skillName,
          requiredLevel: jobSkill.minimumLevel as SkillLevel,
          currentLevel: (currentLevel as SkillLevel) ?? "BEGINNER",
          gap,
          isRequired: jobSkill.isRequired,
          recommendedAssessments: [],
        });
      }
    }

    return gaps.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return b.gap - a.gap;
    });
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<SkillStats> {
    const candidateWhere = { candidate: { firmId, isActive: true } };

    const [totalAssessments, completedAssessments, totalCertifications, expiringCerts] =
      await Promise.all([
        prisma.skillAssessment.count({ where: candidateWhere }),
        prisma.skillAssessment.findMany({
          where: { ...candidateWhere, status: "COMPLETED" },
          select: { score: true, passingScore: true },
        }),
        prisma.skillCertification.count({ where: candidateWhere }),
        prisma.skillCertification.count({
          where: {
            ...candidateWhere,
            expiryDate: { not: null, lte: new Date(Date.now() + 30 * 86400000), gte: new Date() },
          },
        }),
      ]);

    const passedCount = completedAssessments.filter(
      (a) => a.score !== null && a.passingScore !== null && a.score >= a.passingScore
    ).length;

    const avgScore = completedAssessments.length > 0
      ? Math.round(
          completedAssessments
            .filter((a) => a.score !== null)
            .reduce((sum, a) => sum + (a.score ?? 0), 0) /
            completedAssessments.filter((a) => a.score !== null).length
        )
      : 0;

    const categoryStats = await prisma.skillAssessment.groupBy({
      by: ["category"],
      where: candidateWhere,
      _count: true,
      orderBy: { _count: { category: "desc" } },
    });

    const verifiedSkills = await prisma.candidateSkill.count({
      where: {
        candidate: { firmId, isActive: true },
        isVerified: true,
      },
    });

    const totalEndorsements = await prisma.skillEndorsement.count({
      where: {
        candidateSkill: {
          candidate: { firmId, isActive: true },
        },
      },
    });

    return {
      totalAssessments,
      totalCertifications,
      passRate:
        completedAssessments.length > 0
          ? Math.round((passedCount / completedAssessments.length) * 100)
          : 0,
      averageScore: avgScore,
      topCategories: categoryStats.map((c) => ({
        category: c.category,
        count: c._count,
      })),
      expiringCertifications: expiringCerts,
      verifiedSkillsCount: verifiedSkills,
      totalEndorsements,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async upsertCandidateSkill(
    candidateId: string,
    skillName: string,
    level: SkillLevel,
    isVerified = false
  ): Promise<void> {
    const existing = await prisma.candidateSkill.findFirst({
      where: { candidateId, skillName },
    });

    if (existing) {
      const existingLevelNum = LEVEL_HIERARCHY[existing.level] ?? 0;
      const newLevelNum = LEVEL_HIERARCHY[level] ?? 0;
      if (newLevelNum > existingLevelNum) {
        await prisma.candidateSkill.update({
          where: { id: existing.id },
          data: { level, isVerified: existing.isVerified || isVerified },
        });
      }
    } else {
      await prisma.candidateSkill.create({
        data: {
          candidateId,
          skillName,
          level,
          isVerified,
          endorsements: 0,
        },
      });
    }
  }

  private getLevelFromScore(score: number, maxScore: number): SkillLevel {
    const percent = (score / maxScore) * 100;
    if (percent >= 90) return "EXPERT";
    if (percent >= 75) return "ADVANCED";
    if (percent >= 60) return "INTERMEDIATE";
    if (percent >= 40) return "ELEMENTARY";
    return "BEGINNER";
  }

  private determineCertificationStatus(expiryDate?: Date | null): CertificationStatus {
    if (!expiryDate) return "ACTIVE";
    if (expiryDate < new Date()) return "EXPIRED";
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 30) return "EXPIRING_SOON";
    return "ACTIVE";
  }

  private buildAssessmentWhereClause(
    firmId: string,
    filters?: SkillAssessmentFilter
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {
      candidate: { firmId, isActive: true },
    };

    if (!filters) return where;

    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.category) where.category = filters.category;
    if (filters.skillName) where.skillName = { contains: filters.skillName, mode: "insensitive" };
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  private buildCertificationWhereClause(
    firmId: string,
    filters?: CertificationFilter
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {
      candidate: { firmId, isActive: true },
    };

    if (!filters) return where;

    if (filters.candidateId) where.candidateId = filters.candidateId;
    if (filters.issuer) where.issuer = { contains: filters.issuer, mode: "insensitive" };
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.expiringBefore) {
      where.expiryDate = { lte: filters.expiringBefore, gte: new Date() };
    }
    if (filters.dateRange) {
      where.issueDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  private formatAssessment(raw: any): SkillAssessment {
    return {
      id: raw.id,
      candidateId: raw.candidateId,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      skillName: raw.skillName,
      score: raw.score,
      maxScore: raw.maxScore,
      passingScore: raw.passingScore,
      status: raw.status,
      assessmentUrl: raw.assessmentUrl,
      duration: raw.duration,
      startedAt: raw.startedAt,
      completedAt: raw.completedAt,
      expiresAt: raw.expiresAt,
      certificateUrl: raw.certificateUrl,
      metadata: raw.metadata,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private formatCertification(raw: any): SkillCertification {
    return {
      id: raw.id,
      candidateId: raw.candidateId,
      name: raw.name,
      issuer: raw.issuer,
      issueDate: raw.issueDate,
      expiryDate: raw.expiryDate,
      credentialId: raw.credentialId,
      credentialUrl: raw.credentialUrl,
      verificationUrl: raw.verificationUrl,
      status: raw.status,
      skills: typeof raw.skills === "string" ? JSON.parse(raw.skills) : raw.skills,
      description: raw.description,
      imageUrl: raw.imageUrl,
      metadata: raw.metadata,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const skillService = new SkillService();
