"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface TalentPool {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  candidateCount: number;
  activeJobs: number;
  lastUpdated: string;
  tags: string[];
  topSkills: string[];
  conversionRate: number;
  avgTimeToHire: number;
  createdBy: string;
}

interface PoolCandidate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  location: string;
  experience: number;
  skills: string[];
  lastContacted: string;
  status: "active" | "passive" | "hired" | "archived";
  matchScore: number;
}

const mockPools: TalentPool[] = [
  {
    id: "1",
    name: "Senior Engineers",
    description: "Experienced engineers with 5+ years of experience",
    color: "bg-blue-500",
    icon: "👨‍💻",
    candidateCount: 156,
    activeJobs: 12,
    lastUpdated: "2025-07-14",
    tags: ["Engineering", "Senior", "Technical"],
    topSkills: ["React", "Node.js", "Python", "AWS"],
    conversionRate: 34.5,
    avgTimeToHire: 28,
    createdBy: "Lisa Park",
  },
  {
    id: "2",
    name: "Product Leaders",
    description: "Product managers and directors with strategic experience",
    color: "bg-purple-500",
    icon: "🎯",
    candidateCount: 89,
    activeJobs: 5,
    lastUpdated: "2025-07-13",
    tags: ["Product", "Leadership", "Strategy"],
    topSkills: ["Product Strategy", "Analytics", "Roadmapping"],
    conversionRate: 42.1,
    avgTimeToHire: 35,
    createdBy: "David Kim",
  },
  {
    id: "3",
    name: "Design Talent",
    description: "UI/UX designers and creative professionals",
    color: "bg-pink-500",
    icon: "🎨",
    candidateCount: 67,
    activeJobs: 3,
    lastUpdated: "2025-07-12",
    tags: ["Design", "Creative", "UX"],
    topSkills: ["Figma", "Sketch", "Prototyping", "User Research"],
    conversionRate: 28.9,
    avgTimeToHire: 22,
    createdBy: "Jessica Wang",
  },
  {
    id: "4",
    name: "Data & ML Experts",
    description: "Data scientists and machine learning engineers",
    color: "bg-emerald-500",
    icon: "📊",
    candidateCount: 112,
    activeJobs: 8,
    lastUpdated: "2025-07-14",
    tags: ["Data", "ML", "Analytics"],
    topSkills: ["Python", "TensorFlow", "SQL", "Spark"],
    conversionRate: 38.2,
    avgTimeToHire: 31,
    createdBy: "Tom Anderson",
  },
  {
    id: "5",
    name: "DevOps & SRE",
    description: "Infrastructure and reliability engineers",
    color: "bg-amber-500",
    icon: "🔧",
    candidateCount: 78,
    activeJobs: 6,
    lastUpdated: "2025-07-11",
    tags: ["DevOps", "Infrastructure", "Cloud"],
    topSkills: ["AWS", "Kubernetes", "Terraform", "Docker"],
    conversionRate: 41.3,
    avgTimeToHire: 26,
    createdBy: "Sarah Lee",
  },
  {
    id: "6",
    name: "Sales Stars",
    description: "Top-performing sales professionals and account executives",
    color: "bg-rose-500",
    icon: "📈",
    candidateCount: 94,
    activeJobs: 4,
    lastUpdated: "2025-07-10",
    tags: ["Sales", "Revenue", "Account Management"],
    topSkills: ["B2B Sales", "CRM", "Negotiation", "Pipeline Management"],
    conversionRate: 45.7,
    avgTimeToHire: 19,
    createdBy: "Mark Chen",
  },
];

const mockPoolCandidates: PoolCandidate[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@example.com", title: "Senior Frontend Engineer", location: "San Francisco, CA", experience: 8, skills: ["React", "TypeScript", "Next.js"], lastContacted: "2025-07-14", status: "active", matchScore: 95 },
  { id: "2", name: "Marcus Johnson", email: "marcus@example.com", title: "Staff Engineer", location: "New York, NY", experience: 12, skills: ["Java", "Spring Boot", "AWS"], lastContacted: "2025-07-12", status: "passive", matchScore: 88 },
  { id: "3", name: "Emily Rodriguez", email: "emily@example.com", title: "Senior Backend Engineer", location: "Austin, TX", experience: 6, skills: ["Node.js", "Python", "PostgreSQL"], lastContacted: "2025-07-10", status: "active", matchScore: 91 },
  { id: "4", name: "Alex Thompson", email: "alex@example.com", title: "DevOps Engineer", location: "Seattle, WA", experience: 5, skills: ["Kubernetes", "Terraform", "AWS"], lastContacted: "2025-07-08", status: "active", matchScore: 86 },
  { id: "5", name: "Priya Patel", email: "priya@example.com", title: "ML Engineer", location: "Boston, MA", experience: 7, skills: ["Python", "TensorFlow", "PyTorch"], lastContacted: "2025-07-06", status: "passive", matchScore: 93 },
];

