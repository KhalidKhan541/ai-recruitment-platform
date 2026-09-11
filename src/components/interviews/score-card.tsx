import { useState } from "react";
import { cn } from "@/lib/utils";

export interface InterviewScoreData {
  id: string;
  interviewId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewType: string;
  interviewDate: string;
  overallRating: number;
  recommendation: "strong-hire" | "hire" | "neutral" | "no-hire" | "strong-no-hire";
  categories: {
    name: string;
    score: number;
    maxScore: number;
    comments?: string;
  }[];
  interviewer: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  strengths: string[];
  weaknesses: string[];
  notes?: string;
  wouldWorkWithAgain?: boolean;
  submittedAt: string;
}

interface ScoreCardProps {
  score: InterviewScoreData;
  variant?: "summary" | "detailed" | "input";
  onViewCandidate?: (candidateId: string) => void;
  onViewInterview?: (interviewId: string) => void;
  onEditScore?: (score: InterviewScoreData) => void;
  editable?: boolean;
  className?: string;
}

const recommendationConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  "strong-hire": { label: "Strong Hire", color: "text-emerald-700", bg: "bg-emerald-100", icon: "👍👍" },
  hire: { label: "Hire", color: "text-green-700", bg: "bg-green-100", icon: "👍" },
  neutral: { label: "Neutral", color: "text-gray-600", bg: "bg-gray-100", icon: "—" },
  "no-hire": { label: "No Hire", color: "text-orange-700", bg: "bg-orange-100", icon: "👎" },
  "strong-no-hire": { label: "Strong No Hire", color: "text-red-700", bg: "bg-red-100", icon: "👎👎" },
};

export function ScoreCard({
  score,
  variant = "summary",
  onViewCandidate,
  onViewInterview,
  onEditScore,
  editable = false,
  className,
}: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rec = recommendationConfig[score.recommendation] || recommendationConfig.neutral;

  const getRatingColor = (rating: number, max: number = 5) => {
    const pct = (rating / max) * 100;
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 60) return "bg-blue-500";
    if (pct >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getRatingTextColor = (rating: number, max: number = 5) => {
    const pct = (rating / max) * 100;
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 60) return "text-blue-600";
    if (pct >= 40) return "text-amber-600";
    return "text-red-600";
  };

  if (variant === "summary") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all cursor-pointer group",
          className
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {score.interviewer.avatarUrl ? (
            <img src={score.interviewer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            score.interviewer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{score.interviewer.name}</p>
          <p className="text-xs text-gray-500">{score.interviewType} · {new Date(score.submittedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("px-3 py-1.5 rounded-lg text-center", rec.bg)}>
            <p className={cn("text-lg font-bold leading-none", rec.color)}>{score.overallRating}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">/5</p>
          </div>
          <span className={cn("px-2.5 py-1 text-[11px] font-medium rounded-full", rec.bg, rec.color)}>
            {rec.label}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "input") {
    return (
      <div className={cn("bg-white rounded-2xl border border-gray-200 p-5", className)}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {score.interviewer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{score.candidateName}</h3>
            <p className="text-xs text-gray-500">{score.jobTitle} · {score.interviewType}</p>
          </div>
        </div>

        <div className="space-y-5">
          {score.categories.map((cat, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                <span className={cn("text-sm font-bold", getRatingTextColor(cat.score, cat.maxScore))}>
                  {cat.score}/{cat.maxScore}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getRatingColor(cat.score, cat.maxScore))}
                  style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                />
              </div>
              {cat.comments && (
                <p className="mt-1.5 text-xs text-gray-500 italic">{cat.comments}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Recommendation</p>
          <div className="flex gap-2">
            {Object.entries(recommendationConfig).map(([key, cfg]) => (
              <button
                key={key}
                className={cn(
                  "flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all text-center",
                  score.recommendation === key
                    ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                )}
              >
                <span className="text-base block">{cfg.icon}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-2">Strengths</p>
            <ul className="space-y-1">
              {score.strengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-red-600 mb-2">Weaknesses</p>
            <ul className="space-y-1">
              {score.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">−</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {score.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes</p>
            <p className="text-sm text-gray-700">{score.notes}</p>
          </div>
        )}

        {score.wouldWorkWithAgain !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">Would work with again:</span>
            <span className={cn("text-sm font-medium", score.wouldWorkWithAgain ? "text-emerald-600" : "text-red-600")}>
              {score.wouldWorkWithAgain ? "Yes" : "No"}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {score.interviewer.avatarUrl ? (
                <img src={score.interviewer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                score.interviewer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{score.interviewer.name}</h3>
              <p className="text-sm text-gray-500">
                {score.interviewType} · {new Date(score.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn("px-4 py-2 rounded-xl text-center", rec.bg)}>
              <p className={cn("text-2xl font-bold leading-none", rec.color)}>{score.overallRating}</p>
              <p className="text-[10px] text-gray-500 mt-1">/5</p>
            </div>
            <div>
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full", rec.bg, rec.color)}>
                <span>{rec.icon}</span>
                {rec.label}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {score.categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{cat.name}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getRatingColor(cat.score, cat.maxScore))}
                  style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                />
              </div>
              <span className={cn("text-xs font-bold w-8 text-right", getRatingTextColor(cat.score, cat.maxScore))}>
                {cat.score}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {score.strengths.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <p className="text-xs font-medium text-emerald-700 mb-2">Strengths</p>
              <ul className="space-y-1">
                {score.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-700 flex items-start gap-1">
                    <span className="text-emerald-400">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {score.weaknesses.length > 0 && (
            <div className="p-3 bg-red-50 rounded-xl">
              <p className="text-xs font-medium text-red-700 mb-2">Concerns</p>
              <ul className="space-y-1">
                {score.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                    <span className="text-red-400">−</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {expanded && score.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">{score.notes}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {score.wouldWorkWithAgain !== undefined && (
            <span>Would work again: {score.wouldWorkWithAgain ? "Yes" : "No"}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-500 hover:text-gray-700">
            {expanded ? "Less" : "Details"}
          </button>
          {onViewCandidate && (
            <button onClick={() => onViewCandidate(score.candidateId)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Candidate
            </button>
          )}
          {onViewInterview && (
            <button onClick={() => onViewInterview(score.interviewId)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Interview
            </button>
          )}
          {editable && onEditScore && (
            <button onClick={() => onEditScore(score)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScoreCard;
