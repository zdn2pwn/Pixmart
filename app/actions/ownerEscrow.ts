"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Hold funds from buyer (Midman action)
 */
export async function holdFundsAction(escrowId: string) {
  const session = await requireSimpleSession();
  
  if (session.role !== "OWNER") {
    return { success: false, error: "Only Midman can hold funds" };
  }

  const supabase = await createSupabaseServerClient();

  // Update escrow
  const { error } = await supabase
    .from("escrow_sessions")
    .update({
      funds_held: true,
      payment_status: "HELD_BY_MIDMAN",
    })
    .eq("id", escrowId);

  if (error) {
    console.error("[HoldFunds] Error:", error);
    return { success: false, error: "Gagal menahan dana" };
  }

  // Log activity
  await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    actor_id: session.userId,
    actor_role: "MIDMAN",
    action: "FUNDS_HELD",
    description: "Midman menahan dana dari Buyer untuk escrow",
  });

  revalidatePath(`/owner/escrow/${escrowId}`);
  revalidatePath("/owner");
  
  return { success: true };
}

/**
 * Release funds to seller (Midman action)
 * CREDITS SELLER BALANCE IN BTC/XMR!
 */
export async function releaseFundsAction(escrowId: string) {
  const session = await requireSimpleSession();
  
  if (session.role !== "OWNER") {
    return { success: false, error: "Only Midman can release funds" };
  }

  const supabase = await createSupabaseServerClient();

  // Get escrow data with seller balance
  const { data: escrow } = await supabase
    .from("escrow_sessions")
    .select("*, seller:profiles!seller_id(balance_btc, balance_xmr)")
    .eq("id", escrowId)
    .single();

  if (!escrow) {
    return { success: false, error: "Escrow tidak ditemukan" };
  }

  // Validation: must be verified first
  if (!escrow.midman_verified) {
    return { success: false, error: "Transaksi harus diverifikasi terlebih dahulu" };
  }

  // Validation: funds must be held
  if (!escrow.funds_held) {
    return { success: false, error: "Dana belum ditahan" };
  }

  // Validation: not already released
  if (escrow.funds_released) {
    return { success: false, error: "Dana sudah dilepaskan sebelumnya" };
  }

  // Calculate amount to credit to seller
  const cryptoType = escrow.crypto_type || "BTC";
  const amount = cryptoType === "BTC" ? escrow.agreed_price_btc : escrow.agreed_price_xmr;
  const sellerBalance = cryptoType === "BTC"
    ? (escrow.seller?.balance_btc || 0)
    : (escrow.seller?.balance_xmr || 0);

  // CREDIT SELLER BALANCE
  const balanceField = cryptoType === "BTC" ? "balance_btc" : "balance_xmr";
  const { error: balanceError } = await supabase
    .from("profiles")
    .update({
      [balanceField]: sellerBalance + amount,
    })
    .eq("id", escrow.seller_id);

  if (balanceError) {
    console.error("[ReleaseFunds] Seller balance credit error:", balanceError);
    return { success: false, error: "Gagal menambah saldo seller" };
  }

  // Update escrow
  const { error } = await supabase
    .from("escrow_sessions")
    .update({
      funds_released: true,
      funds_released_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      payment_status: "RELEASED_TO_SELLER",
      status: "COMPLETED",
    })
    .eq("id", escrowId);

  if (error) {
    console.error("[ReleaseFunds] Error:", error);
    return { success: false, error: "Gagal melepas dana" };
  }

  // Log activity
  await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    actor_id: session.userId,
    actor_role: "OWNER",
    action: "FUNDS_RELEASED",
    description: `Midman melepas ${amount.toFixed(8)} ${cryptoType} ke Seller (saldo baru: ${(sellerBalance + amount).toFixed(8)} ${cryptoType})`,
    metadata: {
      crypto_type: cryptoType,
      amount,
      seller_previous_balance: sellerBalance,
      seller_new_balance: sellerBalance + amount,
    },
  });

  revalidatePath(`/owner/escrow/${escrowId}`);
  revalidatePath("/owner");
  revalidatePath("/seller");
  revalidatePath(`/escrow/${escrowId}`);
  
  return { success: true };
}

/**
 * Verify escrow transaction (Midman action)
 */
export async function verifyEscrowAction(escrowId: string) {
  const session = await requireSimpleSession();
  
  if (session.role !== "OWNER") {
    return { success: false, error: "Only Midman can verify escrow" };
  }

  const supabase = await createSupabaseServerClient();

  // Get escrow data
  const { data: escrow } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", escrowId)
    .single();

  if (!escrow) {
    return { success: false, error: "Escrow tidak ditemukan" };
  }

  // Validation: both parties must confirm
  if (!escrow.buyer_confirmed || !escrow.seller_confirmed) {
    return { success: false, error: "Buyer dan Seller harus melakukan konfirmasi terlebih dahulu" };
  }

  // Update escrow
  const { error } = await supabase
    .from("escrow_sessions")
    .update({
      midman_verified: true,
      midman_verified_at: new Date().toISOString(),
    })
    .eq("id", escrowId);

  if (error) {
    console.error("[VerifyEscrow] Error:", error);
    return { success: false, error: "Gagal verifikasi" };
  }

  // Log activity
  await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    actor_id: session.userId,
    actor_role: "MIDMAN",
    action: "MIDMAN_VERIFIED",
    description: "Midman memverifikasi transaksi COD selesai",
  });

  revalidatePath(`/owner/escrow/${escrowId}`);
  revalidatePath("/owner");
  
  return { success: true };
}

/**
 * Add manual activity log (utility function)
 */
export async function addEscrowActivityAction(
  escrowId: string,
  action: string,
  description: string
) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    actor_id: session.userId,
    actor_role: session.role,
    action,
    description,
  });

  revalidatePath(`/owner/escrow/${escrowId}`);
  revalidatePath("/owner");
  
  return { success: true };
}
