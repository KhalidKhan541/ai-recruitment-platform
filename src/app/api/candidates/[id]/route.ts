import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateCandidateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  linkedIn: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
        yearsOfExperience: z.number().optional(),
        endorsed: z.boolean().optional(),
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
        description: z.string().optional(),
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
        current: z.boolean(),
        description: z.string(),
        achievements: z.array(z.string()),
      })
    )
    .optional(),
  status: z.string().optional(),
  talentPoolId: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),
});

async function getCandidateWithRelations(id: string) {
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      talentPool: { select: { id: true, name: true } },
      applications: {
        include: {
          job: { select: { id: true, title: true, department: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      interviews: { orderBy: { scheduledAt: "desc" } },
      assessments: { orderBy: { createdAt: "desc" } },
      _count: { select: { applications: true, interviews: true, assessments: true } },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await getCandidateWithRelations(params.id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ data: candidate });
  } catch (error) {
    console.error("GET /api/candidates/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
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

    const existing = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateCandidateSchema.parse(body);

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json({ data: candidate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/candidates/[id] error:", error);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
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

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: { _count: { select: { applications: true, interviews: true } } },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    if (candidate._count.applications > 0 || candidate._count.interviews > 0) {
      return NextResponse.json(
        { error: "Cannot delete candidate with existing applications or interviews" },
        { status: 400 }
      );
    }

    await prisma.candidate.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Candidate deleted" });
  } catch (error) {
    console.error("DELETE /api/candidates/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
