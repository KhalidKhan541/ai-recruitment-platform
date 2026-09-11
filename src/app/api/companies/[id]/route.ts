import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  size: z.string().optional(),
  location: z.string().max(200).optional(),
});

async function getCompanyWithRelations(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, avatar: true },
        orderBy: { name: "asc" },
      },
      jobs: {
        select: {
          id: true, title: true, department: true, status: true,
          applicationCount: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      talentPools: {
        select: { id: true, name: true, description: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { users: true, jobs: true, talentPools: true } },
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

    const company = await getCompanyWithRelations(params.id);
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

    if (session.user.companyId !== params.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateCompanySchema.parse(body);

    if (validated.name) {
      const existing = await prisma.company.findFirst({
        where: {
          name: { equals: validated.name, mode: "insensitive" },
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
    if (validated.logo === "") updateData.logo = null;

    const updated = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: { select: { users: true, jobs: true, talentPools: true } },
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

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can delete companies" }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { users: true, jobs: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company._count.users > 1) {
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
