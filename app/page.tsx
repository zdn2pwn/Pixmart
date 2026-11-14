import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { LiveTerminalWidget } from "@/components/landing/LiveTerminalWidget";
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Compass,
  Plus,
  Users,
  Package,
  Handshake,
  Clock,
  Check,
  X as XIcon,
} from "lucide-react";

export const instant = false;

const CITIES = ["Jakarta Selatan", "Bandung", "Surabaya", "Jakarta Pusat", "Yogyakarta", "Medan"];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Compass,
    title: "Temukan di Sekitar Kamu",
    desc: "Aktifkan lokasi atau pilih area manual. Lihat barang terdekat lengkap dengan estimasi jarak dari kamu.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Negosiasi Harga",
    desc: "Chat langsung dengan seller. Ajukan penawaran, counter, dan capai kesepakatan harga terbaik.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Escrow Room Dibuat",
    desc: "Setelah deal, sistem membuat Escrow Room. Tentukan titik pertemuan dan waktu meetup di area publik.",
  },
  {
    step: "04",
    icon: Handshake,
    title: "COD & Konfirmasi",
    desc: "Bertemu langsung. Cek barang di tempat. Buyer & Seller konfirmasi serah terima. Transaksi selesai.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  const currentRole = session?.role || "OWNER";
  const listings = store.getActiveListings();
  const metrics = store.getPlatformMetrics();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f0f0f0]">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />

      {/* HERO SECTION */}
      <section className="relative border-b border-[#1c1c1c] py-16 sm:py-24 px-4 sm:px-8 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#39FF14]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#2a2a2a] text-xs font-mono text-[#39FF14]">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
              <span className="font-bold tracking-wider">LOCAL MARKETPLACE // JUAL BELI DI SEKITAR KAMU</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Jual Beli Apa Saja. <br />
                <span className="text-[#39FF14]">Langsung. Lokal. Bebas.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#aaa] font-sans leading-relaxed max-w-xl">
                Marketplace berbasis lokasi untuk jual beli barang fisik secara langsung. Tanpa kurir, tanpa biaya tersembunyi — cukup temukan penjual terdekat, sepakati harga, dan bertemu di area publik.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/marketplace"
                className="btn-primary text-sm px-6 py-3 font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.35)]"
              >
                <span>Lihat Produk Terdekat</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/marketplace/new"
                className="btn-ghost text-sm px-5 py-3 font-medium"
              >
                + Pasang Iklan
              </Link>
            </div>

            {/* Core Guarantees */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-[#888]">
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Zero Kurir</div>
                <div className="text-[11px] text-[#666]">COD Langsung</div>
              </div>
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Anonim</div>
                <div className="text-[11px] text-[#666]">Tanpa Data Pribadi</div>
              </div>
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Escrow Room</div>
                <div className="text-[11px] text-[#666]">Transaksi Aman</div>
              </div>
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Bebas Potongan</div>
                <div className="text-[11px] text-[#666]">0% Platform Fee</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Demo Widget */}
          <div className="lg:col-span-5">
            <LiveTerminalWidget />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-b border-[#1c1c1c] bg-[#0c0c0c] py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Produk Aktif", value: `${listings.length} Listing`, color: "#39FF14", note: "Siap dinegosiasi" },
            { label: "Kota Aktif", value: `${CITIES.length} Kota`, color: "#39FF14", note: "Jabodetabek & sekitar" },
            { label: "Transaksi Berjalan", value: `${metrics.activeEscrowsCount} Escrow`, color: "#39FF14", note: "Menunggu serah terima" },
            { label: "Deal Selesai", value: `${metrics.completedDealsCount} Transaksi`, color: "#39FF14", note: "100% meetup sukses" },
          ].map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-xs font-mono text-[#666] uppercase tracking-wider">{s.label}</div>
              <div className="text-xl sm:text-2xl font-bold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[11px] font-mono text-[#555]">{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUK TERDEKAT */}
      <section className="py-16 px-4 sm:px-8 border-b border-[#1c1c1c]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider font-bold mb-1">
                PAPAN PENAWARAN TERBUKA
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Barang Siap Ditransaksikan di Kotamu
              </h2>
              <p className="text-xs sm:text-sm text-[#777] mt-1 font-sans">
                Temukan penjual terdekat, buat penawaran, dan sepakati titik pertemuan.
              </p>
            </div>

            <Link
              href="/marketplace"
              className="btn-ghost text-xs font-mono font-bold px-4 py-2.5 hover:border-[#39FF14] self-start sm:self-auto"
            >
              Lihat Semua ({listings.length}) →
            </Link>
          </div>

          {/* City Filter Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
            <span className="text-xs font-mono text-[#666] mr-2">Pilih Kota:</span>
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/marketplace?city=${encodeURIComponent(city)}`}
                className="px-3 py-1.5 bg-[#121212] border border-[#262626] hover:border-[#39FF14] hover:text-[#39FF14] text-xs font-mono text-[#aaa] transition-all flex items-center gap-1.5"
              >
                <MapPin size={11} className="text-[#39FF14]" />
                <span>{city}</span>
              </Link>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.slice(0, 6).map((listing: any) => {
              const hasImage = listing.images && listing.images.length > 0 && listing.images[0];

              return (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group bg-[#111111] border border-[#222222] hover:border-[#39FF14] transition-all flex flex-col overflow-hidden hover:shadow-[0_0_20px_rgba(57,255,20,0.12)] cursor-pointer"
                >
                  {/* Photo */}
                  <div className="relative aspect-[16/10] bg-[#161616] overflow-hidden border-b border-[#222222]">
                    {hasImage && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    {!hasImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package size={32} className="text-[#333]" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="badge-muted text-[11px] bg-black/85">
                        {listing.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="badge-green text-[11px] bg-black/85">
                        {listing.condition}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-2 leading-snug">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#777]">
                        <span>{listing.seller?.codename ?? "Seller"}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#aaa]">
                          <MapPin size={11} className="text-[#39FF14]" /> {listing.locationCity}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#1c1c1c] flex items-center justify-between font-mono">
                      <div className="text-sm font-bold text-[#39FF14]">
                        {formatCurrency(listing.fiatEstimateIdr)}
                      </div>
                      <div className="text-xs text-[#555] flex items-center gap-1">
                        <Clock size={10} />
                        <span>COD</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 sm:px-8 border-b border-[#1c1c1c] bg-[#0c0c0c]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1.5 font-bold">
              CARA KERJA
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Dari Penemuan hingga Serah Terima
            </h2>
            <p className="text-sm text-[#888] font-sans mt-1">
              Empat langkah sederhana — semuanya lokal, langsung, dan tanpa perantara.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="bg-[#111111] border border-[#222] p-5 space-y-3 hover:border-[#39FF14]/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold font-mono text-[#1e1e1e]">{step}</span>
                  <Icon size={20} className="text-[#39FF14]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">{title}</div>
                  <p className="text-xs text-[#777] font-sans leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIXMART VS MARKETPLACE KONVENSIONAL */}
      <section className="py-16 px-4 sm:px-8 border-b border-[#1c1c1c]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1.5 font-bold">
              PERBANDINGAN
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Kenapa Pilih Pixmart?
            </h2>
            <p className="text-sm text-[#888] font-sans mt-1">
              Berbeda dari marketplace konvensional — kami fokus pada transaksi lokal langsung antar individu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {/* Traditional */}
            <div className="bg-[#111111] border border-[#262626] p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#FF4444] font-mono uppercase">
                <XIcon size={16} />
                <span>Marketplace Konvensional</span>
              </div>
              <ul className="space-y-3 text-xs text-[#888] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Biaya admin, komisi seller, dan ongkos kirim yang sering tidak transparan.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Risiko kurir: paket ditukar, hilang, atau rusak dalam pengiriman.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Proses refund yang lambat dan sering bermasalah.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Tidak bisa cek kondisi barang sebelum bayar.</span>
                </li>
              </ul>
            </div>

            {/* PIXMART */}
            <div className="bg-[#121212] border border-[#39FF14]/50 p-6 space-y-4 shadow-[0_0_20px_rgba(57,255,20,0.08)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#39FF14] font-mono uppercase">
                <Check size={16} />
                <span>PIXMART Local COD</span>
              </div>
              <ul className="space-y-3 text-xs text-[#ddd] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>0% Biaya Platform:</strong> Kesepakatan harga murni antara buyer dan seller.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>Cek Fisik di Tempat:</strong> Bertemu langsung, periksa barang, baru bayar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>Escrow COD Room:</strong> Proses terstruktur — meeting point, waktu, konfirmasi dua pihak.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>Privasi Terjaga:</strong> Anonim default, lokasi detail tidak dipublikasikan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider font-bold">
            MULAI SEKARANG
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Siap jual atau beli di sekitar kamu?
          </h2>
          <p className="text-sm text-[#888] font-sans leading-relaxed">
            Daftar anonim, pasang iklan gratis, atau langsung cari produk terdekat dari lokasimu sekarang.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <Link
              href="/marketplace"
              className="btn-primary text-sm px-7 py-3 font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.3)]"
            >
              <Compass size={15} />
              <span>Jelajahi Produk Lokal</span>
            </Link>
            <Link
              href="/marketplace/new"
              className="btn-ghost text-sm px-6 py-3 font-medium flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Pasang Iklan Gratis</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
