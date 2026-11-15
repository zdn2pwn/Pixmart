"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageThread } from "@/components/chat/MessageThread";
import { LiveBidBar } from "@/components/nego/LiveBidBar";
import { sendNegotiationMessageAction } from "@/app/actions/messaging";
import { acceptOfferAction, rejectOfferAction, counterOfferAction, cancelNegotiationAction } from "@/app/actions/negotiation";
import { markNegoMessageAsReadAction, deleteNegoMessageAction } from "@/app/actions/messages";
import { customAlert } from "@/components/ui/CustomAlert";
import {
  ArrowLeft,
  MessageSquare,
  Package,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface NegotiationRoomClientProps {
  negotiation: any;
  messages: any[];
  session: any;
}

export function NegotiationRoomClient({
  negotiation: initialNegotiation,
  messages: initialMessages,
  session,
}: NegotiationRoomClientProps) {
  const router = useRouter();
  const [negotiation, setNegotiation] = useState(initialNegotiation);
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

  const isBuyer = session.userId === negotiation.buyer_id;
  const isSeller = session.userId === negotiation.seller_id;
  const counterparty = isBuyer ? negotiation.seller : negotiation.buyer;
  const canAcceptOffer = isSeller && (negotiation.status === "PENDING" || negotiation.status === "COUNTER_OFFER");

  // Handle accepting offer and creating escrow
  async function handleAcceptOffer() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("negotiationId", negotiation.id);
      
      const result = await acceptOfferAction(formData);
      
      if (result.success) {
        if (result.bothAgreed && result.escrowRoomId) {
          // Both agreed (2/2) - Redirect to escrow
          customAlert.success(result.message || "Escrow room berhasil dibuat!", "Deal 2/2!");
          setTimeout(() => {
            router.push(`/escrow/${result.escrowRoomId}`);
          }, 1500);
        } else {
          // Only one agreed (1/2). Realtime/polling updates the local state.
          customAlert.info(result.message || "Deal agreement updated. Menunggu pihak lain...");
        }
      } else {
        customAlert.error(result.error || "Gagal update agreement");
      }
    });
  }

  // Handle rejecting offer
  async function handleRejectOffer() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("negotiationId", negotiation.id);
      
      const result = await rejectOfferAction(formData);
      
      if (result.success) {
        customAlert.info(result.message || "Offer ditolak. Silakan counter offer lagi.", "Offer Ditolak");
      } else {
        customAlert.error(result.error || "Gagal menolak penawaran");
      }
    });
  }

  // Handle canceling entire negotiation
  async function handleCancelNegotiation() {
    customAlert.confirm(
      "Yakin ingin MEMBATALKAN negosiasi ini secara permanen? Negosiasi akan ditutup dan tidak bisa dilanjutkan.",
      () => {
        startTransition(async () => {
          const formData = new FormData();
          formData.append("negotiationId", negotiation.id);
          
          const result = await cancelNegotiationAction(formData);
          
          if (result.success) {
            customAlert.success(result.message || "Negosiasi dibatalkan.", "Negosiasi Dibatalkan");
            setTimeout(() => {
              router.push("/negotiations");
            }, 1500);
          } else {
            customAlert.error(result.error || "Gagal membatalkan negosiasi");
          }
        });
      },
      "Batalkan Negosiasi?"
    );
  }

  // Handle counter offer from Live Bid Bar
  async function handleCounterOffer(method: 'BTC' | 'XMR', amount: number) {
    // Validation
    if (isNaN(amount) || amount <= 0) {
      customAlert.error("Masukkan jumlah yang valid!", "Input Tidak Valid");
      return;
    }

    // Buyer validation: can't bid higher than listing
    if (isBuyer) {
      const listingPrice = method === 'BTC' ? negotiation.listing?.price_btc : negotiation.listing?.price_xmr;
      if (amount > listingPrice) {
        customAlert.error(
          `Counter offer tidak boleh lebih tinggi dari harga listing! (Max: ${listingPrice.toFixed(method === 'BTC' ? 8 : 4)} ${method})`,
          "Tawaran Terlalu Tinggi"
        );
        return;
      }
    }

    startTransition(async () => {
      // Calculate fiat estimate
      const btcToIdr = 1400000000;
      const xmrToIdr = 3500000;
      const fiatEstimate = method === 'BTC' ? Math.round(amount * btcToIdr) : Math.round(amount * xmrToIdr);
      
      // Send formatted message to chat
      const messageContent = `💰 ${isBuyer ? 'Tawaran' : 'Counter Offer'}:\n${amount.toFixed(method === 'BTC' ? 8 : 4)} ${method}\n≈ Rp ${fiatEstimate.toLocaleString("id-ID")}`;
      
      const msgFormData = new FormData();
      msgFormData.append("negotiationId", negotiation.id);
      msgFormData.append("content", messageContent);
      
      // Send message
      await sendNegotiationMessageAction(msgFormData);

      // UPDATE NEGOTIATION TABLE - Pass method and amount directly!
      const counterFormData = new FormData();
      counterFormData.append("negotiationId", negotiation.id);
      counterFormData.append("method", method); // 'BTC' or 'XMR'
      counterFormData.append("amount", amount.toString()); // The actual amount
      
      const result = await counterOfferAction(counterFormData);
      
      if (result.success) {
        // Realtime/polling refreshes the bid bar with the new offer.
      } else {
        customAlert.error(result.error || "Gagal update offer");
      }
    });
  }

  // Handle sending messages
  async function handleSendMessage(content: string) {
    const formData = new FormData();
    formData.append("negotiationId", negotiation.id);
    formData.append("content", content);

    // Optimistic update - add message immediately to UI
    const tempMessage = {
      id: `temp_${Date.now()}`,
      negotiation_id: negotiation.id,
      sender_id: session.userId,
      sender_role: session.role,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      is_deleted: false,
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    const result = await sendNegotiationMessageAction(formData);

    if (result.success) {
      // Realtime/polling replaces the optimistic message with the saved row.
    } else {
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }

    return result;
  }

  // Handle marking message as read (triggers self-destruct)
  async function handleMarkAsRead(messageId: string) {
    await markNegoMessageAsReadAction(messageId, negotiation.id);
    // Realtime will update read_at automatically
  }

  // Handle message self-destruct
  async function handleDeleteMessage(messageId: string) {
    await deleteNegoMessageAction(messageId, negotiation.id);
    // Realtime will handle removal
  }

  // Setup Supabase Realtime + Auto-refresh polling
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Function to fetch latest messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("negotiation_messages")
        .select("*")
        .eq("negotiation_id", negotiation.id)
        .order("created_at", { ascending: true });
      
      if (data) {
        setMessages(data);
      }
    };

    // Function to fetch latest negotiation data
    const fetchNegotiation = async () => {
      const { data } = await supabase
        .from("negotiations")
        .select(`
          *,
          listing:marketplace_listings(*),
          buyer:profiles!negotiations_buyer_id_fkey(id, codename),
          seller:profiles!negotiations_seller_id_fkey(id, codename)
        `)
        .eq("id", negotiation.id)
        .single();
      
      if (data) {
        setNegotiation(data);
      }
    };

    // Subscribe to negotiation_messages table for this negotiation
    const messagesChannel = supabase
      .channel(`negotiation_messages:${negotiation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "negotiation_messages",
          filter: `negotiation_id=eq.${negotiation.id}`,
        },
        (payload) => {
          console.log("Realtime message event:", payload);

          if (payload.eventType === "INSERT") {
            // New message received
            const newMessage = payload.new;
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          } else if (payload.eventType === "UPDATE") {
            // Message updated (e.g., marked as read)
            const updatedMessage = payload.new;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            );
          } else if (payload.eventType === "DELETE") {
            // Message deleted (self-destruct)
            const deletedId = payload.old.id;
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Subscribe to negotiations table for price updates (FIX BUG #1 & #2)
    const negotiationChannel = supabase
      .channel(`negotiation:${negotiation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "negotiations",
          filter: `id=eq.${negotiation.id}`,
        },
        (payload) => {
          console.log("Realtime negotiation update:", payload);
          // Update negotiation state immediately for live bid bar
          fetchNegotiation();
        }
      )
      .subscribe();

    // POLLING: Fetch messages every 2 seconds as fallback
    const pollInterval = setInterval(() => {
      fetchMessages();
      fetchNegotiation();
    }, 2000); // 2 seconds

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(negotiationChannel);
      clearInterval(pollInterval);
    };
  }, [negotiation.id]);

  const statusBadge = () => {
    const status = negotiation.status || "PENDING";
    
    if (status === "ACCEPTED") {
      return (
        <span className="badge-green text-xs font-bold px-3 py-1 flex items-center gap-1.5">
          <CheckCircle2 size={13} /> DEAL DISEPAKATI
        </span>
      );
    }
    if (status === "REJECTED" || status === "CANCELLED") {
      return (
        <span className="badge-danger text-xs font-bold px-3 py-1 flex items-center gap-1.5">
          <XCircle size={13} /> {status}
        </span>
      );
    }
    return (
      <span className="badge-warn text-xs font-bold px-3 py-1 flex items-center gap-1.5 animate-pulse">
        <Clock size={13} /> {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <Link
          href="/negotiations"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#888] hover:text-[#39FF14] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Negosiasi</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
              <span>RUANG NEGOSIASI #{negotiation.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {negotiation.listing?.title || "Produk"}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#888]">
              <span>
                {isBuyer ? "Seller" : "Buyer"}: <span className="text-[#39FF14] font-bold">{counterparty?.codename}</span>
              </span>
              <span>•</span>
              <span>
                Harga Awal: <span className="text-white font-bold">
                  Rp {(negotiation.listing?.fiat_estimate_idr || 0).toLocaleString("id-ID")}
                </span>
              </span>
            </div>
          </div>

          {statusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Product Card */}
          <div className="bg-[#121212] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold">Detail Produk</h3>

            <div className="aspect-square bg-[#181818] border border-[#333] flex items-center justify-center overflow-hidden">
              {negotiation.listing?.images && negotiation.listing.images[0] ? (
                <img
                  src={negotiation.listing.images[0]}
                  alt={negotiation.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={48} className="text-[#555]" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="text-[#666] text-[10px] mb-0.5">Harga Listing:</div>
                <div className="text-white font-bold text-sm">
                  {negotiation.listing?.price_btc?.toFixed(8)} BTC
                </div>
                <div className="text-[#FF6600] font-bold text-sm">
                  {negotiation.listing?.price_xmr?.toFixed(4)} XMR
                </div>
                <div className="text-[#666] text-[10px] mt-1">
                  ≈ Rp {(negotiation.listing?.fiat_estimate_idr || 0).toLocaleString("id-ID")}
                </div>
              </div>

              {(negotiation.current_offer_btc || negotiation.current_offer_xmr) && (
                <div className="pt-2 border-t border-[#222]">
                  <div className="text-[#666] text-[10px] mb-0.5">Tawaran Saat Ini:</div>
                  {negotiation.current_offer_btc && (
                    <div className="text-[#39FF14] font-bold text-sm">
                      {negotiation.current_offer_btc.toFixed(8)} BTC
                    </div>
                  )}
                  {negotiation.current_offer_xmr && (
                    <div className="text-[#FF6600] font-bold text-sm">
                      {negotiation.current_offer_xmr.toFixed(4)} XMR
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-[#222]">
                <div className="flex items-center gap-1.5 text-[#aaa]">
                  <MapPin size={11} />
                  <span className="text-[10px]">
                    {negotiation.listing?.location_city}, {negotiation.listing?.location_district}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Negotiation Tips */}
          <div className="bg-[#1a1a0a] border border-[#333] p-4 space-y-2">
            <h3 className="text-xs font-mono text-[#FFB800] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <AlertTriangle size={12} />
              <span>Tips Negosiasi</span>
            </h3>
            <ul className="text-[10px] font-mono text-[#aaa] space-y-1.5">
              <li>• Tawar secara wajar (±10-20% dari harga awal)</li>
              <li>• Komunikasikan alasan tawaran Anda</li>
              <li>• Tanyakan kondisi detail barang</li>
              <li>• Sepakati titik temu yang aman</li>
              <li>• Transaksi dilindungi escrow COD</li>
            </ul>
          </div>

          {/* Seller Action Buttons */}
          {canAcceptOffer && (
            <div className="bg-[#0a0a0a] border border-[#39FF14]/30 p-4 space-y-3">
              <h3 className="text-xs font-mono text-[#39FF14] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <ShieldCheck size={12} />
                <span>Seller Action</span>
              </h3>
              <p className="text-[10px] font-mono text-[#888]">
                Sepakati harga dan lanjut ke Escrow Room untuk atur pertemuan COD
              </p>
              
              {!showAcceptConfirm ? (
                <button
                  onClick={() => setShowAcceptConfirm(true)}
                  disabled={isPending}
                  className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  <span>Setujui & Buat Escrow Room</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-[10px] text-[#FFB800] font-mono mb-2">
                    Yakin setuju dengan harga ini? Escrow room akan otomatis dibuat.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAcceptOffer}
                      disabled={isPending}
                      className="bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Ya, Setuju</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAcceptConfirm(false)}
                      disabled={isPending}
                      className="bg-[#333] hover:bg-[#444] text-white py-2 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleRejectOffer}
                disabled={isPending}
                className="w-full py-2 text-xs font-mono text-[#FF4444] border border-[#FF4444]/30 hover:bg-[#FF4444]/10 flex items-center justify-center gap-1.5"
              >
                <XCircle size={12} />
                <span>Tolak Penawaran</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Chat with Live Bid Bar */}
        <div className="lg:col-span-2">
          <div className="bg-[#121212] border border-[#262626] flex flex-col" style={{ height: "700px" }}>
            {/* Chat Header */}
            <div className="border-b border-[#222] px-4 py-3 bg-[#0f0f0f]">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider font-bold flex items-center gap-2">
                <MessageSquare size={14} className="text-[#39FF14]" />
                <span>Chat Negosiasi Harga</span>
              </h3>
              <p className="text-[10px] font-mono text-[#666] mt-0.5">
                Diskusikan harga, kondisi barang, dan titik temu dengan {isBuyer ? "seller" : "buyer"}
              </p>
            </div>

            {/* Live Bid Bar - Sticky at top */}
            {(negotiation.status === "PENDING" || negotiation.status === "COUNTER_OFFER") && (
              <LiveBidBar
                negotiation={negotiation}
                isBuyer={isBuyer}
                isSeller={isSeller}
                onCounterOffer={handleCounterOffer}
                onAccept={() => {
                  customAlert.confirm(
                    "Yakin setuju dengan harga ini? Escrow room akan otomatis dibuat.",
                    handleAcceptOffer,
                    "Konfirmasi Deal"
                  );
                }}
                onReject={handleRejectOffer}
                isPending={isPending}
              />
            )}

            {/* Chat Thread */}
            <div className="flex-1 overflow-hidden">
              <MessageThread
                messages={messages}
                currentUserId={session.userId}
                onSendMessage={handleSendMessage}
                onMarkAsRead={handleMarkAsRead}
                onDeleteMessage={handleDeleteMessage}
                placeholder="Ketik pesan negosiasi..."
                emptyStateText="Mulai negosiasi dengan lawan transaksi"
                enableSelfDestruct={true}
              />
            </div>

            {/* Cancel Negotiation Button - Bottom of chat */}
            {(negotiation.status === "PENDING" || negotiation.status === "COUNTER_OFFER") && (
              <div className="border-t border-[#222] p-3 bg-[#0a0a0a]">
                <button
                  onClick={handleCancelNegotiation}
                  disabled={isPending}
                  className="w-full py-2 text-xs font-mono text-[#666] hover:text-[#FF4444] hover:border-[#FF4444]/50 border border-[#333] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  title="Batalkan negosiasi secara permanen (tidak bisa dilanjutkan)"
                >
                  <XCircle size={12} />
                  <span>Batalkan Negosiasi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
