"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ReportMetric {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
}

interface PipelineData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface SourceData {
  source: string;
  applications: number;
  hires: number;
  conversionRate: number;
  color: string;
}

interface TimeToHireData {
  role: string;
  avgDays: number;
  target: number;
  trend: "improving" | "stable" | "declining";
}

interface DiversityData {
  category: string;
  metric: string;
  value: number;
  target: number;
  color: string;
}

const metrics: ReportMetric[] = [
  { label: "Total Applications", value: "1,284", change: 12.5, changeLabel: "vs last month", icon: "📋" },
  { label: "Hired This Month", value: "18", change: 28.6, changeLabel: "vs last month", icon: "✅" },
  { label: "Avg. Time to Hire", value: "24d", change: -8.3, changeLabel: "vs last month", icon: "⏱️" },
  { label: "Offer Acceptance", value: "87.5%", change: 5.2, changeLabel: "vs last month", icon: "🎯" },
  { label: "Cost per Hire", value: "$4,250", change: -12.1, changeLabel: "vs last month", icon: "💰" },
  { label: "Quality Score", value: "4.6/5", change: 3.1, changeLabel: "vs last month", icon: "⭐" },
];

const pipelineData: PipelineData[] = [
  { stage: "Applied", count: 456, percentage: 100, color: "bg-gray-400" },
  { stage: "Screening", count: 312, percentage: 68.4, color: "bg-blue-400" },
  { stage: "Phone Screen", count: 198, percentage: 43.4, color: "bg-indigo-400" },
  { stage: "Technical", count: 124, percentage: 27.2, color: "bg-purple-400" },
  { stage: "Onsite", count: 67, percentage: 14.7, color: "bg-pink-400" },
  { stage: "Offer", count: 28, percentage: 6.1, color: "bg-emerald-400" },
  { stage: "Hired", count: 18, percentage: 3.9, color: "bg-green-500" },
];

const sourceData: SourceData[] = [
  { source: "LinkedIn", applications: 423, hires: 8, conversionRate: 1.89, color: "bg-blue-500" },
  { source: "Indeed", applications: 312, hires: 5, conversionRate: 1.60, color: "bg-purple-500" },
  { source: "Company Website", applications: 198, hires: 3, conversionRate: 1.52, color: "bg-emerald-500" },
  { source: "Employee Referrals", applications: 156, hires: 4, conversionRate: 2.56, color: "bg-amber-500" },
  { source: "AngelList", applications: 108, hires: 2, conversionRate: 1.85, color: "bg-rose-500" },
  { source: "Other", applications: 87, hires: 1, conversionRate: 1.15, color: "bg-gray-400" },
];

const timeToHireData: TimeToHireData[] = [
  { role: "Senior Frontend Engineer", avgDays: 28, target: 25, trend: "declining" },
  { role: "Product Manager", avgDays: 35, target: 30, trend: "stable" },
  { role: "UX Designer", avgDays: 22, target: 20, trend: "improving" },
  { role: "Backend Engineer", avgDays: 31, target: 28, trend: "stable" },
  { role: "Data Scientist", avgDays: 38, target: 35, trend: "declining" },
  { role: "DevOps Engineer", avgDays: 26, target: 25, trend: "improving" },
];

const diversityData: DiversityData[] = [
  { category: "Gender", metric: "Female", value: 42, target: 50, color: "bg-pink-500" },
  { category: "Gender", metric: "Male", value: 54, target: 50, color: "bg-blue-500" },
  { category: "Gender", metric: "Non-binary", value: 4, target: 0, color: "bg-purple-500" },
  { category: "Ethnicity", metric: "White", value: 38, target: 40, color: "bg-gray-400" },
  { category: "Ethnicity", metric: "Asian", value: 28, target: 25, color: "bg-emerald-500" },
  { category: "Ethnicity", metric: "Hispanic", value: 18, target: 20, color: "bg-amber-500" },
  { category: "Ethnicity", metric: "Black", value: 12, target: 15, color: "bg-rose-500" },
  { category: "Ethnicity", metric: "Other", value: 4, target: 0, color: "bg-indigo-500" },
];

