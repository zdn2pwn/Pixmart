"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Plus, Radio, Compass, Lock } from "lucide-react";

export function PublicNav({ currentRole = "OWNER" }: { currentRole?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#222222] bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div
            className="text-xl sm:text-[22px] font-bold tracking-tight select-none"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-[#ffffff]">PIX</span>
            <span className="text-[#39FF14]">MART</span>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-sans font-medium text-[#888]">
          <Link
            href="/marketplace"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Compass size={15} className="text-[#39FF14]" />
            <span>Katalog Bazaar</span>
          </Link>
          <Link
            href="/marketplace/new"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Plus size={15} className="text-[#39FF14]" />
            <span>Pasang Iklan</span>
          </Link>
          <Link
            href="/admin"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Radio size={14} className="text-[#39FF14]" />
            <span>Owner Radar</span>
          </Link>
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/marketplace"
            className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
          >
            <span>Mulai Transaksi</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-[#aaa] hover:text-white p-2 transition-colors border border-[#262626] bg-[#121212]"
          aria-label="Toggle Navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-t border-[#222222] bg-[#111111] px-6 py-5 space-y-4 font-sans text-sm">
          <Link
            href="/marketplace"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-[#ccc] hover:text-white py-1 font-medium"
          >
            <Compass size={16} className="text-[#39FF14]" />
            <span>Katalog Bazaar P2P</span>
          </Link>
          <Link
            href="/marketplace/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-[#39FF14] hover:underline py-1 font-medium"
          >
            <Plus size={16} />
            <span>Pasang Iklan Baru</span>
          </Link>
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-[#888] hover:text-white py-1 font-mono text-xs"
          >
            <Radio size={15} className="text-[#FFB800]" />
            <span>Owner Radar &amp; Ledger</span>
          </Link>

          <div className="pt-2">
            <Link
              href="/marketplace"
              onClick={() => setOpen(false)}
              className="btn-primary w-full py-2.5 text-center text-xs font-bold"
            >
              Mulai Transaksi Sekarang
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
