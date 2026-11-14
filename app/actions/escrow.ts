"use server";

import { requireSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CryptoCurrency, ListingCategory } from "@/lib/types";

export async function createEscrowOrderAction(formData: FormData) {
  const session = await requireSession();

  const listingId = formData.get("listingId") as string;
  const cryptoCurrency = (formData.get("cryptoCurrency") as CryptoCurrency) || "XMR";
  const meetupLocation = (formData.get("meetupLocation") as string) || "";
  const meetupScheduleNotes = (formData.get("meetupScheduleNotes") as string) || "";

  if (!listingId) {
    return { success: false, error: "Listing ID wajib diisi" };
  }

  const res = store.createEscrowOrder({
    listingId,
    buyerId: session.userId,
    cryptoCurrency,
    meetupLocation,
    meetupScheduleNotes,
  });

  if (!res.success || !res.order) {
    return { success: false, error: res.error || "Gagal membuat escrow order" };
  }

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/admin");
  revalidatePath(`/escrow/${res.order.id}`);

  redirect(`/escrow/${res.order.id}`);
}

export async function confirmHandshakeAction(orderId: string, role: "BUYER" | "SELLER") {
  const session = await requireSession();

  const result = store.confirmHandshake(orderId, role);

  if (!result.success || !result.order) {
    return { success: false, error: result.error || "Gagal mengonfirmasi serah terima" };
  }

  revalidatePath(`/escrow/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/marketplace");

  return {
    success: true,
    bothConfirmed: result.bothConfirmed,
    order: result.order,
  };
}

export async function createListingAction(formData: FormData) {
  const session = await requireSession();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as ListingCategory;
  const priceBtc = parseFloat(formData.get("priceBtc") as string) || 0;
  const priceXmr = parseFloat(formData.get("priceXmr") as string) || 0;
  const fiatEstimateIdr = parseInt(formData.get("fiatEstimateIdr") as string) || 0;
  const locationCity = formData.get("locationCity") as string;
  const meetupZone = formData.get("meetupZone") as string;
  const condition = formData.get("condition") as any;
  const imageUrl = (formData.get("imageUrl") as string)?.trim();

  if (!title || !locationCity || !meetupZone) {
    return { success: false, error: "Judul, Kota, dan Area Meetup wajib diisi" };
  }

  const listing = store.createListing({
    sellerId: session.userId,
    title,
    description,
    category,
    priceBtc,
    priceXmr,
    fiatEstimateIdr,
    locationCity,
    meetupZone,
    condition,
    images: imageUrl ? [imageUrl] : [],
  });

  revalidatePath("/marketplace");
  revalidatePath("/admin");
  redirect(`/marketplace/${listing.id}`);
}
