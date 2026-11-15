// ============================================================
// ARCADE PROTOCOL — Formatting Utilities
// ============================================================

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


