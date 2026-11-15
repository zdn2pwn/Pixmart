import { requireSimpleSession } from "@/app/actions/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NegotiationsListClient } from "./NegotiationsListClient";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Pusat Negosiasi & Tawaran — PIXMART",
  description: "Pantau dan kelola seluruh percakapan penawaran harga antara Buyer dan Seller.",
};

export default async function NegotiationsPage() {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const currentRole = session.role;
  const userId = session.userId;

  // Fetch negotiations with messages count
  const { data: negotiations = [] } = await supabase
    .from("negotiations")
    .select(`
      *,
      buyer:profiles!negotiations_buyer_id_fkey(id, codename, email),
      seller:profiles!negotiations_seller_id_fkey(id, codename, email),
      listing:marketplace_listings(*)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .neq("status", "CANCELLED") // Don't show cancelled
    .order("updated_at", { ascending: false });

  // Fetch unread message counts for each negotiation
  const unreadCounts: { [key: string]: number } = {};
  
  if (negotiations && negotiations.length > 0) {
    for (const nego of negotiations) {
      const { count } = await supabase
        .from("negotiation_messages")
        .select("*", { count: "exact", head: true })
        .eq("negotiation_id", nego.id)
        .neq("sender_id", userId)
        .is("read_at", null);
      
      unreadCounts[nego.id] = count || 0;
    }
  }

  // Fetch latest message for each negotiation
  const latestMessages: { [key: string]: any } = {};
  
  if (negotiations && negotiations.length > 0) {
    for (const nego of negotiations) {
      const { data } = await supabase
        .from("negotiation_messages")
        .select("content, created_at")
        .eq("negotiation_id", nego.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        latestMessages[nego.id] = data;
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={currentRole} codename={session.codename} isLoggedIn={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3A3157]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#C8FF4D] uppercase tracking-wider mb-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#C8FF4D] pulse-green" />
              <span>P2P NEGOTIATION HUB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cream tracking-tight">
              Daftar Negosiasi &amp; Tawaran Aktif
            </h1>
            <p className="text-xs font-mono text-[#A79EC2] mt-1">
              Login sebagai: <span className="text-[#C8FF4D] font-bold">{session?.codename}</span> ({currentRole})
            </p>
          </div>

          <Link
            href="/marketplace"
            className="btn-primary text-xs font-bold px-4 py-2 self-start sm:self-auto"
          >
            Lihat Katalog Lainnya
          </Link>
        </div>

        {/* List of negotiations */}
        {!negotiations || negotiations.length === 0 ? (
          <div className="bg-[#12101F] border border-[#3A3157] p-12 text-center space-y-4">
            <MessageSquare size={40} className="mx-auto text-[#5C5575]" />
            <h3 className="text-cream font-bold text-base">Belum Ada Negosiasi Aktif</h3>
            <p className="text-xs text-[#A79EC2] max-w-md mx-auto">
              {currentRole === "BUYER"
                ? "Buka katalog produk dan klik 'Ajukan Penawaran (Nego Harga)' untuk mulai menawar barang dari seller lokal."
                : "Belum ada penawaran masuk dari pembeli untuk barang dagangan Anda."}
            </p>
            <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <NegotiationsListClient
            negotiations={negotiations}
            userId={userId}
            unreadCounts={unreadCounts}
            latestMessages={latestMessages}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
