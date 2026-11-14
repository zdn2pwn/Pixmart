import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { EscrowHandshakeRoom } from "./EscrowHandshakeRoom";
import type { Metadata } from "next";

export const instant = false;

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
  const session = await getSession();
  const currentRole = session?.role || "BUYER";
  const { id } = await params;

  const room = store.getEscrowRoomById(id);

  if (!room) {
    notFound();
  }

  // Authorization Check: Only Buyer, Seller, or Owner can access
  const isParticipant =
    session &&
    (session.role === "OWNER" ||
      session.userId === room.buyerId ||
      session.userId === room.sellerId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />
      <EscrowHandshakeRoom
        room={room}
        session={session}
        isAuthorized={!!isParticipant}
      />
      <PublicFooter />
    </div>
  );
}
