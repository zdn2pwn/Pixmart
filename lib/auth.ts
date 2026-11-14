"use server";

import { cookies } from "next/headers";
import type { UserRole } from "@/lib/types";

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

const SESSION_COOKIE = "arcade_session";

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) {
    // Default fallback to OWNER session for seamless demo experience
    return {
      userId: "usr_owner_01",
      name: "OPERATOR_00",
      email: "owner@arcadeprotocol.net",
      role: "OWNER",
    };
  }

  try {
    const session = JSON.parse(
      Buffer.from(cookie.value, "base64").toString("utf-8")
    ) as Session;
    return session;
  } catch {
    return {
      userId: "usr_owner_01",
      name: "OPERATOR_00",
      email: "owner@arcadeprotocol.net",
      role: "OWNER",
    };
  }
}

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

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "OWNER") {
    throw new Error("FORBIDDEN_OWNER_ONLY");
  }
  return session;
}

export async function switchRoleAction(role: UserRole) {
  const roleMap: Record<UserRole, Session> = {
    OWNER: {
      userId: "usr_owner_01",
      name: "OPERATOR_00",
      email: "owner@arcadeprotocol.net",
      role: "OWNER",
    },
    SELLER: {
      userId: "usr_seller_02",
      name: "RetroGhost_BDG",
      email: "retro@arcadeprotocol.net",
      role: "SELLER",
    },
    BUYER: {
      userId: "usr_buyer_01",
      name: "NeonNomad",
      email: "buyer@arcadeprotocol.net",
      role: "BUYER",
    },
  };

  const newSession = roleMap[role];
  await setSession(newSession);
  return { success: true, session: newSession };
}
