import { useState } from "react";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "remote";
  salary: { min: number; max: number; currency: string };
  description: string;
  requirements: string[];
  status: "draft" | "open" | "closed" | "on-hold";
  postedAt: string;
  applicantsCount: number;
  urgency: "low" | "medium" | "high" | "critical";
  hiringManager: string;
  aiScore?: number;
}

interface JobCardProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onPublish?: (job: Job) => void;
  onClose?: (job: Job) => void;
  onViewApplicants?: (job: Job) => void;
}

const statusColors: Record<Job["status"], string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  open: "bg-emerald-50 text-emerald-700 border-emerald-300",
  closed: "bg-red-50 text-red-700 border-red-300",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-300",
};

const urgencyColors: Record<Job["urgency"], string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  critical: "bg-red-100 text-red-600 animate-pulse",
};

const typeIcons: Record<Job["type"], string> = {
  "full-time": "🏢",
  "part-time": "⏰",
  contract: "📋",
  remote: "🌍",
};

export function JobCard({
  job,
  onEdit,
  onPublish,
  onClose,
  onViewApplicants,
}: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatSalary = (min: number, max: number, currency: string) => {
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n);
    return `${fmt(min)} – ${fmt(max)}`;
  };

  const daysSincePosted = Math.floor(
    (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {job.urgency === "critical" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{typeIcons[job.type]}</span>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {job.title}
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              {job.department} · {job.location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                statusColors[job.status]
              }`}
            >
              {job.status.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                urgencyColors[job.urgency]
              }`}
            >
              {job.urgency}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.applicantsCount} applicants
          </span>
          <span className="text-gray-400">
            Posted {daysSincePosted === 0 ? "today" : `${daysSincePosted}d ago`}
          </span>
        </div>

        {job.aiScore !== undefined && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-indigo-50 rounded-lg">
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-sm font-medium text-indigo-700">
              AI Match Score: {job.aiScore}%
            </span>
            <div className="flex-1 h-1.5 bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${job.aiScore}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          {expanded ? "Show less" : "Show details"}
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Requirements</h4>
              <ul className="space-y-1">
                {job.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-gray-500">
              Hiring Manager: <span className="font-medium text-gray-700">{job.hiringManager}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {job.status === "draft" && (
            <button
              onClick={() => onPublish?.(job)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Publish
            </button>
          )}
          {job.status === "open" && (
            <button
              onClick={() => onClose?.(job)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewApplicants?.(job)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Applicants ({job.applicantsCount})
          </button>
          <button
            onClick={() => onEdit?.(job)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
