// ============================================================
// PIXMART — Anonymous P2P Local Marketplace Types
// ============================================================

export type UserRole = "OWNER" | "SELLER" | "BUYER";

export interface User {
  id: string;
  codename: string; // e.g. "Anonymous Buyer #8821", "Anonymous Seller #1042"
  email: string;
  role: UserRole;
  reputation: number; // 0 - 100%
  completedDeals: number;
  locationCity: string;
  locationDistrict?: string;
  avatarSeed: string;
  walletBtc?: string;
  walletXmr?: string;
  balanceBtc?: number; // Saldo simulasi BTC
  balanceXmr?: number; // Saldo simulasi XMR
  depositAddressBtc?: string; // Generated deposit address untuk top up
  depositAddressXmr?: string; // Generated deposit address untuk top up
  passwordHash?: string;
  setupCompleted?: boolean;
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
  // Location & Privacy
  locationCity: string; // e.g. "Buleleng" or "Jakarta Selatan"
  locationDistrict: string; // e.g. "Gerokgak" or "Kebayoran Baru"
  locationRegion: string; // e.g. "Bali" or "DKI Jakarta"
  approxLatitude: number;
  approxLongitude: number;
  meetupZone: string; // Public zone e.g. "Area Publik Sekitar Gerokgak / Pertokoan"
  meetingAvailability?: string; // e.g. "Senin-Jumat sore atau weekend bebas"
  condition: "MINT / NEW" | "EXCELLENT" | "USED_TESTED";
  stock: number;
  legalStatusGuarantee: boolean; // 100% legal item verified
  images: string[];
  status: "ACTIVE" | "IN_NEGOTIATION" | "IN_ESCROW" | "SOLD" | "CANCELLED";
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Sanitized listing safe for public display (No exact coordinates or addresses)
export interface PublicListingItem extends Listing {
  seller: {
    id: string;
    codename: string;
    reputation: number;
    completedDeals: number;
    approxCity: string;
  };
  approxLocationText: string; // e.g. "Gerokgak, Buleleng"
  approxLocation?: string;
  distanceKm?: number | null;
  distanceFormatted?: string;
  isWishlisted?: boolean;
}

// Backward compatibility
export interface ListingWithSeller extends Listing {
  seller: User;
}

// ============================================================
// NEGOTIATION SYSTEM
// ============================================================

export type NegotiationStatus =
  | "PENDING"
  | "COUNTER_OFFER"
  | "ACCEPTED"
  | "CANCELLED";

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderRole: "BUYER" | "SELLER" | "SYSTEM";
  messageType: "TEXT" | "OFFER" | "COUNTER_OFFER" | "ACCEPT" | "REJECT" | "DEAL_LOCKED";
  amount?: number; // In IDR fiat
  content: string;
  createdAt: Date;
}

export interface Negotiation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: NegotiationStatus;
  currentOfferPrice: number; // In IDR
  currentOfferBtc: number;
  currentOfferXmr: number;
  lastOfferBy: "BUYER" | "SELLER";
  messages: NegotiationMessage[];
  escrowRoomId?: string; // Generated once deal is agreed
  createdAt: Date;
  updatedAt: Date;
}

export interface NegotiationWithDetails extends Negotiation {
  listing: Listing;
  buyer: User;
  seller: User;
}

// ============================================================
// ESCROW ROOM & MEETING POINT SYSTEM
// ============================================================

export type EscrowHandshakeStatus =
  | "WAITING_FOR_BUYER"
  | "WAITING_FOR_SELLER"
  | "BUYER_CONNECTED"
  | "SELLER_CONNECTED"
  | "BOTH_CONNECTED";

export type MeetingStatus =
  | "MEETING_PENDING" // Belum menentukan tempat/waktu
  | "MEETING_PROPOSED" // Salah satu pihak mengusulkan
  | "MEETING_CONFIRMED" // Kedua pihak setuju
  | "MEETING_STARTED" // Keduanya menyatakan sudah bertemu (arrival)
  | "COD_PENDING" // Transaksi serah terima & cek fisik sedang berlangsung
  | "COMPLETED" // Transaksi selesai (kedua pihak confirm)
  | "CANCELLED" // Transaksi dibatalkan
  | "DISPUTED"; // Terjadi dispute

export interface MeetingProposal {
  proposedBy: "BUYER" | "SELLER";
  locationName: string; // e.g. "Mall Blok M Plaza Lantai Dasar (Area Publik)"
  areaNote: string; // e.g. "Dekat kasir Starbucks"
  proposedDate: string; // YYYY-MM-DD
  proposedTime: string; // HH:mm
  status: "PENDING" | "ACCEPTED" | "COUNTERED";
  proposedAt: Date;
}

export interface MeetingConfirmed {
  locationName: string;
  areaNote: string;
  dateTime: string;
  confirmedAt: Date;
}

export interface EscrowChatMessage {
  id: string;
  escrowRoomId: string;
  senderId: string;
  senderRole: "BUYER" | "SELLER" | "SYSTEM";
  content: string;
  messageType: "TEXT" | "SYSTEM_EVENT" | "MEETING_PROPOSAL" | "ARRIVAL" | "CONFIRMATION";
  createdAt: Date;
}

export interface DisputeDetails {
  raisedBy: "BUYER" | "SELLER";
  reason: string;
  description: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date | null;
  resolutionNote?: string;
  resolvedByRole?: "OWNER";
}

export interface EscrowRoom {
  id: string; // e.g. "ESC-8821"
  transactionId: string;
  negotiationId?: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  finalPriceIdr: number;
  cryptoCurrency: CryptoCurrency;
  cryptoAmount: number;

  // Handshake Presence
  handshakeStatus: EscrowHandshakeStatus;
  buyerConnected: boolean;
  sellerConnected: boolean;

  // Meeting Coordination
  meetingStatus: MeetingStatus;
  meetingProposal?: MeetingProposal | null;
  meetingConfirmed?: MeetingConfirmed | null;

  // Arrival Confirmation ("I'm here")
  buyerArrived: boolean;
  sellerArrived: boolean;
  buyerArrivedAt?: Date | null;
  sellerArrivedAt?: Date | null;

  // COD Double Confirmation
  buyerConfirmedReceived: boolean;
  sellerConfirmedHandedOver: boolean;
  buyerConfirmedAt?: Date | null;
  sellerConfirmedAt?: Date | null;

  // Dispute
  dispute?: DisputeDetails | null;

  messages: EscrowChatMessage[];
  createdAt: Date;
  updatedAt: Date;

  // Compatibility fields for legacy views
  orderNumber?: string;
  status?: any;
  depositAddress?: string;
  txHash?: string;
  handshakeOtp?: string;
  meetupLocation?: string;
}

export interface EscrowRoomWithDetails extends EscrowRoom {
  listing: Listing;
  seller: User;
  buyer: User;
}


