import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { formatBtc, formatXmr, formatCurrency } from "@/lib/format";
import { LiveTerminalWidget } from "@/components/landing/LiveTerminalWidget";
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Compass,
  Plus,
  Coins,
  Cpu,
  Layers,
  Check,
  X as XIcon,
} from "lucide-react";

export const instant = false;

const CITIES = ["Jakarta Selatan", "Bandung", "Surabaya", "Jakarta Pusat", "Yogyakarta", "Medan"];

export default async function HomePage() {
  const session = await getSession();
  const currentRole = session?.role || "OWNER";
  const listings = store.getActiveListings();
  const metrics = store.getPlatformMetrics();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f0f0f0]">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />

      {/* HERO SECTION — SOVEREIGN MANIFESTO & INTERACTIVE TERMINAL */}
      <section className="relative border-b border-[#1c1c1c] py-16 sm:py-24 px-4 sm:px-8 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[#39FF14]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Slogan & Sovereign Ethos */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#2a2a2a] text-xs font-mono text-[#39FF14]">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
              <span className="font-bold tracking-wider">SOVEREIGN P2P ESCROW // DESENTRALISASI PENUH</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Jual Beli Bebas. <br />
                <span className="text-[#39FF14]">Tanpa Bank. Tanpa Sensor.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#aaa] font-sans leading-relaxed max-w-xl">
                Pasar peer-to-peer independen untuk memperjualbelikan barang fisik apa saja langsung antar manusia. Tanpa campur tangan birokrasi, tanpa pelacakan rekening, dan tanpa perantara pihak ketiga.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/marketplace"
                className="btn-primary text-sm px-6 py-3 font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.35)]"
              >
                <span>Buka Pasar Terbuka</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/marketplace/new"
                className="btn-ghost text-sm px-5 py-3 font-medium"
              >
                + Pasang Iklan Bebas
              </Link>
            </div>

            {/* Sovereign Core Guarantees */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-[#888]">
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Nol KYC</div>
                <div className="text-[11px] text-[#666]">Tanpa KTP / Data Pribadi</div>
              </div>
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Multisig 2-of-2</div>
                <div className="text-[11px] text-[#666]">BTC &amp; XMR Vault</div>
              </div>
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Tatap Muka</div>
                <div className="text-[11px] text-[#666]">Bebas Risiko Kurir</div>
              </div>
              <div className="p-2.5 bg-[#111111] border border-[#222]">
                <div className="text-[#39FF14] font-bold mb-0.5">Anti-Sita</div>
                <div className="text-[11px] text-[#666]">Tanpa Blokir Rekening</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Handshake Simulator */}
          <div className="lg:col-span-5">
            <LiveTerminalWidget />
          </div>
        </div>
      </section>

      {/* LIVE VOLUME & SETTLEMENT STRIP */}
      <section className="border-b border-[#1c1c1c] bg-[#0c0c0c] py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Volume Bitcoin Transaksi", value: formatBtc(metrics.totalVolumeBtc), color: "#F7931A", note: "Tersirkulasi di multisig" },
            { label: "Volume Monero Anonim", value: formatXmr(metrics.totalVolumeXmr), color: "#FF6600", note: "Stealth ring transactions" },
            { label: "Deals Sedang Berlangsung", value: `${metrics.activeEscrowsCount} Transaksi`, color: "#39FF14", note: "Menunggu serah terima" },
            { label: "Deals Sukses Terverifikasi", value: `${metrics.completedDealsCount} Transaksi`, color: "#39FF14", note: "100% tanpa sengketa" },
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

      {/* OPEN MARKETPLACE DIRECTORY FRONT & CENTER */}
      <section className="py-16 px-4 sm:px-8 border-b border-[#1c1c1c]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider font-bold mb-1">
                PAPAN PENAWARAN TERBUKA
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Barang Siap Ditransaksikan di Kota Anda
              </h2>
              <p className="text-xs sm:text-sm text-[#777] mt-1 font-sans">
                Hubungi penjual, kunci escrow, dan sepakati pertemuan tatap muka di area publik.
              </p>
            </div>

            <Link
              href="/marketplace"
              className="btn-ghost text-xs font-mono font-bold px-4 py-2.5 hover:border-[#39FF14] self-start sm:self-auto"
            >
              Lihat Seluruh Barang ({listings.length}) →
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
            {listings.slice(0, 6).map((listing) => {
              const hasImage = listing.images && listing.images.length > 0 && listing.images[0];

              return (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group bg-[#111111] border border-[#222222] hover:border-[#39FF14] transition-all flex flex-col overflow-hidden hover:shadow-[0_0_20px_rgba(57,255,20,0.12)] cursor-pointer"
                >
                  {/* Photo with aspect ratio */}
                  <div className="relative aspect-[16/10] bg-[#161616] overflow-hidden border-b border-[#222222]">
                    {hasImage && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
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
                        <span>{listing.seller.codename}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[#aaa]">
                          <MapPin size={11} className="text-[#39FF14]" /> {listing.locationCity}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#1c1c1c] flex items-center justify-between font-mono">
                      <div>
                        <div className="text-sm font-bold text-[#FF6600]">
                          {formatXmr(listing.priceXmr)}
                        </div>
                        <div className="text-[11px] text-[#F7931A]">
                          {formatBtc(listing.priceBtc)}
                        </div>
                      </div>
                      <div className="text-xs text-[#777]">
                        ≈ {formatCurrency(listing.fiatEstimateIdr)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPARISON: PIXMART VS TRADITIONAL FINANCIAL SYSTEM */}
      <section className="py-16 px-4 sm:px-8 border-b border-[#1c1c1c] bg-[#0c0c0c]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1.5 font-bold">
              PERBANDINGAN PROTOKOL
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Mengapa Bertransaksi Tanpa Perantara Terpusat?
            </h2>
            <p className="text-sm text-[#888] font-sans mt-1">
              Bandingkan pasar bebas terdesentralisasi dengan platform e-commerce konvensional yang diawasi lembaga perbankan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {/* Traditional Platform Card */}
            <div className="bg-[#111111] border border-[#262626] p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#FF4444] font-mono uppercase">
                <XIcon size={16} />
                <span>Marketplace / Bank Konvensional</span>
              </div>
              <ul className="space-y-3 text-xs text-[#888] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Wajib upload KTP, foto selfie, dan verifikasi rekening bank terpusat.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Rekening dan dana bisa dibekukan sepihak sewaktu-waktu oleh pihak ketiga.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Potongan biaya admin, pajak transaksi, dan biaya penanganan yang tinggi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF4444] font-bold">✕</span>
                  <span>Ketergantungan kurir ekspedisi dengan risiko paket ditukar atau hilang.</span>
                </li>
              </ul>
            </div>

            {/* PIXMART Card */}
            <div className="bg-[#121212] border border-[#39FF14]/50 p-6 space-y-4 shadow-[0_0_20px_rgba(57,255,20,0.08)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#39FF14] font-mono uppercase">
                <Check size={16} />
                <span>PIXMART Sovereign Protocol</span>
              </div>
              <ul className="space-y-3 text-xs text-[#ddd] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>100% Anonim:</strong> Tanpa KYC, tanpa verifikasi identitas, tanpa birokrasi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>Multisig Vault:</strong> Koin disimpan di blockchain, mustahil disita siapa pun.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>Bebas Potongan Pajak:</strong> Kesepakatan harga langsung murni antar individu.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#39FF14] font-bold">✓</span>
                  <span><strong>Serah Terima Fisik (COD):</strong> Cek barang di tempat, setuju baru cair.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
