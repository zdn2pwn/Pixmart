// ============================================================
// PIXMART — Crypto Wallet & Address Generator (BTC & XMR)
// ============================================================

import crypto from "crypto";

/**
 * Generate a realistic Bitcoin Native SegWit (Bech32) address starting with "bc1q"
 */
export function generateBtcAddress(seed?: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(seed || crypto.randomBytes(32).toString("hex"))
    .digest("hex");
  // bc1q + 38 chars of bech32 charset (alphanumeric without 1, b, i, o)
  const bech32Chars = "023456789acdefghjklmnpqrstuvwxyz";
  let result = "bc1q";
  for (let i = 0; i < 38; i++) {
    const byte = parseInt(hash.substr((i * 2) % (hash.length - 2), 2), 16);
    result += bech32Chars[byte % bech32Chars.length];
  }
  return result;
}

/**
 * Generate a realistic Monero address starting with "8" (subaddress) or "4" (standard)
 * 95 characters total.
 */
export function generateXmrAddress(seed?: string): string {
  const hash = crypto
    .createHash("sha256")
    .update((seed || crypto.randomBytes(32).toString("hex")) + "_xmr")
    .digest("hex");
  const hash2 = crypto
    .createHash("sha256")
    .update(hash + "_salt")
    .digest("hex");
  const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "888"; // standard stealth subaddress prefix
  const combined = hash + hash2;
  for (let i = 0; i < 92; i++) {
    const byte = parseInt(combined.substr((i * 2) % (combined.length - 2), 2), 16);
    result += base58Chars[byte % base58Chars.length];
  }
  return result;
}

/**
 * Validate user-inputted BTC address
 */
export function isValidBtcAddress(addr: string): boolean {
  if (!addr) return false;
  const trimmed = addr.trim();
  // Standard btc: 1..., 3..., or bc1...
  return (
    (trimmed.startsWith("bc1") || trimmed.startsWith("1") || trimmed.startsWith("3")) &&
    trimmed.length >= 26 &&
    trimmed.length <= 65
  );
}

/**
 * Validate user-inputted Monero address
 */
export function isValidXmrAddress(addr: string): boolean {
  if (!addr) return false;
  const trimmed = addr.trim();
  // Standard Monero addresses are 95 chars, subaddresses start with 8, standard with 4
  return (
    (trimmed.startsWith("4") || trimmed.startsWith("8")) &&
    trimmed.length >= 90 &&
    trimmed.length <= 106
  );
}

/**
 * Hash password securely with SHA-256 for local credential fallback
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "pixmart_salt_2026").digest("hex");
}
