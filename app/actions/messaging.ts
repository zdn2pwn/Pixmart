"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Send a message in an escrow room (seller-buyer chat during COD coordination)
 */
export async function sendEscrowMessageAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const roomId = formData.get("roomId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!roomId || !content) {
    return { error: "Room ID dan pesan wajib diisi." };
  }

  if (content.length > 500) {
    return { error: "Pesan terlalu panjang (maksimal 500 karakter)." };
  }

  try {
    // Verify user is participant in this escrow
    const { data: room } = await supabase
      .from("escrow_sessions")
      .select("buyer_id, seller_id")
      .eq("id", roomId)
      .single();

    if (!room) {
      return { error: "Escrow room tidak ditemukan." };
    }

    if (room.buyer_id !== session.userId && room.seller_id !== session.userId) {
      return { error: "Anda bukan partisipan dalam escrow ini." };
    }

    // Insert message - ID will be auto-generated
    const { error: insertError } = await supabase.from("escrow_messages").insert({
      escrow_id: roomId,
      sender_id: session.userId,
      sender_role: session.role,
      content: content,
    });

    if (insertError) {
      console.error("[SendEscrowMessage] Error:", insertError);
      return { error: "Gagal mengirim pesan." };
    }

    const otherId =
      room.buyer_id === session.userId ? room.seller_id : room.buyer_id;
    try {
      const { createNotificationAction } = await import("./notifications");
      await createNotificationAction(
        otherId,
        "message",
        "Pesan baru di escrow",
        content.slice(0, 80),
        `/escrow/${roomId}`
      );
    } catch {
      /* ignore */
    }

    revalidatePath(`/escrow/${roomId}`);
    return { success: true };
  } catch (err) {
    console.error("[SendEscrowMessage] Exception:", err);
    return { error: "Terjadi kesalahan." };
  }
}

/**
 * Send a message in negotiation room
 */
export async function sendNegotiationMessageAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const negotiationId = formData.get("negotiationId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!negotiationId || !content) {
    return { error: "Negotiation ID dan pesan wajib diisi." };
  }

  if (content.length > 500) {
    return { error: "Pesan terlalu panjang (maksimal 500 karakter)." };
  }

  try {
    // Verify user is participant
    const { data: negotiation } = await supabase
      .from("negotiations")
      .select("buyer_id, seller_id")
      .eq("id", negotiationId)
      .single();

    if (!negotiation) {
      return { error: "Negotiation tidak ditemukan." };
    }

    if (negotiation.buyer_id !== session.userId && negotiation.seller_id !== session.userId) {
      return { error: "Anda bukan partisipan dalam negosiasi ini." };
    }

    // Insert message - ID will be auto-generated
    const { error: insertError } = await supabase.from("negotiation_messages").insert({
      negotiation_id: negotiationId,
      sender_id: session.userId,
      sender_role: session.role,
      content: content,
      message_type: "TEXT",
    });

    if (insertError) {
      console.error("[SendNegotiationMessage] Error:", insertError);
      return { error: "Gagal mengirim pesan." };
    }

    // Notify the other party (best-effort, demo)
    const otherId =
      negotiation.buyer_id === session.userId
        ? negotiation.seller_id
        : negotiation.buyer_id;
    try {
      const { createNotificationAction } = await import("./notifications");
      await createNotificationAction(
        otherId,
        "message",
        "Pesan baru di negosiasi",
        content.slice(0, 80),
        `/negotiations/${negotiationId}`
      );
    } catch {
      /* ignore */
    }

    revalidatePath(`/negotiations/${negotiationId}`);
    return { success: true };
  } catch (err) {
    console.error("[SendNegotiationMessage] Exception:", err);
    return { error: "Terjadi kesalahan." };
  }
}
