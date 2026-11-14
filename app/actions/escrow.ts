"use server";

import { requireSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { revalidatePath } from "next/cache";

/**
 * Authorization check: User must be Buyer, Seller of the room, or Owner
 */
export async function getAuthorizedEscrowRoom(roomId: string) {
  const session = await requireSession();
  const room = store.getEscrowRoomById(roomId);
  if (!room) return { error: "Room tidak ditemukan" };

  if (
    session.role !== "OWNER" &&
    room.buyerId !== session.userId &&
    room.sellerId !== session.userId
  ) {
    return { error: "AKSES DITOLAK: Anda bukan pihak yang terlibat dalam transaksi ini." };
  }

  return { room, session };
}

/**
 * Direct purchase at listing price (skipping negotiation if buyer chooses direct buy)
 */
export async function createDirectEscrowAction(formData: FormData) {
  const session = await requireSession();
  const listingId = formData.get("listingId") as string;
  const listing = store.getListingById(listingId);
  if (!listing) return { success: false, error: "Barang tidak ditemukan" };

  // Create auto-accepted deal
  const negRes = store.createNegotiation({
    buyerId: session.userId,
    listingId,
    offerPriceIdr: listing.fiatEstimateIdr,
    messageText: "Pembelian langsung sesuai harga pas katalog.",
  });

  if (!negRes.success || !negRes.negotiation) {
    return { success: false, error: negRes.error || "Gagal menginisiasi pembelian" };
  }

  const acceptRes = store.acceptOffer({
    negotiationId: negRes.negotiation.id,
    userId: session.userId,
    userRole: "BUYER",
  });

  if (acceptRes.success && acceptRes.escrowRoom) {
    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${listingId}`);
    return { success: true, escrowRoomId: acceptRes.escrowRoom.id };
  }

  return { success: false, error: "Gagal membuat Escrow Room" };
}

// Backward-compatibility wrapper
export async function createEscrowOrderAction(formData: FormData) {
  return createDirectEscrowAction(formData);
}

/**
 * Handshake presence update
 */
export async function updateHandshakePresenceAction(roomId: string, connected: boolean) {
  const session = await requireSession();
  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const updated = store.updateEscrowPresence(roomId, role, connected);
  return { success: !!updated, room: updated };
}

/**
 * Propose meeting point & time
 */
export async function proposeMeetingAction(formData: FormData) {
  const session = await requireSession();
  const roomId = formData.get("roomId") as string;
  const locationName = formData.get("locationName") as string;
  const areaNote = (formData.get("areaNote") as string) || "Area publik";
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;

  if (!roomId || !locationName || !date || !time) {
    return { success: false, error: "Lengkapi lokasi, tanggal, dan jam pertemuan" };
  }

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.proposeMeetingPoint({
    roomId,
    proposedBy: role,
    locationName,
    areaNote,
    date,
    time,
  });

  if (res.success) {
    revalidatePath(`/escrow/${roomId}`);
    return { success: true, room: res.room };
  }
  return { success: false, error: res.error || "Gagal mengusulkan titik temu" };
}

/**
 * Accept meeting point & time
 */
export async function acceptMeetingAction(roomId: string) {
  const session = await requireSession();
  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.acceptMeetingPoint(roomId, session.userId, role);
  if (res.success) {
    revalidatePath(`/escrow/${roomId}`);
    return { success: true, room: res.room };
  }
  return { success: false, error: res.error || "Gagal menyetujui titik temu" };
}

/**
 * Confirm arrival at meeting point ("I'm here")
 */
export async function confirmArrivalAction(roomId: string) {
  const session = await requireSession();
  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.confirmArrival(roomId, role);
  if (res.success) {
    revalidatePath(`/escrow/${roomId}`);
    return { success: true, room: res.room };
  }
  return { success: false, error: res.error || "Gagal konfirmasi kehadiran" };
}

/**
 * COD Double Confirmation Handshake:
 * Buyer: Confirm Received
 * Seller: Confirm Handed Over
 */
export async function confirmCodHandshakeAction(roomId: string) {
  const session = await requireSession();
  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.confirmCodHandshake(roomId, role);
  if (res.success) {
    revalidatePath(`/escrow/${roomId}`);
    return {
      success: true,
      room: res.room,
      bothConfirmed: res.bothConfirmed,
    };
  }
  return { success: false, error: res.error || "Gagal konfirmasi COD" };
}

// Backward compatibility alias
export async function confirmHandshakeAction(orderId: string, roleToConfirm: "BUYER" | "SELLER") {
  const res = store.confirmCodHandshake(orderId, roleToConfirm);
  return {
    success: res.success,
    order: res.room,
    bothConfirmed: res.bothConfirmed,
    error: res.error,
  };
}

/**
 * File dispute if issue occurs during meetup or negotiation
 */
export async function fileDisputeAction(formData: FormData) {
  const session = await requireSession();
  const roomId = formData.get("roomId") as string;
  const reason = formData.get("reason") as string;
  const description = (formData.get("description") as string) || "";

  if (!roomId || !reason) {
    return { success: false, error: "Pilih alasan sengketa (dispute)" };
  }

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.fileDispute({
    roomId,
    raisedBy: role,
    reason,
    description,
  });

  if (res.success) {
    revalidatePath(`/escrow/${roomId}`);
    revalidatePath("/admin");
    return { success: true, room: res.room };
  }
  return { success: false, error: res.error || "Gagal mengajukan dispute" };
}

/**
 * Owner resolves dispute
 */
export async function resolveDisputeAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "OWNER") {
    return { success: false, error: "Hanya Owner/Operator yang dapat menyelesaikan dispute" };
  }

  const roomId = formData.get("roomId") as string;
  const resolutionNote = formData.get("resolutionNote") as string;

  if (!roomId || !resolutionNote) {
    return { success: false, error: "Catatan resolusi diperlukan" };
  }

  const ok = store.resolveDispute(roomId, resolutionNote);
  if (ok) {
    revalidatePath(`/escrow/${roomId}`);
    revalidatePath("/admin");
    return { success: true };
  }
  return { success: false, error: "Gagal menyelesaikan dispute" };
}

/**
 * Realtime in-room escrow chat
 */
export async function sendEscrowMessageAction(formData: FormData) {
  const session = await requireSession();
  const roomId = formData.get("roomId") as string;
  const content = formData.get("content") as string;

  if (!roomId || !content.trim()) {
    return { success: false, error: "Pesan tidak boleh kosong" };
  }

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const msg = store.sendEscrowChatMessage(roomId, session.userId, role, content);
  if (msg) {
    return { success: true, message: msg };
  }
  return { success: false, error: "Gagal mengirim pesan" };
}
