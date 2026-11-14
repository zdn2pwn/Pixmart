"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { switchRoleAction } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import {
  ShieldCheck,
  Store,
  ShoppingBag,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Terminal,
  Lock,
} from "lucide-react";

type LoginState = { error?: string } | undefined;

export default function LoginPage() {
  const router = useRouter();
  const [isPendingRole, startTransition] = useTransition();

  const [state, formAction, isPendingForm] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );

  function handleFastPersona(role: UserRole) {
    startTransition(async () => {
      await switchRoleAction(role);
      if (role === "OWNER") {
        router.push("/admin");
      } else {
        router.push("/marketplace");
      }
    });
  }

  const isPending = isPendingForm || isPendingRole;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col justify-center items-center p-4">
      {/* Back button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#666] hover:text-[#39FF14] transition-colors"
        >
          <ArrowLeft size={13} /> Kembali ke Marketplace
        </Link>
        <span className="text-[10px] font-mono text-[#444]">ESCROW PROTOCOL</span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div
            className="text-2xl font-bold tracking-tight inline-block"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-[#e8e8e8]">PIX</span>
            <span className="text-[#39FF14]">MART</span>
          </div>
          <div className="text-[11px] font-mono text-[#555] tracking-widest uppercase">
            P2P Escrow Terminal
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#111111] border border-[#262626] p-6 space-y-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1e1e1e] font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
              <span className="text-[#39FF14] font-semibold">AUTH_GATEWAY_ONLINE</span>
            </div>
            <span className="text-[#444]">PORT: 443 / TLS</span>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 bg-[#FF4444]/10 border border-[#FF4444]/30 text-[#FF4444] text-[11px] font-mono p-3">
              <AlertCircle size={14} className="shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Quick 1-Click Persona Simulator */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider flex items-center justify-between">
              <span>Quick Demo Switcher</span>
              <span className="text-[#39FF14]">Instant Role</span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFastPersona("OWNER")}
                className="p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#39FF14] text-[#e8e8e8] font-bold text-center transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <ShieldCheck size={16} className="text-[#39FF14] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] tracking-wide">1. OWNER</span>
                <span className="text-[8px] text-[#555]">Superuser</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFastPersona("SELLER")}
                className="p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#39FF14] text-[#e8e8e8] font-bold text-center transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <Store size={16} className="text-[#39FF14] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] tracking-wide">2. SELLER</span>
                <span className="text-[8px] text-[#555]">Merchant</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFastPersona("BUYER")}
                className="p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#39FF14] text-[#e8e8e8] font-bold text-center transition-all flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <ShoppingBag size={16} className="text-[#39FF14] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] tracking-wide">3. BUYER</span>
                <span className="text-[8px] text-[#555]">Customer</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1e1e1e]" />
            <span className="flex-shrink mx-3 text-[10px] font-mono text-[#444] uppercase tracking-wider">
              atau login node manual
            </span>
            <div className="flex-grow border-t border-[#1e1e1e]" />
          </div>

          {/* Manual Form */}
          <form action={formAction} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-[#666] uppercase tracking-wider">Email Node</label>
              <input
                type="email"
                name="email"
                required
                defaultValue="owner@arcadeprotocol.net"
                className="input-dark w-full text-xs font-mono"
                placeholder="node@pixmart.net"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] text-[#666] uppercase tracking-wider">Passphrase</label>
              <input
                type="password"
                name="password"
                required
                defaultValue="admin123"
                className="input-dark w-full text-xs font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-3 text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Lock size={13} />
                  CONNECT NODE
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center font-mono text-[10px] text-[#444] space-y-1">
          <p>STRICTLY LEGAL PHYSICAL GOODS ESCROW</p>
          <p className="text-[#333]">PEER-TO-PEER · ZERO INTERMEDIARY · NO COURIER</p>
        </div>
      </div>
    </div>
  );
}
