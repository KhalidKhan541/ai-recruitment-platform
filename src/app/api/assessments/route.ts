import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["TECHNICAL", "BEHAVIORAL", "PERSONALITY", "COGNITIVE", "SKILL_SPECIFIC"]),
  durationMinutes: z.number().min(5).max(480),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().min(1).max(10).default(1),
  questions: z.array(
    z.object({
      question: z.string().min(1),
      type: z.enum(["multiple_choice", "true_false", "text", "code"]).default("multiple_choice"),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      points: z.number().min(1).default(1),
      category: z.string().optional(),
    })
  ).min(1, "At least one question is required"),
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
    const type = searchParams.get("type") || undefined;
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search") || undefined;

    const where: any = {};

    if (type) where.type = type;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [assessments, total] = await Promise.all([
      prisma.skillAssessment.findMany({
        where,
        include: {
          _count: { select: { results: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.skillAssessment.count({ where }),
    ]);

    return NextResponse.json({
      data: assessments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/assessments error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createAssessmentSchema.parse(body);

    const assessment = await prisma.skillAssessment.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        durationMinutes: validated.durationMinutes,
        passingScore: validated.passingScore,
        maxAttempts: validated.maxAttempts,
        isActive: true,
        questions: validated.questions,
      },
      include: {
        _count: { select: { results: true } },
      },
    });

    return NextResponse.json({ data: assessment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/assessments error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
