import { useState } from "react";
import { cn, formatCurrency, formatDate, formatRelativeTime, truncate } from "@/lib/utils";

export interface JobCardData {
  id: string;
  title: string;
  department: string;
  location: string;
  isRemote: boolean;
  type: string;
  experienceLevel: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  status: string;
  vacancies: number;
  applicationCount: number;
  publishedAt?: string | null;
  closingDate?: string | null;
  tags?: string[];
  company?: {
    name: string;
    logoUrl?: string | null;
  };
  hiringManager?: {
    name: string;
    avatarUrl?: string | null;
  };
  _count?: {
    applications: number;
    interviews: number;
  };
}

interface JobCardProps {
  job: JobCardData;
  variant?: "default" | "compact" | "featured";
  onView?: (job: JobCardData) => void;
  onEdit?: (job: JobCardData) => void;
  onPublish?: (job: JobCardData) => void;
  onClose?: (job: JobCardData) => void;
  onDuplicate?: (job: JobCardData) => void;
  onArchive?: (job: JobCardData) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400" },
  OPEN: { label: "Open", color: "text-emerald-600", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  ON_HOLD: { label: "On Hold", color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500" },
  CLOSED: { label: "Closed", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-400" },
  ARCHIVED: { label: "Archived", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-300" },
  CANCELLED: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", dot: "bg-red-300" },
};

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

const experienceLabels: Record<string, string> = {
  ENTRY: "Entry Level",
  MID: "Mid Level",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
};

export function JobCard({
  job,
  variant = "default",
  onView,
  onEdit,
  onPublish,
  onClose: onCloseJob,
  onDuplicate,
  onArchive,
  className,
}: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const status = statusConfig[job.status] || statusConfig.DRAFT;

  const salaryRange =
    job.salaryMin && job.salaryMax
      ? `${formatCurrency(job.salaryMin, job.salaryCurrency)} – ${formatCurrency(job.salaryMax, job.salaryCurrency)}`
      : job.salaryMin
      ? `From ${formatCurrency(job.salaryMin, job.salaryCurrency)}`
      : null;

  const daysOpen = job.publishedAt
    ? Math.ceil(
        (Date.now() - new Date(job.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const applicationRate =
    daysOpen && daysOpen > 0
      ? (job.applicationCount / daysOpen).toFixed(1)
      : null;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group",
          className
        )}
        onClick={() => onView?.(job)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {job.title.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {job.department} · {job.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">{job.applicationCount} apps</span>
          <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full", status.bg, status.color)}>
            {status.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group",
        variant === "featured" && "ring-2 ring-blue-500/20 border-blue-200",
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {job.company?.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={job.company.name}
                className="w-11 h-11 rounded-xl object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {job.title.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3
                className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                onClick={() => onView?.(job)}
              >
                {job.title}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {job.company?.name || job.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full", status.bg, status.color)}>
              <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", status.dot)} />
              {status.label}
            </span>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20">
                  <button onClick={() => { onView?.(job); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Details
                  </button>
                  {onEdit && (
                    <button onClick={() => { onEdit(job); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>
                  )}
                  {onPublish && job.status === "DRAFT" && (
                    <button onClick={() => { onPublish(job); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Publish
                    </button>
                  )}
                  {onDuplicate && (
                    <button onClick={() => { onDuplicate(job); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Duplicate
                    </button>
                  )}
                  {onArchive && (
                    <button onClick={() => { onArchive(job); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      Archive
                    </button>
                  )}
                  {onCloseJob && job.status !== "CLOSED" && (
                    <button onClick={() => { onCloseJob(job); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Close Job
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {job.location}
          </span>
          {job.isRemote && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium">Remote</span>
          )}
          <span>·</span>
          <span>{typeLabels[job.employmentType] || job.employmentType}</span>
          <span>·</span>
          <span>{experienceLabels[job.experienceLevel] || job.experienceLevel}</span>
        </div>

        {salaryRange && (
          <p className="text-sm font-semibold text-gray-900 mb-3">{salaryRange}</p>
        )}

        {variant !== "compact" && job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
                {tag}
              </span>
            ))}
            {job.tags.length > 4 && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
                +{job.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="p-2.5 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Applications</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{job.applicationCount}</p>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Vacancies</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{job.vacancies}</p>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Per Day</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{applicationRate || "—"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.hiringManager && (
            <div className="flex items-center gap-1.5">
              {job.hiringManager.avatarUrl ? (
                <img src={job.hiringManager.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-[8px] font-bold">
                  {job.hiringManager.name.charAt(0)}
                </div>
              )}
              <span className="text-xs text-gray-500">{job.hiringManager.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {daysOpen !== null && (
            <span className="text-[10px] text-gray-400">{daysOpen}d open</span>
          )}
          {job.closingDate && (
            <span className="text-[10px] text-gray-400">Closes {formatDate(job.closingDate)}</span>
          )}
          <button
            onClick={() => onView?.(job)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View →
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
