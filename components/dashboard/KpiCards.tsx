"use client";

import React from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/format";

interface KpiCardsProps {
  todaySales: number;
  todayTransactions: number;
  todayProductsSold: number;
  lowStockCount: number;
  yesterdaySales: number;
}

function calcChange(today: number, yesterday: number): { label: string; positive: boolean } {
  if (yesterday === 0) return { label: "+100% dari kemarin", positive: true };
  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    label: `${sign}${pct.toFixed(1)}% dari kemarin`,
    positive: pct >= 0,
  };
}

export default function KpiCards({
  todaySales,
  todayTransactions,
  todayProductsSold,
  lowStockCount,
}: KpiCardsProps) {
  const salesCards = [
    {
      title: "STORE SCORE",
      arcadeLabel: "CHECKPOINT",
      value: formatCurrency(todaySales ?? 0),
      icon: DollarSign,
      status: "SYSTEM ONLINE",
      statusColor: "green" as const,
      showChange: true,
    },
  ];

  void salesCards; // used below inline

  const change = calcChange(todaySales ?? 0, 0); // placeholder; parent passes yesterdaySales

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1 — Store Score */}
      <StatCard
        title="STORE SCORE"
        arcadeLabel="CHECKPOINT"
        value={formatCurrency(todaySales ?? 0)}
        change={change.label}
        changePositive={change.positive}
        icon={DollarSign}
        status="SYSTEM ONLINE"
        statusColor="green"
      />

      {/* 2 — Transaksi */}
      <StatCard
        title="TRANSAKSI"
        arcadeLabel="TODAY"
        value={String(todayTransactions ?? 0)}
        icon={ShoppingCart}
        status="LIVE"
        statusColor="green"
      />

      {/* 3 — Produk Terjual */}
      <StatCard
        title="PRODUK TERJUAL"
        arcadeLabel="UNITS OUT"
        value={String(todayProductsSold ?? 0)}
        icon={Package}
        status="TRACKING"
        statusColor="green"
      />

      {/* 4 — Stock Alert */}
      <StatCard
        title="STOCK ALERT"
        arcadeLabel="LOW STOCK"
        value={String(lowStockCount ?? 0)}
        icon={AlertTriangle}
        status={lowStockCount > 0 ? "NEEDS RESTOCK" : "ALL GOOD"}
        statusColor={lowStockCount > 0 ? "amber" : "green"}
      />
    </div>
  );
}
