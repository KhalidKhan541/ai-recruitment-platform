import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createInterviewSchema = z.object({
  applicationId: z.string().min(1),
  candidateId: z.string().min(1),
  interviewerId: z.string().optional(),
  type: z.enum(["phone", "video", "onsite", "technical", "panel", "cultural", "executive"]).default("video"),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480).default(60),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
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
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const candidateId = searchParams.get("candidateId") || undefined;
    const applicationId = searchParams.get("applicationId") || undefined;
    const interviewerId = searchParams.get("interviewerId") || undefined;
    const upcoming = searchParams.get("upcoming") === "true";
    const sortBy = searchParams.get("sortBy") || "scheduledAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (candidateId) where.candidateId = candidateId;
    if (applicationId) where.applicationId = applicationId;
    if (interviewerId) where.interviewerId = interviewerId;

    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ["scheduled", "rescheduled"] };
    }

    if (session.user.role === "recruiter" || session.user.role === "hiring_manager") {
      where.interviewerId = session.user.id;
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: {
          candidate: { select: { id: true, name: true, email: true, avatar: true, title: true } },
          application: {
            include: {
              job: { select: { id: true, title: true, department: true } },
            },
          },
          interviewer: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.interview.count({ where }),
    ]);

    return NextResponse.json({
      data: interviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/interviews error:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createInterviewSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id: validated.applicationId },
      include: { job: { select: { id: true, title: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: validated.candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const scheduledDate = new Date(validated.scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Interview must be scheduled in the future" },
        { status: 400 }
      );
    }

    const interviewerId = validated.interviewerId || session.user.id;

    const conflicting = await prisma.interview.findFirst({
      where: {
        interviewerId,
        status: { in: ["scheduled", "rescheduled"] },
        scheduledAt: {
          gte: new Date(scheduledDate.getTime() - validated.duration * 60000),
          lte: new Date(scheduledDate.getTime() + validated.duration * 60000),
        },
      },
    });

    if (conflicting) {
      return NextResponse.json(
        { error: "Interviewer has a conflicting interview at this time" },
        { status: 409 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: validated.applicationId,
        candidateId: validated.candidateId,
        interviewerId,
        type: validated.type,
        scheduledAt: scheduledDate,
        duration: validated.duration,
        location: validated.location,
        meetingLink: validated.meetingLink || null,
        notes: validated.notes,
        metadata: validated.metadata,
        status: "scheduled",
      },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        application: { include: { job: { select: { id: true, title: true } } } },
        interviewer: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.application.update({
      where: { id: validated.applicationId },
      data: { status: validated.type === "phone" ? "phone_interview" : "technical_interview" },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "interview_scheduled",
        title: `${validated.type} interview scheduled`,
        description: `Interview with ${candidate.name} on ${scheduledDate.toLocaleDateString()}`,
        metadata: { interviewId: interview.id, type: validated.type },
        applicationId: validated.applicationId,
      },
    });

    return NextResponse.json({ data: interview }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/interviews error:", error);
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}
