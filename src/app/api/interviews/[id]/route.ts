import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateInterviewSchema = z.object({
  type: z.enum(["phone", "video", "onsite", "technical", "panel", "cultural", "executive"]).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().min(15).max(480).optional(),
  location: z.string().optional().nullable(),
  meetingUrl: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"])
    .optional(),
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

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
            skills: true,
            experiences: true,
            educations: true,
          },
        },
        jobPosting: {
          select: {
            id: true, title: true, department: true, location: true,
            description: true, requirements: true, responsibilities: true,
            experienceLevel: true, salaryMin: true, salaryMax: true,
          },
        },
        application: {
          select: { id: true, status: true, rating: true },
        },
        panels: true,
        questions: { orderBy: { order: "asc" } },
        scores: true,
        feedback: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({ data: interview });
  } catch (error) {
    console.error("GET /api/interviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 });
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

    const existing = await prisma.interview.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot update a ${existing.status.toLowerCase()} interview` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateInterviewSchema.parse(body);

    if (validated.scheduledAt) {
      const newDate = new Date(validated.scheduledAt);
      if (newDate <= new Date()) {
        return NextResponse.json(
          { error: "Interview must be scheduled in the future" },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...validated };
    if (validated.meetingUrl === "") updateData.meetingUrl = null;
    if (validated.location === "") updateData.location = null;
    if (validated.description === "") updateData.description = null;
    if (validated.notes === "") updateData.notes = null;

    if (validated.status && validated.status !== existing.status) {
      if (validated.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }

    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: updateData,
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: { select: { id: true, title: true } },
        panels: true,
      },
    });

    return NextResponse.json({ data: interview });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/interviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
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

    const interview = await prisma.interview.findUnique({ where: { id: params.id } });
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel a completed interview" },
        { status: 400 }
      );
    }

    await prisma.interview.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "Interview cancelled" });
  } catch (error) {
    console.error("DELETE /api/interviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel interview" }, { status: 500 });
  }
}
