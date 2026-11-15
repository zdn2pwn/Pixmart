import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Dashboard — PIXMART",
  description: "Redirecting to the Midman Dashboard...",
};

/**
 * Legacy /admin routes now live under /owner.
 * This catch-all keeps old bookmarks working.
 */
export default function AdminRedirectPage() {
  redirect("/owner");
}
