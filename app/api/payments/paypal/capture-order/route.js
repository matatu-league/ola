// app/api/payments/paypal/capture-order/route.js
//
// Step 2 of the PayPal flow.
// Called AFTER the user approves the payment in the PayPal popup.
// We capture the funds server-side and mark the order as paid.

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

function getPayPalBaseURL() {
  return process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken() {
  const base         = getPayPalBaseURL();
  const credentials  = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to get PayPal access token');
  return data.access_token;
}

// ─── POST /api/payments/paypal/capture-order ──────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { paypalOrderId, orderId } = body; // paypalOrderId = PayPal's ID, orderId = your DB _id

    if (!paypalOrderId) {
      return NextResponse.json(
        { success: false, message: 'paypalOrderId is required' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const base        = getPayPalBaseURL();

    // Capture the payment — moves money from buyer to your PayPal account
    const res = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
    });

    const captureData = await res.json();

    if (!res.ok || captureData.status !== 'COMPLETED') {
      console.error('[PayPal capture-order] Capture failed:', captureData);
      throw new Error(
        captureData.details?.[0]?.description ||
        captureData.message ||
        'PayPal capture failed'
      );
    }

    // Extract the capture ID (the actual payment transaction reference)
    const captureId = captureData
      .purchase_units?.[0]
      ?.payments
      ?.captures?.[0]
      ?.id;

    // ── Mark order paid in DB ───────────────────────────────────────────────
    if (orderId) {
      await connectToDatabase();
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus:    'paid',
          paymentReference: captureId || paypalOrderId,
          paymentProvider:  'paypal',
          paidAt:           new Date(),
        },
      });
    }

    return NextResponse.json({
      success:   true,
      captureId: captureId || paypalOrderId,
      status:    captureData.status,
      message:   'Payment captured successfully',
    });

  } catch (error) {
    console.error('[PayPal capture-order]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
}