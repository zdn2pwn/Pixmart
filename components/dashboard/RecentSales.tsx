"use client";

import React from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";

interface SaleItem {
  invoiceNumber: string;
  customerName?: string | null;
  userName: string;
  total: number;
  paymentMethod: string;
  status: string;
  soldAt: string | Date;
}

interface RecentSalesProps {
  sales: SaleItem[];
}

function formatTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
  CARD: "Kartu",
};

export default function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div
      className="rounded-lg border flex flex-col"
      style={{ background: "#161616", borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#2a2a2a" }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ fontFamily: "'Press Start 2P', monospace", color: "#555" }}
          >
            TRANSACTION LOG
          </span>
          <span className="text-sm font-semibold" style={{ color: "#f0f0f0" }}>
            Penjualan Terbaru
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
              {["Invoice", "Pelanggan", "Kasir", "Total", "Pembayaran", "Status", "Waktu"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left font-mono font-semibold uppercase tracking-wide"
                    style={{ color: "#555", whiteSpace: "nowrap" }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center font-mono"
                  style={{ color: "#555" }}
                >
                  NO TRANSACTIONS YET
                </td>
              </tr>
            )}
            {sales.map((sale, i) => (
              <tr
                key={sale.invoiceNumber}
                style={{
                  borderBottom: i < sales.length - 1 ? "1px solid #1e1e1e" : "none",
                }}
              >
                <td className="px-4 py-2.5 font-mono" style={{ color: "#22c55e", whiteSpace: "nowrap" }}>
                  {sale.invoiceNumber}
                </td>
                <td className="px-4 py-2.5" style={{ color: "#f0f0f0", whiteSpace: "nowrap" }}>
                  {sale.customerName || "Umum"}
                </td>
                <td className="px-4 py-2.5" style={{ color: "#888", whiteSpace: "nowrap" }}>
                  {sale.userName}
                </td>
                <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: "#f0f0f0", whiteSpace: "nowrap" }}>
                  {formatCurrency(sale.total)}
                </td>
                <td className="px-4 py-2.5" style={{ color: "#888", whiteSpace: "nowrap" }}>
                  {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                </td>
                <td className="px-4 py-2.5" style={{ whiteSpace: "nowrap" }}>
                  <StatusBadge status={sale.status} />
                </td>
                <td className="px-4 py-2.5 font-mono" style={{ color: "#555", whiteSpace: "nowrap" }}>
                  {formatTime(sale.soldAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
