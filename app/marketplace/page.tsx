import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { MarketplaceExplorer } from "./MarketplaceExplorer";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Katalog Peer-to-Peer Bazaar",
  description:
    "Jelajahi barang fisik legal untuk transaksi tatap muka dengan proteksi Escrow Bitcoin & Monero.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string; q?: string }>;
}) {
  const session = await getSession();
  const currentRole = session?.role || "OWNER";

  const { city, category, q } = await searchParams;

  const listings = store.getListings({
    city,
    category,
    search: q,
    status: "ACTIVE",
  });

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f5f8] flex flex-col">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />
      <MarketplaceExplorer
        initialListings={listings}
        initialCity={city || "ALL"}
        initialCategory={category || "ALL"}
        initialSearch={q || ""}
      />
      <PublicFooter />
    </div>
  );
}
