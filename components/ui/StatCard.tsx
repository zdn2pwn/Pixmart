import React from "react";

interface StatCardProps {
  title: string;
  arcadeLabel?: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ElementType;
  status?: string;
  statusColor?: "green" | "amber" | "red";
  children?: React.ReactNode;
}

const statusDotColor: Record<string, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

export default function StatCard({
  title,
  arcadeLabel,
  value,
  change,
  changePositive,
  icon: Icon,
  status,
  statusColor = "green",
  children,
}: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg border"
      style={{ background: "#161616", borderColor: "#2a2a2a" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          {arcadeLabel && (
            <span
              className="text-[9px] tracking-widest uppercase"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                color: "#555",
              }}
            >
              {arcadeLabel}
            </span>
          )}
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#888" }}
          >
            {title}
          </span>
        </div>

        {/* Icon box */}
        <div
          className="flex items-center justify-center rounded"
          style={{
            width: 32,
            height: 32,
            background: "#1e1e1e",
            border: "1px solid #2a2a2a",
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color: "#22c55e" }} />
        </div>
      </div>

      {/* Value */}
      <div
        className="font-mono font-bold leading-none"
        style={{ fontSize: 22, color: "#f0f0f0" }}
      >
        {value}
      </div>

      {/* Change */}
      {change && (
        <div
          className="text-xs font-mono"
          style={{ color: changePositive ? "#22c55e" : "#ef4444" }}
        >
          {change}
        </div>
      )}

      {/* Status pill */}
      {status && (
        <div className="flex items-center gap-1.5 mt-auto">
          <span
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: statusDotColor[statusColor] ?? "#22c55e",
            }}
          />
          <span
            className="text-[9px] font-mono tracking-widest uppercase"
            style={{ color: statusDotColor[statusColor] ?? "#22c55e" }}
          >
            {status}
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
