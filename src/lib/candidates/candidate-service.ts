import { prisma } from "@/lib/prisma";
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
// skill inventories, and recruitment pipeline engagement.

export class CandidateService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateCandidateInput): Promise<CandidateWithDetails> {
    // Check for duplicate email
    const existing = await prisma.candidate.findFirst({
      where: { email: input.email, firmId: input.firmId, isActive: true },
    });
    if (existing) throw new Error("A candidate with this email already exists");

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
          select: {
            id: true,
            jobId: true,
            status: true,
            createdAt: true,
            matchScore: true,
            job: { select: { title: true } },
          },
        },
        certifications: true,
        _count: {
          select: { applications: true, interviews: true, offers: true },
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
        resumes: true,
        applications: {
          select: {
            id: true,
            jobId: true,
            status: true,
            createdAt: true,
            matchScore: true,
            job: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        assessments: {
          select: {
            id: true,
            name: true,
            score: true,
            maxScore: true,
            status: true,
            completedAt: true,
          },
          orderBy: { completedAt: "desc" },
        },
        _count: {
          select: { applications: true, interviews: true, offers: true },
        },
      },
    });

    return candidate ? this.formatCandidateWithDetails(candidate) : null;
  }

  async getByEmail(email: string, firmId: string): Promise<CandidateWithDetails | null> {
    const candidate = await prisma.candidate.findFirst({
      where: { email, firmId, isActive: true },
      include: {
        skills: true,
        resumes: true,
        applications: {
          select: {
            id: true, jobId: true, status: true, createdAt: true,
            matchScore: true, job: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        _count: {
          select: { applications: true, interviews: true, offers: true },
        },
      },
    });

    return candidate ? this.formatCandidateWithDetails(candidate) : null;
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
          resumes: true,
          applications: {
            select: {
              id: true, jobId: true, status: true, createdAt: true,
              matchScore: true, job: { select: { title: true } },
            },
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          certifications: true,
          _count: {
            select: { applications: true, interviews: true, offers: true },
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

  async update(candidateId: string, input: UpdateCandidateInput): Promise<CandidateWithDetails> {
    const existing = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!existing) throw new Error("Candidate not found");

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
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.education !== undefined) data.education = JSON.stringify(input.education);
    if (input.experience !== undefined) data.experience = JSON.stringify(input.experience);
    if (input.projects !== undefined) data.projects = JSON.stringify(input.projects);
    if (input.links !== undefined) data.links = JSON.stringify(input.links);
    if (input.preferences !== undefined) data.preferences = input.preferences ? JSON.stringify(input.preferences) : null;
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);

    if (input.skills !== undefined) {
      await prisma.candidateSkill.deleteMany({ where: { candidateId } });
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

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data,
      include: {
        skills: true,
        resumes: true,
        applications: {
          select: {
            id: true, jobId: true, status: true, createdAt: true,
            matchScore: true, job: { select: { title: true } },
          },
        },
        certifications: true,
        _count: {
          select: { applications: true, interviews: true, offers: true },
        },
      },
    });

    return this.formatCandidateWithDetails(updated);
  }

  async delete(candidateId: string): Promise<void> {
    const existing = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!existing) throw new Error("Candidate not found");

    // Soft delete - mark as archived
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "ARCHIVED", isActive: false },
    });
  }

  async hardDelete(candidateId: string): Promise<void> {
    await prisma.candidate.delete({ where: { id: candidateId } });
  }

  // ─── Profile Management ────────────────────────────────────────────────────

  async updateProfile(
    candidateId: string,
    profile: {
      headline?: string;
      summary?: string;
      location?: string;
      city?: string;
      country?: string;
      timezone?: string;
      phone?: string;
      links?: { type: string; url: string; label: string | null }[];
    }
  ): Promise<CandidateWithDetails> {
    return this.update(candidateId, {
      headline: profile.headline,
      summary: profile.summary,
      location: profile.location,
      city: profile.city,
      country: profile.country,
      timezone: profile.timezone,
      phone: profile.phone,
      links: profile.links as any,
    });
  }

  async updateExperience(
    candidateId: string,
    experience: {
      company: string;
      title: string;
      location: string | null;
      startDate: Date;
      endDate: Date | null;
      isCurrent: boolean;
      description: string;
      achievements: string[];
      skills: string[];
    }[]
  ): Promise<CandidateWithDetails> {
    return this.update(candidateId, { experience: experience as any });
  }

  async updateEducation(
    candidateId: string,
    education: {
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: Date;
      endDate: Date | null;
      gpa: number | null;
      honors: string[];
      activities: string[];
    }[]
  ): Promise<CandidateWithDetails> {
    return this.update(candidateId, { education: education as any });
  }

  async addTag(candidateId: string, tag: string): Promise<CandidateWithDetails> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { tags: true },
    });
    if (!candidate) throw new Error("Candidate not found");

    const currentTags: string[] = typeof candidate.tags === "string"
      ? JSON.parse(candidate.tags as string)
      : candidate.tags ?? [];

    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
    }

    return this.update(candidateId, { tags: currentTags });
  }

  async removeTag(candidateId: string, tag: string): Promise<CandidateWithDetails> {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { tags: true },
    });
    if (!candidate) throw new Error("Candidate not found");

    const currentTags: string[] = typeof candidate.tags === "string"
      ? JSON.parse(candidate.tags as string)
      : candidate.tags ?? [];

    return this.update(candidateId, {
      tags: currentTags.filter((t) => t !== tag),
    });
  }

  async updateLastActive(candidateId: string): Promise<void> {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { lastActiveAt: new Date() },
    });
  }

  // ─── Search & Discovery ────────────────────────────────────────────────────

  async searchBySkills(
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
        resumes: true,
        applications: {
          select: {
            id: true, jobId: true, status: true, createdAt: true,
            matchScore: true, job: { select: { title: true } },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        _count: {
          select: { applications: true, interviews: true, offers: true },
        },
      },
      take: 50,
    });

    return candidates.map((c) => this.formatCandidateWithDetails(c));
  }

  async searchByExperience(
    firmId: string,
    query: string
  ): Promise<CandidateWithDetails[]> {
    const candidates = await prisma.candidate.findMany({
      where: {
        firmId,
        isActive: true,
        OR: [
          { headline: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        skills: true,
        resumes: true,
        applications: {
          select: {
            id: true, jobId: true, status: true, createdAt: true,
            matchScore: true, job: { select: { title: true } },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        certifications: true,
        _count: {
          select: { applications: true, interviews: true, offers: true },
        },
      },
      take: 50,
    });

    return candidates.map((c) => this.formatCandidateWithDetails(c));
  }

  // ─── Engagement Tracking ───────────────────────────────────────────────────

  async trackActivity(candidateId: string, activityType: string): Promise<void> {
    await prisma.activityLog.create({
      data: {
        action: activityType,
        entity: "CANDIDATE",
        entityId: candidateId,
      },
    });

    await this.updateLastActive(candidateId);
  }

  async getEngagementTimeline(candidateId: string): Promise<any[]> {
    const logs = await prisma.activityLog.findMany({
      where: { entityId: candidateId, entity: "CANDIDATE" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      timestamp: log.createdAt,
    }));
  }

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<CandidateStats> {
    const [
      totalCandidates,
      activeCandidates,
      newThisMonth,
      byStatus,
      topSkills,
      sourceBreakdown,
      scoreAgg,
    ] = await Promise.all([
      prisma.candidate.count({
        where: { firmId, isActive: true },
      }),
      prisma.candidate.count({
        where: { firmId, status: "ACTIVE" },
      }),
      prisma.candidate.count({
        where: {
          firmId,
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      prisma.candidate.groupBy({
        by: ["status"],
        where: { firmId, isActive: true },
        _count: true,
      }),
      prisma.candidateSkill.groupBy({
        by: ["skillName"],
        where: { candidate: { firmId, isActive: true } },
        _count: true,
        orderBy: { _count: { skillName: "desc" } },
        take: 10,
      }),
      prisma.candidate.groupBy({
        by: ["source"],
        where: { firmId, isActive: true, source: { not: null } },
        _count: true,
        orderBy: { _count: { source: "desc" } },
        take: 10,
      }),
      prisma.application.aggregate({
        where: { candidate: { firmId }, matchScore: { not: null } },
        _avg: { matchScore: true },
      }),
    ]);

    return {
      totalCandidates,
      activeCandidates,
      newThisMonth,
      candidatesByStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count])
      ) as Record<CandidateStatus, number>,
      topSkills: topSkills.map((s) => ({
        skill: s.skillName,
        count: s._count,
      })),
      sourceBreakdown: sourceBreakdown.map((s) => ({
        source: s.source ?? "Unknown",
        count: s._count,
      })),
      averageMatchScore: scoreAgg._avg.matchScore ?? 0,
    };
  }

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: CandidateFilter) {
    const where: Record<string, unknown> = {
      firmId,
      isActive: true,
    };

    if (!filters) return where;

    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.location?.length) {
      where.OR = filters.location.map((loc) => ({
        location: { contains: loc, mode: "insensitive" },
      }));
    }
    if (filters.skills?.length) {
      where.skills = {
        some: {
          skillName: { in: filters.skills },
        },
      };
    }
    if (filters.source?.length) where.source = { in: filters.source };
    if (filters.tags?.length) {
      where.tags = { contains: JSON.stringify(filters.tags[0]), mode: "insensitive" };
    }
    if (filters.hasResume) {
      where.resumes = { some: {} };
    }
    if (filters.minMatchScore !== undefined) {
      where.applications = {
        some: {
          matchScore: { gte: filters.minMatchScore },
        },
      };
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
        { summary: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private formatCandidateWithDetails(candidate: any): CandidateWithDetails {
    return {
      ...candidate,
      education: typeof candidate.education === "string"
        ? JSON.parse(candidate.education)
        : candidate.education ?? [],
      experience: typeof candidate.experience === "string"
        ? JSON.parse(candidate.experience)
        : candidate.experience ?? [],
      projects: typeof candidate.projects === "string"
        ? JSON.parse(candidate.projects)
        : candidate.projects ?? [],
      links: typeof candidate.links === "string"
        ? JSON.parse(candidate.links)
        : candidate.links ?? [],
      preferences: candidate.preferences
        ? (typeof candidate.preferences === "string"
          ? JSON.parse(candidate.preferences)
          : candidate.preferences)
        : null,
      tags: typeof candidate.tags === "string"
        ? JSON.parse(candidate.tags)
        : candidate.tags ?? [],
      skills: (candidate.skills ?? []).map((s: any) => ({
        skillName: s.skillName,
        level: s.level,
        yearsExperience: s.yearsExperience,
        lastUsed: s.lastUsed,
        isVerified: s.isVerified,
        endorsements: s.endorsements,
      })),
      applications: (candidate.applications ?? []).map((a: any) => ({
        id: a.id,
        jobId: a.jobId,
        jobTitle: a.job?.title ?? "Unknown",
        status: a.status,
        appliedAt: a.createdAt,
        matchScore: a.matchScore,
      })),
      certifications: (candidate.certifications ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        credentialId: c.credentialId,
        credentialUrl: c.credentialUrl,
        status: c.status,
        skills: typeof c.skills === "string" ? JSON.parse(c.skills) : c.skills ?? [],
      })),
      metadata: candidate.metadata
        ? (typeof candidate.metadata === "string"
          ? JSON.parse(candidate.metadata)
          : candidate.metadata)
        : null,
    };
  }
}

export const candidateService = new CandidateService();
