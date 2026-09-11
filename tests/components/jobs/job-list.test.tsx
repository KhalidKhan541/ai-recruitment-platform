import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

const mockJobs = [
  {
    id: "job-1",
    title: "Software Engineer",
    department: "Engineering",
    location: "Remote",
    status: "open",
    applicationCount: 15,
  },
  {
    id: "job-2",
    title: "Product Designer",
    department: "Design",
    location: "New York",
    status: "open",
    applicationCount: 8,
  },
  {
    id: "job-3",
    title: "Data Scientist",
    department: "Analytics",
    location: "San Francisco",
    status: "closed",
    applicationCount: 22,
  },
];

function JobList({ jobs }: { jobs: typeof mockJobs }) {
  if (jobs.length === 0) {
    return <div data-testid="empty-state">No jobs found</div>;
  }

  return (
    <div data-testid="job-list">
      {jobs.map((job) => (
        <div key={job.id} className="job-item">
          <h3>{job.title}</h3>
          <p>{job.department}</p>
          <p>{job.location}</p>
          <span>{job.applicationCount} applications</span>
        </div>
      ))}
    </div>
  );
}

describe("JobList Component", () => {
  it("renders all jobs", () => {
    render(<JobList jobs={mockJobs} />);
    const items = screen.getAllByText(/applications/);
    expect(items).toHaveLength(3);
  });

  it("renders job titles", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("Software Engineer")).toBeTruthy();
    expect(screen.getByText("Product Designer")).toBeTruthy();
    expect(screen.getByText("Data Scientist")).toBeTruthy();
  });

  it("shows empty state when no jobs", () => {
    render(<JobList jobs={[]} />);
    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });

  it("renders correct application counts", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("15 applications")).toBeTruthy();
    expect(screen.getByText("8 applications")).toBeTruthy();
    expect(screen.getByText("22 applications")).toBeTruthy();
  });

  it("renders departments", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("Engineering")).toBeTruthy();
    expect(screen.getByText("Design")).toBeTruthy();
    expect(screen.getByText("Analytics")).toBeTruthy();
  });

  it("renders locations", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("Remote")).toBeTruthy();
    expect(screen.getByText("New York")).toBeTruthy();
    expect(screen.getByText("San Francisco")).toBeTruthy();
  });
});

describe("JobList filtering", () => {
  it("filters jobs by department", () => {
    const filtered = mockJobs.filter((j) => j.department === "Engineering");
    render(<JobList jobs={filtered} />);
    expect(screen.getByText("Software Engineer")).toBeTruthy();
    expect(screen.queryByText("Product Designer")).toBeNull();
  });

  it("filters jobs by status", () => {
    const filtered = mockJobs.filter((j) => j.status === "open");
    render(<JobList jobs={filtered} />);
    expect(screen.getByText("Software Engineer")).toBeTruthy();
    expect(screen.getByText("Product Designer")).toBeTruthy();
    expect(screen.queryByText("Data Scientist")).toBeNull();
  });

  it("filters jobs by location", () => {
    const filtered = mockJobs.filter((j) => j.location === "Remote");
    render(<JobList jobs={filtered} />);
    expect(screen.getByText("Software Engineer")).toBeTruthy();
    expect(screen.queryByText("Product Designer")).toBeNull();
  });
});
