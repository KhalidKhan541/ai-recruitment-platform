import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobCard } from "@/components/jobs/job-card";
import type { Job } from "@/components/jobs/job-card";

const mockJob: Job = {
  id: "job-1",
  title: "Senior Frontend Engineer",
  department: "Engineering",
  location: "San Francisco, CA",
  type: "full-time",
  salary: { min: 120000, max: 180000, currency: "USD" },
  description: "We are looking for a senior frontend engineer to join our team.",
  requirements: ["5+ years React", "TypeScript proficiency", "System design"],
  status: "open",
  postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  applicantsCount: 12,
  urgency: "high",
  hiringManager: "Sarah Chen",
  aiScore: 87,
};

const draftJob: Job = {
  ...mockJob,
  id: "job-2",
  status: "draft",
  urgency: "low",
  aiScore: undefined,
};

const closedJob: Job = {
  ...mockJob,
  id: "job-3",
  status: "closed",
  urgency: "critical",
};

describe("JobCard", () => {
  it("renders job title", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Senior Frontend Engineer")).toBeTruthy();
  });

  it("renders department and location", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/Engineering/)).toBeTruthy();
    expect(screen.getByText(/San Francisco/)).toBeTruthy();
  });

  it("renders salary range", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/\$120,000/)).toBeTruthy();
    expect(screen.getByText(/\$180,000/)).toBeTruthy();
  });

  it("renders applicant count", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/12 applicants/)).toBeTruthy();
  });

  it("renders status badge", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Open")).toBeTruthy();
  });

  it("renders urgency badge", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("high")).toBeTruthy();
  });

  it("renders AI match score when provided", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/AI Match Score: 87%/)).toBeTruthy();
  });

  it("does not render AI score when undefined", () => {
    render(<JobCard job={draftJob} />);
    expect(screen.queryByText(/AI Match Score/)).toBeNull();
  });

  it("shows Show details button", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Show details")).toBeTruthy();
  });

  it("expands details on click", () => {
    render(<JobCard job={mockJob} />);
    fireEvent.click(screen.getByText("Show details"));
    expect(screen.getByText("Show less")).toBeTruthy();
    expect(screen.getByText(mockJob.description)).toBeTruthy();
  });

  it("collapses details on second click", () => {
    render(<JobCard job={mockJob} />);
    fireEvent.click(screen.getByText("Show details"));
    fireEvent.click(screen.getByText("Show less"));
    expect(screen.getByText("Show details")).toBeTruthy();
  });

  it("shows requirements when expanded", () => {
    render(<JobCard job={mockJob} />);
    fireEvent.click(screen.getByText("Show details"));
    expect(screen.getByText("5+ years React")).toBeTruthy();
  });

  it("shows hiring manager when expanded", () => {
    render(<JobCard job={mockJob} />);
    fireEvent.click(screen.getByText("Show details"));
    expect(screen.getByText("Sarah Chen")).toBeTruthy();
  });

  it("shows Publish button for draft jobs", () => {
    render(<JobCard job={draftJob} />);
    expect(screen.getByText("Publish")).toBeTruthy();
  });

  it("does not show Publish button for open jobs", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.queryByText("Publish")).toBeNull();
  });

  it("shows Close button for open jobs", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText("Close")).toBeTruthy();
  });

  it("does not show Close button for draft jobs", () => {
    render(<JobCard job={draftJob} />);
    expect(screen.queryByText("Close")).toBeNull();
  });

  it("calls onPublish when Publish clicked", () => {
    const onPublish = vi.fn();
    render(<JobCard job={draftJob} onPublish={onPublish} />);
    fireEvent.click(screen.getByText("Publish"));
    expect(onPublish).toHaveBeenCalledWith(draftJob);
  });

  it("calls onClose when Close clicked", () => {
    const onClose = vi.fn();
    render(<JobCard job={mockJob} onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledWith(mockJob);
  });

  it("calls onEdit when Edit clicked", () => {
    const onEdit = vi.fn();
    render(<JobCard job={mockJob} onEdit={onEdit} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(mockJob);
  });

  it("calls onViewApplicants when View Applicants clicked", () => {
    const onViewApplicants = vi.fn();
    render(<JobCard job={mockJob} onViewApplicants={onViewApplicants} />);
    fireEvent.click(screen.getByText(/View Applicants/));
    expect(onViewApplicants).toHaveBeenCalledWith(mockJob);
  });

  it("renders days since posted", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/5d ago/)).toBeTruthy();
  });

  it("renders type icon", () => {
    const { container } = render(<JobCard job={mockJob} />);
    expect(container.textContent).toContain("🏢");
  });

  it("shows critical urgency bar", () => {
    const { container } = render(<JobCard job={closedJob} />);
    const bar = container.querySelector(".from-red-500");
    expect(bar).toBeTruthy();
  });

  it("renders View Applicants with count", () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/View Applicants \(12\)/)).toBeTruthy();
  });
});
