import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createCandidateSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(1).max(200).trim(),
  phone: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  linkedIn: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
        yearsOfExperience: z.number().optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        gpa: z.number().optional(),
      })
    )
    .optional(),
  workHistory: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean().default(false),
        description: z.string(),
        achievements: z.array(z.string()).default([]),
      })
    )
    .optional(),
  resume: z.string().optional(),
  talentPoolId: z.string().optional(),
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
    const talentPoolId = searchParams.get("talentPoolId") || undefined;
    const skill = searchParams.get("skill") || undefined;
    const location = searchParams.get("location") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (talentPoolId) where.talentPoolId = talentPoolId;
    if (location) where.location = { contains: location, mode: "insensitive" };

    if (skill) {
      where.skills = { path: "$", string_contains: skill };
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          talentPool: { select: { id: true, name: true } },
          _count: { select: { applications: true, interviews: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.candidate.count({ where }),
    ]);

    return NextResponse.json({
      data: candidates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCandidateSchema.parse(body);

    const existing = await prisma.candidate.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A candidate with this email already exists", candidateId: existing.id },
        { status: 409 }
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        email: validated.email,
        name: validated.name,
        phone: validated.phone,
        title: validated.title,
        location: validated.location,
        linkedIn: validated.linkedIn || null,
        portfolio: validated.portfolio || null,
        skills: validated.skills || [],
        education: validated.education || [],
        workHistory: validated.workHistory || [],
        resume: validated.resume,
        talentPoolId: validated.talentPoolId,
        status: "new",
      },
    });

    return NextResponse.json({ data: candidate }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/candidates error:", error);
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
