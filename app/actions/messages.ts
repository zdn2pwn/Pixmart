"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Mark negotiation message as read (triggers self-destruct countdown)
 */
export async function markNegoMessageAsReadAction(messageId: string, negotiationId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("negotiation_messages")
    .update({
      read_at: new Date().toISOString(),
      read_by: session.userId,
    })
    .eq("id", messageId)
    .is("read_at", null); // Only mark unread messages

  if (error) {
    console.error("[MarkNegoMessageRead] Error:", error);
    return { success: false };
  }

  revalidatePath(`/negotiations/${negotiationId}`);
  return { success: true };
}

/**
 * Delete negotiation message (self-destruct)
 */
export async function deleteNegoMessageAction(messageId: string, negotiationId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("negotiation_messages")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    console.error("[DeleteNegoMessage] Error:", error);
    return { success: false };
  }

  revalidatePath(`/negotiations/${negotiationId}`);
  return { success: true };
}

/**
 * Mark escrow message as read (triggers self-destruct countdown)
 */
export async function markEscrowMessageAsReadAction(messageId: string, escrowId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("escrow_messages")
    .update({
      read_at: new Date().toISOString(),
      read_by: session.userId,
    })
    .eq("id", messageId)
    .is("read_at", null); // Only mark unread messages

  if (error) {
    console.error("[MarkEscrowMessageRead] Error:", error);
    return { success: false };
  }

  revalidatePath(`/escrow/${escrowId}`);
  return { success: true };
}

/**
 * Delete escrow message (self-destruct)
 */
export async function deleteEscrowMessageAction(messageId: string, escrowId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("escrow_messages")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    console.error("[DeleteEscrowMessage] Error:", error);
    return { success: false };
  }

  revalidatePath(`/escrow/${escrowId}`);
  return { success: true };
}
