import { useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface CandidateCardData {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string | null;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  profileImage?: string | null;
  user?: {
    name: string;
    avatarUrl?: string | null;
  };
  status: string;
  isAvailable?: boolean;
  skills?: {
    name: string;
    level: string;
    yearsOfExperience?: number | null;
    isVerified?: boolean;
  }[];
  experience?: number | null;
  education?: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
  }[];
  linkedInUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  matchScore?: number | null;
  aiScore?: number | null;
  applications?: { id: string; jobTitle: string; status: string }[];
  createdAt?: string;
  lastActiveAt?: string | null;
  tags?: string[];
}

interface CandidateCardProps {
  candidate: CandidateCardData;
  variant?: "default" | "compact" | "detailed";
  onView?: (candidate: CandidateCardData) => void;
  onContact?: (candidate: CandidateCardData) => void;
  onAddToPool?: (candidate: CandidateCardData) => void;
  onScheduleInterview?: (candidate: CandidateCardData) => void;
  onEdit?: (candidate: CandidateCardData) => void;
  selected?: boolean;
  onSelect?: (candidate: CandidateCardData) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: "text-emerald-600", bg: "bg-emerald-100" },
  PASSIVE: { label: "Passive", color: "text-amber-600", bg: "bg-amber-100" },
  NOT_INTERESTED: { label: "Not Interested", color: "text-gray-500", bg: "bg-gray-100" },
  BLACKLISTED: { label: "Blacklisted", color: "text-red-600", bg: "bg-red-100" },
  HIRED: { label: "Hired", color: "text-blue-600", bg: "bg-blue-100" },
  ARCHIVED: { label: "Archived", color: "text-gray-400", bg: "bg-gray-50" },
};

const levelColors: Record<string, string> = {
  BEGINNER: "bg-gray-100 text-gray-600",
  INTERMEDIATE: "bg-blue-50 text-blue-700",
  ADVANCED: "bg-indigo-50 text-indigo-700",
  EXPERT: "bg-purple-50 text-purple-700",
};

export function CandidateCard({
  candidate,
  variant = "default",
  onView,
  onContact,
  onAddToPool,
  onScheduleInterview,
  onEdit,
  selected = false,
  onSelect,
  className,
}: CandidateCardProps) {
  const [showActions, setShowActions] = useState(false);

  const status = statusConfig[candidate.status] || statusConfig.ACTIVE;
  const candidateName =
    candidate.name ||
    `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
    "Unknown";

  const initials = candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayScore = candidate.matchScore ?? candidate.aiScore;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 bg-white rounded-xl border transition-all cursor-pointer group",
          selected ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20" : "border-gray-200 hover:border-blue-300 hover:shadow-sm",
          className
        )}
        onClick={() => onSelect?.(candidate)}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {candidate.profileImage || candidate.user?.avatarUrl ? (
            <img
              src={candidate.profileImage || candidate.user?.avatarUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{candidateName}</p>
          <p className="text-xs text-gray-500 truncate">{candidate.headline || candidate.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {displayScore != null && (
            <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border", getScoreColor(displayScore))}>
              {displayScore}
            </span>
          )}
          {candidate.isAvailable && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Available" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden group",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200",
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {candidate.profileImage || candidate.user?.avatarUrl ? (
                  <img
                    src={candidate.profileImage || candidate.user?.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              {candidate.isAvailable && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <h3
                className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => onView?.(candidate)}
              >
                {candidateName}
              </h3>
              <p className="text-sm text-gray-500">{candidate.headline || "—"}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                {candidate.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {candidate.location}
                  </span>
                )}
                {candidate.experience != null && (
                  <span>{candidate.experience}y exp</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {displayScore != null && (
              <div className={cn("px-3 py-1.5 rounded-xl text-center border", getScoreColor(displayScore))}>
                <p className="text-lg font-bold leading-none">{displayScore}</p>
                <p className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">Score</p>
              </div>
            )}
            <span className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full", status.bg, status.color)}>
              {status.label}
            </span>
          </div>
        </div>

        {candidate.skills && candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {candidate.skills.slice(0, 6).map((skill, i) => (
              <span
                key={i}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded-full flex items-center gap-1",
                  levelColors[skill.level] || "bg-gray-100 text-gray-600"
                )}
              >
                {skill.name}
                {skill.isVerified && (
                  <svg className="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
            ))}
            {candidate.skills.length > 6 && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
                +{candidate.skills.length - 6}
              </span>
            )}
          </div>
        )}

        {variant === "detailed" && candidate.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{candidate.summary}</p>
        )}

        {candidate.applications && candidate.applications.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Active Applications</p>
            <div className="space-y-1">
              {candidate.applications.slice(0, 2).map((app, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-700 truncate">{app.jobTitle}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{app.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {candidate.tags && candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {candidate.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {candidate.linkedinUrl && (
            <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          )}
          {candidate.githubUrl && (
            <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            </a>
          )}
          {candidate.portfolioUrl && (
            <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            </a>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {candidate.lastActiveAt && (
            <span className="text-[10px] text-gray-400">Active {formatRelativeTime(candidate.lastActiveAt)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onContact && (
            <button
              onClick={() => onContact(candidate)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact
            </button>
          )}
          {onScheduleInterview && (
            <button
              onClick={() => onScheduleInterview(candidate)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Interview
            </button>
          )}
          <button
            onClick={() => onView?.(candidate)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Profile →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateCard;
