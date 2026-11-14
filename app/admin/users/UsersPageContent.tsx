"use client";

import { useState } from "react";
import type { User, UserRole, Session } from "@/lib/types";
import {
  Users,
  Shield,
  ShieldCheck,
  Star,
  MapPin,
  Coins,
  Search,
  KeyRound,
  CheckCircle2,
  Terminal,
} from "lucide-react";

interface UsersPageContentProps {
  initialUsers: User[];
  session: Session;
}

export function UsersPageContent({ initialUsers, session }: UsersPageContentProps) {
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = initialUsers.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        u.codename.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.locationCity.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const ownerCount = initialUsers.filter((u) => u.role === "OWNER").length;
  const sellerCount = initialUsers.filter((u) => u.role === "SELLER").length;
  const buyerCount = initialUsers.filter((u) => u.role === "BUYER").length;

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
              NODE TOPOLOGY // IDENTITY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#e8e8e8]">
            Peer Nodes &amp; User Reputation
          </h1>
          <p className="text-xs text-[#666] mt-1 font-sans">
            Daftar seluruh node terdaftar dalam jaringan PIXMART. Reputasi meningkat secara otomatis setiap kali serah terima fisik (Dual Handshake) diselesaikan tanpa sengketa.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#666] uppercase tracking-wider mb-1">Total Active Nodes</div>
          <div className="text-lg font-bold text-[#e8e8e8]">{initialUsers.length} Peers</div>
          <div className="text-[10px] text-[#444] mt-0.5">Jaringan Terdistribusi</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#39FF14] uppercase tracking-wider mb-1">Owner / Operator Node</div>
          <div className="text-lg font-bold text-[#39FF14]">{ownerCount} Root</div>
          <div className="text-[10px] text-[#666] mt-0.5">Traffic &amp; Escrow Arbiter</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#FFB800] uppercase tracking-wider mb-1">Seller Nodes (Merchants)</div>
          <div className="text-lg font-bold text-[#FFB800]">{sellerCount} Nodes</div>
          <div className="text-[10px] text-[#666] mt-0.5">Penyedia Hardware Legal</div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1e1e1e]">
          <div className="text-[10px] text-[#4488FF] uppercase tracking-wider mb-1">Buyer Nodes (Shoppers)</div>
          <div className="text-lg font-bold text-[#4488FF]">{buyerCount} Nodes</div>
          <div className="text-[10px] text-[#666] mt-0.5">Pengunci Saldo Escrow</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111111] border border-[#1e1e1e]">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari codename, email, atau kota domisili..."
            className="input-dark w-full pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-dark px-3 py-2 text-xs text-[#aaa]"
          >
            <option value="ALL">SEMUA PERAN (ROLES)</option>
            <option value="OWNER">OWNER PROTOCOL</option>
            <option value="SELLER">SELLER (MERCHANT)</option>
            <option value="BUYER">BUYER (SHOPPER)</option>
          </select>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="border-b border-[#1e1e1e] bg-[#111111] text-[#666] uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Node Codename &amp; ID</th>
              <th className="py-3 px-4">Role System</th>
              <th className="py-3 px-4">Reputasi &amp; Kepercayaan</th>
              <th className="py-3 px-4">Total Deals Selesai</th>
              <th className="py-3 px-4">Domisili Kota</th>
              <th className="py-3 px-4 text-right">Crypto Wallets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#181818]">
            {filtered.map((u) => {
              const isOwner = u.role === "OWNER";
              const isSeller = u.role === "SELLER";

              const roleBadgeColor = isOwner
                ? "text-[#39FF14] border-[#39FF14]/40 bg-[#39FF14]/10"
                : isSeller
                ? "text-[#FFB800] border-[#FFB800]/40 bg-[#FFB800]/10"
                : "text-[#4488FF] border-[#4488FF]/40 bg-[#4488FF]/10";

              return (
                <tr key={u.id} className="hover:bg-[#141414] transition-colors">
                  {/* Codename */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-[#161616] border border-[#2a2a2a] flex items-center justify-center font-bold text-xs text-[#39FF14]">
                        {u.codename.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[#e8e8e8] flex items-center gap-1.5">
                          {u.codename}
                          {session.userId === u.id && (
                            <span className="text-[9px] bg-[#39FF14] text-black font-extrabold px-1 py-0.2">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#555] font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase border ${roleBadgeColor}`}
                    >
                      {u.role}
                    </span>
                  </td>

                  {/* Reputation */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-[#FFB800] fill-[#FFB800]" />
                      <span className="font-bold text-[#e8e8e8] text-[12px]">{u.reputation}%</span>
                    </div>
                    <div className="w-24 h-1 bg-[#1a1a1a] mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#39FF14]"
                        style={{ width: `${u.reputation}%` }}
                      />
                    </div>
                  </td>

                  {/* Completed Deals */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-[#e8e8e8]">{u.completedDeals} Transaksi</div>
                    <div className="text-[10px] text-[#39FF14] flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={10} />
                      Zero Disputes
                    </div>
                  </td>

                  {/* City */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-1 text-[#aaa]">
                      <MapPin size={12} className="text-[#39FF14]" />
                      <span>{u.locationCity}</span>
                    </div>
                  </td>

                  {/* Wallets */}
                  <td className="py-3.5 px-4 align-top text-right text-[10px] font-mono">
                    {u.walletBtc && (
                      <div className="truncate max-w-[140px] ml-auto font-mono" style={{ color: "#F7931A" }}>
                        BTC: {u.walletBtc.substring(0, 10)}...
                      </div>
                    )}
                    {u.walletXmr && (
                      <div className="truncate max-w-[140px] ml-auto font-mono" style={{ color: "#FF6600" }}>
                        XMR: {u.walletXmr.substring(0, 10)}...
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
