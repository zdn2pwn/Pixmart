import { requireSimpleSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { NegotiationRoomClient } from "./NegotiationRoomClient";
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
    title: `Ruang Negosiasi #${id} — PIXMART`,
    description: "Ruang percakapan realtime negosiasi dan kesepakatan harga P2P.",
  };
}

export default async function NegotiationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSimpleSession();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch negotiation with related data
  const { data: negotiation } = await supabase
    .from("negotiations")
    .select(`
      *,
      buyer:profiles!negotiations_buyer_id_fkey(id, codename, email),
      seller:profiles!negotiations_seller_id_fkey(id, codename, email),
      listing:marketplace_listings(*)
    `)
    .eq("id", id)
    .single();

  if (!negotiation) {
    notFound();
  }

  // Authorization check: must be buyer, seller, or owner
  const isParticipant =
    session.role === "OWNER" ||
    negotiation.buyer_id === session.userId ||
    negotiation.seller_id === session.userId;

  if (!isParticipant) {
    redirect("/negotiations");
  }

  // Fetch messages for this negotiation
  const { data: messagesData } = await supabase
    .from("negotiation_messages")
    .select("*")
    .eq("negotiation_id", id)
    .order("created_at", { ascending: true });

  const messages = messagesData || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <NegotiationRoomClient
        negotiation={negotiation}
        messages={messages}
        session={session}
      />
      <PublicFooter />
    </div>
  );
}
