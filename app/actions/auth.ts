"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { store } from "@/lib/store";
import type { UserRole } from "@/lib/types";

// ── REGISTER ──────────────────────────────────────────────────────────────────
export async function registerAction(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string;
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

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Email sudah terdaftar. Silakan login." };
    }
    return { error: error.message };
  }

  // Redirect to onboarding to pick role
  redirect("/onboarding");
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export async function loginAction(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const from = formData.get("from") as string | null;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.includes("Invalid login") ||
      error.message.includes("invalid_credentials")
    ) {
      return { error: "Email atau password salah." };
    }
    return { error: error.message };
  }

  // Check if user has a role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Gagal mendapatkan sesi. Coba lagi." };

  let userRole: UserRole | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) {
      userRole = profile.role as UserRole;
    }
  } catch {
    // DB table might not exist
  }

  if (!userRole && user.user_metadata?.role) {
    userRole = user.user_metadata.role as UserRole;
  }

  if (!userRole) {
    redirect("/onboarding");
  }

  const dest = from || (userRole === "SELLER" ? "/seller" : "/dashboard");
  redirect(dest);
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ── SET ROLE (Onboarding) ─────────────────────────────────────────────────────
export async function setRoleAction(role: UserRole) {
  if (role !== "BUYER" && role !== "SELLER") {
    return { error: "Role tidak valid." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tidak terautentikasi." };

  const codename = `Anon_${role === "SELLER" ? "Seller" : "Buyer"}_#${user.id.slice(0, 4).toUpperCase()}`;

  // 1. Update Supabase Auth metadata (works instantly even without DB table)
  await supabase.auth.updateUser({
    data: { role, codename },
  });

  // 2. Try inserting/updating profiles table if it exists
  try {
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      role,
      codename,
      location_city: "Jakarta",
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Ignore if table doesn't exist yet
  }

  // 3. Ensure user exists in authoritative store
  store.ensureUser({
    id: user.id,
    codename,
    email: user.email || "",
    role,
  });

  redirect(role === "SELLER" ? "/seller" : "/dashboard");
}

// ── CHANGE ROLE (switch dari dashboard) ──────────────────────────────────────
export async function changeRoleAction(role: UserRole) {
  if (role !== "BUYER" && role !== "SELLER") {
    return { error: "Role tidak valid." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tidak terautentikasi." };

  // 1. Update Supabase Auth metadata
  await supabase.auth.updateUser({
    data: { role },
  });

  // 2. Try updating profiles table
  try {
    await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  } catch {
    // Ignore if table doesn't exist yet
  }

  // 3. Update store
  const existing = store.getUserById(user.id);
  if (existing) {
    existing.role = role;
    store.ensureUser({
      id: user.id,
      codename: existing.codename,
      email: existing.email,
      role,
    });
  }

  redirect(role === "SELLER" ? "/seller" : "/dashboard");
}
