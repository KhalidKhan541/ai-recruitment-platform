import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createApplicationSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  resume: z.string().optional(),
  coverLetter: z.string().optional(),
  screeningAnswers: z.record(z.any()).optional(),
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
    const jobId = searchParams.get("jobId") || undefined;
    const candidateId = searchParams.get("candidateId") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (candidateId) where.candidateId = candidateId;
    if (search) {
      where.OR = [
        { candidate: { name: { contains: search, mode: "insensitive" } } },
        { candidate: { email: { contains: search, mode: "insensitive" } } },
        { job: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (session.user.role === "recruiter" || session.user.role === "hiring_manager") {
      where.OR = [
        { job: { hiringManagerId: session.user.id } },
        { job: { recruiterId: session.user.id } },
        ...(where.OR || []),
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          candidate: { select: { id: true, name: true, email: true, avatar: true, title: true, location: true } },
          job: { select: { id: true, title: true, department: true, location: true } },
          _count: { select: { interviews: true, notes: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createApplicationSchema.parse(body);

    const candidate = await prisma.candidate.findUnique({
      where: { id: validated.candidateId },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const job = await prisma.job.findUnique({ where: { id: validated.jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "open") {
      return NextResponse.json({ error: "This job is not accepting applications" }, { status: 400 });
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: validated.candidateId,
          jobId: validated.jobId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Candidate has already applied to this job" },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        candidateId: validated.candidateId,
        jobId: validated.jobId,
        resume: validated.resume,
        coverLetter: validated.coverLetter,
        metadata: validated.screeningAnswers
          ? { screeningAnswers: validated.screeningAnswers }
          : validated.metadata,
        submittedById: session.user.id,
        status: "submitted",
      },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true } },
      },
    });

    await prisma.job.update({
      where: { id: validated.jobId },
      data: { applicationCount: { increment: 1 } },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "applied",
        title: "Application submitted",
        description: `${candidate.name} applied for ${job.title}`,
        applicationId: application.id,
      },
    });

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/applications error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
