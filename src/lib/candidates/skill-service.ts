import { prisma } from "@/lib/prisma";
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
  skillName: string;
  currentLevel: SkillLevel | null;
  requiredLevel: SkillLevel;
  gap: number;
  certifications: string[];
  assessments: { name: string; score: number | null; completedAt: Date | null }[];
}

export interface CreateAssessmentInput {
  candidateId: string;
  name: string;
  description?: string;
  category: string;
  skillName: string;
  maxScore: number;
  passingScore: number;
  assessmentUrl?: string;
  duration?: number;
  expiresAt?: Date;
  firmId: string;
}

export interface UpdateAssessmentInput {
  name?: string;
  description?: string;
  score?: number;
  status?: AssessmentStatus;
  assessmentUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
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
  firmId: string;
}

export interface UpdateCertificationInput {
  name?: string;
  issuer?: string;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  verificationUrl?: string;
  status?: CertificationStatus;
  skills?: string[];
  description?: string;
  imageUrl?: string;
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
  issuer?: string[];
  status?: CertificationStatus[];
  expiringWithin?: number;
  dateRange?: { start: Date; end: Date };
}

export interface SkillStats {
  totalAssessments: number;
  totalCertifications: number;
  byCategory: { category: string; count: number; avgScore: number }[];
  byStatus: { status: string; count: number }[];
  topSkills: { skill: string; assessmentCount: number; avgScore: number }[];
  expiringCertifications: number;
  verificationRate: number;
}

export class SkillService {
  // ─── Assessments ───────────────────────────────────────────────────────────

