"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: "technical" | "behavioral" | "cognitive" | "personality" | "skills";
  jobTitle: string;
  status: "active" | "draft" | "archived";
  duration: number;
  questionCount: number;
  passingScore: number;
  avgScore: number;
  completionRate: number;
  totalTaken: number;
  createdAt: string;
  lastUpdated: string;
  createdBy: string;
  skills: string[];
  difficulty: "easy" | "medium" | "hard" | "mixed";
}

interface AssessmentResult {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  assessmentTitle: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  passed: boolean;
  completedAt: string;
  duration: number;
  jobTitle: string;
  status: "completed" | "in_progress" | "expired";
}

const mockAssessments: Assessment[] = [
  {
    id: "1",
    title: "React & TypeScript Technical Assessment",
    description: "Comprehensive assessment covering React hooks, TypeScript types, and modern frontend patterns",
    type: "technical",
    jobTitle: "Senior Frontend Engineer",
    status: "active",
    duration: 60,
    questionCount: 25,
    passingScore: 70,
    avgScore: 78.5,
    completionRate: 92,
    totalTaken: 148,
    createdAt: "2025-06-01",
    lastUpdated: "2025-07-10",
    createdBy: "James Wilson",
    skills: ["React", "TypeScript", "JavaScript", "CSS"],
    difficulty: "hard",
  },
  {
    id: "2",
    title: "Product Management Case Study",
    description: "Real-world product scenario analysis and strategy development",
    type: "behavioral",
    jobTitle: "Product Manager",
    status: "active",
    duration: 90,
    questionCount: 5,
    passingScore: 65,
    avgScore: 72.3,
    completionRate: 88,
    totalTaken: 67,
    createdAt: "2025-06-15",
    lastUpdated: "2025-07-08",
    createdBy: "David Kim",
    skills: ["Product Strategy", "Analytics", "Roadmapping"],
    difficulty: "medium",
  },
  {
    id: "3",
    title: "Data Structures & Algorithms",
    description: "Core computer science concepts assessment for backend roles",
    type: "technical",
    jobTitle: "Backend Engineer",
    status: "active",
    duration: 45,
    questionCount: 15,
    passingScore: 60,
    avgScore: 65.8,
    completionRate: 95,
    totalTaken: 234,
    createdAt: "2025-05-20",
    lastUpdated: "2025-07-12",
    createdBy: "Tom Anderson",
    skills: ["Algorithms", "Data Structures", "Problem Solving"],
    difficulty: "hard",
  },
  {
    id: "4",
    title: "UX Design Principles Quiz",
    description: "Fundamental UX design knowledge and methodology assessment",
    type: "skills",
    jobTitle: "UX Designer",
    status: "active",
    duration: 30,
    questionCount: 20,
    passingScore: 75,
    avgScore: 81.2,
    completionRate: 97,
    totalTaken: 89,
    createdAt: "2025-06-10",
    lastUpdated: "2025-07-05",
    createdBy: "Jessica Wang",
    skills: ["UX Design", "User Research", "Prototyping"],
    difficulty: "easy",
  },
  {
    id: "5",
    title: "Cognitive Ability Assessment",
    description: "Measures logical reasoning, pattern recognition, and analytical thinking",
    type: "cognitive",
    jobTitle: "General",
    status: "active",
    duration: 40,
    questionCount: 30,
    passingScore: 50,
    avgScore: 68.4,
    completionRate: 99,
    totalTaken: 567,
    createdAt: "2025-04-01",
    lastUpdated: "2025-07-01",
    createdBy: "HR Team",
    skills: ["Logical Reasoning", "Pattern Recognition", "Analytical Thinking"],
    difficulty: "mixed",
  },
  {
    id: "6",
    title: "Personality & Culture Fit",
    description: "Assess alignment with company values and team dynamics",
    type: "personality",
    jobTitle: "General",
    status: "draft",
    duration: 20,
    questionCount: 40,
    passingScore: 0,
    avgScore: 0,
    completionRate: 0,
    totalTaken: 0,
    createdAt: "2025-07-10",
    lastUpdated: "2025-07-14",
    createdBy: "Lisa Park",
    skills: ["Culture Fit", "Teamwork", "Communication"],
    difficulty: "easy",
  },
];

