import { useState } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";

export interface TalentPoolMember {
  id: string;
  candidateId: string;
  candidate: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    headline?: string | null;
    user?: { name: string; avatarUrl?: string | null };
  };
  status: string;
  addedAt: string;
  notes?: string | null;
  matchScore?: number | null;
}

export interface TalentPoolData {
  id: string;
  name: string;
  description?: string | null;
  tags?: string[];
  criteria?: {
    skills?: string[];
    experienceLevel?: string;
    location?: string;
  } | null;
  memberCount: number;
  members?: TalentPoolMember[];
  createdAt: string;
  updatedAt: string;
}

interface TalentPoolCardProps {
  pool: TalentPoolData;
  variant?: "default" | "compact";
  onView?: (pool: TalentPoolData) => void;
  onEdit?: (pool: TalentPoolData) => void;
  onDelete?: (pool: TalentPoolData) => void;
  onAddMembers?: (pool: TalentPoolData) => void;
  onRemoveMember?: (poolId: string, memberId: string) => void;
  className?: string;
}

const poolColors = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-blue-600",
];

function getPoolColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return poolColors[Math.abs(hash) % poolColors.length];
}

export function TalentPoolCard({
  pool,
  variant = "default",
  onView,
  onEdit,
  onDelete,
  onAddMembers,
  onRemoveMember,
  className,
}: TalentPoolCardProps) {
  const [showMembers, setShowMembers] = useState(false);
  const gradientColor = getPoolColor(pool.id);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer",
          className
        )}
        onClick={() => onView?.(pool)}
      >
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0", gradientColor)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{pool.name}</p>
          <p className="text-xs text-gray-500">{pool.memberCount} members</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden", className)}>
      <div className={cn("h-2 bg-gradient-to-r", gradientColor)} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", gradientColor)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{pool.name}</h3>
              <p className="text-sm text-gray-500">{pool.memberCount} candidates</p>
            </div>
          </div>
        </div>

        {pool.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pool.description}</p>
        )}

        {pool.tags && pool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pool.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
                {tag}
              </span>
            ))}
            {pool.tags.length > 4 && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full">
                +{pool.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {pool.criteria && (
          <div className="p-3 bg-gray-50 rounded-xl mb-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Criteria</p>
            <div className="flex flex-wrap gap-1.5">
              {pool.criteria.skills?.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">
                  {skill}
                </span>
              ))}
              {pool.criteria.experienceLevel && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full">
                  {pool.criteria.experienceLevel}
                </span>
              )}
              {pool.criteria.location && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded-full">
                  {pool.criteria.location}
                </span>
              )}
            </div>
          </div>
        )}

        {pool.members && pool.members.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Recent Members</p>
              {pool.members.length > 3 && (
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="text-[10px] text-blue-600 hover:text-blue-800"
                >
                  {showMembers ? "Show less" : `View all (${pool.memberCount})`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showMembers ? pool.members : pool.members.slice(0, 3)).map((member) => {
                const memberName =
                  member.candidate.name ||
                  `${member.candidate.firstName || ""} ${member.candidate.lastName || ""}`.trim() ||
                  "Unknown";
                return (
                  <div key={member.id} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {member.candidate.user?.avatarUrl ? (
                        <img src={member.candidate.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        memberName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{memberName}</p>
                      <p className="text-[10px] text-gray-400">{member.candidate.headline || member.candidate.email}</p>
                    </div>
                    {member.matchScore != null && (
                      <span className={cn(
                        "px-1.5 py-0.5 text-[9px] font-bold rounded-full",
                        member.matchScore >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {member.matchScore}%
                      </span>
                    )}
                    {onRemoveMember && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMember(pool.id, member.id);
                        }}
                        className="p-0.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Updated {formatRelativeTime(pool.updatedAt)}</span>
        <div className="flex items-center gap-2">
          {onAddMembers && (
            <button
              onClick={() => onAddMembers(pool)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Members
            </button>
          )}
          <button onClick={() => onView?.(pool)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            View →
          </button>
        </div>
      </div>
    </div>
  );
}

export default TalentPoolCard;
