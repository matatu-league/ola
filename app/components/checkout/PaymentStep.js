"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldCheck, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';

// ─── Stripe ───────────────────────────────────────────────────────────────────
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// ─── Dynamic imports (SSR unsafe) ─────────────────────────────────────────────
const PayPalFormDynamic = dynamic(
  () => import('./PayPalForm'),
  { ssr: false, loading: () => <GatewayLoader /> }
);
const FlutterwaveButtonDynamic = dynamic(
  () => import('./FlutterwaveButton'),
  { ssr: false, loading: () => <GatewayLoader /> }
);

function GatewayLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 size={22} className="animate-spin text-[var(--s-muted,#8A8B91)]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER CONFIG
// logos[] — files from /public/payment-logos/
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDER_META = {
  stripe: {
    logos:      [{ src: '/payment-logos/stripe.svg',      alt: 'Stripe',      h: 20 }],
    brandColor: '#635BFF',
  },
  paypal: {
    logos:      [{ src: '/payment-logos/paypal.svg',      alt: 'PayPal',      h: 24 }],
    brandColor: '#003087',
  },
  flutterwave: {
    logos:      [{ src: '/payment-logos/flutterwave.svg', alt: 'Flutterwave', h: 24 }],
    brandColor: '#F5A623',
  },
  razorpay: {
    logos:      [{ src: '/payment-logos/razorpay.svg',    alt: 'Razorpay',    h: 22 }],
    brandColor: '#2D9CDB',
  },
  mobile_money: {
    logos: [
      { src: '/payment-logos/mobilemoney.png', alt: 'MTN',    h: 26 },
      { src: '/payment-logos/airtel.svg',      alt: 'Airtel', h: 26 },
    ],
    brandColor: '#FFCC00',
  },
  cash: {
    logos:      [{ src: '/payment-logos/cod.png', alt: 'Cash', h: 24 }],
    brandColor: '#10B981',
  },
};

