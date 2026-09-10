import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string().min(1).max(100),
  team: z.string().optional(),
  location: z.string().min(1).max(200),
  isRemote: z.boolean().default(false),
  type: z
    .enum(["full_time", "part_time", "contract", "internship", "temporary", "remote", "freelance"])
    .default("full_time"),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).default("mid"),
  employmentType: z.enum(["permanent", "temporary", "contract", "internship", "apprenticeship"]).default("permanent"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
  responsibilities: z.array(z.string()).min(1, "At least one responsibility is needed"),
  niceToHaves: z.array(z.string()).default([]),
  salary: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
      currency: z.string().default("USD"),
      period: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).default("yearly"),
      isNegotiable: z.boolean().default(false),
    })
    .optional(),
  benefits: z
    .object({
      healthInsurance: z.boolean().default(false),
      dentalInsurance: z.boolean().default(false),
      visionInsurance: z.boolean().default(false),
      retirementPlan: z.boolean().default(false),
      paidTimeOff: z.number().default(0),
      remoteWork: z.boolean().default(false),
      stockOptions: z.boolean().default(false),
      educationBudget: z.number().nullable().default(null),
      signingBonus: z.number().nullable().default(null),
      relocationAssistance: z.boolean().default(false),
      wellnessStipend: z.number().nullable().default(null),
      parentalLeave: z.number().nullable().default(null),
      customBenefits: z.array(z.string()).default([]),
    })
    .optional(),
  requiredSkills: z
    .array(
      z.object({
        skillName: z.string(),
        minimumLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
        isRequired: z.boolean().default(true),
        yearsExperience: z.number().nullable().optional(),
      })
    )
    .optional(),
  screeningQuestions: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  headcount: z.number().min(1).default(1),
  closingDate: z.string().datetime().optional(),
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
    const type = searchParams.get("type") || undefined;
    const location = searchParams.get("location") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (department) where.department = { contains: department, mode: "insensitive" };
    if (type) where.type = type;
    if (location) where.location = { contains: location, mode: "insensitive" };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          hiringManager: { select: { id: true, name: true, email: true, avatar: true } },
          recruiter: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { applications: true, interviews: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
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

    if (!["admin", "recruiter", "hiring_manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createJobSchema.parse(body);

    const job = await prisma.job.create({
      data: {
        ...validated,
        hiringManagerId: session.user.id,
        recruiterId: session.user.id,
        companyId: session.user.companyId,
        closingDate: validated.closingDate ? new Date(validated.closingDate) : null,
      },
      include: {
        hiringManager: { select: { id: true, name: true, email: true, avatar: true } },
        recruiter: { select: { id: true, name: true, email: true, avatar: true } },
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
