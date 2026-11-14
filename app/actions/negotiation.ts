"use server";

import { requireSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function createOfferAction(formData: FormData) {
  const session = await requireSession();
  const listingId = formData.get("listingId") as string;
  const offerPriceIdr = Number(formData.get("offerPriceIdr"));
  const messageText = (formData.get("messageText") as string) || "";

  if (!listingId || !offerPriceIdr || offerPriceIdr <= 0) {
    return { success: false, error: "Nominal penawaran tidak valid" };
  }

  const res = store.createNegotiation({
    buyerId: session.userId,
    listingId,
    offerPriceIdr,
    messageText,
  });

  if (res.success && res.negotiation) {
    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${listingId}`);
    revalidatePath("/negotiations");
    return { success: true, negotiationId: res.negotiation.id };
  }

  return { success: false, error: res.error || "Gagal membuat penawaran" };
}

export async function counterOfferAction(formData: FormData) {
  const session = await requireSession();
  const negotiationId = formData.get("negotiationId") as string;
  const counterPriceIdr = Number(formData.get("counterPriceIdr"));
  const messageText = (formData.get("messageText") as string) || "";

  if (!negotiationId || !counterPriceIdr || counterPriceIdr <= 0) {
    return { success: false, error: "Nominal penawaran balik tidak valid" };
  }

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.counterOffer({
    negotiationId,
    userId: session.userId,
    userRole: role,
    counterPriceIdr,
    messageText,
  });

  if (res.success) {
    revalidatePath(`/negotiations/${negotiationId}`);
    return { success: true, negotiation: res.negotiation };
  }

  return { success: false, error: res.error || "Gagal mengajukan counter-offer" };
}

export async function acceptOfferAction(formData: FormData) {
  const session = await requireSession();
  const negotiationId = formData.get("negotiationId") as string;

  if (!negotiationId) {
    return { success: false, error: "ID Negosiasi diperlukan" };
  }

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const res = store.acceptOffer({
    negotiationId,
    userId: session.userId,
    userRole: role,
  });

  if (res.success && res.escrowRoom) {
    revalidatePath(`/negotiations/${negotiationId}`);
    revalidatePath("/escrow");
    return {
      success: true,
      escrowRoomId: res.escrowRoom.id,
    };
  }

  return { success: false, error: res.error || "Gagal menyepakati penawaran" };
}

export async function rejectOfferAction(formData: FormData) {
  const session = await requireSession();
  const negotiationId = formData.get("negotiationId") as string;

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const ok = store.rejectOffer(negotiationId, session.userId, role);
  if (ok) {
    revalidatePath(`/negotiations/${negotiationId}`);
    return { success: true };
  }
  return { success: false, error: "Gagal menolak penawaran" };
}

export async function sendNegotiationMessageAction(formData: FormData) {
  const session = await requireSession();
  const negotiationId = formData.get("negotiationId") as string;
  const content = formData.get("content") as string;

  if (!negotiationId || !content.trim()) {
    return { success: false, error: "Pesan tidak boleh kosong" };
  }

  const role = session.role === "SELLER" ? "SELLER" : "BUYER";
  const msg = store.sendNegotiationMessage(negotiationId, session.userId, role, content);
  if (msg) {
    return { success: true, message: msg };
  }
  return { success: false, error: "Gagal mengirim pesan" };
}
