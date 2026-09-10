import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createOfferSchema = z.object({
  applicationId: z.string().min(1),
  candidateId: z.string().min(1),
  salary: z.object({
    amount: z.number().min(0),
    currency: z.string().default("USD"),
    period: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).default("yearly"),
    bonus: z.number().optional(),
    equity: z.string().optional(),
  }),
  startDate: z.string().datetime(),
  expirationDate: z.string().datetime(),
  terms: z.string().min(10, "Please provide terms and conditions"),
  notes: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  signingBonus: z.number().optional(),
  relocationAssistance: z.number().optional(),
  ptoDays: z.number().optional(),
  metadata: z.record(z.any()).optional(),
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
    const candidateId = searchParams.get("candidateId") || undefined;
    const applicationId = searchParams.get("applicationId") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;
    if (applicationId) where.applicationId = applicationId;

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          candidate: { select: { id: true, name: true, email: true, avatar: true, title: true } },
          application: {
            include: {
              job: { select: { id: true, title: true, department: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    return NextResponse.json({
      data: offers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/offers error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "recruiter", "hiring_manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createOfferSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id: validated.applicationId },
      include: {
        job: { select: { id: true, title: true } },
        offers: { where: { status: { in: ["draft", "pending_approval", "sent", "negotiating"] } } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.offers.length > 0) {
      return NextResponse.json(
        { error: "An active offer already exists for this application" },
        { status: 409 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: validated.candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const offer = await prisma.offer.create({
      data: {
        applicationId: validated.applicationId,
        candidateId: validated.candidateId,
        createdById: session.user.id,
        salary: validated.salary,
        startDate: new Date(validated.startDate),
        expirationDate: new Date(validated.expirationDate),
        terms: validated.terms,
        notes: validated.notes,
        status: "draft",
        metadata: {
          benefits: validated.benefits,
          signingBonus: validated.signingBonus,
          relocationAssistance: validated.relocationAssistance,
          ptoDays: validated.ptoDays,
          ...validated.metadata,
        },
      },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        application: { include: { job: { select: { id: true, title: true } } } },
      },
    });

    await prisma.application.update({
      where: { id: validated.applicationId },
      data: { status: "offer_pending" },
    });

    await prisma.timelineEvent.create({
      data: {
        type: "offer_sent",
        title: "Offer letter created",
        description: `Offer for ${candidate.name} - ${(validated.salary as any).amount} ${(validated.salary as any).currency}/${(validated.salary as any).period}`,
        metadata: { offerId: offer.id, salary: validated.salary },
        applicationId: validated.applicationId,
      },
    });

    return NextResponse.json({ data: offer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/offers error:", error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
