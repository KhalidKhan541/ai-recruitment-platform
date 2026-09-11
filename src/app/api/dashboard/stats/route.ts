import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyId;

    const [
      totalJobs,
      activeJobs,
      totalCandidates,
      totalApplications,
      totalInterviews,
      totalOffers,
      pendingOffers,
      recentApplications,
      interviewsThisWeek,
      applicationsByStatus,
      jobsByStatus,
    ] = await Promise.all([
      prisma.jobPosting.count({
        where: companyId ? { companyId } : undefined,
      }),
      prisma.jobPosting.count({
        where: {
          ...(companyId ? { companyId } : {}),
          status: "PUBLISHED",
        },
      }),
      prisma.candidate.count({
        where: companyId ? { companyId } : undefined,
      }),
      prisma.jobApplication.count({
        where: companyId
          ? { job: { companyId } }
          : undefined,
      }),
      prisma.interview.count({
        where: {
          ...(companyId ? { jobPosting: { companyId } } : {}),
          status: { in: ["SCHEDULED", "RESCHEDULED"] },
        },
      }),
      prisma.offer.count({
        where: {
          ...(companyId ? { job: { companyId } } : {}),
          status: { in: ["SENT", "VIEWED", "NEGOTIATING"] },
        },
      }),
      prisma.offer.count({
        where: {
          ...(companyId ? { job: { companyId } } : {}),
          status: "DRAFT",
        },
      }),
      prisma.jobApplication.count({
        where: {
          ...(companyId ? { job: { companyId } } : {}),
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.interview.count({
        where: {
          ...(companyId ? { jobPosting: { companyId } } : {}),
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { in: ["SCHEDULED", "RESCHEDULED"] },
        },
      }),
      prisma.jobApplication.groupBy({
        by: ["status"],
        where: companyId ? { job: { companyId } } : undefined,
        _count: true,
      }),
      prisma.jobPosting.groupBy({
        by: ["status"],
        where: companyId ? { companyId } : undefined,
        _count: true,
      }),
    ]);

    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        ...(companyId ? { jobPosting: { companyId } } : {}),
        scheduledAt: { gte: new Date() },
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
      },
      include: {
        candidate: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        jobPosting: { select: { id: true, title: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });

    const recentActivity = await prisma.jobApplication.findMany({
      where: companyId ? { job: { companyId } } : undefined,
      include: {
        candidate: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      data: {
        overview: {
          totalJobs,
          activeJobs,
          totalCandidates,
          totalApplications,
          totalInterviews,
          pendingOffers,
          recentApplications,
          interviewsThisWeek,
        },
        charts: {
          applicationsByStatus: applicationsByStatus.map((s) => ({
            status: s.status,
            count: s._count,
          })),
          jobsByStatus: jobsByStatus.map((s) => ({
            status: s.status,
            count: s._count,
          })),
        },
        upcomingInterviews: upcomingInterviews.map((iv) => ({
          id: iv.id,
          candidateName: iv.candidate.user.name,
          candidateAvatar: iv.candidate.user.avatarUrl,
          jobTitle: iv.jobPosting.title,
          scheduledAt: iv.scheduledAt,
          type: iv.type,
          duration: iv.durationMinutes,
        })),
        recentActivity: recentActivity.map((app) => ({
          id: app.id,
          candidateName: app.candidate.user.name,
          candidateAvatar: app.candidate.user.avatarUrl,
          jobTitle: app.job.title,
          status: app.status,
          createdAt: app.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
