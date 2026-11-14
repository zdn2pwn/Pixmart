"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { PlatformMetrics, EscrowOrderWithDetails } from "@/lib/types";
import { formatBtc, formatXmr, formatTimeAgo } from "@/lib/format";
import {
  Radio, CheckCircle2, Clock, MapPin, Eye, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const CHART_DATA = [
  { city: "JKT Sel", xmr: 4.2 },
  { city: "Bandung", xmr: 3.1 },
  { city: "Surabaya", xmr: 2.4 },
  { city: "JKT Pst", xmr: 1.8 },
];

export function OwnerDashboardContent({
  metrics, orders, session,
}: {
  metrics: PlatformMetrics;
  orders: EscrowOrderWithDetails[];
  session: any;
}) {
  const [filter, setFilter] = useState("ALL");

  const filtered = orders.filter((o) => {
    if (filter === "ACTIVE") return o.status !== "COMPLETED";
    if (filter === "COMPLETED") return o.status === "COMPLETED";
    return true;
  });

  const kpiCards = [
    { label: "Volume BTC", value: formatBtc(metrics.totalVolumeBtc), sub: "Bitcoin escrow", color: "#F7931A" },
    { label: "Volume XMR", value: formatXmr(metrics.totalVolumeXmr), sub: "Monero escrow", color: "#FF6600" },
    { label: "Escrow Aktif", value: `${metrics.activeEscrowsCount}`, sub: "Meetup berlangsung", color: "#39FF14" },
    { label: "Deals Selesai", value: `${metrics.completedDealsCount}`, sub: "Dual-handshake settled", color: "#39FF14" },
  ];

  const FILTERS = [
    { key: "ALL", label: `Semua (${orders.length})` },
    { key: "ACTIVE", label: `Berlangsung (${metrics.activeEscrowsCount})` },
    { key: "COMPLETED", label: `Selesai (${metrics.completedDealsCount})` },
  ];

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1500px]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1e1e1e] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-[#39FF14] pulse-green inline-block" />
            <span className="text-[9px] font-mono text-[#39FF14] uppercase tracking-widest">
              Owner Traffic Radar
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#e8e8e8]">Command Center</h1>
          <p className="text-[11px] text-[#444] font-mono mt-0.5">
            Monitoring lalu lintas P2P escrow — BTC & XMR — seluruh Indonesia
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111111] border border-[#1e1e1e] px-4 py-2.5 font-mono text-[11px]">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#39FF14]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#39FF14]/60 radar-spin" />
            <span className="w-1 h-1 bg-[#39FF14] rounded-full pulse-green" />
          </div>
          <div>
            <div className="text-[#39FF14] font-bold text-[10px]">RADAR AKTIF</div>
            <div className="text-[#444] text-[9px]">{metrics.activeNodesCount} Peer Nodes</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1e1e1e]">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-[#0d0d0d] p-5 space-y-2">
            <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest">{kpi.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[9px] text-[#333] font-mono">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div>
            <div className="text-[9px] font-mono text-[#39FF14] uppercase tracking-widest mb-1">Volume Regional</div>
            <div className="text-sm font-bold text-[#e8e8e8]">Lalu Lintas Escrow Berdasarkan Kota</div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="city" tick={{ fontSize: 10, fill: "#444", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#444", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#111111] border border-[#2a2a2a] p-2.5 font-mono text-[11px]">
                        <div className="text-[#e8e8e8] font-bold mb-1">{label}</div>
                        <div style={{ color: "#FF6600" }}>XMR: {payload[0]?.value}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="xmr" fill="#39FF14" fillOpacity={0.8} radius={[1, 1, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-[#39FF14]" />
              <span className="text-[11px] font-mono font-bold text-[#e8e8e8]">Live Feed</span>
            </div>
            <span className="w-1.5 h-1.5 bg-[#39FF14] pulse-green inline-block" />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-52">
            {metrics.trafficFeed.map((feed) => (
              <div key={feed.id} className="bg-[#111111] border border-[#1e1e1e] p-2.5 space-y-1 hover:border-[#2a2a2a] transition-colors">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className={`font-bold ${
                    feed.type === "HANDSHAKE" ? "text-[#39FF14]"
                    : feed.type === "DEPOSIT" ? "text-[#F7931A]"
                    : feed.type === "RELEASE" ? "text-[#FFB800]"
                    : "text-[#4488FF]"
                  }`}>
                    [{feed.type}]
                  </span>
                  <span className="text-[#333]">{formatTimeAgo(feed.timestamp)}</span>
                </div>
                <div className="text-[#aaa] text-[10px]">{feed.title}</div>
                <div className="flex items-center justify-between text-[9px] text-[#333] font-mono">
                  <span>{feed.city}</span>
                  <span className="text-[#39FF14] font-bold">{feed.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escrow Ledger Table */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-mono text-[#39FF14] uppercase tracking-widest mb-1">Escrow Ledger</div>
            <div className="text-sm font-bold text-[#e8e8e8]">Seluruh Transaksi P2P</div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 border transition-all ${
                  filter === f.key
                    ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5"
                    : "border-[#2a2a2a] text-[#444] hover:border-[#333] hover:text-[#888]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead className="bg-[#111111] border-b border-[#1e1e1e] text-[9px] text-[#444] uppercase tracking-widest">
              <tr>
                <th className="py-3 px-3">Order</th>
                <th className="py-3 px-3">Barang</th>
                <th className="py-3 px-3">Buyer</th>
                <th className="py-3 px-3">Lokasi</th>
                <th className="py-3 px-3 text-right">Dana</th>
                <th className="py-3 px-3 text-center">Buyer</th>
                <th className="py-3 px-3 text-center">Seller</th>
                <th className="py-3 px-3 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]">
              {filtered.map((o) => {
                const buyerAcc = !!o.buyerConfirmedAt;
                const sellerAcc = !!o.sellerConfirmedAt;
                const done = o.status === "COMPLETED";

                return (
                  <tr key={o.id} className="hover:bg-[#0d0d0d] transition-colors">
                    <td className="py-3 px-3">
                      <Link href={`/escrow/${o.id}`} className="text-[#39FF14] hover:underline font-bold text-[10px]">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[#e8e8e8] font-bold max-w-[200px] truncate">{o.listing?.title}</div>
                      <div className="text-[9px] text-[#444]">Seller: {o.seller?.codename}</div>
                    </td>
                    <td className="py-3 px-3 text-[#888]">{o.buyer?.codename}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[#555] max-w-[160px]">
                        <MapPin size={9} className="shrink-0" />
                        <span className="truncate">{o.meetupLocation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#39FF14]">
                      {o.cryptoCurrency === "XMR" ? formatXmr(o.cryptoAmount) : formatBtc(o.cryptoAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {buyerAcc
                        ? <span className="badge-green text-[8px]">✓ ACC</span>
                        : <span className="badge-muted text-[8px]">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {sellerAcc
                        ? <span className="badge-green text-[8px]">✓ ACC</span>
                        : <span className="badge-muted text-[8px]">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/escrow/${o.id}`} className="inline-flex items-center gap-1 px-2 py-1 text-[9px] border border-[#2a2a2a] text-[#555] hover:border-[#39FF14] hover:text-[#39FF14] transition-all">
                        <Eye size={10} /> Room
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
