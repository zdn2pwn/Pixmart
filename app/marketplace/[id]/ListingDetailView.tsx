"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListingWithSeller } from "@/lib/types";
import { formatBtc, formatXmr, formatCurrency } from "@/lib/format";
import { calculateDistanceKm, formatDistance, type Coordinates } from "@/lib/location";
import { createOfferAction } from "@/app/actions/negotiation";
import { createDirectEscrowAction } from "@/app/actions/escrow";
import { toggleWishlistAction } from "@/app/actions/marketplace";
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
  MessageSquare,
  Zap,
  Heart,
  Navigation,
} from "lucide-react";

export function ListingDetailView({
  listing,
  session,
}: {
  listing: ListingWithSeller;
  session: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Nego state
  const [offerPrice, setOfferPrice] = useState<number>(listing.fiatEstimateIdr * 0.9);
  const [negoNote, setNegoNote] = useState<string>("Bisa ketemuan di area publik terdekat untuk cek fisik?");
  const [showNegoModal, setShowNegoModal] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Distance state
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);

  function checkMyDistance() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserCoords(coords);
        if (listing.approxLatitude && listing.approxLongitude) {
          const dist = calculateDistanceKm(coords, {
            latitude: listing.approxLatitude,
            longitude: listing.approxLongitude,
          });
          setDistanceText(formatDistance(dist));
        }
      },
      () => {
        setDistanceText("Izin lokasi tidak diberikan");
      }
    );
  }

  async function handleToggleWishlist() {
    if (!session) {
      router.push(`/login?from=/marketplace/${listing.id}`);
      return;
    }
    setIsWishlisted(!isWishlisted);
    await toggleWishlistAction(listing.id);
  }

  function handleOpenNego() {
    if (!session) {
      router.push(`/login?from=/marketplace/${listing.id}`);
      return;
    }
    setShowNegoModal(true);
  }

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push(`/login?from=/marketplace/${listing.id}`);
      return;
    }
    setErrorMsg(null);
    const fd = new FormData();
    fd.append("listingId", listing.id);
    fd.append("offerPriceIdr", String(offerPrice));
    fd.append("messageText", negoNote);

    startTransition(async () => {
      const res = await createOfferAction(fd);
      if (res.success && res.negotiationId) {
        router.push(`/negotiations/${res.negotiationId}`);
      } else {
        setErrorMsg(res.error || "Gagal mengajukan penawaran");
      }
    });
  }

  async function handleDirectBuy() {
    if (!session) {
      router.push(`/login?from=/marketplace/${listing.id}`);
      return;
    }
    if (!confirm(`Konfirmasi pembelian langsung sesuai harga katalog Rp ${listing.fiatEstimateIdr.toLocaleString("id-ID")}? Sistem akan membuat Escrow Room untuk serah terima COD.`)) {
      return;
    }
    setErrorMsg(null);
    const fd = new FormData();
    fd.append("listingId", listing.id);

    startTransition(async () => {
      const res = await createDirectEscrowAction(fd);
      if (res.success && res.escrowRoomId) {
        router.push(`/escrow/${res.escrowRoomId}`);
      } else {
        setErrorMsg(res.error || "Gagal membuat transaksi");
      }
    });
  }

  const hasImage = listing.images && listing.images.length > 0 && listing.images[0];
  const approxLocation = listing.locationDistrict && listing.locationCity
    ? `${listing.locationDistrict}, ${listing.locationCity}`
    : listing.meetupZone;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Katalog Produk
      </Link>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Images & Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Box */}
          <div className="bg-[#121212] border border-[#2a2a2a] overflow-hidden">
            <div className="relative aspect-[16/10] bg-[#181818] overflow-hidden flex items-center justify-center">
              {hasImage ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-[#555]">
                  <Package size={48} className="mb-3" />
                  <span className="text-sm font-mono uppercase tracking-wider">
                    Foto Fisik Terverifikasi
                  </span>
                </div>
              )}

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="badge-muted text-xs font-bold bg-black/85 backdrop-blur-md">
                  {listing.category.replace(/_/g, " ")}
                </span>
                <span className="badge-green text-xs font-bold bg-black/85 backdrop-blur-md">
                  {listing.condition}
                </span>
              </div>

              <div className="absolute bottom-3 right-4 px-3 py-1 bg-black/85 backdrop-blur-sm text-xs font-mono text-[#aaa] border border-[#333] flex items-center gap-1.5">
                <Eye size={13} className="text-[#39FF14]" />
                <span>{listing.views} kali dilihat</span>
              </div>
            </div>
          </div>

          {/* Details & Manifesto */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {listing.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#888]">
                <span>Status:</span>
                <span className="text-[#39FF14] font-bold">TERSEDIA UNTUK COD</span>
                <span>•</span>
                <span>Stok: {listing.stock} unit</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold">
                Deskripsi &amp; Kondisi Fisik
              </h3>
              <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-line font-sans">
                {listing.description}
              </p>
            </div>

            {/* Location Privacy Guarantee Box */}
            <div className="p-4 bg-[#161616] border border-[#282828] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-[#888] uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={15} className="text-[#39FF14]" />
                  <span>Area Lokasi Transaksi (Approximate Location)</span>
                </div>
                <button
                  onClick={checkMyDistance}
                  className="text-[11px] font-mono text-[#39FF14] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation size={12} />
                  <span>{distanceText ? `Jarak: ~${distanceText}` : "Hitung Jarak ke Sini"}</span>
                </button>
              </div>

              <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>{approxLocation}</span>
                {distanceText && (
                  <span className="text-xs text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5">
                    ~{distanceText} dari kamu
                  </span>
                )}
              </div>

              <p className="text-xs text-[#777] leading-relaxed">
                🔒 <strong>Privasi Lokasi Terjaga:</strong> Alamat pribadi penjual tidak pernah diumbar. Titik temu pertemuan fisik publik (Mall, Cafe, Minimarket) akan disepakati bersama secara tertutup di dalam <em>Escrow Room</em>.
              </p>

              {listing.meetingAvailability && (
                <div className="text-xs text-[#aaa] pt-2 border-t border-[#222] flex items-center gap-2">
                  <Calendar size={13} className="text-[#39FF14]" />
                  <span>Jadwal Penjual: {listing.meetingAvailability}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Checkout & Action Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 space-y-6">
            {/* Price section */}
            <div className="border-b border-[#222] pb-5">
              <div className="text-[10px] font-mono text-[#888] uppercase tracking-wider">Harga Patokan Katalog</div>
              <div className="text-3xl font-bold text-white font-mono mt-1">
                Rp {listing.fiatEstimateIdr.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#888]">
                <span>Setara:</span>
                <span className="text-[#FF6600] font-bold">{formatXmr(listing.priceXmr)}</span>
                <span>atau</span>
                <span className="text-[#F7931A] font-bold">{formatBtc(listing.priceBtc)}</span>
              </div>
            </div>

            {/* Seller profile card */}
            <div className="p-4 bg-[#171717] border border-[#2b2b2b] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#777] uppercase">Profil Penjual</div>
                <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
                  <span>{listing.seller.codename}</span>
                </div>
                <div className="text-[11px] font-mono text-[#888] mt-1">
                  Reputasi: <span className="text-[#39FF14] font-bold">{listing.seller.reputation}%</span> • {listing.seller.completedDeals} deal selesai
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono bg-[#222] px-2 py-1 text-[#aaa] border border-[#333]">
                  ANONYMOUS
                </span>
              </div>
            </div>

            {/* Action Buttons: Nego vs Direct Buy */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleOpenNego}
                disabled={isPending}
                className="w-full py-3 px-4 bg-[#1a1a1a] hover:bg-[#252525] border border-[#39FF14]/50 hover:border-[#39FF14] text-[#39FF14] text-sm font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_10px_rgba(57,255,20,0.1)]"
              >
                <MessageSquare size={16} />
                <span>Ajukan Penawaran (Nego Harga)</span>
              </button>

              <button
                onClick={handleDirectBuy}
                disabled={isPending}
                className="btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Beli Langsung (Harga Pas &amp; Kunci Escrow)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleWishlist}
                className="w-full py-2.5 px-4 bg-[#141414] hover:bg-[#1c1c1c] border border-[#2b2b2b] text-xs font-mono text-[#aaa] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Heart size={14} className={isWishlisted ? "text-[#FF3B30] fill-[#FF3B30]" : ""} />
                <span>{isWishlisted ? "Tersimpan di Wishlist" : "Simpan ke Wishlist"}</span>
              </button>
            </div>

            {/* Escrow COD Guarantee notes */}
            <div className="pt-4 border-t border-[#222] space-y-2 text-[11px] font-mono text-[#777]">
              <div className="flex items-center gap-1.5 text-[#39FF14]">
                <ShieldCheck size={14} />
                <span className="font-bold">PROSES AMAN 100% TATAP MUKA (COD):</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-[#888]">
                <li>Tidak ada pengiriman kurir/ekspedisi. Transaksi bertemu langsung.</li>
                <li>Escrow room mengunci deal dan memfasilitasi penentuan titik temu publik.</li>
                <li>Penyelesaian transaksi membutuhkan konfirmasi kedua belah pihak di lokasi.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Modal Drawer */}
      {showNegoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333] max-w-md w-full p-6 space-y-5 shadow-2xl fade-up">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-[#39FF14]" />
                <span>Ajukan Tawaran Harga</span>
              </h3>
              <button
                onClick={() => setShowNegoModal(false)}
                className="text-[#888] hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">
                  Nominal Tawaran Kamu (IDR)
                </label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  min={100000}
                  step={50000}
                  className="input-dark w-full py-2.5 px-3 text-sm font-mono font-bold text-[#39FF14]"
                  required
                />
                <div className="text-[10px] font-mono text-[#666] mt-1">
                  Harga katalog: Rp {listing.fiatEstimateIdr.toLocaleString("id-ID")}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">
                  Catatan untuk Penjual (Opsional)
                </label>
                <textarea
                  value={negoNote}
                  onChange={(e) => setNegoNote(e.target.value)}
                  rows={3}
                  className="input-dark w-full p-2.5 text-xs font-mono"
                  placeholder="Contoh: Bisa ketemuan besok siang di M Bloc / Ciwalk?"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNegoModal(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : "Kirim Tawaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
