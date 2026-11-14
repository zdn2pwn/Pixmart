import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
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
  const currentRole = session?.role || "BUYER";
  const { id } = await params;

  const negotiation = store.getNegotiationById(id);
  if (!negotiation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />
      <NegotiationRoomView initialNegotiation={negotiation} session={session} />
      <PublicFooter />
    </div>
  );
}
