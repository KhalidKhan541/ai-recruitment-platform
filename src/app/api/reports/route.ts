import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const reportQuerySchema = z.object({
  type: z.enum([
    "hiring_overview",
    "pipeline_summary",
    "time_to_fill",
    "source_effectiveness",
    "candidate_flow",
    "interview_metrics",
    "offer_metrics",
    "recruiter_performance",
  ]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  department: z.string().optional(),
  jobId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "hiring_overview";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const department = searchParams.get("department");
    const jobId = searchParams.get("jobId");

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const jobWhere: any = {};
    if (session.user.companyId) jobWhere.companyId = session.user.companyId;
    if (department) jobWhere.department = department;
    if (jobId) jobWhere.id = jobId;

    let reportData: any = {};

    switch (type) {
      case "hiring_overview": {
        const [totalJobs, publishedJobs, totalApplications, totalInterviews, totalOffers] =
          await Promise.all([
            prisma.jobPosting.count({ where: jobWhere }),
            prisma.jobPosting.count({ where: { ...jobWhere, status: "PUBLISHED" } }),
            prisma.jobApplication.count({
              where: {
                job: jobWhere,
                ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
              },
            }),
            prisma.interview.count({
              where: {
                jobPosting: jobWhere,
                ...(Object.keys(dateFilter).length > 0 ? { scheduledAt: dateFilter } : {}),
              },
            }),
            prisma.offer.count({
              where: {
                job: jobWhere,
                ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
              },
            }),
          ]);

        const statusBreakdown = await prisma.jobApplication.groupBy({
          by: ["status"],
          where: {
            job: jobWhere,
            ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
          },
          _count: true,
        });

        reportData = {
          type: "hiring_overview",
          period: { startDate, endDate },
          summary: {
            totalJobs,
            publishedJobs,
            totalApplications,
            totalInterviews,
            totalOffers,
          },
          statusBreakdown: statusBreakdown.map((s) => ({
            status: s.status,
            count: s._count,
          })),
        };
        break;
      }

      case "pipeline_summary": {
        const jobs = await prisma.jobPosting.findMany({
          where: jobWhere,
          include: {
            _count: {
              select: {
                applications: true,
                interviews: true,
                offers: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        reportData = {
          type: "pipeline_summary",
          jobs: jobs.map((j) => ({
            id: j.id,
            title: j.title,
            department: j.department,
            status: j.status,
            applications: j._count.applications,
            interviews: j._count.interviews,
            offers: j._count.offers,
          })),
        };
        break;
      }

      case "time_to_fill": {
        const closedJobs = await prisma.jobPosting.findMany({
          where: {
            ...jobWhere,
            status: "CLOSED",
            closedAt: { not: null },
            publishedAt: { not: null },
          },
          select: {
            id: true,
            title: true,
            department: true,
            publishedAt: true,
            closedAt: true,
          },
          orderBy: { closedAt: "desc" },
          take: 50,
        });

        const timeToFillData = closedJobs.map((j) => {
          const days = j.closedAt && j.publishedAt
            ? Math.ceil(
                (j.closedAt.getTime() - j.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
              )
            : null;
          return { ...j, daysToFill: days };
        });

        const avgTimeToFill =
          timeToFillData
            .filter((j) => j.daysToFill !== null)
            .reduce((sum, j) => sum + (j.daysToFill || 0), 0) /
            (timeToFillData.filter((j) => j.daysToFill !== null).length || 1);

        reportData = {
          type: "time_to_fill",
          averageDaysToFill: Math.round(avgTimeToFill),
          jobs: timeToFillData,
        };
        break;
      }

      default: {
        reportData = {
          type,
          message: `Report type "${type}" is not yet implemented`,
        };
      }
    }

    const savedReport = await prisma.report.create({
      data: {
        title: `${type.replace(/_/g, " ")} Report`,
        type,
        dateRange: { startDate, endDate },
        filters: { department, jobId },
        result: reportData,
        companyId: session.user.companyId!,
      },
    });

    return NextResponse.json({ data: reportData, reportId: savedReport.id });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "RECRUITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = reportQuerySchema.parse(body);

    const reports = await prisma.report.findMany({
      where: {
        companyId: session.user.companyId,
        type: validated.type,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
