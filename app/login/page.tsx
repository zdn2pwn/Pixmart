"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginSimpleAction } from "@/app/actions/auth";
import { Loader2, AlertCircle, Eye, EyeOff, MapPin } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type State = { error?: string } | undefined;

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    loginSimpleAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />

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
            autoComplete="current-password"
            placeholder="••••••••"
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full btn-primary py-3 text-sm font-bold font-mono flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Masuk...
          </>
        ) : (
          "MASUK"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
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
              LOGIN
            </h1>
            <p className="text-xs text-[#8B82A6] font-mono">
              Masuk untuk mulai jual atau beli di sekitar kamu
            </p>
          </div>

          {/* Form */}
          <Suspense fallback={<div className="text-xs text-[#8B82A6] font-mono">Loading...</div>}>
            <LoginForm />
          </Suspense>

          {/* Register link */}
          <p className="text-center text-xs font-mono text-[#6F6788]">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[#C8FF4D] hover:underline"
            >
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
