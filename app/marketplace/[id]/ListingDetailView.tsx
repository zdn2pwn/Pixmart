"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ListingWithSeller, CryptoCurrency } from "@/lib/types";
import { formatBtc, formatXmr, formatCurrency } from "@/lib/format";
import { createEscrowOrderAction } from "@/app/actions/escrow";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Eye,
  Calendar,
} from "lucide-react";

export function ListingDetailView({
  listing,
  session,
}: {
  listing: ListingWithSeller;
  session: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [crypto, setCrypto] = useState<CryptoCurrency>("XMR");
  const [meetupLocation, setMeetupLocation] = useState(listing.meetupZone);
  const [notes, setNotes] = useState("Setuju ketemuan di titik temu publik untuk serah terima & cek fisik langsung.");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isInEscrow = listing.status !== "ACTIVE";
  const hasImage = listing.images && listing.images.length > 0 && listing.images[0];

  async function handleInitiateEscrow(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("listingId", listing.id);
    formData.append("cryptoCurrency", crypto);
    formData.append("meetupLocation", meetupLocation);
    formData.append("meetupScheduleNotes", notes);
    startTransition(async () => {
      const res = await createEscrowOrderAction(formData);
      if (res && !res.success) setErrorMsg(res.error || "Gagal mengunci escrow");
    });
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Katalog Bazaar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Images & Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Product Image Gallery Box */}
          <div className="bg-[#121212] border border-[#2a2a2a] overflow-hidden">
            <div className="relative aspect-[16/10] bg-[#181818] overflow-hidden flex items-center justify-center">
              {hasImage ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Package size={48} className="text-[#444] mb-3" />
                  <span className="text-sm font-mono text-[#888] uppercase tracking-wider">
                    Foto Fisik Terverifikasi
                  </span>
                </div>
              )}

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="badge-muted text-xs font-bold bg-black/80 backdrop-blur-md">
                  {listing.category.replace(/_/g, " ")}
                </span>
                <span className="badge-green text-xs font-bold bg-black/80 backdrop-blur-md">
                  {listing.condition}
                </span>
              </div>

              <div className="absolute bottom-3 right-4 px-3 py-1 bg-black/85 backdrop-blur-sm text-xs font-mono text-[#aaa] border border-[#333] flex items-center gap-1.5">
                <Eye size={13} className="text-[#39FF14]" />
                <span>{listing.views} kali dilihat</span>
              </div>
            </div>
          </div>

          {/* Main Details Card */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-[#39FF14] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck size={14} /> 100% LEGAL HARDWARE VERIFIED
                </span>
                <span className="text-[#666]">ID: {listing.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                {listing.title}
              </h1>
            </div>

            {/* Meetup Zone Box */}
            <div className="bg-[#161616] border border-[#2e2e2e] p-5 space-y-2">
              <div className="text-xs font-mono text-[#FFB800] uppercase font-bold flex items-center gap-2">
                <MapPin size={14} /> TITIK TEMU COD (SERAH TERIMA LANGSUNG)
              </div>
              <div className="text-base font-bold text-white font-mono">
                {listing.locationCity} — {listing.meetupZone}
              </div>
              <p className="text-xs text-[#888] leading-relaxed font-sans">
                Transaksi tatap muka langsung di ruang publik aman. Pembeli memeriksa kondisi fisik barang terlebih dahulu sebelum kedua pihak sepakat menekan tombol konfirmasi. Tidak ada pengiriman ekspedisi/kurir.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono text-[#777] uppercase font-bold tracking-wider">
                Deskripsi Barang &amp; Kelengkapan:
              </div>
              <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-line font-sans">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Seller Profile Card */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-[#181818] border border-[#333] flex items-center justify-center font-bold font-mono text-[#39FF14] text-base">
                {listing.seller?.codename.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-mono text-[#666] uppercase">Merchant / Seller Node</div>
                <div className="font-bold text-white text-base">{listing.seller?.codename}</div>
                <div className="text-xs text-[#888] font-mono">{listing.locationCity}</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-sm text-[#39FF14] font-bold">★ {listing.seller?.reputation}% Reputasi</div>
              <div className="text-xs text-[#666] mt-0.5">{listing.seller?.completedDeals} deals sukses tanpa sengketa</div>
            </div>
          </div>
        </div>

        {/* Right Column: Escrow Lock Form */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 sm:p-7 space-y-6">
            <div className="border-b border-[#222] pb-4">
              <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
                ESCROW CHECKPOINT
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Inisiasi Kunci Escrow
              </h2>
              <p className="text-xs text-[#777] mt-1 font-sans">
                Kunci dana di multisig vault untuk menjadwalkan ketemuan langsung.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2.5 bg-[#FF4444]/10 border border-[#FF4444]/40 text-[#FF4444] text-xs p-3.5 font-mono">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isInEscrow ? (
              <div className="p-6 bg-[#FFB800]/10 border border-[#FFB800]/40 text-center space-y-2">
                <div className="font-mono font-bold text-base text-[#FFB800]">DALAM PROSES ESCROW</div>
                <p className="text-xs text-[#aaa] font-sans">
                  Barang ini sedang dalam proses pertemuan dengan pembeli lain. Jika batal, listing akan kembali aktif secara otomatis.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInitiateEscrow} className="space-y-5">
                {/* Crypto Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-[#aaa] uppercase tracking-wider font-bold">
                    Pilih Mata Uang Deposit:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["XMR", "BTC"] as CryptoCurrency[]).map((cur) => {
                      const active = crypto === cur;
                      const isBtc = cur === "BTC";
                      return (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setCrypto(cur)}
                          className={`p-3.5 border text-left font-mono transition-all cursor-pointer ${
                            active
                              ? isBtc
                                ? "border-[#F7931A] bg-[#F7931A]/10 text-[#F7931A] shadow-[0_0_12px_rgba(247,147,26,0.3)]"
                                : "border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600] shadow-[0_0_12px_rgba(255,102,0,0.3)]"
                              : "border-[#2a2a2a] bg-[#161616] text-[#777] hover:border-[#444] hover:text-[#bbb]"
                          }`}
                        >
                          <div className="text-xs font-bold uppercase tracking-wider">
                            {isBtc ? "Bitcoin (BTC)" : "Monero (XMR)"}
                          </div>
                          <div className="text-base font-bold mt-1 text-white">
                            {isBtc ? formatBtc(listing.priceBtc) : formatXmr(listing.priceXmr)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fiat Estimate Reference */}
                <div className="bg-[#161616] border border-[#2a2a2a] p-3.5 text-xs font-mono flex justify-between items-center">
                  <span className="text-[#888]">Estimasi Nilai Rupiah:</span>
                  <span className="text-sm text-[#39FF14] font-bold">{formatCurrency(listing.fiatEstimateIdr)}</span>
                </div>

                {/* Proposed Meetup Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#aaa] uppercase tracking-wider font-bold">
                    Usulan Titik Temu Publik:
                  </label>
                  <input
                    type="text"
                    required
                    value={meetupLocation}
                    onChange={(e) => setMeetupLocation(e.target.value)}
                    className="input-dark w-full text-sm py-2.5 px-3.5 font-sans"
                  />
                </div>

                {/* Meetup Schedule Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#aaa] uppercase tracking-wider font-bold">
                    Catatan Jadwal &amp; Jam Ketemuan:
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-dark w-full text-xs sm:text-sm p-3 font-sans resize-none"
                  />
                </div>

                {/* Multisig Escrow Guarantees */}
                <div className="space-y-2 pt-2 border-t border-[#1e1e1e] text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#39FF14]">
                    <CheckCircle2 size={13} /> Dana aman terkunci di stealth vault
                  </div>
                  <div className="flex items-center gap-2 text-[#39FF14]">
                    <CheckCircle2 size={13} /> Rilis HANYA setelah kedua pihak konfirmasi
                  </div>
                  <div className="flex items-center gap-2 text-[#aaa]">
                    <CheckCircle2 size={13} /> Garansi 100% refund bila barang tidak sesuai
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full py-4 text-xs sm:text-sm font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      MENGUNCI MULTISIG ESCROW...
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      KUNCI ESCROW &amp; BUKA HANDSHAKE ROOM
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
