"use server";

import { getSimpleSession } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleWishlistAction(listingId: string) {
  const session = await getSimpleSession();
  if (!session) return { success: false, error: "Not logged in" };

  const supabase = await createSupabaseServerClient();

  try {
    const { data: existing } = await supabase
      .from("wishlists")
      .select("user_id")
      .eq("user_id", session.userId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", session.userId)
        .eq("listing_id", listingId);
      revalidatePath("/marketplace");
      return { success: true, added: false };
    }

    await supabase.from("wishlists").insert({
      user_id: session.userId,
      listing_id: listingId,
    });
    revalidatePath("/marketplace");
    return { success: true, added: true };
  } catch (err) {
    return { success: false, error: "Wishlist unavailable (run migration)" };
  }
}

export async function getWishlistIdsAction(): Promise<string[]> {
  const session = await getSimpleSession();
  if (!session) return [];

  const supabase = await createSupabaseServerClient();
  try {
    const { data } = await supabase
      .from("wishlists")
      .select("listing_id")
      .eq("user_id", session.userId);
    return (data || []).map((r: any) => r.listing_id);
  } catch {
    return [];
  }
}