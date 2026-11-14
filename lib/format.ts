// ============================================================
// ARCADE PROTOCOL — Formatting Utilities
// ============================================================

export function formatCrypto(amount: number, currency: "BTC" | "XMR"): string {
  if (currency === "BTC") {
    return `${amount.toFixed(6)} BTC`;
  }
  return `${amount.toFixed(4)} XMR`;
}

export function formatBtc(amount: number): string {
  return `${amount.toFixed(6)} BTC`;
}

export function formatXmr(amount: number): string {
  return `${amount.toFixed(4)} XMR`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "Rp 0";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export const formatIdr = formatCurrency;
export const formatDateShort = formatDate;

export function truncateHash(hash: string, left = 6, right = 4): string {
  if (!hash || hash.length <= left + right) return hash;
  return `${hash.slice(0, left)}...${hash.slice(-right)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return `${diffSec}d lalu`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}j lalu`;
  return `${Math.floor(diffSec / 86400)} hari lalu`;
}