// ─── Payment selector card ────────────────────────────────────────────────────
function PaymentCard({ method, isSelected, onClick }) {
  const meta  = PROVIDER_META[method.provider] || {};
  const logos = meta.logos || [];

  // Very light brand-tinted bg + slightly visible brand border when selected.
  // Same 1px border width as idle — no ring, no bold outline change.
  const brandColor  = meta.brandColor || '#635BFF';
  const h           = parseInt(brandColor.slice(1, 3), 16);
  const s           = parseInt(brandColor.slice(3, 5), 16);
  const l           = parseInt(brandColor.slice(5, 7), 16);
  const selectedBg  = `rgba(${h},${s},${l},0.06)`;
  const selectedBdr = `rgba(${h},${s},${l},0.50)`;

  return (
    <div
      onClick={onClick}
      className="relative border rounded-sm p-3 cursor-pointer transition-all duration-150 flex flex-col items-start justify-between gap-2.5 min-h-[96px]"
      style={isSelected
        ? { borderColor: selectedBdr, background: selectedBg }
        : { borderColor: '#E3E3E4', background: '#ffffff' }
      }
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#161823'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E3E3E4'; }}
    >
      {/* Checkmark badge — filled brand circle with white tick, top-right */}
      <span
        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150"
        style={isSelected
          ? { background: brandColor }
          : { background: 'transparent', border: '1px solid #E3E3E4' }
        }
      >
        {isSelected && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M0.75 3L2.75 5L7.25 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>

      {/* Logo(s) row — left aligned */}
      <div className="flex items-center gap-2">
        {logos.length > 0
          ? logos.map((logo, i) => (
              <img
                key={i}
                src={logo.src}
                alt={logo.alt}
                style={{ height: logo.h, width: 'auto' }}
                className="object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ))
          : method.image
            ? <img src={method.image} alt={method.title} className="h-6 w-auto object-contain" />
            : null
        }
      </div>

      {/* Text block — left aligned */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-bold text-[var(--s-text,#161823)] leading-tight">{method.title}</span>
        <span className="text-[10px] text-[var(--s-muted,#8A8B91)] leading-snug line-clamp-2">{method.description}</span>
      </div>
    </div>
  );
}

// ─── Stripe form ──────────────────────────────────────────────────────────────
function StripeForm({ amount, onCreatePendingOrder, onSuccess, onError, isSubmitting, setIsSubmitting }) {
  const stripe   = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    const orderId = await onCreatePendingOrder();
    if (!orderId) { setIsSubmitting(false); return; }
    try {
      // ── Step 1: create PaymentIntent on our backend ─────────────────────
      const res  = await fetch('/api/payments/stripe/create-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount }),
      });

      const data = await res.json();

      // Surface the actual backend error instead of letting Stripe complain
      // about a missing/undefined clientSecret
      if (!res.ok || !data.success || !data.clientSecret) {
        throw new Error(data.message || `Server error ${res.status} — clientSecret missing`);
      }

      const { clientSecret } = data;

      // ── Step 2: confirm card payment on Stripe ──────────────────────────
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) {
        onError(error.message);
        setIsSubmitting(false);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess({ reference: paymentIntent.id, provider: 'stripe' });
      } else {
        // e.g. 'requires_action' — Stripe handles 3DS automatically
        // but if it falls through, surface a clear message
        onError(`Payment status: ${paymentIntent.status}. Please try again.`);
        setIsSubmitting(false);
      }
    } catch (e) {
      onError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm">
        <CardElement
          options={{
            style: {
              base:    { fontSize: '14px', color: '#161823', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#8A8B91' } },
              invalid: { color: '#FE2C55' },
            },
          }}
        />
      </div>
      {/* Show USD equivalent — Stripe charges in USD */}
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--s-muted,#8A8B91)] bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm px-3 py-2">
        <span>Stripe charges in USD:</span>
        <span className="font-bold text-[var(--s-text,#161823)]">
          ≈ ${((amount / 3900)).toFixed(2)} USD
        </span>
        <span className="text-[10px]">(1 USD ≈ UGX 3,900)</span>
      </div>
      <button
        onClick={handlePay}
        disabled={isSubmitting || !stripe}
        className="w-full bg-[#635BFF] hover:bg-[#5145e5] text-white py-2.5 rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors tracking-tight"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? 'Processing...' : `Pay $${(amount / 3900).toFixed(2)} USD via Stripe`}
      </button>
    </div>
  );
}

// ─── Razorpay form ────────────────────────────────────────────────────────────
function RazorpayForm({ amount, user, onCreatePendingOrder, onSuccess, onError, isSubmitting, setIsSubmitting }) {
  const handlePay = async () => {
    setIsSubmitting(true);
    const orderId = await onCreatePendingOrder();
    if (!orderId) { setIsSubmitting(false); return; }
    try {
      const res = await fetch('/api/payments/razorpay/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount }),
      });
      const { orderId, amount: orderAmount, currency } = await res.json();

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s   = document.createElement('script');
          s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload  = resolve;
          s.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(s);
        });
      }

      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderAmount,
        currency,
        order_id:    orderId,
        name:        'AlxLite',
        description: 'Order Payment',
        prefill:     { name: user?.name, email: user?.email, contact: user?.phoneNumber },
        theme:       { color: '#161823' },
        handler:     response => {
          onSuccess({ reference: response.razorpay_payment_id, provider: 'razorpay' });
        },
      });
      rzp.on('payment.failed', resp => {
        onError(resp.error.description);
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (e) {
      onError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallet'].map(l => (
          <span key={l} className="text-[10px] font-semibold border border-[var(--s-border,#E3E3E4)] rounded-sm px-2 py-0.5 text-[var(--s-muted,#8A8B91)] bg-[var(--s-surface,#F8F8F8)]">{l}</span>
        ))}
      </div>
      <button
        onClick={handlePay}
        disabled={isSubmitting}
        className="w-full bg-[#2D9CDB] hover:bg-[#1f86c0] text-white py-2.5 rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors tracking-tight"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? 'Opening Razorpay...' : 'Pay with Razorpay'}
      </button>
    </div>
  );
}

// ─── Mobile Money form — segmented network selector ───────────────────────────
const NETWORKS = [
  {
    code:        'mtn',
    label:       'MTN Mobile Money',
    shortLabel:  'MTN',
    logo:        '/payment-logos/mtn.png',
    placeholder: '077XXXXXXX',
    // active segment colors
    activeBg:    '#FFCC00',
    activeText:  '#1a1a1a',
    activeBorder:'#D4A800',
  },
  {
    code:        'airtel',
    label:       'Airtel Money',
    shortLabel:  'Airtel',
    logo:        '/payment-logos/airtel.svg',
    placeholder: '075XXXXXXX',
    activeBg:    '#FF0000',
    activeText:  '#ffffff',
    activeBorder:'#cc0000',
  },
];

