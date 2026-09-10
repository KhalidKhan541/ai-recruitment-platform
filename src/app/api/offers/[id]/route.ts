import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateOfferSchema = z.object({
  salary: z
    .object({
      amount: z.number().min(0),
      currency: z.string().default("USD"),
      period: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).default("yearly"),
      bonus: z.number().optional(),
      equity: z.string().optional(),
    })
    .optional(),
  startDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  signingBonus: z.number().optional(),
  relocationAssistance: z.number().optional(),
  ptoDays: z.number().optional(),
});

async function getOfferWithRelations(id: string) {
  return prisma.offer.findUnique({
    where: { id },
    include: {
      candidate: {
        select: {
          id: true, name: true, email: true, avatar: true,
          title: true, location: true, phone: true,
        },
      },
      application: {
        include: {
          job: {
            select: {
              id: true, title: true, department: true, location: true,
              salary: true, benefits: true,
              hiringManager: { select: { id: true, name: true, email: true } },
              recruiter: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      createdBy: { select: { id: true, name: true, email: true } },
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

    const offer = await getOfferWithRelations(params.id);
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

    if (existing.status === "accepted" || existing.status === "declined" || existing.status === "withdrawn") {
      return NextResponse.json(
        { error: `Cannot update a ${existing.status} offer` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateOfferSchema.parse(body);

    const updateData: any = { ...validated };
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.expirationDate) updateData.expirationDate = new Date(validated.expirationDate);

    if (validated.salary || validated.benefits || validated.signingBonus !== undefined) {
      const currentMetadata = (existing.metadata as any) || {};
      updateData.metadata = {
        ...currentMetadata,
        ...(validated.benefits && { benefits: validated.benefits }),
        ...(validated.signingBonus !== undefined && { signingBonus: validated.signingBonus }),
        ...(validated.relocationAssistance !== undefined && { relocationAssistance: validated.relocationAssistance }),
        ...(validated.ptoDays !== undefined && { ptoDays: validated.ptoDays }),
      };
    }

    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        application: { include: { job: { select: { id: true, title: true } } } },
      },
    });

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

    if (offer.status === "accepted") {
      return NextResponse.json(
        { error: "Cannot withdraw an accepted offer" },
        { status: 400 }
      );
    }

    if (offer.status === "sent" || offer.status === "negotiating") {
      await prisma.offer.update({
        where: { id: params.id },
        data: { status: "withdrawn" },
      });

      await prisma.timelineEvent.create({
        data: {
          type: "offer_sent",
          title: "Offer withdrawn",
          description: `Offer withdrawn by ${session.user.name || "Recruiter"}`,
          metadata: { offerId: params.id, withdrawnBy: session.user.id },
          applicationId: offer.applicationId,
        },
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
