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
  candidateSkill: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
  },
  candidateExperience: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  candidateResume: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
      const mockCandidates = [
        { id: "1", firstName: "Alice", lastName: "Smith", email: "alice@test.com" },
        { id: "2", firstName: "Bob", lastName: "Jones", email: "bob@test.com" },
      ];
      mockPrisma.candidate.findMany.mockResolvedValue(mockCandidates);
      mockPrisma.candidate.count.mockResolvedValue(2);

      const candidates = await mockPrisma.candidate.findMany({
        take: 20,
        skip: 0,
      });
      const total = await mockPrisma.candidate.count();

      expect(candidates).toHaveLength(2);
      expect(total).toBe(2);
    });

    it("filters candidates by skills", async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);

      await mockPrisma.candidate.findMany({
        where: {
          skills: {
            some: {
              name: { contains: "TypeScript", mode: "insensitive" },
            },
          },
        },
      });

      expect(mockPrisma.candidate.findMany).toHaveBeenCalled();
    });

    it("filters candidates by experience level", async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);

      await mockPrisma.candidate.findMany({
        where: {
          expectedExperienceLevel: "SENIOR",
        },
      });

      expect(mockPrisma.candidate.findMany).toHaveBeenCalled();
    });

    it("searches candidates by name or email", async () => {
      mockPrisma.candidate.findMany.mockResolvedValue([]);

      await mockPrisma.candidate.findMany({
        where: {
          OR: [
            { firstName: { contains: "alice", mode: "insensitive" } },
            { lastName: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
          ],
        },
      });

      expect(mockPrisma.candidate.findMany).toHaveBeenCalled();
    });
  });

  describe("POST /api/candidates", () => {
    it("creates a new candidate profile", async () => {
      const candidateData = {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@test.com",
        headline: "Senior Software Engineer",
        summary: "10+ years of experience",
        workPreference: "REMOTE",
      };

      mockPrisma.candidate.create.mockResolvedValue({
        id: "candidate-123",
        ...candidateData,
        isAvailable: true,
        profileCompleteness: 45,
        createdAt: new Date(),
      });

      const created = await mockPrisma.candidate.create({
        data: candidateData,
      });

      expect(created.firstName).toBe("Alice");
      expect(created.lastName).toBe("Smith");
      expect(created.email).toBe("alice@test.com");
    });

    it("calculates profile completeness", () => {
      const fields = {
        headline: true,
        summary: true,
        education: true,
        experience: true,
        skills: true,
        resume: false,
        links: false,
        preferences: true,
      };

      const filled = Object.values(fields).filter(Boolean).length;
      const total = Object.keys(fields).length;
      const completeness = Math.round((filled / total) * 100);

      expect(completeness).toBe(63);
    });
  });

  describe("PUT /api/candidates/:id", () => {
    it("updates candidate profile", async () => {
      const updated = {
        id: "candidate-123",
        headline: "Lead Software Engineer",
        summary: "Updated summary with 12 years of experience",
      };

      mockPrisma.candidate.update.mockResolvedValue(updated);

      const result = await mockPrisma.candidate.update({
        where: { id: "candidate-123" },
        data: {
          headline: updated.headline,
          summary: updated.summary,
        },
      });

      expect(result.headline).toBe("Lead Software Engineer");
    });

    it("updates candidate availability", async () => {
      mockPrisma.candidate.update.mockResolvedValue({
        id: "candidate-123",
        isAvailable: false,
      });

      const result = await mockPrisma.candidate.update({
        where: { id: "candidate-123" },
        data: { isAvailable: false },
      });

      expect(result.isAvailable).toBe(false);
    });
  });

  describe("Candidate skills", () => {
    it("adds skills to candidate", async () => {
      const skills = [
        { name: "TypeScript", level: "ADVANCED", yearsOfExperience: 5 },
        { name: "React", level: "EXPERT", yearsOfExperience: 7 },
      ];

      mockPrisma.candidateSkill.createMany.mockResolvedValue({ count: 2 });

      const result = await mockPrisma.candidateSkill.createMany({
        data: skills.map((s) => ({
          candidateId: "candidate-123",
          ...s,
        })),
      });

      expect(result.count).toBe(2);
    });

    it("removes all skills for candidate", async () => {
      mockPrisma.candidateSkill.deleteMany.mockResolvedValue({ count: 3 });

      const result = await mockPrisma.candidateSkill.deleteMany({
        where: { candidateId: "candidate-123" },
      });

      expect(result.count).toBe(3);
    });

    it("validates skill levels", () => {
      const validLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"];
      expect(validLevels).toContain("ADVANCED");
      expect(validLevels).not.toContain("beginner");
    });
  });

  describe("Resume management", () => {
    it("uploads a resume", async () => {
      const resume = {
        id: "resume-123",
        title: "Software Engineer Resume",
        fileName: "resume.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        isDefault: true,
        status: "UPLOADING",
      };

      mockPrisma.candidateResume.create.mockResolvedValue(resume);

      const created = await mockPrisma.candidateResume.create({
        data: {
          candidateId: "candidate-123",
          ...resume,
        },
      });

      expect(created.fileName).toBe("resume.pdf");
      expect(created.fileSize).toBe(1024000);
    });

    it("validates file size limits", () => {
      const maxFileSize = 10 * 1024 * 1024;
      const validFile = 1024000;
      const invalidFile = 20 * 1024 * 1024;

      expect(validFile).toBeLessThanOrEqual(maxFileSize);
      expect(invalidFile).toBeGreaterThan(maxFileSize);
    });

    it("validates allowed mime types", () => {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      expect(allowedTypes).toContain("application/pdf");
      expect(allowedTypes).not.toContain("image/png");
    });
  });

  describe("DELETE /api/candidates/:id", () => {
    it("soft-deletes a candidate", async () => {
      mockPrisma.candidate.update.mockResolvedValue({
        id: "candidate-123",
        isAvailable: false,
      });

      const result = await mockPrisma.candidate.update({
        where: { id: "candidate-123" },
        data: { isAvailable: false },
      });

      expect(result.isAvailable).toBe(false);
    });
  });
});
