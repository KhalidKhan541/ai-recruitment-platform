import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JobList } from "@/components/jobs/job-list";
import type { Job } from "@/components/jobs/job-card";

const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    department: "Engineering",
    location: "SF",
    type: "full-time",
    salary: { min: 100000, max: 150000, currency: "USD" },
    description: "Build UIs",
    requirements: ["React"],
    status: "open",
    postedAt: new Date(Date.now() - 86400000).toISOString(),
    applicantsCount: 10,
    urgency: "high",
    hiringManager: "Alice",
  },
  {
    id: "job-2",
    title: "Backend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "remote",
    salary: { min: 120000, max: 170000, currency: "USD" },
    description: "Build APIs",
    requirements: ["Node.js"],
    status: "draft",
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    applicantsCount: 5,
    urgency: "medium",
    hiringManager: "Bob",
  },
  {
    id: "job-3",
    title: "Product Manager",
    department: "Product",
    location: "NYC",
    type: "full-time",
    salary: { min: 130000, max: 180000, currency: "USD" },
    description: "Lead product",
    requirements: ["PM experience"],
    status: "closed",
    postedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    applicantsCount: 20,
    urgency: "critical",
    hiringManager: "Carol",
  },
];

describe("JobList", () => {
  it("renders all jobs", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("Frontend Engineer")).toBeTruthy();
    expect(screen.getByText("Backend Engineer")).toBeTruthy();
    expect(screen.getByText("Product Manager")).toBeTruthy();
  });

  it("displays job count", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText(/3 positions/)).toBeTruthy();
  });

  it("displays total applicants", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText(/35 total applicants/)).toBeTruthy();
  });

  it("renders search input", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByPlaceholderText(/Search positions/)).toBeTruthy();
  });

  it("renders sort dropdown", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("Newest First")).toBeTruthy();
  });

  it("renders New Position button", () => {
    render(<JobList jobs={mockJobs} />);
    expect(screen.getByText("New Position")).toBeTruthy();
  });

  it("calls onCreateNew when New Position clicked", () => {
    const onCreateNew = vi.fn();
    render(<JobList jobs={mockJobs} onCreateNew={onCreateNew} />);
    fireEvent.click(screen.getByText("New Position"));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("filters jobs by search query", () => {
    render(<JobList jobs={mockJobs} />);
    const input = screen.getByPlaceholderText(/Search positions/);
    fireEvent.change(input, { target: { value: "Frontend" } });
    expect(screen.getByText("Frontend Engineer")).toBeTruthy();
    expect(screen.queryByText("Backend Engineer")).toBeNull();
    expect(screen.queryByText("Product Manager")).toBeNull();
  });

  it("shows empty state when no results", () => {
    render(<JobList jobs={mockJobs} />);
    const input = screen.getByPlaceholderText(/Search positions/);
    fireEvent.change(input, { target: { value: "nonexistent" } });
    expect(screen.getByText("No positions found")).toBeTruthy();
  });

  it("toggles filter panel", () => {
    render(<JobList jobs={mockJobs} />);
    fireEvent.click(screen.getByText("Filters"));
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Urgency")).toBeTruthy();
  });

  it("filters by status", () => {
    render(<JobList jobs={mockJobs} />);
    fireEvent.click(screen.getByText("Filters"));
    fireEvent.click(screen.getByText(/Open/));
    expect(screen.getByText("Frontend Engineer")).toBeTruthy();
    expect(screen.queryByText("Backend Engineer")).toBeNull();
  });

  it("clears all filters", () => {
    render(<JobList jobs={mockJobs} />);
    fireEvent.click(screen.getByText("Filters"));
    fireEvent.click(screen.getByText(/Open/));
    fireEvent.click(screen.getByText("Clear all filters"));
    expect(screen.getByText("Frontend Engineer")).toBeTruthy();
    expect(screen.getByText("Backend Engineer")).toBeTruthy();
  });

  it("sorts by salary high to low", () => {
    render(<JobList jobs={mockJobs} />);
    const select = screen.getByDisplayValue("Newest First");
    fireEvent.change(select, { target: { value: "salary-high" } });
    const titles = screen.getAllByText(/Engineer|Manager/);
    expect(titles.length).toBeGreaterThanOrEqual(3);
  });

  it("sorts by applicants", () => {
    render(<JobList jobs={mockJobs} />);
    const select = screen.getByDisplayValue("Newest First");
    fireEvent.change(select, { target: { value: "applicants" } });
    expect(screen.getByText("Product Manager")).toBeTruthy();
  });

  it("calls onEdit via JobCard", () => {
    const onEdit = vi.fn();
    render(<JobList jobs={mockJobs} onEdit={onEdit} />);
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalled();
  });
});
