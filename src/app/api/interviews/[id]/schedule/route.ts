import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().min(15).max(480).optional(),
  location: z.string().optional().nullable(),
  meetingUrl: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().optional(),
  sendInvite: z.boolean().default(true),
  reminderMinutes: z.number().min(5).max(1440).default(30),
});

export async function POST(
  request: NextRequest,
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
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: { select: { id: true, title: true } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot reschedule a completed interview" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = scheduleSchema.parse(body);

    const scheduledDate = new Date(validated.scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Interview must be scheduled in the future" },
        { status: 400 }
      );
    }

    const duration = validated.durationMinutes || interview.durationMinutes;

    const updated = await prisma.interview.update({
      where: { id: params.id },
      data: {
        scheduledAt: scheduledDate,
        durationMinutes: duration,
        location: validated.location !== undefined ? validated.location : interview.location,
        meetingUrl: validated.meetingUrl !== undefined ? validated.meetingUrl : interview.meetingUrl,
        notes: validated.notes || interview.notes,
        status: interview.status === "RESCHEDULED" ? "RESCHEDULED" : "RESCHEDULED",
      },
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: { select: { id: true, title: true } },
      },
    });

    const calendarEvent = {
      title: `${interview.jobPosting.title} - Interview with ${interview.candidate.user.name}`,
      start: scheduledDate.toISOString(),
      end: new Date(scheduledDate.getTime() + duration * 60000).toISOString(),
      description: `Interview type: ${interview.type}\nCandidate: ${interview.candidate.user.name}`,
      location: validated.location || interview.location || "Online",
      meetingLink: validated.meetingUrl || interview.meetingUrl,
      reminder: validated.reminderMinutes,
    };

    return NextResponse.json({
      data: updated,
      calendarEvent,
      message: "Interview rescheduled successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/interviews/[id]/schedule error:", error);
    return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 });
  }
}
