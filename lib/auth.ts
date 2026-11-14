"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { store } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  codename: string;
}

/** Get current Supabase Auth user + their profile from DB / metadata */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Check legacy cookie fallback (for OWNER demo)
      const cookieStore = await cookies();
      const legacyCookie = cookieStore.get(SESSION_COOKIE);
      if (legacyCookie?.value) {
        try {
          return JSON.parse(
            Buffer.from(legacyCookie.value, "base64").toString("utf-8")
          ) as Session;
        } catch {
          return null;
        }
      }
      return null;
    }

    // Try fetching profile from DB
    let dbRole: UserRole | null = null;
    let dbCodename: string | null = null;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, codename")
        .eq("id", user.id)
        .single();

      if (profile) {
        dbRole = profile.role as UserRole;
        dbCodename = profile.codename;
      }
    } catch {
      // DB table might not exist yet, fallback to user_metadata
    }

    const role = dbRole || (user.user_metadata?.role as UserRole) || null;
    const codename =
      dbCodename ||
      user.user_metadata?.codename ||
      `Anon_#${user.id.slice(0, 4).toUpperCase()}`;

    if (!role) {
      // User exists but has not selected role yet
      return null;
    }

    const session: Session = {
      userId: user.id,
      name: codename,
      email: user.email ?? "",
      role,
      codename,
    };

    // Sync user with authoritative store
    store.ensureUser({
      id: session.userId,
      codename: session.codename,
      email: session.email,
      role: session.role,
    });

    return session;
  } catch {
    return null;
  }
}

/** Returns true if user is logged in but hasn't picked a role yet */
export async function needsOnboarding(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Check user_metadata first
    if (user.user_metadata?.role) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return !profile?.role;
  } catch {
    return false;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "OWNER") redirect("/login");
  return session;
}

/** Legacy compatibility — keep cookie-based session for OWNER demo access */
const SESSION_COOKIE = "pixmart_session";

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Legacy role switcher for demo/owner fallback */
export async function switchRoleAction(role: UserRole) {
  const roleMap: Record<UserRole, Session> = {
    OWNER: {
      userId: "usr_owner_01",
      name: "System Operator",
      email: "owner@pixmart.local",
      role: "OWNER",
      codename: "SystemOperator",
    },
    SELLER: {
      userId: "usr_seller_02",
      name: "Anonymous Seller #2088",
      email: "seller2@pixmart.local",
      role: "SELLER",
      codename: "CipherSeller_02",
    },
    BUYER: {
      userId: "usr_buyer_01",
      name: "Anonymous Buyer #8821",
      email: "buyer@pixmart.local",
      role: "BUYER",
      codename: "GhostBuyer_8821",
    },
  };

  const newSession = roleMap[role];
  await setSession(newSession);
  return { success: true, session: newSession };
}
