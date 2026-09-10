import { useState } from "react";

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  type: "phone-screen" | "technical" | "behavioral" | "panel" | "onsite" | "cultural" | "executive";
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show" | "rescheduled";
  scheduledAt: string;
  duration: number;
  location: string;
  interviewers: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    feedback?: {
      rating: number;
      notes: string;
      recommendation: "strong-hire" | "hire" | "neutral" | "no-hire" | "strong-no-hire";
      submitted: boolean;
    };
  }[];
  round: number;
  totalRounds: number;
  notes?: string;
  meetingLink?: string;
  feedback?: {
    overallRating: number;
    recommendation: string;
    strengths: string[];
    concerns: string[];
  };
}

interface InterviewCardProps {
  interview: Interview;
  onView?: (interview: Interview) => void;
  onReschedule?: (interview: Interview) => void;
  onCancel?: (interview: Interview) => void;
  onStartFeedback?: (interview: Interview) => void;
  onJoinMeeting?: (interview: Interview) => void;
}

const typeConfig: Record<
  Interview["type"],
  { label: string; color: string; bg: string; icon: string }
> = {
  "phone-screen": {
    label: "Phone Screen",
    color: "text-gray-700",
    bg: "bg-gray-100",
    icon: "📞",
  },
  technical: {
    label: "Technical",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: "💻",
  },
  behavioral: {
    label: "Behavioral",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: "🧠",
  },
  panel: {
    label: "Panel",
    color: "text-indigo-700",
    bg: "bg-indigo-100",
    icon: "👥",
  },
  onsite: {
    label: "Onsite",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    icon: "🏢",
  },
  cultural: {
    label: "Cultural Fit",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: "🤝",
  },
  executive: {
    label: "Executive",
    color: "text-rose-700",
    bg: "bg-rose-100",
    icon: "👔",
  },
};

const statusConfig: Record<
  Interview["status"],
  { label: string; color: string; dot: string }
> = {
  scheduled: { label: "Scheduled", color: "text-blue-700", dot: "bg-blue-500" },
  "in-progress": { label: "In Progress", color: "text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  completed: { label: "Completed", color: "text-gray-500", dot: "bg-gray-400" },
  cancelled: { label: "Cancelled", color: "text-red-600", dot: "bg-red-400" },
  "no-show": { label: "No Show", color: "text-orange-600", dot: "bg-orange-400" },
  rescheduled: { label: "Rescheduled", color: "text-amber-600", dot: "bg-amber-400" },
};

const recommendationColors: Record<string, string> = {
  "strong-hire": "bg-emerald-100 text-emerald-700",
  hire: "bg-green-100 text-green-700",
  neutral: "bg-gray-100 text-gray-600",
  "no-hire": "bg-orange-100 text-orange-700",
  "strong-no-hire": "bg-red-100 text-red-700",
};

export function InterviewCard({
  interview,
  onView,
  onReschedule,
  onCancel,
  onStartFeedback,
  onJoinMeeting,
}: InterviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const type = typeConfig[interview.type];
  const status = statusConfig[interview.status];

  const scheduledDate = new Date(interview.scheduledAt);
  const isToday =
    scheduledDate.toDateString() === new Date().toDateString();
  const isPast = scheduledDate < new Date();
  const timeUntil = isPast
    ? "Past"
    : isToday
    ? "Today"
    : `${Math.ceil(
        (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )}d away`;

  const feedbacksSubmitted = interview.interviewers.filter(
    (i) => i.feedback?.submitted
  ).length;
  const totalInterviewers = interview.interviewers.length;

  const avgRating =
    interview.interviewers
      .filter((i) => i.feedback)
      .reduce((sum, i) => sum + (i.feedback?.rating || 0), 0) /
      Math.max(
        interview.interviewers.filter((i) => i.feedback).length,
        1
      ) || 0;

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-emerald-600";
    if (rating >= 3) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${type.bg} flex items-center justify-center text-lg`}
            >
              {type.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {type.label} – Round {interview.round}/{interview.totalRounds}
              </h3>
              <p className="text-sm text-gray-500">
                {interview.candidateName} · {interview.jobTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Date & Time
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {scheduledDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-500">
              {scheduledDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">{timeUntil}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Duration
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {interview.duration} min
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Location
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1 truncate">
              {interview.location}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">Interviewers</p>
            <span className="text-[10px] text-gray-400">
              {feedbacksSubmitted}/{totalInterviewers} feedback submitted
            </span>
          </div>
          <div className="flex items-center gap-2">
            {interview.interviewers.map((interviewer) => (
              <div key={interviewer.id} className="relative group">
                {interviewer.avatar ? (
                  <img
                    src={interviewer.avatar}
                    alt={interviewer.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-sm">
                    {interviewer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                {interviewer.feedback?.submitted && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {interviewer.name} · {interviewer.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {avgRating > 0 && (
          <div className="p-3 bg-gray-50 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Average Rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(avgRating)
                        ? "text-amber-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span
                  className={`text-sm font-bold ml-1 ${getRatingColor(
                    avgRating
                  )}`}
                >
                  {avgRating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}

        {interview.status === "completed" &&
          interview.feedback?.strengths &&
          interview.feedback.strengths.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Key Feedback</p>
              <div className="flex flex-wrap gap-1.5">
                {interview.feedback.strengths.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

        {expanded && interview.notes && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mt-4">
            <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
            <p className="text-sm text-amber-800">{interview.notes}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {interview.status === "scheduled" && (
            <>
              {interview.meetingLink && (
                <button
                  onClick={() => onJoinMeeting?.(interview)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Meeting
                </button>
              )}
              <button
                onClick={() => onReschedule?.(interview)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Reschedule
              </button>
            </>
          )}
          {interview.status === "completed" &&
            feedbacksSubmitted < totalInterviewers && (
              <button
                onClick={() => onStartFeedback?.(interview)}
                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Submit Feedback
              </button>
            )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {expanded ? "Less" : "Details"}
          </button>
          <button
            onClick={() => onView?.(interview)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewCard;
