"use client";

import React from "react";
import { formatCurrency } from "@/lib/format";

interface DailyQuestProps {
  currentSales: number;
  targetSales: number;
}

export default function DailyQuest({ currentSales, targetSales }: DailyQuestProps) {
  const pct = targetSales > 0 ? Math.min((currentSales / targetSales) * 100, 100) : 0;
  const complete = pct >= 100;

  let statusLabel = "IN PROGRESS";
  let statusColor = "#f59e0b";
  if (complete) {
    statusLabel = "COMPLETE";
    statusColor = "#22c55e";
  } else if (pct === 0) {
    statusLabel = "NOT STARTED";
    statusColor = "#555";
  }

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-4"
      style={{ background: "#161616", borderColor: "#2a2a2a" }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace", color: "#22c55e" }}
          >
            DAILY QUEST
          </span>
          <span className="text-sm" style={{ color: "#888" }}>
            Capai target penjualan hari ini
          </span>
        </div>
        {/* Status badge */}
        <span
          className="text-[9px] font-mono tracking-wider px-2 py-1 rounded border flex-shrink-0"
          style={{
            color: statusColor,
            borderColor: statusColor,
            background: "transparent",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Progress bar track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 8, background: "#1e1e1e", border: "1px solid #2a2a2a" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-in-out"
          style={{
            width: `${pct}%`,
            background: complete ? "#22c55e" : "#16a34a",
          }}
        />
      </div>

      {/* Numbers */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono" style={{ color: "#555" }}>
            CURRENT
          </span>
          <span className="text-base font-mono font-bold" style={{ color: "#f0f0f0" }}>
            {formatCurrency(currentSales)}
          </span>
        </div>

        {/* Percentage center */}
        <span
          className="text-2xl font-bold font-mono"
          style={{ color: complete ? "#22c55e" : "#f0f0f0" }}
        >
          {pct.toFixed(0)}%
        </span>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-mono" style={{ color: "#555" }}>
            TARGET
          </span>
          <span className="text-base font-mono font-bold" style={{ color: "#888" }}>
            {formatCurrency(targetSales)}
          </span>
        </div>
      </div>
    </div>
  );
}
