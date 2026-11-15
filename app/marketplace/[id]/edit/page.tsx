import { requireSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditListingForm } from "./EditListingForm";

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  
  if (session.role !== "SELLER" && session.role !== "OWNER") {
    redirect("/marketplace");
  }

  const supabase = await createSupabaseServerClient();
  
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!listing) {
    redirect("/seller");
  }

  // Verify ownership
  if (listing.seller_id !== session.userId && session.role !== "OWNER") {
    redirect("/seller");
  }

  return <EditListingForm listing={listing} session={session} />;
}
