import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { EscrowHandshakeRoom } from "./EscrowHandshakeRoom";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Ruang Serah Terima & Escrow Handshake — PIXMART",
};

export default async function EscrowRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const currentRole = session?.role || "OWNER";

  const { id } = await params;
  const order = store.getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />
      <EscrowHandshakeRoom order={order} session={session} />
      <PublicFooter />
    </div>
  );
}
