import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  department: z.string().min(1).max(100).optional(),
  team: z.string().optional(),
  location: z.string().min(1).max(200).optional(),
  isRemote: z.boolean().optional(),
  type: z.enum(["full_time", "part_time", "contract", "internship", "temporary", "remote", "freelance"]).optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).optional(),
  employmentType: z.enum(["permanent", "temporary", "contract", "internship", "apprenticeship"]).optional(),
  description: z.string().min(50).optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  niceToHaves: z.array(z.string()).optional(),
  salary: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
      currency: z.string().default("USD"),
      period: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).default("yearly"),
      isNegotiable: z.boolean().default(false),
    })
    .optional(),
  benefits: z.record(z.any()).optional(),
  requiredSkills: z.array(z.record(z.any())).optional(),
  screeningQuestions: z.array(z.any()).optional(),
  status: z.enum(["draft", "open", "on_hold", "closed", "archived", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  headcount: z.number().min(1).optional(),
  closingDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  recruiterId: z.string().optional().nullable(),
});

async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      hiringManager: { select: { id: true, name: true, email: true, avatar: true } },
      recruiter: { select: { id: true, name: true, email: true, avatar: true } },
      _count: { select: { applications: true, interviews: true } },
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

    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.job.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ data: job });
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
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

    const existingJob = await prisma.job.findUnique({ where: { id: params.id } });
    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (
      existingJob.hiringManagerId !== session.user.id &&
      existingJob.recruiterId !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateJobSchema.parse(body);

    const updateData: any = { ...validated };
    if (validated.closingDate !== undefined) {
      updateData.closingDate = validated.closingDate ? new Date(validated.closingDate) : null;
    }
    if (validated.status === "open" && existingJob.status !== "open") {
      updateData.publishedAt = new Date();
    }

    const job = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        hiringManager: { select: { id: true, name: true, email: true, avatar: true } },
        recruiter: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { applications: true, interviews: true } },
      },
    });

    return NextResponse.json({ data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
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

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { _count: { select: { applications: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.hiringManagerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (job._count.applications > 0) {
      await prisma.job.update({
        where: { id: params.id },
        data: { status: "archived" },
      });
      return NextResponse.json({ message: "Job archived (has existing applications)" });
    }

    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
