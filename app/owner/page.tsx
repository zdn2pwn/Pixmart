import { requireSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { OwnerDashboardContent } from "./OwnerDashboardContent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Midman Dashboard — PIXMART Escrow",
  description: "Dashboard Midman untuk mengelola dan memverifikasi transaksi escrow.",
};

export default async function OwnerDashboardPage() {
  const session = await requireSimpleSession();

  // Only OWNER role can access
  if (session.role !== "OWNER") {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch all escrow sessions where this user is midman
  const { data: escrowSessions } = await supabase
    .from("escrow_sessions")
    .select(`
      *,
      buyer:profiles!escrow_sessions_buyer_id_fkey(id, codename, email),
      seller:profiles!escrow_sessions_seller_id_fkey(id, codename, email),
      negotiation:negotiations(
        listing:marketplace_listings(*)
      )
    `)
    .eq("midman_id", session.userId)
    .order("created_at", { ascending: false });

  // Fetch escrow activities for audit trail
  const { data: recentActivities } = await supabase
    .from("escrow_activities")
    .select(`
      *,
      escrow:escrow_sessions(id, item_title),
      actor:profiles(codename)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const sessions = escrowSessions || [];
  const activities = recentActivities || [];

  // Calculate stats
  const activeEscrows = sessions.filter((e: any) => 
    !e.completed_at && e.status !== "CANCELLED"
  );
  
  const completedEscrows = sessions.filter((e: any) => e.completed_at);
  
  const needsAction = sessions.filter((e: any) => 
    (e.payment_status === 'RECEIVED' && !e.funds_held) ||
    (e.buyer_confirmed && e.seller_confirmed && !e.midman_verified)
  );

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <OwnerDashboardContent
        escrowSessions={sessions}
        recentActivities={activities}
        stats={{
          active: activeEscrows.length,
          completed: completedEscrows.length,
          needsAction: needsAction.length,
        }}
      />
      <PublicFooter />
    </div>
  );
}
