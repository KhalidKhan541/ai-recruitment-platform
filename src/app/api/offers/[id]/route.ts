import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateOfferSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "VIEWED", "ACCEPTED", "DECLINED", "EXPIRED", "NEGOTIATING", "WITHDRAWN"]).optional(),
  negotiationNotes: z.string().optional().nullable(),
  declinedReason: z.string().optional().nullable(),
  jobOffer: z
    .object({
      salary: z.number().min(0).optional(),
      salaryCurrency: z.string().optional(),
      salaryFrequency: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).optional(),
      equityPercentage: z.number().min(0).max(100).optional(),
      signingBonus: z.number().min(0).optional(),
      relocationBonus: z.number().min(0).optional(),
      benefits: z.array(z.string()).optional(),
      terms: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
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

    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
          },
        },
        jobPosting: {
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
          },
        },
        application: {
          select: { id: true, status: true },
        },
        jobOffer: true,
        documents: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ data: offer });
  } catch (error) {
    console.error("GET /api/offers/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
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

    const existing = await prisma.offer.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (["ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"].includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot update a ${existing.status.toLowerCase()} offer` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateOfferSchema.parse(body);

    const updateData: any = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.negotiationNotes !== undefined) updateData.negotiationNotes = validated.negotiationNotes;
    if (validated.declinedReason !== undefined) updateData.declinedReason = validated.declinedReason;

    if (validated.status === "SENT" && existing.status !== "SENT") {
      updateData.sentAt = new Date();
    }

    if (validated.status === "VIEWED" && existing.status !== "VIEWED") {
      updateData.viewedAt = new Date();
    }

    if (validated.status === "ACCEPTED") {
      updateData.respondedAt = new Date();
      updateData.signedAt = new Date();
    }

    if (validated.status === "DECLINED") {
      updateData.respondedAt = new Date();
    }

    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: { select: { id: true, title: true } },
        jobOffer: true,
      },
    });

    if (validated.jobOffer && existing.jobOfferId) {
      await prisma.jobOffer.update({
        where: { id: existing.jobOfferId },
        data: validated.jobOffer,
      });
    }

    return NextResponse.json({ data: offer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/offers/[id] error:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
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

    const offer = await prisma.offer.findUnique({ where: { id: params.id } });
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Cannot withdraw an accepted offer" },
        { status: 400 }
      );
    }

    if (offer.status === "SENT" || offer.status === "NEGOTIATING") {
      await prisma.offer.update({
        where: { id: params.id },
        data: { status: "WITHDRAWN" },
      });
      return NextResponse.json({ message: "Offer withdrawn" });
    }

    await prisma.offer.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Offer deleted" });
  } catch (error) {
    console.error("DELETE /api/offers/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
