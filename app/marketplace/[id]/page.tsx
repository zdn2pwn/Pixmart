import { getSimpleSession } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ListingDetailView } from "./ListingDetailView";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .single();
  
  if (!listing) return { title: "Barang Tidak Ditemukan" };
  
  return {
    title: `${listing.title} — PIXMART P2P`,
    description: listing.description,
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSimpleSession();
  const currentRole = session?.role || "BUYER";

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Fetch listing with seller profile
  const { data: dbListing, error } = await supabase
    .from("marketplace_listings")
    .select(`
      *,
      seller:profiles!seller_id (
        id,
        codename,
        reputation,
        completed_deals,
        location_city
      )
    `)
    .eq("id", id)
    .single();

  if (error || !dbListing) {
    notFound();
  }

  // Transform snake_case to camelCase for component
  const listing = {
    id: dbListing.id,
    sellerId: dbListing.seller_id,
    productId: dbListing.product_id,
    title: dbListing.title,
    description: dbListing.description,
    category: dbListing.category,
    priceBtc: dbListing.price_btc,
    priceXmr: dbListing.price_xmr,
    fiatEstimateIdr: dbListing.fiat_estimate_idr || 0,
    locationCity: dbListing.location_city || "Jakarta",
    locationDistrict: dbListing.location_district || "Unknown",
    locationRegion: "Indonesia",
    approxLatitude: dbListing.approx_latitude || 0,
    approxLongitude: dbListing.approx_longitude || 0,
    meetupZone: dbListing.meetup_zone || "Area Publik",
    meetingAvailability: dbListing.meeting_availability || "Fleksibel",
    condition: dbListing.condition || "USED_TESTED",
    stock: dbListing.stock || 1,
    legalStatusGuarantee: true,
    images: dbListing.images || [],
    status: dbListing.status || "ACTIVE",
    views: dbListing.views_count || 0,
    createdAt: new Date(dbListing.created_at),
    updatedAt: new Date(dbListing.updated_at),
    // Add seller info
    seller: dbListing.seller ? {
      id: dbListing.seller.id,
      codename: dbListing.seller.codename,
      reputation: dbListing.seller.reputation || 99,
      completedDeals: dbListing.seller.completed_deals || 0,
      approxCity: dbListing.seller.location_city || "Jakarta",
    } : {
      id: dbListing.seller_id,
      codename: "Anonymous Seller",
      reputation: 99,
      completedDeals: 0,
      approxCity: "Jakarta",
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={currentRole} codename={session?.codename} isLoggedIn={!!session} />
      <ListingDetailView listing={listing as any} session={session} />
      <PublicFooter />
    </div>
  );
}
