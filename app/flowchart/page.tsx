import { ArrowDown, Circle } from "lucide-react";

export const metadata = {
  title: "Flowchart | PIXMART",
  description: "Flowchart alur aplikasi PIXMART.",
};

type Tone = "buyer" | "seller" | "midman" | "neutral";

const TONE: Record<Tone, string> = {
  buyer: "border-emerald-400/60 bg-emerald-400/5 text-emerald-100",
  seller: "border-sky-400/60 bg-sky-400/5 text-sky-100",
  midman: "border-amber-400/60 bg-amber-400/5 text-amber-100",
  neutral: "border-white/15 bg-white/5 text-cream",
};

function Node({ title, desc, tone = "neutral" }: { title: string; desc?: string; tone?: Tone }) {
  return (
    <div className={`rounded-md border px-4 py-3 ${TONE[tone]}`}>
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      {desc && <div className="mt-1 text-[12px] leading-snug opacity-80">{desc}</div>}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center py-1 text-muted-ink">
      <ArrowDown size={16} />
    </div>
  );
}

function Branch({ label }: { label: string }) {
  return (
    <div className="my-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink">
      {label}
    </div>
  );
}

export default function FlowchartPage() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
          Alur aplikasi
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Flowchart PIXMART
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-ink">
          Alur end-to-end dari landing, autentikasi, onboarding, hingga transaksi
          escrow untuk tiga peran utama.
        </p>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className="flex items-center gap-2 rounded border border-emerald-400/40 bg-emerald-400/5 px-2.5 py-1 text-emerald-100">
            <Circle size={8} className="fill-emerald-400 text-emerald-400" /> Buyer
          </span>
          <span className="flex items-center gap-2 rounded border border-sky-400/40 bg-sky-400/5 px-2.5 py-1 text-sky-100">
            <Circle size={8} className="fill-sky-400 text-sky-400" /> Seller
          </span>
          <span className="flex items-center gap-2 rounded border border-amber-400/40 bg-amber-400/5 px-2.5 py-1 text-amber-100">
            <Circle size={8} className="fill-amber-400 text-amber-400" /> Midman
          </span>
          <span className="flex items-center gap-2 rounded border border-white/15 bg-white/5 px-2.5 py-1 text-cream">
            <Circle size={8} className="fill-white/60 text-white/60" /> Umum
          </span>
        </div>

        {/* Entry & Auth */}
        <section className="mt-8">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-ink">
            1. Masuk & autentikasi
          </h2>
          <div className="mt-3 space-y-2">
            <Node title="Landing /" desc="Halaman utama PIXMART" />
            <Arrow />
            <Node title="Punya akun?" desc="Login atau register" />
            <Arrow />
            <div className="grid gap-2 sm:grid-cols-2">
              <Node title="Login" desc="Verifikasi email & password" />
              <Node title="Register" desc="Buat akun baru" />
            </div>
            <Arrow />
            <Node title="Onboarding" desc="Pilih role & isi wallet" />
            <Arrow />
            <Node title="Setup selesai?" desc="Belum: onboarding, Sudah: ke role" />
            <Arrow />
            <Node title="Role" desc="Buyer / Seller / Midman" />
          </div>
        </section>

        {/* Buyer */}
        <section className="mt-10">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            2. Alur Buyer
          </h2>
          <div className="mt-3 space-y-2">
            <Node title="Buyer Dashboard" tone="buyer" />
            <Arrow />
            <Node title="Marketplace" desc="Filter kota, kategori, radius" tone="buyer" />
            <Arrow />
            <Node title="Detail Produk" desc="Lihat info & wishlist" tone="buyer" />
            <Arrow />
            <Node title="Negosiasi" desc="Chat & penawaran harga" tone="buyer" />
            <Arrow />
            <Node title="Escrow" desc="Proposal, konfirmasi, kedatangan, handshake" tone="buyer" />
            <Arrow />
            <Node title="Selesai" desc="Transaksi tuntas" tone="buyer" />
            <Branch label="juga" />
            <Node title="Profil" desc="Wallet & reputasi" tone="buyer" />
          </div>
        </section>

        {/* Seller */}
        <section className="mt-10">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
            3. Alur Seller
          </h2>
          <div className="mt-3 space-y-2">
            <Node title="Seller Dashboard" tone="seller" />
            <Arrow />
            <Node title="Pasang/Edit Iklan" desc="Stok & lokasi" tone="seller" />
            <Arrow />
            <Node title="Listing ACTIVE" desc="Tampil di marketplace" tone="seller" />
            <Arrow />
            <Node title="Negosiasi Masuk" desc="Respon penawaran buyer" tone="seller" />
          </div>
        </section>

        {/* Midman */}
        <section className="mt-10">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
            4. Alur Midman (Owner)
          </h2>
          <div className="mt-3 space-y-2">
            <Node title="Midman Dashboard" tone="midman" />
            <Arrow />
            <Node title="Antrian Escrow" desc="Transaksi butuh aksi" tone="midman" />
            <Arrow />
            <Node title="Verifikasi & Rilis Dana" desc="Setelah handshake dua pihak" tone="midman" />
          </div>
        </section>

        {/* Shared */}
        <section className="mt-10">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-ink">
            5. Bersama
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Node title="Notifikasi" desc="Bell & dropdown" />
            <Node title="Wishlist" desc="Simpan listing" />
            <Node title="404 Arcade" desc="Halaman tidak ditemukan" />
          </div>
        </section>
      </div>
    </main>
  );
}
