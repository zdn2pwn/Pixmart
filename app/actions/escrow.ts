"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to transform snake_case database to camelCase for components
function transformEscrowRoom(dbRoom: any) {
  if (!dbRoom) return null;
  return {
    id: dbRoom.id,
    buyerId: dbRoom.buyer_id,
    sellerId: dbRoom.seller_id,
    listingId: dbRoom.listing_id,
    negotiationId: dbRoom.negotiation_id,
    agreedPriceIdr: dbRoom.agreed_price_idr,
    agreedPriceBtc: dbRoom.agreed_price_btc,
    agreedPriceXmr: dbRoom.agreed_price_xmr,
    status: dbRoom.status,
    meetingProposal: dbRoom.meeting_proposal,
    meetingConfirmed: dbRoom.meeting_accepted,
    meetingStatus: dbRoom.meeting_accepted ? "SCHEDULED" : "PENDING",
    buyerArrived: dbRoom.buyer_arrived || false,
    sellerArrived: dbRoom.seller_arrived || false,
    buyerConfirmed: dbRoom.buyer_confirmed || false,
    buyerConfirmedReceived: dbRoom.buyer_confirmed || false,
    sellerConfirmed: dbRoom.seller_confirmed || false,
    sellerConfirmedHandedOver: dbRoom.seller_confirmed || false,
    dispute: dbRoom.dispute,
    disputeResolution: dbRoom.dispute_resolution,
    completedAt: dbRoom.completed_at,
    createdAt: dbRoom.created_at,
    messages: [], // Will be fetched separately in components
    listing: null,
    buyer: null,
    seller: null,
  } as any;
}

/**
 * Authorization check: User must be Buyer, Seller of the room, or Owner
 */
export async function getAuthorizedEscrowRoom(roomId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const { data: room } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", roomId)
    .single();
    
  if (!room) return { error: "Room tidak ditemukan" };

  if (
    session.role !== "OWNER" &&
    room.buyer_id !== session.userId &&
    room.seller_id !== session.userId
  ) {
    return { error: "AKSES DITOLAK: Anda bukan pihak yang terlibat dalam transaksi ini." };
  }

  return { room, session };
}

/**
 * Direct purchase at listing price (skipping negotiation if buyer chooses direct buy)
 */
export async function createDirectEscrowAction(formData: FormData) {
  const session = await requireSimpleSession();
  
  if (session.role !== "BUYER") {
    return { success: false, error: "Hanya Buyer yang dapat membuat transaksi" };
  }

  const supabase = await createSupabaseServerClient();
  const listingId = formData.get("listingId") as string;
  
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .single();
    
  if (!listing) return { success: false, error: "Barang tidak ditemukan" };

  // Create auto-accepted negotiation with generated ID
  const negotiationId = crypto.randomUUID();
  
  const { data: negotiation } = await supabase
    .from("negotiations")
    .insert({
      id: negotiationId,
      buyer_id: session.userId,
      seller_id: listing.seller_id,
      listing_id: listingId,
      initial_offer_btc: listing.price_btc,
      initial_offer_xmr: listing.price_xmr,
      current_offer_btc: listing.price_btc,
      current_offer_xmr: listing.price_xmr,
      status: "ACCEPTED",
    })
    .select()
    .single();

  if (!negotiation) {
    return { success: false, error: "Gagal menginisiasi pembelian" };
  }

  // Send auto message
  await supabase.from("negotiation_messages").insert({
    negotiation_id: negotiationId,
    sender_id: session.userId,
    sender_role: "BUYER",
    content: "Pembelian langsung sesuai harga pas katalog.",
  });

  // Auto-assign first OWNER as Midman
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "OWNER")
    .limit(1)
    .single();

  if (!ownerProfile) {
    return { success: false, error: "Sistem escrow belum siap (Midman tidak tersedia)" };
  }

  // Create escrow session with generated ID
  const escrowId = crypto.randomUUID();
  const escrowAddress = `escrow_${escrowId.slice(0, 8)}`;
  const agreedPriceIdr = Math.round(listing.price_btc * 1400000000); // 1 BTC ≈ 1.4B IDR
  
  const { data: escrow, error } = await supabase
    .from("escrow_sessions")
    .insert({
      id: escrowId,
      buyer_id: session.userId,
      seller_id: listing.seller_id,
      midman_id: ownerProfile.id,
      negotiation_id: negotiationId,
      item_title: listing.title,
      agreed_price_btc: listing.price_btc,
      agreed_price_xmr: listing.price_xmr,
      agreed_price_idr: agreedPriceIdr,
      crypto_type: "BTC", // Default BTC untuk direct buy
      escrow_address: escrowAddress,
      status: "PENDING", // Changed: was AWAITING_PAYMENT
      payment_status: "AWAITING_PAYMENT",
      shipment_status: "NOT_STARTED",
    })
    .select()
    .single();

  if (error || !escrow) {
    console.error("[CreateDirectEscrow] Error:", error);
    return { success: false, error: "Gagal membuat Escrow Room" };
  }

  // Log activity: Escrow created
  await supabase.from("escrow_activities").insert({
    escrow_id: escrow.id,
    actor_id: session.userId,
    actor_role: "BUYER",
    action: "ESCROW_CREATED",
    description: `Buyer membuat escrow untuk pembelian langsung: ${listing.title}`,
    metadata: {
      listing_id: listingId,
      agreed_price_idr: agreedPriceIdr,
      crypto_type: "BTC",
    },
  });

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/escrow");
  revalidatePath("/owner");
  
  return { success: true, escrowRoomId: escrow.id };
}

