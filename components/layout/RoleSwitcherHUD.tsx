"use client";

import { useState, useTransition } from "react";
import { switchRoleAction } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import { ChevronUp, ChevronDown } from "lucide-react";

const ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: "OWNER", label: "OWNER", desc: "Full access" },
  { role: "SELLER", label: "SELLER", desc: "List & sell" },
  { role: "BUYER", label: "BUYER", desc: "Browse & buy" },
];

export function RoleSwitcherHUD({ currentRole }: { currentRole: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSwitch(role: UserRole) {
    startTransition(async () => {
      await switchRoleAction(role);
      window.location.reload();
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-mono">
      <div className="relative">
        {/* Panel */}
        {open && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#141414] border border-[#333] shadow-2xl fade-up">
            <div className="px-3.5 py-2.5 border-b border-[#222]">
              <div className="text-[10px] text-[#888] uppercase tracking-wider font-bold">Demo — Ganti Peran</div>
            </div>
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => handleSwitch(r.role)}
                disabled={isPending || currentRole === r.role}
                className={`w-full text-left px-3.5 py-3 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  currentRole === r.role
                    ? "text-[#39FF14] bg-[#39FF14]/10 font-bold"
                    : "text-[#aaa] hover:text-white hover:bg-[#1e1e1e]"
                }`}
              >
                <span className="font-bold">{r.label}</span>
                <span className="text-[10px] text-[#666]">{r.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 px-3.5 py-2 bg-[#141414] border border-[#333] hover:border-[#39FF14] transition-all text-xs text-[#aaa] cursor-pointer shadow-lg"
        >
          <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
          <span className="font-bold text-[#39FF14]">{currentRole}</span>
          <span className="text-[#666] text-[10px]">DEMO</span>
          {open ? <ChevronDown size={14} className="text-[#666]" /> : <ChevronUp size={14} className="text-[#666]" />}
        </button>
      </div>
    </div>
  );
}
