"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBtc, formatXmr } from "@/lib/format";
import { calculateDistanceKm, formatDistance, INDONESIAN_LOCATIONS, type Coordinates } from "@/lib/location";
import { toggleWishlistAction, getWishlistIdsAction } from "@/app/actions/wishlist";
import {
  Search,
  MapPin,
  Heart,
  Navigation,
  Package,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "ALL", label: "Semua Kategori" },
  { value: "HARDWARE_GADGETS", label: "Gadget" },
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
  session?: any;
}

export function MarketplaceExplorer({
  initialListings,
  initialCity = "ALL",
  initialCategory = "ALL",
  initialSearch = "",
  session,
}: MarketplaceExplorerProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const city = initialCity;
  const [category, setCategory] = useState(initialCategory);
  const [radiusKm, setRadiusKm] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"nearest" | "farthest" | "newest" | "lowest_price" | "highest_price">("newest");
  const [currency, setCurrency] = useState<"IDR" | "BTC" | "XMR">("IDR");

  useEffect(() => {
    if (!session?.userId) return;
    getWishlistIdsAction().then(setWishlistIds).catch(() => {});
  }, [session?.userId]);

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
      () => {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3A3157]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C8FF4D] uppercase tracking-wider mb-1 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#C8FF4D] pulse-green" />
            <span>LOCATION-BASED LOCAL MARKETPLACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cream tracking-tight">
            Katalog Produk Terdekat
          </h1>
          <p className="text-sm text-[#A79EC2] mt-1">
            Temukan barang fisik 100% legal di sekitar area kamu untuk serah terima COD &amp; cek fisik langsung.
          </p>
        </div>

        {session?.role === "SELLER" && (
          <Link
            href="/marketplace/new"
            className="btn-primary text-xs font-bold px-4 py-2.5 self-start md:self-auto flex items-center gap-1.5 shadow-[0_0_12px_rgba(200,255,77,0.3)]"
          >
            <span>+ Pasang Iklan Lokal</span>
          </Link>
        )}
      </div>

      {/* Location Bar / GPS Switcher */}
      <div className="bg-[#19152B] border border-[#3A3157] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-[#231D3A] border border-[#4A4168] flex items-center justify-center shrink-0">
            <MapPin size={20} className={userCoords ? "text-[#C8FF4D]" : "text-[#A79EC2]"} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#A79EC2] uppercase tracking-wider">Titik Acuan Pembeli</div>
            <div className="text-sm font-bold text-cream flex items-center gap-2">
              <span>{userCoords ? geoName : "Lokasi Belum Terdeteksi"}</span>
              {userCoords && (
                <span className="text-[10px] bg-[#C8FF4D]/10 text-[#C8FF4D] px-1.5 py-0.5 border border-[#C8FF4D]/30 font-mono">
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
            className="px-3.5 py-2 bg-[#3A3157] hover:bg-[#4A4168] text-cream border border-[#3A3157] text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Navigation size={14} className={geoStatus === "LOCATING" ? "animate-spin text-[#C8FF4D]" : "text-[#C8FF4D]"} />
            <span>{geoStatus === "LOCATING" ? "Mencari GPS..." : "Gunakan Lokasi Saya"}</span>
          </button>

          {/* Quick preset dropdown for easy manual testing */}
          <div className="relative group">
            <button className="px-3 py-2 bg-[#19152B] hover:bg-[#3A3157] text-[#C8C2DA] hover:text-cream border border-[#4A4168] text-xs font-mono transition-colors cursor-pointer">
              <span>Pilih Area Manual ▾</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#19152B] border border-[#4A4168] shadow-2xl z-30 hidden group-hover:block p-1">
              <div className="text-[10px] text-[#8B82A6] px-2 py-1 font-mono uppercase">Area Populer</div>
              {INDONESIAN_LOCATIONS.slice(0, 6).map((preset) => (
                <button
                  key={`${preset.city}-${preset.district}`}
                  onClick={() => selectPresetLocation(preset)}
                  className="w-full text-left px-2.5 py-2 text-xs text-[#DED9E8] hover:text-cream hover:bg-[#3A3157] flex items-center justify-between transition-colors cursor-pointer font-mono"
                >
                  <span className="truncate">{preset.district}</span>
                  <span className="text-[10px] text-[#A79EC2] shrink-0">{preset.city}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Denied Helper Banner */}
      {geoStatus === "DENIED" && (
        <div className="bg-[#FFC857]/10 border border-[#FFC857]/40 p-3.5 text-xs text-[#FFC857] flex items-start gap-2.5 font-mono">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>Izin lokasi browser tidak diaktifkan.</strong> Jangan khawatir! Anda tetap dapat memilih area di atas (misal: <em>Gerokgak Buleleng, Jakarta Selatan, atau Bandung</em>) untuk menghitung jarak produk ke lokasi Anda.
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#12101F] border border-[#3A3157] p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B82A6]" />
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
            <label className="text-[10px] font-mono text-[#A79EC2] uppercase block mb-1">Radius Jarak</label>
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
            <label className="text-[10px] font-mono text-[#A79EC2] uppercase block mb-1">Kategori</label>
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
            <label className="text-[10px] font-mono text-[#A79EC2] uppercase block mb-1">Urutkan</label>
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
            <label className="text-[10px] font-mono text-[#A79EC2] uppercase block mb-1">Tampilan Harga</label>
            <div className="flex border border-[#4A4168] bg-[#0E0B18] p-0.5">
              {(["IDR", "XMR", "BTC"] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`flex-1 py-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    currency === curr ? "bg-[#3A3157] text-[#C8FF4D]" : "text-[#A79EC2] hover:text-[#DED9E8]"
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
      <div className="flex items-center justify-between text-xs font-mono text-[#A79EC2] px-1">
        <div>
          Menampilkan <span className="text-[#C8FF4D] font-bold">{processedListings.length}</span> barang di area sekitar
        </div>
        {userCoords && (
          <div className="text-[11px] text-[#C8FF4D] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF4D]" />
            <span>Jarak dihitung realtime berdasarkan koordinat</span>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {processedListings.length === 0 ? (
        <div className="bg-[#12101F] border border-[#3A3157] p-12 text-center space-y-4">
          <Package size={40} className="mx-auto text-[#5C5575]" />
          <div className="text-cream font-bold text-base">Tidak ada barang dalam radius atau pencarian ini</div>
          <p className="text-xs text-[#A79EC2] max-w-md mx-auto">
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
                className="btn-primary text-xs font-bold px-5 py-2 shadow-[0_0_12px_rgba(200,255,77,0.3)]"
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
                className="group bg-[#12101F] border border-[#3A3157] hover:border-[#C8FF4D]/70 transition-all flex flex-col overflow-hidden relative"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] bg-[#19152B] overflow-hidden flex items-center justify-center border-b border-[#3A3157]">
                  {hasImage ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-[#6F6788]">
                      <Package size={36} className="mb-2" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Unit Fisik Legal</span>
                    </div>
                  )}

                  {/* Distance Badge on Image */}
                  <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md border border-[#4A4168] px-2.5 py-1 text-[11px] font-mono font-bold text-[#C8FF4D] flex items-center gap-1.5 shadow-lg">
                    <MapPin size={12} className="text-[#C8FF4D]" />
                    <span>{item.distanceFormatted}</span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(item.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/80 hover:bg-black border border-[#4A4168] hover:border-[#C8FF4D] flex items-center justify-center transition-colors cursor-pointer"
                    title="Simpan ke Wishlist"
                  >
                    <Heart
                      size={15}
                      className={item.isWishlisted ? "text-[#FF6FA8] fill-[#FF6FA8]" : "text-[#C8C2DA]"}
                    />
                  </button>

                  {/* Condition Tag */}
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm border border-[#4A4168] px-2 py-0.5 text-[10px] font-mono text-[#C8C2DA]">
                    {item.condition}
                  </div>

                  {/* SOLD OUT Overlay */}
                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center transform -rotate-12">
                        <div className="text-4xl font-black text-[#FF6FA8] font-mono tracking-widest mb-2 drop-shadow-[0_0_8px_rgba(255,59,48,0.6)]">
                          SOLD OUT
                        </div>
                        <div className="text-xs text-[#A79EC2] font-mono">STOK HABIS</div>
                      </div>
                    </div>
                  )}

                  {/* Low Stock Warning */}
                  {item.stock > 0 && item.stock <= 3 && (
                    <div className="absolute bottom-3 right-3 bg-[#FFC857]/90 backdrop-blur-sm border border-[#FFC857] px-2 py-1 text-[10px] font-mono font-bold text-black animate-pulse">
                      Tersisa {item.stock}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Category & Approximate Location */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A79EC2]">
                      <span className="uppercase">{item.category.replace(/_/g, " ")}</span>
                      <span className="text-[#C8FF4D] font-medium truncate max-w-[140px]">
                        {item.approxLocation}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-cream group-hover:text-[#C8FF4D] transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Description excerpt */}
                    <p className="text-xs text-[#A79EC2] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-[#2A2440] flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#8B82A6] uppercase">Harga Deal COD</div>
                      {currency === "IDR" && (
                        <div className="text-base font-bold text-cream font-mono">
                          Rp {(item.fiatEstimateIdr || 0).toLocaleString("id-ID")}
                        </div>
                      )}
                      {currency === "XMR" && (
                        <div className="text-base font-bold text-[#FF8A3D] font-mono">
                          {formatXmr(item.priceXmr || 0)}
                        </div>
                      )}
                      {currency === "BTC" && (
                        <div className="text-base font-bold text-[#F7931A] font-mono">
                          {formatBtc(item.priceBtc || 0)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#C8FF4D] group-hover:translate-x-1 transition-transform">
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
