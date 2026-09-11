import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: {
          status: "connected",
          latency: `${dbLatency}ms`,
        },
        nextauth: {
          status: process.env.NEXTAUTH_SECRET ? "configured" : "not_configured",
        },
        openai: {
          status: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
        },
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: "disconnected",
            error: "Failed to connect to database",
          },
        },
      },
      { status: 503 }
    );
  }
}
