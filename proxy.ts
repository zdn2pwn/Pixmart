import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "pixmart_session";

// Routes yang memerlukan authentication
const protectedRoutes = [
  "/dashboard",
  "/seller",
  "/owner",
  "/admin",
  "/marketplace/new",
  "/negotiations",
  "/escrow",
  "/onboarding",
  "/profile",
];

// Routes yang hanya bisa diakses kalau belum login
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy logic for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Get session from cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const isAuthenticated = !!sessionCookie?.value;

  let session = null;
  if (isAuthenticated) {
    try {
      const decoded = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
      session = JSON.parse(decoded);
    } catch (err) {
      // Invalid session, clear it
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  }

  // Check if trying to access protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if trying to access auth route (login/register)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // ═══════════════════════════════════════════════════════════
  // PROTECTED ROUTES - Require authentication
  // ═══════════════════════════════════════════════════════════
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ═══════════════════════════════════════════════════════════
  // ONBOARDING CHECK - Redirect incomplete setup to onboarding
  // ═══════════════════════════════════════════════════════════
  // Only redirect TO onboarding if setup not completed (but not if already ON onboarding)
  if (
    isAuthenticated &&
    session &&
    !session.setupCompleted &&
    pathname !== "/onboarding" &&
    !isAuthRoute &&
    isProtectedRoute // Only redirect protected routes
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Note: /onboarding page itself will handle the "already completed" redirect
  // to avoid double-checking and potential redirect loops

  // ═══════════════════════════════════════════════════════════
  // AUTH ROUTES - Redirect authenticated users away
  // ═══════════════════════════════════════════════════════════
  if (isAuthRoute && isAuthenticated && session) {
    // If setup not completed, go to onboarding
    if (!session.setupCompleted) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Otherwise go to the role's home
    const dashboardUrl =
      session.role === "OWNER"
        ? "/owner"
        : session.role === "SELLER"
          ? "/seller"
          : "/dashboard";
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // ═══════════════════════════════════════════════════════════
  // ROLE-BASED ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════
  if (isAuthenticated && session) {
    // Owner/admin routes - only OWNER can access
    if (
      (pathname.startsWith("/owner") || pathname.startsWith("/admin")) &&
      session.role !== "OWNER"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Seller routes - only SELLER can access
    if (pathname.startsWith("/seller") && session.role !== "SELLER") {
      const fallback = session.role === "OWNER" ? "/owner" : "/dashboard";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

export default proxy;

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
