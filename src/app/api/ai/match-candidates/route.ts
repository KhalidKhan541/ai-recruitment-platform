import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const matchCandidatesSchema = z.object({
  jobId: z.string().uuid(),
  limit: z.number().min(1).max(50).default(10),
  minScore: z.number().min(0).max(100).default(50),
  includePoolMembers: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = matchCandidatesSchema.parse(body);

    const job = await prisma.jobPosting.findUnique({
      where: { id: validated.jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        isAvailable: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
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
        poolMemberships: validated.includePoolMembers
          ? { include: { pool: { select: { id: true, name: true } } } }
          : false,
      },
      take: 200,
    });

    const matchedCandidates = candidates.map((candidate) => {
      let matchScore = 0;
      const matchBreakdown: any = {};

      const requiredSkills = (job.requirements as string) || "";
      const candidateSkills = candidate.skills.map((s) => s.name.toLowerCase());
      const requiredSkillList = requiredSkills
        .toLowerCase()
        .split(/[,\n]/)
        .map((s: string) => s.trim())
        .filter(Boolean);

      if (requiredSkillList.length > 0) {
        const matchedSkills = requiredSkillList.filter((req: string) =>
          candidateSkills.some((cs) => cs.includes(req) || req.includes(cs))
        );
        matchBreakdown.skills = {
          matched: matchedSkills,
          total: requiredSkillList.length,
          score: Math.round((matchedSkills.length / requiredSkillList.length) * 100),
        };
        matchScore += matchBreakdown.skills.score * 0.4;
      }

      const experienceLevelMap: Record<string, number> = {
        ENTRY: 0,
        JUNIOR: 1,
        MID: 2,
        SENIOR: 3,
        LEAD: 4,
        EXECUTIVE: 5,
      };

      const candidateExpYears = candidate.experiences.reduce((sum, exp) => {
        const start = new Date(exp.startDate).getTime();
        const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
        return sum + (end - start) / (1000 * 60 * 60 * 24 * 365);
      }, 0);

      const targetLevel = experienceLevelMap[job.experienceLevel] || 2;
      const expScore =
        candidateExpYears >= targetLevel * 2 && candidateExpYears <= (targetLevel + 2) * 2
          ? 100
          : Math.max(0, 100 - Math.abs(candidateExpYears - targetLevel * 2) * 10);

      matchBreakdown.experience = {
        years: Math.round(candidateExpYears * 10) / 10,
        targetLevel: job.experienceLevel,
        score: expScore,
      };
      matchScore += expScore * 0.3;

      if (job.isRemote || !job.location) {
        matchScore += 100 * 0.1;
        matchBreakdown.location = { match: true, score: 100 };
      } else {
        const candidateLocation = candidate.user.name?.toLowerCase() || "";
        const jobLocation = job.location.toLowerCase();
        const locationMatch = candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation);
        matchBreakdown.location = { match: locationMatch, score: locationMatch ? 100 : 30 };
        matchScore += (locationMatch ? 100 : 30) * 0.1;
      }

      const hasSalary = job.salaryMin || job.salaryMax;
      if (hasSalary && candidate.desiredSalary) {
        const salaryMatch =
          (!job.salaryMin || candidate.desiredSalary >= job.salaryMin) &&
          (!job.salaryMax || candidate.desiredSalary <= job.salaryMax);
        matchBreakdown.salary = { match: salaryMatch, score: salaryMatch ? 100 : 50 };
        matchScore += (salaryMatch ? 100 : 50) * 0.2;
      } else {
        matchScore += 75 * 0.2;
        matchBreakdown.salary = { match: null, score: 75 };
      }

      const finalScore = Math.round(matchScore);

      return {
        candidateId: candidate.id,
        name: candidate.user.name,
        email: candidate.user.email,
        avatarUrl: candidate.user.avatarUrl,
        headline: candidate.headline,
        matchScore: finalScore,
        matchBreakdown,
        skills: candidate.skills.slice(0, 5),
        experience: candidate.experiences.length,
        poolMemberships: Array.isArray(candidate.poolMemberships)
          ? candidate.poolMemberships.map((pm: any) => pm.pool)
          : [],
      };
    });

    const sorted = matchedCandidates
      .filter((c) => c.matchScore >= validated.minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, validated.limit);

    const savedResults = await Promise.all(
      sorted.map(async (match) => {
        const candidateResume = candidates.find(
          (c) => c.id === match.candidateId
        )?.resumes[0]?.resumes[0];

        if (candidateResume) {
          return prisma.resumeMatch.create({
            data: {
              resumeId: candidateResume.id,
              candidateId: match.candidateId,
              score: match.matchScore,
              breakdown: match.matchBreakdown,
            },
          }).catch(() => null);
        }
        return null;
      })
    );

    return NextResponse.json({
      data: {
        jobId: validated.jobId,
        jobTitle: job.title,
        totalCandidates: candidates.length,
        matchedCount: sorted.length,
        candidates: sorted,
      },
      message: `Found ${sorted.length} matching candidates`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/ai/match-candidates error:", error);
    return NextResponse.json({ error: "Failed to match candidates" }, { status: 500 });
  }
}
