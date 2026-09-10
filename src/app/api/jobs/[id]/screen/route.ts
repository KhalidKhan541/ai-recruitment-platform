import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        requiredSkills: true,
        screeningQuestions: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    const { answers, candidateEmail } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Screening answers are required" },
        { status: 400 }
      );
    }

    const questions = (job.screeningQuestions as any[]) || [];
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No screening questions configured for this job" },
        { status: 400 }
      );
    }

    let totalScore = 0;
    let maxScore = 0;
    const results: any[] = [];

    for (const question of questions) {
      const weight = question.weight || 1;
      maxScore += weight;
      const answer = answers[question.id] || answers[question.question];
      let passed = false;

      if (answer !== undefined && answer !== null && answer !== "") {
        if (question.type === "yes_no") {
          passed = answer.toLowerCase() === question.passingAnswer?.toLowerCase();
        } else if (question.type === "multiple_choice") {
          passed = answer === question.passingAnswer;
        } else if (question.type === "text") {
          passed = answer.length > 10;
        } else if (question.type === "number") {
          const numAnswer = parseFloat(answer);
          const passNum = parseFloat(question.passingAnswer || "0");
          passed = !isNaN(numAnswer) && numAnswer >= passNum;
        }
      }

      if (passed) totalScore += weight;

      results.push({
        questionId: question.id,
        question: question.question,
        answer,
        passed,
        weight,
      });
    }

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passedAllRequired = results
      .filter((r) => {
        const q = questions.find((q: any) => q.id === r.questionId);
        return q?.required;
      })
      .every((r) => r.passed);

    let candidateId: string | undefined;
    if (candidateEmail) {
      const candidate = await prisma.candidate.findUnique({
        where: { email: candidateEmail },
      });
      candidateId = candidate?.id;
    }

    const screeningResult = {
      jobId: params.id,
      candidateId,
      answers: results,
      score: scorePercentage,
      passedAllRequired,
      totalQuestions: questions.length,
      passedQuestions: results.filter((r) => r.passed).length,
      screenedAt: new Date().toISOString(),
      screenedBy: session.user.id,
    };

    return NextResponse.json({
      data: screeningResult,
      message: passedAllRequired
        ? "Candidate passed screening"
        : "Candidate did not meet all required criteria",
    });
  } catch (error) {
    console.error("POST /api/jobs/[id]/screen error:", error);
    return NextResponse.json({ error: "Failed to process screening" }, { status: 500 });
  }
}
