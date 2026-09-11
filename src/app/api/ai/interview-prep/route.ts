import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const interviewPrepSchema = z.object({
  interviewId: z.string().uuid(),
  focusAreas: z
    .array(z.enum(["technical", "behavioral", "culture_fit", "problem_solving", "leadership"]))
    .default(["technical", "behavioral"]),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  questionCount: z.number().min(5).max(30).default(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = interviewPrepSchema.parse(body);

    const interview = await prisma.interview.findUnique({
      where: { id: validated.interviewId },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            skills: true,
            experiences: true,
            educations: true,
          },
        },
        jobPosting: {
          include: {
            company: { select: { id: true, name: true, industry: true } },
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const candidateSkills = interview.candidate.skills.map((s) => ({
      name: s.name,
      level: s.level,
      years: s.yearsOfExperience,
    }));

    const jobRequirements = interview.jobPosting.requirements
      ? String(interview.jobPosting.requirements).split(/[,\n]/).map((r: string) => r.trim()).filter(Boolean)
      : [];

    const generatedQuestions: any[] = [];

    const technicalQuestions = [
      "Describe your experience with the primary technologies listed in this role.",
      "Walk me through a complex project you built and the technical decisions you made.",
      "How do you approach debugging a production issue under time pressure?",
      "Explain a system design you've worked on and trade-offs you considered.",
      "What testing strategies do you typically employ?",
      "How do you stay current with new technologies and industry trends?",
      "Describe a time you had to learn a new technology quickly for a project.",
      "How do you approach code reviews and ensuring code quality?",
    ];

    const behavioralQuestions = [
      "Tell me about a time you had to work with a difficult team member.",
      "Describe a situation where you had to make a decision with incomplete information.",
      "How do you prioritize competing deadlines?",
      "Give an example of a time you went above and beyond for a project.",
      "Describe a failure and what you learned from it.",
      "How do you handle receiving critical feedback?",
      "Tell me about a time you had to persuade others to adopt your idea.",
      "Describe your ideal work environment and management style.",
    ];

    const cultureFitQuestions = [
      "What kind of company culture do you thrive in?",
      "How do you approach work-life balance?",
      "What motivates you in your career?",
      "How do you handle ambiguity and change?",
    ];

    const problemSolvingQuestions = [
      "Walk me through how you would approach [specific problem related to the role].",
      "Describe a time you optimized a process or system significantly.",
      "How do you break down a large, ambiguous problem into manageable pieces?",
    ];

    const leadershipQuestions = [
      "Describe your leadership style with a specific example.",
      "How do you develop and mentor junior team members?",
      "Tell me about a time you led a cross-functional initiative.",
    ];

    const questionSets: Record<string, string[]> = {
      technical: technicalQuestions,
      behavioral: behavioralQuestions,
      culture_fit: cultureFitQuestions,
      problem_solving: problemSolvingQuestions,
      leadership: leadershipQuestions,
    };

    for (const area of validated.focusAreas) {
      const questions = questionSets[area] || [];
      const count = Math.ceil(validated.questionCount / validated.focusAreas.length);

      for (let i = 0; i < Math.min(count, questions.length); i++) {
        generatedQuestions.push({
          question: questions[i],
          category: area,
          order: generatedQuestions.length + 1,
          difficulty: validated.difficulty === "mixed"
            ? ["easy", "medium", "hard"][generatedQuestions.length % 3]
            : validated.difficulty,
          tips: `Consider the candidate's ${area} background when evaluating this response.`,
        });
      }
    }

    const candidateProfile = {
      name: interview.candidate.user.name,
      headline: interview.candidate.headline,
      skills: candidateSkills,
      experience: interview.candidate.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        duration: e.endDate
          ? `${Math.round((new Date(e.endDate).getTime() - new Date(e.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365 * 10)) / 10} years`
          : "Current",
      })),
      education: interview.candidate.educations.map((e) => ({
        degree: e.degree,
        field: e.fieldOfStudy,
        institution: e.institution,
      })),
    };

    const prepGuide = {
      interviewId: validated.interviewId,
      jobTitle: interview.jobPosting.title,
      company: interview.jobPosting.company.name,
      interviewType: interview.type,
      candidateProfile,
      questions: generatedQuestions,
      jobRequirements,
      preparationTips: [
        `Review the candidate's resume focusing on ${candidateSkills.slice(0, 3).map((s) => s.name).join(", ")}.`,
        `Prepare specific examples related to ${interview.jobPosting.industry || "this industry"}.`,
        `Consider ${validated.focusAreas.join(", ")} as key evaluation areas.`,
        `The interview is scheduled for ${interview.durationMinutes} minutes — allocate time accordingly.`,
      ],
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.id,
    };

    return NextResponse.json({
      data: prepGuide,
      message: "Interview preparation guide generated",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/ai/interview-prep error:", error);
    return NextResponse.json({ error: "Failed to generate interview prep" }, { status: 500 });
  }
}
