"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  Bitcoin,
  Check,
  Clock3,
  EyeOff,
  HandCoins,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  TrendingDown,
  X,
} from "lucide-react";

interface LiveBidBarProps {
  negotiation: any;
  isBuyer: boolean;
  isSeller: boolean;
  onCounterOffer: (method: "BTC" | "XMR", amount: number) => Promise<void>;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}

const BTC_TO_IDR = 1_400_000_000;
const XMR_TO_IDR = 3_500_000;

function formatCrypto(amount: number, method: "BTC" | "XMR") {
  const decimals = method === "BTC" ? 8 : 4;
  return `${Number(amount).toFixed(decimals)} ${method}`;
}

function formatIdr(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function AgreementSeat({
  label,
  agreed,
}: {
  label: string;
  agreed: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 border-2 px-2.5 py-2 ${
        agreed
          ? "border-lime/60 bg-lime/10"
          : "border-line bg-panel/60"
      }`}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center border-2 ${
          agreed
            ? "border-ink bg-lime text-ink"
            : "border-line bg-ink text-muted-ink"
        }`}
      >
        {agreed ? (
          <Check size={14} strokeWidth={3} />
        ) : (
          <Clock3 size={13} />
        )}
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
          {label}
        </div>
        <div
          className={`text-[13px] font-bold ${
            agreed ? "text-lime" : "text-cream"
          }`}
        >
          {agreed ? "Agreed" : "Waiting"}
        </div>
      </div>
    </div>
  );
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
  const [paymentMethod, setPaymentMethod] = useState<"BTC" | "XMR">("BTC");
  const [inputAmount, setInputAmount] = useState("");

  const listingPriceBTC = Number(negotiation.listing?.price_btc || 0);
  const listingPriceXMR = Number(negotiation.listing?.price_xmr || 0);
  const currentOfferBTC = Number(negotiation.current_offer_btc || 0);
  const currentOfferXMR = Number(negotiation.current_offer_xmr || 0);

  const dealBuyerAgreed = Boolean(negotiation.deal_buyer_agreed);
  const dealSellerAgreed = Boolean(negotiation.deal_seller_agreed);
  const dealCount = (dealBuyerAgreed ? 1 : 0) + (dealSellerAgreed ? 1 : 0);

  const offerMethod: "BTC" | "XMR" | null =
    currentOfferBTC > 0 ? "BTC" : currentOfferXMR > 0 ? "XMR" : null;
  const offerAmount = currentOfferBTC > 0 ? currentOfferBTC : currentOfferXMR;
  const hasOffer = offerMethod !== null;

  const methodForPrices = offerMethod ?? "BTC";
  const listingAmount =
    methodForPrices === "BTC" ? listingPriceBTC : listingPriceXMR;
  const listingIdr = Number(negotiation.listing?.fiat_estimate_idr || 0);
  const offerIdr = hasOffer
    ? estimateFiat(offerAmount, methodForPrices)
    : 0;

  const discountPercent =
    hasOffer && listingAmount > 0 && offerAmount < listingAmount
      ? Math.round(((listingAmount - offerAmount) / listingAmount) * 100)
      : 0;

  const parsedInput = Number.parseFloat(inputAmount);
  const submitPreviewIdr =
    !Number.isNaN(parsedInput) && parsedInput > 0
      ? estimateFiat(parsedInput, paymentMethod)
      : 0;

  function estimateFiat(amount: number, method: "BTC" | "XMR") {
    if (Number.isNaN(amount) || amount <= 0) return 0;
    return Math.round(amount * (method === "BTC" ? BTC_TO_IDR : XMR_TO_IDR));
  }

  function openCounterForm() {
    setPaymentMethod(offerMethod ?? "BTC");
    setShowCounterForm(true);
  }

  function closeCounterForm() {
    setShowCounterForm(false);
    setInputAmount("");
  }

  async function handleSubmitCounter() {
    const amount = Number.parseFloat(inputAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    await onCounterOffer(paymentMethod, amount);
    setShowCounterForm(false);
    setInputAmount("");
  }

  return (
    <section className="border-b-2 border-line bg-surface">
      {!showCounterForm ? (
        <div className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink">
                <ArrowDownRight size={12} className="text-lime" />
                Last offer
              </div>

              {hasOffer && offerMethod ? (
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-arcade text-base leading-tight text-lime sm:text-lg">
                    {formatCrypto(offerAmount, offerMethod)}
                  </span>
                  <span className="font-mono text-[13px] font-bold text-cream">
                    {formatIdr(offerIdr)}
                  </span>
                  {discountPercent > 0 && (
                    <span className="badge-green">
                      <TrendingDown size={10} />
                      {discountPercent}% below listing
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-ink">
                  No offer on the table yet. {isBuyer
                    ? "Make an offer or buy at listing price."
                    : "Wait for buyer to offer, or open a counter."}
                </p>
              )}
            </div>

            <div className="border-2 border-line bg-ink px-3 py-2 sm:text-right">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
                Listing price
              </div>
              <div className="mt-1 font-mono text-[13px] font-bold text-cream">
                {formatCrypto(listingAmount, methodForPrices)}
              </div>
              <div className="font-mono text-[11px] text-muted-ink">
                ≈ {formatIdr(listingIdr)}
              </div>
            </div>
          </div>

          <div className="border-2 border-line bg-ink p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink">
                Deal agreement
              </span>
              <span className="font-mono text-xs font-bold text-cream">
                {dealCount}/2
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <AgreementSeat label="Buyer" agreed={dealBuyerAgreed} />
              <AgreementSeat label="Seller" agreed={dealSellerAgreed} />
            </div>
            {dealCount === 1 && (
              <p className="mt-2 font-mono text-[11px] text-amber">
                One party agreed. Negotiation stays open until both accept.
              </p>
            )}
          </div>

          <div
            className={`grid gap-2 ${
              hasOffer ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <button
              type="button"
              onClick={openCounterForm}
              disabled={isPending}
              className={`flex min-h-11 items-center justify-center gap-2 border-2 border-amber/60 bg-amber/10 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-amber transition-colors hover:border-amber hover:bg-amber/20 disabled:cursor-not-allowed disabled:opacity-45 ${
                !hasOffer && !isBuyer ? "sm:col-span-2" : ""
              }`}
            >
              <HandCoins size={15} />
              {isBuyer ? "Make offer" : "Counter"}
            </button>

            {hasOffer && (
              <button
                type="button"
                onClick={onAccept}
                disabled={
                  isPending ||
                  (isBuyer && dealBuyerAgreed) ||
                  (isSeller && dealSellerAgreed)
                }
                className="btn-primary !min-h-11 !py-2"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={15} strokeWidth={3} />
                )}
                {(isBuyer && dealBuyerAgreed) ||
                (isSeller && dealSellerAgreed)
                  ? "Already agreed"
                  : "Accept deal"}
              </button>
            )}

            {hasOffer ? (
              <button
                type="button"
                onClick={onReject}
                disabled={isPending}
                className="flex min-h-11 items-center justify-center gap-2 border-2 border-danger/45 bg-transparent px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-danger transition-colors hover:border-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-45"
                title="Reset penawaran. Nego tetap terbuka."
              >
                <RotateCcw size={14} />
                Reset offer
              </button>
            ) : (
              isBuyer && (
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={isPending}
                  className="btn-primary !min-h-11 !py-2"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  Buy at listing
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-cream">
                {isBuyer ? "New offer" : "Counter offer"}
              </h3>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-ink">
                This number goes to the negotiation table. Opponent can accept,
                reject, or counter.
              </p>
            </div>
            <button
              type="button"
              onClick={closeCounterForm}
              className="grid size-8 shrink-0 place-items-center border-2 border-line bg-panel text-muted-ink transition-colors hover:border-danger hover:text-danger"
              aria-label="Tutup form tawaran"
            >
              <X size={15} />
            </button>
          </div>

          <div className={`grid gap-2 ${hasOffer ? "sm:grid-cols-2" : ""}`}>
            {hasOffer && offerMethod && (
              <div className="border-2 border-line bg-ink p-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
                  Current offer
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-cream">
                  {formatCrypto(offerAmount, offerMethod)}
                </div>
                <div className="font-mono text-[11px] text-muted-ink">
                  ≈ {formatIdr(offerIdr)}
                </div>
              </div>
            )}
            <div className="border-2 border-line bg-ink p-3">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink">
                Listing price
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-cream">
                {formatCrypto(listingAmount, methodForPrices)}
              </div>
              <div className="font-mono text-[11px] text-muted-ink">
                ≈ {formatIdr(listingIdr)}
              </div>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink">
              Payment method · demo
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("BTC")}
                className={`flex min-h-14 items-center gap-3 border-2 px-3 py-2 text-left transition-colors ${
                  paymentMethod === "BTC"
                    ? "border-amber bg-amber/10"
                    : "border-line bg-panel hover:border-muted-ink"
                }`}
              >
                <span
                  className={`grid size-8 place-items-center border-2 ${
                    paymentMethod === "BTC"
                      ? "border-ink bg-amber text-ink"
                      : "border-line bg-ink text-muted-ink"
                  }`}
                >
                  <Bitcoin size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[13px] font-bold text-cream">
                    Bitcoin
                  </span>
                  <span className="block font-mono text-[10px] text-muted-ink">
                    BTC · 8 desimal
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("XMR")}
                className={`flex min-h-14 items-center gap-3 border-2 px-3 py-2 text-left transition-colors ${
                  paymentMethod === "XMR"
                    ? "border-pink bg-pink/10"
                    : "border-line bg-panel hover:border-muted-ink"
                }`}
              >
                <span
                  className={`grid size-8 place-items-center border-2 ${
                    paymentMethod === "XMR"
                      ? "border-ink bg-pink text-ink"
                      : "border-line bg-ink text-muted-ink"
                  }`}
                >
                  <EyeOff size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[13px] font-bold text-cream">
                    Monero
                  </span>
                  <span className="block font-mono text-[10px] text-muted-ink">
                    XMR · 4 desimal
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="counter-amount"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-ink"
            >
              Offer amount ({paymentMethod})
            </label>
            <div className="mt-2 flex items-stretch border-2 border-line bg-ink focus-within:border-lime">
              <input
                id="counter-amount"
                type="number"
                inputMode="decimal"
                step={paymentMethod === "BTC" ? "0.00000001" : "0.0001"}
                min="0"
                value={inputAmount}
                onChange={(event) => setInputAmount(event.target.value)}
                placeholder={
                  paymentMethod === "BTC" ? "0.00000000" : "0.0000"
                }
                className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-base text-cream outline-none placeholder:text-muted-ink/45"
              />
              <span className="flex items-center border-l-2 border-line px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-ink">
                {paymentMethod}
              </span>
            </div>
            <div className="mt-1.5 min-h-5 font-mono text-[12px] text-lime">
              {submitPreviewIdr > 0
                ? `≈ ${formatIdr(submitPreviewIdr)}`
                : "Enter amount to see IDR estimate."}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSubmitCounter}
              disabled={isPending || !inputAmount}
              className="btn-primary flex-1 !min-h-11 !py-2.5"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Send offer
            </button>
            <button
              type="button"
              onClick={closeCounterForm}
              disabled={isPending}
              className="btn-ghost !min-h-11 !py-2.5"
            >
              Batal
            </button>
          </div>

          <div className="flex items-start gap-2 border-t-2 border-line pt-3 text-[11px] leading-relaxed text-muted-ink">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-amber" />
            <span>
              Simulasi demo. Nominal tidak mengunci dana nyata dan hanya
              menjadi catatan kesepakatan.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
