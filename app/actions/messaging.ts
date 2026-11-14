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

    revalidatePath(`/negotiations/${negotiationId}`);
    return { success: true };
  } catch (err) {
    console.error("[SendNegotiationMessage] Exception:", err);
    return { error: "Terjadi kesalahan." };
  }
}
