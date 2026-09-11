"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  subject: string;
  preview: string;
  content: string;
  from: { name: string; email: string; avatar?: string };
  to: { name: string; email: string }[];
  type: "email" | "sms" | "notification";
  category: "interview" | "offer" | "screening" | "general" | "system";
  status: "sent" | "delivered" | "read" | "failed" | "draft";
  sentAt?: string;
  readAt?: string;
  candidateName?: string;
  jobTitle?: string;
  isRead: boolean;
  isStarred: boolean;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  usageCount: number;
  lastUsed?: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    subject: "Interview Confirmation - Sarah Chen",
    preview: "Hi Sarah, this is to confirm your upcoming interview for the Senior Frontend Engineer position...",
    content: "",
    from: { name: "Lisa Park", email: "lisa@company.com" },
    to: [{ name: "Sarah Chen", email: "sarah@example.com" }],
    type: "email",
    category: "interview",
    status: "delivered",
    sentAt: "2025-07-14T10:30:00",
    readAt: "2025-07-14T11:15:00",
    candidateName: "Sarah Chen",
    jobTitle: "Senior Frontend Engineer",
    isRead: true,
    isStarred: true,
  },
  {
    id: "2",
    subject: "Offer Letter - Emily Rodriguez",
    preview: "Dear Emily, we are delighted to extend an offer for the UX Designer position at our company...",
    content: "",
    from: { name: "David Kim", email: "david@company.com" },
    to: [{ name: "Emily Rodriguez", email: "emily@example.com" }],
    type: "email",
    category: "offer",
    status: "sent",
    sentAt: "2025-07-13T14:00:00",
    candidateName: "Emily Rodriguez",
    jobTitle: "UX Designer",
    isRead: true,
    isStarred: false,
  },
  {
    id: "3",
    subject: "Reminder: Technical Assessment Due",
    preview: "Hi Alex, this is a friendly reminder that your technical assessment for the Backend Engineer role is due...",
    content: "",
    from: { name: "System", email: "noreply@company.com" },
    to: [{ name: "Alex Thompson", email: "alex@example.com" }],
    type: "notification",
    category: "system",
    status: "delivered",
    sentAt: "2025-07-12T09:00:00",
    candidateName: "Alex Thompson",
    jobTitle: "Backend Engineer",
    isRead: false,
    isStarred: false,
  },
  {
    id: "4",
    subject: "Screening Complete - Marcus Johnson",
    preview: "Hi Marcus, we have completed the initial screening for the Product Manager position. You have been selected...",
    content: "",
    from: { name: "Sarah Lee", email: "sarah@company.com" },
    to: [{ name: "Marcus Johnson", email: "marcus@example.com" }],
    type: "email",
    category: "screening",
    status: "read",
    sentAt: "2025-07-11T16:45:00",
    readAt: "2025-07-11T18:30:00",
    candidateName: "Marcus Johnson",
    jobTitle: "Product Manager",
    isRead: true,
    isStarred: false,
  },
  {
    id: "5",
    subject: "New Application Received",
    preview: "A new application has been received for the Senior Frontend Engineer position from Priya Patel...",
    content: "",
    from: { name: "System", email: "noreply@company.com" },
    to: [{ name: "James Wilson", email: "james@company.com" }],
    type: "notification",
    category: "system",
    status: "delivered",
    sentAt: "2025-07-10T11:20:00",
    candidateName: "Priya Patel",
    jobTitle: "Senior Frontend Engineer",
    isRead: false,
    isStarred: true,
  },
  {
    id: "6",
    subject: "Schedule Interview - Michael Brown",
    preview: "Hi Michael, we would like to schedule a technical interview for the DevOps Engineer position...",
    content: "",
    from: { name: "Tom Anderson", email: "tom@company.com" },
    to: [{ name: "Michael Brown", email: "michael@example.com" }],
    type: "email",
    category: "interview",
    status: "sent",
    sentAt: "2025-07-09T13:00:00",
    candidateName: "Michael Brown",
    jobTitle: "DevOps Engineer",
    isRead: true,
    isStarred: false,
  },
  {
    id: "7",
    subject: "Weekly Hiring Report",
    preview: "Here is your weekly hiring report summary. 12 new applications received, 5 interviews scheduled...",
    content: "",
    from: { name: "System", email: "reports@company.com" },
    to: [{ name: "All Recruiters", email: "recruiters@company.com" }],
    type: "notification",
    category: "general",
    status: "delivered",
    sentAt: "2025-07-08T08:00:00",
    isRead: true,
    isStarred: false,
  },
];

const mockTemplates: Template[] = [
  { id: "1", name: "Interview Invitation", subject: "Interview Invitation - {{candidate_name}}", content: "Dear {{candidate_name}},\n\nWe would like to invite you for an interview...", category: "interview", usageCount: 45, lastUsed: "2025-07-14" },
  { id: "2", name: "Offer Letter", subject: "Job Offer - {{position}}", content: "Dear {{candidate_name}},\n\nWe are pleased to extend an offer...", category: "offer", usageCount: 23, lastUsed: "2025-07-13" },
  { id: "3", name: "Screening Complete", subject: "Screening Update - {{position}}", content: "Hi {{candidate_name}},\n\nWe have completed the initial screening...", category: "screening", usageCount: 67, lastUsed: "2025-07-12" },
  { id: "4", name: "Rejection Letter", subject: "Application Update - {{position}}", content: "Dear {{candidate_name}},\n\nThank you for your interest...", category: "general", usageCount: 34, lastUsed: "2025-07-10" },
  { id: "5", name: "Assessment Reminder", subject: "Reminder: Assessment Due", content: "Hi {{candidate_name}},\n\nThis is a reminder that your assessment...", category: "system", usageCount: 89, lastUsed: "2025-07-11" },
];

