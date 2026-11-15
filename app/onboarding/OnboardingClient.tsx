"use client";

import { useState, useActionState } from "react";
import { completeOnboardingSimpleAction } from "@/app/actions/auth";
import { INDONESIAN_LOCATIONS } from "@/lib/location";
import {
  ShoppingBag,
  Store,
  Loader2,
  MapPin,
  Coins,
  AlertCircle,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type State = { error?: string } | undefined;

export default function OnboardingClient() {
  const [selectedRole, setSelectedRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [selectedCity, setSelectedCity] = useState("Jakarta Selatan");
  const [district, setDistrict] = useState("Kebayoran Baru");
  const [walletBtc, setWalletBtc] = useState("");
  const [walletXmr, setWalletXmr] = useState("");

  const [state, formAction, isPending] = useActionState<State, FormData>(
    completeOnboardingSimpleAction,
    undefined
  );

  // Handle city preset change
  function handleCityChange(cityName: string) {
    setSelectedCity(cityName);
    const preset = INDONESIAN_LOCATIONS.find((l) => l.city === cityName);
    if (preset) {
      setDistrict(preset.district);
    }
  }

  // Quick preset test addresses
  function fillDemoWallet(type: "BTC" | "XMR") {
    if (type === "BTC") {
      setWalletBtc("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq");
    } else {
      setWalletXmr("888tNkZrPN6JsEUmssN5DaSARRoik4Y586QkG7Rgy8pZgJ4g9K2kU9nFmRkW4E8UfX4P2B2X9U5H1A6Y8M5N3R4");
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-[#2A2440] px-6 py-4 flex items-center justify-between">
        <span
          className="text-lg font-bold"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          <span className="text-cream">PIX</span>
          <span className="text-[#C8FF4D]">MART</span>
        </span>
        <div className="flex items-center gap-2 text-xs font-mono text-[#A79EC2]">
          <span className="w-2 h-2 rounded-full bg-[#C8FF4D] pulse-green" />
          <span>ONBOARDING // SETUP ANONYMOUS PROFILE</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#19152B] border border-[#3A3157] text-xs font-mono text-[#C8FF4D]">
            <Sparkles size={12} />
            <span>BIODATA LOKAL &amp; CRYPTO WALLET</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-cream tracking-tight"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            LENGKAPI BIODATA
          </h1>
          <p className="text-xs sm:text-sm text-[#A79EC2] font-mono max-w-xl mx-auto">
            Sistem akan otomatis meng-generate identitas <strong>100% anonim</strong>. Nama asli dan email tidak akan pernah dipublikasikan.
          </p>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div className="bg-[#2A1420] border border-red-500/50 p-4 text-xs font-mono text-red-300 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-8">
          <input type="hidden" name="role" value={selectedRole} />
          <input type="hidden" name="locationCity" value={selectedCity} />

          {/* 1. Pilih Peran */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-[#C8FF4D] uppercase tracking-wider font-bold block">
              1. Pilih Peran Kamu (Tidak Bisa Diubah Nanti Demi Privasi)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Option */}
              <div
                onClick={() => setSelectedRole("BUYER")}
                className={`p-5 border cursor-pointer transition-all ${
                  selectedRole === "BUYER"
                    ? "bg-[#19152B] border-[#C8FF4D] shadow-[0_0_20px_rgba(200,255,77,0.15)]"
                    : "bg-[#12101F] border-[#3A3157] hover:border-[#4A4168]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-[#231D3A] border border-[#3A3157]">
                    <ShoppingBag size={20} className="text-[#C8FF4D]" />
                  </div>
                  {selectedRole === "BUYER" && (
                    <span className="badge-green text-[10px]">AKTIF</span>
                  )}
                </div>
                <div className="text-sm font-bold text-cream mb-1">BUYER (Pembeli)</div>
                <p className="text-xs text-[#A79EC2] font-sans leading-relaxed">
                  Cari barang di sekitarmu, tawar harga lewat ephemeral chat, dan bayar tunai/kripto saat COD.
                </p>
              </div>

              {/* Seller Option */}
              <div
                onClick={() => setSelectedRole("SELLER")}
                className={`p-5 border cursor-pointer transition-all ${
                  selectedRole === "SELLER"
                    ? "bg-[#19152B] border-[#C8FF4D] shadow-[0_0_20px_rgba(200,255,77,0.15)]"
                    : "bg-[#12101F] border-[#3A3157] hover:border-[#4A4168]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-[#231D3A] border border-[#3A3157]">
                    <Store size={20} className="text-[#C8FF4D]" />
                  </div>
                  {selectedRole === "SELLER" && (
                    <span className="badge-green text-[10px]">AKTIF</span>
                  )}
                </div>
                <div className="text-sm font-bold text-cream mb-1">SELLER (Penjual)</div>
                <p className="text-xs text-[#A79EC2] font-sans leading-relaxed">
                  Pasang iklan barang fisik legal di lokasimu, terima penawaran buyer, dan serah terima langsung.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Lokasi Wilayah */}
          <div className="space-y-4 bg-[#12101F] border border-[#3A3157] p-5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C8FF4D] font-bold uppercase">
              <MapPin size={14} />
              <span>2. Wilayah Domisili / Area Transaksi COD</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#A79EC2]">Pilih Kota Utama</label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full bg-[#19152B] border border-[#3A3157] text-xs font-mono text-cream p-2.5 focus:border-[#C8FF4D] outline-none"
                >
                  {Array.from(new Set(INDONESIAN_LOCATIONS.map((l) => l.city))).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#A79EC2]">Kecamatan / Area Publik</label>
                <input
                  name="locationDistrict"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  placeholder="Contoh: Kebayoran Baru, Blok M, Ciwalk"
                  className="w-full bg-[#19152B] border border-[#3A3157] text-xs font-mono text-cream p-2.5 focus:border-[#C8FF4D] outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#8B82A6] font-mono">
              🔒 Hanya nama kota dan kecamatan yang ditampilkan untuk menghitung jarak. Alamat jalan detail tidak akan disimpan.
            </p>
          </div>

          {/* 3. Wallet Address (BTC atau Monero - SALAH SATU WAJIB) */}
          <div className="space-y-4 bg-[#12101F] border border-[#3A3157] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#C8FF4D] font-bold uppercase">
                <Coins size={14} />
                <span>3. Alamat Dompet Crypto (Wajib Salah Satu: BTC atau XMR)</span>
              </div>
              <span className="text-[10px] font-mono bg-red-950/60 text-red-400 border border-red-500/30 px-2 py-0.5">
                SALAH SATU WAJIB
              </span>
            </div>

            <p className="text-xs text-[#A79EC2] font-sans">
              Digunakan untuk verifikasi kepemilikan dompet dan penerimaan dana/escrow refund jika terjadi pembatalan transaksi.
            </p>

            {/* Bitcoin Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-[#F7931A] font-bold flex items-center gap-1.5">
                  <span>Bitcoin (BTC) Address</span>
                  <span className="text-[#8B82A6] font-normal text-[10px]">(Opsional jika sudah isi XMR)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fillDemoWallet("BTC")}
                  className="text-[10px] font-mono text-[#C8FF4D] hover:underline"
                >
                  Gunakan Format Contoh (Demo)
                </button>
              </div>
              <input
                name="walletBtc"
                type="text"
                value={walletBtc}
                onChange={(e) => setWalletBtc(e.target.value)}
                placeholder="Contoh: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                className="w-full bg-[#19152B] border border-[#3A3157] text-xs font-mono text-cream p-2.5 focus:border-[#F7931A] outline-none placeholder:text-[#5C5575]"
              />
            </div>

            {/* Monero Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-[#FF8A3D] font-bold flex items-center gap-1.5">
                  <span>Monero (XMR) Address</span>
                  <span className="text-[#8B82A6] font-normal text-[10px]">(Opsional jika sudah isi BTC)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fillDemoWallet("XMR")}
                  className="text-[10px] font-mono text-[#C8FF4D] hover:underline"
                >
                  Gunakan Format Contoh (Demo)
                </button>
              </div>
              <input
                name="walletXmr"
                type="text"
                value={walletXmr}
                onChange={(e) => setWalletXmr(e.target.value)}
                placeholder="Contoh: 888tNkZrPN6JsEUmssN5DaSARRoik4Y586QkG7Rgy8pZgJ4g9K2kU9nFmR..."
                className="w-full bg-[#19152B] border border-[#3A3157] text-xs font-mono text-cream p-2.5 focus:border-[#FF8A3D] outline-none placeholder:text-[#5C5575]"
              />
            </div>
          </div>

          {/* 4. Anonymous Guarantee Box */}
          <div className="bg-[#19152B] border border-[#3A3157] p-4 flex items-start gap-3 text-xs font-mono text-[#A79EC2]">
            <Lock size={16} className="text-[#C8FF4D] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-cream font-bold">Anonimitas Otomatis Terpasang</div>
              <p className="text-[11px] text-[#A79EC2] font-sans leading-relaxed">
                Setelah formulir ini dikirim, sistem secara otomatis menerbitkan <strong>Codename Anonim</strong> dan <strong>Alamat Deposit Simulasi</strong> (BTC &amp; XMR) lengkap dengan saldo awal untuk bertransaksi secara instan.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full btn-primary py-3.5 text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,255,77,0.3)] disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>MENG-GENERATE PROFIL ANONIM &amp; WALLET...</span>
              </>
            ) : (
              <>
                <span>SELESAIKAN SETUP &amp; MASUK KE {selectedRole === "SELLER" ? "SELLER HUB" : "BUYER HUB"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
