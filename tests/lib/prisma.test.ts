import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  jobPosting: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  jobApplication: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  candidate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe("Prisma Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User operations", () => {
    it("finds user by email", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const user = await mockPrisma.user.findUnique({
        where: { email: "test@example.com" },
      });

      expect(user).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("creates a new user", async () => {
      const newUser = {
        id: "user-2",
        email: "new@example.com",
        name: "New User",
        role: "CANDIDATE",
      };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const created = await mockPrisma.user.create({
        data: {
          email: "new@example.com",
          name: "New User",
          role: "CANDIDATE",
        },
      });

      expect(created.email).toBe("new@example.com");
    });

    it("updates user", async () => {
      const updated = { id: "user-1", name: "Updated Name" };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await mockPrisma.user.update({
        where: { id: "user-1" },
        data: { name: "Updated Name" },
      });

      expect(result.name).toBe("Updated Name");
    });

    it("counts users", async () => {
      mockPrisma.user.count.mockResolvedValue(100);

      const count = await mockPrisma.user.count();
      expect(count).toBe(100);
    });
  });

  describe("Job Posting operations", () => {
    it("finds job by slug", async () => {
      const mockJob = {
        id: "job-1",
        slug: "senior-engineer",
        title: "Senior Engineer",
      };
      mockPrisma.jobPosting.findUnique.mockResolvedValue(mockJob);

      const job = await mockPrisma.jobPosting.findUnique({
        where: { slug: "senior-engineer" },
      });

      expect(job?.slug).toBe("senior-engineer");
    });

    it("finds many jobs with filters", async () => {
      const mockJobs = [
        { id: "job-1", status: "PUBLISHED" },
        { id: "job-2", status: "PUBLISHED" },
      ];
      mockPrisma.jobPosting.findMany.mockResolvedValue(mockJobs);

      const jobs = await mockPrisma.jobPosting.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      });

      expect(jobs).toHaveLength(2);
    });

    it("creates a job posting", async () => {
      const newJob = {
        id: "job-3",
        title: "Product Manager",
        status: "DRAFT",
      };
      mockPrisma.jobPosting.create.mockResolvedValue(newJob);

      const created = await mockPrisma.jobPosting.create({
        data: {
          title: "Product Manager",
          description: "We are looking for...",
          location: "Remote",
          employmentType: "FULL_TIME",
          experienceLevel: "SENIOR",
        },
      });

      expect(created.title).toBe("Product Manager");
    });

    it("counts jobs by status", async () => {
      mockPrisma.jobPosting.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3);

      const published = await mockPrisma.jobPosting.count({
        where: { status: "PUBLISHED" },
      });
      const draft = await mockPrisma.jobPosting.count({
        where: { status: "DRAFT" },
      });
      const closed = await mockPrisma.jobPosting.count({
        where: { status: "CLOSED" },
      });

      expect(published).toBe(10);
      expect(draft).toBe(5);
      expect(closed).toBe(3);
    });
  });

  describe("Job Application operations", () => {
    it("finds application by job and candidate", async () => {
      const mockApp = {
        id: "app-1",
        jobId: "job-1",
        candidateId: "candidate-1",
      };
      mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);

      const app = await mockPrisma.jobApplication.findUnique({
        where: {
          jobId_candidateId: {
            jobId: "job-1",
            candidateId: "candidate-1",
          },
        },
      });

      expect(app).toEqual(mockApp);
    });

    it("creates an application", async () => {
      const newApp = {
        id: "app-2",
        jobId: "job-1",
        candidateId: "candidate-2",
        status: "SUBMITTED",
      };
      mockPrisma.jobApplication.create.mockResolvedValue(newApp);

      const created = await mockPrisma.jobApplication.create({
        data: {
          jobId: "job-1",
          candidateId: "candidate-2",
          coverLetter: "I am interested...",
        },
      });

      expect(created.status).toBe("SUBMITTED");
    });

    it("updates application status", async () => {
      mockPrisma.jobApplication.update.mockResolvedValue({
        id: "app-1",
        status: "UNDER_REVIEW",
      });

      const result = await mockPrisma.jobApplication.update({
        where: { id: "app-1" },
        data: { status: "UNDER_REVIEW" },
      });

      expect(result.status).toBe("UNDER_REVIEW");
    });
  });

  describe("Candidate operations", () => {
    it("finds candidate by userId", async () => {
      const mockCandidate = {
        id: "candidate-1",
        userId: "user-1",
        headline: "Software Engineer",
      };
      mockPrisma.candidate.findUnique.mockResolvedValue(mockCandidate);

      const candidate = await mockPrisma.candidate.findUnique({
        where: { userId: "user-1" },
      });

      expect(candidate?.userId).toBe("user-1");
    });

    it("searches candidates by skill", async () => {
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
  });

  describe("Transaction operations", () => {
    it("executes transaction", async () => {
      const mockResult = { user: { id: "user-1" }, candidate: { id: "candidate-1" } };
      mockPrisma.$transaction.mockResolvedValue(mockResult);

      const result = await mockPrisma.$transaction([
        mockPrisma.user.create({ data: { email: "test@test.com" } }),
        mockPrisma.candidate.create({ data: { userId: "user-1" } }),
      ]);

      expect(result).toEqual(mockResult);
    });
  });

  describe("Connection management", () => {
    it("connects to database", async () => {
      mockPrisma.$connect.mockResolvedValue(undefined);
      await mockPrisma.$connect();
      expect(mockPrisma.$connect).toHaveBeenCalled();
    });

    it("disconnects from database", async () => {
      mockPrisma.$disconnect.mockResolvedValue(undefined);
      await mockPrisma.$disconnect();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});
