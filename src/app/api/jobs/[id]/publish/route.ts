import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.companyId !== session.user.companyId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (job.status === "PUBLISHED") {
      return NextResponse.json({ error: "Job is already published" }, { status: 400 });
    }

    if (job.status === "CLOSED" || job.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "Cannot publish a closed or archived job" },
        { status: 400 }
      );
    }

    if (!job.description || job.description.length < 50) {
      return NextResponse.json(
        { error: "Job description must be at least 50 characters to publish" },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.jobPosting.update({
      where: { id: params.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { applications: true, interviews: true } },
      },
    });

    return NextResponse.json({
      data: updatedJob,
      message: "Job published successfully",
    });
  } catch (error) {
    console.error("POST /api/jobs/[id]/publish error:", error);
    return NextResponse.json({ error: "Failed to publish job" }, { status: 500 });
  }
}
