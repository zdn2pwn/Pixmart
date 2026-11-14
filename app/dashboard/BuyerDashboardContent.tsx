"use client";

import { useState } from "react";
import Link from "next/link";
import type { NegotiationWithDetails, EscrowRoomWithDetails, PublicListingItem } from "@/lib/types";
import { formatCurrency, formatXmr } from "@/lib/format";
import {
  ShieldCheck,
  MessageSquare,
  MapPin,
  Heart,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Calendar,
  AlertTriangle,
  Compass,
} from "lucide-react";

export function BuyerDashboardContent({
  session,
  negotiations,
  escrowRooms,
  wishlistListings,
  nearbyListings,
}: {
  session: any;
  negotiations: NegotiationWithDetails[];
  escrowRooms: EscrowRoomWithDetails[];
  wishlistListings: PublicListingItem[];
  nearbyListings: PublicListingItem[];
}) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "NEGOTIATIONS" | "ESCROW" | "WISHLIST" | "HISTORY">("OVERVIEW");

  const activeNegs = negotiations.filter((n) => n.status !== "DEAL_AGREED" && n.status !== "REJECTED");
  const activeEscrows = escrowRooms.filter((r) => r.meetingStatus !== "COMPLETED" && r.meetingStatus !== "CANCELLED");
  const completedEscrows = escrowRooms.filter((r) => r.meetingStatus === "COMPLETED");
  const upcomingMeetups = escrowRooms.filter((r) => r.meetingStatus === "MEETING_CONFIRMED");

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
            <span>BUYER HUB — LOCAL P2P TRANSACTIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Pembeli
          </h1>
          <p className="text-xs font-mono text-[#888] mt-1">
            Profil: <span className="text-[#39FF14] font-bold">{session?.name}</span> • ID: {session?.userId}
          </p>
        </div>

        <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 self-start sm:self-auto">
          + Cari Produk di Sekitar
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Negosiasi Aktif</div>
          <div className="text-2xl font-bold font-mono text-[#39FF14] mt-1">{activeNegs.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Penawaran berjalan</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Escrow COD Aktif</div>
          <div className="text-2xl font-bold font-mono text-[#FFB800] mt-1">{activeEscrows.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Koordinasi titik temu</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Jadwal Meetup</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{upcomingMeetups.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Titik temu disepakati</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Barang Wishlist</div>
          <div className="text-2xl font-bold font-mono text-[#FF3B30] mt-1">{wishlistListings.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Tersimpan</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#222] gap-1 overflow-x-auto font-mono text-xs">
        {[
          { key: "OVERVIEW", label: "Overview" },
          { key: "NEGOTIATIONS", label: `Negosiasi (${activeNegs.length})` },
          { key: "ESCROW", label: `Escrow COD (${activeEscrows.length})` },
          { key: "WISHLIST", label: `Wishlist (${wishlistListings.length})` },
          { key: "HISTORY", label: `Riwayat Selesai (${completedEscrows.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5"
                : "border-transparent text-[#888] hover:text-[#ccc]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Active Escrow Highlights */}
          {activeEscrows.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[#39FF14] font-bold uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={14} />
                <span>Transaksi Escrow COD yang Membutuhkan Perhatian</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEscrows.map((r) => (
                  <Link
                    key={r.id}
                    href={`/escrow/${r.id}`}
                    className="p-4 bg-[#141414] border border-[#333] hover:border-[#39FF14] transition-all block group"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-[#888] mb-1">
                      <span>Room #{r.id}</span>
                      <span className="text-[#39FF14] font-bold">{r.meetingStatus}</span>
                    </div>
                    <div className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                      {r.listing.title}
                    </div>
                    <div className="text-xs font-mono text-[#aaa] mt-2 flex items-center justify-between">
                      <span>Rp {r.finalPriceIdr.toLocaleString("id-ID")}</span>
                      <span className="text-[#39FF14] flex items-center gap-1 font-bold">
                        Buka Ruang COD →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Products Suggestion */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-[#888] font-bold uppercase tracking-wider flex items-center gap-2">
                <Compass size={14} className="text-[#39FF14]" />
                <span>Produk Terdekat dari Seller Lokal</span>
              </div>
              <Link href="/marketplace" className="text-xs font-mono text-[#39FF14] hover:underline">
                Lihat Semua ({nearbyListings.length})
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {nearbyListings.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className="bg-[#121212] border border-[#242424] hover:border-[#39FF14]/60 p-4 transition-all block group"
                >
                  <div className="aspect-[16/10] bg-[#181818] overflow-hidden mb-3 border border-[#222]">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#555]">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-[#39FF14] mb-1">{item.approxLocation}</div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#39FF14] line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="text-xs font-mono font-bold text-white mt-2">
                    Rp {item.fiatEstimateIdr.toLocaleString("id-ID")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: NEGOTIATIONS */}
      {activeTab === "NEGOTIATIONS" && (
        <div className="space-y-4">
          {activeNegs.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center text-xs text-[#888] font-mono">
              Tidak ada negosiasi yang sedang aktif.
            </div>
          ) : (
            activeNegs.map((neg) => (
              <Link
                key={neg.id}
                href={`/negotiations/${neg.id}`}
                className="bg-[#121212] border border-[#262626] hover:border-[#39FF14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 block group"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#888]">
                    Penjual: <span className="text-white font-bold">{neg.seller.codename}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#39FF14] mt-0.5">
                    {neg.listing.title}
                  </h4>
                  <div className="text-xs font-mono text-[#39FF14] mt-1">
                    Tawaran: Rp {neg.currentOfferPrice.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-warn text-xs font-bold py-1 px-2.5">
                    {neg.status.replace(/_/g, " ")}
                  </span>
                  <ArrowRight size={16} className="text-[#666] group-hover:text-[#39FF14]" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab 3: ESCROW COD */}
      {activeTab === "ESCROW" && (
        <div className="space-y-4">
          {activeEscrows.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center text-xs text-[#888] font-mono">
              Tidak ada Escrow Room aktif saat ini.
            </div>
          ) : (
            activeEscrows.map((r) => (
              <Link
                key={r.id}
                href={`/escrow/${r.id}`}
                className="bg-[#121212] border border-[#262626] hover:border-[#39FF14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 block group"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#888]">
                    Room #{r.id} • Penjual: <span className="text-white font-bold">{r.seller.codename}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#39FF14] mt-0.5">
                    {r.listing.title}
                  </h4>
                  <div className="text-xs font-mono text-[#aaa] mt-1 flex items-center gap-2">
                    <MapPin size={12} className="text-[#39FF14]" />
                    <span>
                      {r.meetingConfirmed?.locationName || r.meetingProposal?.locationName || "Titik temu belum ditentukan"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-warn text-xs font-bold py-1 px-2.5">
                    {r.meetingStatus.replace(/_/g, " ")}
                  </span>
                  <ArrowRight size={16} className="text-[#666] group-hover:text-[#39FF14]" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab 4: WISHLIST */}
      {activeTab === "WISHLIST" && (
        <div className="space-y-4">
          {wishlistListings.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center text-xs text-[#888] font-mono">
              Belum ada produk yang disimpan di wishlist Anda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className="bg-[#121212] border border-[#242424] hover:border-[#39FF14] p-4 block group"
                >
                  <div className="aspect-[16/10] bg-[#181818] overflow-hidden mb-3 border border-[#222]">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#555]">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#39FF14] line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="text-xs font-mono font-bold text-[#39FF14] mt-1">
                    Rp {item.fiatEstimateIdr.toLocaleString("id-ID")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          {completedEscrows.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center text-xs text-[#888] font-mono">
              Belum ada riwayat transaksi yang diselesaikan.
            </div>
          ) : (
            completedEscrows.map((r) => (
              <div
                key={r.id}
                className="bg-[#121212] border border-[#262626] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#888]">
                    Transaksi Selesai • Room #{r.id}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">{r.listing.title}</h4>
                  <div className="text-xs font-mono text-[#39FF14] mt-1">
                    Rp {r.finalPriceIdr.toLocaleString("id-ID")} ({formatXmr(r.cryptoAmount)})
                  </div>
                </div>
                <span className="badge-green text-xs font-bold py-1 px-3 self-start sm:self-auto">
                  ✓ COMPLETED
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
