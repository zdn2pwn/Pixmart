"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Handshake,
  LockKeyhole,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Store,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@/components/ui/8bit/button";
import { Progress } from "@/components/ui/8bit/progress";

export function LiveTerminalWidget() {
  const [buyerSigned, setBuyerSigned] = useState(true);
  const [sellerSigned, setSellerSigned] = useState(false);

  const bothSigned = buyerSigned && sellerSigned;
  const progress = (Number(buyerSigned) + Number(sellerSigned)) * 50;

  function toggleSeller() {
    setSellerSigned((prev) => !prev);
  }

  function resetDemo() {
    setBuyerSigned(true);
    setSellerSigned(false);
  }

  return (
    <div className="relative overflow-hidden border-2 border-line bg-surface shadow-[6px_6px_0_0_#05040a]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-panel px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center border-2 border-lime/50 bg-lime/10 text-lime">
            <ShieldCheck size={17} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-cream">Escrow demo</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-ink">
              Dua pihak, satu keputusan
            </div>
          </div>
        </div>
        <span className="shrink-0 border border-amber/40 bg-amber/5 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber">
          Demo
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="border-2 border-line bg-ink p-3">
          <div className="flex items-center justify-between gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted-ink">
            <span>Barang COD</span>
            <span className="flex items-center gap-1">
              <MapPin size={10} className="text-muted-ink" />
              Jakarta Selatan
            </span>
          </div>
          <div className="mt-1.5 text-sm font-bold leading-snug text-cream">
            ThinkPad X230 · Libreboot · IPS
          </div>
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-2.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-ink">
              Nilai deal
            </span>
            <div className="text-right">
              <div className="font-mono text-base font-bold leading-none text-lime">
                2.1500 XMR
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-ink">
                ≈ Rp 4.500.000
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
            <span className="text-muted-ink">Verifikasi fisik</span>
            <span className={bothSigned ? "text-lime" : "text-amber"}>
              {bothSigned ? "2 / 2 acc" : "1 / 2 acc"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="border-2 border-lime/45 bg-lime/5 p-2.5">
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-lime">
                  <UserRoundCheck size={11} />
                  Buyer
                </span>
                <span className="font-mono text-[9px] font-bold text-lime">
                  ACC
                </span>
              </div>
              <div className="mt-1.5 text-[11px] leading-snug text-muted-ink">
                Barang sudah dicek
              </div>
            </div>

            <div
              className={`border-2 p-2.5 transition-colors ${
                sellerSigned
                  ? "border-lime/45 bg-lime/5"
                  : "border-line bg-ink"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${
                    sellerSigned ? "text-lime" : "text-muted-ink"
                  }`}
                >
                  <Store size={11} />
                  Seller
                </span>
                <span
                  className={`font-mono text-[9px] font-bold ${
                    sellerSigned ? "text-lime" : "text-muted-ink"
                  }`}
                >
                  {sellerSigned ? "ACC" : "WAIT"}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] leading-snug text-muted-ink">
                Serah terima fisik
              </div>
            </div>
          </div>

          <Progress
            value={progress}
            variant="retro"
            progressBg="bg-lime"
            className="h-3"
            aria-label="Progres handshake"
          />
        </div>

        {bothSigned ? (
          <div className="pop-in border-2 border-lime bg-lime/10 p-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-lime">
              <CheckCircle2 size={16} />
              Deal selesai
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">
              Kedua pihak sudah ACC. Di sistem asli, Midman baru akan merilis
              saldo demo setelah tahap ini.
            </p>
            <button
              type="button"
              onClick={resetDemo}
              className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-cream underline decoration-line underline-offset-4 transition-colors hover:text-lime"
            >
              <RotateCcw size={11} />
              Ulang simulasi
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              onClick={toggleSeller}
              className="w-full !min-h-11 !text-[10px] !font-bold"
            >
              <Handshake size={14} />
              Tekan untuk seller ACC
            </Button>
            <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-ink">
              <LockKeyhole size={10} />
              Saldo fiksi · tidak ada dana nyata
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t-2 border-line bg-panel px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-ink">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 bg-lime" />
          Live demo
        </span>
        <span>2-of-2 handshake</span>
      </div>
    </div>
  );
}
