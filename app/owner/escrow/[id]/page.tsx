import { requireSimpleSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { OwnerEscrowRoomClient } from "./OwnerEscrowRoomClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Midman Escrow #${id.slice(0, 8)} — PIXMART`,
    description: "Kelola dan verifikasi transaksi escrow sebagai Midman.",
  };
}

export default async function OwnerEscrowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSimpleSession();
  const { id } = await params;

  if (session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch escrow with all related data
  const { data: escrow } = await supabase
    .from("escrow_sessions")
    .select(`
      *,
      buyer:profiles!escrow_sessions_buyer_id_fkey(id, codename, email),
      seller:profiles!escrow_sessions_seller_id_fkey(id, codename, email),
      midman:profiles!escrow_sessions_midman_id_fkey(id, codename, email),
      negotiation:negotiations(
        id,
        listing_id,
        current_offer_btc,
        current_offer_xmr,
        listing:marketplace_listings(*)
      )
    `)
    .eq("id", id)
    .single();

  if (!escrow) {
    notFound();
  }

  // Fetch messages
  const { data: messagesData } = await supabase
    .from("escrow_messages")
    .select("*")
    .eq("escrow_id", id)
    .order("created_at", { ascending: true });

  // Fetch activities
  const { data: activitiesData } = await supabase
    .from("escrow_activities")
    .select(`
      *,
      actor:profiles(codename)
    `)
    .eq("escrow_id", id)
    .order("created_at", { ascending: false });

  const messages = messagesData || [];
  const activities = activitiesData || [];

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <OwnerEscrowRoomClient
        escrow={escrow}
        messages={messages}
        activities={activities}
        session={session}
      />
      <PublicFooter />
    </div>
  );
}
