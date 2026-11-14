import { store } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";
import { MessageSquare, ArrowRight, Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Pusat Negosiasi & Tawaran — PIXMART",
  description: "Pantau dan kelola seluruh percakapan penawaran harga antara Buyer dan Seller.",
};

export default async function NegotiationsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/negotiations");
  }

  const currentRole = session.role;
  const userId = session.userId;

  const negotiations = store.getNegotiationsByUser(userId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] flex flex-col">
      <PublicNav currentRole={currentRole} codename={session.codename} isLoggedIn={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
              <span>P2P NEGOTIATION HUB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Daftar Negosiasi &amp; Tawaran Aktif
            </h1>
            <p className="text-xs font-mono text-[#888] mt-1">
              Login sebagai: <span className="text-[#39FF14] font-bold">{session?.name}</span> ({currentRole})
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
        {negotiations.length === 0 ? (
          <div className="bg-[#121212] border border-[#222] p-12 text-center space-y-4">
            <MessageSquare size={40} className="mx-auto text-[#444]" />
            <h3 className="text-white font-bold text-base">Belum Ada Negosiasi Aktif</h3>
            <p className="text-xs text-[#888] max-w-md mx-auto">
              {currentRole === "BUYER"
                ? "Buka katalog produk dan klik 'Ajukan Penawaran (Nego Harga)' untuk mulai menawar barang dari seller lokal."
                : "Belum ada penawaran masuk dari pembeli untuk barang dagangan Anda."}
            </p>
            <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {negotiations.map((neg) => {
              const hasImage = neg.listing.images && neg.listing.images.length > 0;
              const isBuyer = neg.buyerId === userId;
              const counterparty = isBuyer ? neg.seller.codename : neg.buyer.codename;

              return (
                <Link
                  key={neg.id}
                  href={`/negotiations/${neg.id}`}
                  className="block bg-[#121212] border border-[#262626] hover:border-[#39FF14]/70 p-5 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
                        {hasImage ? (
                          <img
                            src={neg.listing.images[0]}
                            alt={neg.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-[#555]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#888]">
                          <span>Lawan Bicara:</span>
                          <span className="text-[#39FF14] font-bold">{counterparty}</span>
                          <span>•</span>
                          <span>{neg.listing.locationCity}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-1">
                          {neg.listing.title}
                        </h3>
                        <div className="text-xs font-mono text-[#aaa]">
                          Tawaran Saat Ini:{" "}
                          <span className="text-white font-bold">
                            Rp {neg.currentOfferPrice.toLocaleString("id-ID")}
                          </span>{" "}
                          <span className="text-[#888]">
                            (Harga Asli: Rp {neg.listing.fiatEstimateIdr.toLocaleString("id-ID")})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Arrow */}
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {neg.status === "DEAL_AGREED" && (
                        <span className="badge-green text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> DEAL DISEPAKATI
                        </span>
                      )}
                      {neg.status === "OFFER_MADE" && (
                        <span className="badge-warn text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
                          <Clock size={13} /> MENUNGGU RESPON
                        </span>
                      )}
                      {neg.status === "COUNTER_OFFERED" && (
                        <span className="badge-purple text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
                          <MessageSquare size={13} /> COUNTER-OFFER AKTIF
                        </span>
                      )}
                      {neg.status === "REJECTED" && (
                        <span className="badge-danger text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
                          <XCircle size={13} /> DITOLAK
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
