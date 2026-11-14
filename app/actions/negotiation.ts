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
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;
  const method = formData.get("method") as string; // 'BTC' or 'XMR'
  const amount = Number(formData.get("amount"));

  if (!negotiationId || !method || !amount || amount <= 0) {
    return { success: false, error: "Data counter offer tidak valid" };
  }

  // Update negotiation - ONLY set the selected method!
  const updateData: any = {
    status: "COUNTER_OFFER",
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

// Helper to transform negotiation
function transformNegotiation(dbNego: any) {
  if (!dbNego) return null;
  return {
    id: dbNego.id,
    buyerId: dbNego.buyer_id,
    sellerId: dbNego.seller_id,
    listingId: dbNego.listing_id,
    initialOfferBtc: dbNego.initial_offer_btc,
    initialOfferXmr: dbNego.initial_offer_xmr,
    currentOfferBtc: dbNego.current_offer_btc,
    currentOfferXmr: dbNego.current_offer_xmr,
    status: dbNego.status,
    createdAt: dbNego.created_at,
    updatedAt: dbNego.updated_at,
    messages: [], // Will be fetched separately
    listing: null,
    buyer: null,
    seller: null,
  } as any;
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

    const { data: escrow, error } = await supabase
      .from("escrow_sessions")
      .insert({
        buyer_id: nego.buyer_id,
        seller_id: nego.seller_id,
        listing_id: nego.listing_id,
        negotiation_id: negotiationId,
        agreed_price_btc: nego.current_offer_btc,
        agreed_price_xmr: nego.current_offer_xmr,
        status: "PENDING_DEPOSIT",
      })
      .select()
      .single();

    if (error || !escrow) {
      console.error("[AcceptOffer] Error:", error);
      return { success: false, error: "Gagal membuat escrow session" };
    }

    revalidatePath(`/negotiations/${negotiationId}`);
    revalidatePath("/escrow");
    
    return {
      success: true,
      escrowRoomId: escrow.id,
      bothAgreed: true,
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
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const negotiationId = formData.get("negotiationId") as string;

  const { error } = await supabase
    .from("negotiations")
    .update({ status: "REJECTED" })
    .eq("id", negotiationId);

  if (error) {
    return { success: false, error: "Gagal menolak penawaran" };
  }

  revalidatePath(`/negotiations/${negotiationId}`);
  return { success: true };
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
