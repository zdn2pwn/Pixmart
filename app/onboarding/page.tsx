"use client";

import { useTransition } from "react";
import { setRoleAction } from "@/app/actions/auth";
import { ShoppingBag, Store, Loader2, MapPin, ShieldCheck, MessageSquare, Package } from "lucide-react";

export default function OnboardingPage() {
  const [isPendingBuyer, startBuyer] = useTransition();
  const [isPendingSeller, startSeller] = useTransition();

  function handleRole(role: "BUYER" | "SELLER") {
    if (role === "BUYER") {
      startBuyer(async () => {
        await setRoleAction("BUYER");
      });
    } else {
      startSeller(async () => {
        await setRoleAction("SELLER");
      });
    }
  }

  const isPending = isPendingBuyer || isPendingSeller;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-[#1a1a1a] px-6 py-4">
        <span
          className="text-lg font-bold"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <span className="text-white">PIX</span>
          <span className="text-[#39FF14]">MART</span>
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#2a2a2a] text-xs font-mono text-[#39FF14] mb-2">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
              LANGKAH TERAKHIR
            </div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              PILIH PERANMU
            </h1>
            <p className="text-sm text-[#666] font-mono">
              Kamu bisa ganti peran kapan saja dari dashboard
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* BUYER */}
            <button
              onClick={() => handleRole("BUYER")}
              disabled={isPending}
              className="group relative bg-[#111] border border-[#262626] hover:border-[#39FF14] p-6 text-left transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#39FF14]/40 transition-colors">
                    <ShoppingBag size={24} className="text-[#39FF14]" />
                  </div>
                  {isPendingBuyer && (
                    <Loader2 size={18} className="animate-spin text-[#39FF14]" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1">
                    Buyer
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">
                    Saya ingin Membeli
                  </h2>
                  <p className="text-xs text-[#777] font-sans leading-relaxed">
                    Cari produk di sekitar kamu, negosiasi harga, dan bertemu langsung dengan penjual untuk COD.
                  </p>
                </div>

                <ul className="space-y-2 text-xs font-mono text-[#666]">
                  <li className="flex items-center gap-2">
                    <MapPin size={11} className="text-[#39FF14]" />
                    <span>Temukan produk berdasarkan jarak</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare size={11} className="text-[#39FF14]" />
                    <span>Negosiasi harga secara realtime</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={11} className="text-[#39FF14]" />
                    <span>Escrow COD Room terproteksi</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-[#1c1c1c]">
                  <span className="text-xs font-mono text-[#39FF14] group-hover:underline">
                    Pilih jadi Buyer →
                  </span>
                </div>
              </div>
            </button>

            {/* SELLER */}
            <button
              onClick={() => handleRole("SELLER")}
              disabled={isPending}
              className="group relative bg-[#111] border border-[#262626] hover:border-[#39FF14] p-6 text-left transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#39FF14]/40 transition-colors">
                    <Store size={24} className="text-[#39FF14]" />
                  </div>
                  {isPendingSeller && (
                    <Loader2 size={18} className="animate-spin text-[#39FF14]" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1">
                    Seller
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">
                    Saya ingin Menjual
                  </h2>
                  <p className="text-xs text-[#777] font-sans leading-relaxed">
                    Pasang iklan produk di lokasimu, terima penawaran, dan atur transaksi COD langsung dengan pembeli.
                  </p>
                </div>

                <ul className="space-y-2 text-xs font-mono text-[#666]">
                  <li className="flex items-center gap-2">
                    <Package size={11} className="text-[#39FF14]" />
                    <span>Upload produk dengan foto & harga</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare size={11} className="text-[#39FF14]" />
                    <span>Terima & balas penawaran buyer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={11} className="text-[#39FF14]" />
                    <span>Kelola transaksi COD dari dashboard</span>
                  </li>
                </ul>

                <div className="pt-2 border-t border-[#1c1c1c]">
                  <span className="text-xs font-mono text-[#39FF14] group-hover:underline">
                    Pilih jadi Seller →
                  </span>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-xs font-mono text-[#444]">
            Identitas kamu tetap anonim. Kamu bisa ganti role kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}
