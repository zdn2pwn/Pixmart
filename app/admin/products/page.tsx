import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { redirect } from "next/navigation";
import { ProductsPageContent } from "./ProductsPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Listing & Inventaris Hardware — PIXMART",
  description: "Moderasi dan kepatuhan legalitas barang peer-to-peer di PIXMART.",
};

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const listings = store.getListings();

  return <ProductsPageContent initialListings={listings} session={session} />;
}
