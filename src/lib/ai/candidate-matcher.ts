import { z } from "zod";
import { type MultiProviderManager, type ChatMessage } from "./provider";
import { type ParsedResume, type ResumeScore } from "./resume-analyzer";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const JobDescriptionSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  department: z.string().optional(),
  location: z.string(),
  remote: z.boolean().default(false),
  type: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]),
  level: z.enum(["junior", "mid", "senior", "lead", "principal", "director", "vp", "c_level"]),
  salary: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string().default("USD"),
    })
    .optional(),
  description: z.string().min(50),
  requirements: z.array(z.string()),
  niceToHaves: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

export type JobDescription = z.infer<typeof JobDescriptionSchema>;

export const CandidateMatchSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  overallScore: z.number().min(0).max(100),
  breakdown: z.object({
    skillsAlignment: z.number().min(0).max(100),
    experienceMatch: z.number().min(0).max(100),
    cultureFit: z.number().min(0).max(100),
    growthPotential: z.number().min(0).max(100),
    availability: z.number().min(0).max(100),
    locationFit: z.number().min(0).max(100),
  }),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  strengthsForRole: z.array(z.string()),
  concerns: z.array(z.string()),
  interviewFocus: z.array(z.string()),
  recommendation: z.enum(["strong_match", "good_match", "potential_match", "weak_match"]),
  confidenceLevel: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type CandidateMatch = z.infer<typeof CandidateMatchSchema>;

export const SearchFilterSchema = z.object({
  skills: z.array(z.string()).optional(),
  minExperience: z.number().optional(),
  maxExperience: z.number().optional(),
  education: z.enum(["high_school", "bachelors", "masters", "phd"]).optional(),
  location: z.string().optional(),
  remoteOnly: z.boolean().optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  availability: z.enum(["immediate", "two_weeks", "one_month", "flexible"]).optional(),
  minScore: z.number().optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
});

export type SearchFilter = z.infer<typeof SearchFilterSchema>;

export interface CandidateProfile {
  id: string;
  parsed: ParsedResume;
  score?: ResumeScore;
  availability: "immediate" | "two_weeks" | "one_month" | "flexible";
  preferredLocations: string[];
  desiredSalary?: { min: number; max: number; currency: string };
  industries: string[];
  careerGoals: string[];
  lastActive: Date;
  tags: string[];
}

export interface MatchResult {
  matches: CandidateMatch[];
  summary: {
    totalCandidates: number;
    strongMatches: number;
    goodMatches: number;
    potentialMatches: number;
    weakMatches: number;
    avgScore: number;
  };
  insights: string;
  recommendedActions: string[];
}

// ─── Candidate Matcher ───────────────────────────────────────────────────────

export class CandidateMatcher {
  private ai: MultiProviderManager;

  constructor(ai: MultiProviderManager) {
    this.ai = ai;
  }

