import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480).optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  interviewerId: z.string().optional(),
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
        candidate: { select: { id: true, name: true, email: true } },
        application: { include: { job: { select: { id: true, title: true } } } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "completed") {
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

    const interviewerId = validated.interviewerId || interview.interviewerId || session.user.id;
    const duration = validated.duration || interview.duration;

    const conflicting = await prisma.interview.findFirst({
      where: {
        id: { not: params.id },
        interviewerId,
        status: { in: ["scheduled", "rescheduled"] },
        scheduledAt: {
          gte: new Date(scheduledDate.getTime() - duration * 60000),
          lte: new Date(scheduledDate.getTime() + duration * 60000),
        },
      },
    });

    if (conflicting) {
      return NextResponse.json(
        { error: "Interviewer has a conflicting interview at this time" },
        { status: 409 }
      );
    }

    const previousStatus = interview.status;
    const previousDate = interview.scheduledAt;

    const updated = await prisma.interview.update({
      where: { id: params.id },
      data: {
        scheduledAt: scheduledDate,
        duration,
        location: validated.location || interview.location,
        meetingLink: validated.meetingLink || interview.meetingLink,
        interviewerId,
        notes: validated.notes || interview.notes,
        status: "scheduled",
      },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        interviewer: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "interview_scheduled",
        title: previousStatus === "scheduled" ? "Interview rescheduled" : "Interview scheduled",
        description: `Interview with ${interview.candidate.name} scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`,
        metadata: {
          interviewId: params.id,
          previousDate: previousDate?.toISOString(),
          newDate: scheduledDate.toISOString(),
          rescheduledBy: session.user.id,
        },
        applicationId: interview.applicationId,
      },
    });

    const calendarEvent = {
      title: `${interview.application.job.title} - Interview with ${interview.candidate.name}`,
      start: scheduledDate.toISOString(),
      end: new Date(scheduledDate.getTime() + duration * 60000).toISOString(),
      description: `Interview type: ${interview.type}\nCandidate: ${interview.candidate.name} (${interview.candidate.email})`,
      location: validated.location || interview.location || "Online",
      meetingLink: validated.meetingLink || interview.meetingLink,
      attendees: [
        interview.candidate.email,
        ...(updated.interviewer ? [updated.interviewer.email] : []),
      ],
      reminder: validated.reminderMinutes,
    };

    return NextResponse.json({
      data: updated,
      calendarEvent,
      message: "Interview scheduled successfully",
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