// Backward-compatibility wrapper
export async function createEscrowOrderAction(formData: FormData) {
  return createDirectEscrowAction(formData);
}

/**
 * Propose meeting point & time
 */
export async function proposeMeetingAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const roomId = formData.get("roomId") as string;
  const locationName = formData.get("locationName") as string;
  const areaNote = (formData.get("areaNote") as string) || "Area publik";
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;

  if (!roomId || !locationName || !date || !time) {
    return { success: false, error: "Lengkapi lokasi, tanggal, dan jam pertemuan" };
  }

  const meetingProposal = {
    proposed_by: session.role,
    location_name: locationName,
    area_note: areaNote,
    date,
    time,
    proposed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("escrow_sessions")
    .update({ 
      meeting_proposal: meetingProposal,
    })
    .eq("id", roomId);

  if (error) {
    console.error("[ProposeMeeting] Error:", error);
    return { success: false, error: "Gagal mengusulkan titik temu" };
  }

  // Refetch updated room
  const { data: room } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", roomId)
    .single();

  revalidatePath(`/escrow/${roomId}`);
  return { success: true, room: transformEscrowRoom(room) };
}

/**
 * Accept meeting point & time
 */
export async function acceptMeetingAction(roomId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("escrow_sessions")
    .update({ 
      meeting_accepted: true,
    })
    .eq("id", roomId);

  if (error) {
    console.error("[AcceptMeeting] Error:", error);
    return { success: false, error: "Gagal menyetujui titik temu" };
  }

  // Refetch updated room
  const { data: room } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", roomId)
    .single();

  revalidatePath(`/escrow/${roomId}`);
  return { success: true, room: transformEscrowRoom(room) };
}

/**
 * Confirm arrival at meeting point ("I'm here")
 */
export async function confirmArrivalAction(roomId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const field = session.role === "BUYER" ? "buyer_arrived" : "seller_arrived";

  const { error } = await supabase
    .from("escrow_sessions")
    .update({ 
      [field]: true,
    })
    .eq("id", roomId);

  if (error) {
    console.error("[ConfirmArrival] Error:", error);
    return { success: false, error: "Gagal konfirmasi kehadiran" };
  }

  // Refetch updated room
  const { data: room } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", roomId)
    .single();

  revalidatePath(`/escrow/${roomId}`);
  return { success: true, room: transformEscrowRoom(room) };
}

/**
 * COD Double Confirmation Handshake:
 * Buyer: Confirm Received
 * Seller: Confirm Handed Over
 */
