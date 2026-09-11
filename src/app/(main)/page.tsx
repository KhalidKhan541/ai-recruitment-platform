"use client";

import Link from "next/link";
import { mockDashboardStats, mockApplications, mockJobs } from "@/lib/mock-data";
import { formatRelativeTime, formatCurrency } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500",
    "bg-teal-500", "bg-orange-500", "bg-emerald-500", "bg-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    applied: { label: "Applied", className: "badge-info" },
    reviewing: { label: "Reviewing", className: "badge-warning" },
    phone_screen: { label: "Phone Screen", className: "badge-info" },
    technical: { label: "Technical", className: "badge-primary" },
    onsite: { label: "Onsite", className: "badge-primary" },
    offer: { label: "Offer", className: "badge-success" },
    hired: { label: "Hired", className: "badge-success" },
    rejected: { label: "Rejected", className: "badge-danger" },
    withdrawn: { label: "Withdrawn", className: "badge-neutral" },
  };
  return statusMap[status] || { label: status, className: "badge-neutral" };
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, Sarah. Here&apos;s what&apos;s happening with your recruitment pipeline.
          </p>
        </div>
        <Link href="/jobs" className="btn-primary">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Active Jobs",
            value: mockDashboardStats.activeJobs,
            change: "+2 this week",
            changeType: "positive" as const,
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>,
          },
          {
            label: "Total Candidates",
            value: mockDashboardStats.totalCandidates,
            change: "+23 this month",
            changeType: "positive" as const,
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
          },
          {
            label: "New Applications",
            value: mockDashboardStats.newApplications,
            change: "5 today",
            changeType: "neutral" as const,
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
          },
          {
            label: "Interviews Scheduled",
            value: mockDashboardStats.interviewsScheduled,
            change: "3 this week",
            changeType: "neutral" as const,
            icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
          },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {stat.icon}
              </div>
              <span className={`text-xs font-medium ${
                stat.changeType === "positive" ? "text-emerald-600" : "text-muted-foreground"
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Applications</h2>
              <Link href="/applications" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {mockApplications.slice(0, 5).map((app) => {
                const status = getStatusBadge(app.status);
                return (
                  <Link
                    key={app.id}
                    href={`/applications`}
                    className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${getAvatarColor(app.candidate.name)}`}>
                      {getInitials(app.candidate.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{app.candidate.name}</p>
                        {app.aiAnalysis && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            {app.aiAnalysis.overallScore}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Applied for {app.job.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${status.className}`}>{status.label}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(app.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pipeline Overview */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Pipeline Overview</h2>
            <div className="space-y-3">
              {Object.entries(mockDashboardStats.applicationsByStatus).map(([status, count]) => {
                const total = Object.values(mockDashboardStats.applicationsByStatus).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{statusLabel}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Active Jobs</h2>
              <Link href="/jobs" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {mockJobs.filter((j) => j.status === "published").slice(0, 4).map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.applicationCount} applicants</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/jobs" className="btn-secondary w-full justify-start">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Post New Job
              </Link>
              <Link href="/candidates" className="btn-secondary w-full justify-start">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Add Candidate
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Avg. Time to Hire", value: `${mockDashboardStats.averageTimeToHire}d`, color: "bg-emerald-100 text-emerald-600", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: "Hiring Rate", value: `${mockDashboardStats.hiringRate}%`, color: "bg-blue-100 text-blue-600", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          { label: "Pending Offers", value: mockDashboardStats.offersPending, color: "bg-amber-100 text-amber-600", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg> },
          { label: "Total Jobs", value: mockDashboardStats.totalJobs, color: "bg-purple-100 text-purple-600", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg> },
        ].map((metric) => (
          <div key={metric.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.color}`}>
                {metric.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>
        <div className="space-y-4">
          {mockDashboardStats.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
