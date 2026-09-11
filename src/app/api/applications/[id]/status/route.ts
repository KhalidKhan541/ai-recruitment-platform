import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const statusUpdateSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEWED",
    "OFFERED",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "SCREENING", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["SCREENING", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  SCREENING: ["SHORTLISTED", "INTERVIEW_SCHEDULED", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED", "WITHDRAWN"],
  INTERVIEW_SCHEDULED: ["INTERVIEWED", "REJECTED", "WITHDRAWN"],
  INTERVIEWED: ["OFFERED", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  OFFERED: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: [],
  REJECTED: ["SUBMITTED"],
  WITHDRAWN: ["SUBMITTED"],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: params.id },
      include: {
        candidate: {
          include: { user: { select: { name: true } } },
        },
        job: { select: { title: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = statusUpdateSchema.parse(body);

    if (application.status === validated.status) {
      return NextResponse.json(
        { error: "Application is already in this status" },
        { status: 400 }
      );
    }

    const allowed = VALID_TRANSITIONS[application.status] || [];
    if (!allowed.includes(validated.status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${application.status}" to "${validated.status}"`,
          allowedTransitions: allowed,
        },
        { status: 400 }
      );
    }

    const previousStatus = application.status;

    const updated = await prisma.jobApplication.update({
      where: { id: params.id },
      data: { status: validated.status },
    });

    if (validated.status === "REJECTED" && validated.reason) {
      await prisma.jobApplication.update({
        where: { id: params.id },
        data: { rejectedReason: validated.reason },
      });
    }

    if (validated.notes) {
      await prisma.candidateNote.create({
        data: {
          content: `[Status Change: ${previousStatus} → ${validated.status}] ${validated.notes}`,
          authorId: session.user.id,
          candidateId: application.candidateId,
        },
      });
    }

    return NextResponse.json({
      data: updated,
      message: `Application status updated to ${validated.status}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PATCH /api/applications/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
