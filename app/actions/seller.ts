"use server";

import { revalidatePath } from "next/cache";
import { requireSimpleSession } from "./auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Hapus listing barang dari marketplace
 */
export async function deleteListingAction(listingId: string) {
  if (!listingId) {
    return { success: false, error: "ID listing tidak valid." };
  }

  const session = await requireSimpleSession();

  if (session.role !== "SELLER" && session.role !== "OWNER") {
    return { success: false, error: "Hanya seller pemilik yang dapat menghapus barang ini." };
  }

  const supabase = await createSupabaseServerClient();

  // Verify ownership
  const { data: listing, error: fetchError } = await supabase
    .from("marketplace_listings")
    .select("id, seller_id, title")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError) {
    console.error("[DeleteListing] Fetch error:", fetchError);
    return { success: false, error: "Gagal memverifikasi listing: " + fetchError.message };
  }

  if (!listing) {
    return { success: false, error: "Listing tidak ditemukan atau sudah dihapus." };
  }

  if (listing.seller_id !== session.userId && session.role !== "OWNER") {
    return { success: false, error: "Anda tidak memiliki hak untuk menghapus listing ini." };
  }

  // Delete from database and return the deleted row so we can verify that
  // the delete really happened (instead of being silently blocked by RLS).
  const { data: deleted, error: deleteError } = await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", listingId)
    .select("id");

  if (deleteError) {
    console.error("[DeleteListing] Delete error:", deleteError);
    return { success: false, error: "Gagal menghapus listing: " + deleteError.message };
  }

  if (!deleted || deleted.length === 0) {
    console.error("[DeleteListing] No rows deleted for listing:", listingId);
    return {
      success: false,
      error: "Listing gagal dihapus. Pastikan Anda masih login sebagai pemilik listing.",
    };
  }

  revalidatePath("/marketplace");
  revalidatePath("/seller");
  revalidatePath(`/marketplace/${listingId}`);

  return { success: true };
}

/**
 * Ubah status listing.
 * Catatan: constraint database hanya mengizinkan ACTIVE, SOLD, dan CANCELLED.
 */
export async function toggleListingStatusAction(
  listingId: string,
  newStatus: "ACTIVE" | "SOLD" | "CANCELLED"
) {
  if (!listingId) {
    return { success: false, error: "ID listing tidak valid." };
  }

  if (!["ACTIVE", "SOLD", "CANCELLED"].includes(newStatus)) {
    return { success: false, error: "Status listing tidak valid." };
  }

  const session = await requireSimpleSession();
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    return { success: false, error: "Tidak memiliki hak akses." };
  }

  const supabase = await createSupabaseServerClient();

  // Verify ownership
  const { data: listing, error: fetchError } = await supabase
    .from("marketplace_listings")
    .select("seller_id")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError) {
    console.error("[ToggleListingStatus] Fetch error:", fetchError);
    return { success: false, error: "Gagal memverifikasi listing." };
  }

  if (!listing) {
    return { success: false, error: "Listing tidak ditemukan." };
  }

  if (listing.seller_id !== session.userId && session.role !== "OWNER") {
    return { success: false, error: "Anda tidak memiliki hak untuk mengubah listing ini." };
  }

  const { data: updated, error } = await supabase
    .from("marketplace_listings")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("[ToggleListingStatus] Error:", error);
    return { success: false, error: "Gagal memperbarui status produk: " + error.message };
  }

  if (!updated) {
    return { success: false, error: "Status produk gagal diperbarui." };
  }

  revalidatePath("/marketplace");
  revalidatePath("/seller");
  revalidatePath(`/marketplace/${listingId}`);
  return { success: true, listing: updated };
}
