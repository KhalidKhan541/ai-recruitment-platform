import { cn } from "@/lib/utils";

export interface RecruiterStatsData {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  newApplicationsThisWeek: number;
  interviewsScheduled: number;
  offersPending: number;
  hiredThisMonth: number;
  timeToFillDays: number;
  timeToHireDays: number;
  offerAcceptanceRate: number;
  pipelineValue: number;
  conversionRates: {
    screening: number;
    interview: number;
    offer: number;
    acceptance: number;
  };
  weeklyActivity: {
    day: string;
    applications: number;
    interviews: number;
    offers: number;
  }[];
  topPerformingJobs: {
    id: string;
    title: string;
    applications: number;
    daysOpen: number;
    conversionRate: number;
  }[];
  sourceBreakdown: {
    source: string;
    count: number;
    percentage: number;
  }[];
  recentHires: {
    id: string;
    name: string;
    jobTitle: string;
    hiredAt: string;
    avatarUrl?: string | null;
  }[];
}

interface RecruiterStatsProps {
  stats: RecruiterStatsData;
  period?: "week" | "month" | "quarter" | "year";
  onPeriodChange?: (period: "week" | "month" | "quarter" | "year") => void;
  onJobClick?: (jobId: string) => void;
  onViewAllJobs?: () => void;
  onViewAllCandidates?: () => void;
  className?: string;
}

export function RecruiterStats({
  stats,
  period = "month",
  onPeriodChange,
  onJobClick,
  onViewAllJobs,
  onViewAllCandidates,
  className,
}: RecruiterStatsProps) {
  const kpiCards = [
    {
      label: "Active Jobs",
      value: stats.activeJobs,
      total: stats.totalJobs,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "New Applications",
      value: stats.newApplicationsThisWeek,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Interviews",
      value: stats.interviewsScheduled,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "Hired This Month",
      value: stats.hiredThisMonth,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-amber-500 to-orange-600",
    },
  ];

  const maxBarValue = Math.max(
    ...stats.weeklyActivity.map((d) => Math.max(d.applications, d.interviews, d.offers)),
    1
  );

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Recruiter Dashboard</h2>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(["week", "month", "quarter", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange?.(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", kpi.color)}>
                {kpi.icon}
              </div>
              {kpi.total !== undefined && (
                <span className="text-xs text-gray-400">/ {kpi.total}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Weekly Activity</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.weeklyActivity.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "120px" }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-md min-h-[2px]"
                    style={{ height: `${(day.applications / maxBarValue) * 100}%` }}
                    title={`${day.applications} applications`}
                  />
                  <div
                    className="w-full bg-purple-500 min-h-[2px]"
                    style={{ height: `${(day.interviews / maxBarValue) * 100}%` }}
                    title={`${day.interviews} interviews`}
                  />
                  <div
                    className="w-full bg-emerald-500 rounded-b-md min-h-[2px]"
                    style={{ height: `${(day.offers / maxBarValue) * 100}%` }}
                    title={`${day.offers} offers`}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Applications
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Interviews
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Offers
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {[
              { label: "Screening", rate: stats.conversionRates.screening },
              { label: "Interview", rate: stats.conversionRates.interview },
              { label: "Offer", rate: stats.conversionRates.offer },
              { label: "Accepted", rate: stats.conversionRates.acceptance },
            ].map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{stage.label}</span>
                  <span className="text-xs font-bold text-gray-900">{stage.rate}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${stage.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.timeToFillDays}</p>
              <p className="text-[10px] text-gray-400">Days to Fill</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.timeToHireDays}</p>
              <p className="text-[10px] text-gray-400">Days to Hire</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.offerAcceptanceRate}%</p>
              <p className="text-[10px] text-gray-400">Accept Rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Top Performing Jobs</h3>
            {onViewAllJobs && (
              <button onClick={onViewAllJobs} className="text-xs text-blue-600 hover:text-blue-800">View all</button>
            )}
          </div>
          <div className="space-y-3">
            {stats.topPerformingJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onJobClick?.(job.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-[10px] text-gray-400">{job.applications} applications · {job.daysOpen}d open</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${job.conversionRate}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 w-8 text-right">{job.conversionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Source Breakdown</h3>
          <div className="space-y-3">
            {stats.sourceBreakdown.map((source, i) => {
              const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
              return (
                <div key={source.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{source.source}</span>
                    <span className="text-xs font-bold text-gray-900">{source.count} ({source.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: `${source.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Hires</h4>
            <div className="space-y-2.5">
              {stats.recentHires.map((hire) => (
                <div key={hire.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {hire.avatarUrl ? (
                      <img src={hire.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      hire.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{hire.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{hire.jobTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterStats;
