"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobTitle: string;
  type: "phone" | "video" | "onsite" | "technical" | "panel";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled" | "no_show";
  date: string;
  time: string;
  duration: number;
  interviewer: string;
  interviewerAvatar?: string;
  location?: string;
  meetingUrl?: string;
  notes?: string;
  rating?: number;
  feedback?: "strong_hire" | "hire" | "maybe" | "no_hire";
}

const mockInterviews: Interview[] = [
  {
    id: "1",
    candidateName: "Sarah Chen",
    candidateEmail: "sarah@example.com",
    candidateAvatar: "",
    jobTitle: "Senior Frontend Engineer",
    type: "technical",
    status: "scheduled",
    date: "2025-07-15",
    time: "10:00 AM",
    duration: 60,
    interviewer: "James Wilson",
    interviewerAvatar: "",
    location: "Zoom Meeting Room A",
    meetingUrl: "https://zoom.us/j/123456",
  },
  {
    id: "2",
    candidateName: "Marcus Johnson",
    candidateEmail: "marcus@example.com",
    jobTitle: "Product Manager",
    type: "panel",
    status: "scheduled",
    date: "2025-07-15",
    time: "2:00 PM",
    duration: 90,
    interviewer: "Lisa Park",
    interviewerAvatar: "",
    location: "Conference Room B",
  },
  {
    id: "3",
    candidateName: "Emily Rodriguez",
    candidateEmail: "emily@example.com",
    jobTitle: "UX Designer",
    type: "video",
    status: "completed",
    date: "2025-07-14",
    time: "11:00 AM",
    duration: 45,
    interviewer: "David Kim",
    interviewerAvatar: "",
    notes: "Excellent portfolio review. Strong design thinking.",
    rating: 4.5,
    feedback: "hire",
  },
  {
    id: "4",
    candidateName: "Alex Thompson",
    candidateEmail: "alex@example.com",
    jobTitle: "Backend Engineer",
    type: "phone",
    status: "completed",
    date: "2025-07-13",
    time: "3:00 PM",
    duration: 30,
    interviewer: "Sarah Lee",
    interviewerAvatar: "",
    notes: "Good technical background. Moving to next round.",
    rating: 3.5,
    feedback: "hire",
  },
  {
    id: "5",
    candidateName: "Priya Patel",
    candidateEmail: "priya@example.com",
    jobTitle: "Data Scientist",
    type: "onsite",
    status: "cancelled",
    date: "2025-07-12",
    time: "9:00 AM",
    duration: 120,
    interviewer: "Tom Anderson",
    interviewerAvatar: "",
    notes: "Candidate withdrew application.",
  },
  {
    id: "6",
    candidateName: "Michael Brown",
    candidateEmail: "michael@example.com",
    jobTitle: "DevOps Engineer",
    type: "video",
    status: "rescheduled",
    date: "2025-07-16",
    time: "1:00 PM",
    duration: 60,
    interviewer: "Jessica Wang",
    interviewerAvatar: "",
    meetingUrl: "https://zoom.us/j/789012",
  },
  {
    id: "7",
    candidateName: "Nina Kowalski",
    candidateEmail: "nina@example.com",
    jobTitle: "Senior Frontend Engineer",
    type: "technical",
    status: "no_show",
    date: "2025-07-11",
    time: "10:00 AM",
    duration: 60,
    interviewer: "James Wilson",
    interviewerAvatar: "",
  },
  {
    id: "8",
    candidateName: "Carlos Mendez",
    candidateEmail: "carlos@example.com",
    jobTitle: "Product Manager",
    type: "video",
    status: "in_progress",
    date: "2025-07-15",
    time: "4:00 PM",
    duration: 60,
    interviewer: "Lisa Park",
    interviewerAvatar: "",
    meetingUrl: "https://zoom.us/j/345678",
  },
];

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  phone: { label: "Phone", color: "bg-blue-100 text-blue-700", icon: "📞" },
  video: { label: "Video", color: "bg-purple-100 text-purple-700", icon: "📹" },
  onsite: { label: "On-site", color: "bg-amber-100 text-amber-700", icon: "🏢" },
  technical: { label: "Technical", color: "bg-emerald-100 text-emerald-700", icon: "💻" },
  panel: { label: "Panel", color: "bg-rose-100 text-rose-700", icon: "👥" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "info" }> = {
  scheduled: { label: "Scheduled", variant: "primary" },
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  rescheduled: { label: "Rescheduled", variant: "warning" },
  no_show: { label: "No Show", variant: "danger" },
};

