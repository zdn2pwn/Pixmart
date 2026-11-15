"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { customAlert } from "@/components/ui/CustomAlert";
import { deleteEscrowSessionAction } from "@/app/actions/escrow";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MessageSquare,
  Trash2,
  MapPin,
  Wallet,
  HandshakeIcon,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface EscrowListClientProps {
  rooms: any[];
  userId: string;
  unreadCounts: { [key: string]: number };
  latestMessages: { [key: string]: any };
}

type FilterType = "ALL" | "PENDING" | "COMPLETED" | "DISPUTED";

export function EscrowListClient({
  rooms: initialRooms,
  userId,
  unreadCounts,
  latestMessages,
}: EscrowListClientProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [, startTransition] = useTransition();

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    if (filter === "ALL") return true;
    if (filter === "COMPLETED") return room.status === "COMPLETED";
    if (filter === "DISPUTED") return room.status === "DISPUTED";
    if (filter === "PENDING") return room.status !== "COMPLETED" && room.status !== "DISPUTED";
    return true;
  });

  // Group by counterparty (NOT stacking same person!)
  const grouped: { [key: string]: any[] } = {};
  
  filteredRooms.forEach((room) => {
    const isBuyer = room.buyer_id === userId;
    const counterpartyId = isBuyer ? room.seller_id : room.buyer_id;
    
    if (!grouped[counterpartyId]) {
      grouped[counterpartyId] = [];
    }
    grouped[counterpartyId].push(room);
  });

  // Convert to array and sort
  const groupedArray = Object.entries(grouped).map(([counterpartyId, rooms]) => {
    const sortedRooms = rooms.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const latestRoom = sortedRooms[0];
    const totalUnread = sortedRooms.reduce(
      (sum, room) => sum + (unreadCounts[room.id] || 0),
      0
    );

    return {
      counterpartyId,
      counterparty: latestRoom.buyer_id === userId ? latestRoom.seller : latestRoom.buyer,
      rooms: sortedRooms,
      latestRoom,
      totalUnread,
      latestMessage: latestMessages[latestRoom.id],
    };
  });

  groupedArray.sort(
    (a, b) => new Date(b.latestRoom.created_at).getTime() - new Date(a.latestRoom.created_at).getTime()
  );

  async function handleDelete(roomId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    customAlert.confirm(
      "Yakin ingin menghapus escrow ini? Data escrow akan dihapus permanen dari database.",
      async () => {
        console.log("[EscrowList] Deleting room:", roomId);
        setDeletingId(roomId);
        
        startTransition(async () => {
          try {
            const result = await deleteEscrowSessionAction(roomId);
            console.log("[EscrowList] Delete result:", result);
            
            if (result.success) {
              // Remove from state
              setRooms((prev) => prev.filter((room) => room.id !== roomId));
              customAlert.success("Escrow berhasil dihapus dari database.");
            } else {
              customAlert.error(result.error || "Gagal menghapus escrow");
            }
          } catch (err) {
            console.error("[EscrowList] Delete error:", err);
            customAlert.error("Terjadi kesalahan saat menghapus escrow");
          } finally {
            setDeletingId(null);
          }
        });
      },
      "Hapus Escrow?"
    );
  }

  function getStatusBadge(room: any) {
    if (room.status === "COMPLETED") {
      return (
        <span className="badge-green text-xs font-bold py-1 px-2 flex items-center gap-1">
          <CheckCircle2 size={11} /> SELESAI
        </span>
      );
    }
    if (room.status === "DISPUTED") {
      return (
        <span className="badge-danger text-xs font-bold py-1 px-2 flex items-center gap-1">
          <XCircle size={11} /> SENGKETA
        </span>
      );
    }
    return (
      <span className="badge-warn text-xs font-bold py-1 px-2 flex items-center gap-1">
        <Clock size={11} /> AKTIF
      </span>
    );
  }

  function getPaymentStatus(room: any) {
    if (room.payment_status === "AWAITING_PAYMENT") {
      return { text: "Belum Bayar", color: "text-[#FF8A3D]", icon: Wallet };
    }
    if (room.payment_status === "RECEIVED") {
      return { text: "Sudah Bayar", color: "text-[#C8FF4D]", icon: CheckCircle2 };
    }
    if (room.payment_status === "HELD_BY_MIDMAN") {
      return { text: "Dana Ditahan", color: "text-[#FFC857]", icon: ShieldCheck };
    }
    if (room.payment_status === "RELEASED") {
      return { text: "Dana Dirilis", color: "text-[#C8FF4D]", icon: CheckCircle2 };
    }
    return { text: room.payment_status || "Unknown", color: "text-[#A79EC2]", icon: Clock };
  }

  function getMeetingStatus(room: any) {
    if (room.buyer_confirmed && room.seller_confirmed) {
      return { text: "Transaksi Selesai", color: "text-[#C8FF4D]", icon: CheckCircle2 };
    }
    if (room.buyer_arrived && room.seller_arrived) {
      return { text: "COD Berlangsung", color: "text-[#FFC857]", icon: HandshakeIcon };
    }
    if (room.meeting_location) {
      return { text: "Titik Temu Disepakati", color: "text-[#C8FF4D]", icon: MapPin };
    }
    return { text: "Belum Ada Titik Temu", color: "text-[#8B82A6]", icon: MapPin };
  }

  // Calculate stats
  const stats = {
    total: rooms.length,
    pending: rooms.filter((r) => r.status !== "COMPLETED" && r.status !== "DISPUTED").length,
    completed: rooms.filter((r) => r.status === "COMPLETED").length,
    disputed: rooms.filter((r) => r.status === "DISPUTED").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats & Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`p-3 border transition-all ${
            filter === "ALL"
              ? "bg-[#C8FF4D]/10 border-[#C8FF4D] text-[#C8FF4D]"
              : "bg-[#12101F] border-[#3A3157] text-[#A79EC2] hover:border-[#C8FF4D]/50"
          }`}
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-[10px] font-mono uppercase mt-1">Total</div>
        </button>

        <button
          onClick={() => setFilter("PENDING")}
          className={`p-3 border transition-all ${
            filter === "PENDING"
              ? "bg-[#FFC857]/10 border-[#FFC857] text-[#FFC857]"
              : "bg-[#12101F] border-[#3A3157] text-[#A79EC2] hover:border-[#FFC857]/50"
          }`}
        >
          <div className="text-2xl font-bold">{stats.pending}</div>
          <div className="text-[10px] font-mono uppercase mt-1">Aktif</div>
        </button>

        <button
          onClick={() => setFilter("COMPLETED")}
          className={`p-3 border transition-all ${
            filter === "COMPLETED"
              ? "bg-[#C8FF4D]/10 border-[#C8FF4D] text-[#C8FF4D]"
              : "bg-[#12101F] border-[#3A3157] text-[#A79EC2] hover:border-[#C8FF4D]/50"
          }`}
        >
          <div className="text-2xl font-bold">{stats.completed}</div>
          <div className="text-[10px] font-mono uppercase mt-1">Selesai</div>
        </button>

        <button
          onClick={() => setFilter("DISPUTED")}
          className={`p-3 border transition-all ${
            filter === "DISPUTED"
              ? "bg-[#FF6B6B]/10 border-[#FF6B6B] text-[#FF6B6B]"
              : "bg-[#12101F] border-[#3A3157] text-[#A79EC2] hover:border-[#FF6B6B]/50"
          }`}
        >
          <div className="text-2xl font-bold">{stats.disputed}</div>
          <div className="text-[10px] font-mono uppercase mt-1">Sengketa</div>
        </button>
      </div>

      {/* Escrow List */}
      {filteredRooms.length === 0 ? (
        <div className="bg-[#12101F] border border-[#3A3157] p-8 text-center">
          <Filter size={32} className="mx-auto text-[#5C5575] mb-3" />
          <p className="text-sm text-[#A79EC2]">
            Tidak ada escrow dengan filter <span className="text-[#C8FF4D] font-bold">{filter}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedArray.map((group) => {
            const { counterparty, rooms: userRooms, latestRoom, totalUnread, latestMessage } = group;
            const hasMultiple = userRooms.length > 1;
            const listing = latestRoom.negotiation?.listing;
            const hasImage = listing?.images && listing.images.length > 0;

            const btcToIdr = 1400000000;
            const xmrToIdr = 3500000;
            const agreedPriceIdr =
              latestRoom.crypto_type === "BTC"
                ? Math.round((latestRoom.agreed_price_btc || 0) * btcToIdr)
                : Math.round((latestRoom.agreed_price_xmr || 0) * xmrToIdr);

            const paymentStatus = getPaymentStatus(latestRoom);
            const meetingStatus = getMeetingStatus(latestRoom);

            return (
              <div key={group.counterpartyId} className="relative">
                <Link
                  href={`/escrow/${latestRoom.id}`}
                  className="block bg-[#12101F] border border-[#3A3157] hover:border-[#C8FF4D]/70 p-4 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-[#231D3A] border border-[#4A4168] shrink-0 overflow-hidden flex items-center justify-center">
                        {hasImage ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-[#6F6788]" />
                        )}
                      </div>
                      
                      {totalUnread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                          <span className="text-cream text-[10px] font-bold">{totalUnread}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-sm font-bold text-[#C8FF4D] truncate">
                            {counterparty.codename}
                          </h3>
                          
                          {hasMultiple && (
                            <span className="text-[10px] bg-[#C8FF4D]/10 text-[#C8FF4D] px-2 py-0.5 rounded-full font-bold shrink-0">
                              {userRooms.length} escrow
                            </span>
                          )}

                          {getStatusBadge(latestRoom)}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(latestRoom.id, e)}
                          disabled={deletingId === latestRoom.id}
                          className="text-[#8B82A6] hover:text-[#FF6B6B] transition-colors p-1 shrink-0 disabled:opacity-50"
                          title="Hapus dari daftar"
                        >
                          {deletingId === latestRoom.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>

                      {/* Product Title & Signature */}
                      <div className="space-y-1">
                        <div className="text-xs text-cream font-medium line-clamp-1">
                          {latestRoom.item_title || listing?.title || "Produk"}
                        </div>
                        <div className="text-[10px] font-mono text-[#8B82A6]">
                          Signature: <span className="text-[#C8FF4D]">{latestRoom.escrow_address}</span>
                        </div>
                      </div>

                      {/* Latest Message */}
                      {latestMessage && (
                        <div className="text-xs text-[#A79EC2] line-clamp-1 flex items-center gap-1">
                          <MessageSquare size={10} className="shrink-0" />
                          <span className="truncate">{latestMessage.content}</span>
                        </div>
                      )}

                      {/* Status Indicators */}
                      <div className="flex items-center gap-4 text-[10px] font-mono">
                        <div className={`flex items-center gap-1 ${paymentStatus.color}`}>
                          <paymentStatus.icon size={10} />
                          <span>{paymentStatus.text}</span>
                        </div>

                        <div className={`flex items-center gap-1 ${meetingStatus.color}`}>
                          <meetingStatus.icon size={10} />
                          <span>{meetingStatus.text}</span>
                        </div>
                      </div>

                      {/* Price & Time */}
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <div className="text-[#A79EC2]">
                          Total:{" "}
                          <span className="text-cream font-bold">
                            Rp {agreedPriceIdr.toLocaleString("id-ID")}
                          </span>
                        </div>

                        {latestMessage && (
                          <span className="text-[#8B82A6]">
                            {formatDistanceToNow(new Date(latestMessage.created_at), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-[#8B82A6] group-hover:text-[#C8FF4D] transition-colors shrink-0 self-center">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  {/* Multiple escrows preview */}
                  {hasMultiple && (
                    <div className="mt-3 pt-3 border-t border-[#3A3157] grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {userRooms.slice(0, 3).map((room) => (
                        <div key={room.id} className="text-[10px] text-[#8B82A6] truncate flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-[#8B82A6]" />
                          <span className="truncate">{room.item_title}</span>
                        </div>
                      ))}
                      {userRooms.length > 3 && (
                        <div className="text-[10px] text-[#C8FF4D]">+{userRooms.length - 3} lagi</div>
                      )}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