export async function confirmCodHandshakeAction(roomId: string) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  // Get current state
  const { data: currentRoom } = await supabase
    .from("escrow_sessions")
    .select("buyer_confirmed, seller_confirmed")
    .eq("id", roomId)
    .single();

  if (!currentRoom) {
    return { success: false, error: "Escrow room tidak ditemukan" };
  }

  const field = session.role === "BUYER" ? "buyer_confirmed" : "seller_confirmed";
  const buyerConfirmed = field === "buyer_confirmed" ? true : currentRoom.buyer_confirmed;
  const sellerConfirmed = field === "seller_confirmed" ? true : currentRoom.seller_confirmed;
  const bothConfirmed = buyerConfirmed && sellerConfirmed;

  const updateData: any = {
    [field]: true,
  };
  
  // Only update status and completed_at if both confirmed
  if (bothConfirmed) {
    updateData.completed_at = new Date().toISOString();
    // Don't update status, let it stay as is
  }

  const { error } = await supabase
    .from("escrow_sessions")
    .update(updateData)
    .eq("id", roomId);

  if (error) {
    console.error("[ConfirmCOD] Error:", error);
    return { success: false, error: "Gagal konfirmasi COD" };
  }

  // Refetch updated room
  const { data: room } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", roomId)
    .single();

  revalidatePath(`/escrow/${roomId}`);
  return {
    success: true,
    room: transformEscrowRoom(room),
    bothConfirmed,
  };
}

// Backward compatibility alias
export async function confirmHandshakeAction(orderId: string, roleToConfirm: "BUYER" | "SELLER") {
  return confirmCodHandshakeAction(orderId);
}

/**
 * File dispute if issue occurs during meetup or negotiation
 */
export async function fileDisputeAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const roomId = formData.get("roomId") as string;
  const reason = formData.get("reason") as string;
  const description = (formData.get("description") as string) || "";

  if (!roomId || !reason) {
    return { success: false, error: "Pilih alasan sengketa (dispute)" };
  }

  const dispute = {
    raised_by: session.role,
    reason,
    description,
    filed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("escrow_sessions")
    .update({ 
      dispute,
    })
    .eq("id", roomId);

  if (error) {
    console.error("[FileDispute] Error:", error);
    return { success: false, error: "Gagal mengajukan dispute" };
  }

  // Refetch updated room
  const { data: room } = await supabase
    .from("escrow_sessions")
    .select("*")
    .eq("id", roomId)
    .single();

  revalidatePath(`/escrow/${roomId}`);
  revalidatePath("/admin");
  return { success: true, room: transformEscrowRoom(room) };
}

/**
 * Owner resolves dispute
 */
export async function resolveDisputeAction(formData: FormData) {
  const session = await requireSimpleSession();
  
  if (session.role !== "OWNER") {
    return { success: false, error: "Hanya Owner/Operator yang dapat menyelesaikan dispute" };
  }

  const supabase = await createSupabaseServerClient();
  const roomId = formData.get("roomId") as string;
  const resolutionNote = formData.get("resolutionNote") as string;

  if (!roomId || !resolutionNote) {
    return { success: false, error: "Catatan resolusi diperlukan" };
  }

  const { error } = await supabase
    .from("escrow_sessions")
    .update({ 
      dispute_resolution: resolutionNote,
    })
    .eq("id", roomId);

  if (error) {
    console.error("[ResolveDispute] Error:", error);
    return { success: false, error: "Gagal menyelesaikan dispute" };
  }

  revalidatePath(`/escrow/${roomId}`);
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Realtime in-room escrow chat
 */
export async function sendEscrowMessageAction(formData: FormData) {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();
  
  const roomId = formData.get("roomId") as string;
  const content = formData.get("content") as string;

  if (!roomId || !content.trim()) {
    return { success: false, error: "Pesan tidak boleh kosong" };
  }

  const { data: message, error } = await supabase
    .from("escrow_messages")
    .insert({
      escrow_id: roomId,
      sender_id: session.userId,
      sender_role: session.role,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("[SendEscrowMessage] Error:", error);
    return { success: false, error: "Gagal mengirim pesan" };
  }

  return { success: true, message };
}