function MobileMoneyForm({ phone, setPhone, onSuccess, onError, isSubmitting, setIsSubmitting }) {
  const [network, setNetwork] = useState('mtn');
  const activeNet = NETWORKS.find(n => n.code === network);

  const handlePay = async () => {
    if (!phone) { onError('Please enter your mobile money number.'); return; }
    setIsSubmitting(true);
    const orderId = await onCreatePendingOrder();
    if (!orderId) { setIsSubmitting(false); return; }
    try {
      const res  = await fetch('/api/payments/mobile-money/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, network }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess({ reference: data.reference, provider: 'mobile_money' });
      } else {
        onError(data.message || 'Mobile money initiation failed.');
        setIsSubmitting(false);
      }
    } catch (e) {
      onError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Segmented network selector ─────────────────────────────────── */}
      <div className="flex border border-[var(--s-border,#E3E3E4)] rounded-sm overflow-hidden bg-[var(--s-surface,#F8F8F8)]">
        {NETWORKS.map((n, idx) => {
          const isActive = network === n.code;
          return (
            <button
              key={n.code}
              type="button"
              onClick={() => setNetwork(n.code)}
              className={`relative flex-1 flex items-center justify-center gap-2.5 py-3 px-3 text-[12px] font-bold transition-all duration-150
                ${idx !== 0 ? 'border-l border-[var(--s-border,#E3E3E4)]' : ''}
                ${isActive ? 'shadow-sm' : 'hover:bg-white'}`}
              style={isActive
                ? { background: n.activeBg, color: n.activeText, borderColor: n.activeBorder }
                : { background: 'transparent', color: '#8A8B91' }
              }
            >
              {/* Network logo */}
              <img
                src={n.logo}
                alt={n.shortLabel}
                className="object-contain shrink-0"
                style={{ height: 22, width: 'auto' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />

              {/* Label */}
              <span className="leading-tight">{n.shortLabel}</span>

              {/* Active check indicator */}
              {isActive && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ background: n.activeText === '#ffffff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)' }}>
                  <svg width="7" height="5.5" viewBox="0 0 7 5.5" fill="none">
                    <path d="M0.5 3L2.5 5L6.5 0.5" stroke={n.activeText} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected network info strip */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-sm border text-[11px] font-medium"
        style={{
          background:   `${activeNet?.activeBg}18`,
          borderColor:  `${activeNet?.activeBg}60`,
          color:        '#161823',
        }}
      >
        <img
          src={activeNet?.logo}
          alt={activeNet?.shortLabel}
          className="object-contain"
          style={{ height: 16, width: 'auto' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <span>
          Paying via <strong>{activeNet?.label}</strong> · Uganda
        </span>
      </div>

      {/* Phone input */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[var(--s-text,#161823)]">
          {activeNet?.shortLabel} Number <span className="text-[var(--s-primary,#FE2C55)]">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder={activeNet?.placeholder}
          className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[var(--s-text,#161823)] transition-colors text-[var(--s-text,#161823)] placeholder:text-[var(--s-muted,#8A8B91)]"
        />
        <p className="text-[11px] text-[var(--s-muted,#8A8B91)]">
          You will receive a USSD prompt on your phone to confirm payment.
        </p>
      </div>

      <button
        onClick={handlePay}
        disabled={isSubmitting}
        className="w-full bg-[var(--s-primary,#161823)] hover:bg-black text-white py-2.5 rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors tracking-tight"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? 'Sending Prompt...' : `Send ${activeNet?.shortLabel} Prompt`}
      </button>
    </div>
  );
}

// ─── Main PaymentStep ──────────────────────────────────────────────────────────
export default function PaymentStep({
  activeStep,
  paymentOptions,
  paymentMethod,
  setPaymentMethod,
  isFetchingConfig,
  amount,
  user,
  pendingOrderId,
  createPendingOrder,   // creates order with paymentStatus:'pending' before gateway opens
  onPlaceOrder,
  isSubmitting,
  setIsSubmitting,
  generalError,
  setGeneralError,
}) {
  const isActive = activeStep === 4;
  const isLocked = activeStep < 4;

  const [momoPhone, setMomoPhone] = useState(user?.phoneNumber || '');
  const [payError,  setPayError]  = useState('');

  useEffect(() => {
    if (user?.phoneNumber) setMomoPhone(user.phoneNumber);
  }, [user?.phoneNumber]);

  const selectedOption = paymentOptions.find(m => m.code === paymentMethod);
  const provider       = selectedOption?.provider;

  const handleSuccess = ({ reference, provider: prov }) => {
    onPlaceOrder({ paymentReference: reference, paymentProvider: prov });
  };

  // Called by gateway components (Flutterwave, Stripe, PayPal, Razorpay) BEFORE
  // opening their UI — ensures a real orderId exists for the gateway session.
  const handleCreatePendingOrder = async () => {
    const orderId = await createPendingOrder();
    return orderId; // null means validation failed — gateway should not open
  };

  const handleError = (msg) => {
    setPayError(msg);
    setIsSubmitting(false);
  };

  return (
    <div className={`bg-white border rounded-sm overflow-hidden transition-all duration-300
      ${isActive ? 'border-[var(--s-text,#161823)] ring-1 ring-[var(--s-primary,#161823)]' : 'border-[var(--s-border,#E3E3E4)]'}
      ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* Header */}
      <div className={`p-4 md:p-5 flex items-center justify-between ${isActive ? 'border-b border-[var(--s-border,#E3E3E4)]' : ''}`}>
        <h3 className="font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase text-[var(--s-text,#161823)]">
          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold
            ${isActive ? 'bg-[var(--s-primary,#161823)] text-white' : 'bg-[var(--s-border,#E3E3E4)] text-[var(--s-muted,#8A8B91)]'}`}>
            4
          </span>
          Payment Method
        </h3>
      </div>

      {isActive && (
        <div className="p-5 md:p-6">
          {isFetchingConfig ? (
            <GatewayLoader />
          ) : paymentOptions.length === 0 ? (
            <p className="text-[13px] text-[var(--s-muted,#8A8B91)]">No payment methods available.</p>
          ) : (
            <>
              {/* ── Method selector grid ───────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                {paymentOptions.map(method => (
                  <PaymentCard
                    key={method.code}
                    method={method}
                    isSelected={paymentMethod === method.code}
                    onClick={() => { setPaymentMethod(method.code); setPayError(''); setGeneralError(''); }}
                  />
                ))}
              </div>

              {/* ── Divider ────────────────────────────────────────────────── */}
              {provider && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[var(--s-border,#E3E3E4)]" />
                  <span className="text-[10px] font-bold text-[var(--s-muted,#8A8B91)] uppercase tracking-wider">
                    {selectedOption?.title}
                  </span>
                  <div className="flex-1 h-px bg-[var(--s-border,#E3E3E4)]" />
                </div>
              )}

              {/* ── Gateway UI panel ───────────────────────────────────────── */}
              <div className="mb-5">

                {provider === 'stripe' && (
                  <Elements stripe={stripePromise}>
                    <StripeForm
                      amount={amount}
                      onCreatePendingOrder={handleCreatePendingOrder}
                      onSuccess={handleSuccess}
                      onError={handleError}
                      isSubmitting={isSubmitting}
                      setIsSubmitting={setIsSubmitting}
                    />
                  </Elements>
                )}

                {provider === 'paypal' && (
                  <PayPalFormDynamic
                    amount={amount}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                )}

                {provider === 'flutterwave' && (
                  <FlutterwaveButtonDynamic
                    amount={amount}
                    currency="UGX"
                    user={user}
                    orderId={pendingOrderId}
                    onCreatePendingOrder={handleCreatePendingOrder}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                  />
                )}

                {provider === 'razorpay' && (
                  <RazorpayForm
                    amount={amount}
                    user={user}
                    onCreatePendingOrder={handleCreatePendingOrder}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                  />
                )}

                {provider === 'mobile_money' && (
                  <MobileMoneyForm
                    phone={momoPhone}
                    setPhone={setMomoPhone}
                    onCreatePendingOrder={handleCreatePendingOrder}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                  />
                )}

                {provider === 'cash' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 bg-[#F0FDF4] p-3 rounded-sm border border-[#10B981]">
                      <CheckCircle2 size={15} className="text-[#10B981] shrink-0 mt-0.5" />
                      <p className="text-[12px] text-[var(--s-text,#161823)] leading-relaxed">
                        You will pay <strong>UGX {Number(amount).toLocaleString()}</strong> in cash directly to our delivery agent upon successful delivery.
                      </p>
                    </div>
                    <button
                      onClick={() => onPlaceOrder({ paymentReference: null, paymentProvider: 'cash' })}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--s-primary,#FE2C55)] hover:bg-[#e0264b] text-white px-6 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 tracking-tight"
                    >
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      Confirm & Place Order
                    </button>
                  </div>
                )}
              </div>

              {/* Errors */}
              {(payError || generalError) && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--s-primary,#FE2C55)] font-semibold bg-[#FFF0F3] border border-[var(--s-primary,#FE2C55)] p-3 rounded-sm mb-4">
                  <AlertCircle size={14} className="shrink-0" /> {payError || generalError}
                </div>
              )}

              {/* Security note */}
              <div className="flex items-start gap-2 bg-[var(--s-surface,#F8F8F8)] p-3 rounded-sm border border-[var(--s-border,#E3E3E4)]">
                <ShieldCheck size={15} className="text-[var(--s-text,#161823)] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--s-muted,#8A8B91)] font-medium leading-relaxed">
                  All transactions are encrypted and secured. We never store your full card details or PIN.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}