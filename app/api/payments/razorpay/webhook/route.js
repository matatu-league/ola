// app/api/payments/razorpay/webhook/route.js
//
// Register this URL in your Razorpay Dashboard → Settings → Webhooks:
//   https://yourdomain.com/api/payments/razorpay/webhook
//
// Recommended events to subscribe to:
//   payment.captured   — payment succeeded
//   payment.failed     — payment failed
//   refund.created     — refund initiated
//
// Razorpay sends a X-Razorpay-Signature header we verify with your webhook secret.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

// Read the raw body — required for signature verification
export async function POST(request) {
  try {
    const rawBody  = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
    }

    // ── Verify webhook signature ────────────────────────────────────────────
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      console.warn('[Razorpay webhook] Invalid signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventName, payload } = event;

    await connectToDatabase();

    switch (eventName) {

      case 'payment.captured': {
        // Payment fully captured — mark order paid
        const payment   = payload.payment?.entity;
        const reference = payment?.id;
        const notes     = payment?.notes || {};

        if (notes.orderId) {
          await Order.findByIdAndUpdate(notes.orderId, {
            $set: {
              paymentStatus:    'paid',
              paymentReference: reference,
              paymentProvider:  'razorpay',
              paidAt:           new Date(),
            },
          });
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        const notes   = payment?.notes || {};
        if (notes.orderId) {
          await Order.findByIdAndUpdate(notes.orderId, {
            $set: { paymentStatus: 'failed' },
          });
        }
        break;
      }

      case 'refund.created': {
        const refund  = payload.refund?.entity;
        const payment = payload.payment?.entity;
        const notes   = payment?.notes || {};
        if (notes.orderId) {
          await Order.findByIdAndUpdate(notes.orderId, {
            $set: {
              paymentStatus: 'refunded',
              refundId:      refund?.id,
              refundedAt:    new Date(),
            },
          });
        }
        break;
      }

      default:
        // Log unhandled events for debugging
        console.log('[Razorpay webhook] Unhandled event:', eventName);
    }

    // Always return 200 quickly — Razorpay retries if you return non-2xx
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Razorpay webhook] Error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}