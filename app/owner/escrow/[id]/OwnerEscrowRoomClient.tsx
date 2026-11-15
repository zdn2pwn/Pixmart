"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageThread } from "@/components/chat/MessageThread";
import { sendEscrowMessageAction } from "@/app/actions/messaging";
import { markEscrowMessageAsReadAction, deleteEscrowMessageAction } from "@/app/actions/messages";
import { customAlert } from "@/components/ui/CustomAlert";
import {
  holdFundsAction,
  releaseFundsAction,
  verifyEscrowAction,
} from "@/app/actions/ownerEscrow";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Package,
  Users,
  Lock,
  Unlock,
  Activity,
  MessageSquare,
} from "lucide-react";

interface OwnerEscrowRoomClientProps {
  escrow: any;
  messages: any[];
  activities: any[];
  session: any;
}

export function OwnerEscrowRoomClient({ 
  escrow: initialEscrow, 
  messages: initialMessages, 
  activities: initialActivities,
  session 
}: OwnerEscrowRoomClientProps) {
  const [escrow] = useState(initialEscrow);
  const [messages, setMessages] = useState(initialMessages);
  const [activities, setActivities] = useState(initialActivities);
  const [isPending, startTransition] = useTransition();
  const [activeView, setActiveView] = useState<"INFO" | "CHAT" | "ACTIVITIES">("INFO");

  const listing = escrow.negotiation?.listing;
  const agreedPriceBtc = escrow.agreed_price_btc;
  const agreedPriceXmr = escrow.agreed_price_xmr;
  const agreedPriceIdr = (escrow as any).agreed_price_idr || 0;
  const cryptoType = (escrow as any).crypto_type || 'BTC';

  // Calculate crypto display
  const btcToIdr = 1400000000;
  const xmrToIdr = 3500000;
  const displayAgreedIdr = agreedPriceIdr || (
    cryptoType === 'BTC' 
      ? Math.round((agreedPriceBtc || 0) * btcToIdr)
      : Math.round((agreedPriceXmr || 0) * xmrToIdr)
  );

  // Actions
  async function handleHoldFunds() {
    customAlert.confirm(
      "Tahan dana dari Buyer untuk escrow ini?",
      async () => {
        startTransition(async () => {
          const result = await holdFundsAction(escrow.id);
          if (result.success) {
            customAlert.success("✓ Dana berhasil ditahan di escrow!");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            customAlert.error(result.error || "Gagal menahan dana");
          }
        });
      }
    );
  }

  async function handleReleaseFunds() {
    customAlert.confirm(
      "Lepas dana ke Seller? Transaksi akan diselesaikan. IRREVERSIBLE!",
      async () => {
        startTransition(async () => {
          const result = await releaseFundsAction(escrow.id);
          if (result.success) {
            customAlert.success("✓ Dana berhasil dilepas ke Seller! Transaksi selesai.");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            customAlert.error(result.error || "Gagal melepas dana");
          }
        });
      },
      "Konfirmasi Release Funds"
    );
  }

  async function handleVerify() {
    customAlert.confirm(
      "Verifikasi transaksi ini sebagai Midman?",
      async () => {
        startTransition(async () => {
          const result = await verifyEscrowAction(escrow.id);
          if (result.success) {
            customAlert.success("✓ Transaksi diverifikasi!");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            customAlert.error(result.error || "Gagal verifikasi");
          }
        });
      }
    );
  }

  // Handle sending messages
  async function handleSendMessage(content: string) {
    const formData = new FormData();
    formData.append("roomId", escrow.id);
    formData.append("content", content);

    const result = await sendEscrowMessageAction(formData);
    
    if (result.success) {
      // Realtime will handle updating messages
    }

    return result;
  }

  async function handleMarkAsRead(messageId: string) {
    await markEscrowMessageAsReadAction(messageId, escrow.id);
  }

  async function handleDeleteMessage(messageId: string) {
    await deleteEscrowMessageAction(messageId, escrow.id);
  }

  // Realtime setup
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("escrow_messages")
        .select("*")
        .eq("escrow_id", escrow.id)
        .order("created_at", { ascending: true });
      
      if (data) {
        setMessages(data);
      }
    };

    const fetchActivities = async () => {
      const { data } = await supabase
        .from("escrow_activities")
        .select(`
          *,
          actor:profiles(codename)
        `)
        .eq("escrow_id", escrow.id)
        .order("created_at", { ascending: false });
      
      if (data) {
        setActivities(data);
      }
    };

    // Subscribe to messages
    const messagesChannel = supabase
      .channel(`escrow_messages:${escrow.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "escrow_messages",
          filter: `escrow_id=eq.${escrow.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to activities
    const activitiesChannel = supabase
      .channel(`escrow_activities:${escrow.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "escrow_activities",
          filter: `escrow_id=eq.${escrow.id}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    // Polling for escrow updates
    const pollInterval = setInterval(() => {
      fetchMessages();
      fetchActivities();
    }, 3000);

    // Subscribe to escrow_sessions changes (for cross-user updates)
    const escrowChannel = supabase
      .channel(`escrow_session:${escrow.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "escrow_sessions",
          filter: `id=eq.${escrow.id}`,
        },
        (payload) => {
          console.log("Escrow state changed:", payload);
          // Force reload when escrow data changes
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(escrowChannel);
      clearInterval(pollInterval);
    };
  }, [escrow.id]);

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/owner"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#888] hover:text-[#39FF14] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
              <ShieldCheck size={14} />
              <span>MIDMAN ESCROW CONTROL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Escrow #{escrow.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-[#888] mt-1">
              {(escrow as any).item_title || listing?.title || "Produk"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {escrow.funds_held && !escrow.funds_released && (
              <span className="badge-warn text-xs">FUNDS HELD</span>
            )}
            {escrow.midman_verified && (
              <span className="badge-green text-xs">VERIFIED</span>
            )}
            {escrow.completed_at && (
              <span className="badge-green text-xs">COMPLETED</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info & Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Transaction Info */}
          <div className="bg-[#111] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase font-bold">Transaction Info</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#666]">Harga Deal:</span>
                <span className="text-white font-bold">Rp {displayAgreedIdr.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Crypto:</span>
                <span className="text-[#39FF14] font-mono">
                  {cryptoType === 'BTC' && agreedPriceBtc && `${agreedPriceBtc.toFixed(8)} BTC`}
                  {cryptoType === 'XMR' && agreedPriceXmr && `${agreedPriceXmr.toFixed(4)} XMR`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Payment Status:</span>
                <span className="text-[#39FF14] font-mono text-[10px]">
                  {escrow.payment_status || "AWAITING_PAYMENT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Shipment:</span>
                <span className="text-[#39FF14] font-mono text-[10px]">
                  {escrow.shipment_status || "PENDING"}
                </span>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-[#111] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase font-bold flex items-center gap-2">
              <Users size={12} />
              Parties (3)
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-[#0a0a0a] border border-[#222]">
                <span className="text-[#666]">Buyer:</span>
                <span className="text-white font-bold">{escrow.buyer?.codename}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0a0a0a] border border-[#222]">
                <span className="text-[#666]">Seller:</span>
                <span className="text-white font-bold">{escrow.seller?.codename}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#39FF14]/10 border border-[#39FF14]/50">
                <span className="text-[#39FF14] font-bold">Midman:</span>
                <span className="text-[#39FF14] font-bold">{escrow.midman?.codename || session.codename}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Status */}
          <div className="bg-[#111] border border-[#262626] p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#888] uppercase font-bold">Confirmation Status</h3>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#aaa]">Buyer Confirmed:</span>
                <span className={escrow.buyer_confirmed ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {escrow.buyer_confirmed ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#aaa]">Seller Confirmed:</span>
                <span className={escrow.seller_confirmed ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {escrow.seller_confirmed ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#aaa]">Midman Verified:</span>
                <span className={escrow.midman_verified ? "text-[#39FF14] font-bold" : "text-[#666]"}>
                  {escrow.midman_verified ? "✓ Yes" : "✗ No"}
                </span>
              </div>
            </div>
          </div>

          {/* Midman Actions */}
          <div className="bg-[#0a0a0a] border border-[#39FF14]/50 p-4 space-y-3">
            <h3 className="text-xs font-mono text-[#39FF14] uppercase font-bold flex items-center gap-2">
              <ShieldCheck size={12} />
              Midman Actions
            </h3>

            <div className="space-y-2">
              {/* Hold Funds - ONLY if payment received */}
              {!escrow.funds_held && escrow.payment_status === 'RECEIVED' && (
                <button
                  onClick={handleHoldFunds}
                  disabled={isPending}
                  className="w-full bg-[#FF6600]/10 hover:bg-[#FF6600]/20 border border-[#FF6600]/50 text-[#FF6600] py-2 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={14} />
                  <span>Tahan Dana Buyer</span>
                </button>
              )}

              {/* Warning: Waiting for payment */}
              {escrow.payment_status === 'AWAITING_PAYMENT' && (
                <div className="bg-[#FFB800]/10 border border-[#FFB800]/50 p-3 text-center">
                  <div className="text-xs text-[#FFB800]">⏳ Menunggu Buyer melakukan pembayaran</div>
                </div>
              )}

              {/* Info: Funds held */}
              {escrow.funds_held && !escrow.midman_verified && (
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-3 text-center">
                  <div className="text-xs font-bold text-[#39FF14]">🔒 Dana sudah ditahan</div>
                  <div className="text-[10px] text-[#888] mt-1">Menunggu COD selesai...</div>
                </div>
              )}

              {/* Verify Transaction */}
              {escrow.buyer_confirmed && escrow.seller_confirmed && !escrow.midman_verified && (
                <button
                  onClick={handleVerify}
                  disabled={isPending}
                  className="w-full bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  <span>Verifikasi Transaksi</span>
                </button>
              )}

              {/* Release Funds */}
              {escrow.funds_held && !escrow.funds_released && escrow.midman_verified && (
                <button
                  onClick={handleReleaseFunds}
                  disabled={isPending}
                  className="w-full bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Unlock size={14} />
                  <span>Lepas Dana ke Seller</span>
                </button>
              )}

              {escrow.funds_released && (
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-3 text-center">
                  <div className="text-xs font-bold text-[#39FF14] mb-1">✓ Dana Sudah Dilepas</div>
                  <div className="text-[10px] text-[#888]">Transaksi selesai</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chat & Activities */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-[#222]">
            {[
              { id: "INFO", label: "Info", icon: Package },
              { id: "CHAT", label: "Chat", icon: MessageSquare, count: messages.length },
              { id: "ACTIVITIES", label: "Activity Log", icon: Activity, count: activities.length },
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`px-4 py-3 text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                  activeView === id
                    ? "text-[#39FF14] border-b-2 border-[#39FF14]"
                    : "text-[#666] hover:text-[#aaa]"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
                {count !== undefined && <span className="text-[10px]">({count})</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeView === "INFO" && (
            <div className="bg-[#111] border border-[#262626] p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Informasi Escrow</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[#666] mb-1">Escrow ID:</div>
                  <div className="text-white font-mono">{escrow.id}</div>
                </div>
                <div>
                  <div className="text-[#666] mb-1">Created:</div>
                  <div className="text-white">
                    {new Date(escrow.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[#666] mb-1">Funds Held:</div>
                  <div className={escrow.funds_held ? "text-[#39FF14]" : "text-[#666]"}>
                    {escrow.funds_held ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <div className="text-[#666] mb-1">Funds Released:</div>
                  <div className={escrow.funds_released ? "text-[#39FF14]" : "text-[#666]"}>
                    {escrow.funds_released ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {escrow.midman_notes && (
                <div className="pt-4 border-t border-[#222]">
                  <div className="text-[#666] text-xs mb-2">Midman Notes:</div>
                  <div className="text-white text-sm bg-[#0a0a0a] border border-[#222] p-3">
                    {escrow.midman_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === "CHAT" && (
            <div className="bg-[#111] border border-[#262626] h-[600px] flex flex-col">
              <div className="border-b border-[#222] px-4 py-3 bg-[#0f0f0f]">
                <h3 className="text-xs font-mono text-white uppercase tracking-wider font-bold flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#39FF14]" />
                  <span>3-Way Chat (Buyer ↔ Midman ↔ Seller)</span>
                </h3>
              </div>

              <MessageThread
                messages={messages}
                currentUserId={session.userId}
                onSendMessage={handleSendMessage}
                onMarkAsRead={handleMarkAsRead}
                onDeleteMessage={handleDeleteMessage}
                placeholder="Kirim pesan ke Buyer & Seller..."
                emptyStateText="Belum ada komunikasi dalam escrow ini"
                enableSelfDestruct={false}
              />
            </div>
          )}

          {activeView === "ACTIVITIES" && (
            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="bg-[#111] border border-[#222] p-12 text-center">
                  <Activity size={40} className="mx-auto text-[#444] mb-3" />
                  <div className="text-white font-bold mb-1">Belum Ada Activity</div>
                  <p className="text-xs text-[#777]">Semua aktivitas escrow akan tercatat di sini.</p>
                </div>
              ) : (
                activities.map((activity: any) => (
                  <div key={activity.id} className="bg-[#111] border border-[#222] p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-mono text-[#39FF14] font-bold mb-1">
                          {activity.action}
                        </div>
                        <div className="text-xs text-[#aaa]">{activity.description}</div>
                      </div>
                      <div className="text-xs text-[#666] font-mono">
                        {new Date(activity.created_at).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-[#888]">
                      By: <span className="text-white font-bold">{activity.actor?.codename || "System"}</span> ({activity.actor_role})
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
