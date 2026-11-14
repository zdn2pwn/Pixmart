import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsPageContent } from "./SettingsPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Konfigurasi Protokol Escrow & Keamanan Node",
  description: "Pengaturan multisig vault, fee protokol, dan audit kepatuhan.",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <SettingsPageContent />;
}
