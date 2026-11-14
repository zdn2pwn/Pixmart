import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSessionFromCookie(request: NextRequest) {
  const cookie =
    request.cookies.get("pixmart_session") || request.cookies.get("arcade_session");
  if (!cookie?.value) return null;
  try {
    return JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionFromCookie(request);

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "OWNER") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If logged in as owner and visiting login page, redirect to admin
  if (pathname === "/login" && session?.role === "OWNER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
