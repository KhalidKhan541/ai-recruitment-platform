import { z } from "zod";
import { type MultiProviderManager, type ChatMessage } from "./provider";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const ResumeInputSchema = z.object({
  content: z.string().min(10, "Resume content is required"),
  format: z.enum(["text", "pdf", "docx"]).default("text"),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional(),
});

export type ResumeInput = z.infer<typeof ResumeInputSchema>;

export const ParsedResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedIn: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean().default(false),
      description: z.string(),
      achievements: z.array(z.string()),
      skills: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      gpa: z.string().optional(),
      honors: z.array(z.string()).optional(),
    })
  ),
  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    certifications: z.array(z.string()),
    languages: z.array(z.string()),
    tools: z.array(z.string()),
  }),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        url: z.string().url().optional(),
      })
    )
    .optional(),
  totalYearsExperience: z.number(),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

export const ResumeScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  breakdown: z.object({
    skillsMatch: z.number().min(0).max(100),
    experienceRelevance: z.number().min(0).max(100),
    educationFit: z.number().min(0).max(100),
    careerProgression: z.number().min(0).max(100),
    contentQuality: z.number().min(0).max(100),
    keywordOptimization: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
  atsScore: z.number().min(0).max(100),
});

export type ResumeScore = z.infer<typeof ResumeScoreSchema>;

export const SkillExtractionSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.enum([
        "programming",
        "framework",
        "database",
        "cloud",
        "devops",
        "soft_skill",
        "certification",
        "language",
        "tool",
        "domain",
      ]),
      proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
      evidence: z.array(z.string()),
      recency: z.enum(["current", "recent", "dated", "unknown"]),
      yearsOfUse: z.number().optional(),
    })
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      importance: z.enum(["critical", "important", "nice_to_have"]),
      reason: z.string(),
    })
  ),
  skillClusters: z.array(
    z.object({
      theme: z.string(),
      skills: z.array(z.string()),
      strength: z.enum(["strong", "moderate", "emerging"]),
    })
  ),
});

export type SkillExtraction = z.infer<typeof SkillExtractionSchema>;

// ─── Resume Analyzer ─────────────────────────────────────────────────────────

export class ResumeAnalyzer {
  private ai: MultiProviderManager;

  constructor(ai: MultiProviderManager) {
    this.ai = ai;
  }

  async parseResume(input: ResumeInput): Promise<ParsedResume> {
    const validated = ResumeInputSchema.parse(input);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert resume parser. Extract ALL information from the resume text accurately.
Return a valid JSON object matching this schema:
{
  "personalInfo": { "name": "", "email": "", "phone": "", "location": "", "linkedIn": "", "portfolio": "" },
  "summary": "",
  "experience": [{ "company": "", "title": "", "startDate": "", "endDate": "", "current": false, "description": "", "achievements": [""], "skills": [""] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "honors": [""] }],
  "skills": { "technical": [""], "soft": [""], "certifications": [""], "languages": [""], "tools": [""] },
  "projects": [{ "name": "", "description": "", "technologies": [""], "url": "" }],
  "totalYearsExperience": 0
}
Only return valid JSON, no markdown.`,
      },
      {
        role: "user",
        content: `Parse this resume:\n\n${validated.content}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.1, maxTokens: 8192 },
      "resume_parse"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return ParsedResumeSchema.parse(JSON.parse(cleaned));
    } catch {
      throw new Error("Failed to parse resume content into structured data");
    }
  }

  async scoreResume(
    parsed: ParsedResume,
    jobDescription: string,
    requirements: string[] = []
  ): Promise<ResumeScore> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert recruiter and ATS system. Score this candidate against the job description.
Return a valid JSON object matching this schema:
{
  "overall": 0-100,
  "breakdown": {
    "skillsMatch": 0-100,
    "experienceRelevance": 0-100,
    "educationFit": 0-100,
    "careerProgression": 0-100,
    "contentQuality": 0-100,
    "keywordOptimization": 0-100
  },
  "strengths": ["specific strength based on resume"],
  "weaknesses": ["specific concern based on resume"],
  "recommendations": ["actionable recommendation"],
  "atsScore": 0-100
}
Be specific and reference actual resume content. Only return valid JSON.`,
      },
      {
        role: "user",
        content: `CANDIDATE RESUME:\n${JSON.stringify(parsed, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nREQUIREMENTS:\n${requirements.join("\n")}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.2, maxTokens: 4096 },
      "resume_score"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return ResumeScoreSchema.parse(JSON.parse(cleaned));
    } catch {
      throw new Error("Failed to score resume");
    }
  }

  async extractSkills(parsed: ParsedResume, targetRole?: string): Promise<SkillExtraction> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a technical skill extraction expert. Analyze the resume and extract all skills with metadata.
