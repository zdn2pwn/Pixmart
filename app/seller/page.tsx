import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { SellerDashboardContent } from "./SellerDashboardContent";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Seller Dashboard — PIXMART P2P",
  description: "Dashboard penjual: kelola produk lokal, respon penawaran masuk, dan pantau escrow COD.",
};

export default async function SellerDashboardPage() {
  const session = await getSession();
  const userId = session?.userId || "usr_seller_02";

  const allListings = store.getListings();
  // Seller's own listings
  const myListings = allListings.filter((l) => l.sellerId === userId);
  const negotiations = store.getNegotiationsByUser(userId);
  const escrowRooms = store.getEscrowRoomsByUser(userId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session?.role || "SELLER"} />
      <RoleSwitcherHUD currentRole={session?.role || "SELLER"} />
      <SellerDashboardContent
        session={session}
        myListings={myListings}
        negotiations={negotiations}
        escrowRooms={escrowRooms}
      />
      <PublicFooter />
    </div>
  );
}
