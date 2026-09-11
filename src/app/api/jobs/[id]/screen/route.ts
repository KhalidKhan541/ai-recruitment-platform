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

    const job = await prisma.jobPosting.findUnique({
      where: { id: params.id },
      include: { company: { select: { id: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    const { applicationId, answers } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Screening answers are required" },
        { status: 400 }
      );
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { candidate: { select: { id: true, name: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.jobId !== params.id) {
      return NextResponse.json(
        { error: "Application does not belong to this job" },
        { status: 400 }
      );
    }

    const questions = (job.screeningQuestions as string[]) || [];
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No screening questions configured for this job" },
        { status: 400 }
      );
    }

    let totalScore = 0;
    let maxScore = questions.length;
    const results: any[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[String(i)] || answers[question];
      let passed = false;

      if (answer !== undefined && answer !== null && answer !== "") {
        if (typeof answer === "boolean") {
          passed = answer;
        } else if (typeof answer === "number") {
          passed = answer > 0;
        } else if (typeof answer === "string") {
          passed = answer.trim().length > 0;
        }
      }

      if (passed) totalScore += 1;

      results.push({
        questionIndex: i,
        question,
        answer,
        passed,
      });
    }

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const screeningAnswers = Object.fromEntries(
      results.map((r) => [r.question, { answer: r.answer, passed: r.passed }])
    );

    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        screeningAnswers,
        rating: scorePercentage,
      },
    });

    await prisma.jobScreening.createMany({
      data: results.map((r) => ({
        question: r.question,
        answer: typeof r.answer === "string" ? r.answer : JSON.stringify(r.answer),
        score: r.passed ? 1 : 0,
        applicationId,
        evaluatedById: session.user.id,
        evaluatedAt: new Date(),
      })),
    });

    const screeningResult = {
      jobId: params.id,
      applicationId,
      candidateName: application.candidate?.name,
      answers: results,
      score: scorePercentage,
      totalQuestions: questions.length,
      passedQuestions: results.filter((r) => r.passed).length,
      screenedAt: new Date().toISOString(),
      screenedBy: session.user.id,
    };

    return NextResponse.json({
      data: screeningResult,
      message: scorePercentage >= 50
        ? "Candidate passed screening"
        : "Candidate did not meet screening criteria",
    });
  } catch (error) {
    console.error("POST /api/jobs/[id]/screen error:", error);
    return NextResponse.json({ error: "Failed to process screening" }, { status: 500 });
  }
}
