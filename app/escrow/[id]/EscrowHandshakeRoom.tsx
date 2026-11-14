"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import type { EscrowRoomWithDetails, EscrowChatMessage } from "@/lib/types";
import { formatBtc, formatXmr, formatDateTime } from "@/lib/format";
import {
  proposeMeetingAction,
  acceptMeetingAction,
  confirmArrivalAction,
  confirmCodHandshakeAction,
  fileDisputeAction,
  sendEscrowMessageAction,
} from "@/app/actions/escrow";
import { joinEscrowChannel } from "@/lib/supabaseClient";
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  Lock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Package,
  Calendar,
  Send,
  Radio,
  UserCheck,
  Check,
  XCircle,
  HelpCircle,
} from "lucide-react";

export function EscrowHandshakeRoom({
  room: initialRoom,
  order: legacyOrder,
  session,
  isAuthorized = true,
}: {
  room?: EscrowRoomWithDetails;
  order?: any;
  session: any;
  isAuthorized?: boolean;
}) {
  const currentRoom = initialRoom || legacyOrder;
  const [room, setRoom] = useState<EscrowRoomWithDetails>(currentRoom);
  const [messages, setMessages] = useState<EscrowChatMessage[]>(currentRoom.messages || []);
  const [chatInput, setChatInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // Presence state
  const [presences, setPresences] = useState<any[]>([]);
  const [connStatus, setConnStatus] = useState<"CONNECTING" | "ONLINE" | "RECONNECTING">("CONNECTING");

  // Meeting proposal form state
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [propLocation, setPropLocation] = useState(
    room.meetingProposal?.locationName || `${room.listing?.locationDistrict || "Area Publik"} (Mall / Cafe / Minimarket)`
  );
  const [propNote, setPropNote] = useState(room.meetingProposal?.areaNote || "Dekat pintu masuk utama");
  const [propDate, setPropDate] = useState("2026-11-15");
  const [propTime, setPropTime] = useState("16:00");

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("Lawan transaksi tidak hadir di titik temu");
  const [disputeNote, setDisputeNote] = useState("");

  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "warn" | "error"; text: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const isBuyer = session?.userId === room.buyerId || session?.role === "BUYER";
  const isSeller = session?.userId === room.sellerId || session?.role === "SELLER";
  const isOwner = session?.role === "OWNER";
  const myRole = isSeller ? "SELLER" : isBuyer ? "BUYER" : "OWNER";

  // Check online presence
  const isBuyerOnline = presences.some((p) => p.role === "BUYER");
  const isSellerOnline = presences.some((p) => p.role === "SELLER");

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect to Supabase Realtime Channel
  useEffect(() => {
    if (!isAuthorized) return;

    const { channel, unsubscribe } = joinEscrowChannel(
      room.id,
      {
        userId: session?.userId || "anon",
        codename: session?.name || `Anonymous ${myRole}`,
        role: myRole,
      },
      (event, payload) => {
        if (event === "chat_message") {
          setMessages((prev) => [...prev, payload]);
        } else if (event === "meeting_proposed") {
          setRoom((prev) => ({
            ...prev,
            meetingStatus: "MEETING_PROPOSED",
            meetingProposal: payload.proposal,
          }));
          setMessages((prev) => [...prev, payload.message]);
          setAlertMsg({ type: "warn", text: "Titik temu baru diusulkan oleh lawan transaksi!" });
        } else if (event === "meeting_confirmed") {
          setRoom((prev) => ({
            ...prev,
            meetingStatus: "MEETING_CONFIRMED",
            meetingConfirmed: payload.confirmed,
          }));
          setMessages((prev) => [...prev, payload.message]);
          setAlertMsg({ type: "success", text: "Titik temu dan jadwal resmi disepakati!" });
        } else if (event === "arrival_update") {
          setRoom((prev) => ({
            ...prev,
            buyerArrived: payload.buyerArrived ?? prev.buyerArrived,
            sellerArrived: payload.sellerArrived ?? prev.sellerArrived,
            meetingStatus: payload.meetingStatus ?? prev.meetingStatus,
          }));
          setMessages((prev) => [...prev, payload.message]);
        } else if (event === "cod_confirmed") {
          setRoom((prev) => ({
            ...prev,
            buyerConfirmedReceived: payload.buyerConfirmed ?? prev.buyerConfirmedReceived,
            sellerConfirmedHandedOver: payload.sellerConfirmed ?? prev.sellerConfirmedHandedOver,
            meetingStatus: payload.bothConfirmed ? "COMPLETED" : prev.meetingStatus,
          }));
          setMessages((prev) => [...prev, payload.message]);
          if (payload.bothConfirmed) {
            setAlertMsg({ type: "success", text: "DUAL CONFIRMATION SUKSES! Transaksi resmi selesai!" });
          }
        } else if (event === "dispute_filed") {
          setRoom((prev) => ({
            ...prev,
            meetingStatus: "DISPUTED",
            dispute: payload.dispute,
          }));
          setMessages((prev) => [...prev, payload.message]);
          setAlertMsg({ type: "error", text: "Sengketa (Dispute) diajukan. Sistem Owner diberitahu." });
        }
      },
      (presenceList) => {
        setPresences(presenceList);
        setConnStatus("ONLINE");
      }
    );

    channelRef.current = channel;

    return () => {
      unsubscribe();
    };
  }, [room.id, isAuthorized, myRole, session]);

  if (!isAuthorized) {
    return (
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-16 text-center space-y-4">
        <XCircle size={48} className="mx-auto text-red-500" />
        <h2 className="text-xl font-bold text-white">AKSES DITOLAK</h2>
        <p className="text-sm text-[#888]">
          Anda tidak terdaftar sebagai Pembeli atau Penjual di dalam transaksi ini. Titik temu dan komunikasi serah terima bersifat rahasia.
        </p>
        <Link href="/marketplace" className="btn-primary text-xs font-bold px-4 py-2 inline-block">
          Kembali ke Marketplace
        </Link>
      </div>
    );
  }

  // Handle Propose Meeting
  async function handleProposeMeeting(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("roomId", room.id);
    fd.append("locationName", propLocation);
    fd.append("areaNote", propNote);
    fd.append("date", propDate);
    fd.append("time", propTime);

    startTransition(async () => {
      const res = await proposeMeetingAction(fd);
      if (res.success && res.room) {
        setShowProposeModal(false);
        setRoom(res.room);
        const latestMsg = res.room.messages[res.room.messages.length - 1];
        setMessages(res.room.messages);

        channelRef.current?.send({
          type: "broadcast",
          event: "meeting_proposed",
          payload: {
            proposal: res.room.meetingProposal,
            message: latestMsg,
          },
        });
      }
    });
  }

  // Handle Accept Meeting
  async function handleAcceptMeeting() {
    startTransition(async () => {
      const res = await acceptMeetingAction(room.id);
      if (res.success && res.room) {
        setRoom(res.room);
        const latestMsg = res.room.messages[res.room.messages.length - 1];
        setMessages(res.room.messages);

        channelRef.current?.send({
          type: "broadcast",
          event: "meeting_confirmed",
          payload: {
            confirmed: res.room.meetingConfirmed,
            message: latestMsg,
          },
        });
      }
    });
  }

  // Handle Arrival ("I'm here")
  async function handleArrival() {
    startTransition(async () => {
      const res = await confirmArrivalAction(room.id);
      if (res.success && res.room) {
        setRoom(res.room);
        const latestMsg = res.room.messages[res.room.messages.length - 1];
        setMessages(res.room.messages);

        channelRef.current?.send({
          type: "broadcast",
          event: "arrival_update",
          payload: {
            buyerArrived: res.room.buyerArrived,
            sellerArrived: res.room.sellerArrived,
            meetingStatus: res.room.meetingStatus,
            message: latestMsg,
          },
        });
      }
    });
  }

  // Handle COD Double Confirmation
  async function handleCodConfirmation() {
    const actionText = isBuyer
      ? "Konfirmasi bahwa barang fisik telah Anda terima dan diperiksa dengan baik?"
      : "Konfirmasi bahwa barang fisik telah Anda serahkan dan pembayaran telah diterima?";
    if (!confirm(actionText)) return;

    startTransition(async () => {
      const res = await confirmCodHandshakeAction(room.id);
      if (res.success && res.room) {
        setRoom(res.room);
        const latestMsg = res.room.messages[res.room.messages.length - 1];
        setMessages(res.room.messages);

        channelRef.current?.send({
          type: "broadcast",
          event: "cod_confirmed",
          payload: {
            buyerConfirmed: res.room.buyerConfirmedReceived,
            sellerConfirmed: res.room.sellerConfirmedHandedOver,
            bothConfirmed: res.bothConfirmed,
            message: latestMsg,
          },
        });
      }
    });
  }

  // Handle Dispute
  async function handleFileDispute(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("roomId", room.id);
    fd.append("reason", disputeReason);
    fd.append("description", disputeNote);

    startTransition(async () => {
      const res = await fileDisputeAction(fd);
      if (res.success && res.room) {
        setShowDisputeModal(false);
        setRoom(res.room);
        const latestMsg = res.room.messages[res.room.messages.length - 1];
        setMessages(res.room.messages);

        channelRef.current?.send({
          type: "broadcast",
          event: "dispute_filed",
          payload: {
            dispute: res.room.dispute,
            message: latestMsg,
          },
        });
      }
    });
  }

  // Send Chat Message
  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput("");

    const fd = new FormData();
    fd.append("roomId", room.id);
    fd.append("content", text);

    const res = await sendEscrowMessageAction(fd);
    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message]);
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_message",
        payload: res.message,
      });
    }
  }

  const isCompleted = room.meetingStatus === "COMPLETED";
  const isDisputed = room.meetingStatus === "DISPUTED";
  const bothArrived = room.buyerArrived && room.sellerArrived;
  const hasImage = room.listing?.images && room.listing.images.length > 0;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Marketplace
        </Link>

        {/* Realtime Connection Status */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
          <span className="text-[#aaa]">Realtime WebSocket:</span>
          <span className="text-[#39FF14] font-bold">{connStatus}</span>
        </div>
      </div>

      {/* Alert banner */}
      {alertMsg && (
        <div
          className={`p-4 text-xs font-mono border flex items-center justify-between gap-3 fade-up ${
            alertMsg.type === "success"
              ? "bg-[#39FF14]/10 border-[#39FF14]/50 text-[#39FF14]"
              : alertMsg.type === "warn"
              ? "bg-[#FFB800]/10 border-[#FFB800]/50 text-[#FFB800]"
              : "bg-red-950/40 border-red-500/50 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-[#888] hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Room Header Box */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#39FF14] uppercase tracking-widest font-bold flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>ESCROW ROOM — IN-PERSON COD PROTOCOL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Ruang Serah Terima &amp; Verifikasi Fisik
            </h1>
            <p className="text-xs font-mono text-[#888] mt-1">
              Room ID: <span className="text-[#39FF14] font-bold">{room.id}</span> • Nilai Transaksi:{" "}
              <span className="text-white font-bold">
                Rp {room.finalPriceIdr.toLocaleString("id-ID")}
              </span>{" "}
              ({formatXmr(room.cryptoAmount)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCompleted ? (
              <span className="badge-green text-xs font-bold py-2 px-3.5 flex items-center gap-2">
                <CheckCircle2 size={15} /> TRANSAKSI SELESAI
              </span>
            ) : isDisputed ? (
              <span className="badge-danger text-xs font-bold py-2 px-3.5 flex items-center gap-2">
                <AlertTriangle size={15} /> SENGKETA AKTIF (DISPUTE)
              </span>
            ) : (
              <span className="badge-warn text-xs font-bold py-2 px-3.5 flex items-center gap-2 animate-pulse">
                <Clock size={15} /> DALAM PROSES KOORDINASI COD
              </span>
            )}

            {!isCompleted && !isDisputed && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-3 py-2 bg-[#222] hover:bg-red-950/60 border border-[#333] hover:border-red-500/50 text-xs font-mono text-[#888] hover:text-red-300 transition-colors cursor-pointer"
              >
                Laporkan Masalah (Dispute)
              </button>
            )}
          </div>
        </div>

        {/* Handshake Cross-Device Presence Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#222]">
          <div
            className={`p-3 border flex items-center justify-between text-xs font-mono ${
              isBuyerOnline || room.buyerConnected
                ? "bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]"
                : "bg-[#181818] border-[#333] text-[#888]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBuyerOnline || room.buyerConnected ? "bg-[#39FF14] pulse-green" : "bg-[#555]"
                }`}
              />
              <span className="font-bold">Pembeli (Buyer): {room.buyer.codename}</span>
            </div>
            <span className="text-[10px]">
              {isBuyerOnline || room.buyerConnected ? "CONNECTED" : "WAITING"}
            </span>
          </div>

          <div
            className={`p-3 border flex items-center justify-between text-xs font-mono ${
              isSellerOnline || room.sellerConnected
                ? "bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]"
                : "bg-[#181818] border-[#333] text-[#888]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSellerOnline || room.sellerConnected ? "bg-[#39FF14] pulse-green" : "bg-[#555]"
                }`}
              />
              <span className="font-bold">Penjual (Seller): {room.seller.codename}</span>
            </div>
            <span className="text-[10px]">
              {isSellerOnline || room.sellerConnected ? "CONNECTED" : "WAITING"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Steps & Actions on Left, Realtime Room Chat on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 4-Step Handshake & Verification Pipeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Meeting Point & Time Section */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-xs font-mono font-bold text-[#39FF14]">
                  1
                </span>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Titik Temu &amp; Waktu Pertemuan (Meeting Point)
                </h3>
              </div>

              {room.meetingStatus === "MEETING_CONFIRMED" || isCompleted ? (
                <span className="text-[11px] font-mono text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5 font-bold flex items-center gap-1">
                  <Check size={12} /> DISEPAKATI
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/30 px-2 py-0.5">
                  BELUM DISEPAKATI
                </span>
              )}
            </div>

            {/* Display Confirmed or Proposed Meeting */}
            {room.meetingConfirmed ? (
              <div className="p-4 bg-[#181818] border border-[#333] space-y-2 text-xs font-mono">
                <div className="text-[#39FF14] font-bold flex items-center gap-2">
                  <MapPin size={15} />
                  <span>{room.meetingConfirmed.locationName}</span>
                </div>
                <div className="text-[#ccc] pl-6">{room.meetingConfirmed.areaNote}</div>
                <div className="text-[#888] pl-6 flex items-center gap-2 pt-1 border-t border-[#252525]">
                  <Calendar size={13} className="text-[#39FF14]" />
                  <span>Waktu: {room.meetingConfirmed.dateTime}</span>
                </div>
              </div>
            ) : room.meetingProposal ? (
              <div className="p-4 bg-[#181818] border border-[#FFB800]/40 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#888] uppercase">
                    Diusulkan oleh: {room.meetingProposal.proposedBy === "BUYER" ? "Pembeli" : "Penjual"}
                  </span>
                  <span className="text-[10px] text-[#FFB800] font-bold">MENUNGGU PERSETUJUAN</span>
                </div>
                <div className="text-white font-bold flex items-center gap-2">
                  <MapPin size={15} className="text-[#FFB800]" />
                  <span>{room.meetingProposal.locationName}</span>
                </div>
                <div className="text-[#aaa] pl-6">{room.meetingProposal.areaNote}</div>
                <div className="text-[#888] pl-6 flex items-center gap-2">
                  <Calendar size={13} className="text-[#FFB800]" />
                  <span>
                    Jadwal: {room.meetingProposal.proposedDate} jam {room.meetingProposal.proposedTime} WIB
                  </span>
                </div>

                {/* Actions for counterparty */}
                {room.meetingProposal.proposedBy !== myRole && !isCompleted && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleAcceptMeeting}
                      disabled={isPending}
                      className="btn-primary text-xs font-bold px-4 py-2 flex-1"
                    >
                      ✓ Terima Titik Temu &amp; Waktu Ini
                    </button>
                    <button
                      onClick={() => setShowProposeModal(true)}
                      className="btn-secondary text-xs px-3 py-2 font-mono"
                    >
                      Usulkan Lain
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#161616] border border-[#262626] text-center space-y-3">
                <p className="text-xs text-[#888] font-mono">
                  Belum ada titik temu yang diusulkan. Pilih lokasi publik yang aman (Mall, Cafe, Minimarket).
                </p>
                {!isCompleted && (
                  <button
                    onClick={() => setShowProposeModal(true)}
                    className="btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <MapPin size={14} />
                    <span>Usulkan Titik Temu &amp; Waktu</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Arrival Status ("I'm here") */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-xs font-mono font-bold text-[#39FF14]">
                  2
                </span>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Kehadiran di Titik Temu (Arrival Status)
                </h3>
              </div>

              {bothArrived ? (
                <span className="text-[11px] font-mono text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 px-2 py-0.5 font-bold flex items-center gap-1">
                  <Check size={12} /> KEDUANYA SUDAH HADIR
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[#888] bg-[#181818] border border-[#333] px-2 py-0.5">
                  MENUNGGU KEDATANGAN
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-3 border text-xs font-mono ${
                  room.buyerArrived
                    ? "bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]"
                    : "bg-[#161616] border-[#292929] text-[#777]"
                }`}
              >
                <div className="font-bold">Pembeli (Buyer)</div>
                <div className="text-[10px] mt-1">
                  {room.buyerArrived ? "✓ Sudah di lokasi titik temu" : "Menuju lokasi"}
                </div>
              </div>

              <div
                className={`p-3 border text-xs font-mono ${
                  room.sellerArrived
                    ? "bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]"
                    : "bg-[#161616] border-[#292929] text-[#777]"
                }`}
              >
                <div className="font-bold">Penjual (Seller)</div>
                <div className="text-[10px] mt-1">
                  {room.sellerArrived ? "✓ Sudah di lokasi titik temu" : "Menuju lokasi"}
                </div>
              </div>
            </div>

            {/* Arrival action button */}
            {!isCompleted && (
              <div>
                {(isBuyer && !room.buyerArrived) || (isSeller && !room.sellerArrived) ? (
                  <button
                    onClick={handleArrival}
                    disabled={isPending}
                    className="w-full py-3 bg-[#1d1d1d] hover:bg-[#252525] border border-[#39FF14] text-[#39FF14] text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_10px_rgba(57,255,20,0.15)]"
                  >
                    <MapPin size={15} />
                    <span>Saya Sudah Sampai di Lokasi Pertemuan ("I'm Here")</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-mono text-[#39FF14] flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>Anda telah mengonfirmasi kehadiran di lokasi.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: In-Person COD & Double Confirmation */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-xs font-mono font-bold text-[#39FF14]">
                  3
                </span>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Verifikasi Fisik &amp; Double Confirmation (COD)
                </h3>
              </div>

              {isCompleted ? (
                <span className="badge-green text-xs font-bold py-1 px-3">SUKSES</span>
              ) : (
                <span className="badge-warn text-xs font-bold py-1 px-3">PENDING</span>
              )}
            </div>

            <p className="text-xs text-[#888] font-mono leading-relaxed">
              Lakukan pemeriksaan fisik barang bersama-sama di lokasi. Setelah barang dicek dan uang diserahkan, <strong>kedua belah pihak wajib menekan tombol konfirmasi masing-masing</strong> untuk menyelesaikan transaksi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Confirmation Card */}
              <div
                className={`p-4 border space-y-3 ${
                  room.buyerConfirmedReceived
                    ? "bg-[#39FF14]/10 border-[#39FF14]/60"
                    : "bg-[#161616] border-[#292929]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">Konfirmasi Pembeli</span>
                  {room.buyerConfirmedReceived ? (
                    <span className="text-[#39FF14] font-bold">✓ DITERIMA</span>
                  ) : (
                    <span className="text-[#666]">MENUNGGU</span>
                  )}
                </div>
                <p className="text-[11px] text-[#777] font-mono">
                  Buyer menyatakan barang telah diperiksa dan diterima sesuai kesepakatan.
                </p>

                {isBuyer && !room.buyerConfirmedReceived && !isCompleted && (
                  <button
                    onClick={handleCodConfirmation}
                    disabled={isPending}
                    className="btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    CONFIRM RECEIVED
                  </button>
                )}
              </div>

              {/* Seller Confirmation Card */}
              <div
                className={`p-4 border space-y-3 ${
                  room.sellerConfirmedHandedOver
                    ? "bg-[#39FF14]/10 border-[#39FF14]/60"
                    : "bg-[#161616] border-[#292929]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">Konfirmasi Penjual</span>
                  {room.sellerConfirmedHandedOver ? (
                    <span className="text-[#39FF14] font-bold">✓ DISERAHKAN</span>
                  ) : (
                    <span className="text-[#666]">MENUNGGU</span>
                  )}
                </div>
                <p className="text-[11px] text-[#777] font-mono">
                  Seller menyatakan barang telah diserahkan dan uang pembayaran diterima.
                </p>

                {isSeller && !room.sellerConfirmedHandedOver && !isCompleted && (
                  <button
                    onClick={handleCodConfirmation}
                    disabled={isPending}
                    className="btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    CONFIRM HANDED OVER
                  </button>
                )}
              </div>
            </div>

            {/* Waiting for other status */}
            {!isCompleted && (room.buyerConfirmedReceived || room.sellerConfirmedHandedOver) && (
              <div className="p-3 bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs font-mono text-[#FFB800] flex items-center gap-2">
                <Clock size={15} className="shrink-0" />
                <span>
                  Konfirmasi Anda sudah tercatat! Status: <strong>WAITING_FOR_OTHER_CONFIRMATION</strong>. Menunggu pihak lawan menekan tombol konfirmasi.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Realtime Room Chat & Item Reference */}
        <div className="lg:col-span-5 space-y-6">
          {/* Item Reference Mini Card */}
          <div className="bg-[#121212] border border-[#2a2a2a] p-4 flex items-center gap-4">
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
              <div className="text-[10px] font-mono text-[#888] uppercase">Barang Transaksi</div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{room.listing.title}</h4>
              <div className="text-xs font-mono text-[#39FF14] font-bold">
                Rp {room.finalPriceIdr.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Realtime Chat Pane */}
          <div className="bg-[#121212] border border-[#2a2a2a] flex flex-col h-[520px]">
            <div className="p-3.5 border-b border-[#222] bg-[#161616] flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#39FF14]" />
                <span>Chat Koordinasi Titik Temu</span>
              </div>
              <span className="text-[10px] font-mono text-[#666]">End-to-End P2P</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {messages.map((m) => {
                const isMe = m.senderId === session?.userId || m.senderRole === myRole;
                const isSys = m.senderRole === "SYSTEM";

                if (isSys) {
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 bg-[#181818] border border-[#333] text-center text-[#39FF14] text-[10px]"
                    >
                      {m.content}
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 ${
                        isMe
                          ? "bg-[#1e1e1e] border border-[#39FF14]/40 text-white"
                          : "bg-[#151515] border border-[#2d2d2d] text-[#ccc]"
                      }`}
                    >
                      <div className="text-[9px] text-[#777] mb-1">
                        {isMe ? "Kamu" : m.senderRole}
                      </div>
                      <div className="text-xs whitespace-pre-wrap font-sans">{m.content}</div>
                      <div className="text-[9px] text-[#555] text-right mt-1">
                        {new Date(m.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Form */}
            {!isCompleted && (
              <form onSubmit={handleSendChat} className="p-3 border-t border-[#222] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Kirim pesan koordinasi..."
                  className="input-dark flex-1 px-3 py-2 text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="btn-primary px-3 py-2 text-xs font-bold"
                >
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Propose Meeting Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333] max-w-md w-full p-6 space-y-5 shadow-2xl fade-up">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <MapPin size={16} className="text-[#39FF14]" />
                <span>Usulkan Titik Temu &amp; Waktu</span>
              </h3>
              <button
                onClick={() => setShowProposeModal(false)}
                className="text-[#888] hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeMeeting} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">
                  Nama Tempat Publik
                </label>
                <input
                  type="text"
                  value={propLocation}
                  onChange={(e) => setPropLocation(e.target.value)}
                  placeholder="Contoh: Grand Indonesia / Ciwalk / Cafe Sebelah Stasiun"
                  className="input-dark w-full py-2.5 px-3 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">
                  Detail Patokan Tempat
                </label>
                <input
                  type="text"
                  value={propNote}
                  onChange={(e) => setPropNote(e.target.value)}
                  placeholder="Contoh: Dekat kasir Starbucks lantai dasar"
                  className="input-dark w-full py-2.5 px-3 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#888] block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={propDate}
                    onChange={(e) => setPropDate(e.target.value)}
                    className="input-dark w-full py-2 px-3 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#888] block mb-1">Jam (WIB)</label>
                  <input
                    type="time"
                    value={propTime}
                    onChange={(e) => setPropTime(e.target.value)}
                    className="input-dark w-full py-2 px-3 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary flex-1 py-2 text-xs font-bold"
                >
                  Kirim Usulan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-red-500/50 max-w-md w-full p-6 space-y-4 shadow-2xl fade-up">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-sm font-bold text-red-400 font-mono flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Laporkan Sengketa / Kendala Transaksi</span>
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-[#888] hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileDispute} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">Alasan Kendala</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="input-dark w-full py-2 px-3 text-xs font-mono"
                >
                  <option value="Lawan transaksi tidak hadir di titik temu">
                    Lawan transaksi tidak hadir di titik temu
                  </option>
                  <option value="Kondisi fisik barang tidak sesuai deskripsi">
                    Kondisi fisik barang tidak sesuai deskripsi
                  </option>
                  <option value="Ketidaksesuaian nominal pembayaran">
                    Ketidaksesuaian nominal pembayaran
                  </option>
                  <option value="Membatalkan kesepakatan secara sepihak">
                    Membatalkan kesepakatan secara sepihak
                  </option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#888] block mb-1">
                  Penjelasan Tambahan
                </label>
                <textarea
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  rows={3}
                  className="input-dark w-full p-2.5 text-xs font-mono"
                  placeholder="Ceritakan kejadian di lokasi..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex-1 cursor-pointer"
                >
                  Ajukan Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
