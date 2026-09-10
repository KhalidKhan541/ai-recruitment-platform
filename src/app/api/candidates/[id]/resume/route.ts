import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
      select: { id: true, name: true, email: true, resume: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    if (!candidate.resume) {
      return NextResponse.json({ error: "No resume uploaded for this candidate" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        candidateId: candidate.id,
        candidateName: candidate.name,
        resumeUrl: candidate.resume,
      },
    });
  } catch (error) {
    console.error("GET /api/candidates/[id]/resume error:", error);
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
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
    const { resumeUrl, resumeText } = body;

    if (!resumeUrl && !resumeText) {
      return NextResponse.json(
        { error: "Either resumeUrl or resumeText is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (resumeUrl) {
      const validExtensions = [".pdf", ".doc", ".docx", ".txt"];
      const url = new URL(resumeUrl);
      const ext = url.pathname.split(".").pop()?.toLowerCase();

      if (!ext || !validExtensions.includes(`.${ext}`)) {
        return NextResponse.json(
          { error: "Invalid file type. Allowed: PDF, DOC, DOCX, TXT" },
          { status: 400 }
        );
      }
      updateData.resume = resumeUrl;
    }

    if (resumeText) {
      updateData.resume = resumeText;
      updateData.metadata = {
        ...(candidate.metadata as any || {}),
        resumeText,
        resumeUploadedAt: new Date().toISOString(),
      };
    }

    const updated = await prisma.candidate.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, resume: true },
    });

    return NextResponse.json({
      data: updated,
      message: "Resume updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/candidates/[id]/resume error:", error);
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
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

    const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.candidate.update({
      where: { id: params.id },
      data: { resume: null },
    });

    return NextResponse.json({ message: "Resume removed" });
  } catch (error) {
    console.error("DELETE /api/candidates/[id]/resume error:", error);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
