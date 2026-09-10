import { prisma } from "@/lib/prisma";
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
// and analytics for recruitment pipeline visibility.

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
      include: {
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
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return this.formatJobWithDetails(job);
  }

  async getById(jobId: string): Promise<JobWithDetails | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
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
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return job ? this.formatJobWithDetails(job) : null;
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
        include: {
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
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { applications: true, interviews: true },
          },
        },
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

  async update(jobId: string, input: UpdateJobInput, updatedBy: string): Promise<JobWithDetails> {
    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) throw new Error("Job not found");

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
    }

    // Replace skills if provided
    if (input.requiredSkills !== undefined) {
      await prisma.jobRequiredSkill.deleteMany({ where: { jobId } });
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

    // Replace screening questions if provided
    if (input.screeningQuestions !== undefined) {
      await prisma.screeningQuestion.deleteMany({ where: { jobId } });
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

    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
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
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { applications: true, interviews: true },
        },
      },
    });

    return this.formatJobWithDetails(updated);
  }

  async delete(jobId: string): Promise<void> {
    await prisma.job.delete({ where: { id: jobId } });
  }

  // ─── Publishing & Status Management ────────────────────────────────────────

  async publish(jobId: string, publishedBy: string): Promise<JobWithDetails> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job not found");
    if (job.status === "DRAFT") {
      const updated = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "OPEN",
          publishedAt: new Date(),
        },
        include: {
          hiringManager: { select: { id: true, name: true, email: true, image: true } },
          recruiter: { select: { id: true, name: true, email: true, image: true } },
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
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { applications: true, interviews: true } },
        },
      });
      return this.formatJobWithDetails(updated);
    }
    throw new Error(`Cannot publish job in ${job.status} status`);
  }

  async unpublish(jobId: string): Promise<JobWithDetails> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job not found");

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: "ON_HOLD" },
      include: {
        hiringManager: { select: { id: true, name: true, email: true, image: true } },
        recruiter: { select: { id: true, name: true, email: true, image: true } },
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
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { applications: true, interviews: true } },
      },
    });

    return this.formatJobWithDetails(updated);
  }

  async closeJob(jobId: string): Promise<JobWithDetails> {
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: "CLOSED" },
      include: {
        hiringManager: { select: { id: true, name: true, email: true, image: true } },
        recruiter: { select: { id: true, name: true, email: true, image: true } },
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
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { applications: true, interviews: true } },
      },
    });

    return this.formatJobWithDetails(updated);
  }

  // ─── Screening Questions ───────────────────────────────────────────────────

  async getScreeningQuestions(jobId: string): Promise<ScreeningQuestion[]> {
    const questions = await prisma.screeningQuestion.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type as ScreeningQuestion["type"],
      options: q.options ? JSON.parse(q.options as string) : null,
      required: q.required,
      passingAnswer: q.passingAnswer,
      weight: q.weight,
    }));
  }

  async evaluateScreeningAnswers(
    jobId: string,
    answers: { questionId: string; answer: string }[]
  ): Promise<{ passed: boolean; score: number; details: { questionId: string; passed: boolean; score: number }[] }> {
    const questions = await prisma.screeningQuestion.findMany({
      where: { jobId },
    });

    const details = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return { questionId: answer.questionId, passed: false, score: 0 };

      const passed = question.passingAnswer
        ? answer.answer.toLowerCase().trim() === question.passingAnswer.toLowerCase().trim()
        : true;

      return {
        questionId: answer.questionId,
        passed,
        score: passed ? question.weight : 0,
      };
    });

    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    const earnedWeight = details.reduce((sum, d) => sum + d.score, 0);
    const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
    const passed = details.filter((d) => d.passed).length === details.length;

    return { passed, score, details };
  }

  // ─── Analytics & Statistics ────────────────────────────────────────────────

  async getStats(firmId: string): Promise<JobStats> {
    const [
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      jobsByStatus,
      jobsByType,
      jobsByDepartment,
    ] = await Promise.all([
      prisma.job.count({ where: { firmId, isActive: true } }),
      prisma.job.count({ where: { firmId, status: "OPEN" } }),
      prisma.job.count({ where: { firmId, status: "CLOSED" } }),
      prisma.application.count({ where: { job: { firmId } } }),
      prisma.job.groupBy({
        by: ["status"],
        where: { firmId, isActive: true },
        _count: true,
      }),
      prisma.job.groupBy({
        by: ["type"],
        where: { firmId, isActive: true },
        _count: true,
      }),
      prisma.job.groupBy({
        by: ["department"],
        where: { firmId, isActive: true },
        _count: true,
        orderBy: { _count: { department: "desc" } },
        take: 10,
      }),
    ]);

    // Calculate average time to fill
    const filledJobs = await prisma.job.findMany({
      where: { firmId, filledAt: { not: null }, publishedAt: { not: null } },
      select: { publishedAt: true, filledAt: true },
    });

    const avgTimeToFill = filledJobs.length > 0
      ? filledJobs.reduce((sum, j) => {
          const days = Math.ceil(
            (j.filledAt!.getTime() - j.publishedAt!.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / filledJobs.length
      : 0;

    // Top skills demand
    const skillDemand = await prisma.jobRequiredSkill.groupBy({
      by: ["skillName"],
      where: { job: { firmId, isActive: true } },
      _count: true,
      orderBy: { _count: { skillName: "desc" } },
      take: 10,
    });

    // Monthly hires
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyHires = await prisma.application.groupBy({
      by: ["createdAt"],
      where: {
        job: { firmId },
        status: "HIRED",
        createdAt: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    const monthlyHiresMap = new Map<string, number>();
    monthlyHires.forEach((h) => {
      const month = h.createdAt.toISOString().slice(0, 7);
      monthlyHiresMap.set(month, (monthlyHiresMap.get(month) ?? 0) + h._count);
    });

    return {
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      averageTimeToFill: Math.round(avgTimeToFill),
      jobsByStatus: Object.fromEntries(
        jobsByStatus.map((j) => [j.status, j._count])
      ) as Record<string, number>,
      jobsByType: Object.fromEntries(
        jobsByType.map((j) => [j.type, j._count])
      ) as Record<string, number>,
      jobsByDepartment: jobsByDepartment.map((d) => ({
        department: d.department,
        count: d._count,
      })),
      topSkills: skillDemand.map((s) => ({
        skill: s.skillName,
        demand: s._count,
      })),
      monthlyHires: Array.from(monthlyHiresMap.entries()).map(([month, hires]) => ({
        month,
        hires,
      })),
    };
  }

  async incrementViewCount(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async getByHiringManager(
    hiringManagerId: string,
    page = 1,
    limit = 20
  ): Promise<{ jobs: JobWithDetails[]; total: number }> {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { hiringManagerId, isActive: true },
        include: {
          hiringManager: { select: { id: true, name: true, email: true, image: true } },
          recruiter: { select: { id: true, name: true, email: true, image: true } },
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
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { applications: true, interviews: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.job.count({ where: { hiringManagerId, isActive: true } }),
    ]);

    return {
      jobs: jobs.map((j) => this.formatJobWithDetails(j)),
      total,
    };
  }

  async getByRecruiter(
    recruiterId: string,
    page = 1,
    limit = 20
  ): Promise<{ jobs: JobWithDetails[]; total: number }> {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { recruiterId, isActive: true },
        include: {
          hiringManager: { select: { id: true, name: true, email: true, image: true } },
          recruiter: { select: { id: true, name: true, email: true, image: true } },
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
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { applications: true, interviews: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.job.count({ where: { recruiterId, isActive: true } }),
    ]);

    return {
      jobs: jobs.map((j) => this.formatJobWithDetails(j)),
      total,
    };
  }

  async searchJobs(
    firmId: string,
    query: string,
    page = 1,
    limit = 20
  ): Promise<{ jobs: JobWithDetails[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = {
      firmId,
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { department: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { location: { contains: query, mode: "insensitive" as const } },
      ],
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          hiringManager: { select: { id: true, name: true, email: true, image: true } },
          recruiter: { select: { id: true, name: true, email: true, image: true } },
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
            take: 3,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { applications: true, interviews: true } },
        },
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

  // ─── Helper Methods ────────────────────────────────────────────────────────

  private buildWhereClause(firmId: string, filters?: JobFilter) {
    const where: Record<string, unknown> = { firmId, isActive: true };

    if (!filters) return where;

    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.type?.length) where.type = { in: filters.type };
    if (filters.experienceLevel?.length) where.experienceLevel = { in: filters.experienceLevel };
    if (filters.employmentType?.length) where.employmentType = { in: filters.employmentType };
    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.isRemote !== undefined) where.isRemote = filters.isRemote;
    if (filters.department) where.department = { contains: filters.department, mode: "insensitive" };
    if (filters.hiringManagerId) where.hiringManagerId = filters.hiringManagerId;
    if (filters.recruiterId) where.recruiterId = filters.recruiterId;
    if (filters.hasOpenings) {
      where.AND = [{ headcount: { gt: prisma.raw("filledCount") } }];
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
        { description: { contains: filters.search, mode: "insensitive" } },
        { department: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private formatJobWithDetails(job: any): JobWithDetails {
    return {
      ...job,
      requirements: typeof job.requirements === "string" ? JSON.parse(job.requirements) : job.requirements,
      responsibilities: typeof job.responsibilities === "string" ? JSON.parse(job.responsibilities) : job.responsibilities,
      niceToHaves: typeof job.niceToHaves === "string" ? JSON.parse(job.niceToHaves) : job.niceToHaves,
      benefits: job.benefits ? (typeof job.benefits === "string" ? JSON.parse(job.benefits) : job.benefits) : null,
      tags: typeof job.tags === "string" ? JSON.parse(job.tags) : job.tags,
      salary: job.salaryMin !== null ? {
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.salaryCurrency,
        period: job.salaryPeriod,
        isNegotiable: job.salaryNegotiable,
      } : null,
      requiredSkills: (job.requiredSkills ?? []).map((s: any) => ({
        skillName: s.skillName,
        minimumLevel: s.minimumLevel,
        isRequired: s.isRequired,
        yearsExperience: s.yearsExperience,
      })),
      screeningQuestions: (job.screeningQuestions ?? []).map((q: any) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options ? JSON.parse(q.options) : null,
        required: q.required,
        passingAnswer: q.passingAnswer,
        weight: q.weight,
      })),
      applications: (job.applications ?? []).map((a: any) => ({
        id: a.id,
        candidateName: `${a.candidate.firstName} ${a.candidate.lastName}`,
        candidateEmail: a.candidate.email,
        status: a.status,
        appliedAt: a.createdAt,
        matchScore: a.matchScore,
      })),
      metadata: job.metadata ? (typeof job.metadata === "string" ? JSON.parse(job.metadata) : job.metadata) : null,
    };
  }
}

export const jobService = new JobService();
