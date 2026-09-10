import { z } from "zod";
import { type MultiProviderManager, type ChatMessage } from "./provider";
import { type JobDescription } from "./candidate-matcher";
import { type CandidateProfile } from "./candidate-matcher";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const InterviewQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string(),
  category: z.enum([
    "technical",
    "behavioral",
    "situational",
    "culture_fit",
    "leadership",
    "problem_solving",
    "experience",
    "motivation",
    "stress",
  ]),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  followUps: z.array(z.string()),
  expectedAnswer: z.string(),
  evaluationCriteria: z.array(
    z.object({
      criterion: z.string(),
      weight: z.number().min(0).max(1),
      excellentAnswer: z.string(),
      goodAnswer: z.string(),
      poorAnswer: z.string(),
    })
  ),
  timeAllocation: z.number().int().positive(),
  scoringRubric: z.object({
    excellent: z.string(),
    good: z.string(),
    acceptable: z.string(),
    poor: z.string(),
  }),
  tags: z.array(z.string()),
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

export const InterviewPlanSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string(),
  candidateId: z.string(),
  title: z.string(),
  duration: z.number().int().positive(),
  sections: z.array(
    z.object({
      name: z.string(),
      duration: z.number().int().positive(),
      questions: z.array(InterviewQuestionSchema),
      instructions: z.string(),
    })
  ),
  scoringGuide: z.string(),
  redFlags: z.array(z.string()),
  greenFlags: z.array(z.string()),
  overallInstructions: z.string(),
});

export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const EvaluationResultSchema = z.object({
  questionId: z.string(),
  score: z.number().min(0).max(10),
  notes: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  followUpNeeded: z.boolean(),
  followUpNotes: z.string().optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const InterviewScorecardSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  interviewer: z.string(),
  date: z.string(),
  overallScore: z.number().min(0).max(10),
  recommendation: z.enum([
    "strong_yes",
    "yes",
    "lean_yes",
    "neutral",
    "lean_no",
    "no",
    "strong_no",
  ]),
  evaluations: z.array(EvaluationResultSchema),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  notes: z.string(),
  hireConfidence: z.number().min(0).max(1),
  technicalSkills: z.number().min(0).max(10),
  communication: z.number().min(0).max(10),
  cultureFit: z.number().min(0).max(10),
  problemSolving: z.number().min(0).max(10),
  potentialForGrowth: z.number().min(0).max(10),
});

export type InterviewScorecard = z.infer<typeof InterviewScorecardSchema>;

export const DebriefNoteSchema = z.object({
  interviewerId: z.string(),
  interviewerName: z.string(),
  timestamp: z.string(),
  summary: z.string(),
  recommendation: z.string(),
  keyObservations: z.array(z.string()),
  concerns: z.array(z.string()),
  questionsForCandidate: z.array(z.string()),
});

export type DebriefNote = z.infer<typeof DebriefNoteSchema>;

// ─── Interview Prep Service ──────────────────────────────────────────────────

export class InterviewPrepService {
  private ai: MultiProviderManager;

  constructor(ai: MultiProviderManager) {
    this.ai = ai;
  }

