import { getSession } from "@/lib/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { ListingForm } from "./ListingForm";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Pasang Listing Barang Baru — PIXMART",
};

export default async function NewListingPage() {
  const session = await getSession();
  const currentRole = session?.role || "SELLER";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />
      <ListingForm session={session} />
      <PublicFooter />
    </div>
  );
}
