"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageThread } from "@/components/chat/MessageThread";
import { sendEscrowMessageAction } from "@/app/actions/messaging";
import { markEscrowMessageAsReadAction, deleteEscrowMessageAction } from "@/app/actions/messages";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface EscrowRoomClientProps {
  room: any;
  messages: any[];
  session: any;
}

export function EscrowRoomClient({ room: initialRoom, messages: initialMessages, session }: EscrowRoomClientProps) {
  const router = useRouter();
  const [room] = useState(initialRoom);
  const [messages, setMessages] = useState(initialMessages);

  const isBuyer = session.userId === room.buyer_id;
  const isSeller = session.userId === room.seller_id;
  const counterparty = isBuyer ? room.seller : room.buyer;

  // Handle sending messages
  async function handleSendMessage(content: string) {
    const formData = new FormData();
    formData.append("roomId", room.id);
    formData.append("content", content);

    const result = await sendEscrowMessageAction(formData);
    
    if (result.success) {
      // Realtime will handle updating messages automatically
    }

    return result;
  }

  // Handle marking message as read (triggers self-destruct)
  async function handleMarkAsRead(messageId: string) {
    await markEscrowMessageAsReadAction(messageId, room.id);
  }

  // Handle message self-destruct
  async function handleDeleteMessage(messageId: string) {
    await deleteEscrowMessageAction(messageId, room.id);
  }

  // Setup Supabase Realtime for instant message updates
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Function to fetch latest messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("escrow_messages")
        .select("*")
        .eq("escrow_room_id", room.id)
        .order("created_at", { ascending: true });
      
      if (data) {
        setMessages(data);
      }
    };

    // Subscribe to escrow_messages table for this room
    const channel = supabase
      .channel(`escrow_messages:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "escrow_messages",
          filter: `escrow_room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log("Realtime message event:", payload);

          if (payload.eventType === "INSERT") {
            const newMessage = payload.new;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    // POLLING: Fetch messages every 2 seconds as fallback
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2000); // 2 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [room.id]);

  const statusBadge = () => {
    const status = room.status || "PENDING";
    if (status === "COMPLETED") {
      return (
        <span className="badge-green text-xs font-bold px-3 py-1 flex items-center gap-1.5">
          <CheckCircle2 size={13} /> SELESAI
        </span>
      );
    }
    if (status === "DISPUTED") {
      return (
        <span className="badge-danger text-xs font-bold px-3 py-1 flex items-center gap-1.5">
          <AlertTriangle size={13} /> SENGKETA
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
          href="/escrow"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#888] hover:text-[#39FF14] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Escrow</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
              <span>ESCROW COD ROOM #{room.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {room.listing?.title || "Produk"}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#888]">
              <span>
                {isBuyer ? "Seller" : "Buyer"}: <span className="text-[#39FF14] font-bold">{counterparty?.codename}</span>
              </span>
              <span>•</span>
              <span className="text-white font-bold">
                Rp {(room.final_price_idr || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {statusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product & Transaction Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Product Card */}
          <div className="bg-[#121212] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold">Detail Produk</h3>
            
            <div className="aspect-square bg-[#181818] border border-[#333] flex items-center justify-center overflow-hidden">
              {room.listing?.images && room.listing.images[0] ? (
                <img
                  src={room.listing.images[0]}
                  alt={room.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={48} className="text-[#555]" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888]">Harga Final:</span>
                <span className="text-white font-bold">
                  Rp {(room.final_price_idr || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Crypto:</span>
                <span className="text-[#39FF14] font-mono font-bold">
                  {room.crypto_amount || 0} {room.crypto_currency || "XMR"}
                </span>
              </div>
            </div>
          </div>

          {/* Meeting Info Card */}
          <div className="bg-[#121212] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <MapPin size={13} className="text-[#39FF14]" />
              <span>Titik Temu COD</span>
            </h3>

            {room.meeting_location ? (
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[#666] text-[10px] mb-0.5">Lokasi:</div>
                  <div className="text-white font-bold">{room.meeting_location}</div>
                </div>
                {room.meeting_time && (
                  <div>
                    <div className="text-[#666] text-[10px] mb-0.5">Waktu:</div>
                    <div className="text-white font-mono">
                      {new Date(room.meeting_time).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#666] italic">
                Titik temu belum ditentukan. Diskusikan dengan lawan transaksi di chat.
              </div>
            )}
          </div>

          {/* Presence Indicators */}
          <div className="bg-[#121212] border border-[#262626] p-4 space-y-2">
            <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold">Status Kehadiran</h3>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={12} className={room.buyer_arrived ? "text-[#39FF14]" : "text-[#666]"} />
                  <span className="text-[#aaa]">Buyer</span>
                </span>
                <span className={room.buyer_arrived ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {room.buyer_arrived ? "Hadir" : "Belum hadir"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={12} className={room.seller_arrived ? "text-[#39FF14]" : "text-[#666]"} />
                  <span className="text-[#aaa]">Seller</span>
                </span>
                <span className={room.seller_arrived ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {room.seller_arrived ? "Hadir" : "Belum hadir"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-2">
          <div className="bg-[#121212] border border-[#262626] h-[600px] flex flex-col">
            <div className="border-b border-[#222] px-4 py-3 bg-[#0f0f0f]">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider font-bold flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#39FF14]" />
                <span>Chat Koordinasi COD</span>
              </h3>
              <p className="text-[10px] font-mono text-[#666] mt-0.5">
                Diskusikan titik temu, waktu, dan konfirmasi serah terima barang
              </p>
            </div>

            <MessageThread
              messages={messages}
              currentUserId={session.userId}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              onDeleteMessage={handleDeleteMessage}
              placeholder="Ketik pesan koordinasi..."
              emptyStateText="Mulai koordinasi COD dengan lawan transaksi"
              enableSelfDestruct={true}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
