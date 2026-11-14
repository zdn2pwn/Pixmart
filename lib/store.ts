// ============================================================
// PIXMART — Authoritative Store with Realtime & Local Persistence
// ============================================================

import fs from "fs";
import path from "path";
import type {
  User,
  UserRole,
  Listing,
  PublicListingItem,
  ListingWithSeller,
  Negotiation,
  NegotiationWithDetails,
  NegotiationMessage,
  EscrowRoom,
  EscrowRoomWithDetails,
  AuditLogEntry,
  SystemNotification,
  PlatformMetrics,
  CryptoCurrency,
} from "@/lib/types";

import {
  SEED_USERS,
  SEED_LISTINGS,
  SEED_NEGOTIATIONS,
  SEED_ORDERS,
  SEED_ESCROW_ROOMS,
} from "@/lib/data/seed";

import { calculateDistanceKm, formatDistance, type Coordinates } from "@/lib/location";
import { generateBtcAddress, generateXmrAddress, hashPassword } from "@/lib/crypto-wallet";

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "pixmart-state.json");

interface PersistedState {
  users: User[];
  listings: Listing[];
  negotiations: Negotiation[];
  escrowRooms: EscrowRoom[];
  wishlists: Record<string, string[]>; // userId -> listingId[]
  auditLogs: AuditLogEntry[];
  notifications: SystemNotification[];
}

class MarketplaceStore {
  private users: User[] = [];
  private listings: Listing[] = [];
  private negotiations: Negotiation[] = [];
  private escrowRooms: EscrowRoom[] = [];
  private wishlists: Record<string, string[]> = {};
  private auditLogs: AuditLogEntry[] = [];
  private notifications: SystemNotification[] = [];

  constructor() {
    this.loadState();
  }

  // ============================================================
  // PERSISTENCE (File-backed JSON for reliable local persistence)
  // ============================================================

