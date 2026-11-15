"use client";

import { useState, useTransition } from "react";
import { updateStockAction, toggleAvailabilityAction } from "@/app/actions/stock";
import { customAlert } from "@/components/ui/CustomAlert";
import { Package, Minus, Plus, Check, X } from "lucide-react";

interface StockManagerProps {
  listing: any;
  onUpdate?: (newStock: number) => void;
}

export function StockManager({ listing, onUpdate }: StockManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [stockValue, setStockValue] = useState(listing.stock || 0);
  const [isPending, startTransition] = useTransition();

  async function handleSave() {
    if (stockValue < 0) {
      customAlert.error("Stock tidak boleh negatif");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("listingId", listing.id);
      formData.append("stock", stockValue.toString());

      const result = await updateStockAction(formData);

      if (result.success) {
        customAlert.success(result.message || "Stock berhasil diupdate");
        setIsEditing(false);
        if (onUpdate) onUpdate(stockValue);
      } else {
        customAlert.error(result.error || "Gagal update stock");
      }
    });
  }

  async function handleToggleSoldOut() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("listingId", listing.id);

      const result = await toggleAvailabilityAction(formData);

      if (result.success) {
        customAlert.success(result.message || "Status berhasil diubah");
        setStockValue(result.newStock || 0);
        if (onUpdate) onUpdate(result.newStock || 0);
      } else {
        customAlert.error(result.error || "Gagal mengubah status");
      }
    });
  }

  const isSoldOut = stockValue === 0;

  return (
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <>
          {/* Stock Display */}
          <div className="flex items-center gap-2">
            <Package size={14} className={isSoldOut ? "text-[#FF4444]" : "text-[#39FF14]"} />
            <span className={`text-xs font-mono ${isSoldOut ? "text-[#FF4444]" : "text-white"}`}>
              {isSoldOut ? "SOLD OUT" : `Stock: ${stockValue}`}
            </span>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-[#666] hover:text-[#39FF14] transition-colors"
          >
            Edit
          </button>

          {/* Toggle Sold Out */}
          <button
            onClick={handleToggleSoldOut}
            disabled={isPending}
            className={`text-xs px-2 py-1 border transition-colors disabled:opacity-50 ${
              isSoldOut
                ? "border-[#39FF14]/50 text-[#39FF14] hover:bg-[#39FF14]/10"
                : "border-[#FF4444]/50 text-[#FF4444] hover:bg-[#FF4444]/10"
            }`}
            title={isSoldOut ? "Tandai tersedia" : "Tandai sold out"}
          >
            {isSoldOut ? "Tersedia" : "Sold Out"}
          </button>
        </>
      ) : (
        <>
          {/* Stock Editor */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStockValue(Math.max(0, stockValue - 1))}
              className="w-6 h-6 flex items-center justify-center bg-[#1a1a1a] border border-[#333] hover:border-[#39FF14] text-white transition-colors"
              disabled={isPending}
            >
              <Minus size={12} />
            </button>

            <input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 h-6 bg-[#0a0a0a] border border-[#333] text-white text-xs text-center font-mono focus:outline-none focus:border-[#39FF14]"
              min="0"
              disabled={isPending}
            />

            <button
              onClick={() => setStockValue(stockValue + 1)}
              className="w-6 h-6 flex items-center justify-center bg-[#1a1a1a] border border-[#333] hover:border-[#39FF14] text-white transition-colors"
              disabled={isPending}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Save/Cancel */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-6 h-6 flex items-center justify-center bg-[#39FF14] hover:bg-[#2ECC11] text-black transition-colors disabled:opacity-50"
              title="Simpan"
            >
              <Check size={14} />
            </button>

            <button
              onClick={() => {
                setStockValue(listing.stock || 0);
                setIsEditing(false);
              }}
              disabled={isPending}
              className="w-6 h-6 flex items-center justify-center bg-[#333] hover:bg-[#444] text-white transition-colors disabled:opacity-50"
              title="Batal"
            >
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
