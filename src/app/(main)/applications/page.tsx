"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { mockApplications } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";

type StatusFilter = "all" | "applied" | "reviewing" | "phone_screen" | "technical" | "onsite" | "offer" | "hired" | "rejected";

function getInitials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-emerald-500", "bg-cyan-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    applied: { label: "Applied", className: "badge-info" },
    reviewing: { label: "Reviewing", className: "badge-warning" },
    phone_screen: { label: "Phone Screen", className: "badge-info" },
    technical: { label: "Technical", className: "badge-primary" },
    onsite: { label: "Onsite", className: "badge-primary" },
    interview: { label: "Interview", className: "badge-primary" },
    offer: { label: "Offer", className: "badge-success" },
    hired: { label: "Hired", className: "badge-success" },
    rejected: { label: "Rejected", className: "badge-danger" },
    withdrawn: { label: "Withdrawn", className: "badge-neutral" },
  };
  return map[status] || { label: status, className: "badge-neutral" };
}

function getRecommendationBadge(rec: string) {
  const map: Record<string, { label: string; className: string }> = {
    strongly_recommend: { label: "Strongly Recommend", className: "bg-emerald-100 text-emerald-700" },
    recommend: { label: "Recommend", className: "bg-blue-100 text-blue-700" },
    neutral: { label: "Neutral", className: "bg-gray-100 text-gray-700" },
    do_not_recommend: { label: "Do Not Recommend", className: "bg-red-100 text-red-700" },
  };
  return map[rec] || { label: rec, className: "bg-gray-100 text-gray-700" };
}

const statusOrder = ["applied", "reviewing", "phone_screen", "technical", "onsite", "offer", "hired", "rejected"];

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "score" | "name">("newest");

  const filteredApplications = useMemo(() => {
    let apps = [...mockApplications];

    if (filter !== "all") {
      apps = apps.filter((a) => a.status === filter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.candidate.name.toLowerCase().includes(q) ||
          a.job.title.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "score":
        apps.sort((a, b) => (b.aiAnalysis?.overallScore || 0) - (a.aiAnalysis?.overallScore || 0));
        break;
      case "name":
        apps.sort((a, b) => a.candidate.name.localeCompare(b.candidate.name));
        break;
      case "newest":
      default:
        apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return apps;
  }, [filter, searchQuery, sortBy]);

  const statusCounts = useMemo(
    () => ({
      all: mockApplications.length,
      applied: mockApplications.filter((a) => a.status === "applied").length,
      reviewing: mockApplications.filter((a) => a.status === "reviewing").length,
      phone_screen: mockApplications.filter((a) => a.status === "phone_screen").length,
      technical: mockApplications.filter((a) => a.status === "technical").length,
      onsite: mockApplications.filter((a) => a.status === "onsite").length,
      offer: mockApplications.filter((a) => a.status === "offer").length,
      hired: mockApplications.filter((a) => a.status === "hired").length,
      rejected: mockApplications.filter((a) => a.status === "rejected").length,
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Applications</h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage all candidate applications across your job postings.
          </p>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Pipeline Overview</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {statusOrder.map((status, i) => {
            const count = mockApplications.filter((a) => a.status === status).length;
            const total = mockApplications.length;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            return (
              <div key={status} className="flex-1 min-w-[60px]">
                <div className="mb-1 text-center">
                  <span className="text-xs font-medium text-foreground">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
                <div className="mt-1 text-center">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "applied", "reviewing", "phone_screen", "technical", "offer", "hired", "rejected"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              <span className="ml-1 opacity-70">({statusCounts[f]})</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="search-input-wrapper">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-lg border border-input bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary lg:w-64"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="newest">Newest first</option>
            <option value="score">Highest AI score</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">No applications found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search." : "No applications match the current filter."}
          </p>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Position</th>
                  <th className="hidden sm:table-cell">Status</th>
                  <th className="hidden md:table-cell">AI Score</th>
                  <th className="hidden lg:table-cell">Applied</th>
                  <th className="hidden xl:table-cell">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const status = getStatusBadge(app.status);
                  const rec = app.aiAnalysis?.recommendation ? getRecommendationBadge(app.aiAnalysis.recommendation) : null;
                  return (
                    <tr key={app.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${getAvatarColor(app.candidate.name)}`}>
                            {getInitials(app.candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{app.candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{app.candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{app.job.title}</p>
                          <p className="text-xs text-muted-foreground">{app.job.department}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className={`badge ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        {app.aiAnalysis && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${
                                  app.aiAnalysis.overallScore >= 90
                                    ? "bg-emerald-500"
                                    : app.aiAnalysis.overallScore >= 70
                                    ? "bg-blue-500"
                                    : app.aiAnalysis.overallScore >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${app.aiAnalysis.overallScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{app.aiAnalysis.overallScore}</span>
                          </div>
                        )}
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{formatRelativeTime(app.createdAt)}</span>
                      </td>
                      <td className="hidden xl:table-cell">
                        {rec && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rec.className}`}>
                            {rec.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
