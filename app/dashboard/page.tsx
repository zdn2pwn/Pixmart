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

  if (session.role === "OWNER") {
    redirect("/owner");
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  // Fetch user's negotiations with participant and listing details
  const { data: negotiations = [] } = await supabase
    .from("negotiations")
    .select(`
      *,
      buyer:profiles!negotiations_buyer_id_fkey(id, codename),
      seller:profiles!negotiations_seller_id_fkey(id, codename),
      listing:marketplace_listings(id, title, fiat_estimate_idr)
    `)
    .or(`buyer_id.eq.${session.userId},seller_id.eq.${session.userId}`)
    .order("created_at", { ascending: false });

  // Fetch active escrow sessions
  const { data: escrowRooms = [] } = await supabase
    .from("escrow_sessions")
    .select(`
      *,
      buyer:profiles!escrow_sessions_buyer_id_fkey(id, codename),
      seller:profiles!escrow_sessions_seller_id_fkey(id, codename),
      negotiation:negotiations(
        listing:marketplace_listings(id, title)
      )
    `)
    .or(`buyer_id.eq.${session.userId},seller_id.eq.${session.userId}`)
    .is("completed_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch completed escrows for history
  const { data: completedEscrows = [] } = await supabase
    .from("escrow_sessions")
    .select(`
      *,
      buyer:profiles!escrow_sessions_buyer_id_fkey(id, codename),
      seller:profiles!escrow_sessions_seller_id_fkey(id, codename),
      negotiation:negotiations(
        listing:marketplace_listings(id, title)
      )
    `)
    .or(`buyer_id.eq.${session.userId},seller_id.eq.${session.userId}`)
    .not("completed_at", "is", null)
    .is("deleted_at", null)
    .order("completed_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <BuyerDashboardContent
        session={session}
        profile={profile || {}}
        negotiations={negotiations as any}
        escrowRooms={escrowRooms as any}
        completedEscrows={completedEscrows as any}
        wishlistListings={[]}
      />
      <PublicFooter />
    </div>
  );
}