  async createAssessment(input: CreateAssessmentInput): Promise<SkillAssessment> {
    const candidate = await prisma.candidate.findUnique({ where: { id: input.candidateId } });
    if (!candidate) throw new Error("Candidate not found");

    const assessment = await prisma.skillAssessment.create({
      data: {
        candidateId: input.candidateId,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        skillName: input.skillName,
        maxScore: input.maxScore,
        passingScore: input.passingScore,
        status: "NOT_STARTED",
        assessmentUrl: input.assessmentUrl ?? null,
        duration: input.duration ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });

    return this.formatAssessment(assessment);
  }

  async getAssessmentById(assessmentId: string): Promise<SkillAssessment | null> {
    const assessment = await prisma.skillAssessment.findUnique({ where: { id: assessmentId } });
    return assessment ? this.formatAssessment(assessment) : null;
  }

  async getCandidateAssessments(candidateId: string): Promise<SkillAssessment[]> {
    const assessments = await prisma.skillAssessment.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });
    return assessments.map((a) => this.formatAssessment(a));
  }

  async updateAssessment(assessmentId: string, input: UpdateAssessmentInput): Promise<SkillAssessment> {
    const existing = await prisma.skillAssessment.findUnique({ where: { id: assessmentId } });
    if (!existing) throw new Error("Assessment not found");

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.score !== undefined) data.score = input.score;
    if (input.assessmentUrl !== undefined) data.assessmentUrl = input.assessmentUrl;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
    if (input.metadata !== undefined) data.metadata = JSON.stringify(input.metadata);

    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "IN_PROGRESS" && !existing.startedAt) data.startedAt = new Date();
      if (input.status === "COMPLETED") data.completedAt = new Date();
    }

    if (input.score !== undefined && existing.status !== "COMPLETED") {
      data.status = "COMPLETED";
      data.completedAt = new Date();
      if (!existing.startedAt) data.startedAt = new Date();
    }

    const updated = await prisma.skillAssessment.update({ where: { id: assessmentId }, data });
    return this.formatAssessment(updated);
  }

  async startAssessment(assessmentId: string): Promise<SkillAssessment> {
    return this.updateAssessment(assessmentId, { status: "IN_PROGRESS" });
  }

  async completeAssessment(assessmentId: string, score: number): Promise<SkillAssessment> {
    const assessment = await prisma.skillAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new Error("Assessment not found");
    if (score < 0 || score > assessment.maxScore) throw new Error("Invalid score");

    return this.updateAssessment(assessmentId, { score, status: "COMPLETED" });
  }

  async deleteAssessment(assessmentId: string): Promise<void> {
    await prisma.skillAssessment.delete({ where: { id: assessmentId } });
  }

  async getAssessmentsBySkill(skillName: string): Promise<SkillAssessment[]> {
    const assessments = await prisma.skillAssessment.findMany({
      where: { skillName },
      include: { candidate: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { completedAt: "desc" },
    });
    return assessments.map((a) => this.formatAssessment(a));
  }

  // ─── Certifications ────────────────────────────────────────────────────────

  async createCertification(input: CreateCertificationInput): Promise<SkillCertification> {
    const candidate = await prisma.candidate.findUnique({ where: { id: input.candidateId } });
    if (!candidate) throw new Error("Candidate not found");

    const cert = await prisma.candidateCertification.create({
      data: {
        candidateId: input.candidateId,
        name: input.name,
        issuer: input.issuer,
        issueDate: input.issueDate,
        expiryDate: input.expiryDate ?? null,
        credentialId: input.credentialId ?? null,
        credentialUrl: input.credentialUrl ?? null,
        verificationUrl: input.verificationUrl ?? null,
        status: input.expiryDate && input.expiryDate < new Date() ? "EXPIRED" : "ACTIVE",
        skills: JSON.stringify(input.skills),
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });

    return this.formatCertification(cert);
  }

  async getCertificationById(certId: string): Promise<SkillCertification | null> {
    const cert = await prisma.candidateCertification.findUnique({ where: { id: certId } });
    return cert ? this.formatCertification(cert) : null;
  }

  async getCandidateCertifications(candidateId: string): Promise<SkillCertification[]> {
    const certs = await prisma.candidateCertification.findMany({
      where: { candidateId },
      orderBy: { issueDate: "desc" },
    });
    return certs.map((c) => this.formatCertification(c));
  }

  async updateCertification(certId: string, input: UpdateCertificationInput): Promise<SkillCertification> {
    const existing = await prisma.candidateCertification.findUnique({ where: { id: certId } });
    if (!existing) throw new Error("Certification not found");

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.issuer !== undefined) data.issuer = input.issuer;
    if (input.expiryDate !== undefined) data.expiryDate = input.expiryDate;
    if (input.credentialId !== undefined) data.credentialId = input.credentialId;
    if (input.credentialUrl !== undefined) data.credentialUrl = input.credentialUrl;
    if (input.verificationUrl !== undefined) data.verificationUrl = input.verificationUrl;
    if (input.status !== undefined) data.status = input.status;
    if (input.skills !== undefined) data.skills = JSON.stringify(input.skills);
    if (input.description !== undefined) data.description = input.description;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;

    const updated = await prisma.candidateCertification.update({ where: { id: certId }, data });
    return this.formatCertification(updated);
  }

  async deleteCertification(certId: string): Promise<void> {
    await prisma.candidateCertification.delete({ where: { id: certId } });
  }

  async getExpiringCertifications(daysAhead = 30): Promise<SkillCertification[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const certs = await prisma.candidateCertification.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: { lte: cutoff, gte: new Date() },
      },
      include: { candidate: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { expiryDate: "asc" },
    });

    return certs.map((c) => this.formatCertification(c));
  }

  async verifyCertification(certId: string): Promise<SkillCertification> {
    return this.updateCertification(certId, { status: "ACTIVE" });
  }

  // ─── Endorsements ──────────────────────────────────────────────────────────

  async addEndorsement(
    candidateSkillId: string,
    endorserId: string,
    endorserName: string,
    relationship: string,
    comment?: string
  ): Promise<SkillEndorsement> {
    const skill = await prisma.candidateSkill.findUnique({ where: { id: candidateSkillId } });
    if (!skill) throw new Error("Candidate skill not found");

    const endorsement = await prisma.skillEndorsement.create({
      data: {
        candidateSkillId,
        endorserId,
        relationship,
        comment: comment ?? null,
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
      endorserName,
      endorserImage: null,
      relationship: endorsement.relationship,
      comment: endorsement.comment,
      createdAt: endorsement.createdAt,
    };
  }

  async removeEndorsement(endorsementId: string): Promise<void> {
    const endorsement = await prisma.skillEndorsement.findUnique({ where: { id: endorsementId } });
    if (!endorsement) throw new Error("Endorsement not found");

    await prisma.skillEndorsement.delete({ where: { id: endorsementId } });
    await prisma.candidateSkill.update({
      where: { id: endorsement.candidateSkillId },
      data: { endorsements: { decrement: 1 } },
    });
  }

  async getEndorsements(candidateSkillId: string): Promise<SkillEndorsement[]> {
    const endorsements = await prisma.skillEndorsement.findMany({
      where: { candidateSkillId },
      include: { endorser: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });

    return endorsements.map((e) => ({
      id: e.id,
      candidateSkillId: e.candidateSkillId,
      endorserId: e.endorserId,
      endorserName: e.endorser?.name ?? "Unknown",
      endorserImage: e.endorser?.image ?? null,
      relationship: e.relationship,
      comment: e.comment,
      createdAt: e.createdAt,
    }));
  }

  // ─── Skill Gap Analysis ───────────────────────────────────────────────────

  async analyzeSkillGap(
    candidateId: string,
    requiredSkills: { skillName: string; requiredLevel: SkillLevel }[]
  ): Promise<SkillGap[]> {
    const candidateSkills = await prisma.candidateSkill.findMany({ where: { candidateId } });
    const assessments = await prisma.skillAssessment.findMany({
      where: { candidateId, status: "COMPLETED" },
    });
    const certifications = await prisma.candidateCertification.findMany({
      where: { candidateId, status: "ACTIVE" },
    });

    const skillMap = new Map(candidateSkills.map((s) => [s.skillName.toLowerCase(), s]));
    const levelOrder: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };

    return requiredSkills.map((req) => {
      const current = skillMap.get(req.skillName.toLowerCase());
      const currentLevel = current?.level ?? null;
      const currentLevelNum = currentLevel ? (levelOrder[currentLevel] ?? 0) : 0;
      const requiredLevelNum = levelOrder[req.requiredLevel] ?? 3;

      const relevantCerts = certifications
        .filter((c) => {
          const skills: string[] = typeof c.skills === "string" ? JSON.parse(c.skills) : c.skills ?? [];
          return skills.some((s) => s.toLowerCase() === req.skillName.toLowerCase());
        })
        .map((c) => c.name);

      const relevantAssessments = assessments
        .filter((a) => a.skillName.toLowerCase() === req.skillName.toLowerCase())
        .map((a) => ({ name: a.name, score: a.score, completedAt: a.completedAt }));

      return {
        skillName: req.skillName,
        currentLevel,
        requiredLevel: req.requiredLevel,
        gap: Math.max(0, requiredLevelNum - currentLevelNum),
        certifications: relevantCerts,
        assessments: relevantAssessments,
      };
    });
  }

  async getSkillDemand(firmId: string): Promise<{ skill: string; demand: number; supply: number }[]> {
    const [demand, supply] = await Promise.all([
      prisma.jobRequiredSkill.groupBy({
        by: ["skillName"],
        where: { job: { firmId, status: "OPEN" } },
        _count: true,
      }),
      prisma.candidateSkill.groupBy({
        by: ["skillName"],
        where: { candidate: { firmId, isActive: true } },
        _count: true,
      }),
    ]);

    const supplyMap = new Map(supply.map((s) => [s.skillName.toLowerCase(), s._count]));
    const demandMap = new Map(demand.map((d) => [d.skillName.toLowerCase(), { name: d.skillName, count: d._count }]));

    const allSkills = new Set([...demandMap.keys(), ...supplyMap.keys()]);

    return Array.from(allSkills).map((skill) => ({
      skill: demandMap.get(skill)?.name ?? skill,
      demand: demandMap.get(skill)?.count ?? 0,
      supply: supplyMap.get(skill) ?? 0,
    }));
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  async bulkCreateAssessments(inputs: CreateAssessmentInput[]): Promise<SkillAssessment[]> {
    const results: SkillAssessment[] = [];
    for (const input of inputs) {
      const assessment = await this.createAssessment(input);
      results.push(assessment);
    }
    return results;
  }

  async bulkVerifyCertifications(certIds: string[]): Promise<number> {
    const result = await prisma.candidateCertification.updateMany({
      where: { id: { in: certIds } },
      data: { status: "ACTIVE" },
    });
    return result.count;
  }

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<SkillStats> {
    const [totalAssessments, totalCertifications, byCategory, topSkills, expiringCerts] = await Promise.all([
      prisma.skillAssessment.count({ where: { candidate: { firmId } } }),
      prisma.candidateCertification.count({ where: { candidate: { firmId } } }),
      prisma.skillAssessment.groupBy({
        by: ["category"],
        where: { candidate: { firmId }, status: "COMPLETED", score: { not: null } },
        _count: true,
        _avg: { score: true },
      }),
      prisma.skillAssessment.groupBy({
        by: ["skillName"],
        where: { candidate: { firmId }, status: "COMPLETED" },
        _count: true,
        _avg: { score: true },
        orderBy: { _count: { skillName: "desc" } },
        take: 10,
      }),
      prisma.candidateCertification.count({
        where: {
          candidate: { firmId },
          status: "ACTIVE",
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const verifiedCerts = await prisma.candidateCertification.count({
      where: { candidate: { firmId }, status: "ACTIVE" },
    });

    const verificationRate = totalCertifications > 0 ? Math.round((verifiedCerts / totalCertifications) * 100) : 0;

    return {
      totalAssessments,
      totalCertifications,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
        avgScore: c._avg.score ?? 0,
      })),
      byStatus: [],
      topSkills: topSkills.map((s) => ({
        skill: s.skillName,
        assessmentCount: s._count,
        avgScore: s._avg.score ?? 0,
      })),
      expiringCertifications: expiringCerts,
      verificationRate,
    };
  }

  async getAllAssessments(
    firmId: string,
    filters?: SkillAssessmentFilter,
    page = 1,
    limit = 20
  ): Promise<{ assessments: SkillAssessment[]; total: number }> {
    const where: Record<string, unknown> = { candidate: { firmId } };
    if (filters) {
      if (filters.candidateId) where.candidateId = filters.candidateId;
      if (filters.category) where.category = filters.category;
      if (filters.skillName) where.skillName = filters.skillName;
      if (filters.status?.length) where.status = { in: filters.status };
      if (filters.dateRange) where.createdAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };
    }

    const skip = (page - 1) * limit;
    const [assessments, total] = await Promise.all([
      prisma.skillAssessment.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.skillAssessment.count({ where }),
    ]);
    return { assessments: assessments.map((a) => this.formatAssessment(a)), total };
  }

  async getAllCertifications(
    firmId: string,
    filters?: CertificationFilter,
    page = 1,
    limit = 20
  ): Promise<{ certifications: SkillCertification[]; total: number }> {
    const where: Record<string, unknown> = { candidate: { firmId } };
    if (filters) {
      if (filters.candidateId) where.candidateId = filters.candidateId;
      if (filters.issuer?.length) where.issuer = { in: filters.issuer };
      if (filters.status?.length) where.status = { in: filters.status };
      if (filters.expiringWithin) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + filters.expiringWithin);
        where.expiryDate = { lte: cutoff, gte: new Date() };
      }
      if (filters.dateRange) where.createdAt = { gte: filters.dateRange.start, lte: filters.dateRange.end };
    }

    const skip = (page - 1) * limit;
    const [certs, total] = await Promise.all([
      prisma.candidateCertification.findMany({ where, skip, take: limit, orderBy: { issueDate: "desc" } }),
      prisma.candidateCertification.count({ where }),
    ]);
    return { certifications: certs.map((c) => this.formatCertification(c)), total };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private formatAssessment(a: any): SkillAssessment {
    return {
      id: a.id, candidateId: a.candidateId, name: a.name, description: a.description,
      category: a.category, skillName: a.skillName, score: a.score, maxScore: a.maxScore,
      passingScore: a.passingScore, status: a.status, assessmentUrl: a.assessmentUrl,
      duration: a.duration, startedAt: a.startedAt, completedAt: a.completedAt,
      expiresAt: a.expiresAt, certificateUrl: a.certificateUrl,
      metadata: a.metadata ? (typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata) : null,
      createdAt: a.createdAt, updatedAt: a.updatedAt,
    };
  }

  private formatCertification(c: any): SkillCertification {
    return {
      id: c.id, candidateId: c.candidateId, name: c.name, issuer: c.issuer,
      issueDate: c.issueDate, expiryDate: c.expiryDate, credentialId: c.credentialId,
      credentialUrl: c.credentialUrl, verificationUrl: c.verificationUrl, status: c.status,
      skills: typeof c.skills === "string" ? JSON.parse(c.skills) : c.skills ?? [],
      description: c.description, imageUrl: c.imageUrl,
      metadata: c.metadata ? (typeof c.metadata === "string" ? JSON.parse(c.metadata) : c.metadata) : null,
      createdAt: c.createdAt, updatedAt: c.updatedAt,
    };
  }
}

export const skillService = new SkillService();
