import Link from "next/link";
import {
  Gamepad2,
  MapPin,
  ShieldCheck,
  Handshake,
  PackageCheck,
  Coins,
  ArrowUpRight,
} from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t-2 border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand */}
          <div className="space-y-3 md:col-span-5">
            <Link href="/" className="flex w-fit items-center gap-2.5">
              <span className="grid size-8 place-items-center border-2 border-lime bg-lime text-ink">
                <Gamepad2 size={16} strokeWidth={2.5} />
              </span>
              <span className="font-arcade text-sm leading-none">
                <span className="text-cream">PIX</span>
                <span className="text-lime">MART</span>
              </span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-ink">
              Pasar COD lokal untuk barang fisik. Nego langsung, ketemu di
              tempat aman, cek barangnya dulu, baru selesaikan deal.
            </p>
            <div className="inline-flex items-center gap-2 border border-line bg-ink px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-ink">
              <span className="size-2 bg-lime pulse-green" />
              Sistem online · demo mode
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3 md:col-span-2">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
              Pasar
            </div>
            <ul className="space-y-2 text-xs text-muted-ink">
              <li>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-1 transition-colors hover:text-lime"
                >
                  Katalog
                  <ArrowUpRight size={10} />
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace/new"
                  className="inline-flex items-center gap-1 transition-colors hover:text-lime"
                >
                  Pasang iklan
                  <ArrowUpRight size={10} />
                </Link>
              </li>
              <li>
                <Link
                  href="/owner"
                  className="inline-flex items-center gap-1 transition-colors hover:text-lime"
                >
                  Midman
                  <ArrowUpRight size={10} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Protocol */}
          <div className="space-y-3 md:col-span-3">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
              Aturan Main
            </div>
            <ul className="space-y-2 text-xs text-muted-ink">
              <li className="flex items-center gap-2">
                <PackageCheck size={13} className="text-lime" />
                Barang fisik legal
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={13} className="text-cyan" />
                COD, tanpa kurir
              </li>
              <li className="flex items-center gap-2">
                <Handshake size={13} className="text-pink" />
                Dual-handshake
              </li>
              <li className="flex items-center gap-2">
                <Coins size={13} className="text-amber" />
                Escrow demo
              </li>
            </ul>
          </div>

          {/* Status */}
          <div className="space-y-3 md:col-span-2">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
              Status
            </div>
            <div className="border-2 border-line bg-ink p-3">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-ink">
                Platform fee
              </div>
              <div className="font-arcade text-sm text-lime">0%</div>
              <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-ink">
                <ShieldCheck size={11} className="text-cyan" />
                Lokal &amp; transparan
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-line pt-5">
          <div className="flex flex-col items-start justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-ink sm:flex-row sm:items-center">
            <span>PIXMART © 2026 · Local arcade marketplace</span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 bg-pink" />
              Zero kontraband · barang legal only
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
