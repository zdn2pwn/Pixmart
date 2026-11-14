import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { redirect } from "next/navigation";
import { SalesListContent } from "./SalesListContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "P2P Escrow Ledger & Dual Handshake Monitor",
  description: "Pemantauan lalu lintas transaksi peer-to-peer dan status konfirmasi ganda escrow.",
};

export default async function SalesHistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = store.getAllOrders();

  return <SalesListContent initialOrders={orders} session={session} />;
}
