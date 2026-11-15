"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOfferAction(formData: FormData) {
  const session = await requireSimpleSession();
  
  if (session.role !== "BUYER") {
    return { success: false, error: "Hanya akun Buyer yang dapat mengajukan penawaran" };
  }

  const supabase = await createSupabaseServerClient();
  const listingId = formData.get("listingId") as string;
  const offerPriceIdr = Number(formData.get("offerPriceIdr"));
  const messageText = (formData.get("messageText") as string) || "";

  if (!listingId || !offerPriceIdr || offerPriceIdr <= 0) {
    return { success: false, error: "Nominal penawaran tidak valid" };
  }

  // Get listing to find seller and original prices
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("seller_id, price_btc, price_xmr, fiat_estimate_idr")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { success: false, error: "Listing tidak ditemukan" };
  }

  // Calculate crypto prices based on offer (ratio to original)
  const ratio = offerPriceIdr / (listing.fiat_estimate_idr || 1000000);
  const offerPriceBtc = listing.price_btc * ratio;
  const offerPriceXmr = listing.price_xmr * ratio;

  // Generate UUID for negotiation ID
  const negotiationId = crypto.randomUUID();

  // Create negotiation with correct column names
  const { data: negotiation, error } = await supabase
    .from("negotiations")
    .insert({
      id: negotiationId,
      buyer_id: session.userId,
      seller_id: listing.seller_id,
      listing_id: listingId,
      initial_offer_btc: offerPriceBtc,
      initial_offer_xmr: offerPriceXmr,
      current_offer_btc: offerPriceBtc,
      current_offer_xmr: offerPriceXmr,
      status: "PENDING",
    })
    .select()
    .single();

  if (error || !negotiation) {
    console.error("[CreateOffer] Error:", error);
    return { success: false, error: "Gagal membuat penawaran" };
  }

  // Send initial message if provided
  if (messageText.trim()) {
    await supabase.from("negotiation_messages").insert({
      negotiation_id: negotiation.id,
      sender_id: session.userId,
      sender_role: "BUYER",
      content: messageText,
    });
  }

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/negotiations");
  
  return { success: true, negotiationId: negotiation.id };
}

export async function counterOfferAction(formData: FormData) {
  await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;
  const method = formData.get("method") as string; // 'BTC' or 'XMR'
  const amount = Number(formData.get("amount"));

  if (!negotiationId || !method || !amount || amount <= 0) {
    return { success: false, error: "Data counter offer tidak valid" };
  }

  // RESET deal agreements when counter offer is made (FIX RACE CONDITION)
  const updateData: any = {
    status: "COUNTER_OFFER",
    deal_buyer_agreed: false,
    deal_seller_agreed: false,
    buyer_agreed_at: null,
    seller_agreed_at: null,
  };

  if (method === 'BTC') {
    updateData.current_offer_btc = amount;
    updateData.current_offer_xmr = null; // Clear XMR
  } else {
    updateData.current_offer_xmr = amount;
    updateData.current_offer_btc = null; // Clear BTC
  }

  const { error } = await supabase
    .from("negotiations")
    .update(updateData)
    .eq("id", negotiationId);

  if (error) {
    console.error("[CounterOffer] Error:", error);
    return { success: false, error: "Gagal mengajukan counter-offer" };
  }

  revalidatePath(`/negotiations/${negotiationId}`);
  return { success: true };
}

