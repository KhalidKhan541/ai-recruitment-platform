"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface InterviewDetail {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar?: string;
  candidateTitle: string;
  jobTitle: string;
  jobDepartment: string;
  type: "phone" | "video" | "onsite" | "technical" | "panel";
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled" | "no_show";
  date: string;
  time: string;
  duration: number;
  interviewers: { name: string; email: string; role: string; avatar?: string }[];
  location?: string;
  meetingUrl?: string;
  notes?: string;
  rating?: number;
  feedback?: "strong_hire" | "hire" | "maybe" | "no_hire";
  feedbackNotes?: string;
  questions: { question: string; category: string; rating?: number }[];
  timeline: { time: string; event: string; user?: string }[];
}

const mockInterview: InterviewDetail = {
  id: "1",
  candidateName: "Sarah Chen",
  candidateEmail: "sarah.chen@email.com",
  candidatePhone: "+1 (555) 123-4567",
  candidateTitle: "Senior Frontend Engineer",
  jobTitle: "Senior Frontend Engineer",
  jobDepartment: "Engineering",
  type: "technical",
  status: "scheduled",
  date: "2025-07-15",
  time: "10:00 AM",
  duration: 60,
  interviewers: [
    { name: "James Wilson", email: "james@company.com", role: "Lead Interviewer" },
    { name: "Sarah Lee", email: "sarah@company.com", role: "Technical Evaluator" },
  ],
  location: "Zoom Meeting Room A",
  meetingUrl: "https://zoom.us/j/123456",
  questions: [
    { question: "Explain your approach to state management in large React applications", category: "Technical", rating: 4 },
    { question: "Describe a challenging performance optimization you've implemented", category: "Technical", rating: 5 },
    { question: "How do you handle code reviews and mentoring junior developers?", category: "Behavioral", rating: 4 },
    { question: "Walk us through your experience with testing strategies", category: "Technical", rating: 3 },
    { question: "Describe your ideal development workflow", category: "Culture", rating: 4 },
  ],
  timeline: [
    { time: "10:00 AM", event: "Interview scheduled", user: "HR Team" },
    { time: "10:15 AM", event: "Calendar invite sent", user: "System" },
    { time: "10:20 AM", event: "Candidate confirmed attendance", user: "Sarah Chen" },
    { time: "2:00 PM", event: "Interviewer prep notes added", user: "James Wilson" },
  ],
};

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
  strong_hire: { label: "Strong Hire", color: "bg-emerald-100 text-emerald-800" },
  hire: { label: "Hire", color: "bg-green-100 text-green-800" },
  maybe: { label: "Maybe", color: "bg-amber-100 text-amber-800" },
  no_hire: { label: "No Hire", color: "bg-red-100 text-red-800" },
};

type Tab = "details" | "questions" | "feedback" | "timeline";

export default function InterviewDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const interview = mockInterview;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/interviews" className="hover:text-blue-600">
            Interviews
          </Link>
          <span>/</span>
          <span className="text-gray-900">{interview.candidateName}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 space-y-6">
            <Card>
              <CardBody>
                <div className="flex items-start gap-4">
                  <Avatar name={interview.candidateName} size="xl" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-gray-900">{interview.candidateName}</h1>
                      <Badge variant={statusConfig[interview.status]?.variant}>
                        {statusConfig[interview.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">{interview.candidateTitle}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <a href={`mailto:${interview.candidateEmail}`} className="hover:text-blue-600">
                        {interview.candidateEmail}
                      </a>
                      <span>{interview.candidatePhone}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {interview.meetingUrl && interview.status !== "completed" && (
                      <Button variant="success">Join Meeting</Button>
                    )}
                    <Button variant="outline">Reschedule</Button>
                    <Button variant="danger" size="sm">Cancel</Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["details", "questions", "feedback", "timeline"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "details" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">Interview Details</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Position</label>
                        <p className="text-gray-900 mt-1">{interview.jobTitle}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Department</label>
                        <p className="text-gray-900 mt-1">{interview.jobDepartment}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <div className="mt-1">
                          <Badge className={typeConfig[interview.type]?.color}>
                            {typeConfig[interview.type]?.icon} {typeConfig[interview.type]?.label}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-gray-900 mt-1">{interview.duration} minutes</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date</label>
                        <p className="text-gray-900 mt-1">{formatDate(interview.date)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Time</label>
                        <p className="text-gray-900 mt-1">{interview.time}</p>
                      </div>
                      {interview.location && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Location</label>
                          <p className="text-gray-900 mt-1">{interview.location}</p>
                        </div>
                      )}
                      {interview.meetingUrl && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Meeting Link</label>
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mt-1 inline-block"
                          >
                            {interview.meetingUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">Interviewers</h2>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      {interview.interviewers.map((interviewer, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar name={interviewer.name} size="md" />
                          <div>
                            <p className="font-medium text-gray-900">{interviewer.name}</p>
                            <p className="text-sm text-gray-500">{interviewer.email}</p>
                          </div>
                          <Badge variant="primary" size="sm" className="ml-auto">
                            {interviewer.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "questions" && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Interview Questions</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {interview.questions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                              <Badge variant="default" size="sm">{q.category}</Badge>
                            </div>
                            <p className="text-gray-900">{q.question}</p>
                          </div>
                          {q.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={cn("text-lg", i < q.rating! ? "text-amber-500" : "text-gray-300")}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {activeTab === "feedback" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">Submit Feedback</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                      <div className="flex gap-2">
                        {["strong_hire", "hire", "maybe", "no_hire"].map((fb) => (
                          <button
                            key={fb}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors",
                              interview.feedback === fb
                                ? `${feedbackConfig[fb].color} border-current`
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                          >
                            {feedbackConfig[fb].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className={cn(
                              "text-2xl transition-colors",
                              interview.rating && star <= interview.rating
                                ? "text-amber-500"
                                : "text-gray-300 hover:text-amber-400"
                            )}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        placeholder="Share your feedback about the candidate..."
                      />
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button variant="primary">Submit Feedback</Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === "timeline" && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Interview Timeline</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {interview.timeline.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full border-2",
                              idx === 0 ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
                            )}
                          />
                          {idx < interview.timeline.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{event.time}</span>
                            {event.user && (
                              <span className="text-xs text-gray-500">by {event.user}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{event.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="w-full lg:w-80 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardBody className="space-y-2">
                <Button variant="outline" className="w-full justify-start" leftIcon={<span>📧</span>}>
                  Email Candidate
                </Button>
                <Button variant="outline" className="w-full justify-start" leftIcon={<span>📞</span>}>
                  Call Candidate
                </Button>
                <Button variant="outline" className="w-full justify-start" leftIcon={<span>📝</span>}>
                  Add Note
                </Button>
                <Button variant="outline" className="w-full justify-start" leftIcon={<span>📅</span>}>
                  Reschedule
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Candidate Profile</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={interview.candidateName} size="lg" />
                  <div>
                    <p className="font-medium text-gray-900">{interview.candidateName}</p>
                    <p className="text-sm text-gray-500">{interview.candidateTitle}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Experience</span>
                    <span className="text-gray-900">8 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-900">San Francisco, CA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Applications</span>
                    <span className="text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">AI Match Score</span>
                    <span className="text-emerald-600 font-medium">92%</span>
                  </div>
                </div>
                <Button variant="primary" className="w-full" size="sm">
                  View Full Profile
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Notes</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600">
                  {interview.notes || "No notes added yet."}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
