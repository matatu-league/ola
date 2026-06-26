// app/checkout/flutterwave-callback/page.jsx
//
// Flutterwave redirects here after payment with these query params:
//   ?status=successful&tx_ref=FLW-xxx&transaction_id=12345
//
// This page:
//   1. Reads the query params
//   2. Calls our verify-payment backend
//   3. Posts a message to the opener (parent checkout tab)
//   4. Closes itself

"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function FlutterwaveCallbackPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState('verifying'); // 'verifying' | 'success' | 'failed'
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const status        = searchParams.get('status');
    const txRef         = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    const verify = async () => {
      // ── Retrieve pending order info saved before opening this tab ──────────
      let pending = {};
      try {
        const raw = sessionStorage.getItem('flw_pending');
        if (raw) pending = JSON.parse(raw);
      } catch (_) {}

      // ── Failed / cancelled before reaching our server ──────────────────────
      if (status !== 'successful' && status !== 'completed') {
        const msg = status === 'cancelled' ? 'Payment was cancelled.' : `Payment failed: ${status}`;
        setState('failed');
        setMessage(msg);
        postToOpener({ type: 'FLW_PAYMENT_COMPLETE', status, txRef, transactionId: null });
        return;
      }

      // ── Verify server-side ─────────────────────────────────────────────────
      try {
        const res = await fetch('/api/payments/flutterwave/verify-payment', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            transactionId:    transactionId,
            orderId:          pending.orderId  || '',
            expectedAmount:   pending.amount   || 0,
            expectedCurrency: pending.currency || 'UGX',
          }),
        });

        const data = await res.json();

        if (data.success) {
          sessionStorage.removeItem('flw_pending');
          setState('success');
          setMessage('Payment confirmed! Closing this window...');

          postToOpener({
            type:          'FLW_PAYMENT_COMPLETE',
            status:        'successful',
            txRef,
            transactionId,
          });

          // Auto-close after brief delay so user sees the confirmation
          setTimeout(() => {
            try { window.close(); } catch (_) {}
          }, 1800);

        } else {
          setState('failed');
          setMessage(data.message || 'Payment verification failed.');
          postToOpener({
            type:   'FLW_PAYMENT_COMPLETE',
            status: 'failed',
            txRef,
            transactionId: null,
          });
        }
      } catch (err) {
        setState('failed');
        setMessage('Verification error. Please contact support.');
        postToOpener({ type: 'FLW_PAYMENT_COMPLETE', status: 'failed', txRef, transactionId: null });
      }
    };

    verify();
  }, []);

  function postToOpener(data) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(data, window.location.origin);
      }
    } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
      <div className="bg-white border border-[#E3E3E4] rounded-sm p-8 max-w-sm w-full text-center">

        {state === 'verifying' && (
          <>
            <Loader2 size={36} className="animate-spin text-[#F5A623] mx-auto mb-4" />
            <h2 className="text-[15px] font-bold text-[#161823] mb-1">Verifying Payment</h2>
            <p className="text-[12px] text-[#8A8B91]">{message}</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 size={36} className="text-[#10B981] mx-auto mb-4" />
            <h2 className="text-[15px] font-bold text-[#161823] mb-1">Payment Confirmed</h2>
            <p className="text-[12px] text-[#8A8B91]">{message}</p>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={36} className="text-[#FE2C55] mx-auto mb-4" />
            <h2 className="text-[15px] font-bold text-[#161823] mb-1">Payment Failed</h2>
            <p className="text-[12px] text-[#8A8B91] mb-4">{message}</p>
            <button
              onClick={() => window.close()}
              className="bg-[#161823] text-white px-5 py-2 rounded-sm text-[12px] font-semibold hover:bg-black transition-colors"
            >
              Close this window
            </button>
          </>
        )}

      </div>
    </div>
  );
}