"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  Radio,
  ArrowLeftRight,
  Compass,
  PlusCircle,
  Package,
  Users,
  Settings,
  X,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Traffic Radar", href: "/admin", icon: Radio },
      { label: "Escrow Ledger", href: "/admin/sales", icon: ArrowLeftRight },
    ],
  },
  {
    group: "MARKETPLACE",
    items: [
      { label: "Jelajahi Bazaar", href: "/marketplace", icon: Compass },
      { label: "Pasang Iklan", href: "/marketplace/new", icon: PlusCircle },
      { label: "Kelola Listing", href: "/admin/products", icon: Package },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Peer Nodes", href: "/admin/users", icon: Users },
      { label: "Pengaturan", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  role: string;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ role, onClose, className }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className={cn("flex flex-col h-full bg-[#0d0d0d] border-r border-[#1e1e1e]", className)}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e] shrink-0">
        <Link href="/admin" className="flex flex-col gap-0.5">
          <div
            className="text-[11px] font-bold tracking-tight"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-[#e8e8e8]">PIX</span>
            <span className="text-[#39FF14]">MART</span>
          </div>
          <span className="text-[9px] font-mono text-[#444] tracking-widest uppercase">
            P2P Escrow Protocol
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-[#555] hover:text-[#e8e8e8] transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="mb-5">
            <div className="px-2 mb-2">
              <span className="text-[9px] font-mono tracking-widest text-[#333] uppercase">
                {group.group}
              </span>
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 text-[12px] font-mono transition-all duration-100 border-l-2",
                        active
                          ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5 font-bold"
                          : "border-transparent text-[#555] hover:text-[#aaa] hover:bg-[#111]"
                      )}
                    >
                      <Icon size={13} className={active ? "text-[#39FF14]" : "text-[#444]"} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1e1e1e] shrink-0 font-mono">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-1.5 h-1.5 bg-[#39FF14] pulse-green inline-block" />
          <span className="text-[#39FF14] tracking-wider">NODE ONLINE</span>
        </div>
        <Link
          href="/"
          target="_blank"
          className="mt-1.5 block text-[10px] text-[#444] hover:text-[#39FF14] transition-colors"
        >
          → Halaman Publik
        </Link>
      </div>
    </aside>
  );
}
