// ============================================================
// ARCADE PROTOCOL — Anonymous P2P Legal Marketplace Types
// ============================================================

export type UserRole = "OWNER" | "SELLER" | "BUYER";

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: string;
  codename: string; // e.g. "Cipher_99", "NeonGhost", "Satoshi_JKT"
  email: string;
  role: UserRole;
  reputation: number; // 0 - 100%
  completedDeals: number;
  locationCity: string;
  avatarSeed: string;
  walletBtc?: string;
  walletXmr?: string;
  createdAt: Date;
}

export type CryptoCurrency = "BTC" | "XMR";

export type ListingCategory =
  | "HARDWARE_GADGETS"
  | "RETRO_CONSOLES"
  | "KEYBOARDS_TECH"
  | "CAMERAS_OPTICS"
  | "TIMEPIECES_WATCHES"
  | "COLLECTIBLES_EDC";

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: ListingCategory;
  priceBtc: number;
  priceXmr: number;
  fiatEstimateIdr: number;
  locationCity: string;
  meetupZone: string; // e.g. "Jakarta Selatan - Blok M Square"
  condition: "MINT / NEW" | "EXCELLENT" | "USED_TESTED";
  legalStatusGuarantee: boolean; // 100% legal item verified
  images: string[];
  status: "ACTIVE" | "IN_ESCROW" | "SOLD" | "CANCELLED";
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EscrowStatus =
  | "LOCKED_PAYMENT_PENDING"
  | "ESCROW_FUNDED"
  | "MEETUP_IN_PROGRESS"
  | "BUYER_CONFIRMED"
  | "SELLER_CONFIRMED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED";

export interface EscrowOrder {
  id: string;
  orderNumber: string; // e.g. "ARC-8829-XMR"
  listingId: string;
  sellerId: string;
  buyerId: string;
  cryptoCurrency: CryptoCurrency;
  cryptoAmount: number;
  depositAddress: string;
  txHash: string;
  meetupLocation: string;
  meetupScheduleNotes: string;
  handshakeOtp: string; // Secret 4-digit code shown at meetup
  buyerConfirmedAt?: Date | null;
  sellerConfirmedAt?: Date | null;
  status: EscrowStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Joined / Enriched view models
export interface ListingWithSeller extends Listing {
  seller: User;
}

export interface EscrowOrderWithDetails extends EscrowOrder {
  listing: Listing;
  seller: User;
  buyer: User;
}

export interface PlatformMetrics {
  totalVolumeBtc: number;
  totalVolumeXmr: number;
  activeEscrowsCount: number;
  completedDealsCount: number;
  disputeRatePct: number;
  activeNodesCount: number;
  recentOrders: EscrowOrderWithDetails[];
  trafficFeed: {
    id: string;
    type: "DEPOSIT" | "HANDSHAKE" | "RELEASE" | "LISTING";
    title: string;
    amount?: string;
    city: string;
    timestamp: Date;
  }[];
}
