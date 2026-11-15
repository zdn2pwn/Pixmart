"use client";

import { useTransition } from "react";
import Link from "next/link";
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
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    console.log("[SellerListingCard] Delete clicked for:", listing.id);
    
    customAlert.confirm(
      "Yakin ingin menghapus listing ini? Buyer yang sedang nego akan diberitahu bahwa produk sudah tidak tersedia.",
      async () => {
        console.log("[SellerListingCard] Delete confirmed");
        startTransition(async () => {
          try {
            console.log("[SellerListingCard] Calling deleteListingAction...");
            const res = await deleteListingAction(listing.id);
            console.log("[SellerListingCard] Delete result:", res);
            
            if (res.success) {
              console.log("[SellerListingCard] Delete SUCCESS, calling onDelete");
              onDelete(listing.id);
              customAlert.success("Listing berhasil dihapus");
            } else {
              console.error("[SellerListingCard] Delete FAILED:", res.error);
              customAlert.error(res.error || "Gagal menghapus listing");
            }
          } catch (err) {
            console.error("[SellerListingCard] Delete EXCEPTION:", err);
            customAlert.error("Terjadi kesalahan saat menghapus listing: " + String(err));
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
    <div className="bg-[#121212] border border-[#262626] hover:border-[#39FF14]/50 p-4 transition-all">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-[#1a1a1a] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
          {hasImage ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={24} className="text-[#555]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title & Location */}
          <div>
            <h3 className="text-sm font-bold text-white truncate mb-1">{listing.title}</h3>
            <div className="flex items-center gap-3 text-xs text-[#888]">
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {listing.location_city}
              </span>
              <span>Rp {(listing.fiat_estimate_idr || 0).toLocaleString("id-ID")}</span>
              <span className={`px-2 py-0.5 text-xs font-bold ${
                listing.status === "ACTIVE" 
                  ? "bg-[#39FF14]/10 text-[#39FF14]" 
                  : "bg-[#666]/10 text-[#666]"
              }`}>
                {listing.status}
              </span>
            </div>
          </div>

          {/* STOCK MANAGER */}
          <div className="pt-2 border-t border-[#222]">
            <StockManager 
              listing={listing} 
              onUpdate={handleStockUpdate} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#222]">
            {/* Edit */}
            <Link
              href={`/marketplace/${listing.id}/edit`}
              className="text-xs px-3 py-1.5 border border-[#333] hover:border-[#39FF14] text-[#888] hover:text-[#39FF14] transition-colors flex items-center gap-1"
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
                console.log("[DEBUG] Delete button clicked!");
                handleDelete();
              }}
              disabled={isPending}
              className="text-xs px-3 py-1.5 border border-[#333] hover:border-[#FF4444] text-[#888] hover:text-[#FF4444] transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              title="Hapus listing"
            >
              <Trash2 size={12} />
              <span>Hapus</span>
            </button>

            {/* View */}
            <Link
              href={`/marketplace/${listing.id}`}
              className="text-xs px-3 py-1.5 border border-[#333] hover:border-white text-[#888] hover:text-white transition-colors flex items-center gap-1"
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
