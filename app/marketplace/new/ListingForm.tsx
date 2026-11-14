"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createListingAction } from "@/app/actions/escrow";
import {
  ArrowLeft,
  Coins,
  MapPin,
  ShieldCheck,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Sparkles,
  X,
} from "lucide-react";

const IMAGE_PRESETS = [
  {
    name: "ThinkPad Laptop",
    url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
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
    name: "Casio Titanium Watch",
    url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Cyber Hardware Tool",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
  },
];

export function ListingForm({ session }: { session: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("HARDWARE_GADGETS");
  const [priceBtc, setPriceBtc] = useState("0.0025");
  const [priceXmr, setPriceXmr] = useState("1.6");
  const [fiatEstimateIdr, setFiatEstimateIdr] = useState("3500000");
  const [locationCity, setLocationCity] = useState("Jakarta Selatan");
  const [meetupZone, setMeetupZone] = useState("");
  const [condition, setCondition] = useState("MINT / NEW");
  const [imageUrl, setImageUrl] = useState("");
  const [legalConfirmed, setLegalConfirmed] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!legalConfirmed) {
      setErrorMsg("Wajib menyetujui pernyataan barang 100% legal");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("priceBtc", priceBtc);
    formData.append("priceXmr", priceXmr);
    formData.append("fiatEstimateIdr", fiatEstimateIdr);
    formData.append("locationCity", locationCity);
    formData.append("meetupZone", meetupZone.trim());
    formData.append("condition", condition);
    if (imageUrl.trim()) {
      formData.append("imageUrl", imageUrl.trim());
    }

    startTransition(async () => {
      try {
        const res = await createListingAction(formData);
        if (res && !res.success) {
          setErrorMsg(res.error || "Gagal memasang listing");
        }
      } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setErrorMsg(err?.message || "Terjadi kesalahan saat memproses");
      }
    });
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-mono text-[#888] hover:text-[#39FF14] transition-colors"
      >
        <ArrowLeft size={16} /> KEMBALI KE BAZAAR
      </Link>

      <div className="bg-[#121212] border border-[#2a2a2a] p-6 sm:p-10 space-y-8">
        {/* Title Header */}
        <div className="border-b border-[#222222] pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] pulse-green inline-block" />
            <span
              className="text-xs text-[#39FF14] tracking-widest uppercase font-bold"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              NEW MERCHANT LISTING PROTOCOL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Pasang Iklan Barang Fisik P2P
          </h1>
          <p className="text-sm text-[#888] font-sans mt-1.5 leading-relaxed">
            Daftarkan hardware, konsol retro, atau gadget legal Anda untuk transaksi COD tatap muka dengan proteksi Escrow BTC &amp; Monero.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-[#FF4444]/10 border border-[#FF4444]/40 text-[#FF4444] text-sm font-mono p-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-[#bbb] uppercase tracking-wider">
              Judul Barang *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: ThinkPad X230 Libreboot IPS Mod / Keychron Q1 Custom"
              className="input-dark w-full text-base py-3 px-4 font-sans"
            />
          </div>

          {/* Product Image Section */}
          <div className="bg-[#161616] border border-[#2a2a2a] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-[#39FF14] uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={15} />
                <span>Foto Fisik Barang (URL / Gambar) *</span>
              </label>
              <span className="text-xs text-[#777] font-mono">Live Preview Didukung</span>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Masukkan link gambar (https://... / Unsplash / Imgur)"
                className="input-dark w-full text-sm py-2.5 px-4 font-mono text-[#ddd]"
              />
            </div>

            {/* Quick 1-click Preset Chips */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-[#888] uppercase tracking-wider">
                Atau pilih preset foto sampel hardware:
              </div>
              <div className="flex flex-wrap gap-2">
                {IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      imageUrl === p.url
                        ? "border-[#39FF14] text-[#39FF14] bg-[#39FF14]/15 font-bold"
                        : "border-[#333] text-[#888] hover:border-[#555] hover:text-white bg-[#121212]"
                    }`}
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Box */}
            {imageUrl && (
              <div className="mt-3 relative rounded-none border border-[#39FF14]/40 bg-black/60 p-2 overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-[#222] text-xs font-mono text-[#aaa]">
                  <span>PREVIEW FOTO PRODUK:</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[#FF4444] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X size={12} /> Hapus Foto
                  </button>
                </div>
                <div className="aspect-[16/9] max-h-56 w-full overflow-hidden bg-[#0d0d0d] flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Preview Barang"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-[#bbb] uppercase tracking-wider">
                Kategori Barang *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-dark w-full text-sm py-3 px-4 font-sans bg-[#161616]"
              >
                <option value="HARDWARE_GADGETS">Hardware &amp; Gadget</option>
                <option value="RETRO_CONSOLES">Konsol Retro</option>
                <option value="KEYBOARDS_TECH">Keyboard Mekanikal</option>
                <option value="CAMERAS_OPTICS">Kamera &amp; Optik</option>
                <option value="TIMEPIECES_WATCHES">Jam Tangan</option>
                <option value="COLLECTIBLES_EDC">Koleksi &amp; EDC</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-[#bbb] uppercase tracking-wider">
                Kondisi Fisik *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-dark w-full text-sm py-3 px-4 font-sans bg-[#161616]"
              >
                <option value="MINT / NEW">MINT / SEPERTI BARU (100% MULUS)</option>
                <option value="EXCELLENT">EXCELLENT (TERAWAT, NORMAL)</option>
                <option value="USED_TESTED">BEKAS (TESTED &amp; BERFUNGSI NORMAL)</option>
              </select>
            </div>
          </div>

          {/* Crypto Prices Section */}
          <div className="bg-[#161616] border border-[#2a2a2a] p-5 space-y-4">
            <div className="text-xs font-mono font-bold text-[#ccc] uppercase tracking-wider flex items-center justify-between">
              <span>Penetapan Nilai Tukar Escrow</span>
              <span className="text-[#39FF14]">BTC / XMR Direct Lock</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase" style={{ color: "#FF6600" }}>
                  Harga Monero (XMR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceXmr}
                  onChange={(e) => setPriceXmr(e.target.value)}
                  className="input-dark w-full text-base font-mono font-bold py-2.5 px-3.5"
                  style={{ color: "#FF6600" }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase" style={{ color: "#F7931A" }}>
                  Harga Bitcoin (BTC) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={priceBtc}
                  onChange={(e) => setPriceBtc(e.target.value)}
                  className="input-dark w-full text-base font-mono font-bold py-2.5 px-3.5"
                  style={{ color: "#F7931A" }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[#aaa] uppercase">
                  Estimasi Rupiah (IDR)
                </label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={fiatEstimateIdr}
                  onChange={(e) => setFiatEstimateIdr(e.target.value)}
                  className="input-dark w-full text-base font-mono py-2.5 px-3.5 text-[#ddd]"
                />
              </div>
            </div>
          </div>

          {/* Location & Meetup Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-[#bbb] uppercase tracking-wider">
                Kota Lokasi *
              </label>
              <select
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="input-dark w-full text-sm py-3 px-4 font-sans bg-[#161616]"
              >
                <option value="Jakarta Selatan">Jakarta Selatan</option>
                <option value="Jakarta Pusat">Jakarta Pusat</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Medan">Medan</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-[#bbb] uppercase tracking-wider">
                Titik Temu Publik (Meetup Zone COD) *
              </label>
              <input
                type="text"
                required
                value={meetupZone}
                onChange={(e) => setMeetupZone(e.target.value)}
                placeholder="Contoh: Lobby Utama Mall Blok M / Starbucks Dago"
                className="input-dark w-full text-sm py-3 px-4 font-sans"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-[#bbb] uppercase tracking-wider">
              Deskripsi Barang, Riwayat &amp; Kelengkapan *
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi kelengkapan, fungsi, port, baterai, riwayat pemakaian, dan catatan saat serah terima fisik..."
              className="input-dark w-full text-sm p-4 font-sans leading-relaxed"
            />
          </div>

          {/* Legal Compliance Check */}
          <div className="p-4 bg-[#161616] border border-[#2e2e2e] flex items-start gap-3">
            <input
              type="checkbox"
              id="legalCheck"
              checked={legalConfirmed}
              onChange={(e) => setLegalConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#39FF14] cursor-pointer"
            />
            <label htmlFor="legalCheck" className="text-xs text-[#aaa] cursor-pointer leading-relaxed">
              Saya menyatakan bahwa barang ini <strong className="text-white">100% legal</strong> (bukan barang ilegal/terlarang/curian), milik pribadi secara sah, dan bersedia melakukan verifikasi fisik langsung di tempat bersama pembeli sebelum dana dicairkan.
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-4 text-sm font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.4)]"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  MEMASANG LISTING KE JARINGAN...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  PUBLIKASIKAN LISTING KE PIXMART
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
