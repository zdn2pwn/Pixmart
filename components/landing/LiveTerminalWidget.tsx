"use client";

import { useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";

export function LiveTerminalWidget() {
  const [buyerSigned, setBuyerSigned] = useState(true);
  const [sellerSigned, setSellerSigned] = useState(false);

  const bothSigned = buyerSigned && sellerSigned;

  function toggleSeller() {
    setSellerSigned((prev) => !prev);
  }

  function resetDemo() {
    setBuyerSigned(true);
    setSellerSigned(false);
  }

  return (
    <div className="bg-[#121212] border border-[#262626] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden font-mono">
      {/* Terminal Title Bar */}
      <div className="bg-[#181818] px-4 py-2.5 border-b border-[#262626] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] pulse-green" />
          <span className="font-bold text-[#e8e8e8] tracking-wider text-[11px]">
            ESCROW_RADAR // ACTIVE_DEAL
          </span>
        </div>
        <span className="text-[10px] text-[#39FF14] font-bold tracking-widest uppercase">
          LIVE DEMO
        </span>
      </div>

      {/* Terminal Content */}
      <div className="p-5 space-y-4 text-xs">
        {/* Deal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div>
            <div className="text-[10px] text-[#777] uppercase tracking-wider mb-0.5">
              Barang Terkunci di Multisig
            </div>
            <div className="font-bold text-white text-sm">
              ThinkPad X230 Libreboot IPS Mod
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#aaa] mt-1">
              <MapPin size={11} className="text-[#39FF14]" />
              <span>Meetup: Blok M Square, Jakarta Selatan</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#777] uppercase tracking-wider mb-0.5">
              Escrow Vault
            </div>
            <div className="text-base font-bold text-[#FF6600]">
              2.1500 XMR
            </div>
            <div className="text-[10px] text-[#555]">
              ≈ Rp 4.500.000
            </div>
          </div>
        </div>

        {/* Handshake Step Visualizer */}
        <div className="space-y-2 py-1">
          <div className="text-[10px] text-[#777] uppercase tracking-wider flex items-center justify-between">
            <span>Protokol Verifikasi Fisik:</span>
            <span className="text-[#39FF14] font-bold">
              {bothSigned ? "100% RELEASED" : "AWAITING HANDSHAKE"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Buyer Status */}
            <div
              className={`p-2.5 border transition-all ${
                buyerSigned
                  ? "border-[#39FF14]/40 bg-[#39FF14]/5 text-[#39FF14]"
                  : "border-[#2a2a2a] bg-[#161616] text-[#777]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[10px]">1. BUYER (ACC)</span>
                <span className="text-[10px] font-bold">
                  {buyerSigned ? "✓ SUDAH ACC" : "PENDING"}
                </span>
              </div>
              <div className="text-[10px] text-[#888]">
                Barang sudah dites &amp; cocok
              </div>
            </div>

            {/* Seller Status */}
            <div
              className={`p-2.5 border transition-all ${
                sellerSigned
                  ? "border-[#39FF14]/40 bg-[#39FF14]/5 text-[#39FF14]"
                  : "border-[#2a2a2a] bg-[#161616] text-[#777]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[10px]">2. SELLER (ACC)</span>
                <span className="text-[10px] font-bold">
                  {sellerSigned ? "✓ SUDAH ACC" : "BELUM ACC"}
                </span>
              </div>
              <div className="text-[10px] text-[#888]">
                Serah terima fisik di tempat
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Simulation Action */}
        <div className="pt-2 border-t border-[#1f1f1f]">
          {bothSigned ? (
            <div className="bg-[#39FF14]/10 border border-[#39FF14]/40 p-3 text-center space-y-2">
              <div className="text-[#39FF14] font-bold text-xs flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>DUAL-HANDSHAKE SELESAI — DANA SUDAH CAIR!</span>
              </div>
              <p className="text-[10px] text-[#aaa] font-sans">
                Dana 2.15 XMR berhasil diteruskan secara instan ke wallet seller.
              </p>
              <button
                type="button"
                onClick={resetDemo}
                className="text-[10px] text-[#888] hover:text-white underline cursor-pointer"
              >
                Reset Simulasi
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleSeller}
                className="btn-primary w-full py-2.5 text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(57,255,20,0.3)]"
              >
                <CheckCircle2 size={13} />
                <span>KLIK UNTUK SIMULASI SELLER ACC</span>
              </button>
              <div className="text-[10px] text-[#666] text-center">
                Coba klik tombol di atas untuk melihat bagaimana dana otomatis cair saat kedua pihak setuju.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Footer Ticker */}
      <div className="bg-[#151515] px-4 py-2 border-t border-[#222] flex items-center justify-between text-[10px] text-[#666]">
        <span>MULTISIG: 2-OF-2 STEALTH VAULT</span>
        <span className="text-[#39FF14]">NO COURIER · ZERO FRAUD</span>
      </div>
    </div>
  );
}
