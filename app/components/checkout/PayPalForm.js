// components/checkout/PayPalForm.jsx
//
// Loaded dynamically (ssr: false) from PaymentStep:
//   const PayPalForm = dynamic(() => import('./PayPalForm'), { ssr: false })
//
// Flow:
//   1. User clicks PayPal button → createOrder() hits our backend
//   2. PayPal shows its approval popup
//   3. User approves → onApprove() hits our capture backend route
//   4. Capture succeeds → onSuccess() → CheckoutClient places the order

"use client";

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2, AlertCircle } from 'lucide-react';

// ─── Inner component — needs to be inside PayPalScriptProvider ───────────────
function PayPalButtonsInner({ amount, onSuccess, onError }) {
  const [{ isPending }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={22} className="animate-spin text-[var(--s-muted,#8A8B91)]" />
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color:  'blue',
        shape:  'rect',
        label:  'pay',
        height: 44,
      }}
      // ── Step 1: create PayPal order via our backend ─────────────────────
      createOrder={async () => {
        const res  = await fetch('/api/payments/paypal/create-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            amount,       // USD amount — PayPal does NOT support UGX
            currency: 'USD',
            description: 'AlxLite Order',
          }),
        });
        const data = await res.json();

        if (!data.success || !data.id) {
          throw new Error(data.message || 'Could not create PayPal order');
        }

        return data.id; // PayPal orderID
      }}

      // ── Step 2: capture payment via our backend after user approves ──────
      onApprove={async (data) => {
        const res = await fetch('/api/payments/paypal/capture-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ paypalOrderId: data.orderID }),
        });
        const captureData = await res.json();

        if (!captureData.success) {
          throw new Error(captureData.message || 'Payment capture failed');
        }

        onSuccess({
          reference: captureData.captureId,
          provider:  'paypal',
        });
      }}

      onError={(err) => {
        console.error('[PayPal]', err);
        onError(err?.message || 'PayPal encountered an error. Please try again.');
      }}

      onCancel={() => {
        onError('Payment was cancelled.');
      }}
    />
  );
}

// ─── Exported wrapper — provides the PayPal JS SDK context ──────────────────
export default function PayPalForm({ amount, onSuccess, onError }) {
  const [localError, setLocalError] = useState('');

  const handleError = (msg) => {
    setLocalError(msg);
    onError(msg);
  };

  return (
    <div className="space-y-3">
      {/* Currency note — important for Ugandan merchants */}
      <div className="bg-[#FFF8E7] border border-[#F5A623] rounded-[var(--s-radius,0.125rem)] p-3">
        <p className="text-[11px] text-[#856404] font-medium leading-relaxed">
          <strong>Note:</strong> PayPal processes in <strong>USD</strong>. The amount shown
          in the PayPal window is the USD equivalent of your order total.
          Exchange rate: ~1 USD = 3,900 UGX.
        </p>
      </div>

      <PayPalScriptProvider
        options={{
          'client-id':  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
          currency:     'USD',
          intent:       'capture',
          components:   'buttons',
        }}
      >
        <PayPalButtonsInner
          amount={(amount / 3900).toFixed(2)} // UGX → USD conversion
          onSuccess={onSuccess}
          onError={handleError}
        />
      </PayPalScriptProvider>

      {localError && (
        <div className="flex items-center gap-2 text-[12px] text-[var(--s-primary,#FE2C55)] font-semibold bg-[#FFF0F3] border border-[var(--s-primary,#FE2C55)] p-3 rounded-[var(--s-radius,0.125rem)]">
          <AlertCircle size={13} /> {localError}
        </div>
      )}

      <p className="text-[10px] text-[var(--s-muted,#8A8B91)] text-center">
        Powered by PayPal · Pay with your PayPal account or any major card
      </p>
    </div>
  );
}