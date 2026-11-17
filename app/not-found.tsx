import Link from "next/link";
import { Compass, Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center text-cream">
      <div className="max-w-md">
        <div className="font-arcade text-6xl leading-none text-lime sm:text-7xl">
          404
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-ink">
          <AlertTriangle size={12} className="text-amber" />
          Page not found
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-cream sm:text-3xl">
          Rute ini nggak ada di arcade.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-ink">
          Halaman yang kamu cari mungkin sudah dipindah, dihapus, atau memang
          tidak pernah ada. Balik ke home atau buka katalog.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-primary !border-lime !bg-lime !text-ink hover:!bg-lime/80"
          >
            <Home size={15} />
            Ke home
          </Link>
          <Link
            href="/marketplace"
            className="group inline-flex items-center gap-1.5 border-b-2 border-line py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cream transition-colors hover:border-lime hover:text-lime"
          >
            <Compass size={14} />
            Buka katalog
          </Link>
        </div>

        <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-ink/60">
          PIXMART · local arcade market
        </div>
      </div>
    </main>
  );
}