Return a valid JSON object:
{
  "skills": [{
    "name": "skill name",
    "category": "programming|framework|database|cloud|devops|soft_skill|certification|language|tool|domain",
    "proficiency": "beginner|intermediate|advanced|expert",
    "evidence": ["where in resume this skill is evidenced"],
    "recency": "current|recent|dated|unknown",
    "yearsOfUse": 0
  }],
  "skillGaps": [{
    "skill": "missing skill name",
    "importance": "critical|important|nice_to_have",
    "reason": "why this gap matters"
  }],
  "skillClusters": [{
    "theme": "cluster theme name",
    "skills": ["skill1", "skill2"],
    "strength": "strong|moderate|emerging"
  }]
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `RESUME DATA:\n${JSON.stringify(parsed, null, 2)}\n\n${targetRole ? `TARGET ROLE: ${targetRole}\n\nIdentify skill gaps relevant to this role.` : "Identify general skill gaps for career growth."}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.2, maxTokens: 4096 },
      "skill_extraction"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return SkillExtractionSchema.parse(JSON.parse(cleaned));
    } catch {
      throw new Error("Failed to extract skills");
    }
  }

  async generateSummary(parsed: ParsedResume, style: "professional" | "creative" | "technical" = "professional"): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Generate a compelling professional summary based on the resume data.
Style: ${style}
Keep it to 3-4 sentences. Highlight key achievements and unique value proposition.
Return only the summary text, no JSON.`,
      },
      {
        role: "user",
        content: JSON.stringify(parsed, null, 2),
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.7, maxTokens: 500 },
      "summary_generation"
    );

    return response.content.trim();
  }

  async identifyRedFlags(parsed: ParsedResume): Promise<string[]> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Review this resume for potential red flags. Look for:
- Employment gaps (list specific gaps)
- Frequent job hopping (less than 1 year stints)
- Inconsistencies in dates or titles
- Vague or exaggerated claims
- Missing critical information
- Overqualification concerns

Return a JSON array of strings, each describing a red flag.
Only return valid JSON array.`,
      },
      {
        role: "user",
        content: JSON.stringify(parsed, null, 2),
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.3, maxTokens: 2048 },
      "red_flags"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  }

  async optimizeForATS(
    content: string,
    jobDescription: string
  ): Promise<{
    optimized: string;
    changes: string[];
    scoreImprovement: number;
  }> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Optimize this resume for Applicant Tracking Systems (ATS).
Identify missing keywords and suggest improvements.
Return a valid JSON object:
{
  "optimized": "the full optimized resume text",
  "changes": ["list of changes made"],
  "scoreImprovement": estimated percentage improvement
}
Only return valid JSON.`,
      },
      {
        role: "user",
        content: `ORIGINAL RESUME:\n${content}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ];

    const response = await this.ai.complete(
      { messages, temperature: 0.3, maxTokens: 8192 },
      "ats_optimization"
    );

    try {
      const cleaned = this.extractJSON(response.content);
      return JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to optimize resume");
    }
  }

  async bulkAnalyze(
    resumes: ResumeInput[],
    jobDescription: string
  ): Promise<
    Array<{
      resume: ResumeInput;
      parsed: ParsedResume;
      score: ResumeScore;
    }>
  > {
    const results: Array<{
      resume: ResumeInput;
      parsed: ParsedResume;
      score: ResumeScore;
    }> = [];

    for (const resume of resumes) {
      try {
        const parsed = await this.parseResume(resume);
        const score = await this.scoreResume(parsed, jobDescription);
        results.push({ resume, parsed, score });
      } catch (error) {
        // Skip failed resumes
        console.error(`Failed to analyze resume: ${error}`);
      }
    }

    results.sort((a, b) => b.score.overall - a.score.overall);
    return results;
  }

  async compareResumes(
    resumes: ParsedResume[],
    jobDescription: string
  ): Promise<{
    ranking: Array<{ index: number; score: number; summary: string }>;
    topSkills: string[];
    avgExperience: number;
    recommendation: string;
  }> {
    const scores: Array<{ index: number; score: ResumeScore; parsed: ParsedResume }> = [];

    for (let i = 0; i < resumes.length; i++) {
      const score = await this.scoreResume(resumes[i], jobDescription);
      scores.push({ index: i, score, parsed: resumes[i] });
    }

    scores.sort((a, b) => b.score.overall - a.score.overall);

    const allSkills = new Set<string>();
    let totalExperience = 0;

    for (const s of scores) {
      s.parsed.skills.technical.forEach((skill) => allSkills.add(skill));
      totalExperience += s.parsed.totalYearsExperience;
    }

    const skillCounts = new Map<string, number>();
    for (const s of scores) {
      s.parsed.skills.technical.forEach((skill) => {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      });
    }

    const topSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Based on the candidate comparison, provide a brief recommendation.
Return only the recommendation text, no JSON or formatting.`,
      },
      {
        role: "user",
        content: `Ranking: ${scores.map((s, i) => `#${i + 1}: ${s.score.overall}/100`).join(", ")}\nAvg experience: ${(totalExperience / resumes.length).toFixed(1)} years`,
      },
    ];

    const recResponse = await this.ai.complete({ messages, temperature: 0.5, maxTokens: 500 }, "compare");

    return {
      ranking: scores.map((s) => ({
        index: s.index,
        score: s.score.overall,
        summary: s.score.strengths[0] || "",
      })),
      topSkills,
      avgExperience: totalExperience / resumes.length,
      recommendation: recResponse.content,
    };
  }

  private extractJSON(text: string): string {
    let cleaned = text.trim();

    // Remove markdown code fences
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }

    cleaned = cleaned.trim();

    // Try to find JSON object or array
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
      // Find matching end
      let depth = 0;
      const openChar = cleaned[0];
      const closeChar = openChar === "{" ? "}" : "]";
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