type ReportTab = "overview" | "pipeline" | "sources" | "time" | "diversity";
type TimeRange = "7d" | "30d" | "90d" | "12m";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const totalApplications = sourceData.reduce((sum, s) => sum + s.applications, 0);
  const totalHires = sourceData.reduce((sum, s) => sum + s.hires, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Insights into your recruitment performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            <Button variant="outline" leftIcon={<span>📥</span>}>Export</Button>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["overview", "pipeline", "sources", "time", "diversity"] as ReportTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              {tab === "time" ? "Time to Hire" : tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <Card key={metric.label}>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{metric.icon}</span>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                          <p className="text-sm text-gray-500">{metric.label}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full",
                          metric.change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {metric.change > 0 ? "+" : ""}{metric.change}%
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Hiring Funnel</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {pipelineData.map((stage) => (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{stage.stage}</span>
                          <span className="text-sm font-medium text-gray-900">{stage.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn("h-2 rounded-full transition-all duration-500", stage.color)}
                            style={{ width: `${stage.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Top Sources</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {sourceData.slice(0, 5).map((source) => (
                      <div key={source.source} className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", source.color)} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{source.source}</span>
                            <span className="text-sm text-gray-500">{source.applications} apps</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={cn("h-1.5 rounded-full", source.color)}
                              style={{ width: `${(source.applications / totalApplications) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Monthly Hiring Trend</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-6 gap-2 items-end h-48">
                  {[65, 78, 45, 92, 88, 105].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-500">{val}</span>
                      <div
                        className="w-full bg-blue-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${(val / 105) * 100}%` }}
                      />
                      <span className="text-xs text-gray-500">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Pipeline by Stage</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {pipelineData.map((stage) => (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">{stage.stage}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-6 relative">
                            <div
                              className={cn("h-6 rounded-full flex items-center px-3", stage.color)}
                              style={{ width: `${stage.percentage}%` }}
                            >
                              <span className="text-xs font-medium text-white">{stage.count}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">
                          {stage.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Stage Conversion Rates</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {pipelineData.slice(0, -1).map((stage, idx) => {
                      const nextStage = pipelineData[idx + 1];
                      const rate = ((nextStage.count / stage.count) * 100).toFixed(1);
                      return (
                        <div key={stage.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm">
                            <span className="text-gray-900 font-medium">{stage.stage}</span>
                            <span className="text-gray-400 mx-2">→</span>
                            <span className="text-gray-900 font-medium">{nextStage.stage}</span>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              parseFloat(rate) >= 50 ? "text-emerald-600" : parseFloat(rate) >= 30 ? "text-amber-600" : "text-red-600"
                            )}
                          >
                            {rate}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Pipeline Velocity</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Avg. Applications/Day", value: "15.2", icon: "📊" },
                    { label: "Avg. Time in Screening", value: "3.2d", icon: "⏱️" },
                    { label: "Avg. Time in Technical", value: "5.8d", icon: "💻" },
                    { label: "Avg. Time to Offer", value: "2.1d", icon: "📋" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-gray-50 rounded-lg text-center">
                      <span className="text-2xl">{stat.icon}</span>
                      <p className="text-xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Source Performance</h2>
              </CardHeader>
              <CardBody className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Applications</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hires</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Conversion</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sourceData.map((source) => (
                      <tr key={source.source} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", source.color)} />
                            <span className="font-medium text-gray-900">{source.source}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{source.applications.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{source.hires}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-sm font-medium",
                            source.conversionRate >= 2 ? "text-emerald-600" : source.conversionRate >= 1.5 ? "text-blue-600" : "text-gray-600"
                          )}>
                            {source.conversionRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={cn("h-1.5 rounded-full", source.color)}
                                style={{ width: `${(source.applications / totalApplications) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {((source.applications / totalApplications) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">Total</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{totalApplications.toLocaleString()}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{totalHires}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{((totalHires / totalApplications) * 100).toFixed(2)}%</td>
                      <td className="px-6 py-3">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </CardBody>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Applications by Source</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {sourceData.map((source) => (
                      <div key={source.source} className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", source.color)} />
                        <span className="text-sm text-gray-600 w-32">{source.source}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className={cn("h-4 rounded-full", source.color)}
                            style={{ width: `${(source.applications / totalApplications) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                          {source.applications}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Hires by Source</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {sourceData.map((source) => (
                      <div key={source.source} className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", source.color)} />
                        <span className="text-sm text-gray-600 w-32">{source.source}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className={cn("h-4 rounded-full", source.color)}
                            style={{ width: `${(source.hires / totalHires) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                          {source.hires}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "time" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Time to Hire by Role</h2>
              </CardHeader>
              <CardBody className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Avg. Days</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Target</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {timeToHireData.map((item) => (
                      <tr key={item.role} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.role}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.avgDays} days</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.target} days</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={cn(
                                  "h-2 rounded-full",
                                  item.avgDays <= item.target ? "bg-emerald-500" : item.avgDays <= item.target + 5 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${Math.min((item.avgDays / (item.target * 1.5)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className={cn(
                              "text-xs font-medium",
                              item.avgDays <= item.target ? "text-emerald-600" : item.avgDays <= item.target + 5 ? "text-amber-600" : "text-red-600"
                            )}>
                              {item.avgDays <= item.target ? "On Target" : `+${item.avgDays - item.target}d`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={item.trend === "improving" ? "success" : item.trend === "stable" ? "default" : "warning"}
                            size="sm"
                          >
                            {item.trend === "improving" ? "↑" : item.trend === "stable" ? "→" : "↓"} {item.trend}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Time to Hire Trend</h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-6 gap-2 items-end h-40">
                    {[32, 28, 35, 24, 22, 24].map((val, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500">{val}d</span>
                        <div
                          className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
                          style={{ height: `${(val / 35) * 100}%` }}
                        />
                        <span className="text-xs text-gray-500">
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Hiring Speed Metrics</h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Fastest Hire", value: "14d", sub: "UX Designer" },
                      { label: "Slowest Hire", value: "42d", sub: "Data Scientist" },
                      { label: "Median", value: "26d", sub: "All roles" },
                      { label: "Target", value: "25d", sub: "Company goal" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "diversity" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Gender Distribution</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {diversityData.filter((d) => d.category === "Gender").map((item) => (
                      <div key={item.metric}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{item.metric}</span>
                          <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 relative">
                          <div
                            className={cn("h-3 rounded-full", item.color)}
                            style={{ width: `${item.value}%` }}
                          />
                          {item.target > 0 && (
                            <div
                              className="absolute top-0 h-3 w-0.5 bg-gray-900"
                              style={{ left: `${item.target}%` }}
                            />
                          )}
                        </div>
                        {item.target > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">Target: {item.target}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Ethnicity Distribution</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {diversityData.filter((d) => d.category === "Ethnicity").map((item) => (
                      <div key={item.metric}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{item.metric}</span>
                          <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 relative">
                          <div
                            className={cn("h-3 rounded-full", item.color)}
                            style={{ width: `${item.value}%` }}
                          />
                          {item.target > 0 && (
                            <div
                              className="absolute top-0 h-3 w-0.5 bg-gray-900"
                              style={{ left: `${item.target}%` }}
                            />
                          )}
                        </div>
                        {item.target > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">Target: {item.target}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Diversity Hiring Summary</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Gender Parity Score", value: "84%", icon: "⚖️" },
                    { label: "Ethnic Diversity Index", value: "0.72", icon: "🌍" },
                    { label: "Inclusion Rate", value: "91%", icon: "🤝" },
                    { label: "Bias-Free Score", value: "96%", icon: "✅" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-gray-50 rounded-lg text-center">
                      <span className="text-2xl">{stat.icon}</span>
                      <p className="text-xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
              <CardFooter>
                <Button variant="outline" className="w-full">Download Full Diversity Report</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
