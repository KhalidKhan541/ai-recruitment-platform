import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateCandidateSchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  summary: z.string().optional().nullable(),
  desiredSalary: z.number().optional().nullable(),
  desiredSalaryCurrency: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  workPreference: z.string().optional().nullable(),
  expectedExperienceLevel: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal("")).nullable(),
  portfolioUrl: z.string().url().optional().or(z.literal("")).nullable(),
  githubUrl: z.string().url().optional().or(z.literal("")).nullable(),
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

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true, role: true } },
        company: { select: { id: true, name: true } },
        skills: true,
        experiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { startDate: "desc" } },
        certifications: true,
        references: true,
        resumes: { orderBy: { createdAt: "desc" } },
        applications: {
          include: {
            job: { select: { id: true, title: true, department: true, status: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        interviews: {
          include: { jobPosting: { select: { id: true, title: true } } },
          orderBy: { scheduledAt: "desc" },
        },
        poolMemberships: {
          include: { pool: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
            assessmentResults: true,
            poolMemberships: true,
          },
        },
      },
    });

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

    const updateData: any = { ...validated };
    if (validated.linkedInUrl === "") updateData.linkedInUrl = null;
    if (validated.portfolioUrl === "") updateData.portfolioUrl = null;
    if (validated.githubUrl === "") updateData.githubUrl = null;

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
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

    if (session.user.role !== "ADMIN") {
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
    await prisma.user.delete({ where: { id: candidate.userId } });

    return NextResponse.json({ message: "Candidate deleted" });
  } catch (error) {
    console.error("DELETE /api/candidates/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
