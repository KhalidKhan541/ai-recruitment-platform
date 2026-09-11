import { useState } from "react";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export interface OfferData {
  id: string;
  status: string;
  sentAt?: string | null;
  viewedAt?: string | null;
  respondedAt?: string | null;
  declinedReason?: string | null;
  signedAt?: string | null;
  createdAt: string;
  candidate: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    user?: { name: string; avatarUrl?: string | null };
  };
  job: {
    id: string;
    title: string;
    department?: string | null;
  };
  jobOffer?: {
    title: string;
    salary: number;
    salaryCurrency: string;
    salaryFrequency: string;
    equityPercentage?: number | null;
    signingBonus?: number | null;
    relocationBonus?: number | null;
    startDate: string;
    expirationDate: string;
    employmentType: string;
    workLocation: string;
    workArrangement: string;
    benefits?: string[];
    terms?: string | null;
  } | null;
}

interface OfferCardProps {
  offer: OfferData;
  variant?: "default" | "compact";
  onView?: (offer: OfferData) => void;
  onEdit?: (offer: OfferData) => void;
  onSend?: (offer: OfferData) => void;
  onResend?: (offer: OfferData) => void;
  onWithdraw?: (offer: OfferData) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100", icon: "📝" },
  PENDING_APPROVAL: { label: "Pending Approval", color: "text-amber-600", bg: "bg-amber-100", icon: "⏳" },
  SENT: { label: "Sent", color: "text-blue-600", bg: "bg-blue-100", icon: "📧" },
  VIEWED: { label: "Viewed", color: "text-indigo-600", bg: "bg-indigo-100", icon: "👁" },
  NEGOTIATING: { label: "Negotiating", color: "text-purple-600", bg: "bg-purple-100", icon: "🤝" },
  ACCEPTED: { label: "Accepted", color: "text-emerald-600", bg: "bg-emerald-100", icon: "✅" },
  DECLINED: { label: "Declined", color: "text-red-600", bg: "bg-red-100", icon: "❌" },
  EXPIRED: { label: "Expired", color: "text-gray-500", bg: "bg-gray-100", icon: "⏰" },
  WITHDRAWN: { label: "Withdrawn", color: "text-orange-600", bg: "bg-orange-100", icon: "↩" },
};

const frequencyLabels: Record<string, string> = {
  ANNUAL: "/year",
  MONTHLY: "/month",
  BIWEEKLY: "/biweekly",
  WEEKLY: "/week",
  HOURLY: "/hour",
};

export function OfferCard({
  offer,
  variant = "default",
  onView,
  onEdit,
  onSend,
  onResend,
  onWithdraw,
  className,
}: OfferCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const status = statusConfig[offer.status] || statusConfig.DRAFT;
  const jobOffer = offer.jobOffer;

  const candidateName =
    offer.candidate.name ||
    `${offer.candidate.firstName || ""} ${offer.candidate.lastName || ""}`.trim() ||
    "Unknown";

  const initials = candidateName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const daysUntilExpiry = jobOffer
    ? Math.ceil(
        (new Date(jobOffer.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer",
          className
        )}
        onClick={() => onView?.(offer)}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {offer.candidate.user?.avatarUrl ? (
            <img src={offer.candidate.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{candidateName}</p>
          <p className="text-xs text-gray-500 truncate">{offer.job.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {jobOffer && (
            <span className="text-xs font-semibold text-gray-900">
              {formatCurrency(jobOffer.salary, jobOffer.salaryCurrency)}
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
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden", className)}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {offer.candidate.user?.avatarUrl ? (
                <img src={offer.candidate.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{candidateName}</h3>
              <p className="text-sm text-gray-500">{offer.job.title}</p>
            </div>
          </div>
          <span className={cn("px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5", status.bg, status.color)}>
            <span>{status.icon}</span>
            {status.label}
          </span>
        </div>

        {jobOffer && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Base Salary</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(jobOffer.salary, jobOffer.salaryCurrency)}
                  <span className="text-sm font-normal text-gray-500">{frequencyLabels[jobOffer.salaryFrequency] || ""}</span>
                </p>
              </div>
              {jobOffer.equityPercentage && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Equity</p>
                  <p className="text-lg font-bold text-gray-900">{jobOffer.equityPercentage}%</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {jobOffer.workLocation}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                {jobOffer.workArrangement}
              </div>
            </div>

            {(jobOffer.signingBonus || jobOffer.relocationBonus) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-blue-100">
                {jobOffer.signingBonus && (
                  <span className="text-xs text-gray-600">Signing: <strong>{formatCurrency(jobOffer.signingBonus, jobOffer.salaryCurrency)}</strong></span>
                )}
                {jobOffer.relocationBonus && (
                  <span className="text-xs text-gray-600">Relocation: <strong>{formatCurrency(jobOffer.relocationBonus, jobOffer.salaryCurrency)}</strong></span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>Start: {jobOffer ? formatDate(jobOffer.startDate) : "—"}</span>
          <span>Expires: {jobOffer ? formatDate(jobOffer.expirationDate) : "—"}</span>
          {daysUntilExpiry !== null && (
            <span className={cn("font-medium", isExpired ? "text-red-600" : daysUntilExpiry <= 7 ? "text-amber-600" : "text-gray-500")}>
              {isExpired ? "Expired" : `${daysUntilExpiry}d left`}
            </span>
          )}
        </div>

        {jobOffer?.benefits && jobOffer.benefits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {jobOffer.benefits.slice(0, 4).map((b, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">{b}</span>
            ))}
            {jobOffer.benefits.length > 4 && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
                +{jobOffer.benefits.length - 4} more
              </span>
            )}
          </div>
        )}

        {offer.status === "DECLINED" && offer.declinedReason && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 mb-3">
            <p className="text-xs font-medium text-red-700 mb-1">Declined Reason</p>
            <p className="text-sm text-red-600">{offer.declinedReason}</p>
          </div>
        )}

        {showDetails && jobOffer?.terms && (
          <div className="p-3 bg-gray-50 rounded-xl mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Terms & Conditions</p>
            <p className="text-sm text-gray-700">{jobOffer.terms}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          {offer.sentAt && <span>Sent {formatRelativeTime(offer.sentAt)}</span>}
          {offer.viewedAt && <span>Viewed {formatRelativeTime(offer.viewedAt)}</span>}
          {offer.signedAt && <span className="text-emerald-600">Signed {formatRelativeTime(offer.signedAt)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-gray-500 hover:text-gray-700">
            {showDetails ? "Less" : "Details"}
          </button>
          {onView && (
            <button onClick={() => onView(offer)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
          )}
          {onSend && offer.status === "DRAFT" && (
            <button onClick={() => onSend(offer)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Send Offer
            </button>
          )}
          {onResend && (offer.status === "SENT" || offer.status === "VIEWED") && (
            <button onClick={() => onResend(offer)} className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Resend
            </button>
          )}
          {onWithdraw && (offer.status === "SENT" || offer.status === "VIEWED" || offer.status === "NEGOTIATING") && (
            <button onClick={() => onWithdraw(offer)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
              Withdraw
            </button>
          )}
          {onEdit && offer.status === "DRAFT" && (
            <button onClick={() => onEdit(offer)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfferCard;
