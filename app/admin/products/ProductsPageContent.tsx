"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ListingWithSeller, Session, ListingCategory } from "@/lib/types";
import { formatBtc, formatXmr, formatIdr, formatDateShort } from "@/lib/format";
import {
  Package,
  ShieldCheck,
  MapPin,
  ExternalLink,
  PlusCircle,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Coins,
} from "lucide-react";

interface ProductsPageContentProps {
  initialListings: ListingWithSeller[];
  session: Session;
}

export function ProductsPageContent({ initialListings, session }: ProductsPageContentProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return initialListings.filter((l) => {
      if (categoryFilter !== "ALL" && l.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.meetupZone.toLowerCase().includes(q) ||
          l.locationCity.toLowerCase().includes(q) ||
          l.seller.codename.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [initialListings, categoryFilter, statusFilter, searchQuery]);

  const activeCount = initialListings.filter((l) => l.status === "ACTIVE").length;
  const inEscrowCount = initialListings.filter((l) => l.status === "IN_ESCROW").length;
  const soldCount = initialListings.filter((l) => l.status === "SOLD").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-mono text-[#e8e8e8]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e1e1e] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 bg-[#39FF14] pulse-green inline-block" />
            <span
              className="text-[10px] uppercase tracking-widest text-[#39FF14] font-bold"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CATALOG // COMPLIANCE AUDIT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#e8e8e8]">
            Peer Listings &amp; Hardware Audit
          </h1>
          <p className="text-xs text-[#666] mt-1 font-sans">
            Seluruh barang peer-to-peer wajib memenuhi kebijakan 100% legalitas hardware. Dilarang keras mempublikasikan barang non-legal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/marketplace/new"
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            + Buat Listing Baru
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Total Listings Terdaftar</div>
          <div className="text-lg font-bold text-[#e8e8e8]">{initialListings.length} Unit</div>
          <div className="text-[10px] text-[#444] mt-0.5">Semua Kota di Indonesia</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#39FF14] uppercase tracking-wider mb-1">Listing Siap COD (Aktif)</div>
          <div className="text-lg font-bold text-[#39FF14]">{activeCount} Unit</div>
          <div className="text-[10px] text-[#666] mt-0.5">Siap Dikunci Escrow</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#FFB800] uppercase tracking-wider mb-1">Dalam Kuncian Escrow</div>
          <div className="text-lg font-bold text-[#FFB800]">{inEscrowCount} Unit</div>
          <div className="text-[10px] text-[#666] mt-0.5">Menunggu Ketemuan COD</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#39FF14] uppercase tracking-wider mb-1">Legalitas &amp; Kepatuhan</div>
          <div className="text-lg font-bold text-[#39FF14]">100% LEGAL</div>
          <div className="text-[10px] text-[#444] mt-0.5">Zero Contraband Policy</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111111] border border-[#1e1e1e]">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul hardware, area meetup, seller codename..."
            className="input-dark w-full pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-dark px-3 py-1.5 text-[11px] text-[#aaa]"
          >
            <option value="ALL">SEMUA KATEGORI</option>
            <option value="HARDWARE_GADGETS">HARDWARE GADGETS</option>
            <option value="RETRO_CONSOLES">RETRO CONSOLES</option>
            <option value="KEYBOARDS_TECH">KEYBOARDS TECH</option>
            <option value="CAMERAS_OPTICS">CAMERAS &amp; OPTICS</option>
            <option value="TIMEPIECES_WATCHES">TIMEPIECES WATCHES</option>
            <option value="COLLECTIBLES_EDC">COLLECTIBLES EDC</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-dark px-3 py-1.5 text-[11px] text-[#aaa]"
          >
            <option value="ALL">SEMUA STATUS</option>
            <option value="ACTIVE">AKTIF (SIAP COD)</option>
            <option value="IN_ESCROW">IN ESCROW</option>
            <option value="SOLD">SOLD / SETTLED</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#1e1e1e] bg-[#111111] text-[#666] uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Hardware Listing</th>
              <th className="py-3 px-4">Seller &amp; Kota</th>
              <th className="py-3 px-4">Meetup Zone (COD)</th>
              <th className="py-3 px-4">Harga Crypto &amp; Estimasi IDR</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181818]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#555]">
                  Tidak ada listing barang yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isActive = item.status === "ACTIVE";
                const isInEscrow = item.status === "IN_ESCROW";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#141414] transition-colors group"
                  >
                    {/* Item */}
                    <td className="py-3.5 px-4 align-top max-w-[280px]">
                      <div className="font-bold text-[#e8e8e8] group-hover:text-[#39FF14] transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#666] mt-0.5">
                        {item.category.replace(/_/g, " ")} • Kondisi: <span className="text-[#aaa]">{item.condition}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#39FF14] flex items-center gap-1 font-bold">
                          <ShieldCheck size={11} />
                          Legal Hardware Verified
                        </span>
                        <span className="text-[9px] text-[#555] flex items-center gap-1">
                          <Eye size={10} /> {item.views} views
                        </span>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-[#e8e8e8]">{item.seller.codename}</div>
                      <div className="text-[10px] text-[#39FF14] mt-0.5">{item.locationCity}</div>
                      <div className="text-[10px] text-[#555]">Rep: {item.seller.reputation}% ({item.seller.completedDeals} deals)</div>
                    </td>

                    {/* Meetup */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-1.5 text-[#ccc]">
                        <MapPin size={13} className="text-[#39FF14] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[11px] text-[#e8e8e8]">{item.meetupZone}</div>
                          <div className="text-[10px] text-[#555]">Zona Publik / Titik Temu</div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-0.5 font-bold">
                        <div className="text-[11px] flex items-center gap-1" style={{ color: "#F7931A" }}>
                          <span>BTC:</span> {formatBtc(item.priceBtc)}
                        </div>
                        <div className="text-[11px] flex items-center gap-1" style={{ color: "#FF6600" }}>
                          <span>XMR:</span> {formatXmr(item.priceXmr)}
                        </div>
                        <div className="text-[#555] text-[10px]">
                          ≈ {formatIdr(item.fiatEstimateIdr)}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-top text-center">
                      {isActive && (
                        <span className="badge-green text-[9px]">
                          SIAP COD
                        </span>
                      )}
                      {isInEscrow && (
                        <span className="badge-warn text-[9px]">
                          ESCROW LOCKED
                        </span>
                      )}
                      {item.status === "SOLD" && (
                        <span className="badge-muted text-[9px]">
                          TERJUAL (SETTLED)
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 align-middle text-right">
                      <Link
                        href={`/marketplace/${item.id}`}
                        className="btn-ghost text-[10px] px-2.5 py-1.5 inline-flex items-center gap-1"
                      >
                        Detail Listing →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
