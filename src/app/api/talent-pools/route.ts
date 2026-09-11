import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createPoolSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  criteria: z
    .object({
      skills: z.array(z.string()).optional(),
      experienceLevel: z.string().optional(),
      location: z.string().optional(),
      minSalary: z.number().optional(),
      maxSalary: z.number().optional(),
      workPreference: z.string().optional(),
    })
    .optional(),
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
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (session.user.companyId) {
      where.companyId = session.user.companyId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [pools, total] = await Promise.all([
      prisma.talentPool.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          members: {
            include: {
              candidate: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          _count: { select: { members: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.talentPool.count({ where }),
    ]);

    return NextResponse.json({
      data: pools,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/talent-pools error:", error);
    return NextResponse.json({ error: "Failed to fetch talent pools" }, { status: 500 });
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
    const validated = createPoolSchema.parse(body);

    const pool = await prisma.talentPool.create({
      data: {
        name: validated.name,
        description: validated.description,
        criteria: validated.criteria || {},
        tags: validated.tags,
        companyId: session.user.companyId!,
      },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ data: pool }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/talent-pools error:", error);
    return NextResponse.json({ error: "Failed to create talent pool" }, { status: 500 });
  }
}
