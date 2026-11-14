import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Routes that require auth */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/seller",
  "/marketplace/new",
  "/negotiations",
  "/escrow",
  "/onboarding",
];

/** Routes only for OWNER */
const OWNER_ROUTES = ["/admin"];

/** Public routes — always accessible */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/marketplace"];

function isProtected(pathname: string) {
  return PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
}

function isOwnerOnly(pathname: string) {
  return OWNER_ROUTES.some((r) => pathname.startsWith(r));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Create Supabase client that can read/write cookies via middleware
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (keeps access token alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- OWNER legacy cookie fallback ---
  const legacyCookie =
    request.cookies.get("pixmart_session") ||
    request.cookies.get("arcade_session");
  let legacyRole: string | null = null;
  if (legacyCookie?.value) {
    try {
      const parsed = JSON.parse(
        Buffer.from(legacyCookie.value, "base64").toString("utf-8")
      );
      legacyRole = parsed?.role ?? null;
    } catch {
      legacyRole = null;
    }
  }

  // Owner-only routes
  if (isOwnerOnly(pathname)) {
    const isOwner = legacyRole === "OWNER";
    if (!isOwner) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Protected routes — require Supabase auth
  if (isProtected(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    // Check if user has a role; if not, redirect to onboarding
    // (except if already going to /onboarding)
    if (pathname !== "/onboarding") {
      let role: string | null = (user.user_metadata?.role as string) || null;
      if (!role) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          role = profile?.role ?? null;
        } catch {
          // ignore
        }
      }

      if (!role) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  // If logged in and visiting /login or /register → redirect to role destination
  if ((pathname === "/login" || pathname === "/register") && user) {
    let role: string | null = (user.user_metadata?.role as string) || null;
    if (!role) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        role = profile?.role ?? null;
      } catch {
        // ignore
      }
    }

    if (!role) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    const dest = role === "SELLER" ? "/seller" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