const mockResults: AssessmentResult[] = [
  { id: "1", candidateName: "Sarah Chen", assessmentTitle: "React & TypeScript Technical Assessment", assessmentType: "technical", score: 92, maxScore: 100, passed: true, completedAt: "2025-07-14", duration: 52, jobTitle: "Senior Frontend Engineer", status: "completed" },
  { id: "2", candidateName: "Marcus Johnson", assessmentTitle: "Product Management Case Study", assessmentType: "behavioral", score: 78, maxScore: 100, passed: true, completedAt: "2025-07-13", duration: 85, jobTitle: "Product Manager", status: "completed" },
  { id: "3", candidateName: "Emily Rodriguez", assessmentTitle: "UX Design Principles Quiz", assessmentType: "skills", score: 88, maxScore: 100, passed: true, completedAt: "2025-07-12", duration: 25, jobTitle: "UX Designer", status: "completed" },
  { id: "4", candidateName: "Alex Thompson", assessmentTitle: "Data Structures & Algorithms", assessmentType: "technical", score: 65, maxScore: 100, passed: true, completedAt: "2025-07-11", duration: 44, jobTitle: "Backend Engineer", status: "completed" },
  { id: "5", candidateName: "Priya Patel", assessmentTitle: "Cognitive Ability Assessment", assessmentType: "cognitive", score: 82, maxScore: 100, passed: true, completedAt: "2025-07-10", duration: 38, jobTitle: "Data Scientist", status: "completed" },
  { id: "6", candidateName: "Michael Brown", assessmentTitle: "React & TypeScript Technical Assessment", assessmentType: "technical", score: 58, maxScore: 100, passed: false, completedAt: "2025-07-09", duration: 60, jobTitle: "DevOps Engineer", status: "completed" },
];

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  technical: { label: "Technical", color: "bg-emerald-100 text-emerald-700", icon: "💻" },
  behavioral: { label: "Behavioral", color: "bg-purple-100 text-purple-700", icon: "🧠" },
  cognitive: { label: "Cognitive", color: "bg-blue-100 text-blue-700", icon: "🎯" },
  personality: { label: "Personality", color: "bg-rose-100 text-rose-700", icon: "❤️" },
  skills: { label: "Skills", color: "bg-amber-100 text-amber-700", icon: "⭐" },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "bg-green-100 text-green-700" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700" },
  hard: { label: "Hard", color: "bg-red-100 text-red-700" },
  mixed: { label: "Mixed", color: "bg-gray-100 text-gray-700" },
};

type Tab = "assessments" | "results";

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("assessments");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredAssessments = useMemo(() => {
    let result = [...mockAssessments];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") result = result.filter((a) => a.type === filterType);
    if (filterStatus !== "all") result = result.filter((a) => a.status === filterStatus);
    return result;
  }, [searchQuery, filterType, filterStatus]);

  const filteredResults = useMemo(() => {
    let result = [...mockResults];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.candidateName.toLowerCase().includes(q) ||
          r.assessmentTitle.toLowerCase().includes(q) ||
          r.jobTitle.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  const stats = useMemo(() => ({
    total: mockAssessments.length,
    active: mockAssessments.filter((a) => a.status === "active").length,
    totalTaken: mockAssessments.reduce((sum, a) => sum + a.totalTaken, 0),
    avgCompletion: mockAssessments.filter((a) => a.totalTaken > 0).reduce((sum, a) => sum + a.completionRate, 0) / mockAssessments.filter((a) => a.totalTaken > 0).length,
  }), []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage candidate assessments</p>
          </div>
          <Button variant="primary" leftIcon={<span>+</span>}>Create Assessment</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl"><span className="text-2xl">📝</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Assessments</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl"><span className="text-2xl">✅</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl"><span className="text-2xl">👥</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTaken.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Taken</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl"><span className="text-2xl">📊</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgCompletion.toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Avg. Completion</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["assessments", "results"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize", activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {activeTab === "assessments" && (
            <div className="flex items-center gap-3">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Types</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="cognitive">Cognitive</option>
                <option value="personality">Personality</option>
                <option value="skills">Skills</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === "assessments" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => (
              <Card key={assessment.id} hover>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{typeConfig[assessment.type]?.icon}</span>
                      <Badge className={typeConfig[assessment.type]?.color} size="sm">{typeConfig[assessment.type]?.label}</Badge>
                    </div>
                    <Badge variant={assessment.status === "active" ? "success" : assessment.status === "draft" ? "warning" : "default"} size="sm">
                      {assessment.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{assessment.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assessment.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="default" size="sm">{skill}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Questions</p>
                      <p className="font-semibold text-gray-900">{assessment.questionCount}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{assessment.duration}min</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Avg. Score</p>
                      <p className="font-semibold text-gray-900">{assessment.avgScore || "—"}%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Taken</p>
                      <p className="font-semibold text-gray-900">{assessment.totalTaken}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", difficultyConfig[assessment.difficulty]?.color)}>
                      {difficultyConfig[assessment.difficulty]?.label}
                    </span>
                    <span className="text-xs text-gray-500">By {assessment.createdBy}</span>
                  </div>
                </CardBody>
                <CardFooter>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="primary" size="sm" className="flex-1">View Results</Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Assessment</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Job</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={result.candidateName} size="sm" />
                          <span className="font-medium text-gray-900">{result.candidateName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{typeConfig[result.assessmentType]?.icon}</span>
                          <span className="text-sm text-gray-600 line-clamp-1">{result.assessmentTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{result.jobTitle}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={cn("h-1.5 rounded-full", result.score >= 80 ? "bg-emerald-500" : result.score >= 60 ? "bg-blue-500" : "bg-red-500")}
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                          <span className={cn("text-sm font-medium", result.score >= 80 ? "text-emerald-600" : result.score >= 60 ? "text-blue-600" : "text-red-600")}>
                            {result.score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{result.duration}min</td>
                      <td className="px-6 py-4">
                        <Badge variant={result.passed ? "success" : "danger"} size="sm">
                          {result.passed ? "Passed" : "Failed"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm">Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
