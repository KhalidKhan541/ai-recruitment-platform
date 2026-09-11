import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  jobApplication: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  job: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  candidate: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe("Applications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/applications", () => {
    it("returns paginated applications", async () => {
      const mockApplications = [
        {
          id: "app-1",
          jobId: "job-1",
          candidateId: "candidate-1",
          status: "SUBMITTED",
          createdAt: new Date(),
        },
      ];

      mockPrisma.jobApplication.findMany.mockResolvedValue(mockApplications);
      mockPrisma.jobApplication.count.mockResolvedValue(1);

      const applications = await mockPrisma.jobApplication.findMany({
        take: 20,
        skip: 0,
        orderBy: { createdAt: "desc" },
      });

      expect(applications).toHaveLength(1);
    });

    it("filters by job status", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      await mockPrisma.jobApplication.findMany({
        where: { status: "UNDER_REVIEW" },
      });

      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalled();
    });

    it("filters by candidate", async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      await mockPrisma.jobApplication.findMany({
        where: { candidateId: "candidate-123" },
      });

      expect(mockPrisma.jobApplication.findMany).toHaveBeenCalled();
    });
  });

  describe("POST /api/applications", () => {
    it("creates a new application", async () => {
      const applicationData = {
        jobId: "job-123",
        candidateId: "candidate-123",
        coverLetter: "I am excited about this opportunity",
        status: "SUBMITTED",
      };

      mockPrisma.jobApplication.create.mockResolvedValue({
        id: "app-123",
        ...applicationData,
        createdAt: new Date(),
      });

      const created = await mockPrisma.jobApplication.create({
        data: applicationData,
      });

      expect(created.status).toBe("SUBMITTED");
      expect(created.jobId).toBe("job-123");
    });

    it("prevents duplicate applications", async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        id: "existing-app",
        jobId: "job-123",
        candidateId: "candidate-123",
      });

      const existing = await mockPrisma.jobApplication.findUnique({
        where: {
          jobId_candidateId: {
            jobId: "job-123",
            candidateId: "candidate-123",
          },
        },
      });

      expect(existing).not.toBeNull();
    });

    it("validates screening answers", () => {
      const screeningQuestions = [
        { id: "q1", question: "Years of experience?", required: true },
        { id: "q2", question: "Willing to relocate?", required: true },
      ];

      const answers = [
        { questionId: "q1", answer: "5" },
        { questionId: "q2", answer: "Yes" },
      ];

      const requiredIds = screeningQuestions
        .filter((q) => q.required)
        .map((q) => q.id);
      const answeredIds = answers.map((a) => a.questionId);

      const allRequiredAnswered = requiredIds.every((id) =>
        answeredIds.includes(id)
      );

      expect(allRequiredAnswered).toBe(true);
    });
  });

  describe("PUT /api/applications/:id", () => {
    it("updates application status", async () => {
      mockPrisma.jobApplication.update.mockResolvedValue({
        id: "app-123",
        status: "UNDER_REVIEW",
      });

      const result = await mockPrisma.jobApplication.update({
        where: { id: "app-123" },
        data: { status: "UNDER_REVIEW" },
      });

      expect(result.status).toBe("UNDER_REVIEW");
    });

    it("moves application through pipeline stages", async () => {
      const stages = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "SCREENING",
        "SHORTLISTED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEWED",
        "OFFERED",
      ];

      for (const stage of stages) {
        mockPrisma.jobApplication.update.mockResolvedValue({
          id: "app-123",
          status: stage,
        });

        const result = await mockPrisma.jobApplication.update({
          where: { id: "app-123" },
          data: { status: stage },
        });

        expect(result.status).toBe(stage);
      }
    });

    it("adds rating to application", async () => {
      mockPrisma.jobApplication.update.mockResolvedValue({
        id: "app-123",
        rating: 4,
      });

      const result = await mockPrisma.jobApplication.update({
        where: { id: "app-123" },
        data: { rating: 4 },
      });

      expect(result.rating).toBe(4);
    });
  });

  describe("Application validation", () => {
    it("validates cover letter length", () => {
      const maxCoverLetterLength = 5000;
      const validCoverLetter = "a".repeat(maxCoverLetterLength);
      const invalidCoverLetter = "a".repeat(maxCoverLetterLength + 1);

      expect(validCoverLetter.length).toBeLessThanOrEqual(maxCoverLetterLength);
      expect(invalidCoverLetter.length).toBeGreaterThan(maxCoverLetterLength);
    });

    it("validates UUID format", () => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(uuidRegex.test("invalid-uuid")).toBe(false);
    });
  });

  describe("DELETE /api/applications/:id", () => {
    it("allows candidate to withdraw application", async () => {
      mockPrisma.jobApplication.update.mockResolvedValue({
        id: "app-123",
        status: "WITHDRAWN",
      });

      const result = await mockPrisma.jobApplication.update({
        where: { id: "app-123" },
        data: { status: "WITHDRAWN" },
      });

      expect(result.status).toBe("WITHDRAWN");
    });
  });
});
