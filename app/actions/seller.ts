"use server";

import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Tarik saldo payout Monero (XMR) atau Bitcoin (BTC) dari penjualan COD
 */
export async function withdrawSellerPayoutAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    return { success: false, error: "Hanya akun Seller yang dapat menarik saldo payout." };
  }

  const currency = (formData.get("currency") as "BTC" | "XMR") || "XMR";
  const amount = Number(formData.get("amount"));
  const destinationAddress = (formData.get("destinationAddress") as string)?.trim();

  if (!destinationAddress) {
    return { success: false, error: "Alamat wallet tujuan penarikan wajib diisi." };
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return { success: false, error: "Jumlah penarikan harus lebih dari 0." };
  }

  // TODO: Implement actual withdrawal logic with Supabase
  // For now, return placeholder
  console.log("[WithdrawPayout] TODO: Implement withdrawal", { currency, amount, destinationAddress });

  revalidatePath("/seller");
  return {
    success: true,
    newBalance: 0,
    txHash: "placeholder-tx-hash",
    currency,
    amount,
  };
}

/**
 * Hapus listing barang dari marketplace
 */
export async function deleteListingAction(listingId: string) {
  console.log("[deleteListingAction] START - listingId:", listingId);
  
  const session = await requireSession();
  console.log("[deleteListingAction] Session:", { userId: session.userId, role: session.role });
  
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    console.log("[deleteListingAction] REJECTED - Not seller/owner");
    return { success: false, error: "Hanya seller pemilik yang dapat menghapus barang ini." };
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();

  // Verify ownership
  console.log("[deleteListingAction] Fetching listing for ownership check...");
  const { data: listing, error: fetchError } = await supabase
    .from("marketplace_listings")
    .select("seller_id")
    .eq("id", listingId)
    .single();

  console.log("[deleteListingAction] Fetch result:", { listing, fetchError });

  if (fetchError) {
    console.error("[deleteListingAction] Fetch error:", fetchError);
    return { success: false, error: "Gagal memverifikasi listing: " + fetchError.message };
  }

  if (!listing) {
    console.log("[deleteListingAction] Listing not found");
    return { success: false, error: "Listing tidak ditemukan." };
  }

  if (listing.seller_id !== session.userId && session.role !== "OWNER") {
    console.log("[deleteListingAction] REJECTED - Not owner", { 
      listingSellerId: listing.seller_id, 
      sessionUserId: session.userId 
    });
    return { success: false, error: "Anda tidak memiliki hak untuk menghapus listing ini." };
  }

  // Delete from database
  console.log("[deleteListingAction] Deleting from database...");
  const { error: deleteError } = await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", listingId);

  if (deleteError) {
    console.error("[deleteListingAction] Delete error:", deleteError);
    return { success: false, error: "Gagal menghapus listing dari database: " + deleteError.message };
  }

  console.log("[deleteListingAction] SUCCESS - Listing deleted");
  revalidatePath("/marketplace");
  revalidatePath("/seller");
  return { success: true };
}

/**
 * Ubah status listing (ACTIVE / PAUSED / SOLD)
 */
export async function toggleListingStatusAction(listingId: string, newStatus: "ACTIVE" | "PAUSED" | "SOLD") {
  const session = await requireSession();
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    return { success: false, error: "Tidak memiliki hak akses." };
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();

  // Verify ownership
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { success: false, error: "Listing tidak ditemukan." };
  }

  if (listing.seller_id !== session.userId && session.role !== "OWNER") {
    return { success: false, error: "Anda tidak memiliki hak untuk mengubah listing ini." };
  }

  // Update status
  const { data: updated, error } = await supabase
    .from("marketplace_listings")
    .update({ status: newStatus })
    .eq("id", listingId)
    .select()
    .single();

  if (error) {
    console.error("[ToggleListingStatus] Error:", error);
    return { success: false, error: "Gagal memperbarui status produk." };
  }

  revalidatePath("/marketplace");
  revalidatePath("/seller");
  return { success: true, listing: updated };
}
