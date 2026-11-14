// ============================================================
// PIXMART — Clean Initial State (No Dummy Data)
// ============================================================

import type { User, Listing, EscrowRoom, Negotiation } from "@/lib/types";

export const SEED_USERS: User[] = [
  {
    id: "usr_owner_01",
    codename: "System Root",
    email: "owner@pixmart.local",
    role: "OWNER",
    reputation: 100,
    completedDeals: 0,
    locationCity: "Jakarta",
    locationDistrict: "Pusat",
    avatarSeed: "op00",
    createdAt: new Date("2026-01-01"),
  },
];

export const SEED_LISTINGS: Listing[] = [];
export const SEED_NEGOTIATIONS: Negotiation[] = [];
export const SEED_ESCROW_ROOMS: EscrowRoom[] = [];
export const SEED_ORDERS: EscrowRoom[] = SEED_ESCROW_ROOMS;
