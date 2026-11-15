"use client";

import { useState, useTransition } from "react";
import { User, Wallet, MapPin, Shield, Save, Key } from "lucide-react";
import type { SimpleSession } from "@/app/actions/auth";

interface ProfilePageContentProps {
  session: SimpleSession;
  profile: any;
}

export function ProfilePageContent({ session, profile }: ProfilePageContentProps) {
  const [isPending] = useTransition();
  
  // Form state
  const [codename, setCodename] = useState(profile.codename || "");
  const [locationCity, setLocationCity] = useState(profile.location_city || "");
  const [locationDistrict, setLocationDistrict] = useState(profile.location_district || "");
  const [walletBtc, setWalletBtc] = useState(profile.wallet_btc || "");
  const [walletXmr, setWalletXmr] = useState(profile.wallet_xmr || "");
  const [bio, setBio] = useState(profile.bio || "");
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSaveProfile() {
    // TODO: Implement update profile action
    setMessage({ type: "success", text: "Profile updated successfully!" });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Password baru tidak cocok!" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password minimal 8 karakter!" });
      return;
    }
    
    // TODO: Implement change password action
    setMessage({ type: "success", text: "Password berhasil diubah!" });
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#222]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border-2 border-[#39FF14] flex items-center justify-center">
            <User size={24} className="text-[#39FF14]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
            <p className="text-xs font-mono text-[#888]">
              Role: <span className="text-[#39FF14]">{session.role}</span> • Email: {session.email}
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 border font-mono text-sm ${
            message.type === "success"
              ? "bg-[#39FF14]/10 border-[#39FF14] text-[#39FF14]"
              : "bg-[#FF4444]/10 border-[#FF4444] text-[#FF4444]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-[#101010] border border-[#2a2a2a] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-[#39FF14]" />
          <h2 className="text-lg font-bold text-white font-mono">INFORMASI PROFIL</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
              Codename (Nama Anonim)
            </label>
            <input
              type="text"
              value={codename}
              onChange={(e) => setCodename(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14]"
              placeholder="Anonymous Seller #1234"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
                <MapPin size={12} className="inline mr-1" />
                Kota
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                placeholder="Jakarta Selatan"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
                Kecamatan
              </label>
              <input
                type="text"
                value={locationDistrict}
                onChange={(e) => setLocationDistrict(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                placeholder="Kebayoran Baru"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
              Bio (Opsional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14] resize-none"
              placeholder="Ceritakan sedikit tentang kamu..."
            />
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="bg-[#101010] border border-[#2a2a2a] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-[#39FF14]" />
          <h2 className="text-lg font-bold text-white font-mono">WALLET ADDRESSES</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
              Bitcoin (BTC) Address
            </label>
            <input
              type="text"
              value={walletBtc}
              onChange={(e) => setWalletBtc(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-xs focus:outline-none focus:border-[#39FF14]"
              placeholder="bc1q..."
            />
            <p className="text-[10px] font-mono text-[#666] mt-1">
              Untuk menerima pembayaran BTC dari escrow
            </p>
          </div>

          <div>
            <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
              Monero (XMR) Address
            </label>
            <input
              type="text"
              value={walletXmr}
              onChange={(e) => setWalletXmr(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-xs focus:outline-none focus:border-[#39FF14]"
              placeholder="4..."
            />
            <p className="text-[10px] font-mono text-[#666] mt-1">
              Untuk menerima pembayaran XMR dari escrow (privasi maksimal)
            </p>
          </div>
        </div>

        <div className="bg-[#39FF14]/5 border border-[#39FF14]/30 p-3 text-xs font-mono text-[#888]">
          <Shield size={14} className="inline text-[#39FF14] mr-2" />
          Wallet address ini digunakan untuk withdrawal dari platform. Pastikan address yang kamu masukkan benar!
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#101010] border border-[#2a2a2a] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-[#39FF14]" />
          <h2 className="text-lg font-bold text-white font-mono">UBAH PASSWORD</h2>
        </div>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="btn-secondary text-sm font-mono px-4 py-2"
          >
            Ubah Password
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
                Password Saat Ini
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                placeholder="Min. 8 karakter"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#888] uppercase tracking-wider block mb-2">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#39FF14]"
                placeholder="Ulangi password baru"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                className="btn-primary text-sm font-mono px-4 py-2"
              >
                Simpan Password Baru
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="btn-secondary text-sm font-mono px-4 py-2"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveProfile}
          disabled={isPending}
          className="btn-primary text-sm font-mono font-bold px-6 py-3 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          Simpan Perubahan
        </button>
      </div>

      {/* Account Info */}
      <div className="bg-[#0a0a0a] border border-[#222] p-4 space-y-2 text-xs font-mono text-[#666]">
        <div>User ID: <span className="text-[#888]">{session.userId}</span></div>
        <div>Reputation: <span className="text-[#39FF14]">{profile.reputation || 100}</span></div>
        <div>Completed Deals: <span className="text-white">{profile.completed_deals || 0}</span></div>
        <div>Member Since: <span className="text-[#888]">{new Date(profile.created_at).toLocaleDateString('id-ID')}</span></div>
      </div>
    </main>
  );
}
