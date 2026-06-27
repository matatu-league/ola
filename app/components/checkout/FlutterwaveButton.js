// components/checkout/FlutterwaveButton.jsx
//
// Flutterwave v4 with UUID key (e.g. 644c0ee0-5c78-4f38-8676-908fe2403436)
//
// WHY we don't use flutterwave-react-v3 hook here:
//   The package loads checkout.flutterwave.com/v3.js which rejects UUID keys
//   with "Invalid parameter (PBFPubKey)". That hosted script only accepts the
//   old FLWPUBK_TEST- prefixed keys.
//
// CORRECT v4 flow:
//   1. POST /api/payments/flutterwave/initiate-payment  (server calls FLW API)
//   2. Server returns a hosted payment link
//   3. We open it in a new tab OR redirect
//   4. Flutterwave redirects back to our redirect_url with ?status=&tx_ref=&transaction_id=
//   5. We verify server-side on the redirect page

"use client";

import { useState } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';

export default function FlutterwaveButton({
  amount,
  currency = 'UGX',
  user,
  orderId,
  onCreatePendingOrder,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}) {
  const [localError, setLocalError] = useState('');
  const [awaitingReturn, setAwaitingReturn] = useState(false);

  const handlePay = async () => {
    setLocalError('');
    setIsSubmitting(true);

    try {
      // ── Step 1: create hosted payment link via our backend ────────────────
      const res = await fetch('/api/payments/flutterwave/initiate-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount,
          currency,
          email:      user?.email       || '',
          name:       user?.name        || 'Customer',
          phone:      user?.phoneNumber || '',
          orderId:    orderId           || '',
          // After payment FLW redirects here with ?status=&tx_ref=&transaction_id=
          redirectUrl: `${window.location.origin}/checkout/flutterwave-callback`,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.paymentLink) {
        throw new Error(data.message || 'Could not create payment link');
      }

      // ── Step 2: store txRef + orderId in sessionStorage so callback page
      //           can verify and complete the order ─────────────────────────
      sessionStorage.setItem('flw_pending', JSON.stringify({
        txRef:    data.txRef,
        orderId:  orderId || '',
        amount,
        currency,
      }));

      // ── Step 3: open payment in new tab ──────────────────────────────────
      // Using a new tab keeps our checkout state intact.
      // The callback page closes the tab and calls window.opener.postMessage.
      const payWindow = window.open(data.paymentLink, '_blank', 'noopener');

      if (!payWindow) {
        // Popup blocked — fall back to same-tab redirect
        window.location.href = data.paymentLink;
        return;
      }

      setAwaitingReturn(true);

      // ── Step 4: listen for postMessage from callback page ─────────────────
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'FLW_PAYMENT_COMPLETE') return;

        window.removeEventListener('message', handleMessage);
        setAwaitingReturn(false);

        const { status, transactionId, txRef: returnedTxRef } = event.data;

        if (status === 'successful' || status === 'completed') {
          onSuccess({
            reference: String(transactionId || returnedTxRef),
            provider:  'flutterwave',
          });
        } else {
          const msg = status === 'cancelled'
            ? 'Payment was cancelled.'
            : `Payment failed with status: ${status}`;
          setLocalError(msg);
          onError(msg);
          setIsSubmitting(false);
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (err) {
      setLocalError(err.message || 'Failed to initiate payment.');
      onError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Supported methods */}
      <div className="bg-[#F0FDF4] border border-[#10B981] rounded-sm p-3">
        <p className="text-[11px] text-[#065F46] font-medium leading-relaxed">
          Supports <strong>MTN Mobile Money</strong>, <strong>Airtel Money</strong>,
          Visa / Mastercard, and USSD — all in <strong>UGX</strong>.
        </p>
      </div>

      {/* Awaiting return state */}
      {awaitingReturn && (
        <div className="flex items-center gap-2 bg-[#FFF8EC] border border-[#F5A623] rounded-sm p-3">
          <Loader2 size={14} className="animate-spin text-[#F5A623] shrink-0" />
          <p className="text-[12px] text-[#92560A] font-medium">
            Waiting for payment confirmation in the Flutterwave window...
          </p>
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={isSubmitting || awaitingReturn}
        className="w-full bg-[#F5A623] hover:bg-[#e09420] text-white py-2.5 rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-60 transition-colors tracking-tight"
      >
        {isSubmitting && !awaitingReturn
          ? <Loader2 size={15} className="animate-spin" />
          : <ExternalLink size={14} />
        }
        {isSubmitting && !awaitingReturn
          ? 'Opening payment...'
          : awaitingReturn
            ? 'Complete payment in the new tab'
            : `Pay UGX ${Number(amount).toLocaleString()} via Flutterwave`
        }
      </button>

      {localError && (
        <div className="flex items-start gap-2 text-[12px] text-[var(--s-primary,#FE2C55)] font-semibold bg-[#FFF0F3] border border-[var(--s-primary,#FE2C55)] p-3 rounded-sm">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          {localError}
        </div>
      )}

      <p className="text-[10px] text-[var(--s-muted,#8A8B91)] text-center">
        Powered by Flutterwave · Payments are secured and encrypted
      </p>
    </div>
  );
}
