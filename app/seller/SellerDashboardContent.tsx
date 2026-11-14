"use client";

import { useState } from "react";
import Link from "next/link";
import type { Listing, NegotiationWithDetails, EscrowRoomWithDetails } from "@/lib/types";
import { formatCurrency, formatXmr, formatBtc } from "@/lib/format";
import {
  Package,
  Plus,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export function SellerDashboardContent({
  session,
  myListings,
  negotiations,
  escrowRooms,
}: {
  session: any;
  myListings: Listing[];
  negotiations: NegotiationWithDetails[];
  escrowRooms: EscrowRoomWithDetails[];
}) {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "OFFERS" | "TRANSACTIONS">("PRODUCTS");

  const incomingOffers = negotiations.filter((n) => n.sellerId === session?.userId && n.status !== "REJECTED");
  const activeEscrows = escrowRooms.filter((r) => r.meetingStatus !== "COMPLETED" && r.meetingStatus !== "CANCELLED");
  const completedDeals = escrowRooms.filter((r) => r.meetingStatus === "COMPLETED");

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
            <span>SELLER CONTROL CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Penjual Lokal
          </h1>
          <p className="text-xs font-mono text-[#888] mt-1">
            Seller: <span className="text-[#39FF14] font-bold">{session?.name}</span> • Reputasi: 98%
          </p>
        </div>

        <Link
          href="/marketplace/new"
          className="btn-primary text-xs font-bold px-4 py-2.5 self-start sm:self-auto flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
        >
          <Plus size={15} />
          <span>+ Pasang Iklan Baru</span>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Produk Aktif</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{myListings.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Siap transaksi COD</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Tawaran Masuk</div>
          <div className="text-2xl font-bold font-mono text-[#39FF14] mt-1">{incomingOffers.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Perlu direspon</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Escrow COD Aktif</div>
          <div className="text-2xl font-bold font-mono text-[#FFB800] mt-1">{activeEscrows.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">Dalam koordinasi</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Deal Selesai</div>
          <div className="text-2xl font-bold font-mono text-[#39FF14] mt-1">{completedDeals.length}</div>
          <div className="text-[10px] font-mono text-[#666] mt-0.5">100% sukses</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] gap-1 overflow-x-auto font-mono text-xs">
        {[
          { key: "PRODUCTS", label: `Katalog Barang Saya (${myListings.length})` },
          { key: "OFFERS", label: `Tawaran Masuk (${incomingOffers.length})` },
          { key: "TRANSACTIONS", label: `Transaksi Escrow COD (${activeEscrows.length})` },
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

      {/* Tab 1: PRODUCTS */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center space-y-3 font-mono text-xs">
              <Package size={36} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Belum ada barang yang didaftarkan.</div>
              <Link href="/marketplace/new" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
                + Pasang Iklan Barang Pertama Anda
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myListings.map((l) => (
                <div
                  key={l.id}
                  className="bg-[#121212] border border-[#282828] p-4 flex gap-4 items-start"
                >
                  <div className="w-20 h-20 bg-[#181818] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
                    {l.images && l.images[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-[#555]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#39FF14] uppercase">
                        {l.status}
                      </span>
                      <span className="text-[10px] font-mono text-[#888]">{l.locationCity}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{l.title}</h4>
                    <div className="text-xs font-mono font-bold text-white">
                      Rp {l.fiatEstimateIdr.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] font-mono text-[#666] flex items-center gap-1">
                      <MapPin size={10} />
                      <span className="truncate">{l.locationDistrict}, {l.locationCity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: OFFERS */}
      {activeTab === "OFFERS" && (
        <div className="space-y-4">
          {incomingOffers.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center font-mono text-xs text-[#888]">
              Belum ada tawaran harga masuk dari pembeli.
            </div>
          ) : (
            incomingOffers.map((neg) => (
              <Link
                key={neg.id}
                href={`/negotiations/${neg.id}`}
                className="bg-[#121212] border border-[#282828] hover:border-[#39FF14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 block group"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#888]">
                    Dari: <span className="text-white font-bold">{neg.buyer.codename}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#39FF14] mt-0.5">
                    {neg.listing.title}
                  </h4>
                  <div className="text-xs font-mono text-[#39FF14] mt-1">
                    Tawaran: Rp {neg.currentOfferPrice.toLocaleString("id-ID")}{" "}
                    <span className="text-[#666]">(Harga Katalog: Rp {neg.listing.fiatEstimateIdr.toLocaleString("id-ID")})</span>
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

      {/* Tab 3: TRANSACTIONS */}
      {activeTab === "TRANSACTIONS" && (
        <div className="space-y-4">
          {activeEscrows.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center font-mono text-xs text-[#888]">
              Tidak ada transaksi escrow COD aktif.
            </div>
          ) : (
            activeEscrows.map((r) => (
              <Link
                key={r.id}
                href={`/escrow/${r.id}`}
                className="bg-[#121212] border border-[#282828] hover:border-[#39FF14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 block group"
              >
                <div>
                  <div className="text-[11px] font-mono text-[#888]">
                    Room #{r.id} • Pembeli: <span className="text-white font-bold">{r.buyer.codename}</span>
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
    </main>
  );
}