const feedbackConfig: Record<string, { label: string; color: string }> = {
  strong_hire: { label: "Strong Hire", color: "text-emerald-700 bg-emerald-50" },
  hire: { label: "Hire", color: "text-green-700 bg-green-50" },
  maybe: { label: "Maybe", color: "text-amber-700 bg-amber-50" },
  no_hire: { label: "No Hire", color: "text-red-700 bg-red-50" },
};

type ViewMode = "list" | "calendar";
type FilterType = "all" | "upcoming" | "today" | "past";

export default function InterviewsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredInterviews = useMemo(() => {
    let result = [...mockInterviews];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.candidateName.toLowerCase().includes(q) ||
          i.jobTitle.toLowerCase().includes(q) ||
          i.interviewer.toLowerCase().includes(q)
      );
    }

    if (selectedType !== "all") {
      result = result.filter((i) => i.type === selectedType);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filterType) {
      case "upcoming":
        result = result.filter((i) => {
          const d = new Date(i.date);
          return d >= tomorrow && ["scheduled", "rescheduled"].includes(i.status);
        });
        break;
      case "today":
        result = result.filter((i) => {
          const d = new Date(i.date);
          return d >= today && d < tomorrow;
        });
        break;
      case "past":
        result = result.filter((i) => {
          const d = new Date(i.date);
          return d < today || ["completed", "cancelled", "no_show"].includes(i.status);
        });
        break;
    }

    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result;
  }, [searchQuery, selectedType, filterType]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = mockInterviews.filter((i) => {
      const d = new Date(i.date);
      return d >= today && d < tomorrow;
    }).length;

    const upcomingCount = mockInterviews.filter((i) => {
      const d = new Date(i.date);
      return d >= tomorrow && ["scheduled", "rescheduled"].includes(i.status);
    }).length;

    const completedCount = mockInterviews.filter((i) => i.status === "completed").length;

    const avgRating = mockInterviews
      .filter((i) => i.rating)
      .reduce((sum, i) => sum + (i.rating || 0), 0) /
      (mockInterviews.filter((i) => i.rating).length || 1);

    return { todayCount, upcomingCount, completedCount, avgRating };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    return d.toDateString() === today.toDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all scheduled interviews</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "calendar" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                Calendar
              </button>
            </div>
            <Button variant="primary" leftIcon={<span>+</span>}>
              Schedule Interview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <span className="text-2xl">📆</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingCount}</p>
                <p className="text-sm text-gray-500">Upcoming</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Avg. Rating</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by candidate, job, or interviewer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["all", "upcoming", "today", "past"] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                    filterType === type
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="phone">Phone</option>
              <option value="video">Video</option>
              <option value="onsite">On-site</option>
              <option value="technical">Technical</option>
              <option value="panel">Panel</option>
            </select>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="space-y-4">
            {filteredInterviews.length === 0 ? (
              <Card>
                <CardBody className="text-center py-16">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900">No interviews found</h3>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                </CardBody>
              </Card>
            ) : (
              filteredInterviews.map((interview) => (
                <Link key={interview.id} href={`/interviews/${interview.id}`}>
                  <Card hover>
                    <CardBody>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={cn(
                              "w-16 h-16 rounded-xl flex items-center justify-center text-2xl",
                              typeConfig[interview.type]?.color
                            )}
                          >
                            {typeConfig[interview.type]?.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{interview.candidateName}</h3>
                            <Badge variant={statusConfig[interview.status]?.variant} size="sm">
                              {statusConfig[interview.status]?.label}
                            </Badge>
                            <Badge size="sm">{typeConfig[interview.type]?.label}</Badge>
                            {isToday(interview.date) && (
                              <Badge variant="warning" size="sm">Today</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{interview.jobTitle}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>📅</span> {formatDate(interview.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏰</span> {interview.time} ({interview.duration}min)
                            </span>
                            <span className="flex items-center gap-1">
                              <span>👤</span> {interview.interviewer}
                            </span>
                            {interview.location && (
                              <span className="flex items-center gap-1">
                                <span>📍</span> {interview.location}
                              </span>
                            )}
                          </div>
                          {interview.notes && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-1">{interview.notes}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          {interview.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500">⭐</span>
                              <span className="text-sm font-medium text-gray-700">{interview.rating}</span>
                            </div>
                          )}
                          {interview.feedback && (
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full",
                                feedbackConfig[interview.feedback]?.color
                              )}
                            >
                              {feedbackConfig[interview.feedback]?.label}
                            </span>
                          )}
                          {interview.meetingUrl && interview.status === "in_progress" && (
                            <Button variant="success" size="sm">
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))
            )}
          </div>
        ) : (
          <Card>
            <CardBody>
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📆</div>
                <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
                <p className="text-sm text-gray-500 mt-1">Calendar integration coming soon</p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
