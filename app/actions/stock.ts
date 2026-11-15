"use server";

import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update stock for a listing
 */
export async function updateStockAction(formData: FormData) {
  const session = await requireSimpleSession();
  
  if (session.role !== "SELLER") {
    return { success: false, error: "Hanya seller yang dapat mengubah stock" };
  }

  const supabase = await createSupabaseServerClient();
  const listingId = formData.get("listingId") as string;
  const stock = parseInt(formData.get("stock") as string);

  if (!listingId) {
    return { success: false, error: "Listing ID diperlukan" };
  }

  if (isNaN(stock) || stock < 0) {
    return { success: false, error: "Stock harus angka positif" };
  }

  // Verify ownership
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("seller_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.seller_id !== session.userId) {
    return { success: false, error: "Anda tidak memiliki akses ke listing ini" };
  }

  // Update stock
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ 
      stock: stock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    console.error("[UpdateStock] Error:", error);
    return { success: false, error: "Gagal mengupdate stock" };
  }

  revalidatePath("/seller");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  
  return { success: true, message: `Stock berhasil diupdate menjadi ${stock}` };
}

/**
 * Toggle listing availability (mark as sold out or available)
 */
export async function toggleAvailabilityAction(formData: FormData) {
  const session = await requireSimpleSession();
  
  if (session.role !== "SELLER") {
    return { success: false, error: "Hanya seller yang dapat mengubah availability" };
  }

  const supabase = await createSupabaseServerClient();
  const listingId = formData.get("listingId") as string;

  if (!listingId) {
    return { success: false, error: "Listing ID diperlukan" };
  }

  // Verify ownership
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("seller_id, stock")
    .eq("id", listingId)
    .single();

  if (!listing || listing.seller_id !== session.userId) {
    return { success: false, error: "Anda tidak memiliki akses ke listing ini" };
  }

  // Toggle: if stock > 0, set to 0 (sold out), else set to 1 (available)
  const newStock = listing.stock > 0 ? 0 : 1;

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ 
      stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    console.error("[ToggleAvailability] Error:", error);
    return { success: false, error: "Gagal mengubah availability" };
  }

  revalidatePath("/seller");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  
  return { 
    success: true, 
    message: newStock > 0 ? "Produk kembali tersedia" : "Produk ditandai SOLD OUT",
    newStock 
  };
}

/**
 * Decrease stock after successful transaction
 */
export async function decreaseStockAction(listingId: string, quantity: number = 1) {
  const supabase = await createSupabaseServerClient();

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("stock")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { success: false, error: "Listing tidak ditemukan" };
  }

  const newStock = Math.max(0, listing.stock - quantity);

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ 
      stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    console.error("[DecreaseStock] Error:", error);
    return { success: false, error: "Gagal mengurangi stock" };
  }

  revalidatePath("/seller");
  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  
  return { success: true, newStock };
}
