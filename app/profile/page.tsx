import { requireSimpleSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ProfilePageContent } from "./ProfilePageContent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Profile Settings — PIXMART",
  description: "Kelola profil, wallet, dan pengaturan akun Anda",
};

export default async function ProfilePage() {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  // Get full profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={session.role} codename={session.codename} isLoggedIn={true} />
      <ProfilePageContent session={session} profile={profile} />
      <PublicFooter />
    </div>
  );
}
