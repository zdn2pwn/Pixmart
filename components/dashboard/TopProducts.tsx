"use client";

import React from "react";
import { formatCurrency } from "@/lib/format";

interface TopProductItem {
  product: { name: string; sku: string };
  unitsSold: number;
  revenue: number;
}

interface TopProductsProps {
  topProducts: TopProductItem[];
}

const RANK_COLORS = ["#f59e0b", "#9ca3af", "#b45309"];

export default function TopProducts({ topProducts }: TopProductsProps) {
  return (
    <div
      className="rounded-lg border flex flex-col"
      style={{ background: "#161616", borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#2a2a2a" }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace", color: "#555" }}
          >
            LEADERBOARD
          </span>
          <span className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>
            Top Produk Hari Ini
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col divide-y" style={{ borderColor: "#2a2a2a" }}>
        {topProducts.length === 0 && (
          <div
            className="px-4 py-8 text-center text-xs font-mono"
            style={{ color: "#555" }}
          >
            NO DATA YET
          </div>
        )}
        {topProducts.map((item, idx) => {
          const rank = String(idx + 1).padStart(2, "0");
          const rankColor = RANK_COLORS[idx] ?? "#555";
          return (
            <div
              key={item.product.sku}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderColor: "#2a2a2a" }}
            >
              {/* Rank */}
              <span
                className="font-mono font-bold text-sm w-7 flex-shrink-0"
                style={{ color: rankColor }}
              >
                #{rank}
              </span>

              {/* Product info */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "#f0f0f0" }}
                >
                  {item.product.name}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: "#555" }}
                >
                  {item.product.sku}
                </span>
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: "#22c55e" }}
                >
                  {formatCurrency(item.revenue)}
                </span>
                <span className="text-xs font-mono" style={{ color: "#888" }}>
                  {item.unitsSold} unit
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