  async generateQuestions(
    job: JobDescription,
    candidate: CandidateProfile,
    options: {
      count?: number;
      categories?: string[];
      difficulty?: string;
      focusAreas?: string[];
    } = {}
  ): Promise<InterviewQuestion[]> {
    const count = options.count || 10;
    const categories = options.categories || [
      "technical",
      "behavioral",
      "situational",
      "culture_fit",
      "problem_solving",
    ];
    const difficulty = options.difficulty || "medium";

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert interview coach and hiring strategist. Generate ${count} interview questions tailored to this specific candidate and role.
Categories to cover: ${categories.join(", ")}
Difficulty level: ${difficulty}

Return a JSON array of question objects:
[{
  "id": "uuid-format",
  "question": "the interview question",
  "category": "technical|behavioral|situational|culture_fit|leadership|problem_solving|experience|motivation|stress",
  "difficulty": "easy|medium|hard|expert",
  "followUps": ["follow up question 1", "follow up question 2"],
  "expectedAnswer": "what a good answer would cover",
  "evaluationCriteria": [{
    "criterion": "what to evaluate",
    "weight": 0.0-1.0,
    "excellentAnswer": "what excellent looks like",
    "goodAnswer": "what good looks like",
    "poorAnswer": "what poor looks like"
  }],
  "timeAllocation": minutes,
  "scoringRubric": {
    "excellent": "description",
    "good": "description",
    "acceptable": "description",
    "poor": "description"
  },
  "tags": ["tag1", "tag2"]
}]

Make questions specific to the candidate's background and the job requirements.
Reference their actual experience and skills.
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `JOB DESCRIPTION:\n${JSON.stringify(job, null, 2)}\n\nCANDIDATE PROFILE:\n${JSON.stringify(candidate.parsed, null, 2)}\n\nCandidate strengths: ${candidate.parsed.skills.technical.slice(0, 5).join(", ")}\nExperience: ${candidate.parsed.totalYearsExperience} years\n${options.focusAreas ? `Focus areas: ${options.focusAreas.join(", ")}` : ""}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.6, maxTokens: 8192 },
      "interview_questions"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      const data = JSON.parse(cleaned);
      return data.map((q: Record<string, unknown>, i: number) => ({
        ...q,
        id: q.id || `q-${Date.now()}-${i}`,
      }));
    } catch {
      throw new Error("Failed to generate interview questions");
    }
  }

  async createInterviewPlan(
    job: JobDescription,
    candidate: CandidateProfile,
    duration: number = 60
  ): Promise<InterviewPlan> {
    const questions = await this.generateQuestions(job, candidate, {
      count: Math.floor(duration / 8),
      difficulty: job.level === "junior" ? "easy" : job.level === "senior" ? "hard" : "medium",
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Organize these interview questions into a structured ${duration}-minute interview plan.
Group questions into logical sections with time allocations.

Return JSON:
{
  "title": "Interview Plan for [Role]",
  "sections": [{
    "name": "section name",
    "duration": minutes,
    "questions": [...question objects],
    "instructions": "what the interviewer should focus on in this section"
  }],
  "scoringGuide": "overall scoring guidance",
  "redFlags": ["red flag 1", "red flag 2"],
  "greenFlags": ["green flag 1", "green flag 2"],
  "overallInstructions": "instructions for the interviewer"
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `Duration: ${duration} minutes\nQuestions: ${JSON.stringify(questions, null, 2)}\nJob: ${job.title} at ${job.company}\nCandidate: ${candidate.parsed.personalInfo.name}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.4, maxTokens: 6144 },
      "interview_plan"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      const data = JSON.parse(cleaned);
      return InterviewPlanSchema.parse({
        id: `plan-${Date.now()}`,
        jobId: job.title + "_" + job.company,
        candidateId: candidate.id,
        duration,
        ...data,
      });
    } catch {
      throw new Error("Failed to create interview plan");
    }
  }

  async generateTechnicalChallenge(
    job: JobDescription,
    candidate: CandidateProfile
  ): Promise<{
    challenge: string;
    description: string;
    requirements: string[];
    timeLimit: number;
    evaluationCriteria: string[];
    sampleSolution: string;
    scoringGuide: string;
  }> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Design a technical challenge appropriate for this role and candidate level.
The challenge should be:
- Relevant to the actual job responsibilities
- Completable within the time limit
- revealing of the candidate's problem-solving approach

Return JSON:
{
  "challenge": "challenge title",
  "description": "detailed description of what the candidate needs to build/solve",
  "requirements": ["requirement 1", "requirement 2"],
  "timeLimit": minutes,
  "evaluationCriteria": ["what to evaluate"],
  "sampleSolution": "brief sample approach or pseudocode",
  "scoringGuide": "how to score the submission"
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `Job: ${job.title}\nLevel: ${job.level}\nTech stack: ${job.requirements.filter((r) => r.toLowerCase().includes("python") || r.toLowerCase().includes("javascript") || r.toLowerCase().includes("react") || r.toLowerCase().includes("sql")).join(", ")}\nCandidate skills: ${candidate.parsed.skills.technical.join(", ")}\nCandidate experience: ${candidate.parsed.totalYearsExperience} years`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.6, maxTokens: 4096 },
      "technical_challenge"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to generate technical challenge");
    }
  }

  async evaluateAnswer(
    question: InterviewQuestion,
    candidateAnswer: string,
    jobContext: string
  ): Promise<EvaluationResult> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Evaluate this interview answer against the question and evaluation criteria.
Be fair but thorough. Consider depth, accuracy, and communication quality.

