"use server";

import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { setSession, clearSession, getSession } from "@/lib/auth";
import type { Session } from "@/lib/types";

export async function loginAction(
  prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi" };
  }

  const user = store.authenticateUser(email.trim().toLowerCase(), password);

  if (!user) {
    return { error: "Email atau password salah" };
  }

  const session: Session = {
    userId: user.id,
    name: user.codename,
    email: user.email,
    role: user.role,
  };

  await setSession(session);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function getCurrentUser() {
  return await getSession();
}
