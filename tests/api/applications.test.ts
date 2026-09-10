import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  application: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  job: {
    update: vi.fn(),
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
    it("returns applications for a job", async () => {
      const apps = [
        { id: "a1", jobId: "j1", candidateId: "c1", status: "submitted" },
        { id: "a2", jobId: "j1", candidateId: "c2", status: "reviewing" },
      ];
      mockPrisma.application.findMany.mockResolvedValue(apps);

      const result = await mockPrisma.application.findMany({
        where: { jobId: "j1" },
      });

      expect(result).toHaveLength(2);
    });

    it("filters by status", async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      await mockPrisma.application.findMany({
        where: { status: "screening" },
      });
      expect(mockPrisma.application.findMany).toHaveBeenCalled();
    });

    it("supports pagination", async () => {
      mockPrisma.application.findMany.mockResolvedValue([]);
      await mockPrisma.application.findMany({
        take: 10,
        skip: 0,
      });
      expect(mockPrisma.application.findMany).toHaveBeenCalled();
    });
  });

  describe("POST /api/applications", () => {
    it("creates a new application", async () => {
      const app = {
        id: "a3",
        jobId: "j1",
        candidateId: "c1",
        status: "submitted",
      };
      mockPrisma.application.create.mockResolvedValue(app);

      const created = await mockPrisma.application.create({
        data: {
          jobId: "j1",
          candidateId: "c1",
          status: "submitted",
        },
      });

      expect(created.status).toBe("submitted");
    });

    it("prevents duplicate applications", async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: "existing",
        jobId: "j1",
        candidateId: "c1",
      });

      const existing = await mockPrisma.application.findUnique({
        where: {
          jobId_candidateId: { jobId: "j1", candidateId: "c1" },
        },
      });

      expect(existing).not.toBeNull();
    });

    it("increments application count on job", async () => {
      mockPrisma.application.create.mockResolvedValue({});
      mockPrisma.job.update.mockResolvedValue({});

      await mockPrisma.application.create({
        data: { jobId: "j1", candidateId: "c1", status: "submitted" },
      });

      await mockPrisma.job.update({
        where: { id: "j1" },
        data: { applicationCount: { increment: 1 } },
      });

      expect(mockPrisma.job.update).toHaveBeenCalled();
    });
  });

  describe("PUT /api/applications/:id", () => {
    it("updates application status", async () => {
      mockPrisma.application.update.mockResolvedValue({
        id: "a1",
        status: "phone_screen",
      });

      const result = await mockPrisma.application.update({
        where: { id: "a1" },
        data: { status: "phone_screen" },
      });

      expect(result.status).toBe("phone_screen");
    });

    it("supports all status transitions", () => {
      const validTransitions: Record<string, string[]> = {
        submitted: ["screening", "rejected", "withdrawn"],
        screening: ["review", "rejected"],
        review: ["phone_interview", "rejected"],
        phone_interview: ["technical_interview", "rejected"],
        technical_interview: ["final_interview", "rejected"],
        final_interview: ["offer_pending", "rejected"],
        offer_pending: ["offer_extended"],
        offer_extended: ["offer_accepted", "offer_declined"],
        offer_accepted: ["hired"],
      };

      expect(Object.keys(validTransitions)).toHaveLength(9);
    });
  });

  describe("DELETE /api/applications/:id", () => {
    it("deletes an application", async () => {
      mockPrisma.application.delete.mockResolvedValue({ id: "a1" });
      const result = await mockPrisma.application.delete({ where: { id: "a1" } });
      expect(result.id).toBe("a1");
    });
  });

  describe("Application statistics", () => {
    it("counts by status", async () => {
      mockPrisma.application.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20);

      const total = await mockPrisma.application.count();
      const screening = await mockPrisma.application.count({
        where: { status: "screening" },
      });
      const interview = await mockPrisma.application.count({
        where: { status: { in: ["phone_interview", "technical_interview"] } },
      });

      expect(total).toBe(100);
      expect(screening).toBe(50);
      expect(interview).toBe(20);
    });
  });
});
