"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface PipelineCandidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  jobTitle: string;
  stage: "applied" | "screening" | "phone_screen" | "technical" | "onsite" | "offer";
  matchScore: number;
  appliedAt: string;
  lastActivity: string;
  skills: string[];
  location: string;
}

interface PipelineColumn {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  count: number;
}

const stages: { id: PipelineCandidate["stage"]; label: string; color: string; bgColor: string }[] = [
  { id: "applied", label: "Applied", color: "text-gray-700", bgColor: "bg-gray-100" },
  { id: "screening", label: "Screening", color: "text-blue-700", bgColor: "bg-blue-100" },
  { id: "phone_screen", label: "Phone Screen", color: "text-indigo-700", bgColor: "bg-indigo-100" },
  { id: "technical", label: "Technical", color: "text-purple-700", bgColor: "bg-purple-100" },
  { id: "onsite", label: "Onsite", color: "text-pink-700", bgColor: "bg-pink-100" },
  { id: "offer", label: "Offer", color: "text-emerald-700", bgColor: "bg-emerald-100" },
];

const mockCandidates: PipelineCandidate[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@example.com", title: "Senior Frontend Engineer", jobTitle: "Senior Frontend Engineer", stage: "technical", matchScore: 92, appliedAt: "2025-07-01", lastActivity: "2025-07-14", skills: ["React", "TypeScript", "Next.js"], location: "San Francisco, CA" },
  { id: "2", name: "Marcus Johnson", email: "marcus@example.com", title: "Product Manager", jobTitle: "Product Manager", stage: "onsite", matchScore: 88, appliedAt: "2025-06-28", lastActivity: "2025-07-13", skills: ["Product Strategy", "Analytics", "Roadmapping"], location: "New York, NY" },
  { id: "3", name: "Emily Rodriguez", email: "emily@example.com", title: "UX Designer", jobTitle: "UX Designer", stage: "offer", matchScore: 95, appliedAt: "2025-06-20", lastActivity: "2025-07-12", skills: ["Figma", "Prototyping", "User Research"], location: "Austin, TX" },
  { id: "4", name: "Alex Thompson", email: "alex@example.com", title: "Backend Engineer", jobTitle: "Backend Engineer", stage: "phone_screen", matchScore: 85, appliedAt: "2025-07-05", lastActivity: "2025-07-11", skills: ["Node.js", "Python", "PostgreSQL"], location: "Seattle, WA" },
  { id: "5", name: "Priya Patel", email: "priya@example.com", title: "ML Engineer", jobTitle: "Data Scientist", stage: "screening", matchScore: 91, appliedAt: "2025-07-08", lastActivity: "2025-07-10", skills: ["Python", "TensorFlow", "PyTorch"], location: "Boston, MA" },
  { id: "6", name: "Michael Brown", email: "michael@example.com", title: "DevOps Engineer", jobTitle: "DevOps Engineer", stage: "applied", matchScore: 78, appliedAt: "2025-07-12", lastActivity: "2025-07-12", skills: ["Kubernetes", "Terraform", "AWS"], location: "Chicago, IL" },
  { id: "7", name: "Nina Kowalski", email: "nina@example.com", title: "Senior Frontend Engineer", jobTitle: "Senior Frontend Engineer", stage: "technical", matchScore: 89, appliedAt: "2025-07-03", lastActivity: "2025-07-09", skills: ["React", "Vue.js", "CSS"], location: "Remote" },
  { id: "8", name: "Carlos Mendez", email: "carlos@example.com", title: "Backend Engineer", jobTitle: "Backend Engineer", stage: "screening", matchScore: 82, appliedAt: "2025-07-10", lastActivity: "2025-07-10", skills: ["Java", "Spring Boot", "AWS"], location: "Miami, FL" },
  { id: "9", name: "Jessica Wang", email: "jessica@example.com", title: "Product Manager", jobTitle: "Product Manager", stage: "phone_screen", matchScore: 94, appliedAt: "2025-07-06", lastActivity: "2025-07-08", skills: ["Agile", "JIRA", "Data Analysis"], location: "Portland, OR" },
  { id: "10", name: "Tom Anderson", email: "tom@example.com", title: "Data Scientist", jobTitle: "Data Scientist", stage: "applied", matchScore: 76, appliedAt: "2025-07-13", lastActivity: "2025-07-13", skills: ["Python", "R", "Machine Learning"], location: "Denver, CO" },
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

function getMatchColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}

