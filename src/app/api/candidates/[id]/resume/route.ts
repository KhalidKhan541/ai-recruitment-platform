import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const uploadResumeSchema = z.object({
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().min(1),
  mimeType: z.string(),
  isDefault: z.boolean().default(false),
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
        resumes: {
          orderBy: { createdAt: "desc" },
          include: {
            resumes: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        candidateId: candidate.id,
        candidateName: candidate.user.name,
        resumes: candidate.resumes,
      },
    });
  } catch (error) {
    console.error("GET /api/candidates/[id]/resume error:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
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
    const validated = uploadResumeSchema.parse(body);

    const validExtensions = [".pdf", ".doc", ".docx", ".txt"];
    const ext = validated.fileName.split(".").pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(`.${ext}`)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, TXT" },
        { status: 400 }
      );
    }

    if (validated.fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    if (validated.isDefault) {
      await prisma.candidateResume.updateMany({
        where: { candidateId: params.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const resume = await prisma.candidateResume.create({
      data: {
        candidateId: params.id,
        title: validated.title,
        fileUrl: validated.fileUrl,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        isDefault: validated.isDefault,
        status: "UPLOADING",
      },
    });

    return NextResponse.json({ data: resume }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/candidates/[id]/resume error:", error);
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
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

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
    }

    const resume = await prisma.candidateResume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.candidateId !== params.id) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    await prisma.candidateResume.delete({ where: { id: resumeId } });

    return NextResponse.json({ message: "Resume deleted" });
  } catch (error) {
    console.error("DELETE /api/candidates/[id]/resume error:", error);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
