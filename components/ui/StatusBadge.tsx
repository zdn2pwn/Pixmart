import React from "react";

type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
type OrderStatus = "COMPLETED" | "CANCELLED" | "PENDING";
type MutationType = "IN" | "OUT" | "ADJUSTMENT";

type BadgeVariant = StockStatus | OrderStatus | MutationType | string;

const BADGE_STYLES: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  IN_STOCK:    { label: "IN STOCK",    color: "#22c55e", bg: "#052e16", border: "#166534" },
  LOW_STOCK:   { label: "LOW STOCK",   color: "#f59e0b", bg: "#1c1004", border: "#854d0e" },
  OUT_OF_STOCK:{ label: "OUT OF STOCK",color: "#ef4444", bg: "#1c0505", border: "#7f1d1d" },
  COMPLETED:   { label: "COMPLETED",   color: "#22c55e", bg: "#052e16", border: "#166534" },
  CANCELLED:   { label: "CANCELLED",   color: "#ef4444", bg: "#1c0505", border: "#7f1d1d" },
  PENDING:     { label: "PENDING",     color: "#f59e0b", bg: "#1c1004", border: "#854d0e" },
  IN:          { label: "IN",          color: "#60a5fa", bg: "#0c1a2e", border: "#1e3a5f" },
  OUT:         { label: "OUT",         color: "#ef4444", bg: "#1c0505", border: "#7f1d1d" },
  ADJUSTMENT:  { label: "ADJUSTMENT",  color: "#f59e0b", bg: "#1c1004", border: "#854d0e" },
};

interface StatusBadgeProps {
  status: BadgeVariant;
  /** Override the display label */
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = BADGE_STYLES[status] ?? {
    label: status,
    color: "#888",
    bg: "#1a1a1a",
    border: "#2a2a2a",
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border"
      style={{
        color: style.color,
        background: style.bg,
        borderColor: style.border,
        lineHeight: 1.6,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 5, height: 5, background: style.color, flexShrink: 0 }}
      />
      {label ?? style.label}
    </span>
  );
}
