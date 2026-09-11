import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
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
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

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

    if (session.user.role !== "ADMIN" && session.user.companyId) {
      where.id = session.user.companyId;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: {
            select: { users: true, jobPostings: true, candidates: true, recruiters: true },
          },
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

    if (!["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Only admins can create companies" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCompanySchema.parse(body);

    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A company with this name already exists" },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        website: validated.website || null,
        industry: validated.industry,
        size: validated.size,
        logoUrl: validated.logoUrl || null,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        country: validated.country,
        zipCode: validated.zipCode,
        phone: validated.phone,
        email: validated.email,
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: { users: true, jobPostings: true, candidates: true, recruiters: true },
        },
      },
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
