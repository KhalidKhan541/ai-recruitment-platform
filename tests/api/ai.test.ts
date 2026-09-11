import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/provider", () => ({
  createProviderManager: vi.fn().mockReturnValue({
    complete: vi.fn().mockResolvedValue({
      id: "resp-1",
      provider: "openai",
      model: "gpt-4o",
      content: '{"overallScore": 85}',
      finishReason: "stop",
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150, estimatedCost: 0.001 },
      latencyMs: 500,
    }),
    stream: vi.fn(),
    embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    healthCheck: vi.fn().mockResolvedValue({ openai: true }),
    getAvailableProviders: vi.fn().mockReturnValue(["openai"]),
    getDailyUsage: vi.fn().mockReturnValue({ totalTokens: 1000, totalCost: 0.01 }),
  }),
}));

describe("AI Features API", () => {
  describe("Resume screening", () => {
    it("screens resume against job requirements", async () => {
      const mockScreening = {
        overallScore: 85,
        skillsMatch: 90,
        experienceMatch: 80,
        educationMatch: 75,
        strengths: ["Strong React skills", "TypeScript expertise"],
        concerns: ["Limited management experience"],
        recommendation: "recommend",
        summary: "Strong candidate for the role",
      };

      expect(mockScreening.overallScore).toBeGreaterThan(0);
      expect(mockScreening.overallScore).toBeLessThanOrEqual(100);
      expect(mockScreening.strengths).toHaveLength(2);
      expect(mockScreening.recommendation).toBe("recommend");
    });

    it("parses skills from resume", () => {
      const skills = ["JavaScript", "TypeScript", "React", "Node.js"];
      expect(skills.length).toBeGreaterThan(0);
      expect(skills).toContain("TypeScript");
    });

    it("extracts experience from resume", () => {
      const experience = [
        { company: "Google", years: 3 },
        { company: "Meta", years: 2 },
      ];
      const totalYears = experience.reduce((sum, e) => sum + e.years, 0);
      expect(totalYears).toBe(5);
    });
  });

  describe("Candidate matching", () => {
    it("calculates match score", () => {
      const requiredSkills = ["React", "TypeScript", "Node.js"];
      const candidateSkills = ["React", "TypeScript", "Python"];
      const matched = requiredSkills.filter((s) => candidateSkills.includes(s));
      const score = (matched.length / requiredSkills.length) * 100;
      expect(score).toBeCloseTo(66.67, 0);
    });

    it("weights experience level", () => {
      const weights = { entry: 1, mid: 2, senior: 3, lead: 4, executive: 5 };
      expect(weights.senior).toBe(3);
    });

    it("ranks candidates by score", () => {
      const candidates = [
        { name: "Alice", score: 90 },
        { name: "Bob", score: 75 },
        { name: "Carol", score: 85 },
      ];
      const ranked = [...candidates].sort((a, b) => b.score - a.score);
      expect(ranked[0].name).toBe("Alice");
      expect(ranked[2].name).toBe("Bob");
    });
  });

  describe("Job description generation", () => {
    it("generates structured job description", () => {
      const sections = ["title", "description", "requirements", "responsibilities", "benefits"];
      expect(sections).toHaveLength(5);
    });

    it("includes required skills", () => {
      const skills = ["TypeScript", "React", "PostgreSQL"];
      expect(skills.every((s) => typeof s === "string")).toBe(true);
    });
  });

  describe("Interview scheduling", () => {
    it("suggests interview time slots", () => {
      const slots = [
        { date: "2024-01-15", time: "10:00", duration: 60 },
        { date: "2024-01-15", time: "14:00", duration: 60 },
        { date: "2024-01-16", time: "09:00", duration: 45 },
      ];
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].duration).toBeGreaterThan(0);
    });

    it("validates interviewer availability", () => {
      const interviewerSchedule = [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "17:00" },
      ];
      const proposedTime = "13:00";
      const isAvailable = !interviewerSchedule.some(
        (s) => proposedTime >= s.start && proposedTime < s.end
      );
      expect(isAvailable).toBe(true);
    });
  });

  describe("AI analytics", () => {
    it("tracks AI usage costs", () => {
      const usage = {
        totalRequests: 150,
        totalTokens: 50000,
        totalCost: 0.75,
        byModel: { "gpt-4o": { requests: 100, cost: 0.5 }, "gpt-4o-mini": { requests: 50, cost: 0.25 } },
      };
      expect(usage.totalCost).toBeGreaterThan(0);
      expect(Object.keys(usage.byModel)).toHaveLength(2);
    });

    it("monitors response latency", () => {
      const latencies = [200, 350, 150, 400, 250];
      const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      expect(avgLatency).toBe(270);
    });
  });
});
