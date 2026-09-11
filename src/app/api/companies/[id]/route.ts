import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  industry: z.string().max(100).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  logoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        users: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          orderBy: { name: "asc" },
        },
        jobPostings: {
          select: {
            id: true, title: true, department: true, status: true,
            vacancies: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        documents: { orderBy: { createdAt: "desc" } },
        _count: {
          select: { users: true, jobPostings: true, candidates: true, recruiters: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ data: company });
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
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

    const company = await prisma.company.findUnique({ where: { id: params.id } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (session.user.companyId !== params.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateCompanySchema.parse(body);

    if (validated.name) {
      const slug = validated.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existing = await prisma.company.findFirst({
        where: {
          slug,
          id: { not: params.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "A company with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: any = { ...validated };
    if (validated.website === "") updateData.website = null;
    if (validated.logoUrl === "") updateData.logoUrl = null;

    const updated = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { users: true, jobPostings: true, candidates: true, recruiters: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete companies" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: { _count: { select: { users: true, jobPostings: true } } },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company._count.users > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with active users. Remove all users first." },
        { status: 400 }
      );
    }

    await prisma.company.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Company deleted" });
  } catch (error) {
    console.error("DELETE /api/companies/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
