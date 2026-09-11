import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface ResumeAnalysisResult {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordScore: number;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywords: { keyword: string; found: boolean; count: number }[];
  sections: {
    name: string;
    score: number;
    feedback: string;
  }[];
  parsedSkills: string[];
  experienceYears: number;
  educationLevel: string;
}

interface ResumeAnalyzerProps {
  file?: File | null;
  resumeText?: string;
  jobRequirements?: string[];
  onAnalysisComplete?: (result: ResumeAnalysisResult) => void;
  onError?: (error: string) => void;
  isAnalyzing?: boolean;
  result?: ResumeAnalysisResult | null;
  className?: string;
}

export function ResumeAnalyzer({
  file,
  resumeText,
  jobRequirements = [],
  onAnalysisComplete,
  onError,
  isAnalyzing = false,
  result,
  className,
}: ResumeAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "sections" | "recommendations">("overview");
  const [dragActive, setDragActive] = useState(false);

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

  const getScoreRing = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  const ScoreCircle = ({ score, size = 80, label }: { score: number; size?: number; label: string }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-100"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", getScoreRing(score))}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-xl font-bold", getScoreColor(score))}>{score}</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 mt-1.5 font-medium">{label}</span>
      </div>
    );
  };

  if (!result && !isAnalyzing) {
    return (
      <div className={cn("bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center", className)}>
        <div
          className={cn(
            "mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4",
            dragActive && "scale-110"
          )}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">AI Resume Analyzer</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Upload a resume to get AI-powered analysis including skills matching, ATS scoring, and improvement recommendations.
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
            Upload Resume
          </div>
          {resumeText && (
            <div className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              Analyze Text
            </div>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-4">Supports PDF, DOCX, TXT (max 10MB)</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className={cn("bg-white rounded-2xl border border-gray-200 p-12 text-center", className)}>
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4 animate-pulse">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Analyzing Resume...</h3>
        <p className="text-sm text-gray-500">AI is parsing and evaluating the resume content</p>
        <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-4 mx-auto overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "keywords" as const, label: "Keywords" },
    { key: "sections" as const, label: "Sections" },
    { key: "recommendations" as const, label: "Tips" },
  ];

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden", className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Resume Analysis</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <ScoreCircle score={result.overallScore} size={90} label="Overall" />
          <ScoreCircle score={result.skillsMatch} label="Skills" />
          <ScoreCircle score={result.experienceMatch} label="Experience" />
          <ScoreCircle score={result.educationMatch} label="Education" />
          <ScoreCircle score={result.atsScore} label="ATS" />
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-h-[400px] overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Experience</p>
                <p className="text-lg font-bold text-gray-900">{result.experienceYears} years</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Education</p>
                <p className="text-lg font-bold text-gray-900">{result.educationLevel}</p>
              </div>
            </div>

            {result.strengths.length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-800 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.weaknesses.length > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <h4 className="text-xs font-bold text-red-800 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">−</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "keywords" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900">Keyword Analysis</h4>
              <span className="text-xs text-gray-500">
                {result.keywords.filter((k) => k.found).length}/{result.keywords.length} found
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((kw, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border",
                    kw.found
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  )}
                >
                  {kw.found ? "✓" : "✗"} {kw.keyword}
                  {kw.count > 1 && <span className="opacity-60">×{kw.count}</span>}
                </span>
              ))}
            </div>

            {jobRequirements.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Job Requirements Match</h4>
                <div className="space-y-2">
                  {jobRequirements.map((req, i) => {
                    const matched = result.keywords.some(
                      (kw) => kw.found && kw.keyword.toLowerCase().includes(req.toLowerCase())
                    );
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs", matched ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                          {matched ? "✓" : "✗"}
                        </span>
                        <span className="text-sm text-gray-700">{req}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sections" && (
          <div className="space-y-3">
            {result.sections.map((section, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{section.name}</span>
                  <span className={cn("text-sm font-bold", getScoreColor(section.score))}>{section.score}/100</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full", getScoreBg(section.score))} style={{ width: `${section.score}%` }} />
                </div>
                <p className="text-xs text-gray-500">{section.feedback}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
