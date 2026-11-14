"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type {
  PlatformMetrics,
  EscrowRoomWithDetails,
  User,
  Listing,
  AuditLogEntry,
} from "@/lib/types";
import { formatBtc, formatXmr, formatTimeAgo } from "@/lib/format";
import { resolveDisputeAction } from "@/app/actions/escrow";
import {
  Radio,
  CheckCircle2,
  Clock,
  MapPin,
  Eye,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Users,
  Package,
  FileText,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CHART_DATA = [
  { city: "JKT Sel", deals: 14 },
  { city: "Bandung", deals: 8 },
  { city: "Buleleng", deals: 6 },
  { city: "Surabaya", deals: 5 },
];

export function OwnerDashboardContent({
  metrics,
  rooms,
  users,
  listings,
  auditLogs,
  session,
}: {
  metrics: PlatformMetrics;
  rooms: EscrowRoomWithDetails[];
  users: User[];
  listings: Listing[];
  auditLogs: AuditLogEntry[];
  session: any;
}) {
  const [activeTab, setActiveTab] = useState<"RADAR" | "DISPUTES" | "AUDIT" | "USERS">("RADAR");
  const [filter, setFilter] = useState("ALL");
  const [resolvingRoomId, setResolvingRoomId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredRooms = rooms.filter((r) => {
    if (filter === "ACTIVE") return r.meetingStatus !== "COMPLETED" && r.meetingStatus !== "CANCELLED";
    if (filter === "COMPLETED") return r.meetingStatus === "COMPLETED";
    if (filter === "DISPUTED") return r.meetingStatus === "DISPUTED";
    return true;
  });

  const disputesList = rooms.filter((r) => r.meetingStatus === "DISPUTED" || r.dispute);

  const kpiCards = [
    { label: "Deal Selesai", value: `${metrics.totalDealsCompleted}`, sub: "Dual-handshake COD settled", color: "#39FF14" },
    { label: "Escrow Aktif", value: `${metrics.activeEscrowsCount}`, sub: "Koordinasi titik temu", color: "#FFB800" },
    { label: "Negosiasi Berjalan", value: `${metrics.activeNegotiationsCount}`, sub: "P2P offer/counter", color: "#39FF14" },
    { label: "Tingkat Dispute", value: `${metrics.disputeRatePct}%`, sub: "Sengketa termonitor", color: metrics.disputeRatePct > 0 ? "#FF3B30" : "#39FF14" },
  ];

  async function handleResolveDispute(roomId: string) {
    if (!resolutionNote.trim()) return;
    const fd = new FormData();
    fd.append("roomId", roomId);
    fd.append("resolutionNote", resolutionNote);

    startTransition(async () => {
      await resolveDisputeAction(fd);
      setResolvingRoomId(null);
      setResolutionNote("");
    });
  }

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1500px]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1e1e1e] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-[#39FF14] pulse-green inline-block" />
            <span className="text-[9px] font-mono text-[#39FF14] uppercase tracking-widest font-bold">
              OWNER SYSTEM RADAR &amp; AUDIT MONITOR
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#e8e8e8]">System Command Center</h1>
          <p className="text-[11px] text-[#888] font-mono mt-0.5">
            Monitoring seluruh arus negosiasi, escrow COD, presensi handshake, dan audit trail lokal
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111111] border border-[#1e1e1e] px-4 py-2.5 font-mono text-[11px]">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#39FF14]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#39FF14]/60 radar-spin" />
            <span className="w-1 h-1 bg-[#39FF14] rounded-full pulse-green" />
          </div>
          <div>
            <div className="text-[#39FF14] font-bold text-[10px]">RADAR ONLINE</div>
            <div className="text-[#666] text-[9px]">{users.length} Active Nodes (Buyers/Sellers)</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1e1e1e]">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-[#0d0d0d] p-5 space-y-2">
            <div className="text-[9px] font-mono text-[#666] uppercase tracking-widest">{kpi.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[9px] text-[#444] font-mono">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] gap-1 overflow-x-auto font-mono text-xs">
        {[
          { key: "RADAR", label: "Escrow Radar & Ledger", icon: Radio },
          { key: "DISPUTES", label: `Dispute Center (${disputesList.length})`, icon: AlertTriangle },
          { key: "AUDIT", label: `Audit Trail (${auditLogs.length})`, icon: FileText },
          { key: "USERS", label: `Direktori User & Produk (${users.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5"
                  : "border-transparent text-[#888] hover:text-[#ccc]"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RADAR & LEDGER */}
      {activeTab === "RADAR" && (
        <div className="space-y-6">
          {/* Chart + Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-5 space-y-4">
              <div>
                <div className="text-[9px] font-mono text-[#39FF14] uppercase tracking-widest mb-1">
                  Volume Transaksi per Wilayah
                </div>
                <div className="text-sm font-bold text-[#e8e8e8]">
                  Distribusi Transaksi COD Berdasarkan Kota/Kabupaten
                </div>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                    <XAxis dataKey="city" tick={{ fontSize: 10, fill: "#666", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#666", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-[#111111] border border-[#2a2a2a] p-2.5 font-mono text-[11px]">
                            <div className="text-[#e8e8e8] font-bold mb-1">{label}</div>
                            <div className="text-[#39FF14]">Transaksi: {payload[0]?.value} deal</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="deals" fill="#39FF14" fillOpacity={0.8} radius={[1, 1, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Live Audit Snippet */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-[#39FF14]" />
                  <span className="text-[11px] font-mono font-bold text-[#e8e8e8]">Live Event Stream</span>
                </div>
                <span className="w-1.5 h-1.5 bg-[#39FF14] pulse-green inline-block" />
              </div>

              <div className="space-y-2 overflow-y-auto max-h-44 text-[10px] font-mono">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="bg-[#111111] border border-[#1e1e1e] p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[#888]">
                      <span className="text-[#39FF14] font-bold">[{log.action}]</span>
                      <span>{formatTimeAgo(log.timestamp)}</span>
                    </div>
                    <div className="text-[#ccc] truncate">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-mono text-[#39FF14] uppercase tracking-widest mb-1">
                  Escrow Room Ledger
                </div>
                <div className="text-sm font-bold text-[#e8e8e8]">Seluruh Transaksi P2P Berjalan</div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {[
                  { key: "ALL", label: `Semua (${rooms.length})` },
                  { key: "ACTIVE", label: `Berjalan (${metrics.activeEscrowsCount})` },
                  { key: "COMPLETED", label: `Selesai (${metrics.totalDealsCompleted})` },
                  { key: "DISPUTED", label: `Dispute (${disputesList.length})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 border transition-all cursor-pointer ${
                      filter === f.key
                        ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5"
                        : "border-[#2a2a2a] text-[#666] hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-[#111111] border-b border-[#1e1e1e] text-[9px] text-[#666] uppercase tracking-widest">
                  <tr>
                    <th className="py-3 px-3">Room ID</th>
                    <th className="py-3 px-3">Barang</th>
                    <th className="py-3 px-3">Buyer &amp; Seller</th>
                    <th className="py-3 px-3">Titik Temu</th>
                    <th className="py-3 px-3 text-right">Nilai Deal</th>
                    <th className="py-3 px-3 text-center">Kehadiran</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]">
                  {filteredRooms.map((r) => (
                    <tr key={r.id} className="hover:bg-[#111111] transition-colors">
                      <td className="py-3 px-3">
                        <Link href={`/escrow/${r.id}`} className="text-[#39FF14] hover:underline font-bold">
                          {r.id}
                        </Link>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-bold text-white truncate">{r.listing?.title}</div>
                        <div className="text-[10px] text-[#666]">{r.listing?.locationCity}</div>
                      </td>
                      <td className="py-3 px-3 text-[#aaa]">
                        <div>B: {r.buyer?.codename}</div>
                        <div>S: {r.seller?.codename}</div>
                      </td>
                      <td className="py-3 px-3 max-w-[180px] text-[#888]">
                        <div className="truncate">
                          {r.meetingConfirmed?.locationName || r.meetingProposal?.locationName || "Belum disepakati"}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-white font-bold">
                        Rp {r.finalPriceIdr.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.buyerArrived && r.sellerArrived ? (
                          <span className="text-[#39FF14] font-bold text-[10px]">KEDUA HADIR</span>
                        ) : r.buyerArrived || r.sellerArrived ? (
                          <span className="text-[#FFB800] text-[10px]">1 TIBA</span>
                        ) : (
                          <span className="text-[#555] text-[10px]">MENUNGGU</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 border ${
                            r.meetingStatus === "COMPLETED"
                              ? "bg-[#39FF14]/10 border-[#39FF14]/50 text-[#39FF14]"
                              : r.meetingStatus === "DISPUTED"
                              ? "bg-red-950/40 border-red-500/50 text-red-400"
                              : "bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]"
                          }`}
                        >
                          {r.meetingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/escrow/${r.id}`}
                          className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#39FF14] text-[10px] text-[#39FF14] transition-all"
                        >
                          Buka Room
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPUTE CENTER */}
      {activeTab === "DISPUTES" && (
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <span>Pusat Mediasi Sengketa (Dispute Management)</span>
            </h3>
            <p className="text-xs text-[#888] font-mono mt-1">
              Sebagai Owner, pantau laporan kendala dari Buyer/Seller dan selesaikan secara adil.
            </p>
          </div>

          {disputesList.length === 0 ? (
            <div className="p-8 bg-[#111111] border border-[#222] text-center text-xs font-mono text-[#888]">
              ✓ Tidak ada sengketa (dispute) aktif saat ini. Seluruh transaksi berjalan lancar!
            </div>
          ) : (
            <div className="space-y-4">
              {disputesList.map((r) => (
                <div key={r.id} className="p-5 bg-[#141414] border border-red-500/40 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#39FF14] font-bold">Room #{r.id}</span>
                    <span className="text-red-400 font-bold">STATUS: {r.meetingStatus}</span>
                  </div>
                  <div className="text-white font-bold">{r.listing?.title}</div>
                  <div className="text-xs text-[#ccc]">
                    <strong>Alasan Sengketa:</strong> {r.dispute?.reason || "Kendala transaksi dilaporkan"}
                  </div>
                  {r.dispute?.description && (
                    <div className="text-xs text-[#888] bg-[#0f0f0f] p-3 border border-[#262626]">
                      "{r.dispute.description}"
                    </div>
                  )}

                  {r.dispute?.resolved ? (
                    <div className="text-xs text-[#39FF14] pt-2 border-t border-[#222]">
                      ✓ Sengketa telah diselesaikan oleh Owner: {r.dispute.resolutionNote}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#222]">
                      {resolvingRoomId === r.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            rows={2}
                            placeholder="Tuliskan catatan resolusi mediasi..."
                            className="input-dark w-full p-2.5 text-xs font-mono"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setResolvingRoomId(null)}
                              className="btn-secondary text-xs px-3 py-1.5"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleResolveDispute(r.id)}
                              disabled={isPending || !resolutionNote.trim()}
                              className="btn-primary text-xs font-bold px-4 py-1.5"
                            >
                              Simpan Resolusi &amp; Selesaikan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingRoomId(r.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold cursor-pointer"
                        >
                          Selesaikan Sengketa Ini (Resolve Dispute)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === "AUDIT" && (
        <div className="card p-6 space-y-4 font-mono">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-[#39FF14]" />
              <span>Immutable System Audit Trail</span>
            </h3>
            <p className="text-xs text-[#888] mt-1">
              Catatan sistem permanen dari seluruh penawaran, handshake, titik temu, dan konfirmasi COD.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#111111] border-b border-[#222] text-[#666] text-[9px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Aktor</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Target ID</th>
                  <th className="py-2.5 px-3">Rincian Peristiwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121212]">
                    <td className="py-2.5 px-3 text-[#666] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-white font-bold">{log.actorRole}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[#39FF14] font-bold">{log.action}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#888]">{log.targetId}</td>
                    <td className="py-2.5 px-3 text-[#ccc]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS & PRODUCTS */}
      {activeTab === "USERS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Directory */}
          <div className="card p-5 space-y-4 font-mono">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Users size={16} className="text-[#39FF14]" />
              <span>Direktori User ({users.length})</span>
            </h3>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="p-3 bg-[#111111] border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{u.codename}</div>
                    <div className="text-[10px] text-[#666]">
                      {u.role} • {u.locationCity}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[#39FF14] font-bold">{u.reputation}%</span>
                    <div className="text-[10px] text-[#888]">{u.completedDeals} deals</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Listings Directory */}
          <div className="card p-5 space-y-4 font-mono">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Package size={16} className="text-[#39FF14]" />
              <span>Daftar Produk ({listings.length})</span>
            </h3>
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l.id} className="p-3 bg-[#111111] border border-[#222] flex items-center justify-between text-xs">
                  <div className="max-w-[260px]">
                    <div className="font-bold text-white truncate">{l.title}</div>
                    <div className="text-[10px] text-[#39FF14]">
                      {l.locationDistrict}, {l.locationCity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">Rp {l.fiatEstimateIdr.toLocaleString("id-ID")}</div>
                    <div className="text-[10px] text-[#666]">{l.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
