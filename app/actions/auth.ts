"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isValidBtcAddress, isValidXmrAddress } from "@/lib/crypto-wallet";
import { generateBtcAddress, generateXmrAddress, hashPassword } from "@/lib/crypto-wallet";
import { ensureUniqueCodename } from "@/lib/username";
import type { UserRole } from "@/lib/types";

const SESSION_COOKIE = "pixmart_session";

function sessionSecret(): string {
  return process.env.SESSION_SECRET || "pixmart-demo-secret-change-me";
}

function signSession(payload: string): string {
  const hmac = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${hmac}`;
}

function verifySession(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return payload;
}

export interface SimpleSession {
  userId: string;
  email: string;
  codename: string;
  role: UserRole;
  setupCompleted: boolean;
}

// ═══════════════════════════════════════════════════════════
// SESSION HELPERS
// ═══════════════════════════════════════════════════════════

async function setSessionCookie(session: SimpleSession) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signed = signSession(encoded);
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSimpleSession(): Promise<SimpleSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);
    
    if (!cookie?.value) {
      return null;
    }

    const payload = verifySession(cookie.value);
    if (!payload) {
      return null;
    }

    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    const session = JSON.parse(decoded) as SimpleSession;
    
    // Verify user still exists in database
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.userId)
      .single();

    if (!profile) {
      return null;
    }

    return {
      userId: profile.id,
      email: profile.email,
      codename: profile.codename,
      role: profile.role as UserRole,
      setupCompleted: profile.setup_completed || false,
    };
  } catch (err) {
    console.error("[getSimpleSession] Error:", err);
    return null;
  }
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ═══════════════════════════════════════════════════════════
// REGISTER (Pure Database, No Supabase Auth)
// ═══════════════════════════════════════════════════════════

export async function registerSimpleAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  console.log("[Register] Starting registration for:", email);

  // Validation
  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }
  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      console.log("[Register] Email already exists:", email);
      return { error: "Email sudah terdaftar. Silakan login." };
    }

    // Generate user ID
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseCodename = `Anonymous Buyer`;
    
    // Generate unique codename with suffix to prevent collision
    const codename = await ensureUniqueCodename(supabase, baseCodename);
    
    const passwordHash = hashPassword(password);

    console.log("[Register] Creating user:", userId, "with codename:", codename);

    // Insert profile directly to database
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      email: email,
      codename: codename,
      role: "BUYER",
      password_hash: passwordHash,
      setup_completed: false,
      reputation: 100,
      completed_deals: 0,
      location_city: "Jakarta",
      balance_btc: 0.0,
      balance_xmr: 0.0,
      deposit_address_btc: generateBtcAddress(userId),
      deposit_address_xmr: generateXmrAddress(userId),
      avatar_seed: codename,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[Register] Insert error:", insertError);
      return { error: "Gagal membuat akun. Coba lagi." };
    }

    console.log("[Register] User created, setting session...");

    // Set session
    await setSessionCookie({
      userId,
      email,
      codename,
      role: "BUYER",
      setupCompleted: false,
    });

    console.log("[Register] Session set, redirecting to onboarding...");

    // Redirect to onboarding (this throws NEXT_REDIRECT internally - it's normal!)
    redirect("/onboarding");
  } catch (err: any) {
    // IMPORTANT: redirect() throws NEXT_REDIRECT which is expected behavior
    // We should NOT catch it as an error
    if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
      throw err; // Re-throw redirect errors
    }
    
    console.error("[Register] Exception:", err);
    return { error: "Terjadi kesalahan. Coba lagi." };
  }
}

// ═══════════════════════════════════════════════════════════
// LOGIN (Pure Database)
// ═══════════════════════════════════════════════════════════

export async function loginSimpleAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Get profile with password hash
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (!profile) {
      return { error: "Email atau password salah." };
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (profile.password_hash !== passwordHash) {
      return { error: "Email atau password salah." };
    }

    // Set session
    await setSessionCookie({
      userId: profile.id,
      email: profile.email,
      codename: profile.codename,
      role: profile.role as UserRole,
      setupCompleted: profile.setup_completed || false,
    });

    // Redirect based on setup status
    if (!profile.setup_completed) {
      redirect("/onboarding");
    }

    // Redirect based on role
    if (profile.role === "OWNER") {
      redirect("/owner");
    } else if (profile.role === "SELLER") {
      redirect("/seller");
    } else {
      redirect("/dashboard");
    }
  } catch (err: any) {
    // Re-throw redirect errors (they're not actual errors)
    if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    
    console.error("[Login] Exception:", err);
    return { error: "Login gagal. Coba lagi." };
  }
}

// ═══════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════

export async function completeOnboardingSimpleAction(_prev: unknown, formData: FormData) {
  const session = await getSimpleSession();

  if (!session) {
    return { error: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  const role = (formData.get("role") as UserRole) || "BUYER";
  const locationCity = (formData.get("locationCity") as string)?.trim() || "Jakarta";
  const locationDistrict = (formData.get("locationDistrict") as string)?.trim() || "Pusat";
  const walletBtc = (formData.get("walletBtc") as string)?.trim() || "";
  const walletXmr = (formData.get("walletXmr") as string)?.trim() || "";

  // Validation
  if (!walletBtc && !walletXmr) {
    return { error: "Wajib mengisi salah satu wallet address." };
  }

  if (walletBtc && !isValidBtcAddress(walletBtc)) {
    return { error: "Format Bitcoin address tidak valid." };
  }

  if (walletXmr && !isValidXmrAddress(walletXmr)) {
    return { error: "Format Monero address tidak valid." };
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Generate unique codename based on role
    const baseCodename = `Anonymous ${role === "SELLER" ? "Seller" : "Buyer"}`;
    const codename = await ensureUniqueCodename(supabase, baseCodename);

    // Set initial balance based on role
    const balanceBtc = role === "BUYER" ? 0.05 : 0.02;
    const balanceXmr = role === "BUYER" ? 3.5 : 1.25;

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role,
        codename,
        location_city: locationCity,
        location_district: locationDistrict,
        wallet_btc: walletBtc,
        wallet_xmr: walletXmr,
        balance_btc: balanceBtc,
        balance_xmr: balanceXmr,
        setup_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.userId);

    if (updateError) {
      console.error("[Onboarding] Update error:", updateError);
      return { error: "Gagal memperbarui profil." };
    }

    // Update session
    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      codename,
      role,
      setupCompleted: true,
    });

    // Redirect to dashboard
    redirect(role === "SELLER" ? "/seller" : "/dashboard");
  } catch (err: any) {
    // Re-throw redirect errors
    if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    
    console.error("[Onboarding] Exception:", err);
    return { error: "Terjadi kesalahan." };
  }
}

// ═══════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════

export async function logoutSimpleAction() {
  await clearSessionCookie();
  redirect("/login");
}

// Alias for compatibility
export const logoutAction = logoutSimpleAction;

// ═══════════════════════════════════════════════════════════
// TOP UP BALANCE (Demo/Testing)
// ═══════════════════════════════════════════════════════════

export async function topUpBalanceAction(crypto: "BTC" | "XMR", amount: number) {
  const session = await getSimpleSession();
  
  if (!session) {
    return { error: "Sesi tidak ditemukan." };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const field = crypto === "BTC" ? "balance_btc" : "balance_xmr";
    
    // Get current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance_btc, balance_xmr")
      .eq("id", session.userId)
      .single();

    if (!profile) {
      return { error: "Profil tidak ditemukan." };
    }

    const currentBalance = Number(profile[field]) || 0;
    const newBalance = currentBalance + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [field]: newBalance, updated_at: new Date().toISOString() })
      .eq("id", session.userId);

    if (updateError) {
      console.error("[TopUp] Error:", updateError);
      return { error: "Gagal top up balance." };
    }

    return { 
      success: true, 
      newBalance,
      message: `Top up ${amount} ${crypto} berhasil!` 
    };
  } catch (err: any) {
    console.error("[TopUp] Exception:", err);
    return { error: "Terjadi kesalahan." };
  }
}

// ═══════════════════════════════════════════════════════════
// REQUIRE SESSION
// ═══════════════════════════════════════════════════════════

export async function requireSimpleSession(): Promise<SimpleSession> {
  const session = await getSimpleSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.setupCompleted) {
    redirect("/onboarding");
  }

  return session;
}
