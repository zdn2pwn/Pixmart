"use client";

import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";

interface TopbarProps {
  session: any;
  lowStockCount?: number;
  onMenuClick: () => void;
}

export function Topbar({ session, lowStockCount = 0, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  // Build breadcrumb
  const parts = pathname.split("/").filter(Boolean);
  const breadcrumb = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" / ");

  const roleBadgeColor =
    session.role === "OWNER"
      ? "text-[#39FF14] border-[#39FF14]/40"
      : session.role === "SELLER"
      ? "text-[#FFB800] border-[#FFB800]/40"
      : "text-[#4488FF] border-[#4488FF]/40";

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-[#0d0d0d] border-b border-[#1e1e1e] shrink-0 font-mono">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-[#555] hover:text-[#e8e8e8] transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[#444] uppercase tracking-widest truncate">
          PIXMART / {breadcrumb || "DASHBOARD"}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Escrow count */}
        {lowStockCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#FFB800]">
            <span className="w-1.5 h-1.5 bg-[#FFB800] inline-block pulse-green" />
            {lowStockCount} Escrow Aktif
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-[#1e1e1e]" />

        {/* Role badge + name */}
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border font-mono ${roleBadgeColor}`}>
            {session.role}
          </span>
          <span className="hidden sm:block text-[11px] text-[#666] font-mono">
            {session.name}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="text-[#444] hover:text-[#FF4444] transition-colors p-1"
          title="Keluar"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
