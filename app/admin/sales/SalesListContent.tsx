"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { EscrowOrderWithDetails, Session, CryptoCurrency, EscrowStatus } from "@/lib/types";
import { formatBtc, formatXmr, formatIdr, formatDateShort } from "@/lib/format";
import {
  ArrowLeftRight,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Coins,
  Search,
  Filter,
  KeyRound,
  UserCheck,
} from "lucide-react";

interface SalesListContentProps {
  initialOrders: EscrowOrderWithDetails[];
  session: Session;
}

export function SalesListContent({ initialOrders, session }: SalesListContentProps) {
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | CryptoCurrency>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      if (currencyFilter !== "ALL" && order.cryptoCurrency !== currencyFilter) return false;
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (order.orderNumber || order.id).toLowerCase().includes(q) ||
          order.listing.title.toLowerCase().includes(q) ||
          order.seller.codename.toLowerCase().includes(q) ||
          order.buyer.codename.toLowerCase().includes(q) ||
          (order.meetupLocation || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [initialOrders, currencyFilter, statusFilter, searchQuery]);

  // Aggregates
  const totalBtc = initialOrders
    .filter((o) => o.cryptoCurrency === "BTC")
    .reduce((sum, o) => sum + o.cryptoAmount, 0);

  const totalXmr = initialOrders
    .filter((o) => o.cryptoCurrency === "XMR")
    .reduce((sum, o) => sum + o.cryptoAmount, 0);

  const pendingMeetups = initialOrders.filter((o) => o.status === "MEETUP_IN_PROGRESS").length;
  const completedDeals = initialOrders.filter((o) => o.status === "COMPLETED").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-mono text-[#e8e8e8]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e1e1e] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 bg-[#39FF14] pulse-green inline-block" />
            <span
              className="text-[10px] uppercase tracking-widest text-[#39FF14] font-bold"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              ESCROW LEDGER // AUDIT LOG
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#e8e8e8]">
            P2P Escrow Transactions
          </h1>
          <p className="text-xs text-[#666] mt-1 font-sans">
            Pemantauan seluruh lalu lintas escrow peer-to-peer. Dana terkunci di multisig stealth vault dan hanya rilis setelah <strong className="text-[#39FF14]">KEDUA PIHAK (Buyer &amp; Seller)</strong> menekan tombol konfirmasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/marketplace"
            className="btn-ghost text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <ExternalLink size={13} />
            Buka Bazaar
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Total Volume BTC</div>
          <div className="text-lg font-bold font-mono" style={{ color: "#F7931A" }}>{formatBtc(totalBtc)}</div>
          <div className="text-[10px] text-[#444] mt-0.5">Bitcoin Network Escrow</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Total Volume XMR</div>
          <div className="text-lg font-bold font-mono" style={{ color: "#FF6600" }}>{formatXmr(totalXmr)}</div>
          <div className="text-[10px] text-[#444] mt-0.5">Monero Stealth Vault</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#FFB800] uppercase tracking-wider mb-1">Meetup Berlangsung</div>
          <div className="text-lg font-bold text-[#e8e8e8] font-mono">{pendingMeetups} Transaksi</div>
          <div className="text-[10px] text-[#666] mt-0.5">Menunggu Handshake Fisik</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#39FF14] uppercase tracking-wider mb-1">Deals Selesai (Dual Acc)</div>
          <div className="text-lg font-bold text-[#39FF14] font-mono">{completedDeals} Transaksi</div>
          <div className="text-[10px] text-[#666] mt-0.5">100% Release Berhasil</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111111] border border-[#1e1e1e]">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari order ID, barang, user codename, kota..."
            className="input-dark w-full pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Currency Toggle */}
          <div className="flex items-center border border-[#262626] bg-[#0a0a0a] p-0.5 text-xs">
            {(["ALL", "BTC", "XMR"] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrencyFilter(curr)}
                className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  currencyFilter === curr
                    ? curr === "BTC"
                      ? "bg-[#F7931A] text-black font-extrabold"
                      : curr === "XMR"
                      ? "bg-[#FF6600] text-black font-extrabold"
                      : "bg-[#39FF14] text-black font-extrabold"
                    : "text-[#666] hover:text-[#e8e8e8]"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-dark px-3 py-1.5 text-[11px] text-[#aaa]"
          >
            <option value="ALL">SEMUA STATUS</option>
            <option value="MEETUP_IN_PROGRESS">MEETUP IN PROGRESS</option>
            <option value="BUYER_CONFIRMED">BUYER SUDAH ACC</option>
            <option value="SELLER_CONFIRMED">SELLER SUDAH ACC</option>
            <option value="COMPLETED">COMPLETED (DUAL ACC)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#1e1e1e] bg-[#111111] text-[#666] uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Order ID &amp; Token</th>
              <th className="py-3 px-4">Barang Legal &amp; Kategori</th>
              <th className="py-3 px-4">Buyer / Seller Node</th>
              <th className="py-3 px-4">Lokasi Meetup Fisik</th>
              <th className="py-3 px-4 text-center">Dual Handshake Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181818]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#555]">
                  Tidak ada data transaksi escrow yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isBtc = order.cryptoCurrency === "BTC";
                const isCompleted = order.status === "COMPLETED";

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-[#141414] transition-colors group"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-[#e8e8e8] tracking-wider flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            isCompleted ? "bg-[#39FF14]" : "bg-[#FFB800] pulse-green"
                          }`}
                        />
                        {order.orderNumber}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 text-[9px] font-bold uppercase border"
                          style={{
                            color: isBtc ? "#F7931A" : "#FF6600",
                            borderColor: isBtc ? "#F7931A55" : "#FF660055",
                            backgroundColor: isBtc ? "#F7931A15" : "#FF660015",
                          }}
                        >
                          {order.cryptoCurrency}
                        </span>
                        <span className="font-bold text-[#e8e8e8] text-[11px]">
                          {isBtc
                            ? formatBtc(order.cryptoAmount)
                            : formatXmr(order.cryptoAmount)}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#555] mt-0.5">
                        ≈ {formatIdr(order.listing.fiatEstimateIdr)}
                      </div>
                    </td>

                    {/* Listing */}
                    <td className="py-3.5 px-4 align-top max-w-[240px]">
                      <div className="font-bold text-[#e8e8e8] group-hover:text-[#39FF14] transition-colors truncate">
                        {order.listing.title}
                      </div>
                      <div className="text-[10px] text-[#666] mt-0.5">
                        Kategori: {order.listing.category.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-[#39FF14] flex items-center gap-1 mt-1">
                        <ShieldCheck size={11} />
                        100% Legal Verified
                      </div>
                    </td>

                    {/* Nodes */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#39FF14] text-[10px] font-bold">BUY:</span>
                          <span className="font-bold text-[#e8e8e8]">{order.buyer.codename}</span>
                          <span className="text-[9px] text-[#555]">({order.buyer.reputation}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#FFB800] text-[10px] font-bold">SEL:</span>
                          <span className="font-bold text-[#e8e8e8]">{order.seller.codename}</span>
                          <span className="text-[9px] text-[#555]">({order.seller.reputation}%)</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-1.5 text-[#ccc]">
                        <MapPin size={13} className="text-[#39FF14] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[11px] text-[#e8e8e8]">
                            {order.meetupLocation}
                          </div>
                          <div className="text-[10px] text-[#555] mt-0.5">
                            Area Publik Aman
                          </div>
                          <div className="text-[10px] text-[#FFB800] mt-1 font-mono flex items-center gap-1">
                            <KeyRound size={10} />
                            OTP Handshake: <span className="font-bold">{order.handshakeOtp}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dual Handshake Status */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <div className="inline-flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {/* Buyer Check */}
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase font-bold border ${
                              order.buyerConfirmedAt
                                ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                                : "border-[#333] text-[#555]"
                            }`}
                            title={
                              order.buyerConfirmedAt
                                ? `Buyer ACC: ${formatDateShort(order.buyerConfirmedAt)}`
                                : "Menunggu ACC Buyer"
                            }
                          >
                            <UserCheck size={10} />
                            BUYER {order.buyerConfirmedAt ? "✓" : "..."}
                          </div>

                          <span className="text-[#444] text-xs">+</span>

                          {/* Seller Check */}
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase font-bold border ${
                              order.sellerConfirmedAt
                                ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/10"
                                : "border-[#333] text-[#555]"
                            }`}
                            title={
                              order.sellerConfirmedAt
                                ? `Seller ACC: ${formatDateShort(order.sellerConfirmedAt)}`
                                : "Menunggu ACC Seller"
                            }
                          >
                            <UserCheck size={10} />
                            SELLER {order.sellerConfirmedAt ? "✓" : "..."}
                          </div>
                        </div>

                        {/* Overall Badge */}
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <span className="badge-green text-[9px]">
                              SETTLED &amp; RELEASED
                            </span>
                          ) : (
                            <span className="badge-warn text-[9px]">
                              HANDSHAKE ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 align-middle text-right">
                      <Link
                        href={`/escrow/${order.id}`}
                        className="btn-ghost text-[10px] px-2.5 py-1.5 inline-flex items-center gap-1"
                      >
                        Handshake Room →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Protocol Guarantee Note */}
      <div className="p-4 bg-[#111111] border border-[#1e1e1e] text-xs text-[#666] space-y-1">
        <div className="font-bold text-[#39FF14] flex items-center gap-1.5 uppercase text-[11px]">
          <ShieldCheck size={14} />
          Multisig Dual-Approval Guarantee
        </div>
        <p className="text-[11px] text-[#777] leading-relaxed">
          Sistem PIXMART tidak melepaskan saldo BTC atau XMR kepada penjual sebelum tombol konfirmasi ditekan oleh kedua belah pihak di lokasi COD yang disepakati. Jika terjadi ketidakcocokan kondisi barang fisik, pembeli berhak membatalkan dan dana escrow akan dikembalikan secara utuh (refund) oleh Operator node.
        </p>
      </div>
    </div>
  );
}