const statusConfig: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "info" }> = {
  active: { label: "Active", variant: "success" },
  passive: { label: "Passive", variant: "warning" },
  hired: { label: "Hired", variant: "primary" },
  archived: { label: "Archived", variant: "default" },
};

type ViewMode = "pools" | "candidates";

export default function TalentPoolsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("pools");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredPools = useMemo(() => {
    if (!searchQuery) return mockPools;
    const q = searchQuery.toLowerCase();
    return mockPools.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredCandidates = useMemo(() => {
    let result = [...mockPoolCandidates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [searchQuery]);

  const totalCandidates = mockPools.reduce((sum, p) => sum + p.candidateCount, 0);
  const totalJobs = mockPools.reduce((sum, p) => sum + p.activeJobs, 0);
  const avgConversion = mockPools.reduce((sum, p) => sum + p.conversionRate, 0) / mockPools.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Talent Pools</h1>
            <p className="text-sm text-gray-500 mt-1">Organize and nurture candidate talent pools</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => { setViewMode("pools"); setSelectedPool(null); }}
                className={cn("px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "pools" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50")}
              >
                Pools
              </button>
              <button
                onClick={() => setViewMode("candidates")}
                className={cn("px-3 py-1.5 text-sm font-medium transition-colors", viewMode === "candidates" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50")}
              >
                All Candidates
              </button>
            </div>
            <Button variant="primary" leftIcon={<span>+</span>} onClick={() => setShowCreateModal(true)}>
              Create Pool
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl"><span className="text-2xl">🏊</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockPools.length}</p>
                <p className="text-sm text-gray-500">Talent Pools</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl"><span className="text-2xl">👥</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCandidates.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Candidates</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl"><span className="text-2xl">💼</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
                <p className="text-sm text-gray-500">Active Jobs</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl"><span className="text-2xl">📊</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgConversion.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Avg. Conversion</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search pools and candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {viewMode === "pools" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPools.map((pool) => (
              <Card key={pool.id} hover onClick={() => { setSelectedPool(pool.id); setViewMode("candidates"); }}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", pool.color.replace("bg-", "bg-").replace("-500", "-100"))}>
                      {pool.icon}
                    </div>
                    <Badge variant="primary" size="sm">{pool.candidateCount} candidates</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pool.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{pool.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pool.topSkills.slice(0, 4).map((skill, idx) => (
                      <Badge key={idx} variant="default" size="sm">{skill}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Conversion Rate</p>
                      <p className="font-semibold text-gray-900">{pool.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avg. Time to Hire</p>
                      <p className="font-semibold text-gray-900">{pool.avgTimeToHire} days</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{pool.activeJobs} active jobs</span>
                    <span>Updated {new Date(pool.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {selectedPool && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPool(null)}>
                  ← Back to Pools
                </Button>
                <Badge variant="primary">{mockPools.find((p) => p.id === selectedPool)?.name}</Badge>
              </div>
            )}
            {filteredCandidates.length === 0 ? (
              <Card>
                <CardBody className="text-center py-16">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidate</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Skills</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Match</th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={candidate.name} size="sm" />
                              <div>
                                <p className="font-medium text-gray-900">{candidate.name}</p>
                                <p className="text-xs text-gray-500">{candidate.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{candidate.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{candidate.location}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 2).map((skill, idx) => (
                                <Badge key={idx} variant="default" size="sm">{skill}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={cn("h-1.5 rounded-full", candidate.matchScore >= 90 ? "bg-emerald-500" : candidate.matchScore >= 80 ? "bg-blue-500" : "bg-amber-500")}
                                  style={{ width: `${candidate.matchScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{candidate.matchScore}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={statusConfig[candidate.status]?.variant} size="sm">
                              {statusConfig[candidate.status]?.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
