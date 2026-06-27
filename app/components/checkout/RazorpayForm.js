// components/checkout/RazorpayForm.jsx
// Drop-in replacement for the inline RazorpayForm in PaymentStep.jsx
// Extracted here for clarity — import and use inside PaymentStep as needed.
//
// Flow:
//   1. POST /api/payments/razorpay/create-order  → get orderId
//   2. Open Razorpay modal
//   3. On success → POST /api/payments/razorpay/verify-payment (server-side sig check)
//   4. On verified → call onSuccess() → CheckoutClient places the order

"use client";

import { Loader2 } from 'lucide-react';

export default function RazorpayForm({
  amount,
  user,
  internalOrderId,   // your DB order _id, passed in notes for webhook matching
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}) {
  const handlePay = async () => {
    setIsSubmitting(true);
    try {
      // ── Step 1: create Razorpay order ──────────────────────────────────
      const orderRes  = await fetch('/api/payments/razorpay/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount,           // UGX/INR integer, no decimals
          currency: 'INR',  // change to 'USD' or 'UGX' as needed
          receipt:  `rcpt_${Date.now()}`,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Could not create Razorpay order');
      }

      // ── Step 2: load Razorpay script on demand ─────────────────────────
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script   = document.createElement('script');
          script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload  = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }

      // ── Step 3: open Razorpay modal ────────────────────────────────────
      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderData.amount,
        currency:    orderData.currency,
        order_id:    orderData.orderId,
        name:        'AlxLite',
        description: 'Order Payment',
        image:       '/logo.png',    // optional — your logo
        prefill: {
          name:    user?.name        || '',
          email:   user?.email       || '',
          contact: user?.phoneNumber || '',
        },
        notes: {
          orderId: internalOrderId || '', // echoed back in webhooks
        },
        theme: { color: '#161823' },

        // ── Step 4: verify + call onSuccess ───────────────────────────────
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify-payment', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                orderId:             internalOrderId,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              onSuccess({
                reference: response.razorpay_payment_id,
                provider:  'razorpay',
              });
            } else {
              onError(verifyData.message || 'Payment verification failed');
              setIsSubmitting(false);
            }
          } catch (e) {
            onError(e.message);
            setIsSubmitting(false);
          }
        },
      });

      rzp.on('payment.failed', (resp) => {
        onError(resp.error?.description || 'Payment failed');
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
      {/* What Razorpay supports — useful info for customers */}
      <div className="flex flex-wrap gap-2 mb-1">
        {['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallet'].map(label => (
          <span
            key={label}
            className="text-[10px] font-semibold text-[var(--s-muted,#8A8B91)] bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] px-2 py-0.5 rounded-sm"
          >
            {label}
          </span>
        ))}
      </div>

      <button
        onClick={handlePay}
        disabled={isSubmitting}
        className="w-full bg-[#2D9CDB] hover:bg-[#1f86c0] text-white py-2.5 rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {isSubmitting && <Loader2 size={15} className="animate-spin" />}
        Pay with Razorpay
      </button>

      <p className="text-[10px] text-[var(--s-muted,#8A8B91)] text-center">
        Powered by Razorpay · Best for UPI & Indian payment methods
      </p>
    </div>
  );
}