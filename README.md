# PIXMART

> **Sovereign P2P Escrow Protocol & Decentralized Marketplace**  
> *Jual-beli bebas barang fisik langsung antar manusia. Tanpa bank, tanpa sensor birokrasi, diamankan dengan dual-handshake escrow Bitcoin & Monero.*

---

## ⚡ Ikhtisar Proyek

**PIXMART** adalah platform pasar peer-to-peer (P2P) independen yang mempertemukan penjual dan pembeli untuk bertransaksi barang fisik legal secara langsung tatap muka (Cash on Delivery / COD) dengan perlindungan sistem **Multisig Dual-Handshake Escrow**.

### Pilar Utama Protokol
1. **Nol KYC & Bebas Sensor:** Tidak ada verifikasi KTP, selfie, atau ketergantungan pada rekening bank terpusat.
2. **Deposit Multisig Kriptografi:** Mendukung **Bitcoin (BTC)** dan **Monero (XMR)** untuk privasi stealth vault.
3. **Dual-Handshake Confirmation:** Dana escrow hanya dapat dicairkan apabila **kedua belah pihak** (Buyer & Seller) telah memeriksa kondisi fisik barang dan sama-sama menekan tombol persetujuan (ACC) di lokasi pertemuan publik.
4. **Tanpa Risiko Ekspedisi:** Serah terima langsung di dunia nyata (Mall, Stasiun, Cafe) tanpa risiko barang rusak atau hilang di kurir pihak ketiga.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16.4.6](https://nextjs.org/) (App Router & Turbopack)
- **Library UI:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Data Visualizer:** [Recharts](https://recharts.org/)
- **Desain Sistem:** Modern Retro-Arcade Terminal (Single Primary Terminal Green `#39FF14`)

---

## 🚀 Memulai (Getting Started)

1. **Clone repository:**
   ```bash
   git clone https://github.com/zdn2pwn/Pixmart.git
   cd Pixmart
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📂 Struktur Rute & Fitur

- `/` : Landing page sovereign protocol & overview pasar terbuka
- `/marketplace` : Katalog penawaran barang P2P dengan filter kota (Jakarta, Bandung, Surabaya, Yogyakarta, dll.) dan currency toggle (BTC/XMR)
- `/marketplace/[id]` : Halaman detail barang, foto fisik, estimasi fiat IDR, dan form penguncian escrow
- `/marketplace/new` : Form pasang iklan barang oleh seller dengan fitur live image preview & preset foto hardware
- `/escrow/[id]` : Ruang serah terima fisik (Dual-Handshake Room) dengan OTP verifikasi dan tombol konfirmasi dua pihak
- `/admin` : Owner Radar & Platform Telemetry Command Center
- `/admin/sales` : P2P Escrow Ledger & audit log transaksi
- `/admin/products` : Moderasi dan compliance audit inventaris barang
- `/admin/users` : Direktori peer nodes & reputasi pengguna
- `/admin/settings` : Konfigurasi parameter protokol multisig & timeout

---

## 📄 Kebijakan Hukum
PIXMART secara ketat menerapkan **Zero Contraband Policy** — hanya diperuntukkan bagi transaksi barang fisik legal milik pribadi yang sah secara hukum.
