import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ListingForm } from "./ListingForm";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Pasang Listing Barang Baru — PIXMART",
};

export default async function NewListingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/marketplace/new");
  }

  // If user is logged in as BUYER, redirect to onboarding or seller page
  if (session.role === "BUYER") {
    redirect("/seller");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <ListingForm session={session} />
      <PublicFooter />
    </div>
  );
}
