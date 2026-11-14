// ============================================================
// PIXMART — Supabase Client & Realtime WebSocket Channel Engine
// ============================================================

import { createClient, type SupabaseClient, type RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tcfboerfdttdwybecway.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ghkFgxIGj9o8d0wclQRF4g_eu8HkG_R";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

/**
 * Join Escrow Room Realtime Channel for Presence & Cross-Device Sync
 */
export function joinEscrowChannel(
  roomId: string,
  userPresence: {
    userId: string;
    codename: string;
    role: "BUYER" | "SELLER" | "OWNER";
  },
  onEvent: (event: string, payload: any) => void,
  onPresenceSync: (presences: any[]) => void
): { channel: RealtimeChannel; unsubscribe: () => void } {
  const supabase = getSupabase();
  const channelName = `escrow-room:${roomId}`;

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: true },
      presence: { key: `${userPresence.role.toLowerCase()}-${userPresence.userId}` },
    },
  });

  // Listen to broadcast events (handshake, meeting, chat, arrival, confirm, dispute)
  channel.on("broadcast", { event: "*" }, (envelope: any) => {
    if (envelope.event && envelope.payload) {
      onEvent(envelope.event, envelope.payload);
    }
  });

  // Track presence changes
  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    const presencesList: any[] = [];
    Object.values(state).forEach((items: any) => {
      items.forEach((p: any) => presencesList.push(p));
    });
    onPresenceSync(presencesList);
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        userId: userPresence.userId,
        codename: userPresence.codename,
        role: userPresence.role,
        onlineAt: new Date().toISOString(),
      });
    }
  });

  return {
    channel,
    unsubscribe: () => {
      channel.unsubscribe();
    },
  };
}

/**
 * Join Negotiation Channel for Realtime Offers & Chat
 */
export function joinNegotiationChannel(
  negotiationId: string,
  onEvent: (event: string, payload: any) => void
): { channel: RealtimeChannel; broadcast: (event: string, payload: any) => Promise<void>; unsubscribe: () => void } {
  const supabase = getSupabase();
  const channelName = `negotiation:${negotiationId}`;

  const channel = supabase.channel(channelName, {
    config: { broadcast: { self: true } },
  });

  channel.on("broadcast", { event: "*" }, (envelope: any) => {
    if (envelope.event && envelope.payload) {
      onEvent(envelope.event, envelope.payload);
    }
  });

  channel.subscribe();

  return {
    channel,
    broadcast: async (event: string, payload: any) => {
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
    },
    unsubscribe: () => {
      channel.unsubscribe();
    },
  };
}
