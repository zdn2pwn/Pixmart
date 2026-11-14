"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NegotiationWithDetails, NegotiationMessage } from "@/lib/types";
import {
  counterOfferAction,
  acceptOfferAction,
  rejectOfferAction,
  sendNegotiationMessageAction,
} from "@/app/actions/negotiation";
import { joinNegotiationChannel } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Zap,
  Send,
  Loader2,
  Lock,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  Flame,
  Shield,
} from "lucide-react";

function EphemeralMessageBubble({
  message,
  isMe,
  counterpartyName,
  currentOfferPrice,
}: {
  message: NegotiationMessage;
  isMe: boolean;
  counterpartyName: string;
  currentOfferPrice: number;
}) {
  const isSystem = message.senderRole === "SYSTEM" || message.messageType === "DEAL_LOCKED";

  // Calculate self-destruct duration based on sentence & text length (min 6s, max 35s)
  const textLength = message.content ? message.content.length : 12;
  const initialDuration = Math.max(6, Math.min(35, Math.ceil(4 + textLength * 0.08)));

  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [burnState, setBurnState] = useState<"ACTIVE" | "DISSOLVING" | "DESTROYED">("ACTIVE");

  useEffect(() => {
    if (isSystem) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBurnState("DISSOLVING");
          setTimeout(() => {
            setBurnState("DESTROYED");
          }, 1100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSystem]);

  if (isSystem) {
    return (
      <div className="bg-[#181818] border border-[#333] p-3 text-center text-[#39FF14] text-[11px] max-w-xl mx-auto shadow-sm">
        <div className="font-bold flex items-center justify-center gap-1.5">
          <Lock size={12} />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const isOffer = message.messageType === "OFFER" || message.messageType === "COUNTER_OFFER";
  const progressPercent = Math.max(0, (timeLeft / initialDuration) * 100);

  if (burnState === "DESTROYED") {
    return (
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} my-1.5`}>
        <div className="px-3 py-1.5 border border-[#222] bg-[#0c0c0c] text-[10px] font-mono text-[#555] flex items-center gap-2 pixel-burned-placeholder">
          <Flame size={11} className="text-[#333]" />
          <span>
            {isOffer
              ? `[PENAWARAN RP ${Number(message.amount || currentOfferPrice).toLocaleString("id-ID")} • CATATAN HANCUR // BURNED]`
              : "[PESAN TERHAPUS OTOMATIS // EPHEMERAL BURN]"}
          </span>
          <span className="text-[#333]">
            {new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} my-2 transition-all ${burnState === "DISSOLVING" ? "pixel-dissolving" : ""}`}>
      <div
        className={`max-w-md p-3.5 relative border ${
          isOffer
            ? isMe
              ? "bg-[#161616] border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.1)]"
              : "bg-[#141414] border-[#FFB800]/50 shadow-[0_0_15px_rgba(255,184,0,0.1)]"
            : isMe
            ? "bg-[#1a1a1a] border-[#333] text-white"
            : "bg-[#121212] border-[#252525] text-[#ccc]"
        }`}
      >
        {/* Top Burn HUD */}
        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-[#222]">
          <span className="text-[10px] font-mono text-[#777]">
            {isMe ? "Kamu" : counterpartyName}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <Flame size={11} className={timeLeft <= 3 ? "text-red-500 animate-pulse" : "text-[#FF6600]"} />
            <span className={timeLeft <= 3 ? "text-red-400 font-bold" : "text-[#888]"}>
              DESTROY IN: <strong className="text-white">{String(timeLeft).padStart(2, "0")}s</strong>
            </span>
          </div>
        </div>

        {/* Depleting progress bar */}
        <div className="h-0.5 w-full bg-[#222] mb-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${timeLeft <= 3 ? "bg-red-500" : "bg-[#39FF14]"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Offer Amount if Offer */}
        {isOffer && (
          <div className="mb-2">
            <div className="text-[9px] font-mono uppercase text-[#777]">
              {message.messageType === "COUNTER_OFFER" ? "Counter-Offer Baru" : "Penawaran Harga"}
            </div>
            <div className="text-lg font-bold text-[#39FF14] font-mono">
              Rp {Number(message.amount || currentOfferPrice).toLocaleString("id-ID")}
            </div>
          </div>
        )}

        {/* Content */}
        {message.content && (
          <p className="text-xs font-sans text-white/90 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        <div className="text-[9px] font-mono text-[#555] text-right mt-1.5">
          {new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export function NegotiationRoomView({
  initialNegotiation,
  session,
}: {
  initialNegotiation: NegotiationWithDetails;
  session: any;
}) {
  const router = useRouter();
  const [negotiation, setNegotiation] = useState<NegotiationWithDetails>(initialNegotiation);
  const [messages, setMessages] = useState<NegotiationMessage[]>(initialNegotiation.messages || []);
  const [inputText, setInputText] = useState("");
  const [isPending, startTransition] = useTransition();

  // Counter offer state
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState<number>(negotiation.currentOfferPrice);
  const [counterNote, setCounterNote] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const isBuyer = session?.userId === negotiation.buyerId;
  const isSeller = session?.userId === negotiation.sellerId;
  const myRole = isSeller ? "SELLER" : "BUYER";
  const counterpartyName = isBuyer ? negotiation.seller.codename : negotiation.buyer.codename;
  const isDealAgreed = negotiation.status === "DEAL_AGREED";

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect to Supabase Realtime channel
  useEffect(() => {
    const { channel, broadcast, unsubscribe } = joinNegotiationChannel(
      negotiation.id,
      (event, payload) => {
        if (event === "new_message") {
          setMessages((prev) => [...prev, payload]);
        } else if (event === "counter_offer") {
          setNegotiation((prev) => ({
            ...prev,
            currentOfferPrice: payload.newPrice,
            status: "COUNTER_OFFERED",
            lastOfferBy: payload.byRole,
          }));
          setMessages((prev) => [...prev, payload.message]);
        } else if (event === "deal_agreed") {
          setNegotiation((prev) => ({
            ...prev,
            status: "DEAL_AGREED",
            escrowRoomId: payload.escrowRoomId,
          }));
          setMessages((prev) => [...prev, payload.message]);
          // Redirect to escrow room
          if (payload.escrowRoomId) {
            setTimeout(() => {
              router.push(`/escrow/${payload.escrowRoomId}`);
            }, 1200);
          }
        }
      }
    );

    channelRef.current = { channel, broadcast };
    return () => {
      unsubscribe();
    };
  }, [negotiation.id, router]);

  // Send regular text message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    const fd = new FormData();
    fd.append("negotiationId", negotiation.id);
    fd.append("content", text);

    const res = await sendNegotiationMessageAction(fd);
    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message]);
      channelRef.current?.broadcast("new_message", res.message);
    }
  }

  // Submit counter offer
  async function handleCounterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!counterPrice || counterPrice <= 0) return;

    const fd = new FormData();
    fd.append("negotiationId", negotiation.id);
    fd.append("counterPriceIdr", String(counterPrice));
    fd.append("messageText", counterNote);

    startTransition(async () => {
      const res = await counterOfferAction(fd);
      if (res.success && res.negotiation) {
        setShowCounter(false);
        setNegotiation(res.negotiation);
        const latestMsg = res.negotiation.messages[res.negotiation.messages.length - 1];
        setMessages(res.negotiation.messages);

        channelRef.current?.broadcast("counter_offer", {
          newPrice: counterPrice,
          byRole: myRole,
          message: latestMsg,
        });
      }
    });
  }

  // Accept current offer -> Locks deal & creates Escrow Room
  async function handleAccept() {
    if (!confirm(`Sepakati harga Rp ${negotiation.currentOfferPrice.toLocaleString("id-ID")} dan buat Escrow Room?`)) {
      return;
    }

    const fd = new FormData();
    fd.append("negotiationId", negotiation.id);

    startTransition(async () => {
      const res = await acceptOfferAction(fd);
      if (res.success && res.escrowRoomId) {
        setNegotiation((prev) => ({
          ...prev,
          status: "DEAL_AGREED",
          escrowRoomId: res.escrowRoomId,
        }));

        const acceptMsg: NegotiationMessage = {
          id: `msg_${Date.now()}`,
          negotiationId: negotiation.id,
          senderId: session?.userId,
          senderRole: myRole,
          messageType: "DEAL_LOCKED",
          content: `Kesepakatan tercapai pada harga Rp ${negotiation.currentOfferPrice.toLocaleString("id-ID")}! Escrow Room #${res.escrowRoomId} dibuat. Mengalihkan ke ruang transaksi...`,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, acceptMsg]);

        channelRef.current?.broadcast("deal_agreed", {
          escrowRoomId: res.escrowRoomId,
          message: acceptMsg,
        });

        setTimeout(() => {
          router.push(`/escrow/${res.escrowRoomId}`);
        }, 1200);
      }
    });
  }

  // Reject offer
  async function handleReject() {
    if (!confirm("Yakin ingin menolak penawaran dan menutup negosiasi?")) return;
    const fd = new FormData();
    fd.append("negotiationId", negotiation.id);
    startTransition(async () => {
      const res = await rejectOfferAction(fd);
      if (res.success) {
        setNegotiation((prev) => ({ ...prev, status: "REJECTED" }));
      }
    });
  }

  const approxLocation = `${negotiation.listing.locationDistrict}, ${negotiation.listing.locationCity}`;
  const hasImage = negotiation.listing.images && negotiation.listing.images.length > 0;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/negotiations"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Negosiasi
      </Link>

      {/* Header Info Card */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#181818] border border-[#333] shrink-0 overflow-hidden flex items-center justify-center">
            {hasImage ? (
              <img
                src={negotiation.listing.images[0]}
                alt={negotiation.listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={24} className="text-[#555]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#888]">
              <span>Negosiasi dengan:</span>
              <span className="text-[#39FF14] font-bold">{counterpartyName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={11} className="text-[#39FF14]" />
                {approxLocation}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {negotiation.listing.title}
            </h2>
            <div className="text-xs font-mono text-[#aaa]">
              Harga Asli Katalog:{" "}
              <span className="text-[#666] line-through">
                Rp {negotiation.listing.fiatEstimateIdr.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Current Deal Bar */}
        <div className="text-left md:text-right bg-[#181818] border border-[#2d2d2d] p-3 px-4 shrink-0">
          <div className="text-[10px] font-mono text-[#888] uppercase tracking-wider">
            Tawaran Aktif Terakhir
          </div>
          <div className="text-xl font-bold font-mono text-[#39FF14]">
            Rp {negotiation.currentOfferPrice.toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] font-mono text-[#666]">
            Diajukan oleh: {negotiation.lastOfferBy === "BUYER" ? "Pembeli" : "Penjual"}
          </div>
        </div>
      </div>

      {/* Deal Agreed Banner */}
      {isDealAgreed && (
        <div className="bg-[#39FF14]/10 border border-[#39FF14] p-4 text-xs font-mono text-[#39FF14] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <div>
              <strong>DEAL SUDAH DISEPAKATI!</strong> Escrow Room telah dibuat untuk koordinasi titik temu COD.
            </div>
          </div>
          {negotiation.escrowRoomId && (
            <Link
              href={`/escrow/${negotiation.escrowRoomId}`}
              className="btn-primary text-xs font-bold px-4 py-2 shrink-0"
            >
              Buka Escrow Room →
            </Link>
          )}
        </div>
      )}

      {/* Burn-After-Reading Security Notice */}
      <div className="bg-[#121212] border border-[#262626] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-[#888]">
        <div className="flex items-center gap-2">
          <Flame size={13} className="text-[#FF6600]" />
          <span>
            <strong className="text-white">BURN-AFTER-READING PROTOCOL:</strong> Pesan &amp; tawaran hancur otomatis setelah dibaca (timer mengikuti panjang kalimat) dengan animasi pixel dissolve.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#39FF14]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] pulse-green" />
          <span>P2P ENCRYPTED</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-[#0e0e0e] border border-[#262626] h-[400px] overflow-y-auto p-4 sm:p-6 space-y-3 font-mono text-xs">
        {messages.map((m) => {
          const isMe = m.senderId === session?.userId || m.senderRole === myRole;
          return (
            <EphemeralMessageBubble
              key={m.id}
              message={m}
              isMe={isMe}
              counterpartyName={counterpartyName}
              currentOfferPrice={negotiation.currentOfferPrice}
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Action Decision Bar (Accept / Counter / Reject) */}
      {!isDealAgreed && negotiation.status !== "REJECTED" && (
        <div className="bg-[#141414] border border-[#2a2a2a] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-[#aaa]">
            Tawaran saat ini:{" "}
            <strong className="text-[#39FF14]">
              Rp {negotiation.currentOfferPrice.toLocaleString("id-ID")}
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCounter(!showCounter)}
              disabled={isPending}
              className="px-4 py-2 bg-[#222] hover:bg-[#2c2c2c] border border-[#3a3a3a] text-xs font-mono text-white transition-colors cursor-pointer"
            >
              {showCounter ? "Tutup Form Nego" : "Tawar Balik (Counter-Offer)"}
            </button>

            <button
              onClick={handleReject}
              disabled={isPending}
              className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-xs font-mono text-red-300 transition-colors cursor-pointer"
            >
              Tolak
            </button>

            <button
              onClick={handleAccept}
              disabled={isPending}
              className="btn-primary text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Sepakati Harga &amp; Kunci Escrow</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Counter Offer Input Form Drawer */}
      {showCounter && !isDealAgreed && (
        <form
          onSubmit={handleCounterSubmit}
          className="bg-[#181818] border border-[#333] p-5 space-y-4 fade-up"
        >
          <div className="text-xs font-mono text-[#39FF14] font-bold uppercase">
            Form Counter-Offer Baru
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-[#888] block mb-1">
                Nominal Counter-Offer (IDR)
              </label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                min={100000}
                step={50000}
                className="input-dark w-full py-2 px-3 text-sm font-mono text-[#39FF14] font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-[#888] block mb-1">
                Pesan Pendukung (Opsional)
              </label>
              <input
                type="text"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                placeholder="Contoh: Pasnya segini gan, barang mulus garansi legal"
                className="input-dark w-full py-2 px-3 text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCounter(false)}
              className="btn-secondary text-xs px-4 py-2 font-mono"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-xs font-bold px-4 py-2"
            >
              Kirim Counter-Offer
            </button>
          </div>
        </form>
      )}

      {/* Realtime Chat Input Box */}
      {!isDealAgreed && negotiation.status !== "REJECTED" && (
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ketik pesan ke ${counterpartyName}...`}
            className="input-dark flex-1 px-4 py-3 text-xs font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary px-5 py-3 text-xs font-bold flex items-center gap-1.5"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      )}
    </div>
  );
}
