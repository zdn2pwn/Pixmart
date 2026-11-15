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
  
  // Parse stock from form
  const stockStr = formData.get("stock") as string;
  const stock = parseInt(stockStr) || 1;

  if (!title || !description || fiatEstimateIdr <= 0) {
    return { success: false, error: "Judul, deskripsi, dan harga harus diisi." };
  }

  try {
    // Insert to database
    const { error } = await supabase
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
        stock: stock,
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

export async function updateListingAction(formData: FormData) {
  try {
    const session = await requireSimpleSession();

    if (session.role !== "SELLER" && session.role !== "OWNER") {
      return { success: false, error: "Tidak memiliki hak akses." };
    }

    const supabase = await createSupabaseServerClient();

    const listingId = (formData.get("listingId") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const category = (formData.get("category") as string) || "HARDWARE_GADGETS";
    const condition = (formData.get("condition") as string) || "MINT / NEW";

    const fiatEstimateStr = formData.get("fiatEstimateIdr") as string;
    const fiatEstimateIdr = parseFloat(fiatEstimateStr);

    const priceBtc = fiatEstimateIdr / 1472500000;
    const priceXmr = fiatEstimateIdr / 2480000;

    const locationCity = (formData.get("locationCity") as string)?.trim() || "Jakarta";
    const locationDistrict = (formData.get("locationDistrict") as string)?.trim() || "Pusat";
    const approxLatitude = Number(formData.get("approxLatitude")) || -6.2415;
    const approxLongitude = Number(formData.get("approxLongitude")) || 106.7978;
    const meetupZone = (formData.get("meetupZone") as string)?.trim() || "Area Publik";
    const meetingAvailability =
      (formData.get("meetingAvailability") as string)?.trim() || "Fleksibel";

    const imageUrl = formData.get("imageUrl") as string;
    const images = imageUrl && imageUrl.trim() ? [imageUrl.trim()] : [];

    const stockStr = formData.get("stock") as string;
    const stock = stockStr === null || stockStr === "" ? 0 : parseInt(stockStr, 10);

    if (!listingId) {
      return { success: false, error: "Listing ID diperlukan." };
    }

    if (!title || !description) {
      return { success: false, error: "Judul dan deskripsi wajib diisi." };
    }

    if (!Number.isFinite(fiatEstimateIdr) || fiatEstimateIdr <= 0) {
      return { success: false, error: "Harga harus berupa angka lebih dari 0." };
    }

    if (isNaN(stock) || stock < 0) {
      return { success: false, error: "Stok harus berupa angka 0 atau lebih." };
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("marketplace_listings")
      .select("seller_id")
      .eq("id", listingId)
      .maybeSingle();

    if (fetchError) {
      console.error("[updateListingAction] Fetch error:", fetchError);
      return { success: false, error: "Gagal memverifikasi listing." };
    }

    if (!existing) {
      return { success: false, error: "Listing tidak ditemukan atau sudah dihapus." };
    }

    if (existing.seller_id !== session.userId && session.role !== "OWNER") {
      return { success: false, error: "Anda tidak memiliki hak untuk mengedit listing ini." };
    }

    // Update listing. select() dipakai untuk memastikan update benar-benar
    // mengenai satu baris, bukan hanya "sukses" tanpa perubahan.
    const { data: updated, error: updateError } = await supabase
      .from("marketplace_listings")
      .update({
        title,
        description,
        category,
        condition,
        fiat_estimate_idr: fiatEstimateIdr,
        price_btc: priceBtc,
        price_xmr: priceXmr,
        stock,
        location_city: locationCity,
        location_district: locationDistrict,
        approx_latitude: approxLatitude,
        approx_longitude: approxLongitude,
        meetup_zone: meetupZone,
        meeting_availability: meetingAvailability,
        images,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[updateListingAction] Update error:", updateError);
      return { success: false, error: "Gagal mengupdate listing: " + updateError.message };
    }

    if (!updated) {
      return { success: false, error: "Listing gagal diperbarui. Silakan coba lagi." };
    }

    revalidatePath("/marketplace");
    revalidatePath("/seller");
    revalidatePath(`/marketplace/${listingId}`);

    return { success: true };
  } catch (err: any) {
    // Redirect dari requireSimpleSession harus diteruskan ke Next.js,
    // bukan dianggap sebagai update yang berhasil.
    if (err?.digest?.includes?.("NEXT_REDIRECT") || err?.message === "NEXT_REDIRECT") {
      throw err;
    }

    console.error("[updateListingAction] Unexpected error:", err);
    return { success: false, error: "Terjadi kesalahan: " + String(err?.message || err) };
  }
}

export async function toggleWishlistAction() {
  // TODO: Implement wishlist with database
  return { success: true, added: true };
}
