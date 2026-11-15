"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageThread } from "@/components/chat/MessageThread";
import { LiveBidBar } from "@/components/nego/LiveBidBar";
import { sendNegotiationMessageAction } from "@/app/actions/messaging";
import {
  acceptOfferAction,
  rejectOfferAction,
  counterOfferAction,
  cancelNegotiationAction,
} from "@/app/actions/negotiation";
import {
  markNegoMessageAsReadAction,
  deleteNegoMessageAction,
} from "@/app/actions/messages";
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
  Tag,
  Lightbulb,
  Handshake,
  LockKeyhole,
  User,
} from "lucide-react";

interface NegotiationRoomClientProps {
  negotiation: any;
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
    PENDING: "Menunggu balasan",
    COUNTER_OFFER: "Ada counter offer",
    ACCEPTED: "Deal disepakati",
    REJECTED: "Tawaran ditolak",
    CANCELLED: "Nego dibatalkan",
  };
  return labels[status] ?? status.replace(/_/g, " ").toLowerCase();
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

  const isBuyer = session.userId === negotiation.buyer_id;
  const isSeller = session.userId === negotiation.seller_id;
  const counterparty = isBuyer ? negotiation.seller : negotiation.buyer;
  const listing = negotiation.listing;
  const status = negotiation.status || "PENDING";
  const isOpen = status === "PENDING" || status === "COUNTER_OFFER";

  const offerBTC = Number(negotiation.current_offer_btc || 0);
  const offerXMR = Number(negotiation.current_offer_xmr || 0);
  const offerMethod: "BTC" | "XMR" | null =
    offerBTC > 0 ? "BTC" : offerXMR > 0 ? "XMR" : null;
  const offerAmount = offerBTC > 0 ? offerBTC : offerXMR;

  async function handleAcceptOffer() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("negotiationId", negotiation.id);

      const result = await acceptOfferAction(formData);

      if (result.success) {
        if (result.bothAgreed && result.escrowRoomId) {
          customAlert.success(
            result.message || "Ruang escrow berhasil dibuat.",
            "Deal 2/2"
          );
          setTimeout(() => {
            router.push(`/escrow/${result.escrowRoomId}`);
          }, 1200);
        } else {
          customAlert.info(
            result.message || "Kamu sudah setuju. Menunggu pihak lain.",
            "Deal 1/2"
          );
        }
      } else {
        customAlert.error(result.error || "Gagal memperbarui kesepakatan");
      }
    });
  }

  async function handleRejectOffer() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("negotiationId", negotiation.id);

      const result = await rejectOfferAction(formData);

      if (result.success) {
        customAlert.info(
          result.message || "Penawaran direset. Nego masih terbuka.",
          "Tawaran direset"
        );
      } else {
        customAlert.error(result.error || "Gagal mereset penawaran");
      }
    });
  }

  async function handleCancelNegotiation() {
    customAlert.confirm(
      "Tutup negosiasi ini permanen? Setelah ditutup, ruang nego tidak bisa dipakai lagi.",
      () => {
        startTransition(async () => {
          const formData = new FormData();
          formData.append("negotiationId", negotiation.id);

          const result = await cancelNegotiationAction(formData);

          if (result.success) {
            customAlert.success(
              result.message || "Negosiasi ditutup.",
              "Nego dibatalkan"
            );
            setTimeout(() => {
              router.push("/negotiations");
            }, 1200);
          } else {
            customAlert.error(result.error || "Gagal membatalkan negosiasi");
          }
        });
      },
      "Batalkan negosiasi?"
    );
  }

  async function handleCounterOffer(method: "BTC" | "XMR", amount: number) {
    if (Number.isNaN(amount) || amount <= 0) {
      customAlert.error("Masukkan nominal yang valid.", "Input tidak valid");
      return;
    }

    if (isBuyer) {
      const listingPrice =
        method === "BTC"
          ? Number(negotiation.listing?.price_btc || 0)
          : Number(negotiation.listing?.price_xmr || 0);
      if (amount > listingPrice) {
        customAlert.error(
          `Tawaran tidak boleh di atas harga listing (maksimal ${formatCrypto(
            listingPrice,
            method
          )}).`,
          "Nominal terlalu tinggi"
        );
        return;
      }
    }

    startTransition(async () => {
      const btcToIdr = 1_400_000_000;
      const xmrToIdr = 3_500_000;
      const fiatEstimate =
        method === "BTC"
          ? Math.round(amount * btcToIdr)
          : Math.round(amount * xmrToIdr);
      const decimals = method === "BTC" ? 8 : 4;

      const messageContent = `${
        isBuyer ? "Tawaran" : "Counter offer"
      }: ${amount.toFixed(decimals)} ${method}\n≈ Rp ${fiatEstimate.toLocaleString(
        "id-ID"
      )}`;

      const msgFormData = new FormData();
      msgFormData.append("negotiationId", negotiation.id);
      msgFormData.append("content", messageContent);

      await sendNegotiationMessageAction(msgFormData);

      const counterFormData = new FormData();
      counterFormData.append("negotiationId", negotiation.id);
      counterFormData.append("method", method);
      counterFormData.append("amount", amount.toString());

      const result = await counterOfferAction(counterFormData);

      if (!result.success) {
        customAlert.error(result.error || "Gagal mengirim penawaran");
      }
    });
  }

  async function handleSendMessage(content: string) {
    const formData = new FormData();
    formData.append("negotiationId", negotiation.id);
    formData.append("content", content);

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

    if (!result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }

    return result;
  }

  async function handleMarkAsRead(messageId: string) {
    await markNegoMessageAsReadAction(messageId, negotiation.id);
  }

  async function handleDeleteMessage(messageId: string) {
    await deleteNegoMessageAction(messageId, negotiation.id);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

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

    const fetchNegotiation = async () => {
      const { data } = await supabase
        .from("negotiations")
        .select(
          `
          *,
          listing:marketplace_listings(*),
          buyer:profiles!negotiations_buyer_id_fkey(id, codename),
          seller:profiles!negotiations_seller_id_fkey(id, codename)
        `
        )
        .eq("id", negotiation.id)
        .single();

      if (data) {
        setNegotiation(data);
      }
    };

    const messagesChannel = supabase
      .channel(`negotiation_messages:${negotiation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "negotiation_messages",
          filter: `negotiation_id=eq.${negotiation.id}`,
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
        () => {
          fetchNegotiation();
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      fetchMessages();
      fetchNegotiation();
    }, 2000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(negotiationChannel);
      clearInterval(pollInterval);
    };
  }, [negotiation.id]);

  function StatusPill() {
    if (status === "ACCEPTED") {
      return (
        <span className="badge-green !text-[11px]">
          <CheckCircle2 size={13} />
          Deal disepakati
        </span>
      );
    }
    if (status === "REJECTED" || status === "CANCELLED") {
      return (
        <span className="badge-danger !text-[11px]">
          <XCircle size={13} />
          {statusLabel(status)}
        </span>
      );
    }
    return (
      <span className="badge-warn !text-[11px]">
        <Clock size={13} />
        {statusLabel(status)}
      </span>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/negotiations"
          className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-ink transition-colors hover:text-lime"
        >
          <ArrowLeft size={14} />
          Negotiations
        </Link>
        <StatusPill />
      </div>

      <header className="pixel-panel pop-in p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-cream sm:text-2xl">
              {listing?.title || "Produk tanpa judul"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-ink">
              <span>
                Counterparty:{" "}
                <span className="font-bold text-cream">
                  {counterparty?.codename || "Tanpa codename"}
                </span>
              </span>
              <span>
                {listing?.location_city || "Lokasi belum diisi"}
                {listing?.location_district
                  ? `, ${listing.location_district}`
                  : ""}
              </span>
              {listing?.category && (
                <span>{String(listing.category).replace(/_/g, " ")}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill />
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <aside
          className="pop-in space-y-4"
          style={{ animationDelay: "110ms" }}
        >
          <section className="pixel-panel overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-line bg-ink">
              {listing?.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title || "Foto produk"}
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
            </div>

            <div className="space-y-3 p-4">
              {listing?.condition && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-ink">
                    Condition
                  </span>
                  <span className="badge-muted">{listing.condition}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-3 border-t-2 border-line pt-3">
                <span className="text-[13px] text-muted-ink">
                  Listing price
                </span>
                <span className="font-mono text-[13px] font-bold text-muted-ink line-through">
                  {formatIdr(Number(listing?.fiat_estimate_idr || 0))}
                </span>
              </div>

              <div
                className={`border-2 p-3 ${
                  offerMethod
                    ? "border-lime/50 bg-lime/5"
                    : "border-line bg-ink"
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink">
                  <Handshake size={12} className="text-lime" />
                  Current offer
                </div>
                {offerMethod ? (
                  <>
                    <div className="mt-1.5 font-mono text-base font-bold text-lime">
                      {formatCrypto(offerAmount, offerMethod)}
                    </div>
                    <div className="font-mono text-[12px] text-muted-ink">
                      ≈{" "}
                      {formatIdr(
                        offerAmount *
                          (offerMethod === "BTC"
                            ? 1_400_000_000
                            : 3_500_000)
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-1.5 text-[13px] leading-relaxed text-muted-ink">
                    Belum ada tawaran. Meja masih di harga listing.
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 border-t-2 border-line pt-3 text-[12px] leading-relaxed text-muted-ink">
                <MapPin size={13} className="mt-0.5 shrink-0 text-cyan" />
                <span>
                  {listing?.location_city || "Lokasi belum diisi"}
                  {listing?.location_district
                    ? `, ${listing.location_district}`
                    : ""}
                  . Titik temu pasti diatur setelah deal.
                </span>
              </div>
            </div>
          </section>

          <section className="border-2 border-amber/40 bg-amber/5 p-4">
            <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
              <LockKeyhole size={14} />
              Cara deal di sini
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-ink">
              Deal baru sah kalau <span className="font-bold text-cream">buyer
              dan seller sama-sama setuju</span>. Setelah 2/2, ruang escrow
              otomatis dibuat untuk atur pembayaran demo dan titik temu.
            </p>
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
              <ShieldCheck size={12} />
              Escrow 3 pihak · saldo fiksi
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
                <MessageSquare size={16} />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-cream">
                  Ruang obrolan
                </h2>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-ink">
                  Pesan hilang 10 detik setelah dibaca
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-lime sm:flex">
              <span className="size-1.5 bg-lime pulse-green" />
              Tersambung
            </span>
          </header>

          {isOpen && (
            <LiveBidBar
              negotiation={negotiation}
              isBuyer={isBuyer}
              isSeller={isSeller}
              onCounterOffer={handleCounterOffer}
              onAccept={() => {
                customAlert.confirm(
                  "Kunci harga ini dan buat ruang escrow? Pastikan kamu sudah yakin dengan nominal dan kondisi barang.",
                  handleAcceptOffer,
                  "Setuju dengan harga ini?"
                );
              }}
              onReject={handleRejectOffer}
              isPending={isPending}
            />
          )}

          <div className="h-[560px] min-h-0 lg:h-[640px]">
            <MessageThread
              messages={messages}
              currentUserId={session.userId}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              onDeleteMessage={handleDeleteMessage}
              placeholder="Tulis pesan untuk lawan nego..."
              emptyStateText="Belum ada pesan. Sapa dulu, lalu masuk ke harga."
              enableSelfDestruct={true}
            />
          </div>

          {isOpen && (
            <div className="border-t-2 border-line bg-ink p-3">
              <button
                type="button"
                onClick={handleCancelNegotiation}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 border-2 border-line bg-surface px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <XCircle size={13} />
                )}
                Tutup negosiasi
              </button>
            </div>
          )}
        </section>
      </div>

      <p className="mt-4 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-muted-ink">
        <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber" />
        Semua nominal crypto di PIXMART adalah simulasi untuk demo. Tidak ada
        dana nyata yang berpindah.
      </p>
    </main>
  );
}
