import { useState, useMemo } from "react";
import { cn, groupBy } from "@/lib/utils";
import { JobCard, type JobCardData } from "./job-card";

export type SortField = "title" | "applications" | "created" | "closing" | "status";
export type SortOrder = "asc" | "desc";
export type ViewMode = "grid" | "list" | "board";

interface JobListProps {
  jobs: JobCardData[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onView?: (job: JobCardData) => void;
  onEdit?: (job: JobCardData) => void;
  onPublish?: (job: JobCardData) => void;
  onClose?: (job: JobCardData) => void;
  onDuplicate?: (job: JobCardData) => void;
  onArchive?: (job: JobCardData) => void;
  onFilterChange?: (filters: Record<string, unknown>) => void;
  onSortChange?: (field: SortField, order: SortOrder) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const statusOrder: Record<string, number> = {
  OPEN: 0,
  DRAFT: 1,
  ON_HOLD: 2,
  CLOSED: 3,
  ARCHIVED: 4,
  CANCELLED: 5,
};

export function JobList({
  jobs,
  viewMode = "grid",
  onViewModeChange,
  onView,
  onEdit,
  onPublish,
  onClose,
  onDuplicate,
  onArchive,
  onFilterChange,
  onSortChange,
  loading = false,
  emptyMessage = "No jobs found",
  className,
}: JobListProps) {
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    onSortChange?.(field, newOrder);
  };

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    if (filterStatus !== "all") {
      result = result.filter((j) => j.status === filterStatus);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "applications":
          cmp = a.applicationCount - b.applicationCount;
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case "created":
          cmp = new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
          break;
        case "closing":
          cmp = new Date(a.closingDate || "9999").getTime() - new Date(b.closingDate || "9999").getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return result;
  }, [jobs, sortField, sortOrder, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  const statusFilters = ["all", "OPEN", "DRAFT", "ON_HOLD", "CLOSED"];
  const sortOptions: { field: SortField; label: string }[] = [
    { field: "created", label: "Date Posted" },
    { field: "applications", label: "Applications" },
    { field: "title", label: "Title" },
    { field: "status", label: "Status" },
    { field: "closing", label: "Closing Date" },
  ];

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-16 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                onFilterChange?.({ status: status === "all" ? undefined : status });
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {status === "all" ? "All" : status.replace("_", " ")}
              <span className="ml-1 text-[10px] opacity-70">{statusCounts[status] || 0}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="px-2 py-1.5 text-xs text-gray-600 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((opt) => (
              <option key={opt.field} value={opt.field}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className={cn("w-4 h-4 transition-transform", sortOrder === "desc" && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(["grid", "list", "board"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange?.(mode)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                  viewMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {mode === "grid" && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                )}
                {mode === "list" && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                )}
                {mode === "board" && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onView={onView}
              onEdit={onEdit}
              onPublish={onPublish}
              onClose={onClose}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
            />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant="compact"
              onView={onView}
              onEdit={onEdit}
              onPublish={onPublish}
              onClose={onClose}
              onDuplicate={onDuplicate}
              onArchive={onArchive}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(groupBy(filteredJobs, (j) => j.status)).map(([status, statusJobs]) => {
            const cfg = { label: status.replace("_", " "), color: "text-gray-700", bg: "bg-gray-100" };
            return (
              <div key={status} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={cn("w-2 h-2 rounded-full", cfg.bg.replace("bg-", "bg-"))} />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cfg.label}</h3>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{statusJobs.length}</span>
                </div>
                <div className="space-y-3">
                  {statusJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      variant="compact"
                      onView={onView}
                      onEdit={onEdit}
                      onPublish={onPublish}
                      onClose={onClose}
                      onDuplicate={onDuplicate}
                      onArchive={onArchive}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default JobList;
