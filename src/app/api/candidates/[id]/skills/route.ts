import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const skillSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  endorsed: z.boolean().optional(),
});

const addSkillsSchema = z.object({
  skills: z.array(skillSchema).min(1, "At least one skill is required"),
});

const updateSkillSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  endorsed: z.boolean().optional(),
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
      select: { id: true, name: true, skills: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const skills = (candidate.skills as any[]) || [];

    const skillStats = {
      total: skills.length,
      byLevel: {
        beginner: skills.filter((s) => s.level === "beginner").length,
        intermediate: skills.filter((s) => s.level === "intermediate").length,
        advanced: skills.filter((s) => s.level === "advanced").length,
        expert: skills.filter((s) => s.level === "expert").length,
      },
      endorsed: skills.filter((s) => s.endorsed).length,
    };

    return NextResponse.json({
      data: {
        candidateId: candidate.id,
        candidateName: candidate.name,
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

    const currentSkills = (candidate.skills as any[]) || [];
    const existingNames = new Set(currentSkills.map((s: any) => s.name.toLowerCase()));

    const newSkills = validated.skills.filter(
      (s) => !existingNames.has(s.name.toLowerCase())
    );

    if (newSkills.length === 0) {
      return NextResponse.json(
        { error: "All provided skills already exist for this candidate" },
        { status: 400 }
      );
    }

    const updatedSkills = [...currentSkills, ...newSkills];

    const updated = await prisma.candidate.update({
      where: { id: params.id },
      data: { skills: updatedSkills },
      select: { id: true, skills: true },
    });

    return NextResponse.json({
      data: updated.skills,
      added: newSkills.length,
      skipped: validated.skills.length - newSkills.length,
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

    const currentSkills = (candidate.skills as any[]) || [];
    const updatedSkills = currentSkills.map((existing: any) => {
      const update = validated.find(
        (s) => s.name.toLowerCase() === existing.name.toLowerCase()
      );
      return update ? { ...existing, ...update } : existing;
    });

    const newSkillsNotInList = validated.filter(
      (s) => !currentSkills.some((e: any) => e.name.toLowerCase() === s.name.toLowerCase())
    );

    const finalSkills = [...updatedSkills, ...newSkillsNotInList];

    const updated = await prisma.candidate.update({
      where: { id: params.id },
      data: { skills: finalSkills },
      select: { id: true, skills: true },
    });

    return NextResponse.json({ data: updated.skills });
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
    const { skillNames } = body;

    if (!Array.isArray(skillNames) || skillNames.length === 0) {
      return NextResponse.json(
        { error: "skillNames array is required" },
        { status: 400 }
      );
    }

    const namesToRemove = new Set(skillNames.map((n: string) => n.toLowerCase()));
    const currentSkills = (candidate.skills as any[]) || [];
    const updatedSkills = currentSkills.filter(
      (s: any) => !namesToRemove.has(s.name.toLowerCase())
    );

    const removed = currentSkills.length - updatedSkills.length;

    await prisma.candidate.update({
      where: { id: params.id },
      data: { skills: updatedSkills },
    });

    return NextResponse.json({
      message: `Removed ${removed} skill(s)`,
      removed,
    });
  } catch (error) {
    console.error("DELETE /api/candidates/[id]/skills error:", error);
    return NextResponse.json({ error: "Failed to remove skills" }, { status: 500 });
  }
}
