import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const acceptOfferSchema = z.object({
  response: z.enum(["accepted", "declined", "counter_offer"]),
  counterOffer: z
    .object({
      amount: z.number().min(0),
      reason: z.string().min(1),
    })
    .optional(),
  notes: z.string().optional(),
  startDate: z.string().datetime().optional(),
  signedAt: z.string().datetime().optional(),
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
        candidate: { select: { id: true, name: true, email: true } },
        application: {
          include: {
            job: { select: { id: true, title: true } },
            _count: { select: { offers: true } },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.status !== "sent" && offer.status !== "negotiating") {
      return NextResponse.json(
        { error: `Cannot respond to an offer with status "${offer.status}"` },
        { status: 400 }
      );
    }

    if (offer.expirationDate && new Date(offer.expirationDate) < new Date()) {
      await prisma.offer.update({
        where: { id: params.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "This offer has expired" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = acceptOfferSchema.parse(body);

    if (validated.response === "counter_offer" && !validated.counterOffer) {
      return NextResponse.json(
        { error: "Counter offer details are required" },
        { status: 400 }
      );
    }

    let newStatus: string;
    let updateData: any = {};

    switch (validated.response) {
      case "accepted":
        newStatus = "accepted";
        updateData = {
          status: newStatus,
          metadata: {
            ...((offer.metadata as any) || {}),
            acceptedAt: validated.signedAt || new Date().toISOString(),
            acceptedBy: session.user.id,
            notes: validated.notes,
          },
        };
        break;
      case "declined":
        newStatus = "declined";
        updateData = {
          status: newStatus,
          metadata: {
            ...((offer.metadata as any) || {}),
            declinedAt: new Date().toISOString(),
            declinedBy: session.user.id,
            notes: validated.notes,
          },
        };
        break;
      case "counter_offer":
        newStatus = "negotiating";
        updateData = {
          status: newStatus,
          salary: {
            ...((offer.salary as any) || {}),
            amount: validated.counterOffer!.amount,
          },
          metadata: {
            ...((offer.metadata as any) || {}),
            counterOffers: [
              ...(((offer.metadata as any)?.counterOffers) || []),
              {
                amount: validated.counterOffer!.amount,
                reason: validated.counterOffer!.reason,
                offeredAt: new Date().toISOString(),
                offeredBy: session.user.id,
              },
            ],
          },
        };
        break;
    }

    const [updatedOffer] = await prisma.$transaction([
      prisma.offer.update({
        where: { id: params.id },
        data: updateData,
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          application: { include: { job: { select: { id: true, title: true } } } },
        },
      }),
      prisma.timelineEvent.create({
        data: {
          type: "offer_sent",
          title: `Offer ${validated.response.replace(/_/g, " ")}`,
          description:
            validated.response === "counter_offer"
              ? `Counter offer of ${validated.counterOffer!.amount} submitted`
              : `Offer ${validated.response} by ${offer.candidate.name}`,
          metadata: {
            offerId: params.id,
            response: validated.response,
            counterOffer: validated.counterOffer,
          },
          applicationId: offer.applicationId,
        },
      }),
    ]);

    if (validated.response === "accepted") {
      await prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: "offer_accepted" },
      });

      await prisma.candidate.update({
        where: { id: offer.candidateId },
        data: { status: "hired" },
      });

      const job = await prisma.job.findUnique({ where: { id: offer.application.job.id } });
      if (job) {
        await prisma.job.update({
          where: { id: offer.application.job.id },
          data: {
            filledCount: { increment: 1 },
            ...(job.headcount <= job.filledCount + 1 ? { status: "closed", filledAt: new Date() } : {}),
          },
        });
      }
    } else if (validated.response === "declined") {
      await prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: "offer_declined" },
      });
    }

    return NextResponse.json({
      data: updatedOffer,
      message: `Offer ${validated.response.replace(/_/g, " ")} successfully`,
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
