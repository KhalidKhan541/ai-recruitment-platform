import { useState } from "react";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

export interface ApplicationData {
  id: string;
  status: string;
  coverLetter?: string | null;
  source?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  candidate: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    headline?: string | null;
    user?: {
      name: string;
      avatarUrl?: string | null;
    };
  };
  job: {
    id: string;
    title: string;
    department?: string | null;
  };
  matchScore?: number | null;
  screeningAnswers?: { questionId: string; answer: string }[];
}

interface ApplicationCardProps {
  application: ApplicationData;
  onView?: (app: ApplicationData) => void;
  onAdvance?: (app: ApplicationData) => void;
  onReject?: (app: ApplicationData) => void;
  onScheduleInterview?: (app: ApplicationData) => void;
  onAddNote?: (app: ApplicationData) => void;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; nextAction?: string }> = {
  NEW: { label: "New", color: "text-blue-600", bg: "bg-blue-100", nextAction: "Screen" },
  SUBMITTED: { label: "Submitted", color: "text-blue-600", bg: "bg-blue-100", nextAction: "Review" },
  SCREENING: { label: "Screening", color: "text-indigo-600", bg: "bg-indigo-100", nextAction: "Phone Screen" },
  REVIEW: { label: "In Review", color: "text-purple-600", bg: "bg-purple-100", nextAction: "Interview" },
  PHONE_SCREEN: { label: "Phone Screen", color: "text-cyan-600", bg: "bg-cyan-100", nextAction: "Technical" },
  PHONE_INTERVIEW: { label: "Phone Interview", color: "text-cyan-600", bg: "bg-cyan-100", nextAction: "Technical" },
  TECHNICAL: { label: "Technical", color: "text-blue-600", bg: "bg-blue-100", nextAction: "Onsite" },
  TECHNICAL_INTERVIEW: { label: "Technical Interview", color: "text-blue-600", bg: "bg-blue-100", nextAction: "Final" },
  ONSITE: { label: "Onsite", color: "text-violet-600", bg: "bg-violet-100", nextAction: "Offer" },
  FINAL_INTERVIEW: { label: "Final Interview", color: "text-violet-600", bg: "bg-violet-100", nextAction: "Offer" },
  OFFER: { label: "Offer", color: "text-emerald-600", bg: "bg-emerald-100" },
  OFFER_PENDING: { label: "Offer Pending", color: "text-amber-600", bg: "bg-amber-100" },
  OFFER_EXTENDED: { label: "Offer Extended", color: "text-emerald-600", bg: "bg-emerald-100" },
  OFFER_ACCEPTED: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-100" },
  OFFER_DECLINED: { label: "Declined", color: "text-red-600", bg: "bg-red-100" },
  HIRED: { label: "Hired", color: "text-emerald-700", bg: "bg-emerald-100" },
  REJECTED: { label: "Rejected", color: "text-red-600", bg: "bg-red-100" },
  WITHDRAWN: { label: "Withdrawn", color: "text-gray-600", bg: "bg-gray-100" },
};

export function ApplicationCard({
  application,
  onView,
  onAdvance,
  onReject,
  onScheduleInterview,
  onAddNote,
  compact = false,
  className,
}: ApplicationCardProps) {
  const [showActions, setShowActions] = useState(false);

  const status = statusConfig[application.status] || statusConfig.NEW;
  const candidateName =
    application.candidate.name ||
    `${application.candidate.firstName || ""} ${application.candidate.lastName || ""}`.trim() ||
    "Unknown";

  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50";
    if (score >= 75) return "text-blue-600 bg-blue-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group",
          className
        )}
        onClick={() => onView?.(application)}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {application.candidate.user?.avatarUrl ? (
            <img src={application.candidate.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{candidateName}</p>
          <p className="text-xs text-gray-500 truncate">{application.job.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {application.matchScore != null && (
            <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full", getScoreColor(application.matchScore))}>
              {application.matchScore}%
            </span>
          )}
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
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {application.candidate.user?.avatarUrl ? (
                  <img src={application.candidate.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {application.matchScore != null && (
                <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white", getScoreColor(application.matchScore))}>
                  {application.matchScore}
                </div>
              )}
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => onView?.(application)}
              >
                {candidateName}
              </h3>
              <p className="text-sm text-gray-500">{application.candidate.headline || application.candidate.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Applied {formatRelativeTime(application.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full", status.bg, status.color)}>
              {status.label}
            </span>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20">
                  <button onClick={() => { onView?.(application); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                    View Profile
                  </button>
                  {onScheduleInterview && (
                    <button onClick={() => { onScheduleInterview(application); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Schedule Interview
                    </button>
                  )}
                  {onAddNote && (
                    <button onClick={() => { onAddNote(application); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                      Add Note
                    </button>
                  )}
                  {onReject && (
                    <button onClick={() => { onReject(application); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {application.rating != null && (
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={cn("w-4 h-4", star <= application.rating! ? "text-amber-400" : "text-gray-200")}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )}

        {application.coverLetter && (
          <div className="p-3 bg-gray-50 rounded-xl mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Cover Letter</p>
            <p className="text-sm text-gray-700 line-clamp-2">{application.coverLetter}</p>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {application.job.title}
          </span>
          {application.source && (
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px]">{application.source}</span>
          )}
        </div>
      </div>

      {status.nextAction && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Next: {status.nextAction}</span>
          <div className="flex items-center gap-2">
            {onAdvance && (
              <button
                onClick={() => onAdvance(application)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {status.nextAction}
              </button>
            )}
            <button
              onClick={() => onView?.(application)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Details →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationCard;
