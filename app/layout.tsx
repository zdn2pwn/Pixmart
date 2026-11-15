import type { Metadata, Viewport } from "next";
import { CustomAlertProvider } from "@/components/ui/CustomAlert";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PIXMART — Pasar COD Lokal",
    template: "%s | PIXMART",
  },
  description:
    "Pasar langsung untuk barang fisik di kotamu. Nego, ketemu, cek barang, lalu selesaikan deal dengan escrow demo.",
  keywords: [
    "marketplace lokal",
    "COD",
    "barang fisik",
    "escrow",
    "jual beli",
    "PIXMART",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0a0812",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className="dark h-full">
      <body className="min-h-full antialiased">
        <CustomAlertProvider>{children}</CustomAlertProvider>
      </body>
    </html>
  );
}
