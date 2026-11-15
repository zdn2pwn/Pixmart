import { requireSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ListingForm } from "./ListingForm";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Pasang Listing Barang Baru — PIXMART",
};

export default async function NewListingPage() {
  const session = await requireSimpleSession();

  // Only SELLER can create listings
  if (session.role !== "SELLER") {
    redirect("/seller");
  }

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <ListingForm />
      <PublicFooter />
    </div>
  );
}
