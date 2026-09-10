import { useState, useMemo } from "react";
import { JobCard } from "./job-card";
import type { Job } from "./job-card";

interface JobListProps {
  jobs: Job[];
  onEdit?: (job: Job) => void;
  onPublish?: (job: Job) => void;
  onClose?: (job: Job) => void;
  onViewApplicants?: (job: Job) => void;
  onCreateNew?: () => void;
}

type SortOption = "newest" | "oldest" | "salary-high" | "salary-low" | "applicants";
type FilterStatus = Job["status"] | "all";
type FilterUrgency = Job["urgency"] | "all";

export function JobList({
  jobs,
  onEdit,
  onPublish,
  onClose,
  onViewApplicants,
  onCreateNew,
}: JobListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<FilterUrgency>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.department.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.hiringManager.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((job) => job.status === statusFilter);
    }

    if (urgencyFilter !== "all") {
      result = result.filter((job) => job.urgency === urgencyFilter);
    }

    switch (sortOption) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()
        );
        break;
      case "salary-high":
        result.sort((a, b) => b.salary.max - a.salary.max);
        break;
      case "salary-low":
        result.sort((a, b) => a.salary.min - b.salary.min);
        break;
      case "applicants":
        result.sort((a, b) => b.applicantsCount - a.applicantsCount);
        break;
    }

    return result;
  }, [jobs, searchQuery, sortOption, statusFilter, urgencyFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach((job) => {
      counts[job.status] = (counts[job.status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  const totalApplicants = useMemo(
    () => jobs.reduce((sum, job) => sum + job.applicantsCount, 0),
    [jobs]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length} positions · {totalApplicants} total applicants
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Position
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search positions by title, department, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="salary-high">Salary: High to Low</option>
            <option value="salary-low">Salary: Low to High</option>
            <option value="applicants">Most Applicants</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "draft", "open", "closed", "on-hold"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {status === "all" ? "All" : status.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  <span className="ml-1 text-xs opacity-75">({statusCounts[status] || 0})</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Urgency
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "low", "medium", "high", "critical"] as const).map((urgency) => (
                <button
                  key={urgency}
                  onClick={() => setUrgencyFilter(urgency)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    urgencyFilter === urgency
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {urgency === "all" ? "All" : urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter("all");
              setUrgencyFilter("all");
              setSearchQuery("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <svg
            className="mx-auto w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No positions found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Create a new position
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onPublish={onPublish}
              onClose={onClose}
              onViewApplicants={onViewApplicants}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default JobList;