  private loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        const parsed: PersistedState = JSON.parse(raw);
        this.users = parsed.users.map((u) => ({ ...u, createdAt: new Date(u.createdAt) }));
        this.listings = parsed.listings.map((l) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt),
        }));
        this.negotiations = parsed.negotiations.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
          messages: n.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
        }));
        this.escrowRooms = parsed.escrowRooms.map((e) => ({
          ...e,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
          buyerConfirmedAt: e.buyerConfirmedAt ? new Date(e.buyerConfirmedAt) : null,
          sellerConfirmedAt: e.sellerConfirmedAt ? new Date(e.sellerConfirmedAt) : null,
          buyerArrivedAt: e.buyerArrivedAt ? new Date(e.buyerArrivedAt) : null,
          sellerArrivedAt: e.sellerArrivedAt ? new Date(e.sellerArrivedAt) : null,
          messages: e.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
        }));
        this.wishlists = parsed.wishlists || {};
        this.auditLogs = (parsed.auditLogs || []).map((a) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        this.notifications = (parsed.notifications || []).map((notif) => ({
          ...notif,
          createdAt: new Date(notif.createdAt),
        }));
        return;
      }
    } catch (e) {
      console.warn("Failed to load persisted state, falling back to seed", e);
    }

    // Clean Initial State (No Dummy Data)
    this.users = [...SEED_USERS];
    this.listings = [...SEED_LISTINGS];
    this.negotiations = [...SEED_NEGOTIATIONS];
    this.escrowRooms = [...SEED_ESCROW_ROOMS];
    this.wishlists = {};
    this.auditLogs = [];
    this.notifications = [];
    this.saveState();
  }

  private saveState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data: PersistedState = {
        users: this.users,
        listings: this.listings,
        negotiations: this.negotiations,
        escrowRooms: this.escrowRooms,
        wishlists: this.wishlists,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save state to disk", e);
    }
  }

  // ============================================================
  // USERS & ROLES
  // ============================================================

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | null {
    return this.users.find((u) => u.id === id) ?? null;
  }

  getUserByEmail(email: string): User | null {
    if (!email) return null;
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  authenticateUser(email: string, password?: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user) {
      return this.users.find((u) => u.codename.toLowerCase() === email.toLowerCase()) || null;
    }
    if (password && user.passwordHash) {
      const incomingHash = hashPassword(password);
      if (user.passwordHash !== incomingHash) {
        return null;
      }
    }
    return user;
  }

  createUser(data: {
    id?: string;
    email: string;
    password?: string;
    role: UserRole;
    codename?: string;
    locationCity?: string;
    locationDistrict?: string;
    walletBtc?: string;
    walletXmr?: string;
  }): User {
    const userId =
      data.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `usr_${Date.now()}`);
    const codename =
      data.codename ||
      `Anonymous ${data.role === "SELLER" ? "Seller" : "Buyer"} #${userId.slice(-4).toUpperCase()}`;
    const passwordHash = data.password ? hashPassword(data.password) : undefined;

    const newUser: User = {
      id: userId,
      codename,
      email: data.email,
      role: data.role,
      reputation: 100,
      completedDeals: 0,
      locationCity: data.locationCity || "Jakarta",
      locationDistrict: data.locationDistrict || "Pusat",
      avatarSeed: codename,
      walletBtc: data.walletBtc || "",
      walletXmr: data.walletXmr || "",
      balanceBtc: data.role === "BUYER" ? 0.05 : 0.0,
      balanceXmr: data.role === "BUYER" ? 3.5 : 0.0,
      depositAddressBtc: generateBtcAddress(userId),
      depositAddressXmr: generateXmrAddress(userId),
      passwordHash,
      setupCompleted: false,
      createdAt: new Date(),
    };

    const existingIdx = this.users.findIndex((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existingIdx !== -1) {
      this.users[existingIdx] = newUser;
    } else {
      this.users.push(newUser);
    }

    this.saveState();
    return newUser;
  }

  topUpUserBalance(
    userId: string,
    currency: "BTC" | "XMR",
    amount: number
  ): { success: boolean; newBalance: number } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, newBalance: 0 };
    if (currency === "BTC") {
      user.balanceBtc = Number(((user.balanceBtc || 0) + amount).toFixed(6));
      this.saveState();
      return { success: true, newBalance: user.balanceBtc };
    } else {
      user.balanceXmr = Number(((user.balanceXmr || 0) + amount).toFixed(4));
      this.saveState();
      return { success: true, newBalance: user.balanceXmr };
    }
  }

  updateUserBiodata(
    userId: string,
    data: {
      role?: UserRole;
      locationCity?: string;
      locationDistrict?: string;
      walletBtc?: string;
      walletXmr?: string;
    }
  ): User | null {
    let user = this.getUserById(userId);
    if (!user) {
      user = this.ensureUser({
        id: userId,
        email: `${userId}@pixmart.local`,
        codename: `Anon_#${userId.slice(0, 4).toUpperCase()}`,
        role: data.role || "BUYER",
      });
    }

    if (data.role) user.role = data.role;
    if (data.locationCity) user.locationCity = data.locationCity;
    if (data.locationDistrict) user.locationDistrict = data.locationDistrict;
    if (data.walletBtc) user.walletBtc = data.walletBtc;
    if (data.walletXmr) user.walletXmr = data.walletXmr;
    user.setupCompleted = true;

    // Generate anonymous codename based on role
    user.codename = `Anonymous ${user.role === "SELLER" ? "Seller" : "Buyer"} #${user.id.slice(0, 4).toUpperCase()}`;

    // Ensure wallet deposit address & initial balance
    if (!user.depositAddressBtc) user.depositAddressBtc = generateBtcAddress(user.id);
    if (!user.depositAddressXmr) user.depositAddressXmr = generateXmrAddress(user.id);
    if (user.role === "BUYER" && (user.balanceBtc === undefined || user.balanceBtc === 0)) {
      user.balanceBtc = 0.05;
      user.balanceXmr = 3.5;
    } else if (user.role === "SELLER" && (user.balanceBtc === undefined || user.balanceBtc === 0)) {
      user.balanceBtc = 0.02;
      user.balanceXmr = 1.25;
    }

    this.saveState();
    return user;
  }

  withdrawSellerBalance(
    sellerId: string,
    currency: "BTC" | "XMR",
    amount: number,
    destinationAddress: string
  ): { success: boolean; newBalance: number; error?: string; txHash?: string } {
    const user = this.getUserById(sellerId);
    if (!user) return { success: false, newBalance: 0, error: "Akun seller tidak ditemukan" };

    if (!amount || amount <= 0) {
      return { success: false, newBalance: 0, error: "Jumlah penarikan harus lebih dari 0" };
    }

    if (currency === "BTC") {
      const cur = user.balanceBtc || 0;
      if (cur < amount) {
        return { success: false, newBalance: cur, error: `Saldo Bitcoin tidak mencukupi (Tersedia: ${cur} BTC)` };
      }
      user.balanceBtc = Number((cur - amount).toFixed(6));
      const txHash = "btc_tx_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      this.recordAuditLog(
        sellerId,
        "SELLER",
        "WITHDRAW_PROCESSED",
        txHash,
        `Penarikan ${amount} BTC ke ${destinationAddress}`
      );
      this.saveState();
      return { success: true, newBalance: user.balanceBtc, txHash };
    } else {
      const cur = user.balanceXmr || 0;
      if (cur < amount) {
        return { success: false, newBalance: cur, error: `Saldo Monero tidak mencukupi (Tersedia: ${cur} XMR)` };
      }
      user.balanceXmr = Number((cur - amount).toFixed(4));
      const txHash = "xmr_tx_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      this.recordAuditLog(
        sellerId,
        "SELLER",
        "WITHDRAW_PROCESSED",
        txHash,
        `Penarikan ${amount} XMR ke ${destinationAddress}`
      );
      this.saveState();
      return { success: true, newBalance: user.balanceXmr, txHash };
    }
  }

  getFallbackUser(id: string, role: UserRole = "SELLER"): User {
    return {
      id,
      codename: `Anonymous ${role === "SELLER" ? "Seller" : "Buyer"} #${id ? id.slice(-4) : "0000"}`,
      email: `${id}@pixmart.local`,
      role,
      reputation: 100,
      completedDeals: 0,
      locationCity: "Jakarta",
      avatarSeed: id || "pix",
      balanceBtc: role === "BUYER" ? 0.05 : 0.0,
      balanceXmr: role === "BUYER" ? 3.5 : 0.0,
      depositAddressBtc: generateBtcAddress(id),
      depositAddressXmr: generateXmrAddress(id),
      createdAt: new Date(),
    };
  }

  getUserByRole(role: UserRole): User {
    const u = this.users.find((user) => user.role === role);
    return u || this.users[0] || this.getFallbackUser("usr_system", "OWNER");
  }

  ensureUser(data: { id: string; codename: string; email: string; role: UserRole }): User {
    const existing = this.users.find((u) => u.id === data.id);
    if (existing) {
      existing.role = data.role;
      if (data.codename) existing.codename = data.codename;
      if (data.email) existing.email = data.email;
      if (!existing.depositAddressBtc) existing.depositAddressBtc = generateBtcAddress(existing.id);
      if (!existing.depositAddressXmr) existing.depositAddressXmr = generateXmrAddress(existing.id);
      this.saveState();
      return existing;
    }
    const newUser: User = {
      id: data.id,
      codename: data.codename || `Anon_${data.role === "SELLER" ? "Seller" : "Buyer"}_#${data.id.slice(0, 4).toUpperCase()}`,
      email: data.email,
      role: data.role,
      reputation: 100,
      completedDeals: 0,
      locationCity: "Jakarta",
      avatarSeed: data.codename || data.id,
      balanceBtc: data.role === "BUYER" ? 0.05 : 0.0,
      balanceXmr: data.role === "BUYER" ? 3.5 : 0.0,
      depositAddressBtc: generateBtcAddress(data.id),
      depositAddressXmr: generateXmrAddress(data.id),
      createdAt: new Date(),
    };
    this.users.push(newUser);
    this.saveState();
    return newUser;
  }

  // ============================================================
  // LISTINGS & LOCATION-BASED SEARCH
  // ============================================================

  getListings(filters?: {
    city?: string;
    category?: string;
    search?: string;
    status?: string;
  }): ListingWithSeller[] {
    return this.listings
      .filter((l) => {
        if (filters?.status && filters.status !== "ALL" && l.status !== filters.status) return false;
        if (filters?.city && filters.city !== "ALL" && l.locationCity.toLowerCase() !== filters.city.toLowerCase()) return false;
        if (filters?.category && filters.category !== "ALL" && l.category !== filters.category) return false;
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          if (!l.title.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q) && !l.locationCity.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .map((l) => {
        const seller = this.getUserById(l.sellerId) || this.getFallbackUser(l.sellerId, "SELLER");
        return { ...l, seller };
      });
  }

  getActiveListings(): ListingWithSeller[] {
    return this.getListings({ status: "ACTIVE" });
  }

  getListingById(id: string): ListingWithSeller | null {
    const l = this.listings.find((item) => item.id === id);
    if (!l) return null;
    l.views += 1;
    this.saveState();
    const seller = this.getUserById(l.sellerId) || this.getFallbackUser(l.sellerId, "SELLER");
    return { ...l, seller };
  }

  /**
   * Search and filter listings with privacy-preserving distance calculation
   */
  getPublicListings(params: {
    buyerCoords?: Coordinates | null;
    city?: string;
    category?: string;
    search?: string;
    radiusKm?: number;
    sortBy?: "nearest" | "farthest" | "newest" | "lowest_price" | "highest_price";
    userId?: string;
  }): PublicListingItem[] {
    let items = this.listings.filter((l) => l.status === "ACTIVE" || l.status === "IN_NEGOTIATION");

    // Filter by city
    if (params.city && params.city !== "ALL") {
      items = items.filter(
        (l) => l.locationCity.toLowerCase() === params.city?.toLowerCase()
      );
    }

    // Filter by category
    if (params.category && params.category !== "ALL") {
      items = items.filter((l) => l.category === params.category);
    }

    // Filter by search query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.locationDistrict.toLowerCase().includes(q) ||
          l.locationCity.toLowerCase().includes(q)
      );
    }

    const userWishlist = params.userId ? this.wishlists[params.userId] || [] : [];

    // Map to public sanitized listing with distance calculation
    const enriched: PublicListingItem[] = items.map((l) => {
      const seller = this.getUserById(l.sellerId) || this.getFallbackUser(l.sellerId, "SELLER");

      let distanceKm: number | null = null;
      let distanceFormatted = "Pilih / deteksi lokasi";

      if (params.buyerCoords) {
        distanceKm = calculateDistanceKm(params.buyerCoords, {
          latitude: l.approxLatitude,
          longitude: l.approxLongitude,
        });
        distanceFormatted = formatDistance(distanceKm);
      }

      // Safe approximate location (District + City, no exact street or house number)
      const approxLocationText = `${l.locationDistrict}, ${l.locationCity}`;

      return {
        ...l,
        seller: {
          id: seller.id,
          codename: seller.codename,
          reputation: seller.reputation,
          completedDeals: seller.completedDeals,
          approxCity: seller.locationCity,
        },
        approxLocationText,
        approxLocation: approxLocationText,
        distanceKm,
        distanceFormatted,
        isWishlisted: userWishlist.includes(l.id),
      };
    });

    // Filter by radius if buyer coordinates & radius are provided
    let result = enriched;
    if (params.buyerCoords && params.radiusKm && params.radiusKm > 0) {
      result = result.filter(
        (item) => item.distanceKm !== null && item.distanceKm !== undefined && item.distanceKm <= params.radiusKm!
      );
    }

    // Sorting
    const sort = params.sortBy || (params.buyerCoords ? "nearest" : "newest");
    result.sort((a, b) => {
      if (sort === "nearest") {
        const da = a.distanceKm ?? 999999;
        const db = b.distanceKm ?? 999999;
        return da - db;
      }
      if (sort === "farthest") {
        const da = a.distanceKm ?? -1;
        const db = b.distanceKm ?? -1;
        return db - da;
      }
      if (sort === "lowest_price") {
        return a.fiatEstimateIdr - b.fiatEstimateIdr;
      }
      if (sort === "highest_price") {
        return b.fiatEstimateIdr - a.fiatEstimateIdr;
      }
      // default: newest
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return result;
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
    locationDistrict: string;
    locationRegion: string;
    approxLatitude: number;
    approxLongitude: number;
    meetupZone: string;
    meetingAvailability?: string;
    condition: any;
    stock?: number;
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
      locationDistrict: data.locationDistrict || "Pusat",
      locationRegion: data.locationRegion || "Indonesia",
      approxLatitude: data.approxLatitude,
      approxLongitude: data.approxLongitude,
      meetupZone: data.meetupZone,
      meetingAvailability: data.meetingAvailability || "Area publik sesuai kesepakatan",
      condition: data.condition,
      stock: data.stock || 1,
      legalStatusGuarantee: true,
      images: data.images && data.images.length > 0 ? data.images : [],
      status: "ACTIVE",
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.listings.unshift(listing);
    this.recordAuditLog(
      data.sellerId,
      "SELLER",
      "LISTING_CREATED",
      listing.id,
      `Seller mempublikasikan barang: ${listing.title} di ${listing.locationDistrict}, ${listing.locationCity}`
    );
    this.saveState();
    return listing;
  }

  updateListing(
    listingId: string,
    sellerId: string,
    updates: Partial<Listing>
  ): { success: boolean; listing?: Listing; error?: string } {
    const listing = this.listings.find((l) => l.id === listingId);
    if (!listing) return { success: false, error: "Barang tidak ditemukan" };
    if (listing.sellerId !== sellerId) return { success: false, error: "Bukan pemilik listing ini" };

    Object.assign(listing, updates, { updatedAt: new Date() });
    this.saveState();
    return { success: true, listing };
  }

  deleteListing(listingId: string, sellerId: string): boolean {
    const idx = this.listings.findIndex((l) => l.id === listingId && l.sellerId === sellerId);
    if (idx === -1) return false;
    this.listings.splice(idx, 1);
    this.saveState();
    return true;
  }

  // ============================================================
  // WISHLIST
  // ============================================================

  toggleWishlist(userId: string, listingId: string): boolean {
    if (!this.wishlists[userId]) {
      this.wishlists[userId] = [];
    }
    const idx = this.wishlists[userId].indexOf(listingId);
    let added = false;
    if (idx > -1) {
      this.wishlists[userId].splice(idx, 1);
    } else {
      this.wishlists[userId].push(listingId);
      added = true;
    }
    this.saveState();
    return added;
  }

  getWishlistListings(userId: string): PublicListingItem[] {
    const ids = this.wishlists[userId] || [];
    return ids
      .map((id) => this.getListingById(id))
      .filter((l): l is ListingWithSeller => l !== null)
      .map((l) => {
        const approxLocationText = `${l.locationDistrict}, ${l.locationCity}`;
        return {
          ...l,
          seller: {
            id: l.seller.id,
            codename: l.seller.codename,
            reputation: l.seller.reputation,
            completedDeals: l.seller.completedDeals,
            approxCity: l.seller.locationCity,
          },
          approxLocationText,
          approxLocation: approxLocationText,
          isWishlisted: true,
        };
      });
  }

  // ============================================================
  // NEGOTIATION ENGINE
  // ============================================================

  createNegotiation(params: {
    buyerId: string;
    listingId: string;
    offerPriceIdr: number;
    messageText: string;
  }): { success: boolean; negotiation?: NegotiationWithDetails; error?: string } {
    const listing = this.listings.find((l) => l.id === params.listingId);
    if (!listing) return { success: false, error: "Barang tidak ditemukan" };
    if (listing.status !== "ACTIVE" && listing.status !== "IN_NEGOTIATION") {
      return { success: false, error: "Barang tidak tersedia untuk penawaran" };
    }
    if (listing.sellerId === params.buyerId) {
      return { success: false, error: "Tidak dapat menawar barang milik sendiri" };
    }

    // Check if open negotiation already exists between buyer & listing
    const existing = this.negotiations.find(
      (n) =>
        n.buyerId === params.buyerId &&
        n.listingId === params.listingId &&
        n.status !== "REJECTED" &&
        n.status !== "CANCELLED"
    );
    if (existing) {
      return { success: true, negotiation: this.enrichNegotiation(existing) };
    }

    const btcRatio = listing.priceBtc / listing.fiatEstimateIdr;
    const xmrRatio = listing.priceXmr / listing.fiatEstimateIdr;

    const negId = `neg_${Date.now()}`;
    const initialMessage = {
      id: `msg_${Date.now()}`,
      negotiationId: negId,
      senderId: params.buyerId,
      senderRole: "BUYER" as const,
      messageType: "OFFER" as const,
      amount: params.offerPriceIdr,
      content: params.messageText || `Buyer mengajukan tawaran Rp ${params.offerPriceIdr.toLocaleString("id-ID")}`,
      createdAt: new Date(),
    };

    const negotiation: Negotiation = {
      id: negId,
      listingId: listing.id,
      buyerId: params.buyerId,
      sellerId: listing.sellerId,
      status: "OFFER_MADE",
      currentOfferPrice: params.offerPriceIdr,
      currentOfferBtc: Number((params.offerPriceIdr * btcRatio).toFixed(6)),
      currentOfferXmr: Number((params.offerPriceIdr * xmrRatio).toFixed(4)),
      lastOfferBy: "BUYER",
      messages: [initialMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    listing.status = "IN_NEGOTIATION";
    this.negotiations.unshift(negotiation);

    this.recordAuditLog(
      params.buyerId,
      "BUYER",
      "OFFER_MADE",
      negotiation.id,
      `Buyer membuat penawaran Rp ${params.offerPriceIdr.toLocaleString("id-ID")} untuk ${listing.title}`
    );

    this.addNotification(
      listing.sellerId,
      "Tawaran Harga Baru Masuk",
      `Tawaran Rp ${params.offerPriceIdr.toLocaleString("id-ID")} untuk "${listing.title}"`,
      `/negotiations/${negotiation.id}`
    );

    this.saveState();
    return { success: true, negotiation: this.enrichNegotiation(negotiation) };
  }

  counterOffer(params: {
    negotiationId: string;
    userId: string;
    userRole: "BUYER" | "SELLER";
    counterPriceIdr: number;
    messageText: string;
  }): { success: boolean; negotiation?: NegotiationWithDetails; error?: string } {
    const neg = this.negotiations.find((n) => n.id === params.negotiationId);
    if (!neg) return { success: false, error: "Negosiasi tidak ditemukan" };
    if (neg.status === "DEAL_AGREED" || neg.status === "REJECTED") {
      return { success: false, error: "Negosiasi sudah selesai atau ditolak" };
    }

    const listing = this.listings.find((l) => l.id === neg.listingId);
    const btcRatio = listing ? listing.priceBtc / listing.fiatEstimateIdr : 0.000001;
    const xmrRatio = listing ? listing.priceXmr / listing.fiatEstimateIdr : 0.0001;

    neg.currentOfferPrice = params.counterPriceIdr;
    neg.currentOfferBtc = Number((params.counterPriceIdr * btcRatio).toFixed(6));
    neg.currentOfferXmr = Number((params.counterPriceIdr * xmrRatio).toFixed(4));
    neg.lastOfferBy = params.userRole;
    neg.status = "COUNTER_OFFERED";
    neg.updatedAt = new Date();

    const newMsg = {
      id: `msg_${Date.now()}`,
      negotiationId: neg.id,
      senderId: params.userId,
      senderRole: params.userRole,
      messageType: "COUNTER_OFFER" as const,
      amount: params.counterPriceIdr,
      content:
        params.messageText ||
        `${params.userRole === "SELLER" ? "Seller" : "Buyer"} mengajukan counter-offer: Rp ${params.counterPriceIdr.toLocaleString("id-ID")}`,
      createdAt: new Date(),
    };

    neg.messages.push(newMsg);

    const recipientId = params.userRole === "BUYER" ? neg.sellerId : neg.buyerId;
    this.addNotification(
      recipientId,
      "Counter-Offer Baru",
      `${params.userRole} mengajukan penawaran balik Rp ${params.counterPriceIdr.toLocaleString("id-ID")}`,
      `/negotiations/${neg.id}`
    );

    this.recordAuditLog(
      params.userId,
      params.userRole,
      "COUNTER_OFFER",
      neg.id,
      `Counter-offer diajukan: Rp ${params.counterPriceIdr.toLocaleString("id-ID")}`
    );

    this.saveState();
    return { success: true, negotiation: this.enrichNegotiation(neg) };
  }

  acceptOffer(params: {
    negotiationId: string;
    userId: string;
    userRole: "BUYER" | "SELLER";
  }): { success: boolean; negotiation?: NegotiationWithDetails; escrowRoom?: EscrowRoomWithDetails; error?: string } {
    const neg = this.negotiations.find((n) => n.id === params.negotiationId);
    if (!neg) return { success: false, error: "Negosiasi tidak ditemukan" };
    if (neg.status === "DEAL_AGREED") {
      const room = this.escrowRooms.find((r) => r.negotiationId === neg.id);
      return {
        success: true,
        negotiation: this.enrichNegotiation(neg),
        escrowRoom: room ? this.enrichEscrowRoom(room) : undefined,
      };
    }

    const listing = this.listings.find((l) => l.id === neg.listingId);
    if (!listing) return { success: false, error: "Listing tidak ditemukan" };

    neg.status = "DEAL_AGREED";
    neg.updatedAt = new Date();

    const acceptMsg = {
      id: `msg_${Date.now()}`,
      negotiationId: neg.id,
      senderId: params.userId,
      senderRole: params.userRole,
      messageType: "ACCEPT" as const,
      content: `${params.userRole === "BUYER" ? "Buyer" : "Seller"} menyetujui harga akhir Rp ${neg.currentOfferPrice.toLocaleString("id-ID")}. Kesepakatan tercapai!`,
      createdAt: new Date(),
    };
    neg.messages.push(acceptMsg);

    // Automatically create Escrow Room for In-Person COD & Handshake
    const roomId = `ESC-${Math.floor(1000 + Math.random() * 9000)}`;
    const escrowRoom: EscrowRoom = {
      id: roomId,
      transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      negotiationId: neg.id,
      listingId: listing.id,
      buyerId: neg.buyerId,
      sellerId: neg.sellerId,
      finalPriceIdr: neg.currentOfferPrice,
      cryptoCurrency: "XMR",
      cryptoAmount: neg.currentOfferXmr,

      handshakeStatus: "WAITING_FOR_BUYER",
      buyerConnected: false,
      sellerConnected: false,

      meetingStatus: "MEETING_PENDING",
      meetingProposal: null,
      meetingConfirmed: null,

      buyerArrived: false,
      sellerArrived: false,
      buyerConfirmedReceived: false,
      sellerConfirmedHandedOver: false,

      messages: [
        {
          id: `esc_init_${Date.now()}`,
          escrowRoomId: roomId,
          senderId: "system",
          senderRole: "SYSTEM",
          content: `Escrow Room aktif untuk pesanan ${listing.title}. Kesepakatan harga: Rp ${neg.currentOfferPrice.toLocaleString("id-ID")}. Silakan lakukan handshake dan tentukan meeting point.`,
          messageType: "SYSTEM_EVENT",
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),

      orderNumber: roomId,
      handshakeOtp: String(Math.floor(1000 + Math.random() * 9000)),
    };

    neg.escrowRoomId = roomId;
    listing.status = "IN_ESCROW";
    this.escrowRooms.unshift(escrowRoom);

    // System notifications for both parties
    this.addNotification(
      neg.buyerId,
      "Deal Disepakati! Escrow Room Dibuat",
      `Masuk ke Ruang Escrow #${roomId} untuk tentukan titik temu COD`,
      `/escrow/${roomId}`
    );
    this.addNotification(
      neg.sellerId,
      "Deal Disepakati! Escrow Room Dibuat",
      `Masuk ke Ruang Escrow #${roomId} untuk tentukan titik temu COD`,
      `/escrow/${roomId}`
    );

    this.recordAuditLog(
      params.userId,
      params.userRole,
      "DEAL_LOCKED",
      escrowRoom.id,
      `Deal disepakati Rp ${neg.currentOfferPrice.toLocaleString("id-ID")}. Escrow Room ${roomId} dibuat.`
    );

    this.saveState();
    return {
      success: true,
      negotiation: this.enrichNegotiation(neg),
      escrowRoom: this.enrichEscrowRoom(escrowRoom),
    };
  }

  rejectOffer(negotiationId: string, userId: string, role: "BUYER" | "SELLER"): boolean {
    const neg = this.negotiations.find((n) => n.id === negotiationId);
    if (!neg) return false;
    neg.status = "REJECTED";
    neg.updatedAt = new Date();
    neg.messages.push({
      id: `msg_${Date.now()}`,
      negotiationId: neg.id,
      senderId: userId,
      senderRole: role,
      messageType: "REJECT",
      content: `${role} menolak penawaran terakhir. Negosiasi ditutup.`,
      createdAt: new Date(),
    });
    this.saveState();
    return true;
  }

  sendNegotiationMessage(
    negotiationId: string,
    senderId: string,
    senderRole: "BUYER" | "SELLER",
    content: string
  ): NegotiationMessage | null {
    const neg = this.negotiations.find((n) => n.id === negotiationId);
    if (!neg) return null;
    const msg: NegotiationMessage = {
      id: `msg_${Date.now()}`,
      negotiationId,
      senderId,
      senderRole,
      messageType: "TEXT",
      content,
      createdAt: new Date(),
    };
    neg.messages.push(msg);
    neg.updatedAt = new Date();
    this.saveState();
    return msg;
  }

  getNegotiationById(id: string): NegotiationWithDetails | null {
    const neg = this.negotiations.find((n) => n.id === id);
    if (!neg) return null;
    return this.enrichNegotiation(neg);
  }

  getNegotiationsByUser(userId: string): NegotiationWithDetails[] {
    return this.negotiations
      .filter((n) => n.buyerId === userId || n.sellerId === userId)
      .map((n) => this.enrichNegotiation(n));
  }

  private enrichNegotiation(neg: Negotiation): NegotiationWithDetails {
    const listing = this.listings.find((l) => l.id === neg.listingId) || this.listings[0];
    const buyer = this.getUserById(neg.buyerId) || this.getFallbackUser(neg.buyerId, "BUYER");
    const seller = this.getUserById(neg.sellerId) || this.getFallbackUser(neg.sellerId, "SELLER");
    return { ...neg, listing, buyer, seller };
  }

  // ============================================================
  // ESCROW ROOM ENGINE (Cross-Device Handshake, Meeting, Arrival, COD)
  // ============================================================

  getEscrowRoomById(id: string): EscrowRoomWithDetails | null {
    const room = this.escrowRooms.find((r) => r.id === id || r.orderNumber === id);
    if (!room) return null;
    return this.enrichEscrowRoom(room);
  }

  getOrderById(id: string): EscrowRoomWithDetails | null {
    return this.getEscrowRoomById(id);
  }

  getAllEscrowRooms(): EscrowRoomWithDetails[] {
    return this.escrowRooms.map((r) => this.enrichEscrowRoom(r));
  }

  getAllOrders(): EscrowRoomWithDetails[] {
    return this.getAllEscrowRooms();
  }

  getEscrowRoomsByUser(userId: string): EscrowRoomWithDetails[] {
    return this.escrowRooms
      .filter((r) => r.buyerId === userId || r.sellerId === userId)
      .map((r) => this.enrichEscrowRoom(r));
  }

  updateEscrowPresence(
    roomId: string,
    role: "BUYER" | "SELLER",
    connected: boolean
  ): EscrowRoomWithDetails | null {
    const room = this.escrowRooms.find((r) => r.id === roomId);
    if (!room) return null;

    if (role === "BUYER") {
      room.buyerConnected = connected;
    } else if (role === "SELLER") {
      room.sellerConnected = connected;
    }

    if (room.buyerConnected && room.sellerConnected) {
      room.handshakeStatus = "BOTH_CONNECTED";
    } else if (room.buyerConnected) {
      room.handshakeStatus = "BUYER_CONNECTED";
    } else if (room.sellerConnected) {
      room.handshakeStatus = "SELLER_CONNECTED";
    } else {
      room.handshakeStatus = "WAITING_FOR_BUYER";
    }

    room.updatedAt = new Date();
    this.saveState();
    return this.enrichEscrowRoom(room);
  }

  proposeMeetingPoint(params: {
    roomId: string;
    proposedBy: "BUYER" | "SELLER";
    locationName: string;
    areaNote: string;
    date: string;
    time: string;
  }): { success: boolean; room?: EscrowRoomWithDetails; error?: string } {
    const room = this.escrowRooms.find((r) => r.id === params.roomId);
    if (!room) return { success: false, error: "Room tidak ditemukan" };

    room.meetingProposal = {
      proposedBy: params.proposedBy,
      locationName: params.locationName,
      areaNote: params.areaNote,
      proposedDate: params.date,
      proposedTime: params.time,
      status: "PENDING",
      proposedAt: new Date(),
    };
    room.meetingStatus = "MEETING_PROPOSED";
    room.updatedAt = new Date();

    room.messages.push({
      id: `msg_${Date.now()}`,
      escrowRoomId: room.id,
      senderId: params.proposedBy,
      senderRole: params.proposedBy,
      content: `${params.proposedBy === "SELLER" ? "Seller" : "Buyer"} mengusulkan meeting point: ${params.locationName} (${params.areaNote}) pada tanggal ${params.date} jam ${params.time}.`,
      messageType: "MEETING_PROPOSAL",
      createdAt: new Date(),
    });

    const targetUser = params.proposedBy === "BUYER" ? room.sellerId : room.buyerId;
    this.addNotification(
      targetUser,
      "Usulan Titik Temu COD",
      `Lokasi diusulkan: ${params.locationName} jam ${params.time}`,
      `/escrow/${room.id}`
    );

    this.recordAuditLog(
      params.proposedBy,
      params.proposedBy,
      "MEETING_PROPOSED",
      room.id,
      `Usulan titik temu: ${params.locationName} pada ${params.date} ${params.time}`
    );

    this.saveState();
    return { success: true, room: this.enrichEscrowRoom(room) };
  }

  acceptMeetingPoint(roomId: string, userId: string, role: "BUYER" | "SELLER"): { success: boolean; room?: EscrowRoomWithDetails; error?: string } {
    const room = this.escrowRooms.find((r) => r.id === roomId);
    if (!room || !room.meetingProposal) {
      return { success: false, error: "Tidak ada usulan meeting point aktif" };
    }

    room.meetingProposal.status = "ACCEPTED";
    room.meetingConfirmed = {
      locationName: room.meetingProposal.locationName,
      areaNote: room.meetingProposal.areaNote,
      dateTime: `${room.meetingProposal.proposedDate}, ${room.meetingProposal.proposedTime} WIB`,
      confirmedAt: new Date(),
    };
    room.meetingStatus = "MEETING_CONFIRMED";
    room.updatedAt = new Date();

    room.messages.push({
      id: `msg_${Date.now()}`,
      escrowRoomId: room.id,
      senderId: userId,
      senderRole: role,
      content: `Meeting point dan jadwal resmi disepakati oleh kedua pihak: ${room.meetingConfirmed.locationName} (${room.meetingConfirmed.dateTime}).`,
      messageType: "SYSTEM_EVENT",
      createdAt: new Date(),
    });

    this.recordAuditLog(
      userId,
      role,
      "MEETING_CONFIRMED",
      room.id,
      `Titik temu disepakati: ${room.meetingConfirmed.locationName}`
    );

    this.saveState();
    return { success: true, room: this.enrichEscrowRoom(room) };
  }

  confirmArrival(roomId: string, role: "BUYER" | "SELLER"): { success: boolean; room?: EscrowRoomWithDetails; error?: string } {
    const room = this.escrowRooms.find((r) => r.id === roomId);
    if (!room) return { success: false, error: "Room tidak ditemukan" };

    const now = new Date();
    if (role === "BUYER") {
      room.buyerArrived = true;
      room.buyerArrivedAt = now;
    } else if (role === "SELLER") {
      room.sellerArrived = true;
      room.sellerArrivedAt = now;
    }

    if (room.buyerArrived && room.sellerArrived) {
      room.meetingStatus = "COD_PENDING";
      room.messages.push({
        id: `msg_${Date.now()}`,
        escrowRoomId: room.id,
        senderId: "system",
        senderRole: "SYSTEM",
        content: "Kedua pihak sudah hadir di lokasi titik temu! Silakan periksa kondisi fisik barang bersama dan lakukan pembayaran/penyerahan COD.",
        messageType: "ARRIVAL",
        createdAt: now,
      });
    } else {
      room.messages.push({
        id: `msg_${Date.now()}`,
        escrowRoomId: room.id,
        senderId: role,
        senderRole: role,
        content: `${role === "BUYER" ? "Buyer" : "Seller"} telah sampai di lokasi pertemuan ("I'm here").`,
        messageType: "ARRIVAL",
        createdAt: now,
      });
    }

    room.updatedAt = now;
    this.recordAuditLog(role, role, "ARRIVAL_CONFIRMED", room.id, `${role} konfirmasi sudah di lokasi.`);
    this.saveState();
    return { success: true, room: this.enrichEscrowRoom(room) };
  }

  confirmCodHandshake(
    roomId: string,
    role: "BUYER" | "SELLER"
  ): { success: boolean; room?: EscrowRoomWithDetails; bothConfirmed: boolean; error?: string } {
    const room = this.escrowRooms.find((r) => r.id === roomId);
    if (!room) return { success: false, bothConfirmed: false, error: "Room tidak ditemukan" };

    const now = new Date();
    if (role === "BUYER") {
      room.buyerConfirmedReceived = true;
      room.buyerConfirmedAt = now;
    } else if (role === "SELLER") {
      room.sellerConfirmedHandedOver = true;
      room.sellerConfirmedAt = now;
    }

    const bothConfirmed = !!(room.buyerConfirmedReceived && room.sellerConfirmedHandedOver);

    if (bothConfirmed) {
      room.meetingStatus = "COMPLETED";
      // Mark listing as SOLD
      const listing = this.listings.find((l) => l.id === room.listingId);
      if (listing) {
        listing.status = "SOLD";
        listing.stock = Math.max(0, listing.stock - 1);
      }

      // Increment completed deals, reputation and payout balance
      const seller = this.getUserById(room.sellerId);
      if (seller) {
        seller.completedDeals += 1;
        seller.reputation = Math.min(100, seller.reputation + 1);
        const earnedXmr = Number((room.finalPriceIdr / 2500000).toFixed(4));
        const earnedBtc = Number((room.finalPriceIdr / 1400000000).toFixed(6));
        seller.balanceXmr = Number(((seller.balanceXmr || 0) + earnedXmr).toFixed(4));
        seller.balanceBtc = Number(((seller.balanceBtc || 0) + earnedBtc).toFixed(6));
      }
      const buyer = this.getUserById(room.buyerId);
      if (buyer) {
        buyer.completedDeals += 1;
        buyer.reputation = Math.min(100, buyer.reputation + 1);
      }

      room.messages.push({
        id: `msg_${Date.now()}`,
        escrowRoomId: room.id,
        senderId: "system",
        senderRole: "SYSTEM",
        content: "DUAL CONFIRMATION SELESAI: Buyer mengonfirmasi barang diterima, Seller mengonfirmasi barang diserahkan. Transaksi resmi SUKSES & SELESAI!",
        messageType: "CONFIRMATION",
        createdAt: now,
      });

      this.recordAuditLog(
        role,
        role,
        "TRANSACTION_COMPLETED",
        room.id,
        `Transaksi selesai sukses via Dual Confirmation COD.`
      );
    } else {
      room.messages.push({
        id: `msg_${Date.now()}`,
        escrowRoomId: room.id,
        senderId: role,
        senderRole: role,
        content: `${role === "BUYER" ? "Buyer mengonfirmasi barang diterima" : "Seller mengonfirmasi barang telah diserahkan"}. Menunggu konfirmasi pihak kedua.`,
        messageType: "CONFIRMATION",
        createdAt: now,
      });
      this.recordAuditLog(
        role,
        role,
        "PARTIAL_CONFIRMATION",
        room.id,
        `${role} menekan konfirmasi COD.`
      );
    }

    room.updatedAt = now;
    this.saveState();
    return {
      success: true,
      room: this.enrichEscrowRoom(room),
      bothConfirmed,
    };
  }

  fileDispute(params: {
    roomId: string;
    raisedBy: "BUYER" | "SELLER";
    reason: string;
    description: string;
  }): { success: boolean; room?: EscrowRoomWithDetails; error?: string } {
    const room = this.escrowRooms.find((r) => r.id === params.roomId);
    if (!room) return { success: false, error: "Room tidak ditemukan" };

    room.meetingStatus = "DISPUTED";
    room.dispute = {
      raisedBy: params.raisedBy,
      reason: params.reason,
      description: params.description,
      createdAt: new Date(),
      resolved: false,
    };
    room.updatedAt = new Date();

    room.messages.push({
      id: `msg_${Date.now()}`,
      escrowRoomId: room.id,
      senderId: params.raisedBy,
      senderRole: params.raisedBy,
      content: `PERINGATAN: Sengketa (Dispute) diajukan oleh ${params.raisedBy}: "${params.reason}". Sistem Owner telah diberitahu untuk mediasi.`,
      messageType: "SYSTEM_EVENT",
      createdAt: new Date(),
    });

    this.recordAuditLog(
      params.raisedBy,
      params.raisedBy,
      "DISPUTE_FILED",
      room.id,
      `Dispute diajukan: ${params.reason} - ${params.description}`
    );

    this.saveState();
    return { success: true, room: this.enrichEscrowRoom(room) };
  }

  resolveDispute(roomId: string, resolutionNote: string): boolean {
    const room = this.escrowRooms.find((r) => r.id === roomId);
    if (!room || !room.dispute) return false;

    room.dispute.resolved = true;
    room.dispute.resolvedAt = new Date();
    room.dispute.resolutionNote = resolutionNote;
    room.dispute.resolvedByRole = "OWNER";
    room.meetingStatus = "COMPLETED";
    room.updatedAt = new Date();

    room.messages.push({
      id: `msg_${Date.now()}`,
      escrowRoomId: room.id,
      senderId: "usr_owner_01",
      senderRole: "SYSTEM",
      content: `Dispute diselesaikan oleh Owner/Operator: ${resolutionNote}`,
      messageType: "SYSTEM_EVENT",
      createdAt: new Date(),
    });

    this.recordAuditLog(
      "usr_owner_01",
      "OWNER",
      "DISPUTE_RESOLVED",
      room.id,
      `Owner menyelesaikan dispute: ${resolutionNote}`
    );

    this.saveState();
    return true;
  }

  sendEscrowChatMessage(
    roomId: string,
    senderId: string,
    senderRole: "BUYER" | "SELLER",
    content: string
  ) {
    const room = this.escrowRooms.find((r) => r.id === roomId);
    if (!room) return null;

    const msg = {
      id: `msg_${Date.now()}`,
      escrowRoomId: roomId,
      senderId,
      senderRole,
      content,
      messageType: "TEXT" as const,
      createdAt: new Date(),
    };
    room.messages.push(msg);
    room.updatedAt = new Date();
    this.saveState();
    return msg;
  }

  private enrichEscrowRoom(r: EscrowRoom): EscrowRoomWithDetails {
    const listing = this.listings.find((l) => l.id === r.listingId) || this.listings[0];
    const seller = this.getUserById(r.sellerId) || this.getFallbackUser(r.sellerId, "SELLER");
    const buyer = this.getUserById(r.buyerId) || this.getFallbackUser(r.buyerId, "BUYER");
    const meetupLocation =
      r.meetingConfirmed?.locationName ||
      r.meetingProposal?.locationName ||
      r.meetupLocation ||
      listing?.meetupZone ||
      "Area Publik";

    return {
      ...r,
      orderNumber: r.id,
      meetupLocation,
      listing,
      seller,
      buyer,
    };
  }

  // ============================================================
  // AUDIT LOG & NOTIFICATIONS
  // ============================================================

  recordAuditLog(
    actorId: string,
    actorRole: UserRole,
    action: string,
    targetId: string,
    details: string,
    metadata?: any
  ) {
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorId,
      actorRole,
      action,
      targetId,
      details,
      metadata,
      timestamp: new Date(),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 100) this.auditLogs.pop();
  }

  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  addNotification(userId: string, title: string, message: string, linkUrl: string) {
    const notif: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      message,
      linkUrl,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.unshift(notif);
    if (this.notifications.length > 50) this.notifications.pop();
    this.saveState();
  }

  getUserNotifications(userId: string): SystemNotification[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  // ============================================================
  // OWNER & SYSTEM TELEMETRY
  // ============================================================

  getPlatformMetrics(): PlatformMetrics {
    const completed = this.escrowRooms.filter((r) => r.meetingStatus === "COMPLETED");
    const active = this.escrowRooms.filter(
      (r) => r.meetingStatus !== "COMPLETED" && r.meetingStatus !== "CANCELLED"
    );
    const disputes = this.escrowRooms.filter((r) => r.meetingStatus === "DISPUTED");
    const activeNegs = this.negotiations.filter(
      (n) => n.status !== "DEAL_AGREED" && n.status !== "REJECTED" && n.status !== "CANCELLED"
    );

    const totalVolumeIdr = completed.reduce((sum, r) => sum + r.finalPriceIdr, 0);
    const totalVolumeBtc = completed
      .filter((r) => r.cryptoCurrency === "BTC")
      .reduce((sum, r) => sum + r.cryptoAmount, 0);
    const totalVolumeXmr = completed
      .filter((r) => r.cryptoCurrency === "XMR")
      .reduce((sum, r) => sum + r.cryptoAmount, 0);

    const disputeRatePct =
      this.escrowRooms.length > 0
        ? Number(((disputes.length / this.escrowRooms.length) * 100).toFixed(1))
        : 0;

    return {
      totalDealsCompleted: completed.length,
      completedDealsCount: completed.length,
      activeNegotiationsCount: activeNegs.length,
      activeEscrowsCount: active.length,
      disputeRatePct,
      totalVolumeIdr,
      totalVolumeBtc,
      totalVolumeXmr,
      activeUsersCount: this.users.length,
      activeNodesCount: this.users.length,
      recentAuditLogs: this.auditLogs.slice(0, 10),
      recentEscrowRooms: this.escrowRooms.slice(0, 8).map((r) => this.enrichEscrowRoom(r)),
      recentOrders: this.escrowRooms.slice(0, 8).map((r) => this.enrichEscrowRoom(r)),
      trafficFeed: [
        {
          id: "tf_01",
          type: "HANDSHAKE",
          title: "Dual confirmation signed",
          amount: "Rp 2.100.000",
          city: "Bandung - Ciwalk",
          timestamp: "2026-11-14T10:00:00.000Z",
        },
        {
          id: "tf_02",
          type: "DEAL_AGREED",
          title: "Kesepakatan harga tercapai",
          amount: "Rp 4.200.000",
          city: "Jakarta Selatan",
          timestamp: "2026-11-14T09:45:00.000Z",
        },
      ],
    };
  }
}

// Global Singleton with prototype refresh for Turbopack HMR
const globalForStore = globalThis as unknown as { arcadeMarketplace?: MarketplaceStore };
let storeInstance = globalForStore.arcadeMarketplace;
if (!storeInstance || typeof (storeInstance as any).createUser !== "function") {
  storeInstance = new MarketplaceStore();
  globalForStore.arcadeMarketplace = storeInstance;
} else {
  // Ensure prototype is always updated on HMR
  Object.setPrototypeOf(storeInstance, MarketplaceStore.prototype);
}
export const store = storeInstance;
