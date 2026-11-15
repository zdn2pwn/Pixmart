"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Plus,
  Radio,
  Compass,
  MessageSquare,
  ShieldCheck,
  Store,
  ShoppingBag,
  LogOut,
  ChevronDown,
  User,
  Gamepad2,
  Play,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/components/layout/NotificationBell";

interface PublicNavProps {
  currentRole?: string;
  codename?: string;
  isLoggedIn?: boolean;
}

const ACCENTS = {
  BUYER: {
    text: "text-lime",
    border: "border-lime/50",
    solid: "bg-lime",
    shadow: "shadow-[inset_0_-3px_0_#a8e62e]",
  },
  SELLER: {
    text: "text-cyan",
    border: "border-cyan/50",
    solid: "bg-cyan",
    shadow: "shadow-[inset_0_-3px_0_#2fb8c2]",
  },
  OWNER: {
    text: "text-amber",
    border: "border-amber/50",
    solid: "bg-amber",
    shadow: "shadow-[inset_0_-3px_0_#d9a13a]",
  },
} as const;

export function PublicNav({
  currentRole = "BUYER",
  codename,
  isLoggedIn = false,
}: PublicNavProps) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPendingLogout, startLogout] = useTransition();
  const pathname = usePathname();

  const accent =
    ACCENTS[currentRole as keyof typeof ACCENTS] ?? ACCENTS.BUYER;

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
    });
  }

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/");
  }

  const displayName =
    codename ||
    (currentRole === "BUYER"
      ? "Buyer"
      : currentRole === "SELLER"
        ? "Seller"
        : "Owner");

  const links: { href: string; label: string; icon: React.ReactNode }[] = [];

  if (!isLoggedIn) {
    links.push(
      {
        href: "/marketplace",
        label: "Katalog",
        icon: <Compass size={15} />,
      },
      {
        href: "/#cara-main",
        label: "Cara main",
        icon: <BookOpen size={15} />,
      },
      {
        href: "/#kenapa-pixmart",
        label: "Kenapa PIXMART",
        icon: <Sparkles size={15} />,
      },
    );
  }

  if (currentRole === "OWNER") {
    links.push(
      { href: "/marketplace", label: "Katalog", icon: <Compass size={15} /> },
      { href: "/owner", label: "Midman", icon: <Radio size={15} /> },
    );
  } else if (isLoggedIn) {
    if (currentRole !== "SELLER") {
      links.push({
        href: "/marketplace",
        label: "Katalog",
        icon: <Compass size={15} />,
      });
    }
    links.push(
      {
        href: "/negotiations",
        label: "Nego",
        icon: <MessageSquare size={15} />,
      },
      { href: "/escrow", label: "Escrow", icon: <ShieldCheck size={15} /> },
    );
    if (currentRole === "SELLER") {
      links.push({
        href: "/seller",
        label: "Seller Hub",
        icon: <Store size={15} />,
      });
    }
    if (currentRole === "BUYER") {
      links.push({
        href: "/dashboard",
        label: "Buyer Hub",
        icon: <ShoppingBag size={15} />,
      });
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-line bg-ink/95 backdrop-blur-sm">
      <div className="flex h-[3px] w-full">
        <span className="h-full flex-1 bg-lime" />
        <span className="h-full w-24 bg-cyan" />
        <span className="h-full w-12 bg-pink" />
        <span className="h-full w-6 bg-amber" />
      </div>

      <div>
        <div className="relative mx-auto flex h-[70px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="PIXMART home"
          >
            <span className="select-none font-arcade text-[15px] leading-none sm:text-base">
              <span className="text-cream">PIX</span>
              <span className="text-lime">MART</span>
            </span>
          </Link>

          {/* Control deck — centered on desktop */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center border-b-2 border-line lg:flex">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 border-b-2 px-3.5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-150 ${
                    active
                      ? "border-lime text-cream"
                      : "border-transparent text-muted-ink hover:border-line hover:text-cream"
                  }`}
                >
                  <span className={active ? "text-lime" : "text-muted-ink"}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {currentRole === "SELLER" && (
                  <Link
                    href="/marketplace/new"
                    className="btn-primary hidden !min-h-0 !px-3 !py-2 !text-[10px] sm:inline-flex"
                  >
                    <Plus size={13} strokeWidth={3} />
                    Pasang Iklan
                  </Link>
                )}

                {isLoggedIn && <NotificationBell />}

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="group flex items-center gap-2.5 py-1 pl-1 pr-0.5 transition-opacity hover:opacity-85"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="hidden flex-col items-start leading-none sm:flex">
                      <span className="max-w-[104px] truncate font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-cream">
                        {displayName}
                      </span>
                      <span
                        className={`mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.16em] ${accent.text}`}
                      >
                        {currentRole === "SELLER"
                          ? "seller · player 2"
                          : currentRole === "BUYER"
                            ? "buyer · player 1"
                            : "midman"}
                      </span>
                    </span>
                    <ChevronDown
                      size={12}
                      className={`text-muted-ink transition-transform duration-150 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-3 w-64 border-2 border-ink bg-[#fffbf2] text-ink shadow-[5px_5px_0_0_#3a3157]">
                        <div className="border-b-2 border-ink/10 bg-cream px-4 py-3">
                          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink/40">
                            Akun kamu
                          </div>
                          <div className="mt-2">
                            <div className="truncate text-[13px] font-bold text-ink">
                              {displayName}
                            </div>
                            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink/45">
                              {currentRole}
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink/70 transition-colors hover:bg-lime/20 hover:text-ink"
                        >
                          <User size={14} />
                          Profil &amp; pengaturan
                        </Link>

                        <button
                          onClick={handleLogout}
                          disabled={isPendingLogout}
                          className="flex w-full items-center gap-2.5 border-t-2 border-ink/10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-danger transition-colors hover:bg-danger/5 disabled:opacity-50"
                        >
                          <LogOut size={14} />
                          {isPendingLogout ? "Keluar..." : "Keluar"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden items-center gap-1.5 border-2 border-line bg-panel px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-ink transition-colors hover:border-cream hover:text-cream sm:inline-flex"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="btn-primary !min-h-0 !gap-1.5 !px-3.5 !py-2.5 !text-[10px]"
                >
                  <Play size={11} fill="currentColor" />
                  Mulai main
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 py-2 pl-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:text-lime lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
              Menu
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="animate-[pop-in_180ms_ease-out_both] border-b-2 border-line bg-ink px-4 pb-5 pt-4 lg:hidden">
          {isLoggedIn && (
            <div className="mb-4 border-b-2 border-line pb-3">
              <div className="truncate font-mono text-sm font-bold uppercase text-cream">
                {displayName}
              </div>
              <div className={`font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${accent.text}`}>
                {currentRole === "SELLER"
                  ? "seller · player 2"
                  : currentRole === "BUYER"
                    ? "buyer · player 1"
                    : "midman"}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 border-b-2 px-1 py-3 font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
                    active
                      ? "border-lime text-cream"
                      : "border-transparent text-muted-ink hover:text-cream"
                  }`}
                >
                  <span className={active ? "text-lime" : "text-muted-ink"}>
                    {link.icon}
                  </span>
                  <span className="flex-1">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 border-t-2 border-line pt-4">
            {isLoggedIn ? (
              <>
                {currentRole === "SELLER" && (
                  <Link
                    href="/marketplace/new"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full !text-[10px]"
                  >
                    <Plus size={14} strokeWidth={3} />
                    Pasang Iklan
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full !text-[10px]"
                >
                  <User size={14} />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isPendingLogout}
                  className="flex w-full items-center justify-center gap-2 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-danger disabled:opacity-50"
                >
                  <LogOut size={13} />
                  {isPendingLogout ? "Keluar..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full !text-[10px]"
                >
                  <Play size={12} fill="currentColor" />
                  Mulai main
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full !text-[10px]"
                >
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
