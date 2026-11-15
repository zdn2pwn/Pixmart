import { requireSimpleSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { EscrowRoomClient } from "./EscrowRoomClient";
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
    title: `Ruang Escrow COD #${id} — PIXMART`,
    description: "Ruang koordinasi titik temu dan serah terima fisik langsung (COD).",
  };
}

export default async function EscrowRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSimpleSession();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch escrow session with related data + negotiation + listing via negotiation + midman
  const { data: room } = await supabase
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

  if (!room) {
    notFound();
  }

  // Authorization Check: Only Buyer, Seller, Midman, or Owner can access
  const isParticipant =
    session.role === "OWNER" ||
    session.userId === room.buyer_id ||
    session.userId === room.seller_id ||
    session.userId === room.midman_id;

  if (!isParticipant) {
    redirect("/escrow");
  }

  // Fetch messages for this escrow room
  const { data: messagesData } = await supabase
    .from("escrow_messages")
    .select("*")
    .eq("escrow_id", id)
    .order("created_at", { ascending: true });

  const messages = messagesData || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <EscrowRoomClient
        room={room}
        messages={messages}
        session={session}
      />
      <PublicFooter />
    </div>
  );
}
