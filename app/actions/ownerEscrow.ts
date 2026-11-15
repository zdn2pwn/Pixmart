"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Decrement listing stock exactly once when an escrow is verified.
 * Uses compare-and-swap on the current stock value so concurrent
 * verifications cannot drive the stock below zero.
 */
async function decrementListingStock(
  supabase: ServerSupabase,
  escrow: { seller_id: string; negotiation_id: string | null }
): Promise<{ updated: boolean; listingId?: string; stock?: number; error?: string }> {
  if (!escrow.negotiation_id) {
    return { updated: false };
  }

  const { data: negotiation, error: negotiationError } = await supabase
    .from("negotiations")
    .select("listing_id")
    .eq("id", escrow.negotiation_id)
    .maybeSingle();

  if (negotiationError || !negotiation?.listing_id) {
    return { updated: false };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: listing, error: listingError } = await supabase
      .from("marketplace_listings")
      .select("id, seller_id, stock")
      .eq("id", negotiation.listing_id)
      .maybeSingle();

    if (listingError || !listing || listing.seller_id !== escrow.seller_id) {
      return { updated: false };
    }

    const currentStock = Math.max(0, Number(listing.stock ?? 0));
    if (currentStock === 0) {
      return { updated: false, listingId: listing.id, stock: 0 };
    }

    const nextStock = currentStock - 1;
    const updatePayload: Record<string, unknown> = { stock: nextStock };
    if (nextStock === 0) {
      updatePayload.status = "SOLD";
    }

    const { data: updated, error: updateError } = await supabase
      .from("marketplace_listings")
      .update(updatePayload)
      .eq("id", listing.id)
      .eq("stock", currentStock)
      .select("id, stock")
      .maybeSingle();

    if (updateError) {
      return { updated: false, error: updateError.message };
    }

    if (updated) {
      return { updated: true, listingId: listing.id, stock: nextStock };
    }
  }

  // Stock changed concurrently several times; do not block verification.
  return { updated: false };
}

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
  const { data: updatedEscrow, error } = await supabase
    .from("escrow_sessions")
    .update({
      funds_held: true,
      payment_status: "HELD_BY_MIDMAN",
    })
    .eq("id", escrowId)
    .select("*")
    .maybeSingle();

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
  
  return { success: true, escrow: updatedEscrow };
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
  const { data: updatedEscrow, error } = await supabase
    .from("escrow_sessions")
    .update({
      funds_released: true,
      funds_released_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      payment_status: "RELEASED_TO_SELLER",
      status: "COMPLETED",
    })
    .eq("id", escrowId)
    .select("*")
    .maybeSingle();

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
  
  return { success: true, escrow: updatedEscrow };
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

  // Validation: funds must already be held by the Midman.
  // This prevents stock from being deducted for an unpaid escrow.
  if (!escrow.funds_held) {
    return { success: false, error: "Dana belum ditahan oleh Midman. Tahan dana terlebih dahulu." };
  }

  // Idempotency guard: only the call that flips midman_verified to true
  // is allowed to decrement stock. Repeated clicks will not reduce it again.
  if (escrow.midman_verified) {
    return {
      success: true,
      alreadyVerified: true,
      escrow,
      message: "Transaksi sudah diverifikasi sebelumnya",
    };
  }

  const { data: verifiedEscrow, error } = await supabase
    .from("escrow_sessions")
    .update({
      midman_verified: true,
      midman_verified_at: new Date().toISOString(),
    })
    .eq("id", escrowId)
    .or("midman_verified.eq.false,midman_verified.is.null")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[VerifyEscrow] Error:", error);
    return { success: false, error: "Gagal verifikasi" };
  }

  if (!verifiedEscrow) {
    // Another request verified it first; do not decrement stock again.
    return {
      success: true,
      alreadyVerified: true,
      escrow,
      message: "Transaksi sudah diverifikasi sebelumnya",
    };
  }

  // Transaction is verified -> reduce listing stock by one (idempotent).
  const stockResult = await decrementListingStock(supabase, escrow);

  if (stockResult.error) {
    console.error("[VerifyEscrow] Stock decrement error:", stockResult.error);
    // Compensating rollback so verification can be retried safely.
    await supabase
      .from("escrow_sessions")
      .update({ midman_verified: false, midman_verified_at: null })
      .eq("id", escrowId);

    return {
      success: false,
      error: "Gagal mengurangi stok listing. Verifikasi dibatalkan, silakan coba lagi.",
    };
  }

  // Log activity
  await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    actor_id: session.userId,
    actor_role: "MIDMAN",
    action: "MIDMAN_VERIFIED",
    description: stockResult.updated
      ? `Midman memverifikasi transaksi COD selesai. Stok listing berkurang 1 (sisa ${stockResult.stock}).`
      : "Midman memverifikasi transaksi COD selesai",
    metadata: stockResult.updated
      ? { listing_id: stockResult.listingId, stock_remaining: stockResult.stock }
      : null,
  });

  revalidatePath(`/owner/escrow/${escrowId}`);
  revalidatePath("/owner");
  revalidatePath("/seller");
  revalidatePath("/marketplace");
  if (stockResult.listingId) {
    revalidatePath(`/marketplace/${stockResult.listingId}`);
  }

  return {
    success: true,
    escrow: verifiedEscrow,
    stock: stockResult.updated ? stockResult.stock : null,
  };
}

