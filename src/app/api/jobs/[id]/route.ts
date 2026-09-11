import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(50).optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  department: z.string().max(100).optional(),
  location: z.string().min(1).max(200).optional(),
  isRemote: z.boolean().optional(),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "internship", "temporary", "remote", "freelance"])
    .optional(),
  experienceLevel: z
    .enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"])
    .optional(),
  educationLevel: z
    .enum(["HIGH_SCHOOL", "ASSOCIATE", "BACHELOR", "MASTER", "DOCTORATE", "NONE"])
    .optional(),
  salaryMin: z.number().min(0).optional().nullable(),
  salaryMax: z.number().min(0).optional().nullable(),
  salaryCurrency: z.string().optional(),
  vacancies: z.number().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "ARCHIVED"]).optional(),
  applicationDeadline: z.string().datetime().optional().nullable(),
  screeningQuestions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
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

    const job = await prisma.jobPosting.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, website: true } },
        applications: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        interviews: {
          select: { id: true, status: true, scheduledAt: true },
          orderBy: { scheduledAt: "desc" },
          take: 10,
        },
        _count: { select: { applications: true, interviews: true, offers: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

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

    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: params.id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (existingJob.companyId !== session.user.companyId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateJobSchema.parse(body);

    const updateData: any = { ...validated };
    if (validated.applicationDeadline !== undefined) {
      updateData.applicationDeadline = validated.applicationDeadline
        ? new Date(validated.applicationDeadline)
        : null;
    }

    if (validated.status === "PUBLISHED" && existingJob.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    if (validated.status === "CLOSED" && existingJob.status !== "CLOSED") {
      updateData.closedAt = new Date();
    }

    const job = await prisma.jobPosting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
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

    const job = await prisma.jobPosting.findUnique({
      where: { id: params.id },
      include: { _count: { select: { applications: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.companyId !== session.user.companyId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (job._count.applications > 0) {
      await prisma.jobPosting.update({
        where: { id: params.id },
        data: { status: "ARCHIVED" },
      });
      return NextResponse.json({ message: "Job archived (has existing applications)" });
    }

    await prisma.jobPosting.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
