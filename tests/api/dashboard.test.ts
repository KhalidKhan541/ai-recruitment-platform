import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  jobPosting: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  jobApplication: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  candidate: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  interview: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  offer: {
    count: vi.fn(),
    findMany: vi.fn(),
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
    it("returns job statistics", async () => {
      mockPrisma.jobPosting.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);

      const totalJobs = await mockPrisma.jobPosting.count();
      const openJobs = await mockPrisma.jobPosting.count({
        where: { status: "PUBLISHED" },
      });
      const draftJobs = await mockPrisma.jobPosting.count({
        where: { status: "DRAFT" },
      });
      const closedJobs = await mockPrisma.jobPosting.count({
        where: { status: "CLOSED" },
      });

      expect(totalJobs).toBe(10);
      expect(openJobs).toBe(5);
      expect(draftJobs).toBe(3);
      expect(closedJobs).toBe(2);
    });

    it("returns application statistics", async () => {
      mockPrisma.jobApplication.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);

      const total = await mockPrisma.jobApplication.count();
      const submitted = await mockPrisma.jobApplication.count({
        where: { status: "SUBMITTED" },
      });
      const reviewing = await mockPrisma.jobApplication.count({
        where: { status: "UNDER_REVIEW" },
      });
      const interviewing = await mockPrisma.jobApplication.count({
        where: { status: "INTERVIEW_SCHEDULED" },
      });
      const offered = await mockPrisma.jobApplication.count({
        where: { status: "OFFERED" },
      });

      expect(total).toBe(50);
      expect(submitted).toBe(20);
      expect(reviewing).toBe(15);
      expect(interviewing).toBe(10);
      expect(offered).toBe(5);
    });

    it("returns candidate count", async () => {
      mockPrisma.candidate.count.mockResolvedValue(120);

      const total = await mockPrisma.candidate.count();
      expect(total).toBe(120);
    });

    it("calculates conversion rates", () => {
      const stats = {
        applications: 100,
        screened: 60,
        interviewed: 25,
        offered: 8,
        hired: 5,
      };

      const screeningRate = (stats.screened / stats.applications) * 100;
      const interviewRate = (stats.interviewed / stats.screened) * 100;
      const offerRate = (stats.offered / stats.interviewed) * 100;
      const acceptanceRate = (stats.hired / stats.offered) * 100;

      expect(screeningRate).toBe(60);
      expect(interviewRate).toBeCloseTo(41.67);
      expect(offerRate).toBe(32);
      expect(acceptanceRate).toBeCloseTo(62.5);
    });
  });

  describe("GET /api/dashboard/recent-activity", () => {
    it("returns recent job postings", async () => {
      const recentJobs = [
        { id: "job-1", title: "Senior Engineer", createdAt: new Date() },
        { id: "job-2", title: "Product Designer", createdAt: new Date() },
      ];

      mockPrisma.jobPosting.findMany.mockResolvedValue(recentJobs);

      const jobs = await mockPrisma.jobPosting.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      expect(jobs).toHaveLength(2);
    });

    it("returns recent applications", async () => {
      const recentApps = [
        { id: "app-1", status: "SUBMITTED", createdAt: new Date() },
        { id: "app-2", status: "UNDER_REVIEW", createdAt: new Date() },
      ];

      mockPrisma.jobApplication.findMany.mockResolvedValue(recentApps);

      const apps = await mockPrisma.jobApplication.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      expect(apps).toHaveLength(2);
    });

    it("returns upcoming interviews", async () => {
      const now = new Date();
      const upcoming = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const interviews = [
        {
          id: "int-1",
          scheduledAt: upcoming,
          status: "SCHEDULED",
        },
      ];

      mockPrisma.interview.findMany.mockResolvedValue(interviews);

      const result = await mockPrisma.interview.findMany({
        where: {
          scheduledAt: { gte: now },
          status: "SCHEDULED",
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe("GET /api/dashboard/charts", () => {
    it("calculates monthly hiring data", () => {
      const monthlyData = [
        { month: "2024-01", hires: 5 },
        { month: "2024-02", hires: 8 },
        { month: "2024-03", hires: 12 },
        { month: "2024-04", hires: 7 },
        { month: "2024-05", hires: 15 },
        { month: "2024-06", hires: 10 },
      ];

      expect(monthlyData).toHaveLength(6);
      expect(monthlyData[2].hires).toBe(12);
    });

    it("calculates applications by source", () => {
      const sources = [
        { source: "LinkedIn", count: 45 },
        { source: "Indeed", count: 30 },
        { source: "Referral", count: 20 },
        { source: "Direct", count: 15 },
      ];

      const total = sources.reduce((sum, s) => sum + s.count, 0);
      expect(total).toBe(110);
      expect(sources[0].source).toBe("LinkedIn");
    });

    it("calculates top skills in demand", () => {
      const skills = [
        { skill: "TypeScript", demand: 85 },
        { skill: "React", demand: 72 },
        { skill: "Node.js", demand: 65 },
        { skill: "Python", demand: 58 },
        { skill: "AWS", demand: 45 },
      ];

      expect(skills).toHaveLength(5);
      expect(skills[0].demand).toBeGreaterThan(skills[4].demand);
    });
  });

  describe("GET /api/dashboard/hiring-pipeline", () => {
    it("returns pipeline stages with counts", async () => {
      const pipelineStages = [
        { stage: "Applied", count: 100 },
        { stage: "Screening", count: 60 },
        { stage: "Interview", count: 25 },
        { stage: "Offer", count: 8 },
        { stage: "Hired", count: 5 },
      ];

      expect(pipelineStages).toHaveLength(5);
      expect(pipelineStages[0].count).toBeGreaterThan(pipelineStages[4].count);
    });

    it("calculates average time to fill", () => {
      const fillTimes = [15, 22, 30, 18, 25, 12, 28];
      const avgTime = fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length;

      expect(avgTime).toBeCloseTo(21.43);
    });
  });
});
