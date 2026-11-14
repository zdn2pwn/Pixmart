"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  Edit,
  Eye,
} from "lucide-react";

export function SellerDashboardContentClean({
  session,
  myListings,
  negotiations,
  escrowRooms,
}: {
  session: any;
  myListings: any[];
  negotiations: any[];
  escrowRooms: any[];
}) {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "OFFERS" | "TRANSACTIONS">("PRODUCTS");

  const incomingOffers = (negotiations || []).filter(
    (n: any) => n.seller_id === session?.userId && n.status !== "REJECTED"
  );
  const activeEscrows = (escrowRooms || []).filter(
    (r: any) => r.status !== "COMPLETED" && r.status !== "CANCELLED"
  );

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section - Clean & Minimal */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Seller</h1>
        <p className="text-gray-400 text-sm">
          Selamat datang, <span className="text-[#39FF14] font-semibold">{session?.codename}</span>
        </p>
      </div>

      {/* Stats Cards - Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Produk */}
        <div className="bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{myListings.length}</div>
          <div className="text-sm text-gray-400">Total Produk</div>
        </div>

        {/* Tawaran Masuk */}
        <div className="bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <MessageSquare size={20} className="text-orange-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{incomingOffers.length}</div>
          <div className="text-sm text-gray-400">Tawaran Masuk</div>
        </div>

        {/* Escrow Aktif */}
        <div className="bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{activeEscrows.length}</div>
          <div className="text-sm text-gray-400">Escrow Aktif</div>
        </div>

        {/* Reputasi */}
        <div className="bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">99%</div>
          <div className="text-sm text-gray-400">Reputasi</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Link
          href="/marketplace/new"
          className="inline-flex items-center gap-2 bg-[#39FF14] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#32dd10] transition-colors"
        >
          <Plus size={20} />
          <span>Pasang Iklan Baru</span>
        </Link>
      </div>

      {/* Tabs - Minimal Design */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex gap-8">
          {[
            { key: "PRODUCTS", label: "Produk Saya", count: myListings.length },
            { key: "OFFERS", label: "Tawaran", count: incomingOffers.length },
            { key: "TRANSACTIONS", label: "Transaksi", count: activeEscrows.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-4 px-2 font-medium text-sm transition-colors relative ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-800 text-xs">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#39FF14]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Tab 1: PRODUCTS */}
        {activeTab === "PRODUCTS" && (
          <div>
            {myListings.length === 0 ? (
              <div className="bg-[#111] border border-gray-800 rounded-lg p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Belum ada produk
                </h3>
                <p className="text-gray-400 mb-6">
                  Mulai jualan dengan pasang iklan produk pertama Anda
                </p>
                <Link
                  href="/marketplace/new"
                  className="inline-flex items-center gap-2 bg-[#39FF14] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#32dd10] transition-colors"
                >
                  <Plus size={20} />
                  Pasang Iklan Pertama
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myListings.map((listing: any) => (
                  <div
                    key={listing.id}
                    className="bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {listing.images && listing.images[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={32} className="text-gray-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white truncate pr-2">
                            {listing.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              listing.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {listing.status}
                          </span>
                        </div>

                        <div className="text-lg font-bold text-[#39FF14] mb-2">
                          Rp {(listing.fiat_estimate_idr || listing.fiatEstimateIdr || 0).toLocaleString("id-ID")}
                        </div>

                        <div className="text-sm text-gray-400 mb-3">
                          {listing.location_city || listing.locationCity}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/marketplace/${listing.id}`}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#39FF14] transition-colors"
                          >
                            <Eye size={14} />
                            <span>Lihat</span>
                          </Link>
                          <Link
                            href={`/marketplace/${listing.id}/edit`}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: OFFERS */}
        {activeTab === "OFFERS" && (
          <div>
            {incomingOffers.length === 0 ? (
              <div className="bg-[#111] border border-gray-800 rounded-lg p-12 text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Belum ada tawaran
                </h3>
                <p className="text-gray-400">
                  Tawaran dari pembeli akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingOffers.map((neg: any) => (
                  <Link
                    key={neg.id}
                    href={`/negotiations/${neg.id}`}
                    className="block bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-400">Dari:</span>
                          <span className="text-white font-medium">
                            {neg.buyer?.codename || "Buyer"}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">
                          {neg.listing?.title || "Produk"}
                        </h3>
                        <div className="text-[#39FF14] font-bold">
                          Tawaran: Rp {(neg.current_offer_price || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-gray-600 group-hover:text-[#39FF14] transition-colors"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: TRANSACTIONS */}
        {activeTab === "TRANSACTIONS" && (
          <div>
            {activeEscrows.length === 0 ? (
              <div className="bg-[#111] border border-gray-800 rounded-lg p-12 text-center">
                <ShieldCheck size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Belum ada transaksi
                </h3>
                <p className="text-gray-400">
                  Transaksi COD yang sedang berjalan akan muncul di sini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEscrows.map((room: any) => (
                  <Link
                    key={room.id}
                    href={`/escrow/${room.id}`}
                    className="block bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-400">Dengan:</span>
                          <span className="text-white font-medium">
                            {room.buyer?.codename || "Buyer"}
                          </span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">
                          {room.listing?.title || room.item_title || "Produk"}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="text-[#39FF14] font-bold">
                            Rp {(room.final_price_idr || room.agreed_price_btc * 1400000000 || 0).toLocaleString("id-ID")}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              room.status === "COMPLETED"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-orange-500/10 text-orange-400"
                            }`}
                          >
                            {room.status || "PENDING"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-gray-600 group-hover:text-[#39FF14] transition-colors"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
