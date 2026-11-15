"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { topUpBalanceAction } from "@/app/actions/auth";
import { withdrawSellerPayoutAction } from "@/app/actions/seller";
import { SellerListingCard } from "@/components/seller/SellerListingCard";
import { customAlert } from "@/components/ui/CustomAlert";
import {
  Package,
  Plus,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  MapPin,
  ExternalLink,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

export function SellerDashboardContentImproved({
  session,
  profile,
  myListings,
  negotiations,
  escrowRooms,
  completedEscrows,
}: {
  session: any;
  profile: { balance_btc: number; balance_xmr: number };
  myListings: any[];
  negotiations: any[];
  escrowRooms: any[];
  completedEscrows: any[];
}) {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "OFFERS" | "TRANSACTIONS">("PRODUCTS");
  const [isPending, startTransition] = useTransition();
  const [listingsList, setListingsList] = useState(myListings);

  // Wallet balance from profile
  const balanceBtc = profile.balance_btc || 0;
  const balanceXmr = profile.balance_xmr || 0;

  // Calculate total income from completed escrows
  const totalIncomeBtc = completedEscrows
    .filter((e: any) => e.crypto_type === "BTC")
    .reduce((sum: number, e: any) => sum + (e.agreed_price_btc || 0), 0);
  
  const totalIncomeXmr = completedEscrows
    .filter((e: any) => e.crypto_type === "XMR")
    .reduce((sum: number, e: any) => sum + (e.agreed_price_xmr || 0), 0);

  function handleListingDelete(listingId: string) {
    setListingsList((prev: any) => prev.filter((item: any) => item.id !== listingId));
  }

  function handleListingUpdate(listingId: string, data: any) {
    setListingsList((prev: any) =>
      prev.map((item: any) => (item.id === listingId ? { ...item, ...data } : item))
    );
  }

  const incomingOffers = (negotiations || []).filter(
    (n: any) => n.seller_id === session?.userId && n.status !== "REJECTED"
  );
  const activeEscrows = (escrowRooms || []).filter(
    (r: any) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  );
  const completedDeals = (escrowRooms || []).filter((r: any) => r.status === "COMPLETED");

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Seller</h1>
          <p className="text-sm text-[#888] mt-1">
            {session?.codename} • Reputasi: 99%
          </p>
        </div>

        <Link
          href="/marketplace/new"
          className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Pasang Iklan Baru</span>
        </Link>
      </div>

      {/* Wallet Balance - Simple */}
      <div className="bg-[#111] border border-[#262626] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-[#39FF14]" />
          <h3 className="text-sm font-bold text-white">Saldo & Pemasukan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bitcoin Balance */}
          <div className="bg-[#0a0a0a] border border-[#222] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#888]">BITCOIN (BTC)</span>
              <span className="text-xs text-[#666]">1 BTC ≈ Rp 1.4M</span>
            </div>
            <div className="text-2xl font-bold text-[#F7931A] mb-1">
              {balanceBtc.toFixed(8)} <span className="text-sm text-[#888]">BTC</span>
            </div>
            <div className="text-xs text-[#666] mb-3">
              ≈ Rp {(balanceBtc * 1400000000).toLocaleString("id-ID")}
            </div>
            <div className="flex gap-2">
              <Link
                href="/seller/withdraw?crypto=BTC"
                className="text-xs px-3 py-1.5 bg-[#39FF14] text-black font-bold hover:bg-[#32dd10] transition-colors flex items-center gap-1"
              >
                <ArrowUpRight size={12} />
                Tarik
              </Link>
            </div>
          </div>

          {/* Monero Balance */}
          <div className="bg-[#0a0a0a] border border-[#222] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#888]">MONERO (XMR)</span>
              <span className="text-xs text-[#666]">1 XMR ≈ Rp 3.5jt</span>
            </div>
            <div className="text-2xl font-bold text-[#FF6600] mb-1">
              {balanceXmr.toFixed(4)} <span className="text-sm text-[#888]">XMR</span>
            </div>
            <div className="text-xs text-[#666] mb-3">
              ≈ Rp {(balanceXmr * 3500000).toLocaleString("id-ID")}
            </div>
            <div className="flex gap-2">
              <Link
                href="/seller/withdraw?crypto=XMR"
                className="text-xs px-3 py-1.5 bg-[#39FF14] text-black font-bold hover:bg-[#32dd10] transition-colors flex items-center gap-1"
              >
                <ArrowUpRight size={12} />
                Tarik
              </Link>
            </div>
          </div>

          {/* Total Income */}
          <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-[#39FF14]" />
              <span className="text-xs text-[#39FF14] font-bold">TOTAL PEMASUKAN</span>
            </div>
            <div className="space-y-1 mb-3">
              <div className="text-lg font-bold text-white">
                {totalIncomeBtc.toFixed(8)} <span className="text-xs text-[#888]">BTC</span>
              </div>
              <div className="text-lg font-bold text-white">
                {totalIncomeXmr.toFixed(4)} <span className="text-xs text-[#888]">XMR</span>
              </div>
            </div>
            <div className="text-xs text-[#666]">
              Dari {completedEscrows.length} transaksi selesai
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-xs text-[#888] mb-1">Produk Aktif</div>
          <div className="text-2xl font-bold text-white">{listingsList.length}</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-xs text-[#888] mb-1">Tawaran Masuk</div>
          <div className="text-2xl font-bold text-[#39FF14]">{incomingOffers.length}</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-xs text-[#888] mb-1">Escrow Aktif</div>
          <div className="text-2xl font-bold text-[#FFB800]">{activeEscrows.length}</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-xs text-[#888] mb-1">Deal Selesai</div>
          <div className="text-2xl font-bold text-[#39FF14]">{completedDeals.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] gap-1 text-sm">
        {[
          { key: "PRODUCTS", label: `Katalog (${listingsList.length})` },
          { key: "OFFERS", label: `Tawaran (${incomingOffers.length})` },
          { key: "TRANSACTIONS", label: `Transaksi (${activeEscrows.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 font-medium transition-all border-b-2 ${
              activeTab === tab.key
                ? "border-[#39FF14] text-[#39FF14]"
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
          {listingsList.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center space-y-3">
              <Package size={36} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Belum ada barang yang didaftarkan.</div>
              <p className="text-sm text-[#888] max-w-md mx-auto">
                Pasang iklan produk lokal Anda untuk mulai menerima penawaran COD.
              </p>
              <Link href="/marketplace/new" className="btn-primary text-sm px-4 py-2 inline-block">
                + Pasang Iklan Pertama
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listingsList.map((l: any) => (
                <SellerListingCard
                  key={l.id}
                  listing={l}
                  onDelete={handleListingDelete}
                  onUpdate={handleListingUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: OFFERS - GROUPED BY BUYER */}
      {activeTab === "OFFERS" && (
        <div className="space-y-4">
          {incomingOffers.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center text-sm text-[#888]">
              Belum ada tawaran harga masuk dari pembeli.
            </div>
          ) : (
            (() => {
              // Group by buyer_id
              const grouped = incomingOffers.reduce((acc: any, neg: any) => {
                const buyerId = neg.buyer_id;
                if (!acc[buyerId]) {
                  acc[buyerId] = {
                    buyer: neg.buyer,
                    negotiations: [],
                    latestNego: neg,
                  };
                }
                acc[buyerId].negotiations.push(neg);
                // Keep the latest negotiation
                if (new Date(neg.created_at) > new Date(acc[buyerId].latestNego.created_at)) {
                  acc[buyerId].latestNego = neg;
                }
                return acc;
              }, {});

              return Object.values(grouped).map((group: any) => {
                const count = group.negotiations.length;
                const latest = group.latestNego;
                
                return (
                  <div
                    key={group.buyer.id}
                    className="bg-[#121212] border border-[#282828] hover:border-[#39FF14] p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-bold text-white">
                            {group.buyer?.codename || "Anonymous User"}
                          </div>
                          {count > 1 && (
                            <span className="bg-[#FF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                              {count}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#888]">
                          {count === 1 ? "1 produk" : `${count} produk dalam negosiasi`}
                        </div>
                      </div>
                    </div>

                    {/* Show latest negotiation details */}
                    <div className="bg-[#0a0a0a] border border-[#222] p-3 mb-3">
                      <div className="text-xs text-[#666] mb-1">Tawaran Terbaru:</div>
                      <h4 className="text-sm font-bold text-white mb-2">
                        {latest.listing?.title || "Produk"}
                      </h4>
                      <div className="text-sm space-y-0.5">
                        {latest.current_offer_btc && (
                          <div className="text-[#F7931A] font-bold">
                            {latest.current_offer_btc.toFixed(8)} BTC
                          </div>
                        )}
                        {latest.current_offer_xmr && (
                          <div className="text-[#FF6600] font-bold">
                            {latest.current_offer_xmr.toFixed(4)} XMR
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-[#666] mt-2">
                        {new Date(latest.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {count === 1 ? (
                        <Link
                          href={`/negotiations/${latest.id}`}
                          className="flex-1 bg-[#39FF14] hover:bg-[#2ECC11] text-black text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 transition-colors"
                        >
                          <MessageSquare size={14} />
                          <span>Buka Chat</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={`/negotiations/${latest.id}`}
                            className="flex-1 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14] text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 transition-colors"
                          >
                            <MessageSquare size={14} />
                            <span>Buka Terbaru</span>
                          </Link>
                          <Link
                            href={`/negotiations?buyer=${group.buyer.id}`}
                            className="flex-1 bg-[#333] hover:bg-[#444] text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 transition-colors"
                          >
                            <Package size={14} />
                            <span>Lihat Semua ({count})</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {/* Tab 3: TRANSACTIONS */}
      {activeTab === "TRANSACTIONS" && (
        <div className="space-y-4">
          {activeEscrows.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center text-sm text-[#888]">
              Tidak ada transaksi escrow COD aktif.
            </div>
          ) : (
            activeEscrows.map((r: any) => (
              <Link
                key={r.id}
                href={`/escrow/${r.id}`}
                className="bg-[#121212] border border-[#282828] hover:border-[#39FF14] p-4 flex items-center justify-between gap-4 block group"
              >
                <div>
                  <div className="text-xs text-[#888]">
                    Buyer: <span className="text-white font-bold">{r.buyer?.codename}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#39FF14] mt-0.5">
                    {r.listing?.title || r.item_title}
                  </h4>
                  <div className="text-sm text-[#39FF14] mt-1">
                    Rp {(r.final_price_idr || 0).toLocaleString("id-ID")}
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#666] group-hover:text-[#39FF14]" />
              </Link>
            ))
          )}
        </div>
      )}
    </main>
  );
}
