import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const statusUpdateSchema = z.object({
  status: z.enum([
    "submitted", "screening", "review", "phone_interview",
    "technical_interview", "final_interview", "offer_pending",
    "offer_extended", "offer_accepted", "offer_declined",
    "hired", "rejected", "withdrawn",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ["screening", "review", "rejected", "withdrawn"],
  screening: ["review", "phone_interview", "rejected", "withdrawn"],
  review: ["phone_interview", "technical_interview", "rejected", "withdrawn"],
  phone_interview: ["technical_interview", "final_interview", "rejected", "withdrawn"],
  technical_interview: ["final_interview", "offer_pending", "rejected", "withdrawn"],
  final_interview: ["offer_pending", "rejected", "withdrawn"],
  offer_pending: ["offer_extended", "rejected", "withdrawn"],
  offer_extended: ["offer_accepted", "offer_declined", "withdrawn"],
  offer_accepted: ["hired"],
  offer_declined: ["submitted", "withdrawn"],
  hired: [],
  rejected: ["submitted"],
  withdrawn: ["submitted"],
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

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        candidate: { select: { name: true } },
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

    const [updated] = await prisma.$transaction([
      prisma.application.update({
        where: { id: params.id },
        data: { status: validated.status },
      }),
      prisma.timelineEvent.create({
        data: {
          type: "status_change",
          title: `Status changed from ${previousStatus} to ${validated.status}`,
          description: validated.reason || validated.notes || undefined,
          metadata: {
            previousStatus,
            newStatus: validated.status,
            changedBy: session.user.id,
            reason: validated.reason,
          },
          applicationId: params.id,
        },
      }),
    ]);

    if (validated.notes) {
      await prisma.applicationNote.create({
        data: {
          content: validated.notes,
          type: "general",
          applicationId: params.id,
          authorId: session.user.id,
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
