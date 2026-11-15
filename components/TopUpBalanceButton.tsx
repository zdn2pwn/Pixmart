"use client";

import { useState, useTransition } from "react";
import { topUpBalanceAction } from "@/app/actions/payment";
import { Wallet, Plus } from "lucide-react";

interface TopUpBalanceButtonProps {
  currentBalanceBtc?: number;
  currentBalanceXmr?: number;
}

export function TopUpBalanceButton({ currentBalanceBtc = 0, currentBalanceXmr = 0 }: TopUpBalanceButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [cryptoType, setCryptoType] = useState<"BTC" | "XMR">("BTC");
  const [amount, setAmount] = useState("0.001");
  const [isPending, startTransition] = useTransition();

  async function handleTopUp() {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > 1) {
      alert("Jumlah tidak valid (max: 1 BTC/XMR)");
      return;
    }

    startTransition(async () => {
      const result = await topUpBalanceAction(cryptoType, numAmount);
      if (result.success) {
        alert(`✅ Top-up berhasil! Saldo ${cryptoType} baru: ${result.newBalance?.toFixed(8)}`);
        setShowModal(false);
      } else {
        alert(`❌ Top-up gagal: ${result.error}`);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14] px-3 py-2 text-xs font-bold transition-colors"
      >
        <Plus size={14} />
        <span>Top-Up Saldo</span>
      </button>

      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-[#39FF14]/50 max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet size={20} className="text-[#39FF14]" />
                <span>Top-Up Saldo (Demo)</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#888] block mb-1">Saldo Saat Ini:</label>
                  <div className="text-sm font-mono text-white">
                    <div>BTC: {currentBalanceBtc.toFixed(8)}</div>
                    <div>XMR: {currentBalanceXmr.toFixed(4)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#888] block mb-1">Pilih Crypto:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCryptoType("BTC")}
                      className={`py-2 text-sm font-bold border transition-colors ${
                        cryptoType === "BTC"
                          ? "bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]"
                          : "bg-[#1a1a1a] border-[#333] text-[#888]"
                      }`}
                    >
                      BTC
                    </button>
                    <button
                      onClick={() => setCryptoType("XMR")}
                      className={`py-2 text-sm font-bold border transition-colors ${
                        cryptoType === "XMR"
                          ? "bg-[#FF6600]/20 border-[#FF6600] text-[#FF6600]"
                          : "bg-[#1a1a1a] border-[#333] text-[#888]"
                      }`}
                    >
                      XMR
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#888] block mb-1">Jumlah:</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#39FF14]"
                  />
                  <div className="text-[10px] text-[#666] mt-1">
                    Max: 1 {cryptoType} per top-up
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222] flex gap-2">
                  <button
                    onClick={handleTopUp}
                    disabled={isPending}
                    className="flex-1 bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2.5 text-sm font-bold disabled:opacity-50"
                  >
                    {isPending ? "Processing..." : "Konfirmasi Top-Up"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2.5 text-sm font-bold"
                  >
                    Batal
                  </button>
                </div>

                <div className="text-[10px] text-[#666] text-center">
                  💡 Ini adalah demo sistem. Di production, gunakan payment gateway real.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
