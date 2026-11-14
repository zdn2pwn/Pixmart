"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createListingAction(formData: FormData) {
  const session = await requireSimpleSession();
  
  if (session.role !== "SELLER") {
    return { success: false, error: "Hanya akun Seller yang dapat memasang iklan." };
  }

  const supabase = await createSupabaseServerClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = (formData.get("category") as any) || "HARDWARE_GADGETS";
  const condition = (formData.get("condition") as any) || "MINT / NEW";
  
  // Parse fiat estimate properly
  const fiatEstimateStr = formData.get("fiatEstimateIdr") as string;
  const fiatEstimateIdr = parseFloat(fiatEstimateStr) || 1000000;
  
  // Calculate crypto prices based on rough exchange rates
  // BTC ~$95,000 USD, 1 USD = 15,500 IDR -> 1 BTC = 1,472,500,000 IDR
  // XMR ~$160 USD, 1 USD = 15,500 IDR -> 1 XMR = 2,480,000 IDR
  const priceBtc = fiatEstimateIdr / 1472500000;
  const priceXmr = fiatEstimateIdr / 2480000;

  const locationCity = (formData.get("locationCity") as string) || "Jakarta Selatan";
  const locationDistrict = (formData.get("locationDistrict") as string) || "Kebayoran Baru";
  const approxLatitude = Number(formData.get("approxLatitude")) || -6.2415;
  const approxLongitude = Number(formData.get("approxLongitude")) || 106.7978;
  const meetupZone = (formData.get("meetupZone") as string) || `${locationDistrict} Area Publik`;
  const meetingAvailability =
    (formData.get("meetingAvailability") as string) || "Fleksibel sore atau akhir pekan";

  const imageUrl = formData.get("imageUrl") as string;
  const images = imageUrl && imageUrl.trim() ? [imageUrl.trim()] : [];

  if (!title || !description || fiatEstimateIdr <= 0) {
    return { success: false, error: "Judul, deskripsi, dan harga harus diisi." };
  }

  try {
    // Insert to database
    const { data: listing, error } = await supabase
      .from("marketplace_listings")
      .insert({
        seller_id: session.userId,
        title,
        description,
        category,
        condition,
        fiat_estimate_idr: fiatEstimateIdr,
        price_btc: priceBtc,
        price_xmr: priceXmr,
        stock: 1,
        location_city: locationCity,
        location_district: locationDistrict,
        approx_latitude: approxLatitude,
        approx_longitude: approxLongitude,
        meetup_zone: meetupZone,
        meeting_availability: meetingAvailability,
        images,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (error) {
      console.error("[CreateListing] Error:", error);
      return { success: false, error: "Gagal membuat listing. Coba lagi." };
    }

    revalidatePath("/marketplace");
    revalidatePath("/seller");
    
    // Redirect to seller dashboard
    redirect("/seller");
  } catch (err: any) {
    // Handle redirect (it throws internally)
    if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    
    console.error("[CreateListing] Exception:", err);
    return { success: false, error: "Terjadi kesalahan." };
  }
}

export async function toggleWishlistAction(listingId: string) {
  // TODO: Implement wishlist with database
  return { success: true, added: true };
}
