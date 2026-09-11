import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pipelineUpdateSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
  stage: z.enum([
    "sourced",
    "contacted",
    "screening",
    "interview",
    "offer",
    "hired",
    "rejected",
    "withdrawn",
  ]),
  notes: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId") || undefined;
    const stage = searchParams.get("stage") || undefined;

    const where: any = {};

    if (session.user.role !== "ADMIN") {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: session.user.id },
      });
      if (recruiter) {
        where.recruiterId = recruiter.id;
      }
    }

    if (jobId) where.jobId = jobId;
    if (stage) where.stage = stage;

    const pipelines = await prisma.recruiterPipeline.findMany({
      where,
      include: {
        recruiter: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        jobPosting: {
          select: { id: true, title: true, department: true, status: true },
        },
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            skills: { take: 5 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const stageCounts = pipelines.reduce((acc: Record<string, number>, p) => {
      acc[p.stage] = (acc[p.stage] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      data: {
        pipelines,
        summary: {
          total: pipelines.length,
          byStage: stageCounts,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/recruiters/pipeline error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = pipelineUpdateSchema.parse(body);

    const recruiter = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: validated.jobId },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: validated.candidateId },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const existingPipeline = await prisma.recruiterPipeline.findFirst({
      where: {
        jobId: validated.jobId,
        candidateId: validated.candidateId,
        recruiterId: recruiter.id,
      },
    });

    let pipeline;
    if (existingPipeline) {
      pipeline = await prisma.recruiterPipeline.update({
        where: { id: existingPipeline.id },
        data: {
          stage: validated.stage,
          notes: validated.notes,
          expectedCloseDate: validated.expectedCloseDate
            ? new Date(validated.expectedCloseDate)
            : existingPipeline.expectedCloseDate,
        },
        include: {
          jobPosting: { select: { id: true, title: true } },
          candidate: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    } else {
      pipeline = await prisma.recruiterPipeline.create({
        data: {
          recruiterId: recruiter.id,
          jobId: validated.jobId,
          candidateId: validated.candidateId,
          stage: validated.stage,
          notes: validated.notes,
          expectedCloseDate: validated.expectedCloseDate
            ? new Date(validated.expectedCloseDate)
            : null,
        },
        include: {
          jobPosting: { select: { id: true, title: true } },
          candidate: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    }

    if (validated.stage === "hired") {
      await prisma.recruiter.update({
        where: { id: recruiter.id },
        data: { totalPlacements: { increment: 1 } },
      });
    }

    return NextResponse.json({
      data: pipeline,
      message: existingPipeline
        ? "Pipeline updated"
        : "Candidate added to pipeline",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/recruiters/pipeline error:", error);
    return NextResponse.json({ error: "Failed to update pipeline" }, { status: 500 });
  }
}
