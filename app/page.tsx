import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { getSimpleSession } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LiveTerminalWidget } from "@/components/landing/LiveTerminalWidget";
import { Reveal } from "@/components/landing/Reveal";
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Compass,
  Plus,
  Check,
  X,
  Coins,
  LockKeyhole,
  Trophy,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CITIES = [
  "Jakarta Selatan",
  "Bandung",
  "Surabaya",
  "Jakarta Pusat",
  "Yogyakarta",
  "Medan",
];

const STEPS = [
  {
    step: "01",
    title: "Cari di kotamu",
    desc: "Filter kota, lihat barang yang memang ada di sekitar. Nggak ada ongkir siluman.",
  },
  {
    step: "02",
    title: "Nego langsung",
    desc: "Tanya kondisi, minta foto tambahan, tawar harga. Semua di satu ruang chat.",
  },
  {
    step: "03",
    title: "Kunci deal",
    desc: "Buyer dan seller sama-sama setuju. Ruang escrow mencatat harga dan titik temunya.",
  },
  {
    step: "04",
    title: "Cek, lalu serahkan",
    desc: "Ketemu di tempat publik, tes barangnya, konfirmasi handshake. Selesai.",
  },
];

const COMPARISON_ROWS = [
  { label: "Cek barang sebelum bayar", pixmart: "Bisa", biasa: "Tidak" },
  { label: "Biaya platform", pixmart: "0%", biasa: "Ada" },
  { label: "Cara terima barang", pixmart: "COD", biasa: "Kurir" },
  { label: "Data yang tampil", pixmart: "Codename", biasa: "Nomor HP" },
  { label: "Kalau ada masalah", pixmart: "Midman", biasa: "Form refund" },
];

const LEADERBOARD = [
  { rank: 1, name: "ANONYMOUS SELLER #CRUD", city: "Jakarta Selatan", score: 4820, badge: "LVL 9" },
  { rank: 2, name: "BYTE HUNTER", city: "Bandung", score: 4105, badge: "LVL 8" },
  { rank: 3, name: "PIXEL TRADER", city: "Surabaya", score: 3770, badge: "LVL 7" },
  { rank: 4, name: "RETRO DEALER", city: "Yogyakarta", score: 2950, badge: "LVL 6" },
  { rank: 5, name: "NEON MERCHANT", city: "Medan", score: 2410, badge: "LVL 5" },
];

