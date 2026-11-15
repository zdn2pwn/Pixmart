"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicListingItem, ListingCategory } from "@/lib/types";
import { formatBtc, formatXmr, formatCurrency } from "@/lib/format";
import { calculateDistanceKm, formatDistance, INDONESIAN_LOCATIONS, type Coordinates } from "@/lib/location";
import { toggleWishlistAction } from "@/app/actions/marketplace";
import {
  Search,
  MapPin,
  Compass,
  SlidersHorizontal,
  Heart,
  Navigation,
  Package,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "ALL", label: "Semua Kategori" },
  { value: "HARDWARE_GADGETS", label: "Hardware & Gadget" },
  { value: "RETRO_CONSOLES", label: "Konsol Retro" },
  { value: "KEYBOARDS_TECH", label: "Keyboard Mekanikal" },
  { value: "CAMERAS_OPTICS", label: "Kamera & Optik" },
  { value: "TIMEPIECES_WATCHES", label: "Jam Tangan" },
  { value: "COLLECTIBLES_EDC", label: "Koleksi & EDC" },
];

const RADIUS_OPTIONS = [
  { value: 0, label: "Semua Radius" },
  { value: 1, label: "Within 1 km" },
  { value: 5, label: "Within 5 km" },
  { value: 10, label: "Within 10 km" },
  { value: 25, label: "Within 25 km" },
];

interface MarketplaceExplorerProps {
  initialListings: any[];
  initialCity?: string;
  initialCategory?: string;
  initialSearch?: string;
  userId?: string;
  session?: any;
}

