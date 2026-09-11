import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/auth/login", "/auth/register", "/api/auth", "/api/health"];

const apiRateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = apiRateLimit.get(ip);

  if (!record || now > record.resetAt) {
    apiRateLimit.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return false;
  }

  if (record.count >= 100) {
    return true;
  }

  record.count++;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    if (pathname.startsWith("/api/")) {
      const response = NextResponse.next();
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return response;
    }
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("X-User-Id", token.id as string);
    response.headers.set("X-User-Role", token.role as string);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
