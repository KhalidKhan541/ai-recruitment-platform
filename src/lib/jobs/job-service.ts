import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  Job,
  JobWithDetails,
  JobFilter,
  JobStats,
  CreateJobInput,
  UpdateJobInput,
  JobStatus,
  ScreeningQuestion,
} from "@/types/job";

// ─── Job Service ─────────────────────────────────────────────────────────────
// Handles job CRUD, publishing lifecycle, screening question management,
// analytics, and recruitment pipeline visibility for hiring teams.

export class JobService {
  // ─── CRUD Operations ───────────────────────────────────────────────────────

  async create(input: CreateJobInput, createdBy: string): Promise<JobWithDetails> {
    const job = await prisma.job.create({
      data: {
        title: input.title,
        department: input.department,
        team: input.team ?? null,
        location: input.location,
        isRemote: input.isRemote ?? false,
        type: input.type,
        experienceLevel: input.experienceLevel,
        employmentType: input.employmentType,
        description: input.description,
        requirements: JSON.stringify(input.requirements),
        responsibilities: JSON.stringify(input.responsibilities),
        niceToHaves: JSON.stringify(input.niceToHaves ?? []),
        salaryMin: input.salary?.min ?? null,
        salaryMax: input.salary?.max ?? null,
        salaryCurrency: input.salary?.currency ?? "USD",
        salaryPeriod: input.salary?.period ?? "yearly",
        salaryNegotiable: input.salary?.isNegotiable ?? true,
        benefits: input.benefits ? JSON.stringify(input.benefits) : null,
        status: "DRAFT",
        priority: input.priority ?? "MEDIUM",
        headcount: input.headcount ?? 1,
        filledCount: 0,
        hiringManagerId: input.hiringManagerId,
        recruiterId: input.recruiterId ?? null,
        closingDate: input.closingDate ?? null,
        tags: JSON.stringify(input.tags ?? []),
        metadata: null,
        firmId: input.firmId,
        requiredSkills: {
          create: (input.requiredSkills ?? []).map((skill) => ({
            skillName: skill.skillName,
            minimumLevel: skill.minimumLevel,
            isRequired: skill.isRequired,
            yearsExperience: skill.yearsExperience ?? null,
          })),
        },
        screeningQuestions: {
          create: (input.screeningQuestions ?? []).map((q) => ({
            question: q.question,
            type: q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            required: q.required,
            passingAnswer: q.passingAnswer,
            weight: q.weight,
          })),
        },
      },
      include: this.includeClause(),
    });

    return this.formatJobWithDetails(job);
  }