Return JSON:
{
  "score": 0-10,
  "notes": "detailed evaluation notes",
  "strengths": ["strength 1", "strength 2"],
  "concerns": ["concern 1"],
  "followUpNeeded": true/false,
  "followUpNotes": "what to follow up on"
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `QUESTION: ${question.question}\nEXPECTED: ${question.expectedAnswer}\nCRITERIA: ${JSON.stringify(question.evaluationCriteria, null, 2)}\n\nCANDIDATE ANSWER:\n${candidateAnswer}\n\nJOB CONTEXT: ${jobContext}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.3, maxTokens: 2048 },
      "answer_evaluation"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      const data = JSON.parse(cleaned);
      return EvaluationResultSchema.parse({
        questionId: question.id,
        ...data,
      });
    } catch {
      throw new Error("Failed to evaluate answer");
    }
  }

  async generateScorecard(
    candidate: CandidateProfile,
    job: JobDescription,
    evaluations: EvaluationResult[],
    interviewerName: string
  ): Promise<InterviewScorecard> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Based on the interview evaluations, generate a comprehensive scorecard.

Return JSON:
{
  "overallScore": 0-10,
  "recommendation": "strong_yes|yes|lean_yes|neutral|lean_no|no|strong_no",
  "strengths": ["key strength 1"],
  "concerns": ["key concern 1"],
  "notes": "overall interview notes",
  "hireConfidence": 0.0-1.0,
  "technicalSkills": 0-10,
  "communication": 0-10,
  "cultureFit": 0-10,
  "problemSolving": 0-10,
  "potentialForGrowth": 0-10
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `Candidate: ${candidate.parsed.personalInfo.name}\nJob: ${job.title}\nEvaluations: ${JSON.stringify(evaluations, null, 2)}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.3, maxTokens: 2048 },
      "scorecard"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      const data = JSON.parse(cleaned);
      return InterviewScorecardSchema.parse({
        candidateId: candidate.id,
        jobId: job.title + "_" + job.company,
        interviewer: interviewerName,
        date: new Date().toISOString(),
        evaluations,
        ...data,
      });
    } catch {
      throw new Error("Failed to generate scorecard");
    }
  }

  async generateDebriefNotes(
    scorecards: InterviewScorecard[],
    job: JobDescription
  ): Promise<{
    summary: string;
    consensusScore: number;
    consensusRecommendation: string;
    keyThemes: string[];
    areasOfAgreement: string[];
    areasOfDisagreement: string[];
    finalRecommendation: string;
    nextSteps: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Synthesize multiple interview scorecards into a debrief summary.
Analyze patterns, agreements, and disagreements across interviewers.

Return JSON:
{
  "summary": "executive summary of the debrief",
  "consensusScore": average score,
  "consensusRecommendation": "overall recommendation",
  "keyThemes": ["theme 1", "theme 2"],
  "areasOfAgreement": ["what interviewers agreed on"],
  "areasOfDisagreement": ["where interviewers disagreed"],
  "finalRecommendation": "final hire/no-hire recommendation with reasoning",
  "nextSteps": ["next step 1", "next step 2"]
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `Job: ${job.title} at ${job.company}\nScorecards: ${JSON.stringify(scorecards, null, 2)}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.4, maxTokens: 4096 },
      "debrief"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to generate debrief notes");
    }
  }

  async suggestImprovements(
    scorecard: InterviewScorecard,
    job: JobDescription
  ): Promise<{
    interviewProcessFeedback: string;
    questionQuality: string;
    scoringConsistency: string;
    improvementSuggestions: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Review the interview scorecard and suggest improvements to the interview process.

Return JSON:
{
  "interviewProcessFeedback": "feedback on how the interview was conducted",
  "questionQuality": "assessment of question relevance and effectiveness",
  "scoringConsistency": "whether scores seem consistent and fair",
  "improvementSuggestions": ["specific suggestion 1", "specific suggestion 2"]
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `Job: ${job.title}\nScorecard: ${JSON.stringify(scorecard, null, 2)}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.5, maxTokens: 2048 },
      "process_improvement"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to generate improvement suggestions");
    }
  }

  private extractJSON(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const objStart = cleaned.indexOf("{");
    const arrStart = cleaned.indexOf("[");
    let start = -1;

    if (objStart >= 0 && (arrStart < 0 || objStart < arrStart)) {
      start = objStart;
    } else if (arrStart >= 0) {
      start = arrStart;
    }

    if (start >= 0) {
      cleaned = cleaned.slice(start);
      const openChar = cleaned[0];
      const closeChar = openChar === "{" ? "}" : "]";
      let depth = 0;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === openChar) depth++;
        if (cleaned[i] === closeChar) depth--;
        if (depth === 0) {
          cleaned = cleaned.slice(0, i + 1);
          break;
        }
      }
    }
    return cleaned;
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

export function calculateAverageScore(evaluations: EvaluationResult[]): number {
  if (evaluations.length === 0) return 0;
  const total = evaluations.reduce((sum, e) => sum + e.score, 0);
  return total / evaluations.length;
}

export function getRecommendationLabel(
  score: number
): { label: string; color: string } {
  if (score >= 8) return { label: "Strong Yes", color: "#22c55e" };
  if (score >= 6) return { label: "Yes", color: "#3b82f6" };
  if (score >= 5) return { label: "Lean Yes", color: "#60a5fa" };
  if (score >= 4) return { label: "Neutral", color: "#f59e0b" };
  if (score >= 3) return { label: "Lean No", color: "#f97316" };
  return { label: "No", color: "#ef4444" };
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export const QUESTION_CATEGORIES = [
  { value: "technical", label: "Technical Skills" },
  { value: "behavioral", label: "Behavioral" },
  { value: "situational", label: "Situational" },
  { value: "culture_fit", label: "Culture Fit" },
  { value: "leadership", label: "Leadership" },
  { value: "problem_solving", label: "Problem Solving" },
  { value: "experience", label: "Experience" },
  { value: "motivation", label: "Motivation" },
  { value: "stress", label: "Stress Test" },
] as const;
