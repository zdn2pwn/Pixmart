"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EscrowOrderWithDetails } from "@/lib/types";
import { formatBtc, formatXmr, formatDateTime, truncateHash } from "@/lib/format";
import { confirmHandshakeAction } from "@/app/actions/escrow";
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  Lock,
  ArrowLeft,
  Loader2,
  Key,
  AlertTriangle,
  Package,
} from "lucide-react";

export function EscrowHandshakeRoom({
  order: initialOrder,
  session,
}: {
  order: EscrowOrderWithDetails;
  session: any;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isCompleted = order.status === "COMPLETED";
  const buyerConfirmed = !!order.buyerConfirmedAt;
  const sellerConfirmed = !!order.sellerConfirmedAt;
  const hasImage = order.listing?.images && order.listing.images.length > 0 && order.listing.images[0];

  async function handleConfirm(roleToConfirm: "BUYER" | "SELLER") {
    startTransition(async () => {
      const res = await confirmHandshakeAction(order.id, roleToConfirm);
      if (res.success && res.order) {
        setOrder(res.order);
        if (res.bothConfirmed) {
          setSuccess(true);
          setMsg("DUAL HANDSHAKE SUKSES — Dana escrow berhasil dicairkan ke Seller!");
        } else {
          setMsg(`Konfirmasi ${roleToConfirm} tercatat. Menunggu pihak berikutnya.`);
        }
      }
    });
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Katalog Bazaar
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="text-xs font-mono text-[#39FF14] uppercase tracking-widest mb-1.5 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
            ESCROW DUAL-HANDSHAKE TERMINAL
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ruang Serah Terima Fisik (COD)
          </h1>
          <p className="text-xs font-mono text-[#888] mt-1">
            Order Reference: <span className="text-[#39FF14] font-bold">{order.orderNumber}</span>
          </p>
        </div>

        {isCompleted ? (
          <span className="badge-green text-xs font-bold py-2 px-3.5 flex items-center gap-2 self-start">
            <CheckCircle2 size={15} /> ESCROW RELEASED &amp; SETTLED
          </span>
        ) : (
          <span className="badge-warn text-xs font-bold py-2 px-3.5 flex items-center gap-2 self-start animate-pulse">
            <Clock size={15} /> MENUNGGU SERAH TERIMA FISIK
          </span>
        )}
      </div>

      {/* Alert Message */}
      {msg && (
        <div
          className={`flex items-start gap-3 p-4 text-xs font-mono border fade-up ${
            success
              ? "bg-[#39FF14]/10 border-[#39FF14]/50 text-[#39FF14]"
              : "bg-[#FFB800]/10 border-[#FFB800]/50 text-[#FFB800]"
          }`}
        >
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span className="font-bold">{msg}</span>
        </div>
      )}

      {/* Main card */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 sm:p-8 space-y-7">
        {/* Deal summary with thumbnail */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-[#222]">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#181818] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
              {hasImage ? (
                <img
                  src={order.listing.images[0]}
                  alt={order.listing.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <Package size={28} className="text-[#555]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#777] uppercase tracking-wider">
                Barang yang Ditransaksikan
              </div>
              <div className="font-bold text-white text-base sm:text-lg">
                {order.listing?.title}
              </div>
              <div className="text-xs font-mono text-[#39FF14] flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>Legal Verified Physical Goods</span>
              </div>
            </div>
          </div>

          <div className="sm:text-right font-mono space-y-1">
            <div className="text-xs text-[#777] uppercase tracking-wider">
              Dana Terkunci di Multisig
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#39FF14]">
              {order.cryptoCurrency === "XMR"
                ? formatXmr(order.cryptoAmount)
                : formatBtc(order.cryptoAmount)}
            </div>
            <div className="text-[11px] text-[#555]">
              Vault: {truncateHash(order.depositAddress, 10, 6)}
            </div>
          </div>
        </div>

        {/* Meetup & OTP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-[#161616] border border-[#262626] p-5 space-y-2">
            <div className="text-xs font-mono text-[#FFB800] uppercase font-bold flex items-center gap-2">
              <MapPin size={14} /> TITIK TEMU COD YANG DISEPAKATI
            </div>
            <div className="font-bold text-white text-base font-mono">
              {order.meetupLocation}
            </div>
            <p className="text-xs text-[#888] font-sans leading-relaxed">
              Catatan: {order.meetupScheduleNotes}
            </p>
          </div>

          {/* OTP Box */}
          <div className="bg-[#161616] border border-[#39FF14]/30 p-5 flex flex-col justify-center items-center text-center space-y-2">
            <div className="text-xs font-mono text-[#aaa] uppercase font-bold flex items-center gap-1.5">
              <Key size={13} className="text-[#39FF14]" /> OTP HANDSHAKE
            </div>
            <div
              className="text-2xl font-bold text-[#39FF14] tracking-[0.25em] font-mono py-1"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              {order.handshakeOtp}
            </div>
            <div className="text-[11px] font-mono text-[#666]">
              Tunjukkan kepada pihak lawan di lokasi COD
            </div>
          </div>
        </div>

        {/* Dual Confirmation Actions */}
        <div className="space-y-4">
          <div className="text-xs font-mono text-[#888] uppercase tracking-widest text-center font-bold">
            DUAL-CONFIRMATION HANDSHAKE PROTOCOL
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BUYER CARD */}
            <div
              className={`border p-5 space-y-4 transition-all ${
                buyerConfirmed
                  ? "border-[#39FF14]/50 bg-[#39FF14]/5"
                  : "border-[#2a2a2a] bg-[#161616]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  1. SISI BUYER (PEMBELI)
                </span>
                {buyerConfirmed ? (
                  <span className="badge-green text-xs">✓ SUDAH ACC</span>
                ) : (
                  <span className="badge-muted text-xs">BELUM ACC</span>
                )}
              </div>

              <div className="text-xs text-[#aaa] font-mono">
                Node Buyer: <strong className="text-white">{order.buyer?.codename}</strong>
              </div>

              {buyerConfirmed ? (
                <div className="text-xs font-mono text-[#39FF14] flex items-center gap-1.5 pt-2">
                  <CheckCircle2 size={14} /> Terkonfirmasi: {formatDateTime(order.buyerConfirmedAt!)}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleConfirm("BUYER")}
                  className="btn-primary w-full py-3.5 text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  KONFIRMASI BARANG OKE (SAYA BUYER)
                </button>
              )}
            </div>

            {/* SELLER CARD */}
            <div
              className={`border p-5 space-y-4 transition-all ${
                sellerConfirmed
                  ? "border-[#39FF14]/50 bg-[#39FF14]/5"
                  : "border-[#2a2a2a] bg-[#161616]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  2. SISI SELLER (PENJUAL)
                </span>
                {sellerConfirmed ? (
                  <span className="badge-green text-xs">✓ SUDAH ACC</span>
                ) : (
                  <span className="badge-muted text-xs">BELUM ACC</span>
                )}
              </div>

              <div className="text-xs text-[#aaa] font-mono">
                Node Seller: <strong className="text-white">{order.seller?.codename}</strong>
              </div>

              {sellerConfirmed ? (
                <div className="text-xs font-mono text-[#39FF14] flex items-center gap-1.5 pt-2">
                  <CheckCircle2 size={14} /> Terkonfirmasi: {formatDateTime(order.sellerConfirmedAt!)}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleConfirm("SELLER")}
                  className="btn-ghost w-full py-3.5 text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer border-[#444] hover:border-[#39FF14]"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  KONFIRMASI SERAH TERIMA (SAYA SELLER)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Completion Banner */}
        {isCompleted && (
          <div className="border border-[#39FF14]/40 bg-[#39FF14]/10 p-8 text-center space-y-4 fade-up">
            <CheckCircle2 size={40} className="text-[#39FF14] mx-auto animate-bounce" />
            <div
              className="text-lg font-bold text-[#39FF14]"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              TRANSAKSI ESCROW SUKSES
            </div>
            <p className="text-sm text-[#ccc] max-w-md mx-auto font-sans leading-relaxed">
              Kedua pihak telah mengonfirmasi serah terima fisik secara sah. Dana{" "}
              <strong className="text-[#39FF14]">
                {order.cryptoCurrency === "XMR"
                  ? formatXmr(order.cryptoAmount)
                  : formatBtc(order.cryptoAmount)}
              </strong>{" "}
              telah otomatis dicairkan ke wallet seller.
            </p>
            <Link href="/marketplace" className="btn-primary inline-flex px-6 py-3 text-xs font-bold">
              KEMBALI KE BAZAAR →
            </Link>
          </div>
        )}
      </div>

      {/* Simulator Tip */}
      <div className="bg-[#121212] border border-[#222] p-4 text-xs font-mono text-[#777]">
        <strong className="text-[#39FF14]">TIPS SIMULASI DEMO: </strong>
        Tekan tombol "KONFIRMASI BARANG OKE (SAYA BUYER)" lalu tekan tombol "KONFIRMASI SERAH TERIMA (SAYA SELLER)" untuk mencoba alur dual handshake langsung.
      </div>
    </div>
  );
}
