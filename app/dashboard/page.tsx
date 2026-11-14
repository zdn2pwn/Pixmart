import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { BuyerDashboardContent } from "./BuyerDashboardContent";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Buyer Dashboard — PIXMART P2P",
  description: "Dashboard pembeli: pantau negosiasi aktif, escrow COD, wishlist, dan riwayat transaksi.",
};

export default async function BuyerDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/dashboard");
  }

  if (session.role === "SELLER") {
    redirect("/seller");
  }

  const userId = session.userId;

  const negotiations = store.getNegotiationsByUser(userId);
  const escrowRooms = store.getEscrowRoomsByUser(userId);
  const wishlistListings = store.getWishlistListings(userId);
  const nearbyListings = store.getPublicListings({ userId });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
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
