"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageThread } from "@/components/chat/MessageThread";
import { sendEscrowMessageAction } from "@/app/actions/messaging";
import {
  markEscrowMessageAsReadAction,
  deleteEscrowMessageAction,
} from "@/app/actions/messages";
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
  Navigation,
  Wallet,
  Handshake,
  LockKeyhole,
  CalendarClock,
  TrendingDown,
  Landmark,
  CircleDollarSign,
  Info,
  BadgeCheck,
} from "lucide-react";

interface EscrowRoomClientProps {
  room: any;
  messages: any[];
  session: any;
}

function formatIdr(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatCrypto(amount: number, method: "BTC" | "XMR") {
  if (!amount) return "-";
  return `${Number(amount).toFixed(method === "BTC" ? 8 : 4)} ${method}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Menunggu aksi",
    AWAITING_PAYMENT: "Menunggu pembayaran",
    ACTIVE: "COD berjalan",
    MEETING_PROPOSED: "Usulan titik temu",
    MEETING_AGREED: "Titik temu fix",
    COMPLETED: "Selesai",
    DISPUTED: "Sengketa",
  };
  return labels[status] ?? status.replace(/_/g, " ").toLowerCase();
}

function SectionTitle({
  icon: Icon,
  children,
  color = "text-lime",
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <h2
      className={`flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] ${color}`}
    >
      <Icon size={14} />
      {children}
    </h2>
  );
}

function PresenceRow({
  label,
  codename,
  active,
  tone,
}: {
  label: string;
  codename?: string;
  active: boolean;
  tone: "lime" | "cyan" | "amber";
}) {
  const activeText =
    tone === "cyan"
      ? "text-cyan"
      : tone === "amber"
        ? "text-amber"
        : "text-lime";
  const activeBox =
    tone === "cyan"
      ? "border-ink bg-cyan text-ink"
      : tone === "amber"
        ? "border-ink bg-amber text-ink"
        : "border-ink bg-lime text-ink";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid size-7 shrink-0 place-items-center border-2 ${
            active ? activeBox : "border-line bg-ink text-muted-ink"
          }`}
        >
          <UserCheck size={13} />
        </span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
            {label}
          </div>
          <div className="truncate text-[13px] font-bold text-cream">
            {codename || "-"}
          </div>
        </div>
      </div>
      <span
        className={`shrink-0 font-mono text-[11px] font-bold ${
          active ? activeText : "text-muted-ink"
        }`}
      >
        {active ? "Hadir" : "Belum hadir"}
      </span>
    </div>
  );
}

