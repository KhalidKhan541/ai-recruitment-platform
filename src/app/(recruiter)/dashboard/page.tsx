"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface RecruiterStat {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

interface MyJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  applications: number;
  shortlisted: number;
  interviews: number;
  status: "active" | "paused" | "closed";
  postedAt: string;
}

interface Activity {
  id: string;
  type: "application" | "interview" | "offer" | "rejection";
  candidate: string;
  job: string;
  description: string;
  time: string;
}

const stats: RecruiterStat[] = [
  { label: "My Open Jobs", value: "8", change: 2, icon: "💼", color: "bg-blue-100" },
  { label: "New Applications", value: "47", change: 12, icon: "📋", color: "bg-emerald-100" },
  { label: "Interviews This Week", value: "6", change: -1, icon: "📅", color: "bg-purple-100" },
  { label: "Offers Pending", value: "3", change: 1, icon: "🎯", color: "bg-amber-100" },
];

const myJobs: MyJob[] = [
  { id: "1", title: "Senior Frontend Engineer", department: "Engineering", location: "Remote", type: "Full-time", applications: 34, shortlisted: 8, interviews: 3, status: "active", postedAt: "2025-07-01" },
  { id: "2", title: "Product Manager", department: "Product", location: "San Francisco, CA", type: "Full-time", applications: 28, shortlisted: 6, interviews: 2, status: "active", postedAt: "2025-07-03" },
  { id: "3", title: "UX Designer", department: "Design", location: "Remote", type: "Full-time", applications: 19, shortlisted: 5, interviews: 2, status: "active", postedAt: "2025-07-05" },
  { id: "4", title: "Backend Engineer", department: "Engineering", location: "New York, NY", type: "Full-time", applications: 42, shortlisted: 10, interviews: 4, status: "active", postedAt: "2025-06-28" },
  { id: "5", title: "DevOps Engineer", department: "Infrastructure", location: "Remote", type: "Contract", applications: 15, shortlisted: 3, interviews: 1, status: "paused", postedAt: "2025-06-20" },
];

const recentActivity: Activity[] = [
  { id: "1", type: "application", candidate: "Sarah Chen", job: "Senior Frontend Engineer", description: "Applied with 92% AI match score", time: "2 hours ago" },
  { id: "2", type: "interview", candidate: "Marcus Johnson", job: "Product Manager", description: "Panel interview scheduled for Jul 15", time: "3 hours ago" },
  { id: "3", type: "offer", candidate: "Emily Rodriguez", job: "UX Designer", description: "Offer accepted - $125,000/year", time: "5 hours ago" },
  { id: "4", type: "application", candidate: "Alex Thompson", job: "Backend Engineer", description: "Technical assessment passed (88%)", time: "6 hours ago" },
  { id: "5", type: "rejection", candidate: "Nina Kowalski", job: "Senior Frontend Engineer", description: "Withdrawn from process", time: "1 day ago" },
  { id: "6", type: "application", candidate: "Priya Patel", job: "Senior Frontend Engineer", description: "New application received", time: "1 day ago" },
];

const activityConfig: Record<string, { color: string; bgColor: string }> = {
  application: { color: "text-blue-600", bgColor: "bg-blue-100" },
  interview: { color: "text-purple-600", bgColor: "bg-purple-100" },
  offer: { color: "text-emerald-600", bgColor: "bg-emerald-100" },
  rejection: { color: "text-red-600", bgColor: "bg-red-100" },
};

const statusConfig: Record<string, { variant: "default" | "primary" | "success" | "warning" | "danger" | "info" }> = {
  active: { variant: "success" },
  paused: { variant: "warning" },
  closed: { variant: "default" },
};

export default function RecruiterDashboardPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("week");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Recruiter Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, Lisa. Here&apos;s your recruitment overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post Job
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  stat.change > 0 ? "text-emerald-600" : stat.change < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {stat.change > 0 ? "+" : ""}{stat.change} this week
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">My Open Positions</h2>
                <Link href="/jobs" className="text-sm font-medium text-violet-600 hover:text-violet-700">View all</Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-border">
                {myJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                        <Badge variant={statusConfig[job.status]?.variant} size="sm">{job.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.department} · {job.location} · {job.type}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{job.applications}</p>
                        <p className="text-xs">Applied</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{job.shortlisted}</p>
                        <p className="text-xs">Shortlisted</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{job.interviews}</p>
                        <p className="text-xs">Interviews</p>
                      </div>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Pipeline by Job</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {myJobs.filter((j) => j.status === "active").slice(0, 4).map((job) => (
                  <div key={job.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{job.title}</span>
                      <span className="text-xs text-muted-foreground">{job.applications} total</span>
                    </div>
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gray-300 transition-all"
                        style={{ width: `${(job.applications / job.applications) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>Applied: {job.applications}</span>
                      <span>Shortlisted: {job.shortlisted}</span>
                      <span>Interviews: {job.interviews}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityConfig[activity.type]?.bgColor}`}>
                      <span className="text-sm">
                        {activity.type === "application" ? "📋" : activity.type === "interview" ? "📅" : activity.type === "offer" ? "🎯" : "❌"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.candidate}</span>
                        <span className="text-muted-foreground"> · {activity.job}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              <Link href="/jobs/new" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Post New Job
              </Link>
              <Link href="/candidates" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Add Candidate
              </Link>
              <Link href="/interviews" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Schedule Interview
              </Link>
              <Link href="/reports" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                View Reports
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Hiring Goal</h2>
            </CardHeader>
            <CardBody>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-24 w-24" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="62.8" strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-foreground">75%</p>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">6 of 8 hires made this quarter</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
