"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { store } from "@/lib/store";
import { setSession, clearSession, getSession } from "@/lib/auth";
import { isValidBtcAddress, isValidXmrAddress } from "@/lib/crypto-wallet";
import type { UserRole } from "@/lib/types";

// ── REGISTER ──────────────────────────────────────────────────────────────────
export async function registerAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }
  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  // 1. Check if email already registered in store
  const existingInStore = store.getUserByEmail(email);
  if (existingInStore) {
    return { error: "Email sudah terdaftar. Silakan langsung masuk (login)." };
  }

  let supabaseUserId: string | null = null;

  // 2. Try Supabase Auth
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return { error: "Email sudah terdaftar di database. Silakan login." };
      }
      // If error is rate limit or email confirmation issue, we fallback smoothly to store auth
      console.warn("Supabase auth signUp warning (falling back to store):", error.message);
    } else if (data?.user?.id) {
      supabaseUserId = data.user.id;
    }
  } catch (err) {
    console.warn("Supabase auth exception, continuing with local store:", err);
  }

  // 3. Create user in store (guarantees registration never fails due to email rate limits)
  const user = store.createUser({
    id: supabaseUserId || `usr_${Date.now()}`,
    email,
    password,
    role: "BUYER", // temporary until onboarding
  });

  // 4. Set session immediately
  await setSession({
    userId: user.id,
    name: user.codename,
    email: user.email,
    role: user.role,
    codename: user.codename,
    balanceBtc: user.balanceBtc,
    balanceXmr: user.balanceXmr,
    depositAddressBtc: user.depositAddressBtc,
    depositAddressXmr: user.depositAddressXmr,
    locationCity: user.locationCity,
  });

  // 5. Redirect to onboarding to complete biodata & wallet
  redirect("/onboarding");
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export async function loginAction(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const from = formData.get("from") as string | null;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  let matchedUser: any = null;

  // 1. Try Supabase Auth first
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      matchedUser = store.getUserById(data.user.id);
      if (!matchedUser) {
        matchedUser = store.ensureUser({
          id: data.user.id,
          email: data.user.email || email,
          codename: `Anon_#${data.user.id.slice(0, 4).toUpperCase()}`,
          role: (data.user.user_metadata?.role as UserRole) || "BUYER",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase signIn exception:", err);
  }

  // 2. If Supabase Auth failed (e.g. rate limit, unconfirmed email, or offline), check authoritative store
  if (!matchedUser) {
    matchedUser = store.authenticateUser(email, password);
  }

  if (!matchedUser) {
    return { error: "Email atau password salah. Pastikan kredensial sudah benar." };
  }

  // 3. Set authenticated session
  await setSession({
    userId: matchedUser.id,
    name: matchedUser.codename,
    email: matchedUser.email,
    role: matchedUser.role,
    codename: matchedUser.codename,
    walletBtc: matchedUser.walletBtc,
    walletXmr: matchedUser.walletXmr,
    balanceBtc: matchedUser.balanceBtc,
    balanceXmr: matchedUser.balanceXmr,
    depositAddressBtc: matchedUser.depositAddressBtc,
    depositAddressXmr: matchedUser.depositAddressXmr,
    locationCity: matchedUser.locationCity,
  });

  // 4. If onboarding not yet completed, redirect to onboarding
  if (!matchedUser.setupCompleted) {
    redirect("/onboarding");
  }

  const dest = from || (matchedUser.role === "SELLER" ? "/seller" : "/dashboard");
  redirect(dest);
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  await clearSession();
  const cookieStore = await cookies();
  cookieStore.delete("pixmart_session");
  cookieStore.delete("arcade_session");
  redirect("/login");
}

// ── ONBOARDING: COMPLETE BIODATA & WALLET ──────────────────────────────────────
export async function completeBiodataAction(_prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  const role = (formData.get("role") as UserRole) || "BUYER";
  const locationCity = (formData.get("locationCity") as string)?.trim() || "Jakarta";
  const locationDistrict = (formData.get("locationDistrict") as string)?.trim() || "Pusat";
  const walletBtc = (formData.get("walletBtc") as string)?.trim() || "";
  const walletXmr = (formData.get("walletXmr") as string)?.trim() || "";

  // VALIDATION: Salah satu wallet address (BTC atau XMR) wajib diisi!
  if (!walletBtc && !walletXmr) {
    return { error: "Wajib mengisi salah satu wallet address (Bitcoin atau Monero) untuk transaksi." };
  }

  if (walletBtc && !isValidBtcAddress(walletBtc)) {
    return { error: "Format Bitcoin address tidak valid. Harus dimulai dengan bc1, 1, atau 3 (26-62 karakter)." };
  }

  if (walletXmr && !isValidXmrAddress(walletXmr)) {
    return { error: "Format Monero address tidak valid. Harus berupa standard 95-karakter address (dimulai angka 4 atau 8)." };
  }

  // Update store biodata
  const updatedUser = store.updateUserBiodata(session.userId, {
    role,
    locationCity,
    locationDistrict,
    walletBtc,
    walletXmr,
  });

  if (!updatedUser) {
    return { error: "Gagal memperbarui profil. Coba lagi." };
  }

  // Sync to Supabase if DB table exists
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("profiles").upsert({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      codename: updatedUser.codename,
      location_city: updatedUser.locationCity,
      location_district: updatedUser.locationDistrict,
      updated_at: new Date().toISOString(),
    });
    await supabase.auth.updateUser({
      data: { role: updatedUser.role, codename: updatedUser.codename },
    });
  } catch {
    // ignore
  }

  // Save full session
  await setSession({
    userId: updatedUser.id,
    name: updatedUser.codename,
    email: updatedUser.email,
    role: updatedUser.role,
    codename: updatedUser.codename,
    walletBtc: updatedUser.walletBtc,
    walletXmr: updatedUser.walletXmr,
    balanceBtc: updatedUser.balanceBtc,
    balanceXmr: updatedUser.balanceXmr,
    depositAddressBtc: updatedUser.depositAddressBtc,
    depositAddressXmr: updatedUser.depositAddressXmr,
    locationCity: updatedUser.locationCity,
  });

  redirect(role === "SELLER" ? "/seller" : "/dashboard");
}

// ── TOP UP SALDO SIMULASI (FAUCET) ─────────────────────────────────────────────
export async function topUpBalanceAction(currency: "BTC" | "XMR", amount: number) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHORIZED" };

  const res = store.topUpUserBalance(session.userId, currency, amount);
  if (!res.success) return { error: "Gagal mengisi saldo" };

  // Refresh session cookie
  const user = store.getUserById(session.userId);
  if (user) {
    await setSession({
      userId: user.id,
      name: user.codename,
      email: user.email,
      role: user.role,
      codename: user.codename,
      walletBtc: user.walletBtc,
      walletXmr: user.walletXmr,
      balanceBtc: user.balanceBtc,
      balanceXmr: user.balanceXmr,
      depositAddressBtc: user.depositAddressBtc,
      depositAddressXmr: user.depositAddressXmr,
      locationCity: user.locationCity,
    });
  }

  return { success: true, newBalance: res.newBalance };
}