export function MarketplaceExplorer({
  initialListings,
  initialCity = "ALL",
  initialCategory = "ALL",
  initialSearch = "",
  userId,
  session,
}: MarketplaceExplorerProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [radiusKm, setRadiusKm] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"nearest" | "farthest" | "newest" | "lowest_price" | "highest_price">("newest");
  const [currency, setCurrency] = useState<"IDR" | "BTC" | "XMR">("IDR");

  // Geolocation state
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [geoStatus, setGeoStatus] = useState<"IDLE" | "LOCATING" | "GRANTED" | "DENIED">("IDLE");
  const [geoName, setGeoName] = useState<string>("Belum disetel");
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Request browser geolocation
  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("DENIED");
      return;
    }
    setGeoStatus("LOCATING");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoStatus("GRANTED");
        setGeoName("Lokasi Browser Saat Ini");
        setSortBy("nearest");
      },
      (_err) => {
        setGeoStatus("DENIED");
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  // Select preset location manually (fallback when GPS is denied or for testing)
  function selectPresetLocation(preset: (typeof INDONESIAN_LOCATIONS)[0]) {
    setUserCoords({
      latitude: preset.latitude,
      longitude: preset.longitude,
    });
    setGeoStatus("GRANTED");
    setGeoName(`${preset.district}, ${preset.city}`);
    setSortBy("nearest");
  }

  // Handle wishlist toggle
  async function handleToggleWishlist(listingId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push("/login?from=/marketplace");
      return;
    }
    setWishlistIds((prev) =>
      prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
    await toggleWishlistAction(listingId);
  }

  // Dynamic distance calculation & filtering
  const processedListings = useMemo(() => {
    let items = initialListings.map((l) => {
      let distanceKm: number | null = null;
      let distanceFormatted = "Deteksi lokasi untuk jarak";

      if (userCoords && l.approx_latitude && l.approx_longitude) {
        distanceKm = calculateDistanceKm(userCoords, {
          latitude: l.approx_latitude,
          longitude: l.approx_longitude,
        });
        distanceFormatted = formatDistance(distanceKm);
      }

      const approxLocation = l.location_district && l.location_city
        ? `${l.location_district}, ${l.location_city}`
        : l.meetup_zone || "Area Publik";

      // Calculate IDR if not set (fallback)
      const fiatEstimateIdr = l.fiat_estimate_idr && l.fiat_estimate_idr > 0
        ? l.fiat_estimate_idr
        : Math.round((l.price_btc || 0) * 1400000000);

      return {
        ...l,
        distanceKm,
        distanceFormatted,
        approxLocation,
        fiatEstimateIdr, // Add computed field
        priceBtc: l.price_btc || 0,
        priceXmr: l.price_xmr || 0,
        isWishlisted: wishlistIds.includes(l.id) || l.is_wishlisted,
      };
    });

    // City Filter
    if (city !== "ALL") {
      items = items.filter((l) => l.location_city?.toLowerCase() === city.toLowerCase());
    }

    // Category Filter
    if (category !== "ALL") {
      items = items.filter((l) => l.category === category);
    }

    // Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          (l.location_district && l.location_district.toLowerCase().includes(q)) ||
          (l.location_city && l.location_city.toLowerCase().includes(q)) ||
          (l.approxLocation && l.approxLocation.toLowerCase().includes(q))
      );
    }

    // Radius Filter
    if (userCoords && radiusKm > 0) {
      items = items.filter((l) => l.distanceKm !== null && l.distanceKm <= radiusKm);
    }

    // Sort
    items.sort((a, b) => {
      if (sortBy === "nearest") {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === "farthest") {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return b.distanceKm - a.distanceKm;
      }
      if (sortBy === "lowest_price") {
        return (a.fiatEstimateIdr || 0) - (b.fiatEstimateIdr || 0);
      }
      if (sortBy === "highest_price") {
        return (b.fiatEstimateIdr || 0) - (a.fiatEstimateIdr || 0);
      }
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return items;
  }, [initialListings, userCoords, city, category, search, radiusKm, sortBy, wishlistIds]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      {/* Page Title & Location Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
            <span>LOCATION-BASED LOCAL MARKETPLACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Katalog Produk &amp; Hardware Terdekat
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Temukan barang fisik 100% legal di sekitar area kamu untuk serah terima COD &amp; cek fisik langsung.
          </p>
        </div>

        <Link
          href="/marketplace/new"
          className="btn-primary text-xs font-bold px-4 py-2.5 self-start md:self-auto flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
        >
          <span>+ Pasang Iklan Lokal</span>
        </Link>
      </div>

      {/* Location Bar / GPS Switcher */}
      <div className="bg-[#141414] border border-[#2a2a2a] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-[#1d1d1d] border border-[#333] flex items-center justify-center shrink-0">
            <MapPin size={20} className={userCoords ? "text-[#39FF14]" : "text-[#888]"} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider">Titik Acuan Pembeli</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{userCoords ? geoName : "Lokasi Belum Terdeteksi"}</span>
              {userCoords && (
                <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] px-1.5 py-0.5 border border-[#39FF14]/30 font-mono">
                  AKTIF
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={detectLocation}
            disabled={geoStatus === "LOCATING"}
            className="px-3.5 py-2 bg-[#222] hover:bg-[#2c2c2c] text-white border border-[#3a3a3a] text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Navigation size={14} className={geoStatus === "LOCATING" ? "animate-spin text-[#39FF14]" : "text-[#39FF14]"} />
            <span>{geoStatus === "LOCATING" ? "Mencari GPS..." : "Gunakan Lokasi Saya"}</span>
          </button>

          {/* Quick preset dropdown for easy manual testing */}
          <div className="relative group">
            <button className="px-3 py-2 bg-[#181818] hover:bg-[#222] text-[#aaa] hover:text-white border border-[#333] text-xs font-mono transition-colors cursor-pointer">
              <span>Pilih Area Manual ▾</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#161616] border border-[#333] shadow-2xl z-30 hidden group-hover:block p-1">
              <div className="text-[10px] text-[#666] px-2 py-1 font-mono uppercase">Area Populer</div>
              {INDONESIAN_LOCATIONS.slice(0, 6).map((preset) => (
                <button
                  key={`${preset.city}-${preset.district}`}
                  onClick={() => selectPresetLocation(preset)}
                  className="w-full text-left px-2.5 py-2 text-xs text-[#ccc] hover:text-white hover:bg-[#252525] flex items-center justify-between transition-colors cursor-pointer font-mono"
                >
                  <span className="truncate">{preset.district}</span>
                  <span className="text-[10px] text-[#777] shrink-0">{preset.city}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Denied Helper Banner */}
      {geoStatus === "DENIED" && (
        <div className="bg-[#FFB800]/10 border border-[#FFB800]/40 p-3.5 text-xs text-[#FFB800] flex items-start gap-2.5 font-mono">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>Izin lokasi browser tidak diaktifkan.</strong> Jangan khawatir! Anda tetap dapat memilih area di atas (misal: <em>Gerokgak Buleleng, Jakarta Selatan, atau Bandung</em>) untuk menghitung jarak produk ke lokasi Anda.
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#121212] border border-[#262626] p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk terdekat, gadget, keyboard, kota..."
            className="input-dark w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        {/* Filter Controls: Radius, Category, Sort, Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Radius Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#777] uppercase block mb-1">Radius Jarak</label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="input-dark w-full py-2 px-3 text-xs font-mono"
            >
              {RADIUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-mono text-[#777] uppercase block mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-dark w-full py-2 px-3 text-xs font-mono"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-mono text-[#777] uppercase block mb-1">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-dark w-full py-2 px-3 text-xs font-mono"
            >
              <option value="nearest">Paling Dekat (Nearest)</option>
              <option value="farthest">Paling Jauh (Farthest)</option>
              <option value="newest">Paling Baru (Newest)</option>
              <option value="lowest_price">Harga Terendah</option>
              <option value="highest_price">Harga Tertinggi</option>
            </select>
          </div>

          {/* Currency Display Toggle */}
          <div>
            <label className="text-[10px] font-mono text-[#777] uppercase block mb-1">Tampilan Harga</label>
            <div className="flex border border-[#333] bg-[#0d0d0d] p-0.5">
              {(["IDR", "XMR", "BTC"] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`flex-1 py-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    currency === curr ? "bg-[#252525] text-[#39FF14]" : "text-[#777] hover:text-[#ccc]"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-[#888] px-1">
        <div>
          Menampilkan <span className="text-[#39FF14] font-bold">{processedListings.length}</span> barang di area sekitar
        </div>
        {userCoords && (
          <div className="text-[11px] text-[#39FF14] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />
            <span>Jarak dihitung realtime berdasarkan koordinat</span>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {processedListings.length === 0 ? (
        <div className="bg-[#121212] border border-[#222] p-12 text-center space-y-4">
          <Package size={40} className="mx-auto text-[#444]" />
          <div className="text-white font-bold text-base">Tidak ada barang dalam radius atau pencarian ini</div>
          <p className="text-xs text-[#888] max-w-md mx-auto">
            Coba perbesar radius jarak pencarian atau ubah filter kategori untuk melihat barang lain di area sekitar.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setRadiusKm(0);
                setCategory("ALL");
                setSearch("");
              }}
              className="btn-ghost text-xs font-bold px-4 py-2"
            >
              Reset Semua Filter
            </button>
            {session?.role === "SELLER" && (
              <Link
                href="/marketplace/new"
                className="btn-primary text-xs font-bold px-5 py-2 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
              >
                + Pasang Iklan Sekarang
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedListings.map((item) => {
            const hasImage = item.images && item.images.length > 0 && item.images[0];
            return (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="group bg-[#111111] border border-[#242424] hover:border-[#39FF14]/70 transition-all flex flex-col overflow-hidden relative"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] bg-[#181818] overflow-hidden flex items-center justify-center border-b border-[#222]">
                  {hasImage ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-[#555]">
                      <Package size={36} className="mb-2" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Unit Fisik Legal</span>
                    </div>
                  )}

                  {/* Distance Badge on Image */}
                  <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-[#333] px-2.5 py-1 text-[11px] font-mono font-bold text-[#39FF14] flex items-center gap-1.5 shadow-lg">
                    <MapPin size={12} className="text-[#39FF14]" />
                    <span>{item.distanceFormatted}</span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(item.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/80 hover:bg-black border border-[#333] hover:border-[#39FF14] flex items-center justify-center transition-colors cursor-pointer"
                    title="Simpan ke Wishlist"
                  >
                    <Heart
                      size={15}
                      className={item.isWishlisted ? "text-[#FF3B30] fill-[#FF3B30]" : "text-[#aaa]"}
                    />
                  </button>

                  {/* Condition Tag */}
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm border border-[#333] px-2 py-0.5 text-[10px] font-mono text-[#aaa]">
                    {item.condition}
                  </div>

                  {/* SOLD OUT Overlay */}
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center transform -rotate-12">
                        <div className="text-4xl font-black text-[#FF3B30] font-mono tracking-widest mb-2 drop-shadow-[0_0_8px_rgba(255,59,48,0.6)]">
                          SOLD OUT
                        </div>
                        <div className="text-xs text-[#888] font-mono">STOK HABIS</div>
                      </div>
                    </div>
                  )}

                  {/* Low Stock Warning */}
                  {item.stock > 0 && item.stock <= 3 && (
                    <div className="absolute bottom-3 right-3 bg-[#FFB800]/90 backdrop-blur-sm border border-[#FFB800] px-2 py-1 text-[10px] font-mono font-bold text-black animate-pulse">
                      Tersisa {item.stock}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Category & Approximate Location */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#777]">
                      <span className="uppercase">{item.category.replace(/_/g, " ")}</span>
                      <span className="text-[#39FF14] font-medium truncate max-w-[140px]">
                        {item.approxLocation}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-[#39FF14] transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Description excerpt */}
                    <p className="text-xs text-[#888] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-[#1f1f1f] flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#666] uppercase">Harga Deal COD</div>
                      {currency === "IDR" && (
                        <div className="text-base font-bold text-white font-mono">
                          Rp {(item.fiatEstimateIdr || 0).toLocaleString("id-ID")}
                        </div>
                      )}
                      {currency === "XMR" && (
                        <div className="text-base font-bold text-[#FF6600] font-mono">
                          {formatXmr(item.priceXmr || 0)}
                        </div>
                      )}
                      {currency === "BTC" && (
                        <div className="text-base font-bold text-[#F7931A] font-mono">
                          {formatBtc(item.priceBtc || 0)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#39FF14] group-hover:translate-x-1 transition-transform">
                      <span>Nego / Beli</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
