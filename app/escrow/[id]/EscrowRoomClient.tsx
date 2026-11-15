"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageThread } from "@/components/chat/MessageThread";
import { sendEscrowMessageAction } from "@/app/actions/messaging";
import { markEscrowMessageAsReadAction, deleteEscrowMessageAction } from "@/app/actions/messages";
import { customAlert } from "@/components/ui/CustomAlert";
import {
  proposeMeetingAction,
  acceptMeetingAction,
  confirmArrivalAction,
  confirmCodHandshakeAction,
} from "@/app/actions/escrow";
import { payEscrowAction } from "@/app/actions/payment";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  AlertTriangle,
  UserCheck,
  Calendar,
  Navigation,
  Wallet,
  CreditCard,
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
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  const isBuyer = session.userId === room.buyer_id;
  const isSeller = session.userId === room.seller_id;
  const isMidman = session.userId === room.midman_id;
  const counterparty = isBuyer ? room.seller : room.buyer;
  const midman = room.midman;

  // Get listing from negotiation
  const listing = room.negotiation?.listing;
  
  // Get agreed prices
  const agreedPriceBtc = room.agreed_price_btc;
  const agreedPriceXmr = room.agreed_price_xmr;
  const cryptoType = room.crypto_type || 'BTC';
  
  // Calculate IDR from crypto
  const btcToIdr = 1400000000; // 1 BTC ≈ 1.4B IDR
  const xmrToIdr = 3500000; // 1 XMR ≈ 3.5M IDR
  
  const agreedPriceIdr = cryptoType === 'BTC' 
    ? Math.round((agreedPriceBtc || 0) * btcToIdr)
    : Math.round((agreedPriceXmr || 0) * xmrToIdr);

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

  // Handle propose meeting
  async function handleProposeMeeting(location: string, time: string) {
    const formData = new FormData();
    formData.append("roomId", room.id);
    formData.append("locationName", location);
    formData.append("areaNote", "Area publik");
    const [date, timeOnly] = time.split('T');
    formData.append("date", date);
    formData.append("time", timeOnly || time);
    
    const result = await proposeMeetingAction(formData);
    if (result.success) {
      customAlert.success("Usulan titik temu berhasil dikirim!");
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  // Handle accept meeting
  async function handleAcceptMeeting() {
    const result = await acceptMeetingAction(room.id);
    if (result.success) {
      customAlert.success("Titik temu disepakati!");
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  // Handle confirm arrival
  async function handleConfirmArrival() {
    customAlert.confirm(
      "Konfirmasi bahwa Anda sudah sampai di lokasi?",
      async () => {
        const result = await confirmArrivalAction(room.id);
        if (result.success) {
          customAlert.success("Kehadiran dikonfirmasi!");
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    );
  }

  // Handle COD handshake (buyer confirm received, seller confirm handed over)
  async function handleCodHandshake() {
    const confirmText = isBuyer 
      ? "Konfirmasi bahwa Anda SUDAH MENERIMA barang sesuai deskripsi?"
      : "Konfirmasi bahwa Anda SUDAH MENYERAHKAN barang kepada buyer?";
    
    customAlert.confirm(confirmText, async () => {
      const result = await confirmCodHandshakeAction(room.id);
      if (result.success) {
        if (result.bothConfirmed) {
          customAlert.success("🎉 Kedua pihak sudah konfirmasi! Menunggu Midman release dana...");
        } else {
          customAlert.success("Konfirmasi berhasil. Menunggu konfirmasi dari pihak lain...");
        }
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  }

  // Handle payment (Buyer only)
  async function handlePayment() {
    customAlert.confirm(
      `Bayar ${agreedPriceBtc?.toFixed(8) || 0} ${cryptoType} (≈ Rp ${agreedPriceIdr.toLocaleString("id-ID")})?`,
      async () => {
        const result = await payEscrowAction(room.id);
        if (result.success) {
          customAlert.success("✅ Pembayaran berhasil! Dana ditahan oleh sistem escrow.");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          customAlert.error(result.error || "Pembayaran gagal");
        }
      },
      "Konfirmasi Pembayaran"
    );
  }

  // Setup Supabase Realtime for instant message updates
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Function to fetch latest messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("escrow_messages")
        .select("*")
        .eq("escrow_id", room.id)
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
          filter: `escrow_id=eq.${room.id}`,
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

    // Subscribe to escrow_sessions changes (for cross-user updates)
    const escrowChannel = supabase
      .channel(`escrow_session:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "escrow_sessions",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          console.log("Escrow state changed:", payload);
          // Force reload when escrow data changes (meeting, payment, confirmation, etc)
          window.location.reload();
        }
      )
      .subscribe();

    // POLLING: Fetch messages every 2 seconds as fallback
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2000); // 2 seconds

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(escrowChannel);
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
        {/* 3-Party Escrow Info Banner */}
        <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 p-3 flex items-start gap-3">
          <ShieldCheck size={18} className="text-[#FFB800] flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="text-xs font-bold text-[#FFB800]">
              🔒 TRANSAKSI 3-PARTY ESCROW
            </div>
            <div className="text-[11px] text-[#aaa] leading-relaxed">
              Dana Anda <span className="text-white font-bold">DITAHAN dan DILEPASKAN oleh MIDMAN</span> setelah verifikasi. 
              Buyer dan Seller <span className="underline">tidak dapat langsung transfer</span> tanpa kontrol Midman.
            </div>
          </div>
        </div>

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
              <span>ESCROW COD ROOM #{room.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {room.item_title || listing?.title || "Produk"}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#888]">
              <span>
                {isBuyer ? "Seller" : "Buyer"}: <span className="text-[#39FF14] font-bold">{counterparty?.codename}</span>
              </span>
              <span>•</span>
              <span>
                Midman: <span className="text-[#FFB800] font-bold">{midman?.codename || "OWNER"}</span>
              </span>
              <span>•</span>
              <span className="text-white font-bold">
                Rp {agreedPriceIdr.toLocaleString("id-ID")}
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
              {listing?.images && listing.images[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={48} className="text-[#555]" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              {/* Original Listing Price */}
              <div className="pb-2 border-b border-[#222]">
                <div className="text-[#666] text-[10px] mb-1">Harga Listing (Original):</div>
                <div className="text-[#888] font-mono line-through">
                  Rp {(listing?.fiat_estimate_idr || 0).toLocaleString("id-ID")}
                </div>
              </div>

              {/* Final Agreed Price */}
              <div className="bg-[#39FF14]/5 border border-[#39FF14]/30 p-2 -mx-2">
                <div className="text-[#39FF14] text-[10px] mb-1 font-bold">✓ HARGA DISEPAKATI (FINAL):</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-white font-bold text-lg">
                    Rp {agreedPriceIdr.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-[#39FF14] font-mono font-bold mt-1">
                  {cryptoType === 'BTC' && agreedPriceBtc && agreedPriceBtc > 0 && (
                    <>{agreedPriceBtc.toFixed(8)} BTC</>
                  )}
                  {cryptoType === 'XMR' && agreedPriceXmr && agreedPriceXmr > 0 && (
                    <>{agreedPriceXmr.toFixed(4)} XMR</>
                  )}
                </div>
              </div>
              
              {/* Savings */}
              {listing?.fiat_estimate_idr && agreedPriceIdr < listing.fiat_estimate_idr && (
                <div className="text-[10px] text-[#FFB800]">
                  💰 Hemat: Rp {(listing.fiat_estimate_idr - agreedPriceIdr).toLocaleString("id-ID")}
                </div>
              )}
            </div>
          </div>

          {/* Meeting Info Card */}
          <div className="bg-[#121212] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <MapPin size={13} className="text-[#39FF14]" />
              <span>Titik Temu COD</span>
            </h3>

            {/* Meeting sudah disepakati */}
            {room.meeting_accepted && room.meeting_proposal && (
              <div className="space-y-2">
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-2">
                  <div className="text-xs font-bold text-[#39FF14] mb-1">✓ TITIK TEMU DISEPAKATI</div>
                </div>
                <div className="text-xs">
                  <div className="text-[#666] text-[10px] mb-0.5">Lokasi:</div>
                  <div className="text-white font-bold">{room.meeting_proposal.location_name}</div>
                </div>
                <div className="text-xs">
                  <div className="text-[#666] text-[10px] mb-0.5">Waktu:</div>
                  <div className="text-white font-mono">
                    {room.meeting_proposal.date} • {room.meeting_proposal.time}
                  </div>
                </div>
              </div>
            )}
            
            {/* Ada proposal, belum disepakati */}
            {room.meeting_proposal && !room.meeting_accepted && (
              <div className="space-y-2">
                <div className="bg-[#FFB800]/10 border border-[#FFB800]/50 p-2">
                  <div className="text-xs font-bold text-[#FFB800] mb-1">⏳ Menunggu Persetujuan</div>
                  <div className="text-[10px] text-[#888]">
                    Diusulkan oleh: {room.meeting_proposal.proposed_by}
                  </div>
                </div>
                <div className="text-xs">
                  <div className="text-[#666] text-[10px] mb-0.5">Lokasi Usulan:</div>
                  <div className="text-white font-bold">{room.meeting_proposal.location_name}</div>
                </div>
                <div className="text-xs">
                  <div className="text-[#666] text-[10px] mb-0.5">Waktu Usulan:</div>
                  <div className="text-white font-mono">
                    {room.meeting_proposal.date} • {room.meeting_proposal.time}
                  </div>
                </div>
                
                {/* Tombol untuk counterparty */}
                {room.meeting_proposal.proposed_by !== session.role && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleAcceptMeeting}
                      className="bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold"
                    >
                      ✓ Setuju
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Tolak usulan ini dan buat usulan baru?")) {
                          setShowMeetingForm(true);
                        }
                      }}
                      className="bg-[#FF4444]/20 hover:bg-[#FF4444]/30 border border-[#FF4444]/50 text-[#FF4444] py-2 text-xs font-bold"
                    >
                      ✗ Tolak & Usul Ulang
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Belum ada proposal sama sekali */}
            {!room.meeting_proposal && (
              <div className="space-y-2">
                {!showMeetingForm ? (
                  <>
                    <div className="text-xs text-[#666] italic mb-2">
                      Belum ada usulan titik temu. Tentukan lokasi dan waktu pertemuan COD.
                    </div>
                    <button
                      onClick={() => setShowMeetingForm(true)}
                      className="w-full bg-[#39FF14]/10 hover:bg-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14] py-2.5 text-xs font-bold"
                    >
                      📍 Usulkan Titik Temu
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-[#888] block mb-1">Lokasi:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Starbucks Grand Indonesia Lt.3"
                        value={meetingLocation}
                        onChange={(e) => setMeetingLocation(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#39FF14]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#888] block mb-1">Waktu:</label>
                      <input
                        type="datetime-local"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#39FF14]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (!meetingLocation.trim()) {
                            alert("Masukkan lokasi!");
                            return;
                          }
                          if (!meetingTime) {
                            alert("Pilih waktu pertemuan!");
                            return;
                          }
                          handleProposeMeeting(meetingLocation, meetingTime);
                          setShowMeetingForm(false);
                          setMeetingLocation("");
                          setMeetingTime("");
                        }}
                        className="bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold"
                      >
                        Kirim Usulan
                      </button>
                      <button
                        onClick={() => {
                          setShowMeetingForm(false);
                          setMeetingLocation("");
                          setMeetingTime("");
                        }}
                        className="bg-[#333] hover:bg-[#444] text-white py-2 text-xs font-bold"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Presence & Action Buttons */}
          <div className="bg-[#121212] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase tracking-wider font-bold">Status & Aksi</h3>
            
            {/* 3-Party Presence Indicators */}
            <div className="space-y-1.5 text-xs bg-[#0a0a0a] p-2 border border-[#222]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={12} className={room.buyer_arrived ? "text-[#39FF14]" : "text-[#666]"} />
                  <span className="text-[#aaa]">Buyer</span>
                </span>
                <span className={room.buyer_arrived ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {room.buyer_arrived ? "✓ Hadir" : "Belum hadir"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck size={12} className={room.seller_arrived ? "text-[#39FF14]" : "text-[#666]"} />
                  <span className="text-[#aaa]">Seller</span>
                </span>
                <span className={room.seller_arrived ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {room.seller_arrived ? "✓ Hadir" : "Belum hadir"}
                </span>
              </div>

              <div className="border-t border-[#333] pt-1.5 mt-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-[#FFB800]" />
                    <span className="text-[#FFB800] font-bold">Midman</span>
                  </span>
                  <span className="text-[#FFB800] font-bold text-[10px]">
                    {room.funds_held ? "💰 DANA DITAHAN" : "⏳ Mengawasi"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Payment Button (Buyer only, if payment not received yet) */}
              {isBuyer && room.payment_status === 'AWAITING_PAYMENT' && (
                <button
                  onClick={handlePayment}
                  className="w-full bg-[#39FF14] hover:bg-[#2ECC11] text-black py-3 text-sm font-bold flex items-center justify-center gap-2 animate-pulse"
                >
                  <Wallet size={16} />
                  <span>Bayar Sekarang ({agreedPriceBtc?.toFixed(8) || 0} {cryptoType})</span>
                </button>
              )}

              {/* Payment Status Info */}
              {room.payment_status === 'RECEIVED' && !room.funds_held && (
                <div className="bg-[#FFB800]/10 border border-[#FFB800]/50 p-2 text-center">
                  <div className="text-xs font-bold text-[#FFB800]">
                    💰 Dana Diterima - Menunggu Midman Hold
                  </div>
                </div>
              )}

              {room.funds_held && !room.funds_released && (
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-2 text-center">
                  <div className="text-xs font-bold text-[#39FF14]">
                    🔒 Dana Ditahan Midman - Aman untuk COD
                  </div>
                </div>
              )}

              {/* Confirm Arrival Button */}
              {room.meeting_accepted && !(isBuyer ? room.buyer_arrived : room.seller_arrived) && (
                <button
                  onClick={handleConfirmArrival}
                  className="w-full bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Navigation size={14} />
                  <span>Saya Sudah Sampai</span>
                </button>
              )}

              {/* COD Handshake Button (only when both arrived & funds held) */}
              {room.buyer_arrived && room.seller_arrived && room.funds_held && (
                <>
                  {!(isBuyer ? room.buyer_confirmed : room.seller_confirmed) ? (
                    <button
                      onClick={handleCodHandshake}
                      className="w-full bg-[#FF6600] hover:bg-[#FF8800] text-white py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      <span>{isBuyer ? "Konfirmasi Terima Barang" : "Konfirmasi Serahkan Barang"}</span>
                    </button>
                  ) : (
                    <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-2 text-center">
                      <div className="text-xs font-bold text-[#39FF14]">
                        ✓ Anda sudah konfirmasi
                      </div>
                      <div className="text-[10px] text-[#888] mt-1">
                        {room.buyer_confirmed && room.seller_confirmed 
                          ? "Menunggu Midman release dana..."
                          : "Menunggu pihak lain..."}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Warning if not paid yet */}
              {room.payment_status === 'AWAITING_PAYMENT' && !isBuyer && (
                <div className="bg-[#FF4444]/10 border border-[#FF4444]/50 p-2 text-center">
                  <div className="text-xs text-[#FF4444]">
                    ⏳ Menunggu Buyer melakukan pembayaran
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-2">
          <div className="bg-[#121212] border border-[#262626] h-[600px] flex flex-col">
            <div className="border-b border-[#222] px-4 py-3 bg-[#0f0f0f]">
              <h3 className="text-xs font-mono text-white uppercase tracking-wider font-bold flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#39FF14]" />
                <span>Chat Koordinasi COD (3-Party Escrow)</span>
              </h3>
              <p className="text-[10px] font-mono text-[#666] mt-0.5">
                Buyer, Seller, dan Midman berkoordinasi. Dana ditahan dan dilepaskan oleh Midman setelah verifikasi.
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