type ViewMode = "board" | "list";

export default function RecruiterPipelinePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  const jobs = useMemo(() => {
    const unique = [...new Set(mockCandidates.map((c) => c.jobTitle))];
    return ["all", ...unique];
  }, []);

  const filteredCandidates = useMemo(() => {
    let result = [...mockCandidates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (selectedJob !== "all") {
      result = result.filter((c) => c.jobTitle === selectedJob);
    }
    return result;
  }, [searchQuery, selectedJob]);

  const pipelineColumns: PipelineColumn[] = stages.map((stage) => ({
    ...stage,
    count: filteredCandidates.filter((c) => c.stage === stage.id).length,
  }));

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidate(candidateId);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Recruitment Pipeline</h1>
          <p className="mt-1 text-muted-foreground">
            Drag and drop candidates between stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("board")}
              className={cn("px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "board" ? "bg-violet-600 text-white" : "bg-card text-muted-foreground hover:bg-muted")}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "list" ? "bg-violet-600 text-white" : "bg-card text-muted-foreground hover:bg-muted")}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search candidates by name, title, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-xl text-sm bg-card placeholder:text-muted-foreground focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="px-3 py-2.5 border border-input rounded-xl text-sm bg-card focus:ring-2 focus:ring-violet-500 outline-none"
        >
          {jobs.map((job) => (
            <option key={job} value={job}>{job === "all" ? "All Positions" : job}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {pipelineColumns.map((col) => (
          <div key={col.id} className={`rounded-xl p-3 text-center ${col.bgColor}`}>
            <p className={`text-2xl font-bold ${col.color}`}>{col.count}</p>
            <p className="text-xs font-medium text-gray-600">{col.label}</p>
          </div>
        ))}
      </div>

      {viewMode === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const columnCandidates = filteredCandidates.filter((c) => c.stage === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className={`rounded-t-xl px-4 py-2.5 ${stage.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${stage.color}`}>{stage.label}</h3>
                    <span className={`text-xs font-medium ${stage.color} bg-white/50 px-2 py-0.5 rounded-full`}>
                      {columnCandidates.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 bg-gray-100 rounded-b-xl p-2 min-h-[200px]">
                  {columnCandidates.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">No candidates</div>
                  ) : (
                    columnCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        draggable
                        onDragStart={() => handleDragStart(candidate.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "bg-card rounded-lg p-3 border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
                          draggedCandidate === candidate.id && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${getAvatarColor(candidate.name)}`}>
                            {getInitials(candidate.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn("text-xs font-semibold", getMatchColor(candidate.matchScore))}>
                            {candidate.matchScore}% match
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.skills.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{skill}</span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{candidate.skills.length - 2}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <span className="text-[10px] text-muted-foreground">{candidate.location}</span>
                          <Link href={`/candidates/${candidate.id}`} className="text-[10px] text-violet-600 hover:text-violet-700 font-medium">
                            View
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Candidate</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Position</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Stage</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Match</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Applied</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCandidates.map((candidate) => {
                  const stageInfo = stages.find((s) => s.id === candidate.stage);
                  return (
                    <tr key={candidate.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${getAvatarColor(candidate.name)}`}>
                            {getInitials(candidate.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{candidate.title}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn(stageInfo?.bgColor, stageInfo?.color)} size="sm">{stageInfo?.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-sm font-semibold", getMatchColor(candidate.matchScore))}>{candidate.matchScore}%</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(candidate.appliedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/candidates/${candidate.id}`} className="text-sm text-violet-600 hover:text-violet-700 font-medium">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
