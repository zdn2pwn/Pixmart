import { requireSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { SellerDashboardContentImproved } from "./SellerDashboardContentImproved";
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
    .select("*")
    .eq("seller_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <SellerDashboardContentImproved
        session={session}
        myListings={myListings as any}
        negotiations={negotiations as any}
        escrowRooms={escrowRooms as any}
      />
      <PublicFooter />
    </div>
  );
}
