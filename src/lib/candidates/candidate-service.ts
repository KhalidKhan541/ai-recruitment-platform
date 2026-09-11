import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  Candidate,
  CandidateWithDetails,
  CandidateBasic,
  CandidateFilter,
  CandidateStats,
  CreateCandidateInput,
  UpdateCandidateInput,
  CandidateStatus,
} from "@/types/candidate";

// ─── Candidate Service ───────────────────────────────────────────────────────
// Manages candidate profiles, resume storage, experience tracking,
// skill inventories, recruitment pipeline engagement, and talent sourcing.

export class CandidateService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateCandidateInput): Promise<CandidateWithDetails> {
    const existing = await prisma.candidate.findFirst({
      where: { email: input.email, firmId: input.firmId, isActive: true },
    });
    if (existing) throw AppError.conflict("A candidate with this email already exists");

    const candidate = await prisma.candidate.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        location: input.location ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        timezone: input.timezone ?? null,
        headline: input.headline ?? null,
        summary: input.summary ?? null,
        status: "ACTIVE",
        source: input.source ?? null,
        referredBy: input.referredBy ?? null,
        education: JSON.stringify(input.education ?? []),
        experience: JSON.stringify(input.experience ?? []),
        projects: JSON.stringify(input.projects ?? []),
        links: JSON.stringify(input.links ?? []),
        preferences: input.preferences ? JSON.stringify(input.preferences) : null,
        tags: JSON.stringify(input.tags ?? []),
        firmId: input.firmId,
        skills: {
          create: (input.skills ?? []).map((skill) => ({
            skillName: skill.skillName,
            level: skill.level,
            yearsExperience: skill.yearsExperience ?? null,
            lastUsed: skill.lastUsed ?? null,
            isVerified: skill.isVerified ?? false,
            endorsements: skill.endorsements ?? 0,
          })),
        },
      },
      include: {
        skills: true,
        resumes: true,
        applications: {
          include: {
            job: { select: { id: true, title: true, department: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        assessments: true,
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return this.formatCandidateWithDetails(candidate);
  }

  async getById(candidateId: string): Promise<CandidateWithDetails | null> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        skills: true,
        resumes: {
          orderBy: { createdAt: "desc" },
        },
        applications: {
          include: {
            job: { select: { id: true, title: true, department: true, location: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        assessments: true,
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return candidate ? this.formatCandidateWithDetails(candidate) : null;
  }

  async getByIdOrThrow(candidateId: string): Promise<CandidateWithDetails> {
    const candidate = await this.getById(candidateId);
    if (!candidate) throw AppError.notFound("Candidate");
    return candidate;
  }

  async getAll(
    firmId: string,
    filters?: CandidateFilter,
    page = 1,
    limit = 20
  ): Promise<{ candidates: CandidateWithDetails[]; total: number }> {
    const where = this.buildWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          skills: true,
          resumes: { take: 1, orderBy: { createdAt: "desc" } },
          applications: {
            select: { id: true, status: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          _count: {
            select: { applications: true, interviews: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.count({ where }),
    ]);

    return {
      candidates: candidates.map((c) => this.formatCandidateWithDetails(c)),
      total,
    };
  }

  async update(
    candidateId: string,
    input: UpdateCandidateInput
  ): Promise<CandidateWithDetails> {
    const existing = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!existing) throw AppError.notFound("Candidate");

    if (input.email && input.email !== existing.email) {
      const duplicate = await prisma.candidate.findFirst({
        where: {
          email: input.email,
          firmId: existing.firmId,
          id: { not: candidateId },
          isActive: true,
        },
      });
      if (duplicate) throw AppError.conflict("A candidate with this email already exists");
    }

    const data: Record<string, unknown> = {};

    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.email !== undefined) data.email = input.email;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.location !== undefined) data.location = input.location;
    if (input.city !== undefined) data.city = input.city;
    if (input.country !== undefined) data.country = input.country;
    if (input.timezone !== undefined) data.timezone = input.timezone;
    if (input.headline !== undefined) data.headline = input.headline;
    if (input.summary !== undefined) data.summary = input.summary;
    if (input.status !== undefined) data.status = input.status;
    if (input.source !== undefined) data.source = input.source;
    if (input.education !== undefined) data.education = JSON.stringify(input.education);
    if (input.experience !== undefined) data.experience = JSON.stringify(input.experience);
    if (input.projects !== undefined) data.projects = JSON.stringify(input.projects);
    if (input.links !== undefined) data.links = JSON.stringify(input.links);
    if (input.preferences !== undefined) {
      data.preferences = input.preferences ? JSON.stringify(input.preferences) : null;
    }
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);

    if (input.skills !== undefined) {
      await prisma.candidateSkill.deleteMany({ where: { candidateId } });
      if (input.skills.length > 0) {
        await prisma.candidateSkill.createMany({
          data: input.skills.map((skill) => ({
            candidateId,
            skillName: skill.skillName,
            level: skill.level,
            yearsExperience: skill.yearsExperience ?? null,
            lastUsed: skill.lastUsed ?? null,
            isVerified: skill.isVerified ?? false,
            endorsements: skill.endorsements ?? 0,
          })),
        });
      }
    }

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data,
      include: {
        skills: true,
        resumes: true,
        applications: {
          include: {
            job: { select: { id: true, title: true, department: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        assessments: true,
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return this.formatCandidateWithDetails(updated);
  }

  async delete(candidateId: string): Promise<void> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, applicationCount: true },
    });
    if (!candidate) throw AppError.notFound("Candidate");

    if (candidate.applicationCount > 0) {
      throw AppError.badRequest(
        "Cannot delete a candidate with existing applications. Archive them instead."
      );
    }

    await prisma.candidateSkill.deleteMany({ where: { candidateId } });
    await prisma.candidate.delete({ where: { id: candidateId } });
  }

  async archive(candidateId: string): Promise<CandidateWithDetails> {
    return this.update(candidateId, { status: "ARCHIVED" as CandidateStatus });
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  async search(
    firmId: string,
    query: string,
    page = 1,
    limit = 20
  ): Promise<{ candidates: CandidateWithDetails[]; total: number }> {
    const where = {
      firmId,
      isActive: true,
      OR: [
        { firstName: { contains: query, mode: "insensitive" as const } },
        { lastName: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
        { headline: { contains: query, mode: "insensitive" as const } },
        { summary: { contains: query, mode: "insensitive" as const } },
        {
          skills: {
            some: { skillName: { contains: query, mode: "insensitive" as const } },
          },
        },
      ],
    };

    const skip = (page - 1) * limit;
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          skills: true,
          resumes: { take: 1, orderBy: { createdAt: "desc" } },
          _count: { select: { applications: true, interviews: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.count({ where }),
    ]);

    return {
      candidates: candidates.map((c) => this.formatCandidateWithDetails(c)),
      total,
    };
  }

  async getByEmail(email: string, firmId: string): Promise<CandidateWithDetails | null> {
    const candidate = await prisma.candidate.findFirst({
      where: { email, firmId, isActive: true },
      include: {
        skills: true,
        resumes: true,
        applications: {
          include: {
            job: { select: { id: true, title: true } },
          },
        },
        certifications: true,
        assessments: true,
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return candidate ? this.formatCandidateWithDetails(candidate) : null;
  }

  async getBySkills(
    firmId: string,
    skillNames: string[],
    minLevel?: string
  ): Promise<CandidateWithDetails[]> {
    const where: Record<string, unknown> = {
      firmId,
      isActive: true,
      skills: {
        some: {
          skillName: { in: skillNames },
          ...(minLevel ? { level: { gte: minLevel } } : {}),
        },
      },
    };

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        skills: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return candidates.map((c) => this.formatCandidateWithDetails(c));
  }

  // ─── Bulk Operations ────────────────────────────────────────────────────────

  async bulkUpdateStatus(
    candidateIds: string[],
    status: CandidateStatus
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const id of candidateIds) {
      try {
        await this.update(id, { status });
        updated++;
      } catch {
        failed.push(id);
      }
    }

    return { updated, failed };
  }

  async bulkAddTags(candidateIds: string[], tags: string[]): Promise<{ updated: number }> {
    const result = await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: { updatedAt: new Date() },
    });

    for (const id of candidateIds) {
      const candidate = await prisma.candidate.findUnique({
        where: { id },
        select: { tags: true },
      });
      if (candidate) {
        const existingTags = JSON.parse(candidate.tags ?? "[]");
        const newTags = [...new Set([...existingTags, ...tags])];
        await prisma.candidate.update({
          where: { id },
          data: { tags: JSON.stringify(newTags) },
        });
      }
    }

    return { updated: result.count };
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<CandidateStats> {
    const [total, byStatus, bySource, skillStats] = await Promise.all([
      prisma.candidate.count({ where: { firmId, isActive: true } }),
      prisma.candidate.groupBy({
        by: ["status"],
        where: { firmId, isActive: true },
        _count: true,
      }),
      prisma.candidate.groupBy({
        by: ["source"],
        where: { firmId, isActive: true, source: { not: null } },
        _count: true,
      }),
      prisma.candidateSkill.groupBy({
        by: ["skillName"],
        where: { candidate: { firmId, isActive: true } },
        _count: true,
        orderBy: { _count: { skillName: "desc" } },
        take: 10,
      }),
    ]);

    const hiredCount = byStatus.find((s) => s.status === "HIRED")?._count ?? 0;

    return {
      total,
      active: byStatus.find((s) => s.status === "ACTIVE")?._count ?? 0,
      hired: hiredCount,
      archived: byStatus.find((s) => s.status === "ARCHIVED")?._count ?? 0,
      byStatus: byStatus.map((s) => ({
        status: s.status as CandidateStatus,
        count: s._count,
      })),
      bySource: bySource.map((s) => ({
        source: s.source ?? "Unknown",
        count: s._count,
      })),
      topSkills: skillStats.map((s) => ({
        skill: s.skillName,
        count: s._count,
      })),
      conversionRate: total > 0 ? Math.round((hiredCount / total) * 100) : 0,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: CandidateFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      firmId,
      isActive: true,
    };

    if (!filters) return where;

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.source && filters.source.length > 0) {
      where.source = { in: filters.source };
    }
    if (filters.skills && filters.skills.length > 0) {
      where.skills = {
        some: { skillName: { in: filters.skills } },
      };
    }
    if (filters.location) {
      where.OR = [
        { location: { contains: filters.location, mode: "insensitive" } },
        { city: { contains: filters.location, mode: "insensitive" } },
        { country: { contains: filters.location, mode: "insensitive" } },
      ];
    }
    if (filters.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }
    if (filters.minExperience !== undefined) {
      where.totalExperienceYears = { gte: filters.minExperience };
    }
    if (filters.maxExperience !== undefined) {
      where.totalExperienceYears = { ...(where.totalExperienceYears as object ?? {}), lte: filters.maxExperience };
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { contains: JSON.stringify(filters.tags[0]) };
    }
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { headline: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private formatCandidateWithDetails(raw: any): CandidateWithDetails {
    return {
      id: raw.id,
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phone: raw.phone,
      location: raw.location,
      city: raw.city,
      country: raw.country,
      timezone: raw.timezone,
      headline: raw.headline,
      summary: raw.summary,
      status: raw.status,
      source: raw.source,
      referredBy: raw.referredBy,
      education: JSON.parse(raw.education ?? "[]"),
      experience: JSON.parse(raw.experience ?? "[]"),
      projects: JSON.parse(raw.projects ?? "[]"),
      links: JSON.parse(raw.links ?? "[]"),
      preferences: raw.preferences ? JSON.parse(raw.preferences) : null,
      tags: JSON.parse(raw.tags ?? "[]"),
      firmId: raw.firmId,
      skills: (raw.skills ?? []).map((s: any) => ({
        id: s.id,
        skillName: s.skillName,
        level: s.level,
        yearsExperience: s.yearsExperience,
        lastUsed: s.lastUsed,
        isVerified: s.isVerified,
        endorsements: s.endorsements,
      })),
      resumes: raw.resumes ?? [],
      applications: (raw.applications ?? []).map((a: any) => ({
        id: a.id,
        jobId: a.jobId,
        status: a.status,
        matchScore: a.matchScore,
        appliedAt: a.createdAt,
        job: a.job,
      })),
      certifications: raw.certifications ?? [],
      assessments: raw.assessments ?? [],
      applicationCount: raw._count?.applications ?? 0,
      interviewCount: raw._count?.interviews ?? 0,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const candidateService = new CandidateService();
