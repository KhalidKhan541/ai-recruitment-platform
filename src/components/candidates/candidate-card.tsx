import { useState } from "react";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  title: string;
  location: string;
  experience: number;
  education: string;
  skills: string[];
  status: "active" | "passive" | "not-interested" | "hired";
  source: "linkedin" | "referral" | "job-board" | "direct" | "agency";
  resumeScore: number;
  aiMatchScore?: number;
  lastActive: string;
  appliedJobs: string[];
  tags: string[];
  notes?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

interface CandidateCardProps {
  candidate: Candidate;
  onSelect?: (candidate: Candidate) => void;
  onAddToPipeline?: (candidate: Candidate) => void;
  onSendMessage?: (candidate: Candidate) => void;
  onTag?: (candidate: Candidate, tag: string) => void;
  viewMode?: "grid" | "list";
}

const statusConfig: Record<
  Candidate["status"],
  { label: string; color: string; dot: string }
> = {
  active: { label: "Active", color: "text-emerald-700", dot: "bg-emerald-500" },
  passive: { label: "Passive", color: "text-amber-700", dot: "bg-amber-500" },
  "not-interested": {
    label: "Not Interested",
    color: "text-gray-500",
    dot: "bg-gray-400",
  },
  hired: { label: "Hired", color: "text-blue-700", dot: "bg-blue-500" },
};

const sourceIcons: Record<Candidate["source"], string> = {
  linkedin: "in",
  referral: "👤",
  "job-board": "📋",
  direct: "✉️",
  agency: "🏢",
};

export function CandidateCard({
  candidate,
  onSelect,
  onAddToPipeline,
  onSendMessage,
  onTag,
  viewMode = "grid",
}: CandidateCardProps) {
  const [showActions, setShowActions] = useState(false);
  const config = statusConfig[candidate.status];

  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-emerald-400 to-green-500";
    if (score >= 60) return "from-blue-400 to-cyan-500";
    if (score >= 40) return "from-amber-400 to-orange-500";
    return "from-red-400 to-pink-500";
  };

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
        onClick={() => onSelect?.(candidate)}
      >
        <div className="relative flex-shrink-0">
          {candidate.avatar ? (
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-11 h-11 rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${config.dot}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {candidate.name}
            </h3>
            <span className={`text-xs ${config.color}`}>{config.label}</span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {candidate.title} · {candidate.location}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase">Match</p>
            <p className="text-sm font-bold text-gray-900">
              {candidate.aiMatchScore ?? candidate.resumeScore}%
            </p>
          </div>
          <div className="flex gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            {sourceIcons[candidate.source]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
      onClick={() => onSelect?.(candidate)}
    >
      <div className="h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="px-5 -mt-8 relative z-10">
        <div className="flex items-end justify-between">
          <div className="relative">
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-16 h-16 rounded-xl border-3 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl border-3 border-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {initials}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${config.dot}`}
            />
          </div>

          {candidate.aiMatchScore !== undefined && (
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreGradient(
                candidate.aiMatchScore
              )} flex items-center justify-center text-white font-bold text-sm shadow-md`}
            >
              {candidate.aiMatchScore}
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
          <p className="text-sm text-gray-500">{candidate.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {candidate.location}
            <span>·</span>
            <span>{candidate.experience} years</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 5 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{candidate.skills.length - 5} more
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {candidate.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-medium uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span>Source: {candidate.source.replace("-", " ")}</span>
          <span>·</span>
          <span>
            Last active:{" "}
            {new Date(candidate.lastActive).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      <div
        className="px-5 py-3 mt-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onAddToPipeline?.(candidate)}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add to Pipeline
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSendMessage?.(candidate)}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          {candidate.socialLinks?.linkedin && (
            <a
              href={candidate.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-700 transition-colors"
              title="LinkedIn"
            >
              <span className="text-xs font-bold">in</span>
            </a>
          )}
          {candidate.socialLinks?.github && (
            <a
              href={candidate.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
              title="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateCard;
