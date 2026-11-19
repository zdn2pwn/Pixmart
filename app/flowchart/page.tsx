import Script from "next/script";

export const metadata = {
  title: "Flowchart | PIXMART",
  description: "Flowchart alur aplikasi PIXMART.",
};

const embedHtml = `<mermaid-embed src="https://mermaid.live/embed?theme=default&look=neo&mode=light" height="480">
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
    <main className="min-h-screen bg-white text-black">
      <Script src="https://mermaid.live/embed.js" strategy="afterInteractive" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Flowchart PIXMART</h1>
        <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
      </div>
    </main>
  );
}
