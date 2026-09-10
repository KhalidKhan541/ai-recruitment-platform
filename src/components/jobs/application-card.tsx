import { useState } from "react";

export interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  appliedAt: string;
  status:
    | "submitted"
    | "screening"
    | "interview"
    | "assessment"
    | "offer"
    | "hired"
    | "rejected"
    | "withdrawn";
  resumeScore: number;
  coverLetter?: string;
  notes?: string;
  matchScore: number;
  experience: number;
  education: string;
}

interface ApplicationCardProps {
  application: Application;
  onAdvance?: (app: Application) => void;
  onReject?: (app: Application) => void;
  onViewResume?: (candidateId: string) => void;
  onScheduleInterview?: (app: Application) => void;
  onAddNote?: (app: Application, note: string) => void;
}

const statusConfig: Record<
  Application["status"],
  { label: string; color: string; bg: string }
> = {
  submitted: {
    label: "Submitted",
    color: "text-gray-700",
    bg: "bg-gray-100",
  },
  screening: {
    label: "Screening",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  interview: {
    label: "Interview",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  assessment: {
    label: "Assessment",
    color: "text-indigo-700",
    bg: "bg-indigo-100",
  },
  offer: {
    label: "Offer",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  hired: {
    label: "Hired",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
};

const stageOrder: Application["status"][] = [
  "submitted",
  "screening",
  "interview",
  "assessment",
  "offer",
  "hired",
];

export function ApplicationCard({
  application,
  onAdvance,
  onReject,
  onViewResume,
  onScheduleInterview,
  onAddNote,
}: ApplicationCardProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(application.notes || "");
  const config = statusConfig[application.status];
  const stageIndex = stageOrder.indexOf(application.status);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getMatchColor = (score: number) => {
    if (score >= 85) return "from-emerald-500 to-green-500";
    if (score >= 70) return "from-blue-500 to-cyan-500";
    if (score >= 50) return "from-amber-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const initials = application.candidateName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {application.candidateAvatar ? (
              <img
                src={application.candidateAvatar}
                alt={application.candidateName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
            )}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br ${getMatchColor(
                application.matchScore
              )}`}
            >
              {application.matchScore}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {application.candidateName}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
              >
                {config.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {application.jobTitle}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{application.experience} years exp</span>
              <span>·</span>
              <span>{application.education}</span>
              <span>·</span>
              <span>
                Applied{" "}
                {new Date(application.appliedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${getScoreColor(
              application.resumeScore
            )}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Resume</p>
              <p className="text-sm font-bold">{application.resumeScore}/100</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${getScoreColor(
              application.matchScore
            )}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-70">Match</p>
              <p className="text-sm font-bold">{application.matchScore}%</p>
            </div>
          </div>
        </div>

        {application.status !== "hired" &&
          application.status !== "rejected" &&
          application.status !== "withdrawn" && (
            <div className="mt-4 flex items-center gap-1">
              {stageOrder.slice(0, -1).map((stage, i) => (
                <div
                  key={stage}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    i <= stageIndex ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}

        {application.coverLetter && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 mb-1">Cover Letter</p>
            <p className="text-sm text-gray-600 line-clamp-3">{application.coverLetter}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        {showNoteInput ? (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this candidate..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onAddNote?.(application, noteText);
                  setShowNoteInput(false);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowNoteInput(false)}
                className="px-3 py-1 text-gray-500 text-xs font-medium hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {application.status !== "hired" &&
                application.status !== "rejected" &&
                application.status !== "withdrawn" && (
                  <>
                    <button
                      onClick={() => onAdvance?.(application)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Advance →
                    </button>
                    {application.status === "screening" && (
                      <button
                        onClick={() => onScheduleInterview?.(application)}
                        className="px-3 py-1.5 border border-purple-300 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Schedule Interview
                      </button>
                    )}
                    <button
                      onClick={() => onReject?.(application)}
                      className="px-3 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNoteInput(true)}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Add note"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onViewResume?.(application.candidateId)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationCard;
