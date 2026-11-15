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
      <div className="pb-4 border-b border-[#3A3157]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-[#C8FF4D]/10 border-2 border-[#C8FF4D] flex items-center justify-center">
            <User size={24} className="text-[#C8FF4D]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cream">Profile Settings</h1>
            <p className="text-xs font-mono text-[#A79EC2]">
              Role: <span className="text-[#C8FF4D]">{session.role}</span> • Email: {session.email}
            </p>
          </div>
        </div>
      </div>

      {/* Reputation card */}
      <div className="bg-[#12101F] border border-[#3A3157] p-4 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-[10px] font-mono text-[#A79EC2] uppercase tracking-wider">Reputation</div>
          <div className="text-2xl font-bold text-[#C8FF4D] font-mono">{profile.reputation ?? 100}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-[#A79EC2] uppercase tracking-wider">Completed deals</div>
          <div className="text-2xl font-bold text-cream font-mono">{profile.completed_deals ?? 0}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-[#A79EC2] uppercase tracking-wider">Role</div>
          <div className="text-sm font-bold text-cream">{session.role}</div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 border font-mono text-sm ${
            message.type === "success"
              ? "bg-[#C8FF4D]/10 border-[#C8FF4D] text-[#C8FF4D]"
              : "bg-[#FF6B6B]/10 border-[#FF6B6B] text-[#FF6B6B]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-[#19152B] border border-[#3A3157] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-[#C8FF4D]" />
          <h2 className="text-lg font-bold text-cream font-mono">INFORMASI PROFIL</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
              Codename (Nama Anonim)
            </label>
            <input
              type="text"
              value={codename}
              onChange={(e) => setCodename(e.target.value)}
              className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D]"
              placeholder="Anonymous Seller #1234"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
                <MapPin size={12} className="inline mr-1" />
                Kota
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D]"
                placeholder="Jakarta Selatan"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
                Kecamatan
              </label>
              <input
                type="text"
                value={locationDistrict}
                onChange={(e) => setLocationDistrict(e.target.value)}
                className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D]"
                placeholder="Kebayoran Baru"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
              Bio (Opsional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D] resize-none"
              placeholder="Ceritakan sedikit tentang kamu..."
            />
          </div>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="bg-[#19152B] border border-[#3A3157] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-[#C8FF4D]" />
          <h2 className="text-lg font-bold text-cream font-mono">WALLET ADDRESSES</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
              Bitcoin (BTC) Address
            </label>
            <input
              type="text"
              value={walletBtc}
              onChange={(e) => setWalletBtc(e.target.value)}
              className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-xs focus:outline-none focus:border-[#C8FF4D]"
              placeholder="bc1q..."
            />
            <p className="text-[10px] font-mono text-[#8B82A6] mt-1">
              Untuk menerima pembayaran BTC dari escrow
            </p>
          </div>

          <div>
            <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
              Monero (XMR) Address
            </label>
            <input
              type="text"
              value={walletXmr}
              onChange={(e) => setWalletXmr(e.target.value)}
              className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-xs focus:outline-none focus:border-[#C8FF4D]"
              placeholder="4..."
            />
            <p className="text-[10px] font-mono text-[#8B82A6] mt-1">
              Untuk menerima pembayaran XMR dari escrow (privasi maksimal)
            </p>
          </div>
        </div>

        <div className="bg-[#C8FF4D]/5 border border-[#C8FF4D]/30 p-3 text-xs font-mono text-[#A79EC2]">
          <Shield size={14} className="inline text-[#C8FF4D] mr-2" />
          Wallet address ini digunakan untuk withdrawal dari platform. Pastikan address yang kamu masukkan benar!
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#19152B] border border-[#3A3157] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-[#C8FF4D]" />
          <h2 className="text-lg font-bold text-cream font-mono">UBAH PASSWORD</h2>
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
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
                Password Saat Ini
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D]"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
                Password Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D]"
                placeholder="Min. 8 karakter"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#A79EC2] uppercase tracking-wider block mb-2">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0A0812] border border-[#3A3157] text-cream px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#C8FF4D]"
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
      <div className="bg-[#0A0812] border border-[#3A3157] p-4 space-y-2 text-xs font-mono text-[#8B82A6]">
        <div>User ID: <span className="text-[#A79EC2]">{session.userId}</span></div>
        <div>Reputation: <span className="text-[#C8FF4D]">{profile.reputation || 100}</span></div>
        <div>Completed Deals: <span className="text-cream">{profile.completed_deals || 0}</span></div>
        <div>Member Since: <span className="text-[#A79EC2]">{new Date(profile.created_at).toLocaleDateString('id-ID')}</span></div>
      </div>
    </main>
  );
}
