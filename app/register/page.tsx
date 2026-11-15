"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerSimpleAction } from "@/app/actions/auth";
import { Loader2, AlertCircle, Eye, EyeOff, MapPin } from "lucide-react";
import { useState } from "react";

type State = { error?: string } | undefined;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    registerSimpleAction,
    undefined
  );

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-[#231D3A] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 select-none">
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-cream">PIX</span>
            <span className="text-[#C8FF4D]">MART</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#6F6788]">
          <MapPin size={12} className="text-[#C8FF4D]" />
          <span>Local COD Marketplace</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1
              className="text-xl font-bold text-cream"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              DAFTAR
            </h1>
            <p className="text-xs text-[#8B82A6] font-mono">
              Buat akun anonim gratis — tidak perlu data pribadi
            </p>
          </div>

          {/* Info box */}
          <div className="bg-[#12101F] border border-[#3A3157] p-3 text-xs font-mono text-[#A79EC2] space-y-1">
            <div className="text-[#C8FF4D] font-bold mb-1">Zero KYC</div>
            <div>· Hanya email & password yang diperlukan</div>
            <div>· Identitas kamu tetap anonim di marketplace</div>
            <div>· Pilih jadi Buyer atau Seller setelah daftar</div>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="flex items-start gap-2 bg-[#2A1420] border border-[#FF6B6B]/40 p-3 text-xs text-[#FF8A8A] font-mono">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#FF6B6B]" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="kamu@email.com"
                className="w-full bg-[#12101F] border border-[#3A3157] text-sm text-cream px-4 py-3 font-mono focus:outline-none focus:border-[#C8FF4D] transition-colors placeholder:text-[#5C5575]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 karakter"
                  className="w-full bg-[#12101F] border border-[#3A3157] text-sm text-cream px-4 py-3 pr-12 font-mono focus:outline-none focus:border-[#C8FF4D] transition-colors placeholder:text-[#5C5575]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6788] hover:text-[#C8C2DA] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider">
                Konfirmasi Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Ulangi password"
                className="w-full bg-[#12101F] border border-[#3A3157] text-sm text-cream px-4 py-3 font-mono focus:outline-none focus:border-[#C8FF4D] transition-colors placeholder:text-[#5C5575]"
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
          <p className="text-center text-xs font-mono text-[#6F6788]">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#C8FF4D] hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
