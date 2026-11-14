"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Listing, NegotiationWithDetails, EscrowRoomWithDetails } from "@/lib/types";
import { formatCurrency, formatXmr, formatBtc } from "@/lib/format";
import { topUpBalanceAction } from "@/app/actions/auth";
import {
  withdrawSellerPayoutAction,
  deleteListingAction,
  toggleListingStatusAction,
} from "@/app/actions/seller";
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
  Coins,
  ArrowUpRight,
  Copy,
  Check,
  Trash2,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Wallet,
  Loader2,
  X,
  AlertCircle,
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
  const [isPending, startTransition] = useTransition();

  // Local state for listings to update optimistically
  const [listingsList, setListingsList] = useState<Listing[]>(myListings);

  // Local balances
  const [balanceBtc, setBalanceBtc] = useState<number>(session?.balanceBtc ?? 0.02);
  const [balanceXmr, setBalanceXmr] = useState<number>(session?.balanceXmr ?? 1.25);

  // Custom UI Modals & Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawCurrency, setWithdrawCurrency] = useState<"XMR" | "BTC">("XMR");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0.5");
  const [withdrawAddress, setWithdrawAddress] = useState<string>(
    session?.walletXmr || session?.walletBtc || ""
  );
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawTxResult, setWithdrawTxResult] = useState<{
    txHash: string;
    amount: number;
    currency: string;
  } | null>(null);

  // Delete Listing Modal State
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Tersalin ke clipboard: ${text.slice(0, 16)}...`);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // Top Up Faucet
  function handleFaucetTopUp(currency: "BTC" | "XMR", amount: number) {
    startTransition(async () => {
      const res = await topUpBalanceAction(currency, amount);
      if (res.success) {
        if (currency === "BTC") setBalanceBtc(res.newBalance);
        if (currency === "XMR") setBalanceXmr(res.newBalance);
        showToast(`+${amount} ${currency} berhasil ditambahkan ke dompet seller!`);
      }
    });
  }

  // Open Withdraw Modal
  function openWithdrawModal(curr: "XMR" | "BTC") {
    setWithdrawCurrency(curr);
    setWithdrawError(null);
    if (curr === "XMR") {
      setWithdrawAddress(session?.walletXmr || session?.walletBtc || "");
      setWithdrawAmount("0.5");
    } else {
      setWithdrawAddress(session?.walletBtc || session?.walletXmr || "");
      setWithdrawAmount("0.005");
    }
    setWithdrawModalOpen(true);
  }

  // Submit Withdraw
  async function handleExecuteWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawError(null);

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError("Masukkan jumlah penarikan yang valid.");
      return;
    }

    const available = withdrawCurrency === "XMR" ? balanceXmr : balanceBtc;
    if (amt > available) {
      setWithdrawError(`Saldo ${withdrawCurrency} tidak mencukupi (Tersedia: ${available} ${withdrawCurrency}).`);
      return;
    }

    if (!withdrawAddress.trim()) {
      setWithdrawError("Alamat dompet penerima wajib diisi.");
      return;
    }

    const fd = new FormData();
    fd.append("currency", withdrawCurrency);
    fd.append("amount", String(amt));
    fd.append("destinationAddress", withdrawAddress.trim());

    startTransition(async () => {
      const res = await withdrawSellerPayoutAction(fd);
      if (res.success && res.newBalance !== undefined) {
        if (withdrawCurrency === "BTC") setBalanceBtc(res.newBalance);
        if (withdrawCurrency === "XMR") setBalanceXmr(res.newBalance);

        setWithdrawModalOpen(false);
        setWithdrawTxResult({
          txHash: res.txHash || `tx_${Date.now()}`,
          amount: res.amount || amt,
          currency: res.currency || withdrawCurrency,
        });
      } else {
        setWithdrawError(res.error || "Gagal memproses penarikan.");
      }
    });
  }

  // Toggle Listing Status (ACTIVE <-> PAUSED)
  function handleToggleStatus(listing: Listing) {
    const nextStatus = listing.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    startTransition(async () => {
      const res = await toggleListingStatusAction(listing.id, nextStatus as any);
      if (res.success) {
        setListingsList((prev) =>
          prev.map((item) => (item.id === listing.id ? { ...item, status: nextStatus as any } : item))
        );
        showToast(
          nextStatus === "ACTIVE"
            ? `Iklan "${listing.title}" diaktifkan kembali di marketplace.`
            : `Iklan "${listing.title}" dijeda sementara.`
        );
      }
    });
  }

  // Delete Listing
  async function confirmDeleteListing() {
    if (!listingToDelete) return;
    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteListingAction(listingToDelete.id);
      setIsDeleting(false);
      if (res.success) {
        setListingsList((prev) => prev.filter((item) => item.id !== listingToDelete.id));
        showToast(`Iklan "${listingToDelete.title}" telah dihapus.`);
        setListingToDelete(null);
      } else {
        showToast(res.error || "Gagal menghapus iklan.");
      }
    });
  }

  const incomingOffers = (negotiations || []).filter((n: any) => n.seller_id === session?.userId && n.status !== "REJECTED");
  const activeEscrows = (escrowRooms || []).filter((r: any) => r.status !== "COMPLETED" && r.status !== "CANCELLED");
  const completedDeals = (escrowRooms || []).filter((r: any) => r.status === "COMPLETED");

  const xmrIdrEstimate = Math.round(balanceXmr * 2500000);
  const btcIdrEstimate = Math.round(balanceBtc * 1400000000);
  const totalSellerEstIdr = xmrIdrEstimate + btcIdrEstimate;

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#39FF14] text-white px-4 py-3 text-xs font-mono shadow-[0_0_20px_rgba(57,255,20,0.4)] flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#888] hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
            <span>SELLER CONTROL CENTER • ANONYMOUS P2P</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Penjual Lokal
          </h1>
          <p className="text-xs font-mono text-[#888] mt-1">
            Seller Codename: <span className="text-[#39FF14] font-bold">{session?.codename || session?.name}</span> • Reputasi: 99% • Transaksi COD Terverifikasi
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

      {/* SELLER WALLET & PAYOUT HUD */}
      <div className="bg-[#101010] border border-[#2a2a2a] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[#39FF14]" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Dompet Saldo &amp; Payout Penjual
            </h3>
            <span className="text-[10px] font-mono text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5">
              P2P ESCROW EARNINGS
            </span>
          </div>
          <div className="text-xs font-mono text-[#888]">
            Estimasi Nilai Total:{" "}
            <span className="text-white font-bold">Rp {totalSellerEstIdr.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monero (XMR) Card */}
          <div className="bg-[#141414] border border-[#2e2e2e] hover:border-[#FF6600]/60 p-4 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF6600] inline-block" />
                <span className="text-xs font-mono font-bold text-white">MONERO (XMR)</span>
                <span className="text-[9px] font-mono bg-[#FF6600]/20 text-[#FF6600] border border-[#FF6600]/40 px-1.5 py-0.2">
                  UTAMA / PRIVATE
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#888]">1 XMR ≈ Rp 2.500.000</span>
            </div>

            <div>
              <div className="text-2xl font-mono font-bold text-[#FF6600]">
                {balanceXmr.toFixed(4)} <span className="text-xs text-[#888]">XMR</span>
              </div>
              <div className="text-[11px] font-mono text-[#666]">
                ≈ Rp {xmrIdrEstimate.toLocaleString("id-ID")}
              </div>
            </div>

            <div className="pt-1 border-t border-[#222] text-[10px] font-mono space-y-1">
              <div className="text-[#888]">Alamat Payout Monero Terdaftar:</div>
              <div className="text-[#39FF14] font-mono truncate bg-[#0c0c0c] p-1.5 border border-[#222]">
                {session?.walletXmr || "Belum didaftarkan (gunakan format 95 karakter)"}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => openWithdrawModal("XMR")}
                className="btn-primary text-[11px] font-mono font-bold py-1.5 px-3 flex items-center gap-1.5"
              >
                <ArrowUpRight size={13} />
                <span>Tarik Payout XMR</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFaucetTopUp("XMR", 1.0)}
                className="btn-outline text-[11px] font-mono py-1.5 px-2.5 text-[#aaa] hover:text-[#39FF14]"
              >
                + Faucet 1.0 XMR
              </button>
            </div>
          </div>

          {/* Bitcoin (BTC) Card */}
          <div className="bg-[#141414] border border-[#2e2e2e] hover:border-[#F7931A]/60 p-4 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F7931A] inline-block" />
                <span className="text-xs font-mono font-bold text-white">BITCOIN (BTC)</span>
                <span className="text-[9px] font-mono bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/40 px-1.5 py-0.2">
                  SEKUNDER
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#888]">1 BTC ≈ Rp 1.400.000.000</span>
            </div>

            <div>
              <div className="text-2xl font-mono font-bold text-[#F7931A]">
                {balanceBtc.toFixed(6)} <span className="text-xs text-[#888]">BTC</span>
              </div>
              <div className="text-[11px] font-mono text-[#666]">
                ≈ Rp {btcIdrEstimate.toLocaleString("id-ID")}
              </div>
            </div>

            <div className="pt-1 border-t border-[#222] text-[10px] font-mono space-y-1">
              <div className="text-[#888]">Alamat Payout Bitcoin Terdaftar:</div>
              <div className="text-[#39FF14] font-mono truncate bg-[#0c0c0c] p-1.5 border border-[#222]">
                {session?.walletBtc || "Belum didaftarkan (bc1... / 1... / 3...)"}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => openWithdrawModal("BTC")}
                className="btn-primary text-[11px] font-mono font-bold py-1.5 px-3 flex items-center gap-1.5"
              >
                <ArrowUpRight size={13} />
                <span>Tarik Payout BTC</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFaucetTopUp("BTC", 0.01)}
                className="btn-outline text-[11px] font-mono py-1.5 px-2.5 text-[#aaa] hover:text-[#39FF14]"
              >
                + Faucet 0.01 BTC
              </button>
            </div>
          </div>
        </div>

        {/* Deposit address snippet */}
        <div className="bg-[#0b0b0b] border border-[#222] p-3 text-[11px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[#888]">
            Alamat Top Up Deposit Anonim Anda:{" "}
            <span className="text-white font-bold">{session?.depositAddressXmr || "Generating..."}</span>
          </div>
          {session?.depositAddressXmr && (
            <button
              onClick={() => handleCopy(session.depositAddressXmr, "depositXmr")}
              className="text-[#39FF14] hover:underline flex items-center gap-1 shrink-0"
            >
              {copiedKey === "depositXmr" ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedKey === "depositXmr" ? "Tersalin" : "Salin Alamat"}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4">
          <div className="text-[10px] font-mono text-[#888] uppercase">Produk Aktif</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{listingsList.length}</div>
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
          { key: "PRODUCTS", label: `Katalog Barang Saya (${listingsList.length})` },
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
          {listingsList.length === 0 ? (
            <div className="bg-[#121212] border border-[#222] p-8 text-center space-y-3 font-mono text-xs">
              <Package size={36} className="mx-auto text-[#444]" />
              <div className="text-white font-bold">Belum ada barang yang didaftarkan.</div>
              <p className="text-[#888] max-w-md mx-auto">
                Pasang iklan produk lokal Anda untuk mulai menerima penawaran COD dari pembeli di sekitar lokasi Anda.
              </p>
              <Link href="/marketplace/new" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
                + Pasang Iklan Barang Pertama Anda
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listingsList.map((l) => (
                <div
                  key={l.id}
                  className="bg-[#121212] border border-[#282828] p-4 flex flex-col justify-between gap-4"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 bg-[#181818] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
                      {l.images && l.images[0] ? (
                        <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={28} className="text-[#555]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 border ${
                            l.status === "ACTIVE"
                              ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30"
                              : l.status === "SOLD"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30"
                          }`}
                        >
                          {l.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#888]">{l.locationCity}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{l.title}</h4>
                      <div className="text-xs font-mono font-bold text-[#39FF14]">
                        Rp {l.fiatEstimateIdr.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] font-mono text-[#666] flex items-center gap-1 truncate">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{l.locationDistrict}, {l.locationCity}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#888]">
                        Area COD: <span className="text-[#ccc]">{l.meetupZone || "Publik"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#1e1e1e] text-[11px] font-mono">
                    <Link
                      href={`/marketplace/${l.id}`}
                      className="text-[#888] hover:text-[#39FF14] flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>Lihat Publik</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(l)}
                        className="text-[#aaa] hover:text-white flex items-center gap-1 p-1"
                        title={l.status === "ACTIVE" ? "Jeda Iklan" : "Aktifkan Iklan"}
                      >
                        {l.status === "ACTIVE" ? (
                          <>
                            <PauseCircle size={14} className="text-[#FFB800]" />
                            <span className="text-[10px]">Jeda</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle size={14} className="text-[#39FF14]" />
                            <span className="text-[10px]">Aktifkan</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setListingToDelete(l)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 p-1 hover:bg-red-950/30 transition-colors"
                        title="Hapus Iklan"
                      >
                        <Trash2 size={13} />
                        <span className="text-[10px]">Hapus</span>
                      </button>
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

      {/* ============================================================ */}
      {/* CUSTOM UI MODAL: TARIK SALDO (WITHDRAW PAYOUT) */}
      {/* ============================================================ */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#39FF14] max-w-lg w-full p-6 space-y-4 shadow-[0_0_30px_rgba(57,255,20,0.2)]">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={18} className="text-[#39FF14]" />
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Tarik Saldo Payout (Withdraw)
                </h3>
              </div>
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="text-[#888] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteWithdraw} className="space-y-4">
              {/* Currency Selector */}
              <div>
                <label className="text-xs font-mono text-[#aaa] block mb-1">Pilih Mata Uang</label>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawCurrency("XMR");
                      setWithdrawAddress(session?.walletXmr || "");
                    }}
                    className={`p-2.5 border text-center transition-all ${
                      withdrawCurrency === "XMR"
                        ? "bg-[#FF6600]/20 border-[#FF6600] text-[#FF6600] font-bold"
                        : "bg-[#181818] border-[#333] text-[#888] hover:text-white"
                    }`}
                  >
                    Monero (XMR) • Tersedia: {balanceXmr.toFixed(4)}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawCurrency("BTC");
                      setWithdrawAddress(session?.walletBtc || "");
                    }}
                    className={`p-2.5 border text-center transition-all ${
                      withdrawCurrency === "BTC"
                        ? "bg-[#F7931A]/20 border-[#F7931A] text-[#F7931A] font-bold"
                        : "bg-[#181818] border-[#333] text-[#888] hover:text-white"
                    }`}
                  >
                    Bitcoin (BTC) • Tersedia: {balanceBtc.toFixed(6)}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-mono">
                  <label className="text-[#aaa]">Jumlah Penarikan ({withdrawCurrency})</label>
                  <button
                    type="button"
                    onClick={() =>
                      setWithdrawAmount(
                        withdrawCurrency === "XMR" ? String(balanceXmr) : String(balanceBtc)
                      )
                    }
                    className="text-[#39FF14] text-[10px] hover:underline"
                  >
                    Tarik Semua (Max)
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input-dark w-full px-3 py-2 text-sm font-mono font-bold text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Destination Address */}
              <div>
                <label className="text-xs font-mono text-[#aaa] block mb-1">
                  Alamat Wallet Tujuan Penarikan
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="input-dark w-full px-3 py-2 text-xs font-mono text-[#39FF14]"
                  placeholder="Alamat wallet BTC atau XMR Anda..."
                  required
                />
                <p className="text-[10px] font-mono text-[#666] mt-1">
                  🔒 Otomatis terisi dari alamat biodata yang telah Anda daftarkan saat onboarding.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="btn-outline text-xs font-mono py-2 px-4 text-[#888] hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary text-xs font-mono font-bold py-2 px-5 flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <ArrowUpRight size={14} />
                      <span>Konfirmasi &amp; Kirim Payout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CUSTOM UI MODAL: WITHDRAW TRANSACTION RESULT */}
      {/* ============================================================ */}
      {withdrawTxResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#39FF14] max-w-md w-full p-6 space-y-4 shadow-[0_0_30px_rgba(57,255,20,0.3)]">
            <div className="w-12 h-12 bg-[#39FF14]/10 border border-[#39FF14] text-[#39FF14] flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold font-mono text-white">
                Penarikan Berhasil Diproses!
              </h3>
              <p className="text-xs font-mono text-[#aaa]">
                Transaksi sebesar{" "}
                <span className="text-[#39FF14] font-bold">
                  {withdrawTxResult.amount} {withdrawTxResult.currency}
                </span>{" "}
                telah diteruskan ke jaringan peer-to-peer.
              </p>
            </div>

            <div className="bg-[#0c0c0c] border border-[#222] p-3 text-[10px] font-mono space-y-1">
              <div className="text-[#888]">Transaction ID (Hash):</div>
              <div className="text-white truncate font-bold">{withdrawTxResult.txHash}</div>
            </div>

            <button
              type="button"
              onClick={() => setWithdrawTxResult(null)}
              className="btn-primary w-full py-2.5 text-xs font-mono font-bold"
            >
              Selesai &amp; Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CUSTOM UI MODAL: CONFIRM DELETE LISTING */}
      {/* ============================================================ */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/80 max-w-md w-full p-6 space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-2 text-red-400 border-b border-[#222] pb-3">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Konfirmasi Hapus Iklan Produk
              </h3>
            </div>

            <p className="text-xs font-mono text-[#ccc] leading-relaxed">
              Yakin ingin menghapus iklan{" "}
              <span className="text-white font-bold">&quot;{listingToDelete.title}&quot;</span> dari
              katalog lokal? Iklan tidak akan dapat dilihat atau ditawar lagi oleh pembeli.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="btn-outline text-xs font-mono py-2 px-4 text-[#888] hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteListing}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold py-2 px-4 flex items-center gap-1.5 transition-colors"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
