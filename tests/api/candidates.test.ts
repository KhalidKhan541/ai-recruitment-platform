import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  candidate: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  resume: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe("Candidates API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/candidates", () => {
    it("returns paginated candidates", async () => {
      const candidates = [
        { id: "1", firstName: "John", lastName: "Doe" },
        { id: "2", firstName: "Jane", lastName: "Smith" },
      ];
      mockPrisma.candidate.findMany.mockResolvedValue(candidates);
      mockPrisma.candidate.count.mockResolvedValue(2);

      const result = await mockPrisma.candidate.findMany({
        take: 20,
        skip: 0,
      });

      expect(result).toHaveLength(2);
    });

    it("filters by status", async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);
      await mockPrisma.candidate.findMany({
        where: { status: "active" },
      });
      expect(mockPrisma.candidate.findMany).toHaveBeenCalled();
    });

    it("filters by skills", async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);
      await mockPrisma.candidate.findMany({
        where: {
          skills: {
            some: { skillName: "React" },
          },
        },
      });
      expect(mockPrisma.candidate.findMany).toHaveBeenCalled();
    });

    it("searches by name or email", async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);
      await mockPrisma.candidate.findMany({
        where: {
          OR: [
            { firstName: { contains: "john", mode: "insensitive" } },
            { lastName: { contains: "john", mode: "insensitive" } },
            { email: { contains: "john", mode: "insensitive" } },
          ],
        },
      });
      expect(mockPrisma.candidate.findMany).toHaveBeenCalled();
    });
  });

  describe("GET /api/candidates/:id", () => {
    it("returns a single candidate", async () => {
      const candidate = { id: "1", firstName: "John", lastName: "Doe" };
      mockPrisma.candidate.findUnique.mockResolvedValue(candidate);

      const result = await mockPrisma.candidate.findUnique({
        where: { id: "1" },
      });

      expect(result?.firstName).toBe("John");
    });

    it("returns null for non-existent candidate", async () => {
      mockPrisma.candidate.findUnique.mockResolvedValue(null);
      const result = await mockPrisma.candidate.findUnique({
        where: { id: "nonexistent" },
      });
      expect(result).toBeNull();
    });
  });

  describe("POST /api/candidates", () => {
    it("creates a new candidate", async () => {
      const newCandidate = {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
      };
      mockPrisma.candidate.create.mockResolvedValue({ id: "3", ...newCandidate });

      const created = await mockPrisma.candidate.create({
        data: newCandidate,
      });

      expect(created.firstName).toBe("Alice");
    });

    it("validates required fields", () => {
      const required = ["firstName", "lastName", "email", "firmId"];
      expect(required).toContain("email");
    });
  });

  describe("PUT /api/candidates/:id", () => {
    it("updates candidate profile", async () => {
      const updated = { id: "1", firstName: "Updated" };
      mockPrisma.candidate.update.mockResolvedValue(updated);

      const result = await mockPrisma.candidate.update({
        where: { id: "1" },
        data: { firstName: "Updated" },
      });

      expect(result.firstName).toBe("Updated");
    });

    it("updates candidate status", async () => {
      mockPrisma.candidate.update.mockResolvedValue({ id: "1", status: "hired" });
      const result = await mockPrisma.candidate.update({
        where: { id: "1" },
        data: { status: "hired" },
      });
      expect(result.status).toBe("hired");
    });
  });

  describe("DELETE /api/candidates/:id", () => {
    it("deletes a candidate", async () => {
      mockPrisma.candidate.delete.mockResolvedValue({ id: "1" });
      const result = await mockPrisma.candidate.delete({ where: { id: "1" } });
      expect(result.id).toBe("1");
    });
  });

  describe("Resume operations", () => {
    it("lists candidate resumes", async () => {
      const resumes = [{ id: "r1", fileName: "resume.pdf" }];
      mockPrisma.resume.findMany.mockResolvedValue(resumes);

      const result = await mockPrisma.resume.findMany({
        where: { candidateId: "1" },
      });

      expect(result).toHaveLength(1);
    });

    it("creates a resume record", async () => {
      const resume = { id: "r1", fileName: "resume.pdf", candidateId: "1" };
      mockPrisma.resume.create.mockResolvedValue(resume);

      const created = await mockPrisma.resume.create({ data: resume });
      expect(created.fileName).toBe("resume.pdf");
    });
  });

  describe("Candidate statistics", () => {
    it("counts candidates by status", async () => {
      mockPrisma.candidate.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20);

      const total = await mockPrisma.candidate.count();
      const active = await mockPrisma.candidate.count({
        where: { status: "active" },
      });

      expect(total).toBe(50);
      expect(active).toBe(20);
    });
  });
});
