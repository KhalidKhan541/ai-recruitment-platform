import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const scoreInterviewSchema = z.object({
  scores: z.array(
    z.object({
      questionId: z.string().uuid().optional(),
      score: z.number().min(1).max(10),
      comments: z.string().optional(),
    })
  ),
  feedback: z.object({
    recommendation: z.enum([
      "strongly_recommend",
      "recommend",
      "neutral",
      "not_recommend",
      "strongly_not_recommend",
    ]),
    strengths: z.array(z.string()).min(1, "At least one strength is required"),
    weaknesses: z.array(z.string()).default([]),
    notes: z.string().min(10, "Please provide detailed feedback"),
    wouldInterviewAgain: z.boolean().optional(),
  }),
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
        candidate: { select: { id: true, user: { select: { name: true } } } },
        jobPosting: { select: { id: true, title: true } },
        application: {
          include: {
            _count: { select: { interviews: true } },
          },
        },
        panels: true,
        feedback: { select: { interviewerId: true } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Interview feedback has already been submitted" },
        { status: 400 }
      );
    }

    if (interview.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot score a cancelled interview" },
        { status: 400 }
      );
    }

    const hasSubmitted = interview.feedback.some(
      (f) => f.interviewerId === session.user.id
    );
    if (hasSubmitted && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You have already submitted feedback for this interview" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = scoreInterviewSchema.parse(body);

    const scoreCreations = validated.scores.map((s) => ({
      interviewId: params.id,
      interviewerId: session.user.id,
      interviewerName: session.user.name || "Unknown",
      questionId: s.questionId || null,
      score: s.score,
      comments: s.comments,
    }));

    await prisma.interviewScore.createMany({ data: scoreCreations });

    await prisma.interviewFeedback.create({
      data: {
        interviewId: params.id,
        interviewerId: session.user.id,
        interviewerName: session.user.name || "Unknown",
        recommendation: validated.feedback.recommendation,
        strengths: validated.feedback.strengths,
        weaknesses: validated.feedback.weaknesses,
        notes: validated.feedback.notes,
        wouldInterviewAgain: validated.feedback.wouldInterviewAgain,
      },
    });

    const allScores = await prisma.interviewScore.findMany({
      where: { interviewId: params.id },
    });

    const avgScore =
      allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length;

    if (
      interview.application &&
      interview.application._count.interviews > 1
    ) {
      const allInterviews = await prisma.interview.findMany({
        where: {
          applicationId: interview.applicationId!,
          status: "COMPLETED",
        },
        include: { scores: { select: { score: true } } },
      });

      const overallAvg =
        allInterviews.reduce((sum, iv) => {
          const ivAvg =
            iv.scores.reduce((s, sc) => s + sc.score, 0) /
            (iv.scores.length || 1);
          return sum + ivAvg;
        }, 0) / allInterviews.length;

      if (overallAvg >= 7 || validated.feedback.recommendation === "strongly_recommend") {
        await prisma.jobApplication.update({
          where: { id: interview.applicationId! },
          data: { status: "SHORTLISTED" },
        });
      }
    }

    const updated = await prisma.interview.update({
      where: { id: params.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return NextResponse.json({
      data: {
        interview: updated,
        scores: scoreCreations,
        averageScore: Math.round(avgScore * 10) / 10,
      },
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

export async function GET(
  _request: NextRequest,
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
        scores: { orderBy: { createdAt: "desc" } },
        feedback: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const avgScore =
      interview.scores.length > 0
        ? interview.scores.reduce((sum, s) => sum + s.score, 0) /
          interview.scores.length
        : null;

    return NextResponse.json({
      data: {
        interviewId: params.id,
        status: interview.status,
        scores: interview.scores,
        feedback: interview.feedback,
        averageScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
        totalScores: interview.scores.length,
        totalFeedback: interview.feedback.length,
      },
    });
  } catch (error) {
    console.error("GET /api/interviews/[id]/score error:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}
