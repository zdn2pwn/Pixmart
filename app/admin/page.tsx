import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Owner Dashboard — PIXMART",
  description: "Redirecting to new Midman Dashboard...",
};

export default async function AdminPageRedirect() {
  // Redirect old /admin to new /owner
  redirect("/owner");
}
