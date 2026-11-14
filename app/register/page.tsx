"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Loader2, AlertCircle, Eye, EyeOff, MapPin } from "lucide-react";
import { useState } from "react";

type State = { error?: string } | undefined;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    registerAction,
    undefined
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 select-none">
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-white">PIX</span>
            <span className="text-[#39FF14]">MART</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#555]">
          <MapPin size={12} className="text-[#39FF14]" />
          <span>Local COD Marketplace</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              DAFTAR
            </h1>
            <p className="text-xs text-[#666] font-mono">
              Buat akun anonim gratis — tidak perlu data pribadi
            </p>
          </div>

          {/* Info box */}
          <div className="bg-[#111] border border-[#222] p-3 text-xs font-mono text-[#888] space-y-1">
            <div className="text-[#39FF14] font-bold mb-1">Zero KYC</div>
            <div>· Hanya email & password yang diperlukan</div>
            <div>· Identitas kamu tetap anonim di marketplace</div>
            <div>· Pilih jadi Buyer atau Seller setelah daftar</div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="flex items-start gap-2 bg-[#1a0a0a] border border-[#FF4444]/40 p-3 text-xs text-[#FF6666] font-mono">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#FF4444]" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="kamu@email.com"
                className="w-full bg-[#111] border border-[#2a2a2a] text-sm text-white px-4 py-3 font-mono focus:outline-none focus:border-[#39FF14] transition-colors placeholder:text-[#444]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 karakter"
                  className="w-full bg-[#111] border border-[#2a2a2a] text-sm text-white px-4 py-3 pr-12 font-mono focus:outline-none focus:border-[#39FF14] transition-colors placeholder:text-[#444]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider">
                Konfirmasi Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Ulangi password"
                className="w-full bg-[#111] border border-[#2a2a2a] text-sm text-white px-4 py-3 font-mono focus:outline-none focus:border-[#39FF14] transition-colors placeholder:text-[#444]"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-primary py-3 text-sm font-bold font-mono flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Mendaftar...
                </>
              ) : (
                "BUAT AKUN"
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-xs font-mono text-[#555]">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#39FF14] hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
