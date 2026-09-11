"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { mockCandidates } from "@/lib/mock-data";

type StatusFilter = "all" | "new" | "screening" | "interview" | "offer";

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    new: { label: "New", className: "badge-info" },
    screening: { label: "Screening", className: "badge-warning" },
    interview: { label: "Interview", className: "badge-primary" },
    offer: { label: "Offer", className: "badge-success" },
    hired: { label: "Hired", className: "badge-success" },
    rejected: { label: "Rejected", className: "badge-danger" },
  };
  return map[status] || { label: status, className: "badge-neutral" };
}

function getInitials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getSkillColor(level: string) {
  const map: Record<string, string> = {
    expert: "bg-emerald-100 text-emerald-700",
    advanced: "bg-blue-100 text-blue-700",
    intermediate: "bg-amber-100 text-amber-700",
    beginner: "bg-gray-100 text-gray-700",
  };
  return map[level] || "bg-gray-100 text-gray-700";
}

export default function CandidatesPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCandidates = useMemo(() => {
    let candidates = [...mockCandidates];

    if (filter !== "all") {
      candidates = candidates.filter((c) => c.status === filter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.skills?.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    return candidates;
  }, [filter, searchQuery]);

  const statusCounts = useMemo(
    () => ({
      all: mockCandidates.length,
      new: mockCandidates.filter((c) => c.status === "new").length,
      screening: mockCandidates.filter((c) => c.status === "screening").length,
      interview: mockCandidates.filter((c) => c.status === "interview").length,
      offer: mockCandidates.filter((c) => c.status === "offer").length,
    }),
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Candidates</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your candidate pool and track their progress.
          </p>
        </div>
        <button className="btn-primary">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Candidate
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        {(["all", "new", "screening", "interview", "offer"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`card text-left transition-all ${
              filter === s ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
          >
            <p className="text-sm text-muted-foreground capitalize">{s === "all" ? "Total" : s}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{statusCounts[s]}</p>
          </button>
        ))}
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="search-input-wrapper">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            placeholder="Search by name, title, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-64 rounded-lg border border-input bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary lg:w-80"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Candidates Grid/List */}
      {filteredCandidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">No candidates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search." : "Start building your candidate pool."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.map((candidate) => {
            const status = getStatusBadge(candidate.status);
            return (
              <Link
                key={candidate.id}
                href={`/candidates/${candidate.id}`}
                className="card group"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(candidate.name)}`}>
                    {getInitials(candidate.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {candidate.name}
                      </h3>
                      {candidate.aiScore && (
                        <span className="text-xs font-bold text-emerald-600">{candidate.aiScore}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{candidate.title}</p>
                    <p className="text-xs text-muted-foreground">{candidate.location}</p>
                  </div>
                  <span className={`badge ${status.className}`}>{status.label}</span>
                </div>
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 4).map((skill) => (
                      <span key={skill.name} className={`rounded-md px-2 py-0.5 text-xs font-medium ${getSkillColor(skill.level)}`}>
                        {skill.name}
                      </span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        +{candidate.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th className="hidden sm:table-cell">Location</th>
                  <th className="hidden md:table-cell">Experience</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">AI Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => {
                  const status = getStatusBadge(candidate.status);
                  return (
                    <tr key={candidate.id}>
                      <td>
                        <Link href={`/candidates/${candidate.id}`} className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${getAvatarColor(candidate.name)}`}>
                            {getInitials(candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.title}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell text-sm text-muted-foreground">{candidate.location}</td>
                      <td className="hidden md:table-cell text-sm text-muted-foreground">{candidate.experience} years</td>
                      <td><span className={`badge ${status.className}`}>{status.label}</span></td>
                      <td className="hidden lg:table-cell">
                        {candidate.aiScore && (
                          <span className="text-sm font-bold text-emerald-600">{candidate.aiScore}</span>
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
