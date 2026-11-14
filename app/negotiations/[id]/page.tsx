import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { NegotiationRoomView } from "./NegotiationRoomView";
import type { Metadata } from "next";

export const instant = false;

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
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    redirect(`/login?from=/negotiations/${id}`);
  }

  const negotiation = store.getNegotiationById(id);
  if (!negotiation) {
    notFound();
  }

  // Authorization check: must be buyer, seller, or owner
  const isParticipant =
    session.role === "OWNER" ||
    negotiation.buyerId === session.userId ||
    negotiation.sellerId === session.userId;

  if (!isParticipant) {
    redirect("/negotiations");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <NegotiationRoomView initialNegotiation={negotiation} session={session} />
      <PublicFooter />
    </div>
  );
}
