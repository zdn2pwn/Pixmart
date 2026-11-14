"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  KeyRound,
  Coins,
  MapPin,
  Lock,
  Cpu,
} from "lucide-react";

export function SettingsPageContent() {
  const [protocolFeePct, setProtocolFeePct] = useState("0.5");
  const [btcMultisigXpub, setBtcMultisigXpub] = useState(
    "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4QcmMmZSfPw..."
  );
  const [xmrViewKey, setXmrViewKey] = useState(
    "9f8a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0"
  );
  const [handshakeTimeoutHours, setHandshakeTimeoutHours] = useState("72");
  const [pgpKeyFingerprint, setPgpKeyFingerprint] = useState(
    "4A8F B120 9C77 662E 31A4 00D9 B9F1 2284 C4A9 E01F"
  );
  const [strictLegalCheck, setStrictLegalCheck] = useState(true);

  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl space-y-6 font-mono text-[#e8e8e8]">
      {/* Header */}
      <div className="border-b border-[#1e1e1e] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 bg-[#39FF14] pulse-green inline-block" />
          <span
            className="text-[10px] uppercase tracking-widest text-[#39FF14] font-bold"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            PROTOCOL PARAMETERS // CONFIG
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#e8e8e8]">
          PIXMART Escrow Configuration
        </h1>
        <p className="text-xs text-[#666] mt-1 font-sans">
          Parameter operasional multisig vault Bitcoin, Monero view key, fee protokol, dan aturan keselamatan serah terima fisik (COD).
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/40 text-[#39FF14] text-xs p-3">
          <CheckCircle2 size={15} />
          <span>Parameter protokol berhasil disimpan dan disinkronkan ke node!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Multisig Vault */}
        <div className="bg-[#111111] border border-[#1e1e1e] p-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "#F7931A" }}>
            <Coins size={14} /> 1. MULTISIG CRYPTO ESCROW VAULT
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-[#777] uppercase tracking-wider">
                Bitcoin Multisig Master Extended Public Key (xpub)
              </label>
              <input
                type="text"
                value={btcMultisigXpub}
                onChange={(e) => setBtcMultisigXpub(e.target.value)}
                className="input-dark w-full text-xs font-mono"
              />
              <span className="text-[10px] text-[#555] block">
                Digunakan untuk generate alamat deposit unik tanpa mengekspos private key.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] text-[#777] uppercase tracking-wider">
                Monero Private View Key (Auditing &amp; Stealth Subaddress)
              </label>
              <input
                type="text"
                value={xmrViewKey}
                onChange={(e) => setXmrViewKey(e.target.value)}
                className="input-dark w-full text-xs font-mono"
              />
              <span className="text-[10px] text-[#555] block">
                Hanya membaca saldo masuk untuk verifikasi escrow tanpa hak transfer (spend key aman di cold storage).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-[#777] uppercase tracking-wider">
                  Protokol Escrow Fee (%)
                </label>
                <input
                  type="text"
                  value={protocolFeePct}
                  onChange={(e) => setProtocolFeePct(e.target.value)}
                  className="input-dark w-full text-xs font-mono"
                />
                <span className="text-[10px] text-[#555] block">
                  Fee dipotong dari transaksi setelah kedua pihak menekan ACC.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-[#777] uppercase tracking-wider">
                  Handshake Timeout (Jam)
                </label>
                <input
                  type="text"
                  value={handshakeTimeoutHours}
                  onChange={(e) => setHandshakeTimeoutHours(e.target.value)}
                  className="input-dark w-full text-xs font-mono"
                />
                <span className="text-[10px] text-[#555] block">
                  Batas waktu serah terima fisik sebelum opsi auto-refund aktif.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Legal */}
        <div className="bg-[#111111] border border-[#1e1e1e] p-5 space-y-4">
          <div className="text-xs font-bold text-[#39FF14] uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} /> 2. KEPATUHAN HUKUM &amp; KEAMANAN FISIK (COD)
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-[#777] uppercase tracking-wider">
                Owner Node PGP Key Fingerprint
              </label>
              <input
                type="text"
                value={pgpKeyFingerprint}
                onChange={(e) => setPgpKeyFingerprint(e.target.value)}
                className="input-dark w-full text-xs font-mono"
              />
            </div>

            <div className="p-3.5 bg-[#161616] border border-[#262626] flex items-start gap-3">
              <input
                type="checkbox"
                id="strictLegal"
                checked={strictLegalCheck}
                onChange={(e) => setStrictLegalCheck(e.target.checked)}
                className="mt-0.5 accent-[#39FF14] cursor-pointer"
              />
              <label htmlFor="strictLegal" className="text-[11px] text-[#888] cursor-pointer leading-relaxed">
                <strong className="text-[#e8e8e8]">Wajibkan Verifikasi 100% Legalitas Hardware</strong>
                <p className="text-[10px] text-[#666] mt-0.5">
                  Setiap listing baru akan secara otomatis diwajibkan mencantumkan garansi keabsahan barang legal. Listing yang melanggar akan langsung diblokir dari transmisi node.
                </p>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary px-6 py-3 text-xs tracking-wider flex items-center gap-2 cursor-pointer"
        >
          <Save size={14} />
          SIMPAN KONFIGURASI PROTOKOL
        </button>
      </form>
    </div>
  );
}
