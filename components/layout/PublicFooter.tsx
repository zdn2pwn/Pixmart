export function PublicFooter() {
  return (
    <footer className="border-t border-[#1c1c1c] bg-[#0c0c0c] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div
              className="text-base font-bold select-none"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <span className="text-white">PIX</span>
              <span className="text-[#39FF14]">MART</span>
            </div>
            <p className="text-xs text-[#777] font-sans leading-relaxed max-w-xs">
              Marketplace peer-to-peer barang fisik legal di Indonesia. Transaksi tatap muka (COD) dengan proteksi escrow multisig Bitcoin &amp; Monero.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#aaa] uppercase tracking-wider font-bold">Navigasi</div>
            <ul className="space-y-2 text-xs font-sans text-[#777]">
              <li><a href="/marketplace" className="hover:text-[#39FF14] transition-colors">Katalog Hardware</a></li>
              <li><a href="/marketplace/new" className="hover:text-[#39FF14] transition-colors">Pasang Iklan Barang</a></li>
              <li><a href="/admin" className="hover:text-[#39FF14] transition-colors">Owner Radar &amp; Ledger</a></li>
            </ul>
          </div>

          {/* Protocol Policies */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#aaa] uppercase tracking-wider font-bold">Protokol Transaksi</div>
            <ul className="space-y-2 text-xs font-sans text-[#777]">
              <li className="text-[#39FF14]">✓ 100% Barang Fisik Legal</li>
              <li>✓ Dual-Handshake Escrow (Keduanya ACC)</li>
              <li>✓ Tanpa Ekspedisi Kurir (COD Saja)</li>
              <li>✓ Deposit BTC &amp; Monero Stealth Vault</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] mt-8 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-sans text-[#555]">
          <span>PIXMART — P2P Escrow Protocol</span>
          <span>Zero Contraband Policy · Strictly Legal Hardware Only</span>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
