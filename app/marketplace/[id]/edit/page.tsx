import { requireSimpleSession } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { EditListingForm } from "./EditListingForm";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Gunakan session database yang sama dengan dashboard seller.
  // Sebelumnya halaman ini memakai requireSession() legacy sehingga seller
  // yang mendaftar lewat database selalu diarahkan ke /login.
  const session = await requireSimpleSession();

  if (session.role !== "SELLER" && session.role !== "OWNER") {
    redirect("/marketplace");
  }

  const supabase = await createSupabaseServerClient();

  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[EditListingPage] Fetch error:", error);
  }

  if (!listing) {
    redirect("/seller");
  }

  // Verify ownership
  if (listing.seller_id !== session.userId && session.role !== "OWNER") {
    redirect("/seller");
  }

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <EditListingForm listing={listing} />
      <PublicFooter />
    </div>
  );
}
