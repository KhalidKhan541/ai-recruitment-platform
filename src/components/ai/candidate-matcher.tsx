import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CandidateMatchResult {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  avatarUrl?: string | null;
  headline?: string | null;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  locationScore: number;
  cultureFitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceYears: number;
  highlights: string[];
  concerns: string[];
  recommendation: "strongly_recommend" | "recommend" | "neutral" | "consider" | "not_recommended";
}

interface CandidateMatcherProps {
  jobId: string;
  jobTitle: string;
  jobRequirements?: string[];
  results: CandidateMatchResult[];
  isLoading?: boolean;
  onCandidateClick?: (candidateId: string) => void;
  onInviteToApply?: (candidateId: string) => void;
  onShortlist?: (candidateId: string) => void;
  onCompare?: (candidateIds: string[]) => void;
  maxDisplay?: number;
  className?: string;
}

const recommendationConfig: Record<string, { label: string; color: string; bg: string }> = {
  strongly_recommend: { label: "Strongly Recommend", color: "text-emerald-700", bg: "bg-emerald-100" },
  recommend: { label: "Recommend", color: "text-green-700", bg: "bg-green-100" },
  neutral: { label: "Neutral", color: "text-gray-600", bg: "bg-gray-100" },
  consider: { label: "Consider", color: "text-amber-700", bg: "bg-amber-100" },
  not_recommended: { label: "Not Recommended", color: "text-red-700", bg: "bg-red-100" },
};

export function CandidateMatcher({
  jobId,
  jobTitle,
  jobRequirements = [],
  results,
  isLoading = false,
  onCandidateClick,
  onInviteToApply,
  onShortlist,
  onCompare,
  maxDisplay = 10,
  className,
}: CandidateMatcherProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "skills" | "experience">("score");

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "skills": return b.skillsScore - a.skillsScore;
      case "experience": return b.experienceScore - a.experienceScore;
      default: return b.overallScore - a.overallScore;
    }
  });

  const displayedResults = sortedResults.slice(0, maxDisplay);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-2xl border border-gray-200 p-8", className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white animate-pulse">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI Matching in Progress</h3>
            <p className="text-sm text-gray-500">Analyzing candidates against job requirements...</p>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">AI Candidate Matching</h3>
              <p className="text-xs text-gray-500">{jobTitle} · {results.length} candidates scored</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && onCompare && (
              <button
                onClick={() => onCompare(Array.from(selectedIds))}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Compare ({selectedIds.size})
              </button>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1.5 text-xs text-gray-600 bg-gray-100 border-0 rounded-lg"
            >
              <option value="score">Sort: Overall</option>
              <option value="skills">Sort: Skills</option>
              <option value="experience">Sort: Experience</option>
            </select>
          </div>
        </div>
      </div>

      {jobRequirements.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Job Requirements</p>
          <div className="flex flex-wrap gap-1.5">
            {jobRequirements.map((req, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-white border border-gray-200 text-gray-600 rounded-full">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {displayedResults.map((match, index) => {
          const rec = recommendationConfig[match.recommendation] || recommendationConfig.neutral;
          const isExpanded = expandedId === match.candidateId;
          const isSelected = selectedIds.has(match.candidateId);

          return (
            <div
              key={match.candidateId}
              className={cn(
                "p-4 transition-colors",
                isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(match.candidateId)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {match.avatarUrl ? (
                    <img src={match.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    match.candidateName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => onCandidateClick?.(match.candidateId)}
                    >
                      {match.candidateName}
                    </h4>
                    {index < 3 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full">
                        TOP {index + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{match.headline || match.candidateEmail}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", getScoreBg(match.overallScore))} style={{ width: `${match.overallScore}%` }} />
                      </div>
                      <span className={cn("text-sm font-bold w-8 text-right", getScoreColor(match.overallScore))}>
                        {match.overallScore}
                      </span>
                    </div>
                  </div>
                  <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full", rec.bg, rec.color)}>
                    {rec.label}
                  </span>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : match.candidateId)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <svg className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 ml-7 space-y-3">
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Skills", score: match.skillsScore },
                      { label: "Experience", score: match.experienceScore },
                      { label: "Education", score: match.educationScore },
                      { label: "Location", score: match.locationScore },
                      { label: "Culture", score: match.cultureFitScore },
                    ].map((dim) => (
                      <div key={dim.label} className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div className={cn("h-full rounded-full", getScoreBg(dim.score))} style={{ width: `${dim.score}%` }} />
                        </div>
                        <p className="text-[9px] text-gray-400">{dim.label}</p>
                        <p className={cn("text-xs font-bold", getScoreColor(dim.score))}>{dim.score}</p>
                      </div>
                    ))}
                  </div>

                  {match.matchedSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-emerald-600 mb-1">Matched Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.missingSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-red-600 mb-1">Missing Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {match.missingSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-600 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.highlights.length > 0 && (
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <p className="text-[10px] font-medium text-emerald-700 mb-1">Highlights</p>
                      <ul className="space-y-0.5">
                        {match.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-emerald-700">+ {h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {onShortlist && (
                      <button
                        onClick={() => onShortlist(match.candidateId)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Shortlist
                      </button>
                    )}
                    {onInviteToApply && (
                      <button
                        onClick={() => onInviteToApply(match.candidateId)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Invite to Apply
                      </button>
                    )}
                    <button
                      onClick={() => onCandidateClick?.(match.candidateId)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Profile →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {results.length > maxDisplay && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Showing {maxDisplay} of {results.length} candidates
          </p>
        </div>
      )}
    </div>
  );
}

export default CandidateMatcher;
