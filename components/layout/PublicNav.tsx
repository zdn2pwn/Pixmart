"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Menu,
  X,
  Plus,
  Radio,
  Compass,
  MessageSquare,
  ShieldCheck,
  LayoutDashboard,
  Store,
  ShoppingBag,
  LogOut,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { logoutAction, changeRoleAction } from "@/app/actions/auth";

interface PublicNavProps {
  currentRole?: string;
  codename?: string;
  isLoggedIn?: boolean;
}

export function PublicNav({
  currentRole = "BUYER",
  codename,
  isLoggedIn = false,
}: PublicNavProps) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPendingLogout, startLogout] = useTransition();
  const [isPendingSwitch, startSwitch] = useTransition();

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
    });
  }

  function handleSwitchRole(role: "BUYER" | "SELLER") {
    setUserMenuOpen(false);
    startSwitch(async () => {
      await changeRoleAction(role);
    });
  }

  const displayName = codename || (currentRole === "BUYER" ? "Buyer" : currentRole === "SELLER" ? "Seller" : "Owner");

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

          {isLoggedIn && (
            <>
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
                  <Store size={14} />
                  <span>Seller Hub</span>
                </Link>
              )}

              {currentRole === "BUYER" && (
                <Link
                  href="/dashboard"
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-[#39FF14]"
                >
                  <ShoppingBag size={14} />
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
            </>
          )}
        </nav>

        {/* Right Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Pasang Iklan — only for SELLER */}
              {currentRole === "SELLER" && (
                <Link
                  href="/marketplace/new"
                  className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
                >
                  <Plus size={14} />
                  <span>Pasang Iklan</span>
                </Link>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#2a2a2a] hover:border-[#39FF14]/50 transition-colors text-xs font-mono text-[#aaa]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#39FF14]/40 flex items-center justify-center text-[10px] text-[#39FF14] font-bold">
                    {currentRole === "SELLER" ? "S" : currentRole === "OWNER" ? "O" : "B"}
                  </span>
                  <span className="max-w-[80px] truncate">{displayName}</span>
                  <ChevronDown size={12} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-20 w-48 bg-[#111] border border-[#2a2a2a] shadow-xl">
                      {/* Role badge */}
                      <div className="px-3 py-2 border-b border-[#1a1a1a]">
                        <div className="text-[11px] font-mono text-[#555]">Role saat ini</div>
                        <div className="text-xs font-bold font-mono text-[#39FF14]">{currentRole}</div>
                      </div>

                      {/* Switch role — only buyer/seller can switch */}
                      {(currentRole === "BUYER" || currentRole === "SELLER") && (
                        <div className="border-b border-[#1a1a1a]">
                          <div className="px-3 pt-2 pb-1 text-[10px] font-mono text-[#555] uppercase tracking-wider">
                            Ganti Role
                          </div>
                          {currentRole !== "BUYER" && (
                            <button
                              onClick={() => handleSwitchRole("BUYER")}
                              disabled={isPendingSwitch}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#aaa] hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50"
                            >
                              <ShoppingBag size={12} className="text-[#39FF14]" />
                              Jadi Buyer
                            </button>
                          )}
                          {currentRole !== "SELLER" && (
                            <button
                              onClick={() => handleSwitchRole("SELLER")}
                              disabled={isPendingSwitch}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#aaa] hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50"
                            >
                              <Store size={12} className="text-[#39FF14]" />
                              Jadi Seller
                            </button>
                          )}
                        </div>
                      )}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        disabled={isPendingLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-mono text-[#FF6666] hover:bg-[#1a0a0a] transition-colors disabled:opacity-50"
                      >
                        <LogOut size={12} />
                        {isPendingLogout ? "Keluar..." : "Logout"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Not logged in */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-ghost text-xs font-bold px-4 py-2"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="btn-primary text-xs font-bold px-4 py-2 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
              >
                Daftar Gratis
              </Link>
            </div>
          )}
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

          {isLoggedIn && (
            <>
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
                <>
                  <Link
                    href="/seller"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-[#39FF14] py-1 font-bold"
                  >
                    <Store size={16} />
                    <span>Seller Dashboard</span>
                  </Link>
                  <Link
                    href="/marketplace/new"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full py-2.5 text-center text-xs font-bold block"
                  >
                    + Pasang Iklan
                  </Link>
                </>
              )}

              {currentRole === "BUYER" && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-[#39FF14] py-1 font-bold"
                >
                  <ShoppingBag size={16} />
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
                  <span>Owner Radar & Dispute</span>
                </Link>
              )}

              <div className="pt-2 border-t border-[#222]">
                <div className="text-[11px] text-[#555] mb-2">
                  Login sebagai: <span className="text-[#39FF14]">{displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[#FF6666] py-1"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}

          {!isLoggedIn && (
            <div className="pt-2 space-y-2">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="btn-primary w-full py-2.5 text-center text-xs font-bold block"
              >
                Daftar Gratis
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-ghost w-full py-2.5 text-center text-xs font-bold block"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