  async matchCandidateToJob(
    candidate: CandidateProfile,
    job: JobDescription
  ): Promise<CandidateMatch> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert technical recruiter AI. Analyze how well this candidate matches the job description.
Return a valid JSON object matching this schema:
{
  "overallScore": 0-100,
  "breakdown": {
    "skillsAlignment": 0-100,
    "experienceMatch": 0-100,
    "cultureFit": 0-100,
    "growthPotential": 0-100,
    "availability": 0-100,
    "locationFit": 0-100
  },
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengthsForRole": ["specific strength relevant to this job"],
  "concerns": ["specific concern for this role"],
  "interviewFocus": ["topic to explore in interview"],
  "recommendation": "strong_match|good_match|potential_match|weak_match",
  "confidenceLevel": 0.0-1.0,
  "reasoning": "detailed explanation of the match assessment"
}
Be specific. Reference actual resume content and job requirements.
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `CANDIDATE PROFILE:\n${JSON.stringify(candidate.parsed, null, 2)}\n\nCandidate Availability: ${candidate.availability}\nDesired Salary: ${candidate.desiredSalary ? `${candidate.desiredSalary.min}-${candidate.desiredSalary.max} ${candidate.desiredSalary.currency}` : "Not specified"}\nIndustries: ${candidate.industries.join(", ")}\nCareer Goals: ${candidate.careerGoals.join(", ")}\n\nJOB DESCRIPTION:\n${JSON.stringify(job, null, 2)}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.3, maxTokens: 4096 },
      "candidate_match"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      const data = JSON.parse(cleaned);
      return CandidateMatchSchema.parse({
        candidateId: candidate.id,
        jobId: job.title + "_" + job.company,
        ...data,
      });
    } catch {
      throw new Error("Failed to generate candidate match");
    }
  }

  async rankCandidates(
    candidates: CandidateProfile[],
    job: JobDescription,
    topN: number = 10
  ): Promise<MatchResult> {
    const matches: CandidateMatch[] = [];

    for (const candidate of candidates) {
      try {
        const match = await this.matchCandidateToJob(candidate, job);
        matches.push(match);
      } catch (error) {
        console.error(`Failed to match candidate ${candidate.id}: ${error}`);
      }
    }

    matches.sort((a, b) => b.overallScore - a.overallScore);
    const topMatches = matches.slice(0, topN);

    const summary = {
      totalCandidates: candidates.length,
      strongMatches: matches.filter((m) => m.recommendation === "strong_match").length,
      goodMatches: matches.filter((m) => m.recommendation === "good_match").length,
      potentialMatches: matches.filter((m) => m.recommendation === "potential_match").length,
      weakMatches: matches.filter((m) => m.recommendation === "weak_match").length,
      avgScore:
        matches.length > 0
          ? matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length
          : 0,
    };

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Based on the candidate matching results for this job, provide:
1. A brief insight paragraph about the candidate pool
2. Recommended actions for the recruiter

Return JSON:
{
  "insights": "paragraph about the candidate pool quality and patterns",
  "recommendedActions": ["action 1", "action 2"]
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `Job: ${job.title} at ${job.company}\nTotal candidates: ${summary.totalCandidates}\nStrong matches: ${summary.strongMatches}\nGood matches: ${summary.goodMatches}\nAverage score: ${summary.avgScore.toFixed(1)}\nTop skills found: ${this.getTopSkillsFromMatches(topMatches).join(", ")}`,
      },
    ];

    const aiResponse = await this.ai.complete({ messages, temperature: 0.5, maxTokens: 1024 }, "ranking_insights");

    let insights = "";
    let recommendedActions: string[] = [];

    try {
      const cleaned = this.extractJSON(aiResponse.content);
      const data = JSON.parse(cleaned);
      insights = data.insights;
      recommendedActions = data.recommendedActions;
    } catch {
      insights = aiResponse.content;
      recommendedActions = ["Review top candidates", "Schedule interviews for strong matches"];
    }

    return {
      matches: topMatches,
      summary,
      insights,
      recommendedActions,
    };
  }

  async searchCandidates(
    candidates: CandidateProfile[],
    filters: SearchFilter
  ): Promise<CandidateProfile[]> {
    return candidates.filter((candidate) => {
      if (filters.minExperience !== undefined) {
        if (candidate.parsed.totalYearsExperience < filters.minExperience) return false;
      }
      if (filters.maxExperience !== undefined) {
        if (candidate.parsed.totalYearsExperience > filters.maxExperience) return false;
      }
      if (filters.remoteOnly && !candidate.preferredLocations.includes("remote")) {
        return false;
      }
      if (filters.availability && candidate.availability !== filters.availability) {
        return false;
      }
      if (filters.minSalary && candidate.desiredSalary) {
        if (candidate.desiredSalary.max < filters.minSalary) return false;
      }
      if (filters.maxSalary && candidate.desiredSalary) {
        if (candidate.desiredSalary.min > filters.maxSalary) return false;
      }
      if (filters.skills && filters.skills.length > 0) {
        const candidateSkills = new Set(
          candidate.parsed.skills.technical.map((s) => s.toLowerCase())
        );
        const hasAll = filters.skills.every((s) =>
          candidateSkills.has(s.toLowerCase())
        );
        if (!hasAll) return false;
      }
      if (filters.certifications && filters.certifications.length > 0) {
        const certs = new Set(
          candidate.parsed.skills.certifications.map((c) => c.toLowerCase())
        );
        const hasAll = filters.certifications.every((c) => certs.has(c.toLowerCase()));
        if (!hasAll) return false;
      }
      if (filters.industries && filters.industries.length > 0) {
        const hasIndustry = candidate.industries.some((i) =>
          filters.industries!.some(
            (f) => i.toLowerCase().includes(f.toLowerCase())
          )
        );
        if (!hasIndustry) return false;
      }
      return true;
    });
  }

  async generateInterviewShortlist(
    candidates: CandidateProfile[],
    job: JobDescription,
    shortlistSize: number = 5
  ): Promise<{
    shortlist: Array<{
      candidateId: string;
      match: CandidateMatch;
      interviewQuestions: string[];
      evaluationCriteria: string[];
    }>;
    pipelineStage: string;
    nextSteps: string[];
  }> {
    const ranked = await this.rankCandidates(candidates, job, shortlistSize);
    const shortlist: Array<{
      candidateId: string;
      match: CandidateMatch;
      interviewQuestions: string[];
      evaluationCriteria: string[];
    }> = [];

    for (const match of ranked.matches) {
      const candidate = candidates.find((c) => c.id === match.candidateId);
      if (!candidate) continue;

      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Generate 5 targeted interview questions and evaluation criteria for this candidate-role match.
Focus on areas identified in the match analysis.
Return JSON:
{
  "interviewQuestions": ["question 1 tailored to candidate background"],
  "evaluationCriteria": ["what to look for in the answer"]
}
Only return valid JSON.`,
        },
        {
          role: "user",
          content: `Candidate: ${JSON.stringify(candidate.parsed, null, 2)}\nMatch: ${JSON.stringify(match, null, 2)}`,
        },
      ];

      const response = await this.ai.complete({ messages, temperature: 0.5, maxTokens: 2048 }, "interview_prep");

      let interviewQuestions: string[] = [];
      let evaluationCriteria: string[] = [];

      try {
        const cleaned = this.extractJSON(response.content);
        const data = JSON.parse(cleaned);
        interviewQuestions = data.interviewQuestions;
        evaluationCriteria = data.evaluationCriteria;
      } catch {
        interviewQuestions = [`Tell me about your experience with ${match.matchedSkills[0] || "relevant technologies"}`];
        evaluationCriteria = ["Depth of knowledge", "Practical application"];
      }

      shortlist.push({
        candidateId: match.candidateId,
        match,
        interviewQuestions,
        evaluationCriteria,
      });
    }

    return {
      shortlist,
      pipelineStage: "screening",
      nextSteps: [
        "Review shortlisted candidates",
        "Schedule initial phone screens",
        "Prepare technical assessments",
        "Coordinate with hiring managers",
      ],
    };
  }

  async findSimilarCandidates(
    targetCandidate: CandidateProfile,
    candidatePool: CandidateProfile[],
    maxResults: number = 5
  ): Promise<Array<{ candidate: CandidateProfile; similarityScore: number; reasons: string[] }>> {
    const results: Array<{
      candidate: CandidateProfile;
      similarityScore: number;
      reasons: string[];
    }> = [];

    for (const candidate of candidatePool) {
      if (candidate.id === targetCandidate.id) continue;

      const skillOverlap = this.calculateSkillOverlap(
        targetCandidate.parsed.skills.technical,
        candidate.parsed.skills.technical
      );

      const experienceDiff = Math.abs(
        targetCandidate.parsed.totalYearsExperience - candidate.parsed.totalYearsExperience
      );

      const similarityScore = Math.max(
        0,
        100 - skillOverlap * 40 - experienceDiff * 5 -
          (targetCandidate.industries.some((i) => candidate.industries.includes(i)) ? 0 : 20)
      );

      if (similarityScore > 30) {
        const reasons: string[] = [];
        if (skillOverlap > 50) reasons.push(`${skillOverlap.toFixed(0)}% skill overlap`);
        if (experienceDiff <= 2) reasons.push("Similar experience level");
        if (targetCandidate.industries.some((i) => candidate.industries.includes(i))) {
          reasons.push("Same industry background");
        }

        results.push({ candidate, similarityScore, reasons });
      }
    }

    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, maxResults);
  }

  async diversifyShortlist(
    matches: CandidateMatch[],
    candidates: CandidateProfile[],
    targetSize: number = 5
  ): Promise<CandidateMatch[]> {
    const selected: CandidateMatch[] = [];
    const usedLocations = new Set<string>();
    const usedEducations = new Set<string>();
    const usedGenders = new Set<string>();

    for (const match of matches) {
      if (selected.length >= targetSize) break;

      const candidate = candidates.find((c) => c.id === match.candidateId);
      if (!candidate) continue;

      const location = candidate.parsed.personalInfo.location || "unknown";
      const education = candidate.parsed.education[0]?.degree || "unknown";

      const diversityBonus =
        (!usedLocations.has(location) ? 5 : 0) +
        (!usedEducations.has(education) ? 3 : 0);

      if (selected.length < targetSize || diversityBonus > 0) {
        selected.push({
          ...match,
          overallScore: Math.min(100, match.overallScore + diversityBonus),
        });
        usedLocations.add(location);
        usedEducations.add(education);
      }
    }

    selected.sort((a, b) => b.overallScore - a.overallScore);
    return selected.slice(0, targetSize);
  }

  private calculateSkillOverlap(skills1: string[], skills2: string[]): number {
    const set1 = new Set(skills1.map((s) => s.toLowerCase()));
    const set2 = new Set(skills2.map((s) => s.toLowerCase()));
    const intersection = new Set([...set1].filter((s) => set2.has(s)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  private getTopSkillsFromMatches(matches: CandidateMatch[]): string[] {
    const skillCounts = new Map<string, number>();
    for (const match of matches) {
      for (const skill of match.matchedSkills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
    }
    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);
  }

  private extractJSON(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const objStart = cleaned.indexOf("{");
    if (objStart >= 0) {
      cleaned = cleaned.slice(objStart);
      let depth = 0;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") depth++;
        if (cleaned[i] === "}") depth--;
        if (depth === 0) {
          cleaned = cleaned.slice(0, i + 1);
          break;
        }
      }
    }
    return cleaned;
  }
}

// ─── Skill-Based Search Utilities ────────────────────────────────────────────

export function calculateSkillSimilarity(skills1: string[], skills2: string[]): number {
  const set1 = new Set(skills1.map((s) => s.toLowerCase()));
  const set2 = new Set(skills2.map((s) => s.toLowerCase()));
  const intersection = new Set([...set1].filter((s) => set2.has(s)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? (intersection.size / union.size) : 0;
}

export function aggregateJobKeywords(jobs: JobDescription[]): string[] {
  const keywordCounts = new Map<string, number>();
  for (const job of jobs) {
    for (const keyword of job.keywords) {
      keywordCounts.set(keyword.toLowerCase(), (keywordCounts.get(keyword.toLowerCase()) || 0) + 1);
    }
    for (const req of job.requirements) {
      const words = req.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 3) {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        }
      }
    }
  }
  return Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([keyword]) => keyword);
}

export function matchScoreToLabel(score: number): string {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Strong Match";
  if (score >= 55) return "Good Match";
  if (score >= 40) return "Potential Match";
  return "Weak Match";
}

export function getRecommendationColor(recommendation: CandidateMatch["recommendation"]): string {
  const colors: Record<string, string> = {
    strong_match: "#22c55e",
    good_match: "#3b82f6",
    potential_match: "#f59e0b",
    weak_match: "#ef4444",
  };
  return colors[recommendation] || "#6b7280";
}
