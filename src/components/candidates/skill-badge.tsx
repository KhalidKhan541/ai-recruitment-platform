import { useState } from "react";

export interface Skill {
  name: string;
  category: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  endorsed?: boolean;
  endorsements?: number;
  lastUsed?: string;
  verified?: boolean;
  demand?: "high" | "medium" | "low";
}

interface SkillBadgeProps {
  skill: Skill;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  interactive?: boolean;
  endorsements?: number;
  onEndorse?: (skill: Skill) => void;
  onRemove?: (skill: Skill) => void;
  onClick?: (skill: Skill) => void;
}

const proficiencyConfig: Record<
  Skill["proficiency"],
  { label: string; color: string; bg: string; border: string; width: number }
> = {
  beginner: {
    label: "Beginner",
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-300",
    width: 25,
  },
  intermediate: {
    label: "Intermediate",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    width: 50,
  },
  advanced: {
    label: "Advanced",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-300",
    width: 75,
  },
  expert: {
    label: "Expert",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-300",
    width: 100,
  },
};

const demandConfig: Record<
  NonNullable<Skill["demand"]>,
  { label: string; color: string; icon: string }
> = {
  high: { label: "High Demand", color: "text-emerald-600", icon: "🔥" },
  medium: { label: "Medium Demand", color: "text-amber-600", icon: "📊" },
  low: { label: "Low Demand", color: "text-gray-500", icon: "📉" },
};

export function SkillBadge({
  skill,
  size = "md",
  showDetails = false,
  interactive = false,
  endorsements = 0,
  onEndorse,
  onRemove,
  onClick,
}: SkillBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const config = proficiencyConfig[skill.proficiency];
  const totalEndorsements = endorsements || skill.endorsements || 0;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => onClick?.(skill)}
        onMouseEnter={() => {
          setHovered(true);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
          setShowTooltip(false);
        }}
        className={`
          inline-flex items-center ${sizeClasses[size]} rounded-full font-medium transition-all
          ${config.bg} ${config.color} ${config.border} border
          ${interactive ? "cursor-pointer hover:shadow-md hover:scale-105" : ""}
          ${skill.endorsed ? "ring-2 ring-offset-1 ring-blue-400" : ""}
        `}
      >
        {skill.verified && (
          <svg
            className={`${iconSizes[size]} text-blue-500 flex-shrink-0`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}

        <span className="flex-shrink-0">{skill.name}</span>

        {showDetails && skill.yearsOfExperience !== undefined && (
          <span className="opacity-60">
            {skill.yearsOfExperience}y
          </span>
        )}

        {showDetails && totalEndorsements > 0 && (
          <span className="flex items-center gap-0.5 opacity-70">
            <svg
              className={`${iconSizes[size]}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
            {totalEndorsements}
          </span>
        )}

        {interactive && hovered && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(skill);
            }}
            className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <svg
              className={`${iconSizes[size]}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-xl min-w-[200px] pointer-events-none">
          <div className="text-sm font-bold mb-1">{skill.name}</div>
          <div className="text-xs text-gray-300 mb-2">
            {skill.category} · {config.label}
          </div>

          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all"
              style={{ width: `${config.width}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-400">
            {skill.yearsOfExperience !== undefined && (
              <span>{skill.yearsOfExperience} years experience</span>
            )}
            {skill.lastUsed && (
              <span>Last used: {skill.lastUsed}</span>
            )}
          </div>

          {skill.demand && (
            <div
              className={`mt-2 flex items-center gap-1 text-[10px] ${demandConfig[skill.demand].color}`}
            >
              <span>{demandConfig[skill.demand].icon}</span>
              {demandConfig[skill.demand].label}
            </div>
          )}

          {interactive && onEndorse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEndorse(skill);
              }}
              className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors pointer-events-auto"
            >
              Endorse this skill
            </button>
          )}

          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export function SkillBadgeGroup({
  skills,
  maxVisible = 5,
  size = "md",
  showDetails = false,
  interactive = false,
  onEndorse,
  onRemove,
  onClick,
}: {
  skills: Skill[];
  maxVisible?: number;
  size?: SkillBadgeProps["size"];
  showDetails?: boolean;
  interactive?: boolean;
  onEndorse?: (skill: Skill) => void;
  onRemove?: (skill: Skill) => void;
  onClick?: (skill: Skill) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleSkills = expanded ? skills : skills.slice(0, maxVisible);
  const hiddenCount = skills.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleSkills.map((skill, i) => (
        <SkillBadge
          key={`${skill.name}-${i}`}
          skill={skill}
          size={size}
          showDetails={showDetails}
          interactive={interactive}
          onEndorse={onEndorse}
          onRemove={onRemove}
          onClick={onClick}
        />
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          +{hiddenCount} more
        </button>
      )}
      {expanded && skills.length > maxVisible && (
        <button
          onClick={() => setExpanded(false)}
          className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export function SkillComparison({
  skills,
  jobRequirements,
}: {
  skills: Skill[];
  jobRequirements: string[];
}) {
  const matched = skills.filter((s) =>
    jobRequirements.some(
      (r) =>
        r.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(r.toLowerCase())
    )
  );
  const missing = jobRequirements.filter(
    (r) =>
      !skills.some(
        (s) =>
          s.name.toLowerCase().includes(r.toLowerCase()) ||
          r.toLowerCase().includes(s.name.toLowerCase())
      )
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Matched Skills
          </h4>
          <span className="text-xs text-emerald-600 font-medium">
            {matched.length}/{jobRequirements.length}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${(matched.length / Math.max(jobRequirements.length, 1)) * 100}%`,
            }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matched.map((skill, i) => (
            <SkillBadge key={i} skill={skill} size="sm" />
          ))}
        </div>
      </div>

      {missing.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Missing Skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillBadge;
