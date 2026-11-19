import Link from "next/link";
import Script from "next/script";

export const metadata = {
  title: "Flowchart | PIXMART",
  description: "Flowchart alur aplikasi PIXMART.",
};

const embedHtml = `<mermaid-embed src="https://mermaid.live/embed?theme=default&look=neo&mode=light" height="640">
%%{init: {'theme':'default','themeVariables':{'background':'#ffffff','primaryColor':'#f9fafb','primaryTextColor':'#111827','primaryBorderColor':'#6b7280','lineColor':'#4b5563'}}}%%
flowchart TD
    A([Start]) --> L[Landing /]
    L --> AUTH{Akun?}
    AUTH -- Ya --> LG[Login]
    AUTH -- Tidak --> RG[Register]
    RG --> ONB[Onboarding&lt;br/&gt;pilih role &amp; wallet]
    LG --> SETUP{Setup selesai?}
    SETUP -- Belum --> ONB
    SETUP -- Sudah --> ROLE{Role}
    ONB --> ROLE

    ROLE -->|Buyer| BD[Buyer Dashboard]
    BD --> MKT[Marketplace&lt;br/&gt;filter kota/kategori/radius]
    MKT --> DET[Detail Produk]
    DET --> WISH[Wishlist]
    DET --> NEGO[Nego&lt;br/&gt;chat &amp; offer]
    NEGO --> ESC[Escrow]
    ESC --> P1[Proposal Pertemuan]
    P1 --> P2[Konfirmasi Jadwal]
    P2 --> P3[Kedatangan Buyer &amp; Seller]
    P3 --> P4[Handshake Dua Pihak]
    P4 --> OK[Selesai]
    BD --> PROF[Profil&lt;br/&gt;wallet &amp; reputasi]

    ROLE -->|Seller| SD[Seller Dashboard]
    SD --> NEW[Pasang/Edit Iklan&lt;br/&gt;stok &amp; lokasi]
    NEW --> LST[(Listing ACTIVE)]
    LST --> MKT
    SD --> INB[Nego Masuk]
    INB --> NEGO

    ROLE -->|Midman| OD[Midman Dashboard]
    OD --> Q[Antrian Escrow]
    Q --> VER[Verifikasi &amp; Rilis Dana]
    VER --> OK

    WISH --> NTF[Notifikasi]
    NEGO --> NTF
    ESC --> NTF
    L --> NF[404 Not Found]

    classDef buyer fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px;
    classDef seller fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px;
    classDef midman fill:#fef9c3,stroke:#ca8a04,color:#713f12,stroke-width:2px;
    classDef neutral fill:#f3f4f6,stroke:#6b7280,color:#111827;

    class BD,MKT,DET,WISH,NEGO,ESC,P1,P2,P3,P4,OK,PROF buyer;
    class SD,NEW,LST,INB seller;
    class OD,Q,VER midman;
    class A,L,AUTH,LG,RG,ONB,SETUP,ROLE,NTF,NF neutral;
</mermaid-embed>`;

export default function FlowchartPage() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
          Alur aplikasi
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Flowchart PIXMART
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-ink">
          Diagram alur end-to-end dari landing hingga transaksi escrow untuk
          tiga peran utama. Gunakan legenda di bawah untuk membaca warna.
        </p>

        {/* Mermaid embed */}
        <div className="mt-6 overflow-hidden rounded-md border border-line bg-white p-2">
          <Script src="https://mermaid.live/embed.js" strategy="afterInteractive" />
          <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
        </div>

        {/* Legend */}
        <section className="mt-8">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-ink">
            Legenda
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
            <span className="rounded border border-emerald-400/40 bg-emerald-400/5 px-2.5 py-1 text-emerald-100">
              Buyer
            </span>
            <span className="rounded border border-sky-400/40 bg-sky-400/5 px-2.5 py-1 text-sky-100">
              Seller
            </span>
            <span className="rounded border border-amber-400/40 bg-amber-400/5 px-2.5 py-1 text-amber-100">
              Midman
            </span>
            <span className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-cream">
              Umum
            </span>
          </div>
        </section>

        {/* Penjelasan */}
        <section className="mt-8">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-ink">
            Penjelasan alur
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-line bg-surface p-4">
              <div className="text-sm font-semibold text-cream">Buyer</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                Mencari produk, negosiasi harga, masuk escrow, lalu menyelesaikan
                handshake dua pihak setelah cek barang.
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <div className="text-sm font-semibold text-cream">Seller</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                Memasang iklan, mengelola stok dan lokasi, merespon negosiasi,
                dan menyerahkan barang saat pertemuan.
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <div className="text-sm font-semibold text-cream">Midman</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                Memantau antrian escrow dan memverifikasi transaksi setelah
                kedua pihak konfirmasi.
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface p-4">
              <div className="text-sm font-semibold text-cream">Escrow</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">
                Proposal pertemuan, konfirmasi jadwal, kedatangan, dan handshake
                dua pihak sebelum penyelesaian.
              </p>
            </div>
          </div>
        </section>

        {/* Catatan */}
        <section className="mt-8 rounded-md border border-amber-400/30 bg-amber-400/5 p-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
            Catatan
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-ink">
            Escrow, saldo, dan cryptocurrency (BTC/XMR) pada aplikasi ini
            bersifat simulasi untuk keperluan demo. Tidak ada dana nyata yang
            bergerak.
          </p>
        </section>

        {/* Tombol ke landing */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="btn-primary !border-lime !bg-lime !text-ink hover:!bg-lime/80"
          >
            Kembali ke Landing
          </Link>
        </div>
      </div>
    </main>
  );
}
