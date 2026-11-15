/**
 * Generate unique username with random suffix
 * Format: codename-XXXX where XXXX is random 4-digit number
 */
export function generateUniqueCodename(baseCodename: string): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  return `${baseCodename}-${randomSuffix}`;
}

/**
 * Check if codename is available
 */
export async function isCodenameAvailable(
  supabase: any,
  codename: string
): Promise<boolean> {
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("codename", codename);

  return count === 0;
}

/**
 * Generate and verify unique codename
 * Tries up to 5 times before giving up
 */
export async function ensureUniqueCodename(
  supabase: any,
  baseCodename: string,
  maxAttempts: number = 5
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateUniqueCodename(baseCodename);
    const available = await isCodenameAvailable(supabase, candidate);
    
    if (available) {
      return candidate;
    }
  }

  // Fallback: add timestamp
  return `${baseCodename}-${Date.now().toString().slice(-6)}`;
}
