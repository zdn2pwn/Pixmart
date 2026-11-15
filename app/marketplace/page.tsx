import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSimpleSession } from "@/app/actions/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MarketplaceExplorer } from "./MarketplaceExplorer";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Katalog Peer-to-Peer Bazaar",
  description:
    "Jelajahi barang fisik legal untuk transaksi tatap muka dengan proteksi Escrow Bitcoin & Monero.",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string; q?: string }>;
}) {
  const session = await getSimpleSession();
  const currentRole = session?.role || "BUYER";
  const supabase = await createSupabaseServerClient();

  const { city, category, q } = await searchParams;

  // Fetch listings from database
  let query = supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (city) {
    query = query.eq("location_city", city);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: listingsData } = await query;
  const listings = listingsData || [];

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={currentRole} codename={session?.codename} isLoggedIn={!!session} />
      <MarketplaceExplorer
        initialListings={listings}
        initialCity={city || "ALL"}
        initialCategory={category || "ALL"}
        initialSearch={q || ""}
        session={session}
      />
      <PublicFooter />
    </div>
  );
}
