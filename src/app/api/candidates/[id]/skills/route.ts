import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const skillSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"]).default("INTERMEDIATE"),
  yearsOfExperience: z.number().min(0).max(50).optional(),
});

const addSkillsSchema = z.object({
  skills: z.array(skillSchema).min(1, "At least one skill is required"),
});

const updateSkillSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"]),
  yearsOfExperience: z.number().min(0).max(50).optional(),
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

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        user: { select: { name: true } },
        skills: { orderBy: { name: "asc" } },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const skills = candidate.skills;

    const skillStats = {
      total: skills.length,
      byLevel: {
        BEGINNER: skills.filter((s) => s.level === "BEGINNER").length,
        INTERMEDIATE: skills.filter((s) => s.level === "INTERMEDIATE").length,
        ADVANCED: skills.filter((s) => s.level === "ADVANCED").length,
        EXPERT: skills.filter((s) => s.level === "EXPERT").length,
        MASTER: skills.filter((s) => s.level === "MASTER").length,
      },
      verified: skills.filter((s) => s.isVerified).length,
      totalEndorsements: skills.reduce((sum, s) => sum + s.endorsements, 0),
    };

    return NextResponse.json({
      data: {
        candidateId: candidate.id,
        candidateName: candidate.user.name,
        skills,
        stats: skillStats,
      },
    });
  } catch (error) {
    console.error("GET /api/candidates/[id]/skills error:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = addSkillsSchema.parse(body);

    const existingSkills = await prisma.candidateSkill.findMany({
      where: { candidateId: params.id },
    });

    const existingNames = new Set(
      existingSkills.map((s) => s.name.toLowerCase())
    );

    const newSkillsData = validated.skills.filter(
      (s) => !existingNames.has(s.name.toLowerCase())
    );

    if (newSkillsData.length === 0) {
      return NextResponse.json(
        { error: "All provided skills already exist for this candidate" },
        { status: 400 }
      );
    }

    const created = await prisma.candidateSkill.createMany({
      data: newSkillsData.map((s) => ({
        candidateId: params.id,
        name: s.name,
        level: s.level,
        yearsOfExperience: s.yearsOfExperience,
      })),
    });

    const allSkills = await prisma.candidateSkill.findMany({
      where: { candidateId: params.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data: allSkills,
      added: created.count,
      skipped: validated.skills.length - created.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/candidates/[id]/skills error:", error);
    return NextResponse.json({ error: "Failed to add skills" }, { status: 500 });
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

    const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = z.array(updateSkillSchema).parse(body);

    const updates = await Promise.all(
      validated.map(async (skill) => {
        if (skill.id) {
          return prisma.candidateSkill.update({
            where: { id: skill.id },
            data: {
              name: skill.name,
              level: skill.level,
              yearsOfExperience: skill.yearsOfExperience,
            },
          });
        }

        const existing = await prisma.candidateSkill.findFirst({
          where: {
            candidateId: params.id,
            name: { equals: skill.name, mode: "insensitive" },
          },
        });

        if (existing) {
          return prisma.candidateSkill.update({
            where: { id: existing.id },
            data: {
              level: skill.level,
              yearsOfExperience: skill.yearsOfExperience,
            },
          });
        }

        return prisma.candidateSkill.create({
          data: {
            candidateId: params.id,
            name: skill.name,
            level: skill.level,
            yearsOfExperience: skill.yearsOfExperience,
          },
        });
      })
    );

    return NextResponse.json({ data: updates });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/candidates/[id]/skills error:", error);
    return NextResponse.json({ error: "Failed to update skills" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = await request.json();
    const { skillIds } = body;

    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return NextResponse.json(
        { error: "skillIds array is required" },
        { status: 400 }
      );
    }

    const result = await prisma.candidateSkill.deleteMany({
      where: {
        id: { in: skillIds },
        candidateId: params.id,
      },
    });

    return NextResponse.json({
      message: `Removed ${result.count} skill(s)`,
      removed: result.count,
    });
  } catch (error) {
    console.error("DELETE /api/candidates/[id]/skills error:", error);
    return NextResponse.json({ error: "Failed to remove skills" }, { status: 500 });
  }
}
