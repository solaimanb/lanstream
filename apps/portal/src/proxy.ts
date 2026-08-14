import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * LANStream Proxy — lightweight pre-routing request logic.
 *
 * Responsibilities:
 * - Optimistic auth redirects
 * - Redirect authenticated users away from sign-in
 * - Redirect obvious unauthenticated portal traffic
 * - Security response headers
 *
 * Must NOT perform:
 * - Slow database queries
 * - Full authorization
 * - Server ownership checks
 * - Business mutations
 * - Host heartbeat processing
 * - Access-link validation
 */

/** Security headers applied to every response. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  // Redirect authenticated users away from auth pages
  if (sessionToken && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from portal pages
  const isPortalRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/servers") ||
    pathname.startsWith("/hosts");

  if (!sessionToken && isPortalRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Apply security headers
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
