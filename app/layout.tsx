import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PIXMART — P2P Escrow Hardware Marketplace",
    template: "%s | PIXMART",
  },
  description:
    "Marketplace peer-to-peer barang fisik legal dengan proteksi dual-handshake escrow Bitcoin & Monero.",
  keywords: ["P2P", "marketplace", "escrow", "bitcoin", "monero", "hardware"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#0a0a0a] text-[#f0f0f0] antialiased">
        {children}
      </body>
    </html>
  );
}
