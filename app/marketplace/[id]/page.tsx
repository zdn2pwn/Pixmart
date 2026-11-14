import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { RoleSwitcherHUD } from "@/components/layout/RoleSwitcherHUD";
import { ListingDetailView } from "./ListingDetailView";
import type { Metadata } from "next";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = store.getListingById(id);
  if (!item) return { title: "Barang Tidak Ditemukan" };
  return {
    title: `${item.title} — PIXMART P2P`,
    description: item.description,
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const currentRole = session?.role || "OWNER";

  const { id } = await params;
  const listing = store.getListingById(id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} />
      <RoleSwitcherHUD currentRole={currentRole} />
      <ListingDetailView listing={listing} session={session} />
      <PublicFooter />
    </div>
  );
}
