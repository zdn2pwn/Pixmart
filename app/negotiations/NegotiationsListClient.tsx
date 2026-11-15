"use client";

import { useState } from "react";
import Link from "next/link";
import { customAlert } from "@/components/ui/CustomAlert";
import { cancelNegotiationAction } from "@/app/actions/negotiation";
import { ArrowRight, Clock, CheckCircle2, XCircle, Package, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface NegotiationsListClientProps {
  negotiations: any[];
  userId: string;
  unreadCounts: { [key: string]: number };
  latestMessages: { [key: string]: any };
}

export function NegotiationsListClient({
  negotiations: initialNegotiations,
  userId,
  unreadCounts,
  latestMessages,
}: NegotiationsListClientProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [negotiations, setNegotiations] = useState(initialNegotiations);

  // Group negotiations by counterparty
  const grouped: { [key: string]: any[] } = {};
  
  negotiations.forEach((neg) => {
    const isBuyer = neg.buyer_id === userId;
    const counterpartyId = isBuyer ? neg.seller_id : neg.buyer_id;
    
    if (!grouped[counterpartyId]) {
      grouped[counterpartyId] = [];
    }
    grouped[counterpartyId].push(neg);
  });

  // Convert to array and sort by latest activity
  const groupedArray = Object.entries(grouped).map(([counterpartyId, negotiations]) => {
    // Sort negotiations by updated_at (descending)
    const sortedNegotiations = negotiations.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    // Get the most recent negotiation as the representative
    const latestNeg = sortedNegotiations[0];
    
    // Calculate total unread count for this user
    const totalUnread = sortedNegotiations.reduce(
      (sum, neg) => sum + (unreadCounts[neg.id] || 0),
      0
    );

    return {
      counterpartyId,
      counterparty: latestNeg.buyer_id === userId ? latestNeg.seller : latestNeg.buyer,
      negotiations: sortedNegotiations,
      latestNeg,
      totalUnread,
      latestMessage: latestMessages[latestNeg.id],
    };
  });

  // Sort grouped array by latest activity
  groupedArray.sort(
    (a, b) => new Date(b.latestNeg.updated_at).getTime() - new Date(a.latestNeg.updated_at).getTime()
  );

  async function handleDelete(counterpartyId: string, negotiationsToDelete: any[], e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const count = negotiationsToDelete.length;
    const message = count > 1 
      ? `Yakin ingin menghapus ${count} negosiasi dengan user ini? Tindakan ini tidak dapat dibatalkan.`
      : "Yakin ingin menghapus negosiasi ini? Tindakan ini tidak dapat dibatalkan.";

    customAlert.confirm(
      message,
      async () => {
        setDeletingId(counterpartyId);
        
        // Delete all negotiations with this counterparty
        let allSuccess = true;
        
        for (const neg of negotiationsToDelete) {
          const formData = new FormData();
          formData.append("negotiationId", neg.id);
          
          const result = await cancelNegotiationAction(formData);
          
          if (!result.success) {
            allSuccess = false;
            break;
          }
        }
        
        setDeletingId(null);
        
        if (allSuccess) {
          // Remove ALL negotiations from this counterparty from UI
          setNegotiations((prev) => 
            prev.filter((neg) => {
              const isBuyer = neg.buyer_id === userId;
              const negCounterpartyId = isBuyer ? neg.seller_id : neg.buyer_id;
              return negCounterpartyId !== counterpartyId;
            })
          );
          
          customAlert.success(`${count} negosiasi berhasil dihapus.`);
        } else {
          customAlert.error("Gagal menghapus negosiasi");
        }
      },
      "Hapus Negosiasi?"
    );
  }

  function getStatusBadge(status: string) {
    if (status === "ACCEPTED") {
      return (
        <span className="badge-green text-xs font-bold py-1 px-2 flex items-center gap-1">
          <CheckCircle2 size={11} /> DEAL
        </span>
      );
    }
    if (status === "PENDING" || status === "COUNTER_OFFER") {
      return (
        <span className="badge-warn text-xs font-bold py-1 px-2 flex items-center gap-1">
          <Clock size={11} /> NEGO
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="badge-danger text-xs font-bold py-1 px-2 flex items-center gap-1">
          <XCircle size={11} /> TOLAK
        </span>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {groupedArray.map((group) => {
        const { counterparty, negotiations: userNegotiations, latestNeg, totalUnread, latestMessage } = group;
        const hasMultiple = userNegotiations.length > 1;
        const hasImage = latestNeg.listing?.images && latestNeg.listing.images.length > 0;

        return (
          <div key={group.counterpartyId} className="relative">
            <Link
              href={`/negotiations/${latestNeg.id}`}
              className="block bg-[#12101F] border border-[#3A3157] hover:border-[#C8FF4D]/70 p-4 transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar/Thumbnail */}
                <div className="relative">
                  <div className="w-16 h-16 bg-[#231D3A] border border-[#4A4168] shrink-0 overflow-hidden flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={latestNeg.listing.images[0]}
                        alt={latestNeg.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-[#6F6788]" />
                    )}
                  </div>
                  
                  {/* Unread Badge */}
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
                          {userNegotiations.length} item
                        </span>
                      )}

                      {getStatusBadge(latestNeg.status)}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(group.counterpartyId, userNegotiations, e)}
                      disabled={deletingId === group.counterpartyId}
                      className="text-[#8B82A6] hover:text-[#FF6B6B] transition-colors p-1 shrink-0 disabled:opacity-50"
                      title="Hapus negosiasi"
                    >
                      {deletingId === group.counterpartyId ? (
                        <div className="w-3.5 h-3.5 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>

                  {/* Product Title */}
                  <div className="text-xs text-cream font-medium line-clamp-1">
                    {latestNeg.listing?.title || "Produk"}
                    {hasMultiple && (
                      <span className="text-[#8B82A6]"> + {userNegotiations.length - 1} lainnya</span>
                    )}
                  </div>

                  {/* Latest Message Preview */}
                  {latestMessage && (
                    <div className="text-xs text-[#A79EC2] line-clamp-1 flex items-center gap-1">
                      <MessageSquare size={10} className="shrink-0" />
                      <span className="truncate">{latestMessage.content}</span>
                    </div>
                  )}

                  {/* Price Info */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="text-[#A79EC2]">
                      Tawaran:{" "}
                      <span className="text-cream font-bold">
                        {latestNeg.current_offer_btc
                          ? `${latestNeg.current_offer_btc.toFixed(8)} BTC`
                          : latestNeg.current_offer_xmr
                          ? `${latestNeg.current_offer_xmr.toFixed(4)} XMR`
                          : "Belum ada"}
                      </span>
                    </div>

                    {/* Time ago */}
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

              {/* Show all negotiations preview if multiple */}
              {hasMultiple && (
                <div className="mt-3 pt-3 border-t border-[#3A3157] grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {userNegotiations.slice(0, 3).map((neg) => (
                    <div
                      key={neg.id}
                      className="text-[10px] text-[#8B82A6] truncate flex items-center gap-1"
                    >
                      <div className="w-1 h-1 rounded-full bg-[#8B82A6]" />
                      <span className="truncate">{neg.listing?.title}</span>
                    </div>
                  ))}
                  {userNegotiations.length > 3 && (
                    <div className="text-[10px] text-[#C8FF4D]">+{userNegotiations.length - 3} lagi</div>
                  )}
                </div>
              )}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
