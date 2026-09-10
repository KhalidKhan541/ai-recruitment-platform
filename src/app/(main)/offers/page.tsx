"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Offer {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobTitle: string;
  department: string;
  salary: number;
  currency: string;
  status: "draft" | "pending_approval" | "sent" | "negotiating" | "accepted" | "declined" | "expired" | "withdrawn";
  sentAt?: string;
  respondedAt?: string;
  expiresAt: string;
  hiringManager: string;
  recruiter: string;
  benefits: string[];
  equity?: number;
  signingBonus?: number;
  notes?: string;
}

const mockOffers: Offer[] = [
  {
    id: "1",
    candidateName: "Sarah Chen",
    candidateEmail: "sarah@example.com",
    jobTitle: "Senior Frontend Engineer",
    department: "Engineering",
    salary: 165000,
    currency: "USD",
    status: "sent",
    sentAt: "2025-07-10",
    expiresAt: "2025-07-24",
    hiringManager: "James Wilson",
    recruiter: "Lisa Park",
    benefits: ["Health Insurance", "401k Match", "Unlimited PTO"],
    equity: 0.05,
    signingBonus: 15000,
  },
  {
    id: "2",
    candidateName: "Marcus Johnson",
    candidateEmail: "marcus@example.com",
    jobTitle: "Product Manager",
    department: "Product",
    salary: 145000,
    currency: "USD",
    status: "negotiating",
    sentAt: "2025-07-08",
    expiresAt: "2025-07-22",
    hiringManager: "David Kim",
    recruiter: "Sarah Lee",
    benefits: ["Health Insurance", "401k Match", "Stock Options"],
    equity: 0.1,
    notes: "Candidate requesting higher base salary",
  },
  {
    id: "3",
    candidateName: "Emily Rodriguez",
    candidateEmail: "emily@example.com",
    jobTitle: "UX Designer",
    department: "Design",
    salary: 125000,
    currency: "USD",
    status: "accepted",
    sentAt: "2025-07-05",
    respondedAt: "2025-07-07",
    expiresAt: "2025-07-19",
    hiringManager: "Jessica Wang",
    recruiter: "Tom Anderson",
    benefits: ["Health Insurance", "Dental", "Vision", "401k Match"],
    equity: 0.03,
  },
  {
    id: "4",
    candidateName: "Alex Thompson",
    candidateEmail: "alex@example.com",
    jobTitle: "Backend Engineer",
    department: "Engineering",
    salary: 155000,
    currency: "USD",
    status: "pending_approval",
    expiresAt: "2025-07-21",
    hiringManager: "James Wilson",
    recruiter: "Lisa Park",
    benefits: ["Health Insurance", "401k Match"],
    equity: 0.04,
    signingBonus: 10000,
  },
  {
    id: "5",
    candidateName: "Priya Patel",
    candidateEmail: "priya@example.com",
    jobTitle: "Data Scientist",
    department: "Data",
    salary: 175000,
    currency: "USD",
    status: "declined",
    sentAt: "2025-07-01",
    respondedAt: "2025-07-04",
    expiresAt: "2025-07-15",
    hiringManager: "Tom Anderson",
    recruiter: "David Kim",
    benefits: ["Health Insurance", "401k Match", "Education Stipend"],
    equity: 0.08,
    notes: "Declined due to competing offer",
  },
  {
    id: "6",
    candidateName: "Michael Brown",
    candidateEmail: "michael@example.com",
    jobTitle: "DevOps Engineer",
    department: "Infrastructure",
    salary: 140000,
    currency: "USD",
    status: "draft",
    expiresAt: "2025-07-28",
    hiringManager: "Sarah Lee",
    recruiter: "James Wilson",
    benefits: ["Health Insurance", "401k Match", "Remote Work"],
  },
  {
    id: "7",
    candidateName: "Nina Kowalski",
    candidateEmail: "nina@example.com",
    jobTitle: "Senior Frontend Engineer",
    department: "Engineering",
    salary: 170000,
    currency: "USD",
    status: "expired",
    sentAt: "2025-06-20",
    expiresAt: "2025-07-04",
    hiringManager: "James Wilson",
    recruiter: "Lisa Park",
    benefits: ["Health Insurance", "401k Match"],
    equity: 0.06,
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "info"; icon: string }> = {
  draft: { label: "Draft", variant: "default", icon: "📝" },
  pending_approval: { label: "Pending Approval", variant: "warning", icon: "⏳" },
  sent: { label: "Sent", variant: "primary", icon: "📤" },
  negotiating: { label: "Negotiating", variant: "info", icon: "🤝" },
  accepted: { label: "Accepted", variant: "success", icon: "✅" },
  declined: { label: "Declined", variant: "danger", icon: "❌" },
  expired: { label: "Expired", variant: "danger", icon: "⏰" },
  withdrawn: { label: "Withdrawn", variant: "warning", icon: "↩️" },
};

type FilterStatus = "all" | Offer["status"];

export default function OffersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "salary-high" | "salary-low" | "expires">("newest");

  const filteredOffers = useMemo(() => {
    let result = [...mockOffers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.candidateName.toLowerCase().includes(q) ||
          o.jobTitle.toLowerCase().includes(q) ||
          o.department.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((o) => o.status === filterStatus);
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.sentAt || b.expiresAt).getTime() - new Date(a.sentAt || a.expiresAt).getTime());
        break;
      case "salary-high":
        result.sort((a, b) => b.salary - a.salary);
        break;
      case "salary-low":
        result.sort((a, b) => a.salary - b.salary);
        break;
      case "expires":
        result.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
        break;
    }

    return result;
  }, [searchQuery, filterStatus, sortBy]);

  const stats = useMemo(() => ({
    total: mockOffers.length,
    pending: mockOffers.filter((o) => ["draft", "pending_approval", "sent", "negotiating"].includes(o.status)).length,
    accepted: mockOffers.filter((o) => o.status === "accepted").length,
    declined: mockOffers.filter((o) => o.status === "declined").length,
    totalValue: mockOffers.filter((o) => o.status === "accepted").reduce((sum, o) => sum + o.salary, 0),
  }), []);

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
            <p className="text-sm text-gray-500 mt-1">Manage job offers and track candidate responses</p>
          </div>
          <Button variant="primary" leftIcon={<span>+</span>}>
            Create Offer
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Offers</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
              <p className="text-sm text-gray-500">Declined</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-blue-600">{formatSalary(stats.totalValue)}</p>
              <p className="text-sm text-gray-500">Accepted Value</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="sent">Sent</option>
              <option value="negotiating">Negotiating</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="salary-high">Salary High to Low</option>
              <option value="salary-low">Salary Low to High</option>
              <option value="expires">Expiring Soon</option>
            </select>
          </div>
        </div>

        {filteredOffers.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900">No offers found</h3>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOffers.map((offer) => {
              const daysUntilExpiry = getDaysUntilExpiry(offer.expiresAt);
              const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry > 0 && ["sent", "negotiating"].includes(offer.status);

              return (
                <Link key={offer.id} href={`/offers/${offer.id}`}>
                  <Card hover>
                    <CardBody>
                      <div className="flex items-start gap-4">
                        <Avatar name={offer.candidateName} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{offer.candidateName}</h3>
                            <Badge variant={statusConfig[offer.status]?.variant}>
                              {statusConfig[offer.status]?.icon} {statusConfig[offer.status]?.label}
                            </Badge>
                            {isExpiringSoon && (
                              <Badge variant="warning" size="sm">
                                ⚠️ Expires in {daysUntilExpiry} days
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{offer.jobTitle} · {offer.department}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="font-semibold text-gray-900">{formatSalary(offer.salary)}</span>
                            {offer.equity && <span>Equity: {offer.equity}%</span>}
                            {offer.signingBonus && <span>Signing: {formatSalary(offer.signingBonus)}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            {offer.benefits.slice(0, 3).map((benefit, idx) => (
                              <Badge key={idx} variant="default" size="sm">
                                {benefit}
                              </Badge>
                            ))}
                            {offer.benefits.length > 3 && (
                              <Badge variant="default" size="sm">+{offer.benefits.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right text-sm">
                          <p className="text-gray-500">Hiring: {offer.hiringManager}</p>
                          <p className="text-gray-500">Recruiter: {offer.recruiter}</p>
                          {offer.sentAt && (
                            <p className="text-gray-400 mt-1">Sent: {new Date(offer.sentAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
