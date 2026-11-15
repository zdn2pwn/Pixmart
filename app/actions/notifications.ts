"use server";

import { getSimpleSession } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getNotificationsAction() {
  const session = await getSimpleSession();
  if (!session) return { notifications: [], unread: 0 };

  const supabase = await createSupabaseServerClient();
  try {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const list = data || [];
    const unread = list.filter((n: any) => !n.read_at).length;
    return { notifications: list, unread };
  } catch {
    return { notifications: [], unread: 0 };
  }
}

export async function markNotificationReadAction(id: string) {
  const session = await getSimpleSession();
  if (!session) return { success: false };

  const supabase = await createSupabaseServerClient();
  try {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.userId);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsReadAction() {
  const session = await getSimpleSession();
  if (!session) return { success: false };

  const supabase = await createSupabaseServerClient();
  try {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", session.userId)
      .is("read_at", null);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function createNotificationAction(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string
) {
  const supabase = await createSupabaseServerClient();
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}