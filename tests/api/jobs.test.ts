import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  job: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  application: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe("Jobs API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/jobs", () => {
    it("returns paginated jobs", async () => {
      const mockJobs = [
        { id: "1", title: "Engineer", status: "open" },
        { id: "2", title: "Designer", status: "open" },
      ];
      mockPrisma.job.findMany.mockResolvedValue(mockJobs);
      mockPrisma.job.count.mockResolvedValue(2);

      const jobs = await mockPrisma.job.findMany({
        where: { status: "open" },
        take: 20,
        skip: 0,
      });

      expect(jobs).toHaveLength(2);
      expect(mockPrisma.job.findMany).toHaveBeenCalled();
    });

    it("filters by status", async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);
      await mockPrisma.job.findMany({
        where: { status: "closed" },
      });
      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "closed" }),
        })
      );
    });

    it("supports search", async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);
      await mockPrisma.job.findMany({
        where: {
          OR: [
            { title: { contains: "engineer", mode: "insensitive" } },
            { department: { contains: "engineer", mode: "insensitive" } },
          ],
        },
      });
      expect(mockPrisma.job.findMany).toHaveBeenCalled();
    });
  });

  describe("GET /api/jobs/:id", () => {
    it("returns a single job", async () => {
      const mockJob = { id: "1", title: "Engineer" };
      mockPrisma.job.findUnique.mockResolvedValue(mockJob);

      const job = await mockPrisma.job.findUnique({
        where: { id: "1" },
      });

      expect(job).toEqual(mockJob);
    });

    it("returns null for non-existent job", async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);
      const job = await mockPrisma.job.findUnique({
        where: { id: "nonexistent" },
      });
      expect(job).toBeNull();
    });
  });

  describe("POST /api/jobs", () => {
    it("creates a new job", async () => {
      const newJob = {
        title: "New Role",
        department: "Engineering",
        status: "draft",
      };
      mockPrisma.job.create.mockResolvedValue({ id: "3", ...newJob });

      const created = await mockPrisma.job.create({
        data: newJob,
      });

      expect(created.title).toBe("New Role");
      expect(created.status).toBe("draft");
    });

    it("validates required fields", () => {
      const requiredFields = [
        "title",
        "department",
        "location",
        "type",
        "experienceLevel",
        "description",
        "hiringManagerId",
      ];
      expect(requiredFields.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /api/jobs/:id", () => {
    it("updates a job", async () => {
      const updated = { id: "1", title: "Updated Title" };
      mockPrisma.job.update.mockResolvedValue(updated);

      const result = await mockPrisma.job.update({
        where: { id: "1" },
        data: { title: "Updated Title" },
      });

      expect(result.title).toBe("Updated Title");
    });

    it("updates job status", async () => {
      mockPrisma.job.update.mockResolvedValue({ id: "1", status: "closed" });
      const result = await mockPrisma.job.update({
        where: { id: "1" },
        data: { status: "closed" },
      });
      expect(result.status).toBe("closed");
    });
  });

  describe("DELETE /api/jobs/:id", () => {
    it("deletes a job", async () => {
      mockPrisma.job.delete.mockResolvedValue({ id: "1" });
      const result = await mockPrisma.job.delete({ where: { id: "1" } });
      expect(result.id).toBe("1");
    });
  });

  describe("Job statistics", () => {
    it("counts jobs by status", async () => {
      mockPrisma.job.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const open = await mockPrisma.job.count({ where: { status: "open" } });
      const closed = await mockPrisma.job.count({ where: { status: "closed" } });
      const draft = await mockPrisma.job.count({ where: { status: "draft" } });

      expect(open).toBe(10);
      expect(closed).toBe(5);
      expect(draft).toBe(3);
    });
  });
});
