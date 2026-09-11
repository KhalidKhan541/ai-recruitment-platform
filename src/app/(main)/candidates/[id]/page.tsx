"use client";

import Link from "next/link";
import { use } from "react";
import { mockCandidates, mockApplications } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";

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

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const candidate = mockCandidates.find((c) => c.id === id);
  const candidateApps = mockApplications.filter((a) => a.candidate.id === id);

  if (!candidate) {
    return (
      <div className="space-y-6">
        <Link href="/candidates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Candidates
        </Link>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Candidate not found</h3>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(candidate.status);

  return (
    <div className="space-y-6">
      <Link href="/candidates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Candidates
      </Link>

      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${getAvatarColor(candidate.name)}`}>
            {getInitials(candidate.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{candidate.name}</h1>
                  <span className={`badge ${status.className}`}>{status.label}</span>
                </div>
                <p className="mt-1 text-lg text-muted-foreground">{candidate.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {candidate.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    {candidate.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {candidate.phone}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {candidate.linkedIn && (
                  <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">
                    LinkedIn
                  </a>
                )}
                <button className="btn-primary btn-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Score & Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "AI Match Score", value: candidate.aiScore || "N/A", color: "text-emerald-600", suffix: candidate.aiScore ? "/100" : "" },
          { label: "Experience", value: `${candidate.experience} years`, color: "text-foreground" },
          { label: "Applications", value: candidateApps.length, color: "text-foreground" },
          { label: "Last Active", value: formatRelativeTime(candidate.updatedAt), color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}{stat.suffix || ""}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {candidate.aiSummary && (
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-foreground">AI Analysis</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{candidate.aiSummary}</p>
            </div>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium text-foreground">{skill.name}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${getSkillColor(skill.level)}`}>
                      {skill.level}
                    </span>
                    {skill.yearsOfExperience && (
                      <span className="text-xs text-muted-foreground">{skill.yearsOfExperience}y</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work History */}
          {candidate.workHistory && candidate.workHistory.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Work Experience</h2>
              <div className="space-y-4">
                {candidate.workHistory.map((work, i) => (
                  <div key={i} className="relative flex gap-4">
                    {i < candidate.workHistory!.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                    )}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {work.company[0]}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{work.title}</h3>
                        {work.current && (
                          <span className="badge-success text-xs">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{work.company}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {work.startDate} - {work.current ? "Present" : work.endDate}
                      </p>
                      {work.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{work.description}</p>
                      )}
                      {work.achievements && work.achievements.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {work.achievements.map((achievement, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Education</h2>
              <div className="space-y-4">
                {candidate.education.map((edu, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{edu.degree} in {edu.field}</h3>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                        {edu.gpa && ` · GPA: ${edu.gpa}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Candidate Info</h3>
            <dl className="space-y-3">
              {[
                { label: "Source", value: candidate.source || "Direct" },
                { label: "Available", value: "Yes" },
                { label: "Relocate", value: "Open" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Applications */}
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Applications</h3>
            {candidateApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {candidateApps.map((app) => (
                  <Link key={app.id} href="/applications" className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                    <p className="text-sm font-medium text-foreground">{app.job.title}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`badge ${getStatusBadge(app.status).className}`}>
                        {getStatusBadge(app.status).label}
                      </span>
                      {app.aiAnalysis && (
                        <span className="text-xs font-bold text-emerald-600">{app.aiAnalysis.overallScore}/100</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <button className="btn-secondary w-full justify-start text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Send Email
              </button>
              <button className="btn-secondary w-full justify-start text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Schedule Interview
              </button>
              <button className="btn-secondary w-full justify-start text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Add to Talent Pool
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
