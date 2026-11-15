"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StockManager } from "./StockManager";
import { deleteListingAction } from "@/app/actions/seller";
import { customAlert } from "@/components/ui/CustomAlert";
import {
  Package,
  MapPin,
  Trash2,
  ExternalLink,
  Edit,
} from "lucide-react";

interface SellerListingCardProps {
  listing: any;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
}

export function SellerListingCard({ listing, onDelete, onUpdate }: SellerListingCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    customAlert.confirm(
      "Yakin ingin menghapus listing ini? Buyer yang sedang nego akan diberitahu bahwa produk sudah tidak tersedia.",
      () => {
        startTransition(async () => {
          try {
            const res = await deleteListingAction(listing.id);

            if (res?.success) {
              // Hapus dari state lokal HANYA setelah server memastikan
              // baris listing benar-benar terhapus dari database.
              onDelete(listing.id);
              customAlert.success("Listing berhasil dihapus");
              router.refresh();
              return;
            }

            customAlert.error(res?.error || "Gagal menghapus listing");
          } catch (err: any) {
            // Redirect bukan berarti sukses. Ini biasanya terjadi saat sesi
            // sudah kedaluwarsa (diarahkan ke /login).
            if (err?.digest?.includes?.("NEXT_REDIRECT") || err?.message === "NEXT_REDIRECT") {
              customAlert.error("Sesi Anda berakhir. Silakan login kembali.");
              return;
            }

            console.error("[SellerListingCard] Delete exception:", err);
            customAlert.error("Terjadi kesalahan: " + String(err?.message || err));
          }
        });
      },
      "Hapus Listing?"
    );
  }

  function handleStockUpdate(newStock: number) {
    onUpdate(listing.id, { stock: newStock });
  }

  const hasImage = listing.images && listing.images.length > 0;

  return (
    <div className="bg-[#12101F] border border-[#3A3157] hover:border-[#C8FF4D]/50 p-4 transition-all">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-[#231D3A] border border-[#4A4168] shrink-0 overflow-hidden flex items-center justify-center">
          {hasImage ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={24} className="text-[#6F6788]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title & Location */}
          <div>
            <h3 className="text-sm font-bold text-cream truncate mb-1">{listing.title}</h3>
            <div className="flex items-center gap-3 text-xs text-[#A79EC2]">
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {listing.location_city}
              </span>
              <span>Rp {(listing.fiat_estimate_idr || 0).toLocaleString("id-ID")}</span>
              <span className={`px-2 py-0.5 text-xs font-bold ${
                listing.status === "ACTIVE"
                  ? "bg-[#C8FF4D]/10 text-[#C8FF4D]"
                  : "bg-[#8B82A6]/10 text-[#8B82A6]"
              }`}>
                {listing.status}
              </span>
            </div>
          </div>

          {/* STOCK MANAGER */}
          <div className="pt-2 border-t border-[#3A3157]">
            <StockManager
              listing={listing}
              onUpdate={handleStockUpdate}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#3A3157]">
            {/* Edit */}
            <Link
              href={`/marketplace/${listing.id}/edit`}
              className="text-xs px-3 py-1.5 border border-[#4A4168] hover:border-[#C8FF4D] text-[#A79EC2] hover:text-[#C8FF4D] transition-colors flex items-center gap-1"
              title="Edit listing"
            >
              <Edit size={12} />
              <span>Edit</span>
            </Link>

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isPending}
              className="text-xs px-3 py-1.5 border border-[#4A4168] hover:border-[#FF6B6B] text-[#A79EC2] hover:text-[#FF6B6B] transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              title="Hapus listing"
            >
              <Trash2 size={12} />
              <span>{isPending ? "Menghapus..." : "Hapus"}</span>
            </button>

            {/* View */}
            <Link
              href={`/marketplace/${listing.id}`}
              className="text-xs px-3 py-1.5 border border-[#4A4168] hover:border-white text-[#A79EC2] hover:text-cream transition-colors flex items-center gap-1"
              title="Lihat detail"
              target="_blank"
            >
              <ExternalLink size={12} />
              <span>Lihat</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
