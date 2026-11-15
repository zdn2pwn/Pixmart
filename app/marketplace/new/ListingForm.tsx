"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createListingAction } from "@/app/actions/marketplace";
import { INDONESIAN_LOCATIONS } from "@/lib/location";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const IMAGE_PRESETS = [
  {
    name: "ThinkPad Laptop",
    url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "iPhone / Smartphone",
    url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Game Boy Retro",
    url: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Custom Keyboard",
    url: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Sony Camera",
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Monitor Gaming",
    url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
  },
];

export function ListingForm() {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("HARDWARE_GADGETS");
  const [fiatEstimateIdr, setFiatEstimateIdr] = useState("3500000");
  const [stock, setStock] = useState("1");

  // Province list (unique regions) derived from presets
  const PROVINCES = Array.from(
    new Set(INDONESIAN_LOCATIONS.map((l) => l.region))
  );
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0] || "DKI Jakarta");

  const defaultPreset =
    INDONESIAN_LOCATIONS.find((l) => l.region === selectedProvince) ||
    INDONESIAN_LOCATIONS[0];

  const [locationCity, setLocationCity] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [approxLatitude, setApproxLatitude] = useState(defaultPreset.latitude);
  const [approxLongitude, setApproxLongitude] = useState(defaultPreset.longitude);
  const [meetupZone, setMeetupZone] = useState("");
  const [meetingAvailability, setMeetingAvailability] = useState("Senin-Jumat sore atau akhir pekan bebas");

  const [condition, setCondition] = useState("MINT / NEW");
  const [imageUrl, setImageUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleProvinceChange(province: string) {
    setSelectedProvince(province);
    const p = INDONESIAN_LOCATIONS.find((l) => l.region === province);
    if (p) {
      setApproxLatitude(p.latitude);
      setApproxLongitude(p.longitude);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("fiatEstimateIdr", fiatEstimateIdr);
    formData.append("stock", stock);
    formData.append("locationCity", locationCity);
    formData.append("locationDistrict", locationDistrict);
    formData.append("locationRegion", selectedProvince);
    formData.append("approxLatitude", String(approxLatitude));
    formData.append("approxLongitude", String(approxLongitude));
    formData.append("meetupZone", meetupZone.trim());
    formData.append("meetingAvailability", meetingAvailability.trim());
    formData.append("condition", condition);
    if (imageUrl.trim()) {
      formData.append("imageUrl", imageUrl.trim());
    }

    startTransition(async () => {
      const res = await createListingAction(formData);
      if (res.success) {
        // Success - will redirect automatically
      } else {
        setErrorMsg(res.error || "Gagal memasang iklan");
      }
    });
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#A79EC2] hover:text-[#C8FF4D] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Katalog
      </Link>

      <div className="border-b border-[#3A3157] pb-4">
        <div className="text-xs font-mono text-[#C8FF4D] uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C8FF4D] pulse-green" />
          <span>SELLER LISTING PROTOCOL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-cream tracking-tight">
          Pasang Iklan Produk Lokal (COD)
        </h1>
        <p className="text-xs font-mono text-[#A79EC2] mt-1">
          Barang akan dicari oleh pembeli berdasarkan jarak lokasi terdekat.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Info Dasar */}
        <div className="bg-[#12101F] border border-[#3A3157] p-6 space-y-4">
          <h2 className="text-sm font-bold text-cream font-mono uppercase tracking-wider border-b border-[#3A3157] pb-2">
            1. Informasi Barang
          </h2>

          <div>
            <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
              Nama Produk <span className="text-[#C8FF4D]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: ThinkPad X230 Libreboot / iPhone 13 128GB"
              className="input-dark w-full px-4 py-2.5 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#C8C2DA] block mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
              >
                <option value="HARDWARE_GADGETS">Gadget</option>
                <option value="RETRO_CONSOLES">Konsol Retro</option>
                <option value="KEYBOARDS_TECH">Keyboard Mekanikal</option>
                <option value="CAMERAS_OPTICS">Kamera &amp; Optik</option>
                <option value="TIMEPIECES_WATCHES">Jam Tangan</option>
                <option value="COLLECTIBLES_EDC">Koleksi &amp; EDC</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-[#C8C2DA] block mb-1">Kondisi</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
              >
                <option value="MINT / NEW">MINT / NEW (Koleksi / Mulus)</option>
                <option value="EXCELLENT">EXCELLENT (Terawat Normal)</option>
                <option value="USED_TESTED">USED_TESTED (Bekas Normal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
              Deskripsi Fisik &amp; Kelengkapan <span className="text-[#C8FF4D]">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Jelaskan kondisi fisik barang, riwayat pemakaian, kelengkapan aksesoris, dan kesiapan untuk dicek saat ketemuan COD..."
              className="input-dark w-full p-3 text-xs font-mono leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
                Harga Jual Patokan (IDR) <span className="text-[#C8FF4D]">*</span>
              </label>
              <input
                type="number"
                value={fiatEstimateIdr}
                onChange={(e) => setFiatEstimateIdr(e.target.value)}
                min={50000}
                step={50000}
                className="input-dark w-full py-2.5 px-3 text-sm font-mono font-bold text-[#C8FF4D]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
                Jumlah Stok Tersedia <span className="text-[#C8FF4D]">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min={1}
                step={1}
                className="input-dark w-full py-2.5 px-3 text-sm font-mono font-bold text-[#C8FF4D]"
                required
              />
              <p className="text-[10px] font-mono text-[#8B82A6] mt-1">
                Jumlah unit yang tersedia. Set 0 untuk SOLD OUT.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Lokasi Produk & Privasi */}
        <div className="bg-[#12101F] border border-[#3A3157] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#3A3157] pb-2">
            <h2 className="text-sm font-bold text-cream font-mono uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-[#C8FF4D]" />
              <span>2. Lokasi Produk (Untuk Hitungan Jarak ke Pembeli)</span>
            </h2>
            <span className="text-[10px] font-mono text-[#C8FF4D] bg-[#C8FF4D]/10 border border-[#C8FF4D]/30 px-2 py-0.5">
              PRIVASI AMAN
            </span>
          </div>

          <div>
            <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
              Provinsi
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
            >
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            <p className="text-[10px] font-mono text-[#8B82A6] mt-1">
              Pilih provinsi, lalu ketik kota/kabupaten & kecamatan di bawah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
                Kecamatan / Area (District)
              </label>
              <input
                type="text"
                value={locationDistrict}
                onChange={(e) => setLocationDistrict(e.target.value)}
                placeholder="Contoh: Gerokgak / Kebayoran Baru"
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="Contoh: Buleleng / Jakarta Selatan"
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
              Rekomendasi Area Publik untuk Titik Temu (Zone)
            </label>
            <input
              type="text"
              value={meetupZone}
              onChange={(e) => setMeetupZone(e.target.value)}
              placeholder="Contoh: Sekitar Area Pertokoan Gerokgak / Mall Blok M Square"
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
              required
            />
            <p className="text-[10px] font-mono text-[#8B82A6] mt-1">
              🔒 <strong>JANGAN masukkan alamat rumah pribadi.</strong> Cukup sebutkan area publik umum.
            </p>
          </div>

          <div>
            <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
              Ketersediaan Waktu Ketemuan (Availability Notes)
            </label>
            <input
              type="text"
              value={meetingAvailability}
              onChange={(e) => setMeetingAvailability(e.target.value)}
              placeholder="Contoh: Sore jam 16:00 - 19:00 WIB atau Weekend bebas"
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
            />
          </div>
        </div>

        {/* Step 3: Foto Barang */}
        <div className="bg-[#12101F] border border-[#3A3157] p-6 space-y-4">
          <h2 className="text-sm font-bold text-cream font-mono uppercase tracking-wider border-b border-[#3A3157] pb-2">
            3. Foto Fisik Produk
          </h2>

          <div>
            <label className="text-xs font-mono text-[#C8C2DA] block mb-1">
              URL Foto Produk (Bisa masukkan tautan gambar langsung)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
            />
          </div>

          {/* Preset Foto Produk */}
          <div>
            <div className="text-[10px] font-mono text-[#A79EC2] uppercase mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#C8FF4D]" />
              <span>Pilihan Cepat Foto Produk (1-Click Preset):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {IMAGE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setImageUrl(preset.url)}
                  className={`p-2 text-left border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                    imageUrl === preset.url
                      ? "bg-[#C8FF4D]/10 border-[#C8FF4D] text-[#C8FF4D] font-bold"
                      : "bg-[#19152B] border-[#4A4168] text-[#C8C2DA] hover:text-cream hover:bg-[#202020]"
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-8 h-8 object-cover shrink-0" />
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {imageUrl && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-[#A79EC2] mb-1">Preview Foto:</div>
              <div className="w-48 h-32 bg-[#19152B] border border-[#4A4168] overflow-hidden">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,255,77,0.3)]"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Plus size={16} />
                <span>Publikasikan Iklan Produk Lokal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
