import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  department: z.string().max(100).optional(),
  location: z.string().min(1).max(200),
  isRemote: z.boolean().default(false),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "internship", "temporary", "remote", "freelance"])
    .default("full_time"),
  experienceLevel: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .default("MID"),
  educationLevel: z
    .enum(["HIGH_SCHOOL", "ASSOCIATE", "BACHELOR", "MASTER", "DOCTORATE", "NONE"])
    .optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().default("USD"),
  vacancies: z.number().min(1).default(1),
  applicationDeadline: z.string().datetime().optional(),
  screeningQuestions: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const department = searchParams.get("department") || undefined;
    const location = searchParams.get("location") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (session.user.companyId) {
      where.companyId = session.user.companyId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (department) where.department = { contains: department, mode: "insensitive" };
    if (location) where.location = { contains: location, mode: "insensitive" };

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { applications: true, interviews: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createJobSchema.parse(body);

    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    const job = await prisma.jobPosting.create({
      data: {
        title: validated.title,
        slug,
        description: validated.description,
        requirements: validated.requirements,
        responsibilities: validated.responsibilities,
        department: validated.department,
        location: validated.location,
        isRemote: validated.isRemote,
        employmentType: validated.employmentType,
        experienceLevel: validated.experienceLevel,
        educationLevel: validated.educationLevel,
        salaryMin: validated.salaryMin,
        salaryMax: validated.salaryMax,
        salaryCurrency: validated.salaryCurrency,
        vacancies: validated.vacancies,
        applicationDeadline: validated.applicationDeadline
          ? new Date(validated.applicationDeadline)
          : null,
        screeningQuestions: validated.screeningQuestions || [],
        tags: validated.tags,
        companyId: session.user.companyId!,
        status: "DRAFT",
      },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { applications: true, interviews: true } },
      },
    });

    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