export default async function HomePage() {
  const session = await getSimpleSession();
  const currentRole = session?.role || "BUYER";
  const supabase = await createSupabaseServerClient();

  const { data: listingsData } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(8);

  const listings = listingsData || [];

  return (
    <div className="flex min-h-screen flex-col bg-ink text-cream">
      <PublicNav
        currentRole={currentRole}
        codename={session?.codename}
        isLoggedIn={!!session}
      />

      <main className="flex-1">
        {/* HERO — dark, pixel starfield bg, cabinet on right */}
        <section className="relative overflow-hidden border-b-2 border-line bg-ink">
          <PixelStarfield />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-20">
            <div>
              <div className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-ink">
                <span className="size-2 bg-lime" />
                <span>PIXMART</span>
                <span className="h-px w-10 bg-line" />
                <span>Pasar COD lokal</span>
              </div>

              <h1 className="mt-7 text-[clamp(2.6rem,8vw,5.8rem)] font-bold leading-[0.93] tracking-[-0.05em] text-cream">
                Barang nyata.
                <br />
                Deal di{" "}
                <span className="relative inline-block text-lime">
                  kota sendiri
                </span>
                .
              </h1>

              <p className="mt-7 max-w-md text-base leading-relaxed text-muted-ink sm:text-[17px]">
                Cari barang yang memang ada di sekitarmu. Nego langsung dengan
                penjual, ketemu di tempat aman, cek barangnya dulu. PIXMART cuma
                mencatat deal-nya.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/marketplace"
                  className="btn-primary !border-lime !bg-lime !text-ink hover:!bg-lime/80"
                >
                  <Compass size={15} />
                  Cari barang
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/marketplace/new"
                  className="group inline-flex items-center gap-1.5 border-b-2 border-line py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cream transition-colors hover:border-lime hover:text-lime"
                >
                  <Plus size={14} />
                  Jual barang
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-2 border-t-2 border-line pt-5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-ink">
                <span className="flex items-center gap-2">
                  <MapPin size={12} className="text-lime" />
                  COD ketemu langsung
                </span>
                <span className="flex items-center gap-2">
                  <Coins size={12} className="text-lime" />
                  0% biaya platform
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={12} className="text-lime" />
                  Escrow demo
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end">
              <PixelCabinet />
            </div>
          </div>
        </section>

        {/* CITY STRIP */}
        <section className="border-b-2 border-line bg-surface px-4 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-ink">
              Kota aktif
            </span>
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/marketplace?city=${encodeURIComponent(city)}`}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cream transition-colors hover:text-lime"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>

        {/* LEADERBOARD — playful, no products */}
        <section className="border-b-2 border-line bg-ink px-4 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
                  Papan skor
                </p>
                <h2 className="mt-2 font-arcade text-xl leading-snug tracking-[0.02em] text-cream sm:text-2xl">
                  Pemain teratas minggu ini.
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-ink">
                  Demo data. Skor naik tiap deal selesai dan review positif.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-ink">
                <Trophy size={14} className="text-amber" />
                {String(LEADERBOARD.length).padStart(2, "0")} pemain
              </div>
            </div>

            <div className="mt-8 overflow-hidden border border-line">
              <div className="grid grid-cols-[40px_1fr_90px_70px] gap-2 border-b border-line bg-surface px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted-ink sm:grid-cols-[48px_1fr_120px_90px_80px] sm:text-[10px]">
                <span>#</span>
                <span>Pemain</span>
                <span className="hidden sm:block">Kota</span>
                <span>Skor</span>
                <span className="hidden sm:block text-right">Level</span>
              </div>
              {LEADERBOARD.map((p) => (
                <div
                  key={p.rank}
                  className="grid grid-cols-[40px_1fr_90px_70px] items-center gap-2 border-b border-line px-4 py-3 last:border-b-0 transition-colors hover:bg-surface/60 sm:grid-cols-[48px_1fr_120px_90px_80px]"
                >
                  <span
                    className={`font-arcade text-xs ${
                      p.rank === 1
                        ? "text-amber"
                        : p.rank === 2
                          ? "text-muted-ink"
                          : p.rank === 3
                            ? "text-amber/60"
                            : "text-muted-ink/60"
                    }`}
                  >
                    {String(p.rank).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`grid size-7 shrink-0 place-items-center border font-arcade text-[9px] ${
                        p.rank === 1
                          ? "border-amber bg-amber/10 text-amber"
                          : "border-line bg-ink text-muted-ink"
                      }`}
                    >
                      {p.name.slice(0, 1)}
                    </span>
                    <span className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-cream">
                      {p.name}
                    </span>
                    {p.rank === 1 && (
                      <Star size={11} className="shrink-0 text-amber" fill="currentColor" />
                    )}
                  </div>
                  <span className="hidden truncate font-mono text-[10px] text-muted-ink sm:block">
                    {p.city}
                  </span>
                  <span className="font-mono text-sm font-bold text-lime">
                    {p.score.toLocaleString("id-ID")}
                  </span>
                  <span className="hidden text-right font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-ink sm:block">
                    {p.badge}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] leading-relaxed text-muted-ink">
                Skor dan level adalah simulasi demo, bukan uang nyata.
              </p>
              <Link
                href="/marketplace"
                className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-cream transition-colors hover:text-lime"
              >
                Ikut main
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* DEMO */}
        <section className="border-b-2 border-line bg-surface px-4 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
                Coba alurnya
              </p>
              <h2 className="mt-2 font-arcade text-xl leading-snug tracking-[0.02em] text-cream sm:text-2xl">
                Escrow yang bisa kamu tekan sendiri.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-ink">
                Ini bukan video. Tombol seller ACC di samping benar-benar
                mengubah state demo.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  "Buyer cek barang, seller serahkan. Deal selesai kalau dua-duanya setuju.",
                  "Harga, titik temu, dan status tersimpan rapi di ruang escrow.",
                  "Saldo dan crypto cuma pemanis demo. Tidak ada uang yang bergerak.",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex gap-3 text-[13px] leading-relaxed text-muted-ink"
                  >
                    <span className="mt-2 size-1 shrink-0 bg-lime" />
                    {t}
                  </li>
                ))}
              </ul>

              <span className="mt-6 inline-flex items-center gap-2 border border-amber/40 bg-amber/5 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber">
                <LockKeyhole size={11} />
                Demo · no real funds
              </span>
            </div>

            <div className="w-full">
              <LiveTerminalWidget />
            </div>
          </Reveal>
        </section>

        {/* ALUR — light contrast */}
        <section
          id="cara-main"
          className="scroll-mt-24 border-b-2 border-line bg-cream px-4 py-16 text-ink sm:px-8 sm:py-20"
        >
          <Reveal className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
                Alur main
              </p>
              <h2 className="mt-2 font-arcade text-xl leading-snug tracking-[0.02em] text-ink sm:text-2xl">
                Empat langkah, nggak pakai ribet.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/60">
                Dari nemu barang sampai serah terima. Semua bisa dilakukan di
                satu tempat.
              </p>
            </div>

            <ol className="border-t-2 border-ink">
              {STEPS.map((item) => (
                <li
                  key={item.step}
                  className="group grid grid-cols-[40px_1fr] gap-4 border-b-2 border-ink py-5 sm:grid-cols-[64px_1fr] sm:gap-6 sm:py-6"
                >
                  <span className="font-arcade text-sm leading-none text-ink/25 transition-colors group-hover:text-ink sm:text-base">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-ink sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink/60">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* PERBANDINGAN */}
        <section
          id="kenapa-pixmart"
          className="scroll-mt-24 border-b-2 border-line bg-ink px-4 py-16 sm:px-8 sm:py-20"
        >
          <Reveal className="mx-auto max-w-5xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
              Bandingkan
            </p>
            <h2 className="mt-2 font-arcade text-xl leading-snug tracking-[0.02em] text-cream sm:text-2xl">
              Kenapa bukan marketplace biasa?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-ink">
              PIXMART dibuat untuk barang fisik yang bisa kamu pegang dulu
              sebelum bayar.
            </p>

            <div className="mt-8 overflow-hidden border border-line">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.9fr] border-b border-line bg-surface px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted-ink sm:text-[10px]">
                <span>Yang kamu dapat</span>
                <span className="text-lime">PIXMART</span>
                <span>Biasa</span>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.4fr_0.8fr_0.9fr] items-center border-b border-line px-4 py-3 last:border-b-0"
                >
                  <span className="text-[12px] font-medium leading-snug text-cream sm:text-[13px]">
                    {row.label}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-lime sm:text-[11px]">
                    <Check size={10} strokeWidth={3} />
                    {row.pixmart}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-ink sm:text-[11px]">
                    <X size={10} strokeWidth={3} />
                    {row.biasa}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-ink">
              Escrow dan saldo di PIXMART adalah simulasi demo.
            </p>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="bg-lime px-4 py-14 text-ink sm:px-8 sm:py-18">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                Insert coin
              </p>
              <h2 className="mt-2 font-arcade text-xl leading-snug tracking-[0.02em] text-ink sm:text-2xl">
                Barang lama kamu bisa jadi deal hari ini.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/65">
                Pasang iklan gratis, atur sendiri harga dan titik temunya.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href="/marketplace/new"
                className="btn-primary !border-ink !bg-ink !text-cream hover:!bg-panel-2"
              >
                <Plus size={15} strokeWidth={3} />
                Pasang iklan
              </Link>
              <Link
                href="/marketplace"
                className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink/70 transition-colors hover:text-ink"
              >
                Cari barang →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function PixelStarfield() {
  // fixed pseudo-random positions for pixel "stars"
  const stars = [
    { x: 4, y: 8, s: 2, c: "#C8FF4D", o: 0.7 },
    { x: 12, y: 22, s: 1, c: "#F5F0E6", o: 0.4 },
    { x: 18, y: 6, s: 2, c: "#F5F0E6", o: 0.5 },
    { x: 27, y: 14, s: 1, c: "#57E6F0", o: 0.6 },
    { x: 33, y: 30, s: 2, c: "#F5F0E6", o: 0.3 },
    { x: 41, y: 9, s: 1, c: "#C8FF4D", o: 0.5 },
    { x: 49, y: 24, s: 2, c: "#F5F0E6", o: 0.4 },
    { x: 56, y: 5, s: 1, c: "#FF6FA8", o: 0.5 },
    { x: 63, y: 18, s: 2, c: "#F5F0E6", o: 0.6 },
    { x: 71, y: 32, s: 1, c: "#C8FF4D", o: 0.4 },
    { x: 79, y: 11, s: 2, c: "#F5F0E6", o: 0.5 },
    { x: 86, y: 27, s: 1, c: "#57E6F0", o: 0.6 },
    { x: 93, y: 7, s: 2, c: "#F5F0E6", o: 0.4 },
    { x: 99, y: 21, s: 1, c: "#C8FF4D", o: 0.5 },
    { x: 6, y: 42, s: 1, c: "#F5F0E6", o: 0.3 },
    { x: 22, y: 48, s: 2, c: "#F5F0E6", o: 0.4 },
    { x: 38, y: 44, s: 1, c: "#FFC857", o: 0.5 },
    { x: 52, y: 52, s: 2, c: "#F5F0E6", o: 0.3 },
    { x: 68, y: 46, s: 1, c: "#C8FF4D", o: 0.4 },
    { x: 84, y: 50, s: 2, c: "#F5F0E6", o: 0.5 },
    { x: 97, y: 44, s: 1, c: "#57E6F0", o: 0.4 },
    { x: 14, y: 62, s: 1, c: "#F5F0E6", o: 0.3 },
    { x: 30, y: 68, s: 2, c: "#F5F0E6", o: 0.4 },
    { x: 46, y: 60, s: 1, c: "#FF6FA8", o: 0.4 },
    { x: 62, y: 70, s: 2, c: "#F5F0E6", o: 0.3 },
    { x: 78, y: 64, s: 1, c: "#C8FF4D", o: 0.5 },
    { x: 92, y: 72, s: 2, c: "#F5F0E6", o: 0.4 },
    // larger pixel blocks as "distant buildings"
    { x: 8, y: 80, s: 6, c: "#19152B", o: 0.6 },
    { x: 20, y: 76, s: 4, c: "#19152B", o: 0.5 },
    { x: 72, y: 78, s: 8, c: "#19152B", o: 0.6 },
    { x: 88, y: 82, s: 5, c: "#19152B", o: 0.5 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {stars.map((st, i) => (
          <rect
            key={i}
            x={st.x}
            y={st.y}
            width={st.s}
            height={st.s}
            fill={st.c}
            opacity={st.o}
          />
        ))}
      </svg>
      {/* scanline overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #F5F0E6 0 1px, transparent 1px 3px)",
        }}
      />
    </div>
  );
}

function PixelCabinet() {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute -left-3 top-8 size-3 bg-lime/80 float-slow"
      />
      <span
        aria-hidden="true"
        className="absolute -right-2 top-2 size-2 bg-cyan/80 float-slow"
        style={{ animationDelay: "0.6s" }}
      />
      <span
        aria-hidden="true"
        className="absolute bottom-10 -left-4 size-2 bg-pink/70 float-slow"
        style={{ animationDelay: "1.1s" }}
      />

      <svg
        viewBox="0 0 220 300"
        className="w-full drop-shadow-[0_8px_0_#05040a]"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="20" y="270" width="180" height="16" fill="#0A0812" />
        <rect x="20" y="270" width="180" height="3" fill="#19152B" />

        <rect x="34" y="24" width="152" height="248" fill="#19152B" />
        <rect x="34" y="24" width="152" height="6" fill="#3A3157" />
        <rect x="34" y="24" width="6" height="248" fill="#0A0812" opacity="0.4" />
        <rect x="180" y="24" width="6" height="248" fill="#0A0812" opacity="0.6" />

        <rect x="46" y="34" width="128" height="22" fill="#12101F" />
        <rect x="46" y="34" width="128" height="2" fill="#3A3157" />
        <text
          x="110"
          y="49"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="11"
          fontWeight="bold"
          fill="#C8FF4D"
          letterSpacing="2"
        >
          PIXMART
        </text>

        <rect x="46" y="62" width="128" height="96" fill="#0A0812" />
        <rect x="52" y="68" width="116" height="84" fill="#05040a" />
        <rect
          x="52"
          y="68"
          width="116"
          height="84"
          fill="#C8FF4D"
          style={{ opacity: 0.04 }}
        />

        <rect x="62" y="118" width="18" height="18" fill="#3A3157" />
        <rect x="62" y="114" width="18" height="4" fill="#57E6F0" opacity="0.7" />
        <rect x="86" y="110" width="22" height="26" fill="#3A3157" />
        <rect x="86" y="106" width="22" height="4" fill="#FF6FA8" opacity="0.7" />
        <rect x="114" y="122" width="14" height="14" fill="#3A3157" />
        <rect x="114" y="118" width="14" height="4" fill="#FFC857" opacity="0.7" />
        <rect x="138" y="128" width="6" height="8" fill="#C8FF4D" />
        <rect x="138" y="124" width="6" height="4" fill="#F5F0E6" />

        <rect x="58" y="74" width="2" height="2" fill="#F5F0E6" opacity="0.6" />
        <rect x="78" y="82" width="2" height="2" fill="#F5F0E6" opacity="0.4" />
        <rect x="148" y="76" width="2" height="2" fill="#F5F0E6" opacity="0.5" />
        <rect x="100" y="78" width="2" height="2" fill="#C8FF4D" opacity="0.8" />

        <rect x="52" y="90" width="116" height="1" fill="#C8FF4D" opacity="0.15" />

        <rect x="46" y="164" width="128" height="40" fill="#12101F" />
        <rect x="46" y="164" width="128" height="2" fill="#3A3157" />
        <circle cx="70" cy="184" r="9" fill="#0A0812" />
        <circle cx="70" cy="184" r="4" fill="#FF6FA8" />
        <circle cx="132" cy="178" r="4" fill="#57E6F0" />
        <circle cx="144" cy="188" r="4" fill="#C8FF4D" />
        <circle cx="120" cy="188" r="4" fill="#FFC857" />

        <rect x="100" y="206" width="20" height="4" fill="#0A0812" />
        <rect x="100" y="206" width="20" height="1" fill="#3A3157" />

        <rect x="56" y="218" width="40" height="6" fill="#0A0812" opacity="0.5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x={60 + i * 6}
            y="220"
            width="2"
            height="2"
            fill="#3A3157"
          />
        ))}

        <rect x="120" y="218" width="52" height="14" fill="#0A0812" />
        <text
          x="146"
          y="228"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="8"
          fontWeight="bold"
          fill="#C8FF4D"
        >
          00420
        </text>
      </svg>

      <div className="mt-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-ink">
        Insert coin · demo
      </div>
    </div>
  );
}