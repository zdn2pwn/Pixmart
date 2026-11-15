"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateListingAction } from "@/app/actions/marketplace";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  AlertCircle,
  Save,
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

export function EditListingForm({ listing }: { listing: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(listing.title || "");
  const [description, setDescription] = useState(listing.description || "");
  const [category, setCategory] = useState(listing.category || "HARDWARE_GADGETS");
  const [fiatEstimateIdr, setFiatEstimateIdr] = useState(String(listing.fiat_estimate_idr || 3500000));
  const [stock, setStock] = useState(String(listing.stock || 1));

  const [locationCity, setLocationCity] = useState(listing.location_city || "");
  const [locationDistrict, setLocationDistrict] = useState(listing.location_district || "");
  const approxLatitude = listing.approx_latitude || -6.2415;
  const approxLongitude = listing.approx_longitude || 106.7978;
  const [meetupZone, setMeetupZone] = useState(listing.meetup_zone || "");
  const [meetingAvailability, setMeetingAvailability] = useState(listing.meeting_availability || "");

  const [condition, setCondition] = useState(listing.condition || "MINT / NEW");
  const [imageUrl, setImageUrl] = useState(listing.images?.[0] || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("listingId", listing.id);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("fiatEstimateIdr", fiatEstimateIdr);
    formData.append("stock", stock);
    formData.append("locationCity", locationCity);
    formData.append("locationDistrict", locationDistrict);
    formData.append("approxLatitude", String(approxLatitude));
    formData.append("approxLongitude", String(approxLongitude));
    formData.append("meetupZone", meetupZone.trim());
    formData.append("meetingAvailability", meetingAvailability.trim());
    formData.append("condition", condition);
    if (imageUrl.trim()) {
      formData.append("imageUrl", imageUrl.trim());
    }

    startTransition(async () => {
      try {
        const res = await updateListingAction(formData);

        if (res?.success) {
          // Pastikan dashboard seller mengambil data terbaru dari server
          // setelah listing diupdate.
          router.push("/seller");
          router.refresh();
          return;
        }

        setErrorMsg(res?.error || "Gagal mengupdate listing");
      } catch (err: any) {
        if (err?.digest?.includes?.("NEXT_REDIRECT") || err?.message === "NEXT_REDIRECT") {
          setErrorMsg("Sesi Anda berakhir. Silakan login kembali.");
          return;
        }

        console.error("[EditListingForm] Update exception:", err);
        setErrorMsg("Terjadi kesalahan: " + String(err?.message || err));
      }
    });
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
      <Link
        href="/seller"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      <div className="border-b border-[#222222] pb-4">
        <div className="text-xs font-mono text-[#39FF14] uppercase tracking-wider mb-1 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green" />
          <span>EDIT LISTING</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Edit Produk: {listing.title}
        </h1>
        <p className="text-xs font-mono text-[#888] mt-1">
          Update informasi produk yang sudah terdaftar.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Barang */}
        <div className="bg-[#121212] border border-[#262626] p-6 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-[#222] pb-2">
            Informasi Barang
          </h2>

          <div>
            <label className="text-xs font-mono text-[#aaa] block mb-1">
              Nama Produk <span className="text-[#39FF14]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-dark w-full px-4 py-2.5 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#aaa] block mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
              >
                <option value="HARDWARE_GADGETS">Hardware &amp; Gadget</option>
                <option value="RETRO_CONSOLES">Konsol Retro</option>
                <option value="KEYBOARDS_TECH">Keyboard Mekanikal</option>
                <option value="CAMERAS_OPTICS">Kamera &amp; Optik</option>
                <option value="TIMEPIECES_WATCHES">Jam Tangan</option>
                <option value="COLLECTIBLES_EDC">Koleksi &amp; EDC</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-[#aaa] block mb-1">Kondisi</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
              >
                <option value="MINT / NEW">MINT / NEW</option>
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="USED_TESTED">USED_TESTED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#aaa] block mb-1">
              Deskripsi <span className="text-[#39FF14]">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input-dark w-full p-3 text-xs font-mono leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#aaa] block mb-1">
                Harga (IDR) <span className="text-[#39FF14]">*</span>
              </label>
              <input
                type="number"
                value={fiatEstimateIdr}
                onChange={(e) => setFiatEstimateIdr(e.target.value)}
                min={50000}
                step={50000}
                className="input-dark w-full py-2.5 px-3 text-sm font-mono font-bold text-[#39FF14]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#aaa] block mb-1">
                Stok <span className="text-[#39FF14]">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min={0}
                step={1}
                className="input-dark w-full py-2.5 px-3 text-sm font-mono font-bold text-[#39FF14]"
                required
              />
              <p className="text-[10px] font-mono text-[#666] mt-1">
                Set 0 untuk SOLD OUT
              </p>
            </div>
          </div>
        </div>

        {/* Lokasi */}
        <div className="bg-[#121212] border border-[#262626] p-6 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-[#222] pb-2 flex items-center gap-2">
            <MapPin size={16} className="text-[#39FF14]" />
            <span>Lokasi Produk</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#aaa] block mb-1">Kecamatan</label>
              <input
                type="text"
                value={locationDistrict}
                onChange={(e) => setLocationDistrict(e.target.value)}
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#aaa] block mb-1">Kota</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="input-dark w-full py-2.5 px-3 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#aaa] block mb-1">Area Titik Temu</label>
            <input
              type="text"
              value={meetupZone}
              onChange={(e) => setMeetupZone(e.target.value)}
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#aaa] block mb-1">Ketersediaan Waktu</label>
            <input
              type="text"
              value={meetingAvailability}
              onChange={(e) => setMeetingAvailability(e.target.value)}
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
            />
          </div>
        </div>

        {/* Foto */}
        <div className="bg-[#121212] border border-[#262626] p-6 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider border-b border-[#222] pb-2">
            Foto Produk
          </h2>

          <div>
            <label className="text-xs font-mono text-[#aaa] block mb-1">URL Foto</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input-dark w-full py-2.5 px-3 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {IMAGE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.name}
                onClick={() => setImageUrl(preset.url)}
                className={`p-2 text-left border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                  imageUrl === preset.url
                    ? "bg-[#39FF14]/10 border-[#39FF14] text-[#39FF14] font-bold"
                    : "bg-[#161616] border-[#333] text-[#aaa] hover:text-white hover:bg-[#202020]"
                }`}
              >
                <img src={preset.url} alt={preset.name} className="w-8 h-8 object-cover shrink-0" />
                <span className="truncate">{preset.name}</span>
              </button>
            ))}
          </div>

          {imageUrl && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-[#888] mb-1">Preview:</div>
              <div className="w-48 h-32 bg-[#181818] border border-[#333] overflow-hidden">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Save size={16} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>

          <Link
            href="/seller"
            className="btn-ghost px-6 py-3.5 text-xs font-bold"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
