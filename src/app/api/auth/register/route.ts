import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  role: z
    .enum(["ADMIN", "RECRUITER", "HIRING_MANAGER", "CANDIDATE"])
    .default("RECRUITER"),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    let companyId: string | undefined;

    if (validatedData.companyName) {
      const existingCompany = await prisma.company.findFirst({
        where: {
          name: { equals: validatedData.companyName, mode: "insensitive" },
        },
      });

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const slug = validatedData.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const newCompany = await prisma.company.create({
          data: {
            name: validatedData.companyName,
            slug,
          },
        });
        companyId = newCompany.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (validatedData.role === "CANDIDATE") {
      await prisma.candidate.create({
        data: {
          userId: user.id,
          companyId: companyId || null,
        },
      });
    }

    if (
      validatedData.role === "RECRUITER" ||
      validatedData.role === "HIRING_MANAGER"
    ) {
      await prisma.recruiter.create({
        data: {
          userId: user.id,
          companyId: companyId || null,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
