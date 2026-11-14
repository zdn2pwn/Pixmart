// ============================================================
// ARCADE PROTOCOL — In-Memory Escrow & P2P Marketplace Store
// ============================================================

import type {
  User,
  UserRole,
  Listing,
  EscrowOrder,
  ListingWithSeller,
  EscrowOrderWithDetails,
  PlatformMetrics,
  CryptoCurrency,
} from "@/lib/types";

import {
  SEED_USERS,
  SEED_LISTINGS,
  SEED_ORDERS,
} from "@/lib/data/seed";

class MarketplaceStore {
  private users: User[] = [...SEED_USERS];
  private listings: Listing[] = [...SEED_LISTINGS];
  private orders: EscrowOrder[] = [...SEED_ORDERS];
  private nextOrderNum = 7702;

  // ============================================================
  // USERS & SESSIONS
  // ============================================================

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | null {
    return this.users.find((u) => u.id === id) ?? null;
  }

  getUserByEmail(email: string): User | null {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  authenticate(role: UserRole): User {
    // Quick demo switch for Owner, Seller, Buyer
    const user = this.users.find((u) => u.role === role);
    return user || this.users[0];
  }

  authenticateUser(email: string, _password?: string): User | null {
    const user = this.getUserByEmail(email);
    if (user) return user;
    // Fallback: check if codename matches or fallback to first user
    return this.users.find((u) => u.codename.toLowerCase() === email.toLowerCase()) || null;
  }

  // ============================================================
  // LISTINGS
  // ============================================================

  getListings(filters?: {
    city?: string;
    category?: string;
    search?: string;
    status?: string;
  }): ListingWithSeller[] {
    return this.listings
      .filter((l) => {
        if (filters?.status && filters.status !== "ALL" && l.status !== filters.status) {
          return false;
        }
        if (filters?.city && filters.city !== "ALL" && l.locationCity !== filters.city) {
          return false;
        }
        if (filters?.category && filters.category !== "ALL" && l.category !== filters.category) {
          return false;
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          const match =
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.meetupZone.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .map((l) => this.enrichListing(l));
  }

  getActiveListings(): ListingWithSeller[] {
    return this.listings
      .filter((l) => l.status === "ACTIVE")
      .map((l) => this.enrichListing(l));
  }

  getListingById(id: string): ListingWithSeller | null {
    const l = this.listings.find((item) => item.id === id);
    if (!l) return null;
    l.views += 1; // view count increment
    return this.enrichListing(l);
  }

  createListing(data: {
    sellerId: string;
    title: string;
    description: string;
    category: any;
    priceBtc: number;
    priceXmr: number;
    fiatEstimateIdr: number;
    locationCity: string;
    meetupZone: string;
    condition: any;
    images?: string[];
  }): Listing {
    const listing: Listing = {
      id: `lst_${Date.now()}`,
      sellerId: data.sellerId,
      title: data.title,
      description: data.description,
      category: data.category,
      priceBtc: data.priceBtc,
      priceXmr: data.priceXmr,
      fiatEstimateIdr: data.fiatEstimateIdr,
      locationCity: data.locationCity,
      meetupZone: data.meetupZone,
      condition: data.condition,
      legalStatusGuarantee: true,
      images: data.images && data.images.length > 0 ? data.images : [],
      status: "ACTIVE",
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.listings.unshift(listing);
    return listing;
  }

  private enrichListing(l: Listing): ListingWithSeller {
    const seller = this.users.find((u) => u.id === l.sellerId) || this.users[1];
    return { ...l, seller };
  }

  // ============================================================
  // ESCROW ORDERS & DUAL-HANDSHAKE ENGINE
  // ============================================================

  createEscrowOrder(params: {
    listingId: string;
    buyerId: string;
    cryptoCurrency: CryptoCurrency;
    meetupLocation: string;
    meetupScheduleNotes: string;
  }): { success: boolean; order?: EscrowOrderWithDetails; error?: string } {
    const listing = this.listings.find((l) => l.id === params.listingId);
    if (!listing) return { success: false, error: "Barang tidak ditemukan" };
    if (listing.status !== "ACTIVE") {
      return { success: false, error: "Barang sedang dalam transaksi lain atau sudah terjual" };
    }

    const seller = this.users.find((u) => u.id === listing.sellerId);
    if (!seller) return { success: false, error: "Penjual tidak valid" };

    const cryptoAmount =
      params.cryptoCurrency === "BTC" ? listing.priceBtc : listing.priceXmr;

    // Generate simulated cryptographic deposit subaddress
    const depositAddress =
      params.cryptoCurrency === "BTC"
        ? `bc1qarcade_escrow_${Math.random().toString(36).substring(2, 10)}_lock`
        : `888tArcadeStealthEscrow${Math.random().toString(36).substring(2, 12)}Monero`;

    const txHash = `${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
    const handshakeOtp = String(Math.floor(1000 + Math.random() * 9000));

    const order: EscrowOrder = {
      id: `ord_${Date.now()}`,
      orderNumber: `ARC-${this.nextOrderNum++}-${params.cryptoCurrency}`,
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerId: params.buyerId,
      cryptoCurrency: params.cryptoCurrency,
      cryptoAmount,
      depositAddress,
      txHash,
      meetupLocation: params.meetupLocation || listing.meetupZone,
      meetupScheduleNotes: params.meetupScheduleNotes || "Sesuai kesepakatan lokasi publik",
      handshakeOtp,
      buyerConfirmedAt: null,
      sellerConfirmedAt: null,
      status: "MEETUP_IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update listing status
    listing.status = "IN_ESCROW";
    this.orders.unshift(order);

    return { success: true, order: this.enrichOrder(order) };
  }

  getOrderById(id: string): EscrowOrderWithDetails | null {
    const o = this.orders.find((item) => item.id === id);
    if (!o) return null;
    return this.enrichOrder(o);
  }

  getAllOrders(): EscrowOrderWithDetails[] {
    return this.orders.map((o) => this.enrichOrder(o));
  }

  getOrdersByUser(userId: string): EscrowOrderWithDetails[] {
    return this.orders
      .filter((o) => o.buyerId === userId || o.sellerId === userId)
      .map((o) => this.enrichOrder(o));
  }

  // ============================================================
  // DUAL CONFIRMATION HANDSHAKE
  // ============================================================

  confirmHandshake(
    orderId: string,
    role: "BUYER" | "SELLER"
  ): { success: boolean; order?: EscrowOrderWithDetails; bothConfirmed: boolean; error?: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, bothConfirmed: false, error: "Pesanan tidak ditemukan" };

    const now = new Date();

    if (role === "BUYER") {
      order.buyerConfirmedAt = now;
    } else if (role === "SELLER") {
      order.sellerConfirmedAt = now;
    }

    // Check if BOTH confirmed
    const bothConfirmed = !!(order.buyerConfirmedAt && order.sellerConfirmedAt);

    if (bothConfirmed) {
      order.status = "COMPLETED";
      // Mark listing as SOLD
      const listing = this.listings.find((l) => l.id === order.listingId);
      if (listing) {
        listing.status = "SOLD";
      }

      // Increase reputations
      const seller = this.users.find((u) => u.id === order.sellerId);
      if (seller) seller.completedDeals += 1;
      const buyer = this.users.find((u) => u.id === order.buyerId);
      if (buyer) buyer.completedDeals += 1;
    } else {
      order.status =
        role === "BUYER" ? "BUYER_CONFIRMED" : "SELLER_CONFIRMED";
    }

    order.updatedAt = now;
    return {
      success: true,
      order: this.enrichOrder(order),
      bothConfirmed,
    };
  }

  private enrichOrder(o: EscrowOrder): EscrowOrderWithDetails {
    const listing = this.listings.find((l) => l.id === o.listingId)!;
    const seller = this.users.find((u) => u.id === o.sellerId)!;
    const buyer = this.users.find((u) => u.id === o.buyerId)!;
    return { ...o, listing, seller, buyer };
  }

  // ============================================================
  // OWNER / OPERATOR TELEMETRY
  // ============================================================

  getPlatformMetrics(): PlatformMetrics {
    const totalVolumeBtc = this.orders
      .filter((o) => o.cryptoCurrency === "BTC")
      .reduce((sum, o) => sum + o.cryptoAmount, 0);

    const totalVolumeXmr = this.orders
      .filter((o) => o.cryptoCurrency === "XMR")
      .reduce((sum, o) => sum + o.cryptoAmount, 0);

    const activeEscrows = this.orders.filter(
      (o) => o.status !== "COMPLETED" && o.status !== "REFUNDED"
    );

    const completed = this.orders.filter((o) => o.status === "COMPLETED");

    return {
      totalVolumeBtc,
      totalVolumeXmr,
      activeEscrowsCount: activeEscrows.length,
      completedDealsCount: completed.length,
      disputeRatePct: 0.0,
      activeNodesCount: this.users.length,
      recentOrders: this.getAllOrders().slice(0, 8),
      trafficFeed: [
        {
          id: "tf_01",
          type: "HANDSHAKE",
          title: "Dual confirmation signed",
          amount: "1.05 XMR",
          city: "Bandung - Dago",
          timestamp: new Date(),
        },
        {
          id: "tf_02",
          type: "DEPOSIT",
          title: "Escrow multisig funded",
          amount: "0.0034 BTC",
          city: "Jakarta Selatan",
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
          id: "tf_03",
          type: "RELEASE",
          title: "Escrow vault released to merchant",
          amount: "1.42 XMR",
          city: "Surabaya - Gubeng",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          id: "tf_04",
          type: "LISTING",
          title: "New verified legal hardware listed",
          amount: "0.0125 BTC",
          city: "Jakarta Pusat",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
      ],
    };
  }
}

// Global singleton
const globalForStore = globalThis as unknown as { arcadeMarketplace: MarketplaceStore };
export const store = globalForStore.arcadeMarketplace ?? new MarketplaceStore();
if (process.env.NODE_ENV !== "production") globalForStore.arcadeMarketplace = store;