  async getById(jobId: string): Promise<JobWithDetails | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: this.includeClause(),
    });

    return job ? this.formatJobWithDetails(job) : null;
  }

  async getByIdOrThrow(jobId: string): Promise<JobWithDetails> {
    const job = await this.getById(jobId);
    if (!job) throw AppError.notFound("Job");
    return job;
  }

  async getAll(
    firmId: string,
    filters?: JobFilter,
    page = 1,
    limit = 20
  ): Promise<{ jobs: JobWithDetails[]; total: number }> {
    const where = this.buildWhereClause(firmId, filters);
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: this.includeClause(),
        skip,
        take: limit,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs: jobs.map((j) => this.formatJobWithDetails(j)),
      total,
    };
  }

  async update(jobId: string, input: UpdateJobInput, updatedBy: string): Promise<JobWithDetails> {
    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) throw AppError.notFound("Job");

    if (existing.status === "CLOSED" || existing.status === "CANCELLED") {
      throw AppError.badRequest("Cannot update a closed or cancelled job");
    }

    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.department !== undefined) data.department = input.department;
    if (input.team !== undefined) data.team = input.team;
    if (input.location !== undefined) data.location = input.location;
    if (input.isRemote !== undefined) data.isRemote = input.isRemote;
    if (input.type !== undefined) data.type = input.type;
    if (input.experienceLevel !== undefined) data.experienceLevel = input.experienceLevel;
    if (input.employmentType !== undefined) data.employmentType = input.employmentType;
    if (input.description !== undefined) data.description = input.description;
    if (input.requirements !== undefined) data.requirements = JSON.stringify(input.requirements);
    if (input.responsibilities !== undefined) data.responsibilities = JSON.stringify(input.responsibilities);
    if (input.niceToHaves !== undefined) data.niceToHaves = JSON.stringify(input.niceToHaves);
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.headcount !== undefined) data.headcount = input.headcount;
    if (input.closingDate !== undefined) data.closingDate = input.closingDate;
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
    if (input.recruiterId !== undefined) data.recruiterId = input.recruiterId;

    if (input.salary !== undefined) {
      data.salaryMin = input.salary?.min ?? null;
      data.salaryMax = input.salary?.max ?? null;
      data.salaryCurrency = input.salary?.currency ?? "USD";
      data.salaryPeriod = input.salary?.period ?? "yearly";
      data.salaryNegotiable = input.salary?.isNegotiable ?? true;
    }

    if (input.benefits !== undefined) {
      data.benefits = input.benefits ? JSON.stringify(input.benefits) : null;
    }

    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "OPEN" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
      if (input.status === "CLOSED") {
        data.closedAt = new Date();
      }
    }

    if (input.requiredSkills !== undefined) {
      await prisma.jobRequiredSkill.deleteMany({ where: { jobId } });
      if (input.requiredSkills.length > 0) {
        await prisma.jobRequiredSkill.createMany({
          data: input.requiredSkills.map((skill) => ({
            jobId,
            skillName: skill.skillName,
            minimumLevel: skill.minimumLevel,
            isRequired: skill.isRequired,
            yearsExperience: skill.yearsExperience ?? null,
          })),
        });
      }
    }

    if (input.screeningQuestions !== undefined) {
      await prisma.screeningQuestion.deleteMany({ where: { jobId } });
      if (input.screeningQuestions.length > 0) {
        await prisma.screeningQuestion.createMany({
          data: input.screeningQuestions.map((q) => ({
            jobId,
            question: q.question,
            type: q.type,
            options: q.options ? JSON.stringify(q.options) : null,
            required: q.required,
            passingAnswer: q.passingAnswer,
            weight: q.weight,
          })),
        });
      }
    }

    data.updatedAt = new Date();

    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
      include: this.includeClause(),
    });

    return this.formatJobWithDetails(updated);
  }

  async delete(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, applicationCount: true },
    });
    if (!job) throw AppError.notFound("Job");

    if (job.applicationCount > 0) {
      throw AppError.badRequest("Cannot delete a job with existing applications. Archive it instead.");
    }

    await prisma.jobRequiredSkill.deleteMany({ where: { jobId } });
    await prisma.screeningQuestion.deleteMany({ where: { jobId } });
    await prisma.job.delete({ where: { id: jobId } });
  }

  // ─── Publishing Lifecycle ────────────────────────────────────────────────────

  async publish(jobId: string, publishedBy: string): Promise<JobWithDetails> {
    const job = await this.getByIdOrThrow(jobId);

    if (job.status !== "DRAFT") {
      throw AppError.badRequest("Only draft jobs can be published");
    }

    if (!job.description || job.description.trim().length < 50) {
      throw AppError.badRequest("Job description must be at least 50 characters to publish");
    }

    if (!job.requiredSkills || job.requiredSkills.length === 0) {
      throw AppError.badRequest("At least one required skill must be specified");
    }

    return this.update(jobId, { status: "OPEN" }, publishedBy);
  }

  async close(jobId: string, closedBy: string, reason?: string): Promise<JobWithDetails> {
    const job = await this.getByIdOrThrow(jobId);

    if (job.status === "CLOSED") {
      throw AppError.badRequest("Job is already closed");
    }

    const updated = await this.update(jobId, { status: "CLOSED" }, closedBy);

    await prisma.application.updateMany({
      where: {
        jobId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"] },
      },
      data: {
        status: "REJECTED",
        rejectedReason: reason ?? "Position has been filled or closed",
      },
    });

    return updated;
  }

  async cancel(jobId: string, cancelledBy: string, reason: string): Promise<JobWithDetails> {
    const job = await this.getByIdOrThrow(jobId);

    if (job.status === "CANCELLED") {
      throw AppError.badRequest("Job is already cancelled");
    }

    if (job.filledCount > 0) {
      throw AppError.badRequest("Cannot cancel a job with filled positions. Close it instead.");
    }

    const updated = await this.update(jobId, { status: "CANCELLED" }, cancelledBy);

    await prisma.application.updateMany({
      where: {
        jobId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEWING"] },
      },
      data: {
        status: "REJECTED",
        rejectedReason: reason,
      },
    });

    return updated;
  }

  async duplicate(jobId: string, createdBy: string): Promise<JobWithDetails> {
    const original = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        requiredSkills: true,
        screeningQuestions: true,
      },
    });
    if (!original) throw AppError.notFound("Job");

    return this.create(
      {
        title: `${original.title} (Copy)`,
        department: original.department,
        team: original.team,
        location: original.location,
        isRemote: original.isRemote,
        type: original.type as CreateJobInput["type"],
        experienceLevel: original.experienceLevel as CreateJobInput["experienceLevel"],
        employmentType: original.employmentType as CreateJobInput["employmentType"],
        description: original.description,
        requirements: JSON.parse(original.requirements),
        responsibilities: JSON.parse(original.responsibilities),
        niceToHaves: JSON.parse(original.niceToHaves ?? "[]"),
        salary: original.salaryMin
          ? {
              min: original.salaryMin,
              max: original.salaryMax ?? undefined,
              currency: original.salaryCurrency,
              period: original.salaryPeriod as CreateJobInput["salary"] extends { period: infer P } ? P : never,
              isNegotiable: original.salaryNegotiable,
            }
          : undefined,
        benefits: original.benefits ? JSON.parse(original.benefits) : undefined,
        priority: original.priority as CreateJobInput["priority"],
        headcount: original.headcount,
        hiringManagerId: original.hiringManagerId,
        recruiterId: original.recruiterId,
        tags: JSON.parse(original.tags ?? "[]"),
        firmId: original.firmId,
        requiredSkills: original.requiredSkills.map((s) => ({
          skillName: s.skillName,
          minimumLevel: s.minimumLevel as CreateJobInput["requiredSkills"] extends Array<{ minimumLevel: infer L }> ? L : never,
          isRequired: s.isRequired,
          yearsExperience: s.yearsExperience,
        })),
        screeningQuestions: original.screeningQuestions.map((q) => ({
          question: q.question,
          type: q.type as CreateJobInput["screeningQuestions"] extends Array<{ type: infer T }> ? T : never,
          options: q.options ? JSON.parse(q.options) : undefined,
          required: q.required,
          passingAnswer: q.passingAnswer,
          weight: q.weight,
        })),
      },
      createdBy
    );
  }

  // ─── Screening Questions ─────────────────────────────────────────────────────

  async getScreeningQuestions(jobId: string): Promise<ScreeningQuestion[]> {
    const questions = await prisma.screeningQuestion.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options ? JSON.parse(q.options) : null,
      required: q.required,
      passingAnswer: q.passingAnswer,
      weight: q.weight,
    }));
  }

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
    const passed = details.filter((d) => questions.find((q) => q.id === d.questionId)?.required).every((d) => d.passed);

    return { passed, score, details };
  }

  // ─── Search & Filtering ──────────────────────────────────────────────────────

  async search(
    firmId: string,
    query: string,
    page = 1,
    limit = 20
  ): Promise<{ jobs: JobWithDetails[]; total: number }> {
    const where = {
      firmId,
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { department: { contains: query, mode: "insensitive" as const } },
        { location: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        {
          requiredSkills: {
            some: { skillName: { contains: query, mode: "insensitive" as const } },
          },
        },
      ],
    };

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: this.includeClause(),
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs: jobs.map((j) => this.formatJobWithDetails(j)),
      total,
    };
  }

  async getJobsByHiringManager(
    hiringManagerId: string,
    firmId: string,
    status?: JobStatus
  ): Promise<JobWithDetails[]> {
    const where: Record<string, unknown> = {
      hiringManagerId,
      firmId,
      isActive: true,
    };
    if (status) where.status = status;

    const jobs = await prisma.job.findMany({
      where,
      include: this.includeClause(),
      orderBy: { createdAt: "desc" },
    });

    return jobs.map((j) => this.formatJobWithDetails(j));
  }

  async getJobsByRecruiter(
    recruiterId: string,
    firmId: string,
    status?: JobStatus
  ): Promise<JobWithDetails[]> {
    const where: Record<string, unknown> = {
      recruiterId,
      firmId,
      isActive: true,
    };
    if (status) where.status = status;

    const jobs = await prisma.job.findMany({
      where,
      include: this.includeClause(),
      orderBy: { createdAt: "desc" },
    });

    return jobs.map((j) => this.formatJobWithDetails(j));
  }

  async getExpiringJobs(firmId: string, withinDays = 7): Promise<JobWithDetails[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    const jobs = await prisma.job.findMany({
      where: {
        firmId,
        isActive: true,
        status: "OPEN",
        closingDate: { lte: futureDate, gte: new Date() },
      },
      include: this.includeClause(),
      orderBy: { closingDate: "asc" },
    });

    return jobs.map((j) => this.formatJobWithDetails(j));
  }

  // ─── Analytics & Stats ───────────────────────────────────────────────────────

  async getStats(firmId: string): Promise<JobStats> {
    const [total, byStatus, byDepartment, byType, priorityCounts] = await Promise.all([
      prisma.job.count({ where: { firmId, isActive: true } }),
      prisma.job.groupBy({
        by: ["status"],
        where: { firmId, isActive: true },
        _count: true,
      }),
      prisma.job.groupBy({
        by: ["department"],
        where: { firmId, isActive: true },
        _count: true,
        orderBy: { _count: { department: "desc" } },
      }),
      prisma.job.groupBy({
        by: ["type"],
        where: { firmId, isActive: true },
        _count: true,
      }),
      prisma.job.groupBy({
        by: ["priority"],
        where: { firmId, isActive: true, status: "OPEN" },
        _count: true,
      }),
    ]);

    const avgSalary = await prisma.job.aggregate({
      where: { firmId, isActive: true, salaryMin: { not: null } },
      _avg: { salaryMin: true, salaryMax: true },
    });

    const openJobs = byStatus.find((s) => s.status === "OPEN")?._count ?? 0;
    const closedJobs = byStatus.find((s) => s.status === "CLOSED")?._count ?? 0;
    const filledJobs = await prisma.job.count({
      where: { firmId, isActive: true, status: "CLOSED", filledCount: { gt: 0 } },
    });

    return {
      total,
      open: openJobs,
      draft: byStatus.find((s) => s.status === "DRAFT")?._count ?? 0,
      closed: closedJobs,
      cancelled: byStatus.find((s) => s.status === "CANCELLED")?._count ?? 0,
      fillRate: closedJobs > 0 ? Math.round((filledJobs / closedJobs) * 100) : 0,
      byStatus: byStatus.map((s) => ({ status: s.status as JobStatus, count: s._count })),
      byDepartment: byDepartment.map((d) => ({
        department: d.department,
        count: d._count,
      })),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
      })),
      byPriority: priorityCounts.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
      averageSalary: {
        min: avgSalary._avg.salaryMin ?? 0,
        max: avgSalary._avg.salaryMax ?? 0,
      },
    };
  }

  async getJobFunnel(jobId: string): Promise<{
    submitted: number;
    underReview: number;
    shortlisted: number;
    interviewing: number;
    offered: number;
    hired: number;
    rejected: number;
  }> {
    const statusCounts = await prisma.application.groupBy({
      by: ["status"],
      where: { jobId, isActive: true },
      _count: true,
    });

    const count = (status: string) =>
      statusCounts.find((s) => s.status === status)?._count ?? 0;

    return {
      submitted: count("SUBMITTED"),
      underReview: count("UNDER_REVIEW"),
      shortlisted: count("SHORTLISTED"),
      interviewing: count("INTERVIEWING"),
      offered: count("OFFERED"),
      hired: count("HIRED"),
      rejected: count("REJECTED"),
    };
  }

  // ─── Bulk Operations ─────────────────────────────────────────────────────────

  async bulkUpdateStatus(
    jobIds: string[],
    status: JobStatus,
    updatedBy: string
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const jobId of jobIds) {
      try {
        await this.update(jobId, { status }, updatedBy);
        updated++;
      } catch {
        failed.push(jobId);
      }
    }

    return { updated, failed };
  }

  async bulkAssignRecruiter(
    jobIds: string[],
    recruiterId: string
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    try {
      const result = await prisma.job.updateMany({
        where: { id: { in: jobIds } },
        data: { recruiterId, updatedAt: new Date() },
      });
      updated = result.count;
    } catch {
      failed.push(...jobIds);
    }

    return { updated, failed };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private includeClause() {
    return {
      hiringManager: {
        select: { id: true, name: true, email: true, image: true },
      },
      recruiter: {
        select: { id: true, name: true, email: true, image: true },
      },
      requiredSkills: true,
      screeningQuestions: true,
      applications: {
        select: {
          id: true,
          candidate: { select: { firstName: true, lastName: true, email: true } },
          status: true,
          createdAt: true,
          matchScore: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" as const },
      },
      _count: {
        select: { applications: true, interviews: true },
      },
    };
  }

  private buildWhereClause(firmId: string, filters?: JobFilter): Record<string, unknown> {
    const where: Record<string, unknown> = {
      firmId,
      isActive: true,
    };

    if (!filters) return where;

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters.department) {
      where.department = { contains: filters.department, mode: "insensitive" };
    }
    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }
    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      where.experienceLevel = { in: filters.experienceLevel };
    }
    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }
    if (filters.isRemote !== undefined) {
      where.isRemote = filters.isRemote;
    }
    if (filters.hiringManagerId) {
      where.hiringManagerId = filters.hiringManagerId;
    }
    if (filters.recruiterId) {
      where.recruiterId = filters.recruiterId;
    }
    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }
    if (filters.salaryMin) {
      where.salaryMax = { gte: filters.salaryMin };
    }
    if (filters.salaryMax) {
      where.salaryMin = { lte: filters.salaryMax };
    }
    if (filters.closingSoon) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.closingSoon);
      where.closingDate = { lte: futureDate, gte: new Date() };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { department: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    return where;
  }

  private formatJobWithDetails(raw: any): JobWithDetails {
    return {
      id: raw.id,
      title: raw.title,
      department: raw.department,
      team: raw.team,
      location: raw.location,
      isRemote: raw.isRemote,
      type: raw.type,
      experienceLevel: raw.experienceLevel,
      employmentType: raw.employmentType,
      description: raw.description,
      requirements: JSON.parse(raw.requirements ?? "[]"),
      responsibilities: JSON.parse(raw.responsibilities ?? "[]"),
      niceToHaves: JSON.parse(raw.niceToHaves ?? "[]"),
      salary: {
        min: raw.salaryMin,
        max: raw.salaryMax,
        currency: raw.salaryCurrency,
        period: raw.salaryPeriod,
        isNegotiable: raw.salaryNegotiable,
      },
      benefits: raw.benefits ? JSON.parse(raw.benefits) : null,
      status: raw.status,
      priority: raw.priority,
      headcount: raw.headcount,
      filledCount: raw.filledCount,
      hiringManager: raw.hiringManager,
      recruiter: raw.recruiter,
      requiredSkills: raw.requiredSkills,
      screeningQuestions: raw.screeningQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options ? JSON.parse(q.options) : null,
        required: q.required,
        passingAnswer: q.passingAnswer,
        weight: q.weight,
      })),
      applications: raw.applications,
      applicationCount: raw._count?.applications ?? 0,
      interviewCount: raw._count?.interviews ?? 0,
      closingDate: raw.closingDate,
      publishedAt: raw.publishedAt,
      closedAt: raw.closedAt,
      tags: JSON.parse(raw.tags ?? "[]"),
      metadata: raw.metadata,
      firmId: raw.firmId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const jobService = new JobService();
