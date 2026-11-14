"use server";

import { requireSession } from "@/lib/auth";
import { store } from "@/lib/store";
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

  const result = store.withdrawSellerBalance(session.userId, currency, amount, destinationAddress);
  if (!result.success) {
    return { success: false, error: result.error || "Gagal memproses penarikan saldo." };
  }

  revalidatePath("/seller");
  return {
    success: true,
    newBalance: result.newBalance,
    txHash: result.txHash,
    currency,
    amount,
  };
}

/**
 * Hapus listing barang dari marketplace
 */
export async function deleteListingAction(listingId: string) {
  const session = await requireSession();
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    return { success: false, error: "Hanya seller pemilik yang dapat menghapus barang ini." };
  }

  const ok = store.deleteListing(listingId, session.userId);
  if (!ok) {
    return { success: false, error: "Barang tidak ditemukan atau bukan milik Anda." };
  }

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

  const res = store.updateListing(listingId, session.userId, { status: newStatus as any });
  if (!res.success) {
    return { success: false, error: res.error || "Gagal memperbarui status produk." };
  }

  revalidatePath("/marketplace");
  revalidatePath("/seller");
  return { success: true, listing: res.listing };
}
