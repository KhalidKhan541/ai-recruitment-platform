import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updatePoolSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
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
  tags: z.array(z.string()).optional(),
});

const addMemberSchema = z.object({
  candidateId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = await prisma.talentPool.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true } },
        members: {
          include: {
            candidate: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                skills: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { members: true } },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: "Talent pool not found" }, { status: 404 });
    }

    return NextResponse.json({ data: pool });
  } catch (error) {
    console.error("GET /api/talent-pools/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch talent pool" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.talentPool.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Talent pool not found" }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updatePoolSchema.parse(body);

    const pool = await prisma.talentPool.update({
      where: { id: params.id },
      data: validated,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ data: pool });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/talent-pools/[id] error:", error);
    return NextResponse.json({ error: "Failed to update talent pool" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.talentPool.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Talent pool not found" }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.talentPool.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Talent pool deleted" });
  } catch (error) {
    console.error("DELETE /api/talent-pools/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete talent pool" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = await prisma.talentPool.findUnique({ where: { id: params.id } });
    if (!pool) {
      return NextResponse.json({ error: "Talent pool not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = addMemberSchema.parse(body);

    const candidate = await prisma.candidate.findUnique({
      where: { id: validated.candidateId },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const existingMember = await prisma.talentPoolMember.findUnique({
      where: {
        poolId_candidateId: {
          poolId: params.id,
          candidateId: validated.candidateId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Candidate is already in this talent pool" },
        { status: 409 }
      );
    }

    const member = await prisma.talentPoolMember.create({
      data: {
        poolId: params.id,
        candidateId: validated.candidateId,
        addedById: session.user.id,
        notes: validated.notes,
        status: "ACTIVE",
      },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/talent-pools/[id] error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
