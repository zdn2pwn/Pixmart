"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface DaySale {
  date: string;
  total: number;
}

interface SalesChartProps {
  weekSales: DaySale[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded border px-3 py-2"
      style={{
        background: "#1e1e1e",
        borderColor: "#2a2a2a",
        color: "#f0f0f0",
      }}
    >
      <p className="text-xs font-mono" style={{ color: "#888" }}>
        {label}
      </p>
      <p className="text-sm font-mono font-bold" style={{ color: "#22c55e" }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function tickFormatter(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export default function SalesChart({ weekSales }: SalesChartProps) {
  const data = weekSales.map((d) => ({
    ...d,
    // Show short date label e.g. "Mon" or the last 5 chars
    label: d.date.length > 5 ? d.date.slice(-5) : d.date,
  }));

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-4"
      style={{ background: "#161616", borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace", color: "#555" }}
          >
            SALES GRAPH
          </span>
          <span className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>
            Penjualan 7 Hari Terakhir
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              vertical={false}
              stroke="#2a2a2a"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#555", fontSize: 11, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={tickFormatter}
              tick={{ fill: "#555", fontSize: 11, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="total" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
