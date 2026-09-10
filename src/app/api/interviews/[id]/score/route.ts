import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const scoreSchema = z.object({
  overallScore: z.number().min(1).max(10),
  technicalScore: z.number().min(1).max(10).optional(),
  communicationScore: z.number().min(1).max(10).optional(),
  cultureFitScore: z.number().min(1).max(10).optional(),
  problemSolvingScore: z.number().min(1).max(10).optional(),
  leadershipScore: z.number().min(1).max(10).optional(),
  recommendation: z.enum(["strongly_recommend", "recommend", "neutral", "not_recommend", "strongly_not_recommend"]),
  strengths: z.array(z.string()).min(1, "At least one strength is required"),
  concerns: z.array(z.string()).default([]),
  notes: z.string().min(10, "Please provide detailed feedback"),
  followUpQuestions: z.array(z.string()).optional(),
  nextSteps: z.string().optional(),
  wouldWorkWithAgain: z.boolean().optional(),
  hireConfidence: z.number().min(1).max(10).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        application: {
          include: {
            job: { select: { id: true, title: true } },
            _count: { select: { interviews: true } },
          },
        },
        interviewer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.interviewerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only the interviewer can submit scores" }, { status: 403 });
    }

    if (interview.status === "completed") {
      return NextResponse.json(
        { error: "Interview feedback has already been submitted" },
        { status: 400 }
      );
    }

    if (interview.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot score a cancelled interview" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = scoreSchema.parse(body);

    const scoreBreakdown = {
      overall: validated.overallScore,
      technical: validated.technicalScore,
      communication: validated.communicationScore,
      cultureFit: validated.cultureFitScore,
      problemSolving: validated.problemSolvingScore,
      leadership: validated.leadershipScore,
      recommendation: validated.recommendation,
      strengths: validated.strengths,
      concerns: validated.concerns,
      followUpQuestions: validated.followUpQuestions,
      nextSteps: validated.nextSteps,
      wouldWorkWithAgain: validated.wouldWorkWithAgain,
      hireConfidence: validated.hireConfidence,
    };

    const [updatedInterview] = await prisma.$transaction([
      prisma.interview.update({
        where: { id: params.id },
        data: {
          status: "completed",
          score: scoreBreakdown,
          feedback: validated.notes,
        },
        include: {
          candidate: { select: { id: true, name: true } },
          application: { include: { job: { select: { id: true, title: true } } } },
        },
      }),
      prisma.timelineEvent.create({
        data: {
          type: "feedback_submitted",
          title: `Interview feedback submitted - ${validated.overallScore}/10`,
          description: `${validated.recommendation.replace(/_/g, " ")} by ${session.user.name || "Interviewer"}`,
          metadata: {
            interviewId: params.id,
            score: scoreBreakdown,
            submittedBy: session.user.id,
          },
          applicationId: interview.applicationId,
        },
      }),
      prisma.applicationNote.create({
        data: {
          content: `[Interview Feedback - ${interview.type}]\n\nScore: ${validated.overallScore}/10\nRecommendation: ${validated.recommendation.replace(/_/g, " ")}\n\nStrengths:\n${validated.strengths.map((s) => `- ${s}`).join("\n")}\n\nConcerns:\n${validated.concerns.map((c) => `- ${c}`).join("\n")}\n\nNotes:\n${validated.notes}`,
          type: "interview",
          applicationId: interview.applicationId,
          authorId: session.user.id,
        },
      }),
    ]);

    if (interview.application._count.interviews > 1) {
      const allInterviews = await prisma.interview.findMany({
        where: {
          applicationId: interview.applicationId,
          status: "completed",
        },
        select: { score: true },
      });

      const avgScore =
        allInterviews.reduce((sum, iv) => {
          const score = (iv.score as any)?.overall || 0;
          return sum + score;
        }, 0) / allInterviews.length;

      if (validated.recommendation === "strongly_recommend" || avgScore >= 8) {
        await prisma.application.update({
          where: { id: interview.applicationId },
          data: { status: "offer_pending" },
        });
      } else if (validated.recommendation === "strongly_not_recommend" || validated.overallScore <= 3) {
        await prisma.application.update({
          where: { id: interview.applicationId },
          data: { status: "rejected" },
        });
      }
    }

    return NextResponse.json({
      data: updatedInterview,
      message: "Interview feedback submitted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/interviews/[id]/score error:", error);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}
