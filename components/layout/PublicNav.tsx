"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Plus,
  Radio,
  Compass,
  MessageSquare,
  ShieldCheck,
  User,
  LayoutDashboard,
} from "lucide-react";

export function PublicNav({ currentRole = "BUYER" }: { currentRole?: string }) {
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
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-medium text-[#888]">
          <Link
            href="/marketplace"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Compass size={14} className="text-[#39FF14]" />
            <span>Katalog Lokal</span>
          </Link>

          <Link
            href="/negotiations"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <MessageSquare size={14} className="text-[#39FF14]" />
            <span>Negosiasi</span>
          </Link>

          <Link
            href="/escrow"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-[#39FF14]" />
            <span>Escrow COD</span>
          </Link>

          {currentRole === "SELLER" && (
            <Link
              href="/seller"
              className="hover:text-white transition-colors flex items-center gap-1.5 text-[#39FF14]"
            >
              <LayoutDashboard size={14} />
              <span>Seller Hub</span>
            </Link>
          )}

          {currentRole === "BUYER" && (
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors flex items-center gap-1.5 text-[#39FF14]"
            >
              <LayoutDashboard size={14} />
              <span>Buyer Hub</span>
            </Link>
          )}

          {currentRole === "OWNER" && (
            <Link
              href="/admin"
              className="hover:text-white transition-colors flex items-center gap-1.5 text-[#FFB800]"
            >
              <Radio size={14} />
              <span>Owner Radar</span>
            </Link>
          )}
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/marketplace/new"
            className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
          >
            <Plus size={14} />
            <span>Pasang Iklan</span>
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
        <div className="md:hidden border-t border-[#222222] bg-[#111111] px-6 py-5 space-y-4 font-mono text-xs">
          <Link
            href="/marketplace"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-[#ccc] hover:text-white py-1 font-medium"
          >
            <Compass size={16} className="text-[#39FF14]" />
            <span>Katalog Lokal Terdekat</span>
          </Link>

          <Link
            href="/negotiations"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-[#ccc] hover:text-white py-1 font-medium"
          >
            <MessageSquare size={16} className="text-[#39FF14]" />
            <span>Pusat Negosiasi</span>
          </Link>

          <Link
            href="/escrow"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-[#ccc] hover:text-white py-1 font-medium"
          >
            <ShieldCheck size={16} className="text-[#39FF14]" />
            <span>Ruang Escrow COD</span>
          </Link>

          {currentRole === "SELLER" && (
            <Link
              href="/seller"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-[#39FF14] py-1 font-bold"
            >
              <LayoutDashboard size={16} />
              <span>Seller Dashboard</span>
            </Link>
          )}

          {currentRole === "BUYER" && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-[#39FF14] py-1 font-bold"
            >
              <LayoutDashboard size={16} />
              <span>Buyer Dashboard</span>
            </Link>
          )}

          {currentRole === "OWNER" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-[#FFB800] py-1 font-bold"
            >
              <Radio size={16} />
              <span>Owner Radar &amp; Dispute</span>
            </Link>
          )}

          <div className="pt-2">
            <Link
              href="/marketplace/new"
              onClick={() => setOpen(false)}
              className="btn-primary w-full py-2.5 text-center text-xs font-bold block"
            >
              + Pasang Iklan Sekarang
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
