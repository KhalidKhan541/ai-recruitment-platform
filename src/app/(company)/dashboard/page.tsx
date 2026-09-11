"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CompanyStat {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  applications: number;
  interviews: number;
  status: "active" | "paused" | "closed";
  urgency: "high" | "medium" | "low";
  postedAt: string;
  hiringManager: string;
}

interface RecentHire {
  id: string;
  name: string;
  title: string;
  department: string;
  hiredAt: string;
  source: string;
}

interface TeamActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

const stats: CompanyStat[] = [
  { label: "Active Positions", value: "12", change: 3, icon: "💼", color: "bg-blue-100" },
  { label: "Total Applicants", value: "348", change: 45, icon: "👥", color: "bg-emerald-100" },
  { label: "Hired This Month", value: "8", change: 2, icon: "✅", color: "bg-violet-100" },
  { label: "Open Positions", value: "5", change: -1, icon: "📋", color: "bg-amber-100" },
];

const openPositions: OpenPosition[] = [
  { id: "1", title: "Senior Frontend Engineer", department: "Engineering", location: "Remote", applications: 34, interviews: 5, status: "active", urgency: "high", postedAt: "2025-07-01", hiringManager: "James Wilson" },
  { id: "2", title: "Product Manager", department: "Product", location: "San Francisco, CA", applications: 28, interviews: 3, status: "active", urgency: "medium", postedAt: "2025-07-03", hiringManager: "David Kim" },
  { id: "3", title: "UX Designer", department: "Design", location: "Remote", applications: 19, interviews: 4, status: "active", urgency: "medium", postedAt: "2025-07-05", hiringManager: "Jessica Wang" },
  { id: "4", title: "Backend Engineer", department: "Engineering", location: "New York, NY", applications: 42, interviews: 6, status: "active", urgency: "high", postedAt: "2025-06-28", hiringManager: "James Wilson" },
  { id: "5", title: "DevOps Engineer", department: "Infrastructure", location: "Remote", applications: 15, interviews: 2, status: "paused", urgency: "low", postedAt: "2025-06-20", hiringManager: "Sarah Lee" },
];

const recentHires: RecentHire[] = [
  { id: "1", name: "Emily Rodriguez", title: "UX Designer", department: "Design", hiredAt: "2025-07-12", source: "LinkedIn" },
  { id: "2", name: "Marcus Johnson", title: "Product Manager", department: "Product", hiredAt: "2025-07-08", source: "Referral" },
  { id: "3", name: "Alex Thompson", title: "Backend Engineer", department: "Engineering", hiredAt: "2025-07-05", source: "Indeed" },
];

const teamActivity: TeamActivity[] = [
  { id: "1", user: "James Wilson", action: "reviewed", target: "Sarah Chen's application", time: "2 hours ago" },
  { id: "2", user: "Lisa Park", action: "scheduled interview with", target: "Marcus Johnson", time: "3 hours ago" },
  { id: "3", user: "David Kim", action: "approved offer for", target: "Emily Rodriguez", time: "5 hours ago" },
  { id: "4", user: "Jessica Wang", action: "moved to technical round:", target: "Alex Thompson", time: "6 hours ago" },
  { id: "5", user: "Sarah Lee", action: "added to talent pool:", target: "Priya Patel", time: "1 day ago" },
];

function getInitials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-emerald-500", "bg-cyan-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "bg-red-100 text-red-700" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  low: { label: "Low", color: "bg-green-100 text-green-700" },
};

export default function CompanyDashboardPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Company Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your hiring pipeline and team performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Post New Job
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
                  {stat.change > 0 ? "+" : ""}{stat.change}
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
                <h2 className="text-lg font-semibold text-foreground">Open Positions</h2>
                <Link href="/jobs" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all</Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-border">
                {openPositions.map((position) => (
                  <Link
                    key={position.id}
                    href={`/jobs/${position.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{position.title}</p>
                        <Badge className={cn(urgencyConfig[position.urgency]?.color)} size="sm">{urgencyConfig[position.urgency]?.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{position.department} · {position.location}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{position.applications}</p>
                        <p className="text-xs">Applied</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{position.interviews}</p>
                        <p className="text-xs">Interviews</p>
                      </div>
                    </div>
                    <Badge variant={position.status === "active" ? "success" : position.status === "paused" ? "warning" : "default"} size="sm">
                      {position.status}
                    </Badge>
                    <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">Hiring Pipeline</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {[
                    { stage: "Applied", count: 348, color: "bg-gray-400" },
                    { stage: "Screening", count: 210, color: "bg-blue-400" },
                    { stage: "Interview", count: 86, color: "bg-indigo-400" },
                    { stage: "Offer", count: 18, color: "bg-purple-400" },
                    { stage: "Hired", count: 8, color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{item.stage}</span>
                        <span className="text-sm font-medium text-foreground">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all duration-500", item.color)}
                          style={{ width: `${(item.count / 348) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">Hiring Funnel</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {[
                    { stage: "Applied → Screening", rate: "60.3%", color: "text-emerald-600" },
                    { stage: "Screening → Interview", rate: "40.9%", color: "text-blue-600" },
                    { stage: "Interview → Offer", rate: "20.9%", color: "text-amber-600" },
                    { stage: "Offer → Hired", rate: "44.4%", color: "text-emerald-600" },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">{item.stage}</span>
                      <span className={cn("text-sm font-semibold", item.color)}>{item.rate}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Recent Hires</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {recentHires.map((hire) => (
                  <div key={hire.id} className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${getAvatarColor(hire.name)}`}>
                      {getInitials(hire.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{hire.name}</p>
                      <p className="text-xs text-muted-foreground">{hire.title} · {hire.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(hire.hiredAt).toLocaleDateString()}</p>
                      <Badge variant="default" size="sm">{hire.source}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
            <CardBody className="pt-0">
              <Link href="/candidates" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                View all hires →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Team Activity</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {teamActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {getInitials(activity.user)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span>
                        {" "}{activity.action}{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Department Breakdown</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { dept: "Engineering", openings: 5, hired: 4, color: "bg-blue-500" },
                  { dept: "Product", openings: 2, hired: 2, color: "bg-purple-500" },
                  { dept: "Design", openings: 1, hired: 1, color: "bg-pink-500" },
                  { dept: "Infrastructure", openings: 2, hired: 1, color: "bg-amber-500" },
                  { dept: "Data", openings: 2, hired: 0, color: "bg-emerald-500" },
                ].map((item) => (
                  <div key={item.dept} className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{item.dept}</span>
                        <span className="text-xs text-muted-foreground">{item.openings} open · {item.hired} hired</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
