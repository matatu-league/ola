// app/api/payments/flutterwave/webhook/route.js
// Flutterwave v4 webhook verification:
//   - They send a "verif-hash" header
//   - You compare it to FLUTTERWAVE_WEBHOOK_HASH (plain string, NOT HMAC)
//   - The hash is a secret string YOU define in the dashboard

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request) {
  try {
    const rawBody   = await request.text();
    const verifHash = request.headers.get('verif-hash');

    // ── Verify webhook hash ─────────────────────────────────────────────────
    // Flutterwave v4 sends the hash as a plain string header — just compare.
    // FLUTTERWAVE_WEBHOOK_HASH is whatever string you set in:
    //   Dashboard → Settings → Webhooks → Secret Hash
    // e.g. 8f2a64a3c3e7d2bb19e9430c6f7a4f21d08a92d3f3b7cbe60c1c4f4b19ef2a91
    if (process.env.FLUTTERWAVE_WEBHOOK_HASH) {
      if (verifHash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
        console.warn('[FLW webhook] Invalid verif-hash — rejecting');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    } else {
      console.warn('[FLW webhook] FLUTTERWAVE_WEBHOOK_HASH not set — skipping verification');
    }

    const event = JSON.parse(rawBody);
    const { event: eventName, data } = event;

    await connectToDatabase();

    switch (eventName) {

      case 'charge.completed': {
        const { status, id: transactionId, meta } = data;
        const orderId = meta?.orderId;

        if (status === 'successful' && orderId) {
          // Re-verify via API before marking paid (don't trust webhook payload alone)
          const verifyRes = await fetch(
            `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type':  'application/json',
              },
            }
          );
          const verifyData = await verifyRes.json();
          const tx = verifyData.data;

          if (tx?.status === 'successful') {
            await Order.findByIdAndUpdate(orderId, {
              $set: {
                paymentStatus:    'paid',
                paymentReference: String(transactionId),
                paymentProvider:  'flutterwave',
                paidAt:           new Date(),
              },
            });
            console.log(`[FLW webhook] Order ${orderId} marked paid`);
          }
        } else if (status === 'failed' && orderId) {
          await Order.findByIdAndUpdate(orderId, {
            $set: { paymentStatus: 'failed' },
          });
        }
        break;
      }

      default:
        console.log('[FLW webhook] Unhandled event:', eventName);
    }

    // Always 200 — Flutterwave retries on non-2xx
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[FLW webhook] Error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
