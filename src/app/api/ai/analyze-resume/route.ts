import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const analyzeResumeSchema = z.object({
  candidateId: z.string().uuid().optional(),
  resumeId: z.string().uuid().optional(),
  resumeText: z.string().optional(),
  jobDescription: z.string().optional(),
  jobId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = analyzeResumeSchema.parse(body);

    let resumeText = validated.resumeText;
    let candidateInfo: any = null;
    let jobRequirements: any = null;

    if (validated.resumeId) {
      const candidateResume = await prisma.candidateResume.findUnique({
        where: { id: validated.resumeId },
        include: {
          resumes: { orderBy: { createdAt: "desc" }, take: 1 },
          candidate: {
            include: {
              user: { select: { name: true, email: true } },
              skills: true,
              experiences: true,
              educations: true,
            },
          },
        },
      });

      if (!candidateResume) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }

      const latestParse = candidateResume.resumes[0];
      if (latestParse?.rawText) {
        resumeText = latestParse.rawText;
      }

      candidateInfo = {
        name: candidateResume.candidate.user.name,
        email: candidateResume.candidate.user.email,
        skills: candidateResume.candidate.skills.map((s) => ({
          name: s.name,
          level: s.level,
          years: s.yearsOfExperience,
        })),
        experience: candidateResume.candidate.experiences,
        education: candidateResume.candidate.educations,
      };
    }

    if (validated.candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: validated.candidateId },
        include: {
          user: { select: { name: true, email: true } },
          skills: true,
          experiences: true,
          educations: true,
          resumes: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              resumes: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      });

      if (!candidate) {
        return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
      }

      candidateInfo = {
        name: candidate.user.name,
        email: candidate.user.email,
        skills: candidate.skills.map((s) => ({
          name: s.name,
          level: s.level,
          years: s.yearsOfExperience,
        })),
        experience: candidate.experiences,
        education: candidate.educations,
      };

      const latestResume = candidate.resumes[0]?.resumes[0];
      if (latestResume?.rawText) {
        resumeText = latestResume.rawText;
      }
    }

    if (validated.jobId) {
      const job = await prisma.jobPosting.findUnique({
        where: { id: validated.jobId },
      });
      if (job) {
        jobRequirements = {
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          experienceLevel: job.experienceLevel,
          educationLevel: job.educationLevel,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
        };
      }
    }

    const analysis = {
      resumeText: resumeText ? resumeText.substring(0, 5000) : null,
      candidateInfo,
      jobRequirements,
      aiAnalysis: {
        summary: "Resume analysis requires OpenAI API integration. Connect your API key to enable AI-powered analysis.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        matchScore: null,
        skillsMatch: [],
        experienceMatch: null,
        educationMatch: null,
      },
      status: "pending_ai_integration",
      analyzedAt: new Date().toISOString(),
      analyzedBy: session.user.id,
    };

    if (validated.candidateId) {
      await prisma.candidateResume.updateMany({
        where: { candidateId: validated.candidateId },
        data: { status: "PARSED", parsedAt: new Date() },
      });
    }

    return NextResponse.json({
      data: analysis,
      message: "Resume analysis queued. AI analysis will be available once OpenAI is configured.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/ai/analyze-resume error:", error);
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}
