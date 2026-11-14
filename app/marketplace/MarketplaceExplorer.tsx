"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ListingWithSeller } from "@/lib/types";
import { formatBtc, formatXmr, formatCurrency } from "@/lib/format";
import { Search, MapPin, ArrowRight, Package } from "lucide-react";

const CATEGORIES = [
  { value: "ALL", label: "Semua Kategori" },
  { value: "HARDWARE_GADGETS", label: "Hardware & Gadget" },
  { value: "RETRO_CONSOLES", label: "Konsol Retro" },
  { value: "KEYBOARDS_TECH", label: "Keyboard Mekanikal" },
  { value: "CAMERAS_OPTICS", label: "Kamera & Optik" },
  { value: "TIMEPIECES_WATCHES", label: "Jam Tangan" },
  { value: "COLLECTIBLES_EDC", label: "Koleksi & EDC" },
];

const CITIES = [
  "ALL",
  "Jakarta Selatan",
  "Bandung",
  "Surabaya",
  "Jakarta Pusat",
  "Yogyakarta",
];

interface MarketplaceExplorerProps {
  initialListings: ListingWithSeller[];
  initialCity: string;
  initialCategory: string;
  initialSearch: string;
}

export function MarketplaceExplorer({
  initialListings,
  initialCity,
  initialCategory,
  initialSearch,
}: MarketplaceExplorerProps) {
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [currency, setCurrency] = useState<"BTC" | "XMR">("XMR");

  const filtered = useMemo(() => {
    return initialListings.filter((l) => {
      if (city !== "ALL" && l.locationCity !== city) return false;
      if (category !== "ALL" && l.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.meetupZone.toLowerCase().includes(q) ||
          l.seller.codename.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [initialListings, search, city, category]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header — Simple & Direct */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1c1c1c]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Katalog Hardware P2P
          </h1>
          <p className="text-sm text-[#777] mt-1">
            {filtered.length} barang tersedia untuk serah terima fisik (COD).
          </p>
        </div>

        <Link
          href="/marketplace/new"
          className="btn-primary text-xs font-bold px-4 py-2 self-start sm:self-auto"
        >
          + Pasang Iklan
        </Link>
      </div>

      {/* Filter Bar — Minimal & Functional */}
      <div className="bg-[#111111] border border-[#222222] p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari hardware, kota, seller..."
            className="input-dark w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        {/* Controls: City chips + Category + Currency */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* City Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CITIES.map((c) => {
              const active = city === c;
              return (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 text-xs font-mono transition-all border cursor-pointer ${
                    active
                      ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10 font-bold"
                      : "border-[#282828] text-[#777] hover:border-[#444] hover:text-[#ddd] bg-[#141414]"
                  }`}
                >
                  {c === "ALL" ? "Semua Kota" : c}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown & Currency Toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-dark text-xs py-1.5 px-3 bg-[#141414] border-[#2e2e2e] cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="flex items-center border border-[#2a2a2a] bg-[#141414] p-0.5">
              <button
                type="button"
                onClick={() => setCurrency("XMR")}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                  currency === "XMR"
                    ? "bg-[#FF6600] text-black"
                    : "text-[#777] hover:text-white"
                }`}
              >
                XMR
              </button>
              <button
                type="button"
                onClick={() => setCurrency("BTC")}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                  currency === "BTC"
                    ? "bg-[#F7931A] text-black"
                    : "text-[#777] hover:text-white"
                }`}
              >
                BTC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] py-16 text-center space-y-2">
          <div className="text-sm font-mono text-[#aaa]">Tidak ada barang yang cocok.</div>
          <button
            onClick={() => {
              setSearch("");
              setCity("ALL");
              setCategory("ALL");
            }}
            className="btn-ghost text-xs px-3.5 py-1.5 font-mono"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((listing) => {
            const hasImage = listing.images && listing.images.length > 0 && listing.images[0];
            const isBtc = currency === "BTC";

            return (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="group bg-[#111111] border border-[#222222] hover:border-[#39FF14] transition-all flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Photo */}
                <div className="relative aspect-[16/10] bg-[#161616] overflow-hidden border-b border-[#222222]">
                  {hasImage ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#151515]">
                      <Package size={32} className="text-[#444]" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5">
                    <span className="badge-muted text-[11px] bg-black/80">
                      {listing.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="badge-green text-[11px] bg-black/80">
                      {listing.condition}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors leading-snug line-clamp-2">
                      {listing.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#777]">
                      <span>{listing.seller.codename}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[#999]">
                        <MapPin size={11} className="text-[#39FF14]" /> {listing.locationCity}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2.5 border-t border-[#1c1c1c] flex items-end justify-between font-mono">
                    <div>
                      <div
                        className="text-base font-bold"
                        style={{ color: isBtc ? "#F7931A" : "#FF6600" }}
                      >
                        {isBtc ? formatBtc(listing.priceBtc) : formatXmr(listing.priceXmr)}
                      </div>
                      <div className="text-[11px] text-[#666]">
                        ≈ {formatCurrency(listing.fiatEstimateIdr)}
                      </div>
                    </div>

                    <span className="text-xs text-[#888] group-hover:text-[#39FF14] flex items-center gap-1 transition-colors">
                      <span>Detail</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
