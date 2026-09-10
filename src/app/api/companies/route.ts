import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  size: z.string().optional(),
  location: z.string().max(200).optional(),
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
    const search = searchParams.get("search") || undefined;
    const industry = searchParams.get("industry") || undefined;
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
      ];
    }

    if (industry) {
      where.industry = { contains: industry, mode: "insensitive" };
    }

    if (session.user.companyId) {
      where.id = session.user.companyId;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: { select: { users: true, jobs: true, talentPools: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create companies" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCompanySchema.parse(body);

    const existing = await prisma.company.findFirst({
      where: { name: { equals: validated.name, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A company with this name already exists" },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: validated.name,
        description: validated.description,
        website: validated.website || null,
        logo: validated.logo || null,
        industry: validated.industry,
        size: validated.size,
        location: validated.location,
      },
      include: {
        _count: { select: { users: true, jobs: true, talentPools: true } },
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { companyId: company.id },
    });

    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/companies error:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
