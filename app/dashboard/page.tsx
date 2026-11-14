import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { BuyerDashboardContent } from "./BuyerDashboardContent";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Buyer Dashboard — PIXMART P2P",
  description: "Dashboard pembeli: pantau negosiasi aktif, escrow COD, wishlist, dan riwayat transaksi.",
};

export default async function BuyerDashboardPage() {
  const session = await getSession();
  const userId = session?.userId || "usr_buyer_01";

  const negotiations = store.getNegotiationsByUser(userId);
  const escrowRooms = store.getEscrowRoomsByUser(userId);
  const wishlistListings = store.getWishlistListings(userId);
  const nearbyListings = store.getPublicListings({ userId });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session?.role || "BUYER"} />
      <RoleSwitcherHUD currentRole={session?.role || "BUYER"} />
      <BuyerDashboardContent
        session={session}
        negotiations={negotiations}
        escrowRooms={escrowRooms}
        wishlistListings={wishlistListings}
        nearbyListings={nearbyListings}
      />
      <PublicFooter />
    </div>
  );
}
