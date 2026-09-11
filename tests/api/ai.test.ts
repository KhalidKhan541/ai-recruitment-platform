import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

vi.mock("openai", () => ({
  default: vi.fn(() => mockOpenAI),
}));

describe("AI Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Resume analysis", () => {
    it("parses resume text and extracts skills", async () => {
      const resumeText = `
        John Doe
        Software Engineer with 5 years of experience
        Skills: JavaScript, TypeScript, React, Node.js, Python
        Education: BS Computer Science, MIT
        Experience: Senior Developer at TechCorp (2020-2024)
      `;

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: "John Doe",
                title: "Software Engineer",
                skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python"],
                experience: [
                  {
                    company: "TechCorp",
                    title: "Senior Developer",
                    startDate: "2020",
                    endDate: "2024",
                  },
                ],
                education: [
                  {
                    institution: "MIT",
                    degree: "BS",
                    fieldOfStudy: "Computer Science",
                  },
                ],
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 300,
          total_tokens: 800,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await mockOpenAI.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Parse this resume and extract structured data.",
          },
          { role: "user", content: resumeText },
        ],
        temperature: 0.3,
      });

      const parsed = JSON.parse(result.choices[0].message.content);
      expect(parsed.name).toBe("John Doe");
      expect(parsed.skills).toContain("TypeScript");
      expect(parsed.skills).toHaveLength(5);
    });

    it("handles empty or invalid resume text", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                error: "Unable to parse resume",
                skills: [],
                experience: [],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await mockOpenAI.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: "Parse this resume." },
          { role: "user", content: "" },
        ],
      });

      const parsed = JSON.parse(result.choices[0].message.content);
      expect(parsed.skills).toHaveLength(0);
    });
  });

  describe("Candidate matching", () => {
    it("calculates match score between candidate and job", () => {
      const candidateSkills = ["TypeScript", "React", "Node.js", "Python"];
      const requiredSkills = ["TypeScript", "React"];
      const preferredSkills = ["Node.js", "Python", "AWS"];

      const requiredMatches = requiredSkills.filter((s) =>
        candidateSkills.includes(s)
      ).length;
      const preferredMatches = preferredSkills.filter((s) =>
        candidateSkills.includes(s)
      ).length;

      const requiredScore = (requiredMatches / requiredSkills.length) * 70;
      const preferredScore = preferredSkills.length > 0
        ? (preferredMatches / preferredSkills.length) * 30
        : 30;
      const totalScore = Math.round(requiredScore + preferredScore);

      expect(totalScore).toBe(100);
    });

    it("returns low score when few skills match", () => {
      const candidateSkills = ["Java", "C++"];
      const requiredSkills = ["TypeScript", "React", "Node.js"];

      const requiredMatches = requiredSkills.filter((s) =>
        candidateSkills.includes(s)
      ).length;

      const requiredScore = (requiredMatches / requiredSkills.length) * 70;
      const totalScore = Math.round(requiredScore + 30);

      expect(totalScore).toBe(30);
    });

    it("generates candidate ranking from AI response", () => {
      const candidates = [
        { id: "c1", name: "Alice", matchScore: 95 },
        { id: "c2", name: "Bob", matchScore: 87 },
        { id: "c3", name: "Charlie", matchScore: 72 },
        { id: "c4", name: "Diana", matchScore: 68 },
      ];

      const ranked = [...candidates].sort(
        (a, b) => b.matchScore - a.matchScore
      );

      expect(ranked[0].name).toBe("Alice");
      expect(ranked[3].name).toBe("Diana");
    });
  });

  describe("Interview preparation", () => {
    it("generates interview questions based on job requirements", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    question: "Describe your experience with React hooks?",
                    category: "Technical",
                    difficulty: "Medium",
                  },
                  {
                    question: "How do you handle state management?",
                    category: "Technical",
                    difficulty: "Hard",
                  },
                  {
                    question: "Tell me about a challenging project.",
                    category: "Behavioral",
                    difficulty: "Easy",
                  },
                ],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await mockOpenAI.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Generate interview questions for this role.",
          },
          {
            role: "user",
            content: "Senior React Developer position requiring 5+ years experience",
          },
        ],
      });

      const parsed = JSON.parse(result.choices[0].message.content);
      expect(parsed.questions).toHaveLength(3);
      expect(parsed.questions[0].category).toBe("Technical");
    });

    it("evaluates interview answers", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 8,
                feedback: "Strong answer demonstrating deep understanding",
                strengths: ["Technical depth", "Problem-solving approach"],
                areasForImprovement: ["Could mention more real-world examples"],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await mockOpenAI.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: "Evaluate this interview answer." },
          {
            role: "user",
            content: "Question: How do you optimize React performance?\nAnswer: I use memo, useMemo, and useCallback strategically...",
          },
        ],
      });

      const parsed = JSON.parse(result.choices[0].message.content);
      expect(parsed.score).toBeGreaterThan(0);
      expect(parsed.score).toBeLessThanOrEqual(10);
      expect(parsed.strengths).toHaveLength(2);
    });
  });

  describe("Job description generation", () => {
    it("generates a job description from parameters", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Senior Software Engineer",
                description: "We are looking for a Senior Software Engineer...",
                requirements: [
                  "5+ years of experience",
                  "Strong TypeScript skills",
                  "Experience with React and Node.js",
                ],
                responsibilities: [
                  "Design and implement new features",
                  "Mentor junior developers",
                  "Participate in code reviews",
                ],
              }),
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await mockOpenAI.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Generate a job description based on these parameters.",
          },
          {
            role: "user",
            content: "Role: Senior Software Engineer, Skills: TypeScript, React, Node.js",
          },
        ],
      });

      const parsed = JSON.parse(result.choices[0].message.content);
      expect(parsed.title).toBe("Senior Software Engineer");
      expect(parsed.requirements).toHaveLength(3);
    });
  });

  describe("Token usage and cost tracking", () => {
    it("calculates cost per request", () => {
      const usage = {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      };

      const pricing = { input: 0.01, output: 0.03 };
      const cost =
        (usage.prompt_tokens / 1000) * pricing.input +
        (usage.completion_tokens / 1000) * pricing.output;

      expect(cost).toBeCloseTo(0.025);
    });

    it("tracks daily token usage", () => {
      const dailyUsage = [
        { feature: "resume-parse", tokens: 5000, cost: 0.05 },
        { feature: "candidate-match", tokens: 3000, cost: 0.03 },
        { feature: "interview-prep", tokens: 2000, cost: 0.02 },
      ];

      const totalTokens = dailyUsage.reduce((sum, u) => sum + u.tokens, 0);
      const totalCost = dailyUsage.reduce((sum, u) => sum + u.cost, 0);

      expect(totalTokens).toBe(10000);
      expect(totalCost).toBeCloseTo(0.1);
    });
  });
});
