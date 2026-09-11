import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const updateAssessmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(["TECHNICAL", "BEHAVIORAL", "PERSONALITY", "COGNITIVE", "SKILL_SPECIFIC"]).optional(),
  durationMinutes: z.number().min(5).max(480).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        type: z.enum(["multiple_choice", "true_false", "text", "code"]).default("multiple_choice"),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string().optional(),
        points: z.number().min(1).default(1),
        category: z.string().optional(),
      })
    )
    .optional(),
});

const submitAnswerSchema = z.object({
  candidateId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionIndex: z.number().min(0),
      answer: z.string(),
    })
  ),
  duration: z.number().min(0).optional(),
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

    const assessment = await prisma.skillAssessment.findUnique({
      where: { id: params.id },
      include: {
        results: {
          include: {
            candidate: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { results: true } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const avgScore =
      assessment.results.length > 0
        ? assessment.results.reduce((sum, r) => sum + r.score, 0) /
          assessment.results.length
        : null;

    const passRate =
      assessment.results.length > 0
        ? (assessment.results.filter((r) => r.passed).length /
            assessment.results.length) *
          100
        : null;

    return NextResponse.json({
      data: {
        ...assessment,
        stats: {
          totalAttempts: assessment.results.length,
          avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
          passRate: passRate ? Math.round(passRate * 10) / 10 : null,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/assessments/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
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

    if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const existing = await prisma.skillAssessment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateAssessmentSchema.parse(body);

    const assessment = await prisma.skillAssessment.update({
      where: { id: params.id },
      data: validated,
      include: {
        _count: { select: { results: true } },
      },
    });

    return NextResponse.json({ data: assessment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("PUT /api/assessments/[id] error:", error);
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
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
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const existing = await prisma.skillAssessment.findUnique({
      where: { id: params.id },
      include: { _count: { select: { results: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (existing._count.results > 0) {
      await prisma.skillAssessment.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Assessment deactivated (has existing results)",
      });
    }

    await prisma.skillAssessment.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Assessment deleted" });
  } catch (error) {
    console.error("DELETE /api/assessments/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
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

    const assessment = await prisma.skillAssessment.findUnique({
      where: { id: params.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (!assessment.isActive) {
      return NextResponse.json(
        { error: "This assessment is no longer active" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = submitAnswerSchema.parse(body);

    const previousAttempts = await prisma.assessmentResult.count({
      where: {
        assessmentId: params.id,
        candidateId: validated.candidateId,
      },
    });

    if (previousAttempts >= assessment.maxAttempts) {
      return NextResponse.json(
        { error: `Maximum attempts (${assessment.maxAttempts}) reached` },
        { status: 400 }
      );
    }

    const questions = assessment.questions as any[];
    let totalScore = 0;
    let maxScore = 0;

    const answerDetails = validated.answers.map((a) => {
      const question = questions[a.questionIndex];
      if (!question) return null;

      const points = question.points || 1;
      maxScore += points;

      let isCorrect = false;
      if (question.correctAnswer) {
        isCorrect =
          a.answer.toLowerCase().trim() ===
          question.correctAnswer.toLowerCase().trim();
      }

      if (isCorrect) totalScore += points;

      return {
        questionIndex: a.questionIndex,
        question: question.question,
        answer: a.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? points : 0,
      };
    });

    const scorePercentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = scorePercentage >= assessment.passingScore;

    const result = await prisma.assessmentResult.create({
      data: {
        assessmentId: params.id,
        candidateId: validated.candidateId,
        score: scorePercentage,
        passed,
        answers: answerDetails,
        duration: validated.duration,
        completedAt: new Date(),
        attempt: previousAttempts + 1,
      },
      include: {
        assessment: { select: { id: true, title: true, passingScore: true } },
        candidate: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({
      data: result,
      message: passed ? "Assessment passed" : "Assessment failed",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/assessments/[id] error:", error);
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 });
  }
}
