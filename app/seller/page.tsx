import { requireSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SellerDashboardContent } from "./SellerDashboardContent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Seller Dashboard — PIXMART P2P",
  description: "Dashboard penjual: kelola produk lokal, respon penawaran masuk, dan pantau escrow COD.",
};

export default async function SellerDashboardPage() {
  const session = await requireSimpleSession();

  if (session.role === "BUYER") {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  // Get seller profile with balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_btc, balance_xmr")
    .eq("id", session.userId)
    .single();

  const { data: myListings = [] } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("seller_id", session.userId)
    .order("created_at", { ascending: false });

  const { data: negotiations = [] } = await supabase
    .from("negotiations")
    .select(`
      *,
      buyer:profiles!buyer_id(id, codename),
      listing:marketplace_listings(id, title, fiat_estimate_idr)
    `)
    .eq("seller_id", session.userId)
    .order("created_at", { ascending: false });

  const { data: escrowRooms = [] } = await supabase
    .from("escrow_sessions")
    .select(`
      *,
      buyer:profiles!escrow_sessions_buyer_id_fkey(id, codename),
      negotiation:negotiations(
        listing:marketplace_listings(id, title)
      )
    `)
    .eq("seller_id", session.userId)
    .is("completed_at", null) // Only active escrows (not completed)
    .is("deleted_at", null) // Exclude soft-deleted
    .order("created_at", { ascending: false });

  // Fetch completed escrows for income calculation (include deleted ones for historical data)
  const { data: completedEscrows } = await supabase
    .from("escrow_sessions")
    .select("agreed_price_btc, agreed_price_xmr, crypto_type, completed_at, deleted_at")
    .eq("seller_id", session.userId)
    .not("completed_at", "is", null) // Must be completed
    // DO NOT filter deleted_at - we need all completed escrows for income calculation
    .order("completed_at", { ascending: false });

  const completedEscrowsList = completedEscrows || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <SellerDashboardContent
        session={session}
        profile={profile || { balance_btc: 0, balance_xmr: 0 }}
        myListings={myListings as any}
        negotiations={negotiations as any}
        escrowRooms={escrowRooms as any}
        completedEscrows={completedEscrowsList as any}
      />
      <PublicFooter />
    </div>
  );
}
