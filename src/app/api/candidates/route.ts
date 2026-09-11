import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createCandidateSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(1).max(200).trim(),
  phone: z.string().optional(),
  headline: z.string().max(200).optional(),
  summary: z.string().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  desiredSalary: z.number().optional(),
  desiredSalaryCurrency: z.string().default("USD"),
  willingToRelocate: z.boolean().default(false),
  workPreference: z.string().optional(),
  expectedExperienceLevel: z.string().optional(),
  companyId: z.string().uuid().optional(),
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
    const isAvailable = searchParams.get("isAvailable");
    const companyId = searchParams.get("companyId") || undefined;
    const skill = searchParams.get("skill") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { headline: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      where.isAvailable = isAvailable === "true";
    }

    if (companyId) where.companyId = companyId;

    if (skill) {
      where.skills = { some: { name: { contains: skill, mode: "insensitive" } } };
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          company: { select: { id: true, name: true } },
          skills: true,
          _count: {
            select: {
              applications: true,
              interviews: true,
              poolMemberships: true,
            },
          },
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

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        phone: validated.phone,
        role: "CANDIDATE",
        companyId: validated.companyId || session.user.companyId || null,
      },
    });

    const candidate = await prisma.candidate.create({
      data: {
        userId: user.id,
        headline: validated.headline,
        summary: validated.summary,
        linkedInUrl: validated.linkedInUrl || null,
        portfolioUrl: validated.portfolioUrl || null,
        githubUrl: validated.githubUrl || null,
        desiredSalary: validated.desiredSalary,
        desiredSalaryCurrency: validated.desiredSalaryCurrency,
        willingToRelocate: validated.willingToRelocate,
        workPreference: validated.workPreference,
        expectedExperienceLevel: validated.expectedExperienceLevel,
        companyId: validated.companyId || session.user.companyId || null,
        profileCompleteness: 0,
        isAvailable: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
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
