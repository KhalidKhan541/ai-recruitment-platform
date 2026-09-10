import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateInterviewSchema = z.object({
  type: z.enum(["phone", "video", "onsite", "technical", "panel", "cultural", "executive"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  interviewerId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled", "rescheduled", "no_show"]).optional(),
});

async function getInterviewWithRelations(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      candidate: {
        select: {
          id: true, name: true, email: true, avatar: true,
          title: true, location: true, phone: true,
          skills: true, experience: true, education: true,
        },
      },
      application: {
        include: {
          job: {
            select: {
              id: true, title: true, department: true, location: true,
              requiredSkills: true, description: true,
            },
          },
          candidate: { select: { id: true, name: true, email: true } },
        },
      },
      interviewer: { select: { id: true, name: true, email: true, avatar: true } },
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

    const interview = await getInterviewWithRelations(params.id);
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

    if (existing.status === "completed" || existing.status === "cancelled") {
      return NextResponse.json(
        { error: `Cannot update a ${existing.status} interview` },
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

      const interviewerId = validated.interviewerId || existing.interviewerId;
      if (interviewerId && validated.scheduledAt) {
        const duration = validated.duration || existing.duration;
        const conflicting = await prisma.interview.findFirst({
          where: {
            id: { not: params.id },
            interviewerId,
            status: { in: ["scheduled", "rescheduled"] },
            scheduledAt: {
              gte: new Date(newDate.getTime() - duration * 60000),
              lte: new Date(newDate.getTime() + duration * 60000),
            },
          },
        });

        if (conflicting) {
          return NextResponse.json(
            { error: "Interviewer has a conflicting interview at this time" },
            { status: 409 }
          );
        }
      }
    }

    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: validated,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        application: { include: { job: { select: { id: true, title: true } } } },
        interviewer: { select: { id: true, name: true, email: true } },
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

    if (interview.status === "completed") {
      return NextResponse.json(
        { error: "Cannot delete a completed interview" },
        { status: 400 }
      );
    }

    await prisma.interview.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ message: "Interview cancelled" });
  } catch (error) {
    console.error("DELETE /api/interviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to cancel interview" }, { status: 500 });
  }
}
