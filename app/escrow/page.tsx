import { requireSimpleSession } from "@/app/actions/auth";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EscrowListClient } from "./EscrowListClient";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Pusat Escrow Room — PIXMART",
  description: "Daftar ruang transaksi escrow aktif dan riwayat transaksi selesai.",
};

export default async function EscrowListPage() {
  const session = await requireSimpleSession();
  const supabase = await createSupabaseServerClient();

  const currentRole = session.role;
  const userId = session.userId;

  // Fetch escrow sessions with midman info (exclude soft-deleted)
  const { data: rooms = [] } = await supabase
    .from("escrow_sessions")
    .select(`
      *,
      buyer:profiles!escrow_sessions_buyer_id_fkey(id, codename, email),
      seller:profiles!escrow_sessions_seller_id_fkey(id, codename, email),
      midman:profiles!escrow_sessions_midman_id_fkey(id, codename, email),
      negotiation:negotiations(
        listing:marketplace_listings(*)
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .is("deleted_at", null) // Exclude soft-deleted escrows
    .order("created_at", { ascending: false });

  // Fetch unread message counts
  const unreadCounts: { [key: string]: number } = {};
  
  if (rooms && rooms.length > 0) {
    for (const room of rooms) {
      const { count } = await supabase
        .from("escrow_messages")
        .select("*", { count: "exact", head: true })
        .eq("escrow_id", room.id)
        .neq("sender_id", userId)
        .is("read_at", null);
      
      unreadCounts[room.id] = count || 0;
    }
  }

  // Fetch latest message for each escrow
  const latestMessages: Record<string, { content: string; created_at: string }> = {};
  
  if (rooms && rooms.length > 0) {
    for (const room of rooms) {
      const { data } = await supabase
        .from("escrow_messages")
        .select("content, created_at")
        .eq("escrow_id", room.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        latestMessages[room.id] = data;
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0812] text-[#F5F0E6] flex flex-col">
      <PublicNav currentRole={currentRole} codename={session.codename} isLoggedIn={true} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3A3157]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#C8FF4D] uppercase tracking-wider mb-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#C8FF4D] pulse-green" />
              <span>ESCROW TRANSACTION CENTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cream tracking-tight">
              Ruang Transaksi Escrow
            </h1>
            <p className="text-xs font-mono text-[#A79EC2] mt-1">
              Login sebagai: <span className="text-[#C8FF4D] font-bold">{session?.codename}</span> ({currentRole})
            </p>
          </div>

          <Link
            href="/marketplace"
            className="btn-primary text-xs font-bold px-4 py-2 self-start sm:self-auto"
          >
            + Mulai Transaksi Baru
          </Link>
        </div>

        {!rooms || rooms.length === 0 ? (
          <div className="bg-[#12101F] border border-[#3A3157] p-12 text-center space-y-4">
            <ShieldCheck size={40} className="mx-auto text-[#5C5575]" />
            <h3 className="text-cream font-bold text-base">Belum Ada Escrow Room Aktif</h3>
            <p className="text-xs text-[#A79EC2] max-w-md mx-auto">
              Escrow Room dibuat secara otomatis saat kesepakatan negosiasi harga tercapai atau saat Anda memilih &apos;Beli Langsung&apos; di katalog produk.
            </p>
            <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <EscrowListClient
            rooms={rooms}
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
