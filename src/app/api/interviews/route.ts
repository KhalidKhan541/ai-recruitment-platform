import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  candidateId: z.string().uuid(),
  type: z
    .enum(["phone", "video", "onsite", "technical", "panel", "cultural", "executive"])
    .default("video"),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().min(15).max(480).default(60),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
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
    const jobId = searchParams.get("jobId") || undefined;
    const upcoming = searchParams.get("upcoming") === "true";
    const sortBy = searchParams.get("sortBy") || "scheduledAt";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (candidateId) where.candidateId = candidateId;
    if (jobId) where.jobId = jobId;

    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ["SCHEDULED", "RESCHEDULED"] };
    }

    if (session.user.companyId) {
      where.job = { companyId: session.user.companyId };
    }

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: {
          candidate: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          jobPosting: {
            select: { id: true, title: true, department: true, companyId: true },
          },
          application: {
            select: { id: true, status: true },
          },
          panels: true,
          scores: true,
          feedback: true,
          _count: { select: { scores: true, feedback: true } },
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

    const application = await prisma.jobApplication.findUnique({
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

    const interview = await prisma.interview.create({
      data: {
        jobId: application.jobId,
        applicationId: validated.applicationId,
        candidateId: validated.candidateId,
        type: validated.type,
        title: validated.title,
        description: validated.description,
        scheduledAt: scheduledDate,
        durationMinutes: validated.durationMinutes,
        location: validated.location,
        meetingUrl: validated.meetingUrl || null,
        notes: validated.notes,
        status: "SCHEDULED",
      },
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: { select: { id: true, title: true } },
      },
    });

    await prisma.jobApplication.update({
      where: { id: validated.applicationId },
      data: { status: "INTERVIEW_SCHEDULED" },
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
