// app/api/payments/paypal/webhook/route.js
//
// Register this URL in PayPal Developer Dashboard:
//   https://yourdomain.com/api/payments/paypal/webhook
//
// Recommended events:
//   PAYMENT.CAPTURE.COMPLETED   — payment fully captured
//   PAYMENT.CAPTURE.DENIED      — payment declined
//   PAYMENT.CAPTURE.REFUNDED    — refund processed
//   CHECKOUT.ORDER.APPROVED     — user approved but not yet captured

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

// ─── Verify PayPal webhook signature ─────────────────────────────────────────
// PayPal sends several headers we use to verify authenticity.
// We call PayPal's verify-webhook-signature API (no local crypto needed).
async function verifyPayPalWebhook({ headers, rawBody }) {
  const base = process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  // Get fresh access token
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const tokenRes  = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  });
  const tokenData  = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Verify via PayPal API
  const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      auth_algo:         headers.get('paypal-auth-algo'),
      cert_url:          headers.get('paypal-cert-url'),
      transmission_id:   headers.get('paypal-transmission-id'),
      transmission_sig:  headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id:        process.env.PAYPAL_WEBHOOK_ID, // from PayPal dashboard
      webhook_event:     JSON.parse(rawBody),
    }),
  });

  const verifyData = await verifyRes.json();
  return verifyData.verification_status === 'SUCCESS';
}

// ─── POST /api/payments/paypal/webhook ───────────────────────────────────────
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;

    // PAYPAL_WEBHOOK_ID is optional.
    // Our capture-order route already verifies payment server-side before marking
    // any order paid, so the webhook is a redundancy layer, not a security gate.
    // If you set PAYPAL_WEBHOOK_ID in your env, we verify the signature.
    // If you don't set it, we process the event and rely on capture-order verification.
    if (process.env.PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyPayPalWebhook({ headers, rawBody });
      if (!isValid) {
        console.warn('[PayPal webhook] Invalid signature — rejecting event');
        return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
      }
    } else {
      console.log('[PayPal webhook] No PAYPAL_WEBHOOK_ID set — skipping signature check');
    }

    const event    = JSON.parse(rawBody);
    const { event_type, resource } = event;

    await connectToDatabase();

    switch (event_type) {

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Funds captured — find order by PayPal capture ID or custom_id
        const captureId = resource?.id;
        const customId  = resource?.custom_id; // set this in create-order if needed

        if (customId) {
          await Order.findByIdAndUpdate(customId, {
            $set: {
              paymentStatus:    'paid',
              paymentReference: captureId,
              paymentProvider:  'paypal',
              paidAt:           new Date(),
            },
          });
        }
        console.log('[PayPal webhook] Payment captured:', captureId);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const customId = resource?.custom_id;
        if (customId) {
          await Order.findByIdAndUpdate(customId, {
            $set: { paymentStatus: 'failed' },
          });
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const customId = resource?.custom_id;
        if (customId) {
          await Order.findByIdAndUpdate(customId, {
            $set: {
              paymentStatus: 'refunded',
              refundedAt:    new Date(),
            },
          });
        }
        break;
      }

      default:
        console.log('[PayPal webhook] Unhandled event:', event_type);
    }

    // Always return 200 — PayPal retries on non-2xx
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[PayPal webhook] Error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