// ─── Resume Text Extraction (simulated) ──────────────────────────────────────

export function extractTextFromPDF(buffer: Buffer): string {
  // In production, use pdf-parse or pdfjs-dist
  return buffer.toString("utf-8");
}

export function extractTextFromDOCX(buffer: Buffer): string {
  // In production, use mammoth
  return buffer.toString("utf-8");
}

// ─── Common Skill Database ───────────────────────────────────────────────────

export const SKILL_DATABASE: Record<string, { aliases: string[]; category: string }> = {
  javascript: { aliases: ["js", "es6", "es2015", "ecmascript"], category: "programming" },
  typescript: { aliases: ["ts"], category: "programming" },
  python: { aliases: ["py"], category: "programming" },
  java: { aliases: [], category: "programming" },
  "c#": { aliases: ["csharp", "c-sharp"], category: "programming" },
  "c++": { aliases: ["cpp"], category: "programming" },
  go: { aliases: ["golang"], category: "programming" },
  rust: { aliases: [], category: "programming" },
  ruby: { aliases: [], category: "programming" },
  php: { aliases: [], category: "programming" },
  swift: { aliases: [], category: "programming" },
  kotlin: { aliases: ["kotlin/jvm"], category: "programming" },
  scala: { aliases: [], category: "programming" },
  react: { aliases: ["reactjs", "react.js"], category: "framework" },
  angular: { aliases: ["angularjs", "angular.js"], category: "framework" },
  vue: { aliases: ["vuejs", "vue.js", "vue3"], category: "framework" },
  "next.js": { aliases: ["nextjs", "next"], category: "framework" },
  "node.js": { aliases: ["nodejs", "node"], category: "framework" },
  django: { aliases: [], category: "framework" },
  flask: { aliases: [], category: "framework" },
  "spring boot": { aliases: ["spring", "springboot"], category: "framework" },
  express: { aliases: ["expressjs", "express.js"], category: "framework" },
  postgresql: { aliases: ["postgres", "psql"], category: "database" },
  mysql: { aliases: [], category: "database" },
  mongodb: { aliases: ["mongo"], category: "database" },
  redis: { aliases: [], category: "database" },
  elasticsearch: { aliases: ["elastic", "es"], category: "database" },
  "aws": { aliases: ["amazon web services"], category: "cloud" },
  "azure": { aliases: ["microsoft azure"], category: "cloud" },
  gcp: { aliases: ["google cloud", "google cloud platform"], category: "cloud" },
  docker: { aliases: [], category: "devops" },
  kubernetes: { aliases: ["k8s"], category: "devops" },
  terraform: { aliases: [], category: "devops" },
  jenkins: { aliases: [], category: "devops" },
  gitlab: { aliases: ["gitlab ci", "gitlab ci/cd"], category: "devops" },
  "ci/cd": { aliases: ["continuous integration", "continuous deployment"], category: "devops" },
  communication: { aliases: [], category: "soft_skill" },
  leadership: { aliases: [], category: "soft_skill" },
  teamwork: { aliases: ["collaboration"], category: "soft_skill" },
  "problem solving": { aliases: ["analytical thinking"], category: "soft_skill" },
  "time management": { aliases: [], category: "soft_skill" },
};

export function normalizeSkillName(skill: string): string {
  const lower = skill.toLowerCase().trim();
  for (const [canonical, { aliases }] of Object.entries(SKILL_DATABASE)) {
    if (canonical === lower || aliases.includes(lower)) {
      return canonical;
    }
  }
  return lower;
}

export function getSkillCategory(skill: string): string {
  const normalized = normalizeSkillName(skill);
  return SKILL_DATABASE[normalized]?.category || "domain";
}
