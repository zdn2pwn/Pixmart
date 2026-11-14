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
} from "lucide-react";

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

      {/* Chat Messages Log */}
      <div className="bg-[#0e0e0e] border border-[#262626] h-[400px] overflow-y-auto p-4 sm:p-6 space-y-4 font-mono text-xs">
        {messages.map((m) => {
          const isMe = m.senderId === session?.userId || m.senderRole === myRole;
          const isSystem = m.senderRole === "SYSTEM" || m.messageType === "DEAL_LOCKED";

          if (isSystem) {
            return (
              <div
                key={m.id}
                className="bg-[#181818] border border-[#333] p-3 text-center text-[#39FF14] text-[11px] max-w-xl mx-auto rounded-none shadow-sm"
              >
                <div className="font-bold flex items-center justify-center gap-1.5">
                  <Lock size={12} />
                  <span>{m.content}</span>
                </div>
              </div>
            );
          }

          if (m.messageType === "OFFER" || m.messageType === "COUNTER_OFFER") {
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-md p-4 border ${
                    isMe
                      ? "bg-[#181818] border-[#39FF14]/40 text-white"
                      : "bg-[#151515] border-[#FFB800]/40 text-white"
                  }`}
                >
                  <div className="text-[10px] text-[#888] uppercase mb-1 flex items-center justify-between gap-4">
                    <span>{isMe ? "Tawaran Kamu" : `Tawaran dari ${counterpartyName}`}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="text-lg font-bold text-[#39FF14] font-mono">
                    Rp {Number(m.amount || negotiation.currentOfferPrice).toLocaleString("id-ID")}
                  </div>
                  {m.content && <p className="text-xs text-[#ccc] mt-2 font-sans">{m.content}</p>}
                </div>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-md p-3 px-4 ${
                  isMe
                    ? "bg-[#1f1f1f] border border-[#333] text-white"
                    : "bg-[#141414] border border-[#222] text-[#ccc]"
                }`}
              >
                <div className="text-[9px] text-[#777] mb-1">
                  {isMe ? "Kamu" : counterpartyName}
                </div>
                <div className="text-xs whitespace-pre-wrap font-sans">{m.content}</div>
                <div className="text-[9px] text-[#555] text-right mt-1">
                  {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
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
