import { requireSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { BuyerDashboardContent } from "./BuyerDashboardContent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Buyer Dashboard — PIXMART P2P",
  description: "Dashboard pembeli: pantau negosiasi aktif, escrow COD, wishlist, dan riwayat transaksi.",
};

export default async function BuyerDashboardPage() {
  // Require session with onboarding check
  const session = await requireSimpleSession();

  if (session.role === "SELLER") {
    redirect("/seller");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch user's negotiations (might be empty)
  const { data: negotiations = [] } = await supabase
    .from("negotiations")
    .select("*")
    .or(`buyer_id.eq.${session.userId},seller_id.eq.${session.userId}`)
    .order("created_at", { ascending: false });

  // Fetch user's escrow sessions
  const { data: escrowRooms = [] } = await supabase
    .from("escrow_sessions")
    .select("*")
    .or(`buyer_id.eq.${session.userId},seller_id.eq.${session.userId}`)
    .is("completed_at", null)
    .order("created_at", { ascending: false });

  // Fetch active listings for nearby
  const { data: nearbyListings = [] } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "ACTIVE")
    .limit(10);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <BuyerDashboardContent
        session={session}
        negotiations={negotiations as any}
        escrowRooms={escrowRooms as any}
        wishlistListings={[]}
        nearbyListings={nearbyListings as any}
      />
      <PublicFooter />
    </div>
  );
}
