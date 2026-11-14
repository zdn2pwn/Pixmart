import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";
import { ShieldCheck, MapPin, CheckCircle2, Clock, AlertTriangle, ArrowRight, Package } from "lucide-react";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Pusat Escrow Room COD — PIXMART",
  description: "Daftar ruang transaksi escrow COD aktif dan riwayat transaksi selesai.",
};

export default async function EscrowListPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/escrow");
  }

  const currentRole = session.role;
  const userId = session.userId;

  const rooms =
    currentRole === "OWNER"
      ? store.getAllEscrowRooms()
      : store.getEscrowRoomsByUser(userId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} codename={session.codename} isLoggedIn={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
              <span>ACTIVE ESCROW ROOMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ruang Transaksi Escrow COD
            </h1>
            <p className="text-xs font-mono text-[#888] mt-1">
              Login sebagai: <span className="text-[#39FF14] font-bold">{session?.name}</span> ({currentRole})
            </p>
          </div>

          <Link
            href="/marketplace"
            className="btn-primary text-xs font-bold px-4 py-2 self-start sm:self-auto"
          >
            + Mulai Transaksi Baru
          </Link>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-[#121212] border border-[#222] p-12 text-center space-y-4">
            <ShieldCheck size={40} className="mx-auto text-[#444]" />
            <h3 className="text-white font-bold text-base">Belum Ada Escrow Room Aktif</h3>
            <p className="text-xs text-[#888] max-w-md mx-auto">
              Escrow Room dibuat secara otomatis saat kesepakatan negosiasi harga tercapai atau saat Anda memilih 'Beli Langsung' di katalog produk.
            </p>
            <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => {
              const hasImage = room.listing?.images && room.listing.images.length > 0;
              const isCompleted = room.meetingStatus === "COMPLETED";
              const isDisputed = room.meetingStatus === "DISPUTED";
              const counterparty =
                room.buyerId === userId ? room.seller.codename : room.buyer.codename;

              return (
                <Link
                  key={room.id}
                  href={`/escrow/${room.id}`}
                  className="block bg-[#121212] border border-[#262626] hover:border-[#39FF14]/70 p-5 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#181818] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
                        {hasImage ? (
                          <img
                            src={room.listing.images[0]}
                            alt={room.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-[#555]" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#888]">
                          <span className="text-[#39FF14] font-bold">Room #{room.id}</span>
                          <span>•</span>
                          <span>Lawan: {counterparty}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                          {room.listing.title}
                        </h3>
                        <div className="text-xs font-mono text-[#aaa] flex items-center gap-3">
                          <span className="text-white font-bold">
                            Rp {room.finalPriceIdr.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[#666]">|</span>
                          <span className="flex items-center gap-1 text-[#39FF14]">
                            <MapPin size={11} />
                            {room.meetingConfirmed?.locationName ||
                              room.meetingProposal?.locationName ||
                              "Titik temu belum ditentukan"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {isCompleted ? (
                        <span className="badge-green text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> SELESAI
                        </span>
                      ) : isDisputed ? (
                        <span className="badge-danger text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
                          <AlertTriangle size={13} /> SENGKETA
                        </span>
                      ) : (
                        <span className="badge-warn text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 animate-pulse">
                          <Clock size={13} /> {room.meetingStatus.replace(/_/g, " ")}
                        </span>
                      )}

                      <div className="text-[#666] group-hover:text-[#39FF14] transition-colors">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
