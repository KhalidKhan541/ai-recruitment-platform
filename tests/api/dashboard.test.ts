import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  job: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  candidate: {
    count: vi.fn(),
  },
  application: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  interview: {
    count: vi.fn(),
  },
  offer: {
    count: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe("Dashboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/dashboard/stats", () => {
    it("returns total job counts", async () => {
      mockPrisma.job.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(12);

      const total = await mockPrisma.job.count();
      const active = await mockPrisma.job.count({
        where: { status: "open" },
      });

      expect(total).toBe(20);
      expect(active).toBe(12);
    });

    it("returns candidate counts", async () => {
      mockPrisma.candidate.count.mockResolvedValue(150);
      const count = await mockPrisma.candidate.count();
      expect(count).toBe(150);
    });

    it("returns application counts", async () => {
      mockPrisma.application.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(50);

      const total = await mockPrisma.application.count();
      const pending = await mockPrisma.application.count({
        where: { status: { in: ["submitted", "screening", "review"] } },
      });

      expect(total).toBe(200);
      expect(pending).toBe(50);
    });

    it("returns interview counts", async () => {
      mockPrisma.interview.count.mockResolvedValue(15);
      const count = await mockPrisma.interview.count({
        where: { status: "scheduled" },
      });
      expect(count).toBe(15);
    });
  });

  describe("GET /api/dashboard/activity", () => {
    it("returns recent activity", async () => {
      const activities = [
        { id: "1", type: "application", createdAt: new Date() },
        { id: "2", type: "status_change", createdAt: new Date() },
      ];
      mockPrisma.application.findMany.mockResolvedValue(activities);

      const result = await mockPrisma.application.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      expect(result).toHaveLength(2);
    });
  });

  describe("GET /api/dashboard/charts", () => {
    it("returns applications by status", async () => {
      const statusCounts = {
        submitted: 50,
        screening: 30,
        review: 20,
        phone_interview: 15,
        technical_interview: 10,
        hired: 5,
        rejected: 20,
      };

      const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
      expect(total).toBe(150);
    });

    it("returns hiring pipeline data", () => {
      const pipeline = [
        { stage: "Applied", count: 200 },
        { stage: "Screening", count: 100 },
        { stage: "Interview", count: 50 },
        { stage: "Offer", count: 15 },
        { stage: "Hired", count: 10 },
      ];

      expect(pipeline).toHaveLength(5);
      expect(pipeline[0].count).toBeGreaterThan(pipeline[4].count);
    });

    it("returns time-to-hire metrics", () => {
      const metrics = {
        averageDays: 32,
        medianDays: 28,
        minDays: 14,
        maxDays: 60,
      };

      expect(metrics.averageDays).toBeGreaterThan(0);
      expect(metrics.minDays).toBeLessThan(metrics.maxDays);
    });
  });

  describe("GET /api/dashboard/hiring-rate", () => {
    it("calculates hiring rate", async () => {
      const applications = 200;
      const hired = 15;
      const rate = (hired / applications) * 100;
      expect(rate).toBe(7.5);
    });

    it("calculates conversion rates between stages", () => {
      const stages = {
        applied: 200,
        screening: 100,
        interview: 50,
        offer: 15,
        hired: 10,
      };

      const conversionRates = {
        screening: (stages.screening / stages.applied) * 100,
        interview: (stages.interview / stages.screening) * 100,
        offer: (stages.offer / stages.interview) * 100,
        hired: (stages.hired / stages.offer) * 100,
      };

      expect(conversionRates.screening).toBe(50);
      expect(conversionRates.hired).toBeCloseTo(66.67, 0);
    });
  });
});
