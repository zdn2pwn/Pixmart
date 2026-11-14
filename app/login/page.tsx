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
            autoComplete="current-password"
            placeholder="••••••••"
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
              LOGIN
            </h1>
            <p className="text-xs text-[#666] font-mono">
              Masuk untuk mulai jual atau beli di sekitar kamu
            </p>
          </div>

          {/* Form */}
          <Suspense fallback={<div className="text-xs text-[#666] font-mono">Loading...</div>}>
            <LoginForm />
          </Suspense>

          {/* Register link */}
          <p className="text-center text-xs font-mono text-[#555]">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[#39FF14] hover:underline"
            >
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
