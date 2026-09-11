import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createApplicationSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  coverLetter: z.string().optional(),
  source: z.string().max(100).optional(),
  referredById: z.string().uuid().optional(),
  screeningAnswers: z.record(z.any()).optional(),
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
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (session.user.companyId) {
      where.job = { companyId: session.user.companyId };
    }

    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (candidateId) where.candidateId = candidateId;

    if (search) {
      where.OR = [
        { candidate: { user: { name: { contains: search, mode: "insensitive" } } } },
        { candidate: { user: { email: { contains: search, mode: "insensitive" } } } },
        { job: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          candidate: {
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          },
          job: {
            select: { id: true, title: true, department: true, location: true, companyId: true },
          },
          _count: { select: { interviews: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
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

    const job = await prisma.jobPosting.findUnique({
      where: { id: validated.jobId },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This job is not accepting applications" },
        { status: 400 }
      );
    }

    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_candidateId: {
          jobId: validated.jobId,
          candidateId: validated.candidateId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Candidate has already applied to this job" },
        { status: 409 }
      );
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: validated.jobId,
        candidateId: validated.candidateId,
        coverLetter: validated.coverLetter,
        source: validated.source,
        referredById: validated.referredById,
        screeningAnswers: validated.screeningAnswers || {},
        status: "SUBMITTED",
      },
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        job: { select: { id: true, title: true } },
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
