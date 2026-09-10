import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateApplicationSchema = z.object({
  resume: z.string().optional(),
  coverLetter: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

async function getApplicationWithRelations(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      candidate: {
        select: {
          id: true, name: true, email: true, avatar: true,
          title: true, location: true, phone: true, skills: true,
          experience: true, education: true, workHistory: true,
          aiScore: true, aiSummary: true,
        },
      },
      job: {
        select: {
          id: true, title: true, department: true, location: true,
          type: true, status: true, requiredSkills: true,
          hiringManager: { select: { id: true, name: true, email: true } },
          recruiter: { select: { id: true, name: true, email: true } },
        },
      },
      notes: {
        include: { author: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
      timeline: { orderBy: { createdAt: "desc" } },
      interviews: { orderBy: { scheduledAt: "desc" } },
      offers: { orderBy: { createdAt: "desc" } },
      _count: { select: { interviews: true, notes: true } },
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

    const application = await getApplicationWithRelations(params.id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
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

    const existing = await prisma.application.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateApplicationSchema.parse(body);

    const application = await prisma.application.update({
      where: { id: params.id },
      data: validated,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ data: application });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
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

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: { _count: { select: { interviews: true, offers: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application._count.interviews > 0 || application._count.offers > 0) {
      return NextResponse.json(
        { error: "Cannot delete application with existing interviews or offers" },
        { status: 400 }
      );
    }

    await prisma.application.delete({ where: { id: params.id } });

    await prisma.job.update({
      where: { id: application.jobId },
      data: { applicationCount: { decrement: 1 } },
    });

    return NextResponse.json({ message: "Application deleted" });
  } catch (error) {
    console.error("DELETE /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
