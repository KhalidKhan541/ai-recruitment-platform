import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockJob = {
  id: "job-123",
  title: "Senior Software Engineer",
  department: "Engineering",
  location: "San Francisco, CA",
  isRemote: false,
  type: "full_time",
  experienceLevel: "senior",
  salary: { min: 150000, max: 200000, currency: "USD", period: "yearly", isNegotiable: true },
  status: "open",
  applicationCount: 25,
  createdAt: new Date("2024-01-15"),
};

function JobCard({ job }: { job: typeof mockJob }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{job.title}</h3>
      <p className="text-gray-600">{job.department}</p>
      <p className="text-gray-500">{job.location}</p>
      {job.isRemote && <span className="badge">Remote</span>}
      {job.salary && (
        <p className="text-green-600">
          ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
        </p>
      )}
      <span className="status">{job.status}</span>
      <p className="text-sm text-gray-400">{job.applicationCount} applications</p>
    </div>
  );
}

describe("JobCard Component", () => {
  it("renders job title", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Senior Software Engineer")).toBeTruthy();
  });

  it("renders department and location", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Engineering")).toBeTruthy();
    expect(screen.getByText("San Francisco, CA")).toBeTruthy();
  });

  it("renders salary range when available", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("$150,000 - $200,000")).toBeTruthy();
  });

  it("hides salary when null", () => {
    const jobNoSalary = { ...mockJob, salary: null };
    render(<JobCard job={jobNoSalary} />);
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it("shows remote badge when isRemote is true", () => {
    const remoteJob = { ...mockJob, isRemote: true };
    render(<JobCard job={remoteJob} />);
    expect(screen.getByText("Remote")).toBeTruthy();
  });

  it("hides remote badge when isRemote is false", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.queryByText("Remote")).toBeNull();
  });

  it("renders application count", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("25 applications")).toBeTruthy();
  });

  it("renders job status", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("open")).toBeTruthy();
  });
});

describe("JobCard with different statuses", () => {
  it("renders draft status", () => {
    const draftJob = { ...mockJob, status: "draft" };
    render(<JobCard job={draftJob} />);
    expect(screen.getByText("draft")).toBeTruthy();
  });

  it("renders closed status", () => {
    const closedJob = { ...mockJob, status: "closed" };
    render(<JobCard job={closedJob} />);
    expect(screen.getByText("closed")).toBeTruthy();
  });

  it("renders archived status", () => {
    const archivedJob = { ...mockJob, status: "archived" };
    render(<JobCard job={archivedJob} />);
    expect(screen.getByText("archived")).toBeTruthy();
  });
});
