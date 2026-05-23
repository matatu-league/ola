// components/checkout/FlutterwaveButton.jsx
// Flutterwave v4 — public key is a UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
// NOT the old FLWPUBK_TEST- format (that was v2/v3)

"use client";

import { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Loader2, AlertCircle } from 'lucide-react';

// ─── Inner component — holds useFlutterwave hook ──────────────────────────────
function FlutterwaveInner({
  amount,
  currency,
  user,
  orderId,
  txRef,
  publicKey,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}) {
  const [localError, setLocalError] = useState('');

  const config = {
    public_key:      publicKey,                    // UUID format for v4
    tx_ref:          txRef,
    amount:          Number(amount),
    currency,
    payment_options: 'mobilemoneyuganda,card,ussd',
    customer: {
      email:       user?.email       || '',
      phonenumber: user?.phoneNumber || '',
      name:        user?.name        || 'Customer',
    },
    customizations: {
      title:       'AlxLite',
      description: 'Order Payment',
      logo:        `${process.env.NEXT_PUBLIC_APP_URL || ''}/logo.png`,
    },
    meta: {
      orderId: orderId || '',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handlePay = () => {
    setLocalError('');
    setIsSubmitting(true);

    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();

        if (response.status !== 'successful') {
          const msg = response.status === 'cancelled'
            ? 'Payment was cancelled.'
            : `Payment failed with status: ${response.status}`;
          setLocalError(msg);
          onError(msg);
          setIsSubmitting(false);
          return;
        }

        // ── Server-side verification ────────────────────────────────────
        try {
          const verifyRes = await fetch('/api/payments/flutterwave/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              transactionId:    response.transaction_id,
              orderId:          orderId || '',
              expectedAmount:   amount,
              expectedCurrency: currency,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyData.success) {
            const msg = verifyData.message || 'Payment verification failed.';
            setLocalError(msg);
            onError(msg);
            setIsSubmitting(false);
            return;
          }

          onSuccess({
            reference: String(response.transaction_id),
            provider:  'flutterwave',
          });
        } catch (err) {
          const msg = err.message || 'Verification error. Please contact support.';
          setLocalError(msg);
          onError(msg);
          setIsSubmitting(false);
        }
      },
      onClose: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#F0FDF4] border border-[#10B981] rounded-sm p-3">
        <p className="text-[11px] text-[#065F46] font-medium leading-relaxed">
          Supports <strong>MTN Mobile Money</strong>, <strong>Airtel Money</strong>,
          Visa / Mastercard, and USSD — all in <strong>UGX</strong>.
        </p>
      </div>

      <button
        onClick={handlePay}
        disabled={isSubmitting}
        className="w-full bg-[#F5A623] hover:bg-[#e09420] text-white py-2.5 rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors tracking-tight"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        {isSubmitting ? 'Processing...' : `Pay UGX ${Number(amount).toLocaleString()} via Flutterwave`}
      </button>

      {localError && (
        <div className="flex items-start gap-2 text-[12px] text-[#FE2C55] font-semibold bg-[#FFF0F3] border border-[#FE2C55] p-3 rounded-sm">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          {localError}
        </div>
      )}

      <p className="text-[10px] text-[#8A8B91] text-center">
        Powered by Flutterwave · Payments are secured and encrypted
      </p>
    </div>
  );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────
export default function FlutterwaveButton({
  amount,
  currency = 'UGX',
  user,
  orderId,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}) {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

  // Flutterwave v4 key is a UUID: 8 chars - 4 - 4 - 4 - 12
  // e.g. 644c0ee0-5c78-4f38-8676-908fe2403436
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidKey = publicKey && UUID_REGEX.test(publicKey.trim());

  if (!isValidKey) {
    return (
      <div className="flex items-start gap-2 text-[12px] text-[#FE2C55] font-semibold bg-[#FFF0F3] border border-[#FE2C55] p-3 rounded-sm">
        <AlertCircle size={13} className="shrink-0 mt-0.5" />
        <span>
          Flutterwave public key missing or invalid.{' '}
          <span className="font-normal text-[#8A8B91]">
            Set <code className="font-mono bg-[#F8F8F8] px-1 rounded">NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY</code> in{' '}
            <code className="font-mono bg-[#F8F8F8] px-1 rounded">.env.local</code>.
            The v4 key is a UUID like{' '}
            <code className="font-mono bg-[#F8F8F8] px-1 rounded">644c0ee0-5c78-4f38-...</code>
          </span>
        </span>
      </div>
    );
  }

  // Generate txRef once per mount — stable across re-renders
  const txRef = `FLW-${orderId || 'order'}-${Date.now()}`;

  return (
    <FlutterwaveInner
      amount={amount}
      currency={currency}
      user={user}
      orderId={orderId}
      txRef={txRef}
      publicKey={publicKey.trim()}
      onSuccess={onSuccess}
      onError={onError}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
    />
  );
}