"use server";

import { requireSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function toggleWishlistAction(listingId: string) {
  const session = await requireSession();
  const added = store.toggleWishlist(session.userId, listingId);
  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  return { success: true, added };
}

export async function createListingAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    return { success: false, error: "Hanya akun Penjual (Seller) yang dapat memasang iklan." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = (formData.get("category") as any) || "HARDWARE_GADGETS";
  const condition = (formData.get("condition") as any) || "MINT / NEW";
  const fiatEstimateIdr = Number(formData.get("fiatEstimateIdr")) || 1000000;
  const priceBtc = Number(formData.get("priceBtc")) || fiatEstimateIdr / 1400000000;
  const priceXmr = Number(formData.get("priceXmr")) || fiatEstimateIdr / 2100000;

  const locationCity = (formData.get("locationCity") as string) || "Jakarta Selatan";
  const locationDistrict = (formData.get("locationDistrict") as string) || "Kebayoran Baru";
  const locationRegion = (formData.get("locationRegion") as string) || "DKI Jakarta";
  const approxLatitude = Number(formData.get("approxLatitude")) || -6.2415;
  const approxLongitude = Number(formData.get("approxLongitude")) || 106.7978;
  const meetupZone = (formData.get("meetupZone") as string) || `${locationDistrict} Area Publik`;
  const meetingAvailability =
    (formData.get("meetingAvailability") as string) || "Fleksibel sore atau akhir pekan di area publik";

  const imageUrl = formData.get("imageUrl") as string;
  const images = imageUrl && imageUrl.trim() ? [imageUrl.trim()] : [];

  if (!title || !description || fiatEstimateIdr <= 0) {
    return { success: false, error: "Judul, deskripsi, dan harga harus diisi dengan benar." };
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
    locationDistrict,
    locationRegion,
    approxLatitude,
    approxLongitude,
    meetupZone,
    meetingAvailability,
    condition,
    stock: 1,
    images,
  });

  revalidatePath("/marketplace");
  revalidatePath("/seller");
  return { success: true, listingId: listing.id };
}
