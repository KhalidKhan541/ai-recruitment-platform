import { cn } from "@/lib/utils";

export interface PipelineStageData {
  id: string;
  name: string;
  order: number;
  color: string;
  bgColor: string;
  borderColor: string;
  description?: string;
  candidateCount: number;
  averageTimeInStage?: number;
  conversionRate?: number;
  isCurrent?: boolean;
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface PipelineStageProps {
  stage: PipelineStageData;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: (stage: PipelineStageData) => void;
  showProgress?: boolean;
  showMetrics?: boolean;
  variant?: "horizontal" | "vertical" | "compact";
  className?: string;
}

export function PipelineStage({
  stage,
  isActive = false,
  isCompleted = false,
  onClick,
  showProgress = true,
  showMetrics = false,
  variant = "horizontal",
  className,
}: PipelineStageProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
          isActive
            ? `${stage.bgColor} ${stage.borderColor} border`
            : isCompleted
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-gray-50 border border-gray-200 hover:bg-gray-100",
          onClick && "cursor-pointer",
          className
        )}
        onClick={() => onClick?.(stage)}
      >
        {isCompleted ? (
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isActive ? (
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", stage.bgColor)}>
            <div className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-gray-500">{stage.order + 1}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-xs font-medium truncate",
            isActive ? "text-gray-900" : isCompleted ? "text-emerald-700" : "text-gray-500"
          )}>
            {stage.name}
          </p>
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{stage.candidateCount}</span>
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div
        className={cn(
          "relative pl-8 pb-6 cursor-pointer group",
          className
        )}
        onClick={() => onClick?.(stage)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200">
          <div
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10 transition-colors",
              isCompleted
                ? "bg-emerald-500 border-emerald-500"
                : isActive
                ? `${stage.bgColor} ${stage.borderColor}`
                : "bg-white border-gray-300"
            )}
          >
            {isCompleted && (
              <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        <div
          className={cn(
            "p-4 rounded-xl border transition-all",
            isActive
              ? `${stage.bgColor} ${stage.borderColor} shadow-sm`
              : isCompleted
              ? "bg-emerald-50 border-emerald-200"
              : "bg-white border-gray-200 group-hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              "text-sm font-semibold",
              isActive ? "text-gray-900" : isCompleted ? "text-emerald-700" : "text-gray-700"
            )}>
              {stage.name}
            </h4>
            <span className="text-sm font-bold text-gray-900">{stage.candidateCount}</span>
          </div>

          {stage.description && (
            <p className="text-xs text-gray-500 mb-2">{stage.description}</p>
          )}

          {showMetrics && (
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              {stage.averageTimeInStage != null && (
                <span>Avg {stage.averageTimeInStage}d</span>
              )}
              {stage.conversionRate != null && (
                <span>{stage.conversionRate}% conversion</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex-1 cursor-pointer group min-w-[140px]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={() => onClick?.(stage)}
    >
      <div className="flex items-center">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all",
            isCompleted
              ? "bg-emerald-500"
              : isActive
              ? `${stage.bgColor} ring-4 ring-offset-2 ring-current ${stage.color.replace("text-", "ring-")}/20`
              : "bg-gray-200"
          )}
        >
          {isCompleted ? (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className={cn(
              "text-sm font-bold",
              isActive ? stage.color : "text-gray-500"
            )}>
              {stage.order + 1}
            </span>
          )}
        </div>

        {stage.order < 10 && (
          <div
            className={cn(
              "flex-1 h-0.5 mx-1 transition-colors",
              isCompleted ? "bg-emerald-400" : isActive ? `bg-gradient-to-r from-${stage.color.replace("text-", "")} to-gray-200` : "bg-gray-200"
            )}
          />
        )}
      </div>

      <div className="mt-2 text-center">
        <p className={cn(
          "text-xs font-semibold truncate",
          isActive ? "text-gray-900" : isCompleted ? "text-emerald-700" : "text-gray-500"
        )}>
          {stage.name}
        </p>
        <p className="text-lg font-bold text-gray-900 mt-0.5">{stage.candidateCount}</p>
        {showProgress && stage.conversionRate != null && (
          <p className="text-[10px] text-gray-400">{stage.conversionRate}%</p>
        )}
      </div>
    </div>
  );
}

interface PipelineStagesBarProps {
  stages: PipelineStageData[];
  activeStageId?: string;
  completedStages?: string[];
  onStageClick?: (stage: PipelineStageData) => void;
  showMetrics?: boolean;
  className?: string;
}

export function PipelineStagesBar({
  stages,
  activeStageId,
  completedStages = [],
  onStageClick,
  showMetrics = false,
  className,
}: PipelineStagesBarProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Pipeline Stages</h3>
        {showMetrics && (
          <span className="text-[10px] text-gray-400">{stages.length} stages</span>
        )}
      </div>
      <div className="flex items-start">
        {stages.map((stage) => (
          <PipelineStage
            key={stage.id}
            stage={stage}
            isActive={stage.id === activeStageId}
            isCompleted={completedStages.includes(stage.id)}
            onClick={onStageClick}
            showMetrics={showMetrics}
          />
        ))}
      </div>
    </div>
  );
}

export default PipelineStage;