export async function acceptOfferAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;

  if (!negotiationId) {
    return { success: false, error: "ID Negosiasi diperlukan" };
  }

  // Get negotiation data
  const { data: nego } = await supabase
    .from("negotiations")
    .select("*")
    .eq("id", negotiationId)
    .single();

  if (!nego) {
    return { success: false, error: "Negosiasi tidak ditemukan" };
  }

  const isBuyer = session.userId === nego.buyer_id;
  const isSeller = session.userId === nego.seller_id;

  // Update agreement status based on role
  const updateData: any = {};
  
  if (isBuyer) {
    updateData.deal_buyer_agreed = true;
    updateData.buyer_agreed_at = new Date().toISOString();
  } else if (isSeller) {
    updateData.deal_seller_agreed = true;
    updateData.seller_agreed_at = new Date().toISOString();
  }

  await supabase
    .from("negotiations")
    .update(updateData)
    .eq("id", negotiationId);

  // Check if BOTH agreed
  const bothAgreed = 
    (isBuyer && nego.deal_seller_agreed) || // Buyer agrees, seller already agreed
    (isSeller && nego.deal_buyer_agreed);   // Seller agrees, buyer already agreed

  if (bothAgreed) {
    // BOTH AGREED (2/2) - Create escrow session
    await supabase
      .from("negotiations")
      .update({ status: "ACCEPTED" })
      .eq("id", negotiationId);

    // Get listing info
    const { data: listing } = await supabase
      .from("marketplace_listings")
      .select("title")
      .eq("id", nego.listing_id)
      .single();

    // Use agreed crypto prices (whichever is NOT null)
    const agreedPriceBtc = nego.current_offer_btc;
    const agreedPriceXmr = nego.current_offer_xmr;
    
    // Determine crypto type
    const cryptoType = agreedPriceBtc && agreedPriceBtc > 0 ? 'BTC' : 'XMR';
    
    // Calculate IDR
    const btcToIdr = 1400000000;
    const xmrToIdr = 3500000;
    const agreedPriceIdr = cryptoType === 'BTC' 
      ? Math.round((agreedPriceBtc || 0) * btcToIdr)
      : Math.round((agreedPriceXmr || 0) * xmrToIdr);

    // Get default midman (first OWNER account)
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "OWNER")
      .limit(1)
      .single();

    const midmanId = ownerProfile?.id || nego.buyer_id;

    // Generate escrow ID and address
    const escrowId = crypto.randomUUID();
    const escrowAddress = `escrow_${escrowId.slice(0, 8)}`;

    // Insert with MIDMAN and explicit ID (FIX NULL ID ERROR)
    const { data: escrow, error } = await supabase
      .from("escrow_sessions")
      .insert({
        id: escrowId,
        buyer_id: nego.buyer_id,
        seller_id: nego.seller_id,
        midman_id: midmanId,
        negotiation_id: negotiationId,
        item_title: listing?.title || "Produk",
        agreed_price_btc: agreedPriceBtc,
        agreed_price_xmr: agreedPriceXmr,
        agreed_price_idr: agreedPriceIdr,
        crypto_type: cryptoType,
        escrow_address: escrowAddress,
        status: "PENDING", // FIX: Valid status is PENDING, not AWAITING_DEPOSIT
        payment_status: "AWAITING_PAYMENT",
        shipment_status: "PENDING",
      })
      .select()
      .single();

    if (error || !escrow) {
      console.error("[AcceptOffer] Error creating escrow:", error);
      return { success: false, error: `Gagal membuat escrow session: ${error?.message || 'Unknown error'}` };
    }

    // Log initial activity
    await supabase.from("escrow_activities").insert({
      escrow_id: escrow.id,
      actor_id: session.userId,
      actor_role: session.role,
      action: "ESCROW_CREATED",
      description: `Escrow dibuat setelah deal 2/2. Midman ditugaskan.`,
    });

    revalidatePath(`/negotiations/${negotiationId}`);
    revalidatePath("/escrow");
    revalidatePath("/owner");
    
    return {
      success: true,
      escrowRoomId: escrow.id,
      bothAgreed: true,
      message: "Escrow room berhasil dibuat dengan Midman! Redirect...",
    };
  }

  // Only one party agreed (1/2)
  revalidatePath(`/negotiations/${negotiationId}`);
  return {
    success: true,
    bothAgreed: false,
    message: isBuyer ? "Menunggu seller setuju..." : "Menunggu buyer setuju...",
  };
}

export async function rejectOfferAction(formData: FormData) {
  await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;

  if (!negotiationId) {
    return { success: false, error: "ID Negosiasi diperlukan" };
  }

  // REJECT HANYA RESET OFFER, BUKAN TUTUP NEGOSIASI (FIX BUG)
  // Reset deal agreements dan status kembali ke PENDING
  const { error } = await supabase
    .from("negotiations")
    .update({ 
      status: "PENDING",
      deal_buyer_agreed: false,
      deal_seller_agreed: false,
      buyer_agreed_at: null,
      seller_agreed_at: null,
    })
    .eq("id", negotiationId);

  if (error) {
    return { success: false, error: "Gagal menolak penawaran" };
  }

  revalidatePath(`/negotiations/${negotiationId}`);
  return { success: true, message: "Offer ditolak. Anda bisa counter offer lagi." };
}

export async function sendNegotiationMessageAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;
  const content = formData.get("content") as string;

  if (!negotiationId || !content.trim()) {
    return { success: false, error: "Pesan tidak boleh kosong" };
  }

  const { data: message, error } = await supabase
    .from("negotiation_messages")
    .insert({
      negotiation_id: negotiationId,
      sender_id: session.userId,
      sender_role: session.role,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("[SendNegoMessage] Error:", error);
    return { success: false, error: "Gagal mengirim pesan" };
  }

  return { success: true, message };
}

export async function cancelNegotiationAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;

  if (!negotiationId) {
    return { success: false, error: "ID Negosiasi diperlukan" };
  }

  // Get negotiation to verify ownership
  const { data: nego } = await supabase
    .from("negotiations")
    .select("buyer_id, seller_id")
    .eq("id", negotiationId)
    .single();

  if (!nego) {
    return { success: false, error: "Negosiasi tidak ditemukan" };
  }

  // Only buyer or seller can cancel
  if (session.userId !== nego.buyer_id && session.userId !== nego.seller_id) {
    return { success: false, error: "Anda tidak memiliki akses" };
  }

  // CANCEL = permanent close
  const { error } = await supabase
    .from("negotiations")
    .update({ 
      status: "CANCELLED",
      deal_buyer_agreed: false,
      deal_seller_agreed: false,
    })
    .eq("id", negotiationId);

  if (error) {
    return { success: false, error: "Gagal membatalkan negosiasi" };
  }

  revalidatePath(`/negotiations/${negotiationId}`);
  revalidatePath("/negotiations");
  return { success: true, message: "Negosiasi dibatalkan secara permanen." };
}