export function EscrowRoomClient({
  room: initialRoom,
  messages: initialMessages,
  session,
}: EscrowRoomClientProps) {
  const [room, setRoom] = useState(initialRoom);
  const [messages, setMessages] = useState(initialMessages);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingError, setMeetingError] = useState<string | null>(null);

  function applyRoomUpdate(updatedRoom: Record<string, unknown>) {
    if (!updatedRoom) return;
    setRoom((prev: typeof initialRoom) => ({ ...prev, ...updatedRoom }));
  }

  const isBuyer = session.userId === room.buyer_id;
  const counterparty = isBuyer ? room.seller : room.buyer;
  const midman = room.midman;
  const listing = room.negotiation?.listing;

  const cryptoType: "BTC" | "XMR" = room.crypto_type === "XMR" ? "XMR" : "BTC";
  const agreedPrice =
    cryptoType === "BTC"
      ? Number(room.agreed_price_btc || 0)
      : Number(room.agreed_price_xmr || 0);
  const agreedPriceIdr =
    cryptoType === "BTC"
      ? Math.round(agreedPrice * 1_400_000_000)
      : Math.round(agreedPrice * 3_500_000);
  const listingPriceIdr = Number(listing?.fiat_estimate_idr || 0);
  const savings = listingPriceIdr - agreedPriceIdr;

  const paymentDone =
    room.payment_status === "RECEIVED" ||
    Boolean(room.funds_held) ||
    Boolean(room.funds_released) ||
    room.status === "COMPLETED";
  const meetingDone = Boolean(room.meeting_accepted);
  const handshakeDone = Boolean(room.buyer_confirmed && room.seller_confirmed);
  const released = Boolean(room.funds_released) || room.status === "COMPLETED";

  const steps = [
    {
      label: "Pembayaran",
      hint: paymentDone
        ? room.funds_held || room.funds_released
          ? "Dana di escrow"
          : "Pembayaran masuk"
        : "Buyer belum bayar",
      done: paymentDone,
      icon: Wallet,
    },
    {
      label: "Titik temu",
      hint: meetingDone ? "Lokasi disepakati" : "Belum disepakati",
      done: meetingDone,
      icon: MapPin,
    },
    {
      label: "Handshake",
      hint: handshakeDone ? "Dua pihak konfirmasi" : "Cek barang dulu",
      done: handshakeDone,
      icon: Handshake,
    },
    {
      label: "Rilis dana",
      hint: released ? "Transaksi selesai" : "Menunggu Midman",
      done: released,
      icon: BadgeCheck,
    },
  ];
  const activeStep = steps.findIndex((step) => !step.done);

  async function handleSendMessage(content: string) {
    const formData = new FormData();
    formData.append("roomId", room.id);
    formData.append("content", content);

    const result = await sendEscrowMessageAction(formData);
    return result;
  }

  async function handleMarkAsRead(messageId: string) {
    await markEscrowMessageAsReadAction(messageId, room.id);
  }

  async function handleDeleteMessage(messageId: string) {
    await deleteEscrowMessageAction(messageId, room.id);
  }

  async function handleProposeMeeting(location: string, time: string) {
    const formData = new FormData();
    formData.append("roomId", room.id);
    formData.append("locationName", location);
    formData.append("areaNote", "Area publik");
    const [date, timeOnly] = time.split("T");
    formData.append("date", date);
    formData.append("time", timeOnly || time);

    const result = await proposeMeetingAction(formData);
    if (result.success) {
      applyRoomUpdate(result.room);
      setShowMeetingForm(false);
      setMeetingLocation("");
      setMeetingTime("");
      setMeetingError(null);
      customAlert.success("Usulan titik temu terkirim ke pihak lain.");
    } else {
      setMeetingError(result.error || "Gagal mengirim usulan titik temu.");
    }
  }

  async function handleAcceptMeeting() {
    const result = await acceptMeetingAction(room.id);
    if (result.success) {
      applyRoomUpdate(result.room);
      customAlert.success("Titik temu dikunci. Sampai jumpa di lokasi.");
    } else {
      customAlert.error(result.error || "Gagal menyetujui titik temu");
    }
  }

  async function handleConfirmArrival() {
    customAlert.confirm(
      "Konfirmasi bahwa kamu sudah sampai di titik temu?",
      async () => {
        const result = await confirmArrivalAction(room.id);
        if (result.success) {
          applyRoomUpdate(result.room);
          customAlert.success("Kehadiranmu tercatat.");
        } else {
          customAlert.error(result.error || "Gagal mencatat kehadiran");
        }
      }
    );
  }

  async function handleCodHandshake() {
    const confirmText = isBuyer
      ? "Konfirmasi bahwa kamu sudah menerima barang sesuai deskripsi?"
      : "Konfirmasi bahwa kamu sudah menyerahkan barang ke buyer?";

    customAlert.confirm(confirmText, async () => {
      const result = await confirmCodHandshakeAction(room.id);
      if (result.success) {
        applyRoomUpdate(result.room);
        if (result.bothConfirmed) {
          customAlert.success(
            "Dua pihak sudah konfirmasi. Midman bisa merilis dana.",
            "Handshake selesai"
          );
        } else {
          customAlert.success(
            "Konfirmasimu tercatat. Menunggu pihak lain.",
            "Handshake 1/2"
          );
        }
      } else {
        customAlert.error(result.error || "Gagal mengonfirmasi handshake");
      }
    });
  }

  async function handlePayment() {
    customAlert.confirm(
      `Bayar ${formatCrypto(
        agreedPrice,
        cryptoType
      )} (≈ ${formatIdr(agreedPriceIdr)})? Ini simulasi demo, tidak ada dana nyata yang ditarik.`,
      async () => {
        const result = await payEscrowAction(room.id);
        if (result.success) {
          applyRoomUpdate(result.escrow);
          customAlert.success(
            "Pembayaran demo masuk. Dana ditahan sistem escrow sampai handshake.",
            "Dana masuk escrow"
          );
        } else {
          customAlert.error(result.error || "Pembayaran gagal");
        }
      },
      "Konfirmasi pembayaran"
    );
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

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

    const fetchRoom = async () => {
      const { data } = await supabase
        .from("escrow_sessions")
        .select("*")
        .eq("id", room.id)
        .single();

      if (data) {
        setRoom((prev: typeof initialRoom) => ({ ...prev, ...data }));
      }
    };

    const channel = supabase
      .channel(`escrow_messages:${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "escrow_messages",
          filter: `escrow_id=eq.${room.id}`,
        },
        (payload) => {
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
              prev.map((m) =>
                m.id === updatedMessage.id ? updatedMessage : m
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe();

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
          if (payload.new) {
            setRoom((prev: typeof initialRoom) => ({
              ...prev,
              ...payload.new,
            }));
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      fetchMessages();
      fetchRoom();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(escrowChannel);
      clearInterval(pollInterval);
    };
  }, [room.id]);

  function StatusPill() {
    if (room.status === "COMPLETED" || released) {
      return (
        <span className="badge-green !text-[11px]">
          <CheckCircle2 size={13} />
          Transaksi selesai
        </span>
      );
    }
    if (room.status === "DISPUTED") {
      return (
        <span className="badge-danger !text-[11px]">
          <AlertTriangle size={13} />
          Sengketa
        </span>
      );
    }
    return (
      <span className="badge-warn !text-[11px]">
        <Clock size={13} />
        {statusLabel(room.status || "PENDING")}
      </span>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/escrow"
          className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-ink transition-colors hover:text-lime"
        >
          <span className="grid size-8 place-items-center border-2 border-line bg-surface transition-colors group-hover:border-lime">
            <ArrowLeft size={14} />
          </span>
          Daftar escrow
        </Link>
        <StatusPill />
      </div>

      <header className="pixel-panel pop-in relative overflow-hidden">
        <div className="flex h-1.5">
          <span className="flex-1 bg-lime" />
          <span className="w-20 bg-amber" />
          <span className="w-10 bg-pink" />
        </div>

        <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Escrow 3 pihak · #{String(room.id).slice(0, 8)}
              </span>
              <span className="hidden h-3 w-px bg-line sm:block" />
              <span className="text-muted-ink">
                {isBuyer ? "Kamu sebagai buyer" : "Kamu sebagai seller"}
              </span>
            </div>

            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-cream sm:text-2xl">
              {room.item_title || listing?.title || "Barang tanpa judul"}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 border-2 border-line bg-ink px-2.5 py-1.5 font-mono text-[11px] text-muted-ink">
                <UserCheck size={12} className="text-cyan" />
                {isBuyer ? "Seller" : "Buyer"}:{" "}
                <span className="font-bold text-cream">
                  {counterparty?.codename || "Tanpa codename"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 border-2 border-line bg-ink px-2.5 py-1.5 font-mono text-[11px] text-muted-ink">
                <ShieldCheck size={12} className="text-amber" />
                Midman:{" "}
                <span className="font-bold text-cream">
                  {midman?.codename || "Owner"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 border-2 border-line bg-ink px-2.5 py-1.5 font-mono text-[11px] text-muted-ink">
                <MapPin size={12} className="text-cyan" />
                {listing?.location_city || "Lokasi COD"}
                {listing?.location_district
                  ? `, ${listing.location_district}`
                  : ""}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-end justify-between gap-5 border-t-2 border-line pt-4 lg:border-t-0 lg:pt-0">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink">
                Nilai deal
              </div>
              <div className="mt-1 text-xl font-bold text-lime sm:text-2xl">
                {formatIdr(agreedPriceIdr)}
              </div>
              <div className="mt-0.5 font-mono text-[12px] font-bold text-cream">
                {formatCrypto(agreedPrice, cryptoType)}
              </div>
            </div>
            <span className="badge-cyan !text-[10px]">Saldo demo</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t-2 border-line bg-ink px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-ink sm:items-center">
            <LockKeyhole size={13} className="mt-0.5 shrink-0 text-lime sm:mt-0" />
            Dana ditahan Midman sampai buyer dan seller sama-sama konfirmasi
            serah terima.
          </p>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
            Simulasi · no real funds
          </span>
        </div>
      </header>

      <section className="pixel-panel pop-in mt-4" style={{ animationDelay: "60ms" }}>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            return (
              <div
                key={step.label}
                className={`relative flex items-center gap-3 p-3.5 ${
                  step.done
                    ? "bg-lime/[0.055]"
                    : isActive
                      ? "bg-amber/[0.055]"
                      : ""
                } ${index < 3 ? "lg:border-r-2 lg:border-line" : ""} ${
                  index % 2 === 0 ? "border-r-2 border-line" : ""
                } ${index < 2 ? "border-b-2 border-line lg:border-b-0" : ""}`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center border-2 font-arcade text-[10px] ${
                    step.done
                      ? "border-ink bg-lime text-ink"
                      : isActive
                        ? "border-amber bg-amber text-ink"
                        : "border-line bg-ink text-muted-ink"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 size={16} strokeWidth={3} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <div className="min-w-0">
                  <div
                    className={`font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${
                      step.done
                        ? "text-lime"
                        : isActive
                          ? "text-amber"
                          : "text-muted-ink"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-snug text-muted-ink">
                    {step.hint}
                  </div>
                </div>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-amber arcade-blink" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside
          className="pop-in space-y-4"
          style={{ animationDelay: "110ms" }}
        >
          <section className="pixel-panel overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-line bg-ink">
              {listing?.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title || "Foto barang"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center">
                  <Package size={44} className="text-line" />
                </div>
              )}
              <span className="absolute left-2 top-2 border border-line bg-ink/90 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-ink">
                Barang COD
              </span>
              {released && (
                <span className="absolute right-2 top-2 badge-green bg-ink/90">
                  Dana dirilis
                </span>
              )}
            </div>

            <div className="space-y-3 p-4">
              <SectionTitle icon={Package}>Barang & harga</SectionTitle>

              <div className="flex items-baseline justify-between gap-3 border-t-2 border-line pt-3 text-[13px]">
                <span className="text-muted-ink">Harga listing</span>
                <span className="font-mono font-bold text-muted-ink line-through">
                  {formatIdr(listingPriceIdr)}
                </span>
              </div>

              <div className="border-2 border-lime/50 bg-lime/5 p-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-lime">
                  Harga deal final
                </div>
                <div className="mt-1 text-xl font-bold text-cream">
                  {formatIdr(agreedPriceIdr)}
                </div>
                <div className="mt-1 font-mono text-[12px] font-bold text-lime">
                  {formatCrypto(agreedPrice, cryptoType)}
                </div>
              </div>

              {savings > 0 && (
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber">
                  <TrendingDown size={13} />
                  Hemat {formatIdr(savings)} dari harga listing
                </div>
              )}
            </div>
          </section>

          <section className="pixel-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle icon={MapPin}>Titik temu</SectionTitle>
              {meetingDone && (
                <span className="badge-green">Disepakati</span>
              )}
            </div>

            {meetingDone && room.meeting_proposal && (
              <div className="mt-3 space-y-3">
                <div className="border-2 border-lime/50 bg-lime/5 p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-lime">
                    <CheckCircle2 size={12} />
                    Lokasi fix
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-cream">
                    {room.meeting_proposal.location_name}
                  </div>
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-[13px]">
                  <span className="flex items-center gap-1.5 text-muted-ink">
                    <CalendarClock size={13} className="text-cyan" />
                    Tanggal
                  </span>
                  <span className="font-mono font-bold text-cream">
                    {room.meeting_proposal.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-ink">
                    <Clock size={13} className="text-cyan" />
                    Jam
                  </span>
                  <span className="font-mono font-bold text-cream">
                    {room.meeting_proposal.time}
                  </span>
                </div>
                <p className="border-t-2 border-line pt-3 text-[12px] leading-relaxed text-muted-ink">
                  Datang tepat waktu. Cek barang di tempat sebelum konfirmasi
                  handshake.
                </p>
              </div>
            )}

            {room.meeting_proposal && !meetingDone && (
              <div className="mt-3 space-y-3">
                <div className="border-2 border-amber/45 bg-amber/5 p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
                    <Clock size={12} />
                    Menunggu persetujuan
                  </div>
                  <div className="mt-1 text-[12px] text-muted-ink">
                    Diusulkan oleh{" "}
                    <span className="font-bold text-cream">
                      {room.meeting_proposal.proposed_by === "BUYER"
                        ? "buyer"
                        : room.meeting_proposal.proposed_by === "SELLER"
                          ? "seller"
                          : String(
                              room.meeting_proposal.proposed_by || "pihak lain"
                            ).toLowerCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
                    Lokasi usulan
                  </div>
                  <div className="mt-1 text-sm font-bold text-cream">
                    {room.meeting_proposal.location_name}
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-muted-ink">
                    {room.meeting_proposal.date} ·{" "}
                    {room.meeting_proposal.time}
                  </div>
                </div>

                {room.meeting_proposal.proposed_by !== session.role && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAcceptMeeting}
                      className="btn-primary !min-h-10 !px-2 !py-2 !text-[10px]"
                    >
                      <CheckCircle2 size={13} />
                      Setuju
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMeetingError(null);
                        setShowMeetingForm(true);
                      }}
                      className="btn-ghost !min-h-10 !px-2 !py-2 !text-[10px]"
                    >
                      <MapPin size={13} />
                      Usul ulang
                    </button>
                  </div>
                )}
              </div>
            )}

            {!room.meeting_proposal && !showMeetingForm && (
              <div className="mt-3 space-y-3">
                <p className="text-[13px] leading-relaxed text-muted-ink">
                  Belum ada titik temu. Usulkan lokasi publik yang ramai dan
                  mudah dijangkau dua pihak.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMeetingError(null);
                    setShowMeetingForm(true);
                  }}
                  className="btn-ghost w-full !min-h-10 !py-2 !text-[10px]"
                >
                  <MapPin size={14} />
                  Usulkan titik temu
                </button>
              </div>
            )}

            {showMeetingForm && (
              <div className="mt-3 space-y-3 border-t-2 border-line pt-3">
                <div>
                  <label
                    htmlFor="meeting-location"
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink"
                  >
                    Lokasi
                  </label>
                  <input
                    id="meeting-location"
                    type="text"
                    value={meetingLocation}
                    onChange={(event) =>
                      setMeetingLocation(event.target.value)
                    }
                    placeholder="Contoh: Starbucks Grand Indonesia Lt. 3"
                    className="input-dark mt-1.5 !text-[13px]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="meeting-time"
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink"
                  >
                    Waktu
                  </label>
                  <input
                    id="meeting-time"
                    type="datetime-local"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                    className="input-dark mt-1.5 !text-[13px]"
                  />
                </div>

                {meetingError && (
                  <div className="flex items-start gap-2 border-2 border-danger/40 bg-danger/10 p-2.5 text-[12px] leading-relaxed text-danger">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    {meetingError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!meetingLocation.trim()) {
                        setMeetingError("Isi nama lokasi dulu.");
                        return;
                      }
                      if (!meetingTime) {
                        setMeetingError("Pilih tanggal dan jam pertemuan.");
                        return;
                      }
                      handleProposeMeeting(meetingLocation.trim(), meetingTime);
                    }}
                    className="btn-primary !min-h-10 !px-2 !py-2 !text-[10px]"
                  >
                    Kirim usulan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMeetingForm(false);
                      setMeetingLocation("");
                      setMeetingTime("");
                      setMeetingError(null);
                    }}
                    className="btn-ghost !min-h-10 !px-2 !py-2 !text-[10px]"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="pixel-panel p-4">
            <SectionTitle icon={UserCheck}>Status ruang</SectionTitle>

            <div className="mt-2">
              <PresenceRow
                label="Buyer"
                codename={room.buyer?.codename}
                active={Boolean(room.buyer_arrived)}
                tone="lime"
              />
              <PresenceRow
                label="Seller"
                codename={room.seller?.codename}
                active={Boolean(room.seller_arrived)}
                tone="cyan"
              />
              <div className="flex items-center justify-between gap-3 border-t-2 border-line pt-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center border-2 border-ink bg-amber text-ink">
                    <Landmark size={13} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
                      Midman
                    </div>
                    <div className="truncate text-[13px] font-bold text-cream">
                      {midman?.codename || "Owner"}
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-[11px] font-bold ${
                    room.funds_held ? "text-lime" : "text-amber"
                  }`}
                >
                  {room.funds_held ? "Dana ditahan" : "Mengawasi"}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t-2 border-line pt-4">
              {isBuyer && room.payment_status === "AWAITING_PAYMENT" && (
                <button
                  type="button"
                  onClick={handlePayment}
                  className="btn-primary w-full !min-h-12 !py-3"
                >
                  <Wallet size={16} />
                  Bayar ke escrow
                </button>
              )}

              {room.funds_released && (
                <div className="border-2 border-lime/50 bg-lime/10 p-3">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-lime">
                    <CheckCircle2 size={15} />
                    Dana sudah dirilis ke seller
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                    Transaksi demo selesai. Barang sudah berpindah tangan.
                  </p>
                </div>
              )}

              {room.funds_held && !room.funds_released && (
                <div className="border-2 border-lime/50 bg-lime/10 p-3">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-lime">
                    <LockKeyhole size={14} />
                    Dana ditahan Midman
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                    Aman untuk COD. Dana baru dirilis setelah handshake dua
                    pihak.
                  </p>
                </div>
              )}

              {room.payment_status === "RECEIVED" && !room.funds_held && (
                <div className="border-2 border-amber/45 bg-amber/5 p-3 text-[12px] leading-relaxed text-amber">
                  Dana sudah masuk. Menunggu Midman menahan dana di escrow.
                </div>
              )}

              {room.meeting_accepted &&
                !(isBuyer ? room.buyer_arrived : room.seller_arrived) && (
                  <button
                    type="button"
                    onClick={handleConfirmArrival}
                    className="btn-primary w-full !min-h-11 !py-2.5"
                  >
                    <Navigation size={15} />
                    Saya sudah sampai
                  </button>
                )}

              {room.buyer_arrived &&
                room.seller_arrived &&
                room.funds_held &&
                !released && (
                  <>
                    {!(isBuyer ? room.buyer_confirmed : room.seller_confirmed) ? (
                      <button
                        type="button"
                        onClick={handleCodHandshake}
                        className="flex min-h-12 w-full items-center justify-center gap-2 border-2 border-ink bg-amber px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink shadow-[4px_4px_0_0_#05040a] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                      >
                        <Handshake size={16} />
                        {isBuyer
                          ? "Konfirmasi terima barang"
                          : "Konfirmasi serah barang"}
                      </button>
                    ) : (
                      <div className="border-2 border-lime/50 bg-lime/10 p-3">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-lime">
                          <CheckCircle2 size={14} />
                          Konfirmasimu tercatat
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                          {room.buyer_confirmed && room.seller_confirmed
                            ? "Dua pihak setuju. Menunggu Midman merilis dana."
                            : "Menunggu pihak lain menyelesaikan handshake."}
                        </p>
                      </div>
                    )}
                  </>
                )}

              {room.payment_status === "AWAITING_PAYMENT" && !isBuyer && (
                <div className="border-2 border-amber/45 bg-amber/5 p-3 text-[12px] leading-relaxed text-amber">
                  Menunggu buyer membayar ke escrow. Jangan serahkan barang
                  sebelum dana ditahan.
                </div>
              )}

              {!released &&
                room.payment_status !== "AWAITING_PAYMENT" &&
                !room.funds_held &&
                !room.meeting_accepted && (
                  <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-ink">
                    <Info size={13} className="mt-0.5 shrink-0 text-cyan" />
                    Ikuti langkah di atas. Status ruang berubah otomatis saat
                    tiap aksi selesai.
                  </p>
                )}
            </div>
          </section>
        </aside>

        <section
          className="pixel-panel pop-in flex min-w-0 flex-col overflow-hidden"
          style={{ animationDelay: "160ms" }}
        >
          <header className="flex items-center justify-between gap-3 border-b-2 border-line bg-ink px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center border-2 border-line bg-surface text-lime">
                <ShieldCheck size={16} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-cream">
                  Ruang koordinasi 3 pihak
                </h2>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-ink">
                  Buyer · seller · midman dalam satu papan
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-lime sm:flex">
              <span className="size-1.5 bg-lime pulse-green" />
              Tersambung
            </span>
          </header>

          <div className="h-[580px] min-h-0 lg:h-[720px]">
            <MessageThread
              messages={messages}
              currentUserId={session.userId}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              onDeleteMessage={handleDeleteMessage}
              placeholder="Tulis pesan koordinasi COD..."
              emptyStateText="Belum ada pesan. Mulai koordinasi titik temu di sini."
              enableSelfDestruct={true}
            />
          </div>
        </section>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-2 border-amber/30 bg-amber/5 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-ink sm:items-center">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber sm:mt-0" />
          Escrow ini simulasi untuk presentasi. Tidak ada crypto, saldo, atau
          transfer uang nyata di dalam sistem.
        </p>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
          <CircleDollarSign size={12} />
          Demo mode
        </span>
      </div>
    </main>
  );
}
