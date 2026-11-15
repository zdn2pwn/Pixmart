"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { NegotiationWithDetails, EscrowRoomWithDetails, PublicListingItem } from "@/lib/types";
import { formatCurrency, formatXmr, formatBtc } from "@/lib/format";
import { topUpBalanceAction } from "@/app/actions/auth";
import {
  ShieldCheck,
  MessageSquare,
  MapPin,
  Heart,
  CheckCircle2,
  Package,
  Wallet,
  Copy,
  Check,
  PlusCircle,
  Loader2,
} from "lucide-react";

export function BuyerDashboardContent({
  session,
  profile,
  negotiations,
  escrowRooms,
  completedEscrows,
  wishlistListings,
}: {
  session: any;
  profile: {
    balance_btc?: number | null;
    balance_xmr?: number | null;
    wallet_btc?: string | null;
    wallet_xmr?: string | null;
    deposit_address_btc?: string | null;
    deposit_address_xmr?: string | null;
    location_city?: string | null;
  };
  negotiations: NegotiationWithDetails[];
  escrowRooms: EscrowRoomWithDetails[];
  completedEscrows: EscrowRoomWithDetails[];
  wishlistListings: PublicListingItem[];
}) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "WALLET" | "NEGOTIATIONS" | "ESCROW" | "WISHLIST" | "HISTORY">("OVERVIEW");

  // Local state for dynamic balances
  const [balanceXmr, setBalanceXmr] = useState<number>(Number(profile?.balance_xmr) || 0);
  const [balanceBtc, setBalanceBtc] = useState<number>(Number(profile?.balance_btc) || 0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customToast, setCustomToast] = useState<{ msg: string; type: "SUCCESS" | "INFO" } | null>(null);
  const [isPendingTopUp, startTopUp] = useTransition();

  const activeNegs = (negotiations || []).filter(
    (n) => n.status === "PENDING" || n.status === "COUNTER_OFFER"
  );
  const activeEscrows = escrowRooms || [];
  const upcomingMeetups = (escrowRooms || []).filter(
    (r) => Boolean((r as any).meeting_accepted) && !(r as any).completed_at
  );

  function copyToClipboard(text: string, keyName: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast(`Alamat dompet ${keyName} berhasil disalin!`, "SUCCESS");
    setTimeout(() => setCopiedKey(null), 2500);
  }

  function showToast(msg: string, type: "SUCCESS" | "INFO" = "SUCCESS") {
    setCustomToast({ msg, type });
    setTimeout(() => setCustomToast(null), 3500);
  }

  function getEscrowTitle(room: any) {
    return (
      room.listing?.title ||
      room.negotiation?.listing?.title ||
      room.item_title ||
      "Produk"
    );
  }

  function getEscrowPriceIdr(room: any) {
    return room.agreed_price_idr || room.finalPriceIdr || 0;
  }

  function getOfferLabel(negotiation: any) {
    if (negotiation.current_offer_btc) return formatBtc(negotiation.current_offer_btc);
    if (negotiation.current_offer_xmr) return formatXmr(negotiation.current_offer_xmr);
    return "Belum ada tawaran";
  }

  function handleTopUp(currency: "BTC" | "XMR", amount: number) {
    startTopUp(async () => {
      const res = await topUpBalanceAction(currency, amount);
      if (res.success && res.newBalance !== undefined) {
        if (currency === "BTC") {
          setBalanceBtc(res.newBalance);
        } else {
          setBalanceXmr(res.newBalance);
        }
        showToast(`Berhasil top up +${amount} ${currency}! Saldo siap untuk transaksi escrow.`, "SUCCESS");
      }
    });
  }

  const depositBtc = profile?.deposit_address_btc || "";
  const depositXmr = profile?.deposit_address_xmr || "";

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Custom Toast Alert Notification (No Native Browser Alert!) */}
      {customToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#39FF14] text-white p-4 max-w-md shadow-[0_0_25px_rgba(57,255,20,0.3)] flex items-center gap-3 font-mono text-xs animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 size={18} className="text-[#39FF14] shrink-0" />
          <span className="flex-1">{customToast.msg}</span>
          <button
            onClick={() => setCustomToast(null)}
            className="text-[#666] hover:text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
            <span>BUYER HUB // ANONYMOUS P2P WALLET &amp; ESCROW</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Pembeli
          </h1>
          <p className="text-xs font-mono text-[#888] mt-1">
            Identitas Anonim: <span className="text-[#39FF14] font-bold">{session?.codename}</span> • Wilayah: {profile?.location_city || "Jakarta"}
          </p>
        </div>

        <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 self-start sm:self-auto">
          + Cari Produk di Sekitar
        </Link>
      </div>

      {/* WALLET & SALDO CRYPTO SECTION (MONERO & BITCOIN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monero (XMR) Card - Primary Currency */}
        <div className="bg-[#121212] border border-[#FF6600]/40 p-5 space-y-4 relative overflow-hidden shadow-[0_0_20px_rgba(255,102,0,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6600]" />
              <span className="text-xs font-mono text-[#FF6600] font-bold uppercase tracking-wider">
                MONERO (XMR) // UTAMA
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/30 px-2 py-0.5">
              STEALTH RING
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {balanceXmr.toFixed(4)} <span className="text-[#FF6600]">XMR</span>
            </div>
            <div className="text-xs font-mono text-[#888] mt-0.5">
              ≈ {formatCurrency(balanceXmr * 2100000)} (Estimasi IDR)
            </div>
          </div>

          {/* Deposit Address Box */}
          <div className="bg-[#181818] border border-[#262626] p-2.5 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[10px] text-[#777]">
              <span>ALAMAT DEPOSIT XMR KAMU:</span>
              <button
                onClick={() => copyToClipboard(depositXmr, "Monero (XMR)")}
                className="text-[#39FF14] hover:underline flex items-center gap-1"
              >
                {copiedKey === "Monero (XMR)" ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedKey === "Monero (XMR)" ? "Tersalin!" : "Salin"}</span>
              </button>
            </div>
            <div className="text-[11px] text-[#ccc] truncate select-all">{depositXmr || "Belum tersedia"}</div>
          </div>

          {/* Faucet Top Up Button */}
          <button
            onClick={() => handleTopUp("XMR", 1.0)}
            disabled={isPendingTopUp}
            className="w-full py-2 bg-[#1c1410] hover:bg-[#281c16] border border-[#FF6600]/40 hover:border-[#FF6600] text-[#FF6600] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPendingTopUp ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <PlusCircle size={13} />
            )}
            <span>+ TOP UP SALDO SIMULASI (+1.0 XMR)</span>
          </button>
        </div>

        {/* Bitcoin (BTC) Card - Secondary Currency */}
        <div className="bg-[#121212] border border-[#F7931A]/40 p-5 space-y-4 relative overflow-hidden shadow-[0_0_20px_rgba(247,147,26,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F7931A]" />
              <span className="text-xs font-mono text-[#F7931A] font-bold uppercase tracking-wider">
                BITCOIN (BTC) // MULTISIG
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/30 px-2 py-0.5">
              SEGWIT BECH32
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {balanceBtc.toFixed(6)} <span className="text-[#F7931A]">BTC</span>
            </div>
            <div className="text-xs font-mono text-[#888] mt-0.5">
              ≈ {formatCurrency(balanceBtc * 1400000000)} (Estimasi IDR)
            </div>
          </div>

          {/* Deposit Address Box */}
          <div className="bg-[#181818] border border-[#262626] p-2.5 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[10px] text-[#777]">
              <span>ALAMAT DEPOSIT BTC KAMU:</span>
              <button
                onClick={() => copyToClipboard(depositBtc, "Bitcoin (BTC)")}
                className="text-[#39FF14] hover:underline flex items-center gap-1"
              >
                {copiedKey === "Bitcoin (BTC)" ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedKey === "Bitcoin (BTC)" ? "Tersalin!" : "Salin"}</span>
              </button>
            </div>
            <div className="text-[11px] text-[#ccc] truncate select-all">{depositBtc || "Belum tersedia"}</div>
          </div>

          {/* Faucet Top Up Button */}
          <button
            onClick={() => handleTopUp("BTC", 0.01)}
            disabled={isPendingTopUp}
            className="w-full py-2 bg-[#181510] hover:bg-[#252015] border border-[#F7931A]/40 hover:border-[#F7931A] text-[#F7931A] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPendingTopUp ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <PlusCircle size={13} />
            )}
            <span>+ TOP UP SALDO SIMULASI (+0.01 BTC)</span>
          </button>
        </div>
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
          { key: "WALLET", label: "Crypto Wallet" },
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

      {/* Tab: WALLET DETAIL */}
      {activeTab === "WALLET" && (
        <div className="bg-[#111] border border-[#222] p-6 space-y-6 font-mono">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet size={16} className="text-[#39FF14]" />
              <span>Detail Dompet &amp; Saldo Transaksi</span>
            </h2>
            <p className="text-xs text-[#888]">
              Alamat dompet pribadi kamu yang terhubung saat pendaftaran biodata:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161616] border border-[#262626] p-4 space-y-2">
              <div className="text-xs font-bold text-[#FF6600]">Dompet Monero (XMR) Terdaftar:</div>
              <div className="text-xs text-[#ccc] break-all bg-[#111] p-2.5 border border-[#222]">
                {profile?.wallet_xmr || "Belum diisi saat pendaftaran"}
              </div>
            </div>

            <div className="bg-[#161616] border border-[#262626] p-4 space-y-2">
              <div className="text-xs font-bold text-[#F7931A]">Dompet Bitcoin (BTC) Terdaftar:</div>
              <div className="text-xs text-[#ccc] break-all bg-[#111] p-2.5 border border-[#222]">
                {profile?.wallet_btc || "Belum diisi saat pendaftaran"}
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <span className="text-[#39FF14] font-bold">{r.status || "ACTIVE"}</span>
                    </div>
                    <div className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                      {getEscrowTitle(r)}
                    </div>
                    <div className="text-xs font-mono text-[#aaa] mt-2 flex items-center justify-between">
                      <span>Rp {getEscrowPriceIdr(r).toLocaleString("id-ID")}</span>
                      <span className="text-[#39FF14] flex items-center gap-1 font-bold">
                        Buka Ruang COD →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Negotiations Highlights */}
          {activeNegs.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[#39FF14] font-bold uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} />
                <span>Negosiasi Aktif Berjalan</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeNegs.map((n) => (
                  <Link
                    key={n.id}
                    href={`/negotiations/${n.id}`}
                    className="p-4 bg-[#141414] border border-[#333] hover:border-[#39FF14] transition-all block group"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-[#888] mb-1">
                      <span>Status: {n.status || "OPEN"}</span>
                      <span className="text-[#FFB800] font-bold">
                        {getOfferLabel(n)}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                      {n.listing?.title || "Produk"}
                    </div>
                    <div className="text-xs font-mono text-[#39FF14] mt-2 text-right">
                      Buka Ephemeral Chat →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Wishlist Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-[#888] font-bold uppercase tracking-wider flex items-center gap-2">
                <Heart size={14} className="text-[#FF3B30]" />
                <span>Barang Wishlist Kamu</span>
              </div>
              <button
                onClick={() => setActiveTab("WISHLIST")}
                className="text-xs font-mono text-[#39FF14] hover:underline cursor-pointer"
              >
                Lihat Semua ({wishlistListings.length}) →
              </button>
            </div>

            {wishlistListings.length === 0 ? (
              <div className="p-8 bg-[#111] border border-[#222] text-center space-y-2">
                <p className="text-xs font-mono text-[#666]">Belum ada produk yang kamu simpan ke wishlist.</p>
                <Link href="/marketplace" className="text-xs font-mono text-[#39FF14] hover:underline inline-block">
                  Jelajahi Katalog Lokal →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistListings.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/marketplace/${item.id}`}
                    className="p-3 bg-[#111] border border-[#222] hover:border-[#39FF14] transition-colors flex gap-3 group"
                  >
                    <div className="w-16 h-16 bg-[#181818] shrink-0 border border-[#262626] overflow-hidden flex items-center justify-center">
                      {item.images && item.images[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-[#444]" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-xs font-mono text-[#39FF14]">
                        Rp {Number(item.fiatEstimateIdr).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] font-mono text-[#777] flex items-center gap-1">
                        <MapPin size={10} />
                        <span>{item.locationDistrict}, {item.locationCity}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: NEGOTIATIONS */}
      {activeTab === "NEGOTIATIONS" && (
        <div className="space-y-4">
          {negotiations.length === 0 ? (
            <div className="p-12 bg-[#111] border border-[#222] text-center space-y-3 font-mono text-xs">
              <MessageSquare size={32} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Belum Ada Riwayat Negosiasi</div>
              <p className="text-[#777]">Buka katalog produk dan klik &apos;Ajukan Penawaran&apos; untuk mulai menawar.</p>
              <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
                Lihat Katalog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {negotiations.map((n) => (
                <div key={n.id} className="p-4 bg-[#121212] border border-[#262626] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">{n.listing?.title || "Produk"}</div>
                    <div className="text-xs font-mono text-[#888] mt-1">
                      Penjual: {n.seller?.codename || "Unknown"} • Tawaran Terakhir: {getOfferLabel(n)}
                    </div>
                  </div>
                  <Link href={`/negotiations/${n.id}`} className="btn-ghost text-xs font-bold px-3 py-1.5 shrink-0">
                    Buka Chat →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ESCROW COD */}
      {activeTab === "ESCROW" && (
        <div className="space-y-4">
          {escrowRooms.length === 0 ? (
            <div className="p-12 bg-[#111] border border-[#222] text-center space-y-3 font-mono text-xs">
              <ShieldCheck size={32} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Belum Ada Transaksi Escrow Aktif</div>
              <p className="text-[#777]">Escrow Room otomatis dibuat setelah penjual dan pembeli sepakat harga.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {escrowRooms.map((r) => (
                <div key={r.id} className="p-4 bg-[#121212] border border-[#262626] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-[#39FF14] font-bold">Room #{r.id} • {r.status || "ACTIVE"}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{getEscrowTitle(r)}</div>
                    <div className="text-xs font-mono text-[#888] mt-1">
                      Harga COD: Rp {getEscrowPriceIdr(r).toLocaleString("id-ID")} ({(r as any).agreed_price_btc || r.cryptoAmount || 0} {(r as any).crypto_type || r.cryptoCurrency || "BTC"})
                    </div>
                  </div>
                  <Link href={`/escrow/${r.id}`} className="btn-primary text-xs font-bold px-4 py-2 shrink-0">
                    Buka Room COD →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: WISHLIST */}
      {activeTab === "WISHLIST" && (
        <div className="space-y-4">
          {wishlistListings.length === 0 ? (
            <div className="p-12 bg-[#111] border border-[#222] text-center space-y-3 font-mono text-xs">
              <Heart size={32} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Wishlist Kamu Kosong</div>
              <p className="text-[#777]">Klik tombol love pada produk di katalog untuk menyimpannya di sini.</p>
              <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
                Jelajahi Produk
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className="bg-[#121212] border border-[#262626] hover:border-[#39FF14] transition-all p-4 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="aspect-[16/10] bg-[#181818] overflow-hidden flex items-center justify-center">
                      {item.images && item.images[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={32} className="text-[#444]" />
                      )}
                    </div>
                    <div className="text-xs font-mono text-[#777]">{item.category}</div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <div className="pt-3 border-t border-[#1e1e1e] mt-3 flex items-center justify-between font-mono">
                    <span className="text-sm font-bold text-[#39FF14]">
                      Rp {Number(item.fiatEstimateIdr).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-[#aaa] group-hover:translate-x-1 transition-transform">
                      Lihat Detail →
                    </span>
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
            <div className="p-12 bg-[#111] border border-[#222] text-center space-y-2 font-mono text-xs">
              <CheckCircle2 size={32} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Belum Ada Transaksi Selesai</div>
              <p className="text-[#777]">Transaksi yang berhasil diselesaikan lewat COD akan tercatat di sini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedEscrows.map((r) => (
                <div key={r.id} className="p-4 bg-[#121212] border border-[#222] flex items-center justify-between">
                  <div>
                    <span className="badge-green text-[10px]">SELESAI (COD DUAL CONFIRMED)</span>
                    <div className="text-sm font-bold text-white mt-1">{getEscrowTitle(r)}</div>
                    <div className="text-xs font-mono text-[#888] mt-0.5">
                      Nilai Transaksi: Rp {getEscrowPriceIdr(r).toLocaleString("id-ID")} • Penjual: {r.seller?.codename || "Unknown"}
                    </div>
                  </div>
                  <Link href={`/escrow/${r.id}`} className="btn-ghost text-xs font-mono px-3 py-1.5">
                    Lihat Bukti Escrow
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
