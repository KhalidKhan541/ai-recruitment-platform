import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const respondOfferSchema = z.object({
  response: z.enum(["ACCEPTED", "DECLINED", "NEGOTIATING"]),
  declinedReason: z.string().optional(),
  negotiationNotes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
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
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: {
          select: { id: true, title: true, vacancies: true },
        },
        jobOffer: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (!["SENT", "VIEWED", "NEGOTIATING"].includes(offer.status)) {
      return NextResponse.json(
        { error: `Cannot respond to an offer with status "${offer.status}"` },
        { status: 400 }
      );
    }

    if (offer.jobOffer?.expirationDate && new Date(offer.jobOffer.expirationDate) < new Date()) {
      await prisma.offer.update({
        where: { id: params.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This offer has expired" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = respondOfferSchema.parse(body);

    const updateData: any = {
      status: validated.response,
      respondedAt: new Date(),
    };

    if (validated.response === "DECLINED") {
      updateData.declinedReason = validated.declinedReason;
    }

    if (validated.response === "NEGOTIATING") {
      updateData.negotiationNotes = validated.negotiationNotes;
    }

    if (validated.response === "ACCEPTED") {
      updateData.signedAt = new Date();
    }

    const updatedOffer = await prisma.offer.update({
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

    if (validated.response === "ACCEPTED") {
      await prisma.jobApplication.update({
        where: { id: offer.applicationId },
        data: { status: "ACCEPTED" },
      });

      const job = await prisma.jobPosting.findUnique({
        where: { id: offer.jobId },
        select: { vacancies: true },
      });

      if (job) {
        const acceptedCount = await prisma.offer.count({
          where: { jobId: offer.jobId, status: "ACCEPTED" },
        });

        if (acceptedCount >= job.vacancies) {
          await prisma.jobPosting.update({
            where: { id: offer.jobId },
            data: { status: "CLOSED", closedAt: new Date() },
          });
        }
      }
    }

    if (validated.response === "DECLINED") {
      await prisma.jobApplication.update({
        where: { id: offer.applicationId },
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json({
      data: updatedOffer,
      message: `Offer ${validated.response.toLowerCase()} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/offers/[id]/accept error:", error);
    return NextResponse.json({ error: "Failed to process offer response" }, { status: 500 });
  }
}
