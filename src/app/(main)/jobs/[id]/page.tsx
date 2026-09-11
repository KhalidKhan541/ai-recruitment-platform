"use client";

import Link from "next/link";
import { use } from "react";
import { mockJobs, mockApplications } from "@/lib/mock-data";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

function getInitials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: "Published", className: "badge-success" },
    draft: { label: "Draft", className: "badge-neutral" },
    closed: { label: "Closed", className: "badge-danger" },
  };
  return map[status] || { label: status, className: "badge-neutral" };
}

function getAppStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    applied: { label: "Applied", className: "badge-info" },
    reviewing: { label: "Reviewing", className: "badge-warning" },
    phone_screen: { label: "Phone Screen", className: "badge-info" },
    technical: { label: "Technical", className: "badge-primary" },
    onsite: { label: "Onsite", className: "badge-primary" },
    offer: { label: "Offer", className: "badge-success" },
    hired: { label: "Hired", className: "badge-success" },
    rejected: { label: "Rejected", className: "badge-danger" },
  };
  return map[status] || { label: status, className: "badge-neutral" };
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const job = mockJobs.find((j) => j.id === id);
  const jobApps = mockApplications.filter((a) => a.job.id === id);

  if (!job) {
    return (
      <div className="space-y-6">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Jobs
        </Link>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Job not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">This job posting doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(job.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{job.title}</h1>
            <span className={`badge ${status.className}`}>{status.label}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {job.department}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {job.salary ? `${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}` : "Negotiable"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {job.type} &middot; {job.remote}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Applicants", value: job.applicationCount, color: "bg-blue-100 text-blue-600" },
          { label: "In Pipeline", value: jobApps.filter((a) => !["hired", "rejected", "withdrawn"].includes(a.status)).length, color: "bg-amber-100 text-amber-600" },
          { label: "Interviews", value: jobApps.filter((a) => ["technical", "onsite", "interview"].includes(a.status)).length, color: "bg-purple-100 text-purple-600" },
          { label: "Offers", value: jobApps.filter((a) => a.status === "offer").length, color: "bg-emerald-100 text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </div>

          {job.requirements && (
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.responsibilities && (
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {resp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Applicants */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Applicants</h2>
              <Link href="/applications" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View all
              </Link>
            </div>
            {jobApps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applicants yet.</p>
            ) : (
              <div className="space-y-3">
                {jobApps.slice(0, 5).map((app) => {
                  const appStatus = getAppStatusBadge(app.status);
                  return (
                    <div key={app.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${getAvatarColor(app.candidate.name)}`}>
                        {getInitials(app.candidate.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{app.candidate.name}</p>
                        <p className="text-xs text-muted-foreground">Applied {formatRelativeTime(app.createdAt)}</p>
                      </div>
                      <span className={`badge ${appStatus.className}`}>{appStatus.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Job Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Department", value: job.department },
                { label: "Location", value: job.location },
                { label: "Type", value: job.type },
                { label: "Experience", value: job.experienceLevel || "Not specified" },
                { label: "Remote", value: job.remote },
                { label: "Posted", value: formatRelativeTime(job.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium text-foreground capitalize">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {job.benefits && job.benefits.length > 0 && (
            <div className="card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Benefits</h3>
              <ul className="space-y-2">
                {job.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
