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

    if (!["admin", "recruiter", "hiring_manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { hiringManager: { select: { id: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.hiringManagerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (job.status === "open") {
      return NextResponse.json({ error: "Job is already published" }, { status: 400 });
    }

    if (job.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot publish a cancelled job. Create a new one instead." },
        { status: 400 }
      );
    }

    if (!job.description || job.description.length < 50) {
      return NextResponse.json(
        { error: "Job description must be at least 50 characters to publish" },
        { status: 400 }
      );
    }

    if (!job.requirements || (job.requirements as string[]).length === 0) {
      return NextResponse.json(
        { error: "At least one requirement is needed to publish" },
        { status: 400 }
      );
    }

    if (!job.responsibilities || (job.responsibilities as string[]).length === 0) {
      return NextResponse.json(
        { error: "At least one responsibility is needed to publish" },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        status: "open",
        publishedAt: new Date(),
      },
      include: {
        hiringManager: { select: { id: true, name: true, email: true, avatar: true } },
        recruiter: { select: { id: true, name: true, email: true, avatar: true } },
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
