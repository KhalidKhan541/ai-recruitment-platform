import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateApplicationSchema = z.object({
  coverLetter: z.string().optional().nullable(),
  notes: z.string().optional(),
  rating: z.number().min(0).max(100).optional().nullable(),
  rejectedReason: z.string().optional().nullable(),
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

    const application = await prisma.jobApplication.findUnique({
      where: { id: params.id },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
            resumes: { orderBy: { createdAt: "desc" }, take: 1 },
            skills: true,
            experiences: true,
            educations: true,
          },
        },
        job: {
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
        interviews: { orderBy: { scheduledAt: "desc" } },
        offers: { orderBy: { createdAt: "desc" } },
        screenings: true,
        _count: { select: { interviews: true, offers: true } },
      },
    });

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

    const existing = await prisma.jobApplication.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateApplicationSchema.parse(body);

    const application = await prisma.jobApplication.update({
      where: { id: params.id },
      data: validated,
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const application = await prisma.jobApplication.findUnique({
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

    await prisma.jobApplication.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Application deleted" });
  } catch (error) {
    console.error("DELETE /api/applications/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
