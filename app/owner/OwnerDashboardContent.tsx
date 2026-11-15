"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Activity,
  DollarSign,
  Package,
  Users,
  Eye,
} from "lucide-react";

export function OwnerDashboardContent({
  session,
  escrowSessions,
  recentActivities,
  stats,
}: {
  session: any;
  escrowSessions: any[];
  recentActivities: any[];
  stats: {
    active: number;
    completed: number;
    needsAction: number;
  };
}) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "ACTIVE" | "COMPLETED" | "ACTIVITIES">("OVERVIEW");

  const needsActionEscrows = escrowSessions.filter((e: any) => 
    (e.payment_status === 'RECEIVED' && !e.funds_held) ||
    (e.buyer_confirmed && e.seller_confirmed && !e.midman_verified)
  );

  const activeEscrows = escrowSessions.filter((e: any) => 
    !e.completed_at && e.status !== "CANCELLED"
  );

  const completedEscrows = escrowSessions.filter((e: any) => e.completed_at);

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-[#222] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-2 font-bold">
          <ShieldCheck size={16} />
          <span>MIDMAN CONTROL PANEL</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Escrow Transaction Manager
        </h1>
        <p className="text-sm text-[#888] mt-1 font-sans">
          Kelola dan verifikasi seluruh transaksi escrow sebagai pihak ketiga terpercaya.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-5">
          <div className="flex items-center justify-between mb-3">
            <Clock size={20} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#666]">ACTIVE</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono">{stats.active}</div>
          <div className="text-xs text-[#888] mt-1">Escrow Berjalan</div>
        </div>

        <div className="bg-[#121212] border border-[#FF6600]/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle size={20} className="text-[#FF6600]" />
            <span className="text-xs font-mono text-[#666]">ACTION</span>
          </div>
          <div className="text-3xl font-bold text-[#FF6600] font-mono">{stats.needsAction}</div>
          <div className="text-xs text-[#888] mt-1">Butuh Verifikasi</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 size={20} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#666]">DONE</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono">{stats.completed}</div>
          <div className="text-xs text-[#888] mt-1">Transaksi Selesai</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={20} className="text-[#39FF14]" />
            <span className="text-xs font-mono text-[#666]">HELD</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {escrowSessions.filter((e: any) => e.funds_held && !e.funds_released).length}
          </div>
          <div className="text-xs text-[#888] mt-1">Dana Ditahan</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222]">
        {[
          { id: "OVERVIEW", label: "Overview", icon: Activity },
          { id: "ACTIVE", label: `Active (${stats.active})`, icon: Clock },
          { id: "COMPLETED", label: `Completed (${stats.completed})`, icon: CheckCircle2 },
          { id: "ACTIVITIES", label: "Activity Log", icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`px-4 py-3 text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === id
                ? "text-[#39FF14] border-b-2 border-[#39FF14]"
                : "text-[#666] hover:text-[#aaa]"
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Needs Action */}
          {needsActionEscrows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#FF6600]">
                <AlertTriangle size={16} />
                <span>Transaksi Membutuhkan Aksi Midman ({needsActionEscrows.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {needsActionEscrows.map((escrow: any) => (
                  <EscrowCard key={escrow.id} escrow={escrow} highlight="ACTION" />
                ))}
              </div>
            </div>
          )}

          {/* Recent Active */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">Escrow Aktif Terbaru</div>
              <button
                onClick={() => setActiveTab("ACTIVE")}
                className="text-xs text-[#39FF14] hover:underline font-mono"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {activeEscrows.slice(0, 5).map((escrow: any) => (
                <EscrowCard key={escrow.id} escrow={escrow} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "ACTIVE" && (
        <div className="space-y-3">
          {activeEscrows.length === 0 ? (
            <div className="bg-[#111] border border-[#222] p-12 text-center">
              <Clock size={40} className="mx-auto text-[#444] mb-3" />
              <div className="text-white font-bold mb-1">Tidak Ada Escrow Aktif</div>
              <p className="text-xs text-[#777]">Semua transaksi sudah diselesaikan atau belum ada transaksi baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activeEscrows.map((escrow: any) => (
                <EscrowCard key={escrow.id} escrow={escrow} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "COMPLETED" && (
        <div className="space-y-3">
          {completedEscrows.length === 0 ? (
            <div className="bg-[#111] border border-[#222] p-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-[#444] mb-3" />
              <div className="text-white font-bold mb-1">Belum Ada Transaksi Selesai</div>
              <p className="text-xs text-[#777]">Transaksi yang sudah diverifikasi dan diselesaikan akan muncul di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {completedEscrows.map((escrow: any) => (
                <EscrowCard key={escrow.id} escrow={escrow} completed />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ACTIVITIES" && (
        <div className="space-y-3">
          <div className="text-xs text-[#666] font-mono">AUDIT TRAIL • {recentActivities.length} Activities</div>
          {recentActivities.map((activity: any) => (
            <div key={activity.id} className="bg-[#111] border border-[#222] p-4 flex items-start gap-4">
              <div className="text-xs font-mono text-[#666] w-32 shrink-0">
                {new Date(activity.created_at).toLocaleString("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white mb-1">
                  {activity.actor?.codename || "System"} • {activity.actor_role}
                </div>
                <div className="text-xs text-[#aaa]">
                  <span className="text-[#39FF14] font-mono">{activity.action}</span> • {activity.description}
                </div>
              </div>
              <Link 
                href={`/owner/escrow/${activity.escrow_id}`}
                className="text-xs text-[#39FF14] hover:underline font-mono shrink-0"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function EscrowCard({ escrow, highlight, completed }: { escrow: any; highlight?: "ACTION"; completed?: boolean }) {
  const listing = escrow.negotiation?.listing;
  const agreedPriceIdr = (escrow as any).agreed_price_idr || 0;

  return (
    <Link
      href={`/owner/escrow/${escrow.id}`}
      className={`block bg-[#111] border p-4 hover:border-[#39FF14] transition-all group ${
        highlight === "ACTION" ? "border-[#FF6600]/50 shadow-[0_0_15px_rgba(255,102,0,0.15)]" : "border-[#222]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#39FF14]">#{escrow.id.slice(0, 8)}</span>
            {highlight === "ACTION" && (
              <span className="badge-warn text-[10px] animate-pulse">ACTION REQUIRED</span>
            )}
            {completed && (
              <span className="badge-green text-[10px]">COMPLETED</span>
            )}
          </div>

          <div className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors">
            {(escrow as any).item_title || listing?.title || "Produk"}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#888]">
            <span className="flex items-center gap-1">
              <Users size={11} />
              Buyer: {escrow.buyer?.codename || "Unknown"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Package size={11} />
              Seller: {escrow.seller?.codename || "Unknown"}
            </span>
          </div>

          <div className="text-xs font-mono text-[#39FF14]">
            Rp {agreedPriceIdr.toLocaleString("id-ID")}
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="text-xs font-mono text-[#666]">
            {escrow.payment_status || "AWAITING_PAYMENT"}
          </div>
          {escrow.funds_held && !escrow.funds_released && (
            <div className="badge-warn text-[10px]">FUNDS HELD</div>
          )}
          <div className="flex items-center gap-1 text-xs text-[#39FF14] font-mono font-bold">
            <Eye size={12} />
            <span>Kelola</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}