const categoryConfig: Record<string, { label: string; color: string; icon: string }> = {
  interview: { label: "Interview", color: "bg-blue-100 text-blue-700", icon: "📅" },
  offer: { label: "Offer", color: "bg-emerald-100 text-emerald-700", icon: "📋" },
  screening: { label: "Screening", color: "bg-purple-100 text-purple-700", icon: "🔍" },
  general: { label: "General", color: "bg-gray-100 text-gray-700", icon: "📧" },
  system: { label: "System", color: "bg-amber-100 text-amber-700", icon: "⚙️" },
};

type Tab = "inbox" | "sent" | "templates";

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  const filteredMessages = useMemo(() => {
    let result = [...mockMessages];
    if (activeTab === "sent") {
      result = result.filter((m) => m.from.email === "lisa@company.com" || m.from.email === "david@company.com");
    } else {
      result = result.filter((m) => m.to.some((t) => t.email.includes("company.com")));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q) ||
          m.from.name.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") {
      result = result.filter((m) => m.category === filterCategory);
    }
    result.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
    return result;
  }, [activeTab, searchQuery, filterCategory]);

  const unreadCount = mockMessages.filter((m) => !m.isRead && m.to.some((t) => t.email.includes("company.com"))).length;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-sm text-gray-500 mt-1">Manage candidate communications and templates</p>
          </div>
          <Button variant="primary" leftIcon={<span>✉️</span>} onClick={() => setShowCompose(true)}>
            Compose Message
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl"><span className="text-2xl">📥</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                <p className="text-sm text-gray-500">Unread Messages</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl"><span className="text-2xl">📨</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockMessages.length}</p>
                <p className="text-sm text-gray-500">Total Messages</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl"><span className="text-2xl">📝</span></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockTemplates.length}</p>
                <p className="text-sm text-gray-500">Templates</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-80 flex-shrink-0 space-y-4">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["inbox", "sent", "templates"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn("flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize", activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
                >
                  {tab} {tab === "inbox" && unreadCount > 0 && <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1.5">{unreadCount}</span>}
                </button>
              ))}
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(["all", "interview", "offer", "screening", "general", "system"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn("px-2 py-1 text-xs font-medium rounded-full transition-colors", filterCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                >
                  {cat === "all" ? "All" : categoryConfig[cat]?.label}
                </button>
              ))}
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedMessage?.id === message.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50",
                    !message.isRead && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", message.isRead ? "bg-transparent" : "bg-blue-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm truncate", !message.isRead ? "font-semibold text-gray-900" : "text-gray-700")}>
                          {message.from.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{formatTime(message.sentAt)}</span>
                      </div>
                      <p className={cn("text-sm truncate mt-0.5", !message.isRead ? "font-medium text-gray-900" : "text-gray-600")}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{message.preview}</p>
                    </div>
                    {message.isStarred && <span className="text-amber-400 text-sm">★</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <Avatar name={selectedMessage.from.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedMessage.from.name}</p>
                          <p className="text-xs text-gray-500">{selectedMessage.from.email}</p>
                        </div>
                        <Badge className={categoryConfig[selectedMessage.category]?.color} size="sm">
                          {categoryConfig[selectedMessage.category]?.icon} {categoryConfig[selectedMessage.category]?.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Reply</Button>
                      <Button variant="ghost" size="sm">Forward</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">{selectedMessage.preview}</p>
                    <p className="text-gray-500 mt-4">
                      This is a preview of the full message content. In a production environment, the complete message body would be displayed here.
                    </p>
                  </div>
                  {selectedMessage.candidateName && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Related</h4>
                      <div className="flex items-center gap-3">
                        <Avatar name={selectedMessage.candidateName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedMessage.candidateName}</p>
                          <p className="text-xs text-gray-500">{selectedMessage.jobTitle}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">View Profile</Button>
                      </div>
                    </div>
                  )}
                </CardBody>
                <CardFooter>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Sent: {selectedMessage.sentAt ? new Date(selectedMessage.sentAt).toLocaleString() : "N/A"}</span>
                    <span>Status: {selectedMessage.status}</span>
                  </div>
                </CardFooter>
              </Card>
            ) : activeTab === "templates" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
                  <Button variant="primary" size="sm" leftIcon={<span>+</span>}>New Template</Button>
                </div>
                <div className="grid gap-4">
                  {mockTemplates.map((template) => (
                    <Card key={template.id} hover>
                      <CardBody>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{template.name}</h3>
                              <Badge className={categoryConfig[template.category]?.color} size="sm">
                                {categoryConfig[template.category]?.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.content}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500 ml-4">
                            <p>Used {template.usageCount} times</p>
                            {template.lastUsed && <p className="text-xs mt-1">Last: {new Date(template.lastUsed).toLocaleDateString()}</p>}
                          </div>
                        </div>
                      </CardBody>
                      <CardFooter>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="primary" size="sm">Use Template</Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardBody className="text-center py-16">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900">Select a message</h3>
                  <p className="text-sm text-gray-500 mt-1">Choose a message from the list to view its details</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        {showCompose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Compose Message</h2>
                  <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="recipient@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Message subject" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Type your message..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use Template</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select a template...</option>
                    {mockTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </CardBody>
              <CardFooter>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <Button variant="outline">Save Draft</Button>
                  <Button variant="primary">Send Message</Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
