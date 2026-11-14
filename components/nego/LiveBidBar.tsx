"use client";

import { useState } from "react";
import { Loader2, TrendingDown, DollarSign } from "lucide-react";

interface LiveBidBarProps {
  negotiation: any;
  isBuyer: boolean;
  isSeller: boolean;
  onCounterOffer: (method: 'BTC' | 'XMR', amount: number) => Promise<void>;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}

export function LiveBidBar({
  negotiation,
  isBuyer,
  isSeller,
  onCounterOffer,
  onAccept,
  onReject,
  isPending,
}: LiveBidBarProps) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BTC' | 'XMR'>('BTC');
  const [inputAmount, setInputAmount] = useState(''); // RENAMED from offerAmount

  // Fiat conversion rates
  const btcToIdr = 1400000000; // 1 BTC ≈ Rp 1.4B
  const xmrToIdr = 3500000; // 1 XMR ≈ Rp 3.5M

  const estimateFiat = (amount: number, method: 'BTC' | 'XMR') => {
    if (isNaN(amount) || amount <= 0) return 0;
    return Math.round(amount * (method === 'BTC' ? btcToIdr : xmrToIdr));
  };

  const handleSubmitCounter = async () => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Masukkan jumlah yang valid!");
      return;
    }

    await onCounterOffer(paymentMethod, amount);
    setShowCounterForm(false);
    setInputAmount('');
  };

  const listingPriceBTC = negotiation.listing?.price_btc || 0;
  const listingPriceXMR = negotiation.listing?.price_xmr || 0;
  const currentOfferBTC = negotiation.current_offer_btc || 0;
  const currentOfferXMR = negotiation.current_offer_xmr || 0;

  // Deal agreement status (2/2 system)
  const dealBuyerAgreed = negotiation.deal_buyer_agreed || false;
  const dealSellerAgreed = negotiation.deal_seller_agreed || false;
  const dealCount = (dealBuyerAgreed ? 1 : 0) + (dealSellerAgreed ? 1 : 0);

  // Determine which method is being used
  const offerMethod = currentOfferBTC > 0 ? 'BTC' : (currentOfferXMR > 0 ? 'XMR' : null);
  const offerAmount = currentOfferBTC > 0 ? currentOfferBTC : currentOfferXMR; // This is fine now
  const listingAmount = offerMethod === 'BTC' ? listingPriceBTC : (offerMethod === 'XMR' ? listingPriceXMR : listingPriceBTC);

  const hasOffer = currentOfferBTC > 0 || currentOfferXMR > 0;

  // Calculate discount percentage based on method
  const discountPercent = hasOffer && offerMethod && listingAmount > 0
    ? Math.round(((listingAmount - offerAmount) / listingAmount) * 100)
    : 0;

  return (
    <div className="bg-[#0f0f0f] border-b-2 border-[#39FF14]/30 p-3">
      {!showCounterForm ? (
        <>
          {/* Compact Price Display */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Buyer Offer */}
              <div className="flex items-center gap-2">
                <div className="text-xs text-[#666] uppercase">Offer:</div>
                {hasOffer ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-[#39FF14]">
                      {offerMethod === 'BTC' && `${offerAmount.toFixed(8)} BTC`}
                      {offerMethod === 'XMR' && `${offerAmount.toFixed(4)} XMR`}
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex items-center gap-1 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs px-2 py-0.5 rounded-full">
                        <TrendingDown size={10} />
                        <span>{discountPercent}% OFF</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-mono text-[#666]">????</div>
                )}
              </div>

              <div className="text-[#333]">•</div>

              {/* Listing Price */}
              <div className="flex items-center gap-2">
                <div className="text-xs text-[#666] uppercase">Original:</div>
                <div className="text-sm font-bold text-[#FF6600]">
                  {listingPriceBTC.toFixed(8)} BTC
                </div>
              </div>
            </div>

            {/* Live Badge */}
            <div className="bg-[#FF6600] text-black text-xs font-bold px-2 py-1 rounded animate-pulse">
              LIVE
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Deal Status (2/2) */}
            {hasOffer && dealCount > 0 && (
              <div className="bg-[#39FF14]/10 border border-[#39FF14]/50 p-2 text-center">
                <div className="text-xs font-bold text-[#39FF14]">
                  Deal Agreement: {dealCount}/2
                </div>
                <div className="text-[10px] text-[#888] mt-1">
                  {dealBuyerAgreed && "✓ Buyer agreed"} {dealSellerAgreed && "✓ Seller agreed"}
                </div>
                {dealCount === 1 && (
                  <div className="text-[10px] text-[#FFB800] mt-1 animate-pulse">
                    Menunggu pihak lain...
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {/* Counter Offer Button */}
              <button
                onClick={() => setShowCounterForm(true)}
                disabled={isPending}
                className="bg-[#FF6600]/10 hover:bg-[#FF6600]/20 border border-[#FF6600]/50 text-[#FF6600] py-2 text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                💰 {isBuyer ? "Tawar" : "Counter"}
              </button>

              {/* Deal Button (for both buyer and seller) */}
              {hasOffer && (
                <button
                  onClick={onAccept}
                  disabled={isPending || (isBuyer && dealBuyerAgreed) || (isSeller && dealSellerAgreed)}
                  className="bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : 
                   (isBuyer && dealBuyerAgreed) || (isSeller && dealSellerAgreed) ? 
                   "✓ Agreed" : "✓ Deal"}
                </button>
              )}

              {/* Buy at Original (for Buyer if NO offer yet) */}
              {isBuyer && !hasOffer && (
                <button
                  onClick={onAccept}
                  disabled={isPending}
                  className="col-span-2 bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <>🛒 Beli Harga Asli</>}
                </button>
              )}

              {/* Reject Button */}
              {((isSeller && hasOffer) || isBuyer) && (
                <button
                  onClick={onReject}
                  disabled={isPending}
                  className="bg-[#FF4444]/10 hover:bg-[#FF4444]/20 border border-[#FF4444]/50 text-[#FF4444] py-2 text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Counter Offer Form - Compact */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">
              {isBuyer ? "💰 Ajukan Tawaran" : "💰 Counter Offer"}
            </h4>
            <button
              onClick={() => {
                setShowCounterForm(false);
                setInputAmount('');
              }}
              className="text-xs text-[#666] hover:text-white"
            >
              ✕ Tutup
            </button>
          </div>

          {/* Payment Method Radio - Horizontal */}
          <div className="flex gap-2">
            <label
              className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-all ${
                paymentMethod === 'BTC'
                  ? 'bg-[#F7931A]/10 border-[#F7931A] text-[#F7931A]'
                  : 'bg-[#1a1a1a] border-[#333] text-[#666] hover:border-[#555]'
              }`}
            >
              <input
                type="radio"
                value="BTC"
                checked={paymentMethod === 'BTC'}
                onChange={() => setPaymentMethod('BTC')}
                className="sr-only"
              />
              <span className="text-xs font-bold">🪙 BTC</span>
            </label>

            <label
              className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded cursor-pointer transition-all ${
                paymentMethod === 'XMR'
                  ? 'bg-[#FF6600]/10 border-[#FF6600] text-[#FF6600]'
                  : 'bg-[#1a1a1a] border-[#333] text-[#666] hover:border-[#555]'
              }`}
            >
              <input
                type="radio"
                value="XMR"
                checked={paymentMethod === 'XMR'}
                onChange={() => setPaymentMethod('XMR')}
                className="sr-only"
              />
              <span className="text-xs font-bold">🔒 XMR</span>
            </label>
          </div>

          {/* Amount Input - Compact */}
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="col-span-2">
              <input
                type="number"
                step={paymentMethod === 'BTC' ? '0.00000001' : '0.0001'}
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder={paymentMethod === 'BTC' ? '0.00000000' : '0.0000'}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#39FF14]"
              />
              {inputAmount && !isNaN(parseFloat(inputAmount)) && (
                <div className="text-xs text-[#888] mt-1">
                  ≈ Rp {estimateFiat(parseFloat(inputAmount), paymentMethod).toLocaleString('id-ID')}
                </div>
              )}
            </div>
            <button
              onClick={handleSubmitCounter}
              disabled={isPending || !inputAmount}
              className="bg-[#39FF14] hover:bg-[#2ECC11] text-black py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Kirim"}
            </button>
          </div>

          {/* Reference Price - Compact */}
          <div className="text-xs text-[#666] flex items-center justify-between">
            <span>Listing:</span>
            <span className="text-white font-mono">
              {paymentMethod === 'BTC' 
                ? `${listingPriceBTC.toFixed(8)} BTC`
                : `${listingPriceXMR.toFixed(4)} XMR`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
