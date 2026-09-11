import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createOfferSchema = z.object({
  applicationId: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobOffer: z.object({
    title: z.string().min(1).max(200),
    salary: z.number().min(0),
    salaryCurrency: z.string().default("USD"),
    salaryFrequency: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).default("yearly"),
    equityPercentage: z.number().min(0).max(100).optional(),
    signingBonus: z.number().min(0).optional(),
    relocationBonus: z.number().min(0).optional(),
    startDate: z.string().datetime(),
    expirationDate: z.string().datetime(),
    employmentType: z.string(),
    workLocation: z.string(),
    workArrangement: z.enum(["remote", "hybrid", "onsite"]).default("hybrid"),
    benefits: z.array(z.string()).optional(),
    terms: z.string().optional(),
    notes: z.string().optional(),
  }),
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
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;

    if (session.user.companyId) {
      where.job = { companyId: session.user.companyId };
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          candidate: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          jobPosting: {
            select: { id: true, title: true, department: true, location: true },
          },
          application: {
            select: { id: true, status: true },
          },
          jobOffer: true,
          documents: true,
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

    if (!["ADMIN", "RECRUITER", "HIRING_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createOfferSchema.parse(body);

    const application = await prisma.jobApplication.findUnique({
      where: { id: validated.applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.candidateId !== validated.candidateId) {
      return NextResponse.json(
        { error: "Candidate does not match application" },
        { status: 400 }
      );
    }

    const existingActiveOffer = await prisma.offer.findFirst({
      where: {
        candidateId: validated.candidateId,
        jobId: application.jobId,
        status: { in: ["DRAFT", "PENDING_APPROVAL", "SENT", "NEGOTIATING"] },
      },
    });

    if (existingActiveOffer) {
      return NextResponse.json(
        { error: "An active offer already exists for this candidate" },
        { status: 409 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        jobId: application.jobId,
        candidateId: validated.candidateId,
        approvedById: session.user.id,
        status: "DRAFT",
        jobOffer: {
          create: {
            title: validated.jobOffer.title,
            salary: validated.jobOffer.salary,
            salaryCurrency: validated.jobOffer.salaryCurrency,
            salaryFrequency: validated.jobOffer.salaryFrequency,
            equityPercentage: validated.jobOffer.equityPercentage,
            signingBonus: validated.jobOffer.signingBonus,
            relocationBonus: validated.jobOffer.relocationBonus,
            startDate: new Date(validated.jobOffer.startDate),
            expirationDate: new Date(validated.jobOffer.expirationDate),
            employmentType: validated.jobOffer.employmentType,
            workLocation: validated.jobOffer.workLocation,
            workArrangement: validated.jobOffer.workArrangement,
            benefits: validated.jobOffer.benefits || [],
            terms: validated.jobOffer.terms,
            notes: validated.jobOffer.notes,
          },
        },
      },
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        jobPosting: { select: { id: true, title: true } },
        jobOffer: true,
      },
    });

    await prisma.jobApplication.update({
      where: { id: validated.applicationId },
      data: { status: "OFFERED" },
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
