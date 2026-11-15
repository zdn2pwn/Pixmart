"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Buyer pays for escrow (deducts from buyer balance, marks payment as RECEIVED)
 */
export async function payEscrowAction(escrowId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  // Get escrow details
  const { data: escrow } = await supabase
    .from("escrow_sessions")
    .select("*, buyer:profiles!buyer_id(balance_btc, balance_xmr)")
    .eq("id", escrowId)
    .single();

  if (!escrow) {
    return { success: false, error: "Escrow tidak ditemukan" };
  }

  if (escrow.buyer_id !== session.userId) {
    return { success: false, error: "Hanya buyer yang dapat membayar" };
  }

  if (escrow.payment_status !== "AWAITING_PAYMENT") {
    return { success: false, error: "Escrow sudah dibayar atau tidak valid" };
  }

  const cryptoType = escrow.crypto_type || "BTC";
  const amount = cryptoType === "BTC" ? escrow.agreed_price_btc : escrow.agreed_price_xmr;
  const buyerBalance = cryptoType === "BTC" 
    ? (escrow.buyer?.balance_btc || 0)
    : (escrow.buyer?.balance_xmr || 0);

  // Check balance
  if (buyerBalance < amount) {
    return { 
      success: false, 
      error: `Saldo ${cryptoType} tidak cukup. Butuh: ${amount.toFixed(8)}, Saldo: ${buyerBalance.toFixed(8)}` 
    };
  }

  // Deduct buyer balance
  const balanceField = cryptoType === "BTC" ? "balance_btc" : "balance_xmr";
  const { error: balanceError } = await supabase
    .from("profiles")
    .update({
      [balanceField]: buyerBalance - amount,
    })
    .eq("id", session.userId);

  if (balanceError) {
    console.error("[PayEscrow] Balance deduction error:", balanceError);
    return { success: false, error: "Gagal mengurangi saldo" };
  }

  // Update escrow payment status
  const { data: updatedEscrow, error: escrowError } = await supabase
    .from("escrow_sessions")
    .update({
      payment_status: "RECEIVED",
      payment_amount_idr: escrow.agreed_price_idr,
    })
    .eq("id", escrowId)
    .select("*")
    .maybeSingle();

  if (escrowError) {
    console.error("[PayEscrow] Escrow update error:", escrowError);
    return { success: false, error: "Gagal update status pembayaran" };
  }

  // Log activity
  await supabase.from("escrow_activities").insert({
    escrow_id: escrowId,
    actor_id: session.userId,
    actor_role: "BUYER",
    action: "PAYMENT_RECEIVED",
    description: `Buyer membayar ${amount.toFixed(8)} ${cryptoType} (≈ Rp ${escrow.agreed_price_idr.toLocaleString("id-ID")})`,
    metadata: {
      crypto_type: cryptoType,
      amount,
      amount_idr: escrow.agreed_price_idr,
    },
  });

  revalidatePath(`/escrow/${escrowId}`);
  revalidatePath("/dashboard");
  revalidatePath("/owner");

  return { success: true, escrow: updatedEscrow };
}

