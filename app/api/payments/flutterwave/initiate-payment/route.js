// app/api/payments/flutterwave/initiate-payment/route.js
//
// Step 1 of the Flutterwave flow.
// We use Flutterwave's Standard payment (server-side initialization)
// which gives us a hosted payment link. Alternatively the frontend
// SDK can be used directly — both are covered here.
//
// For the inline SDK (flutterwave-react-v3), the frontend just needs
// NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY and calls the hook directly.
// This backend route is used for the Standard (redirect) flow.

import { NextResponse } from 'next/server';

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

function getFlutterwaveHeaders() {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');
  return {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type':  'application/json',
  };
}

// ─── POST /api/payments/flutterwave/initiate-payment ─────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      amount,
      currency    = 'UGX',
      email,
      name,
      phone,
      orderId,            // your internal DB order _id — stored as tx_ref
      redirectUrl,        // where to send user after payment (Standard flow)
      paymentOptions = 'mobilemoneyrwanda,mobilemoneyuganda,card,ussd',
    } = body;

    if (!amount || !email || !orderId) {
      return NextResponse.json(
        { success: false, message: 'amount, email, and orderId are required' },
        { status: 400 }
      );
    }

    // tx_ref must be unique per transaction
    const txRef = `FLW-${orderId}-${Date.now()}`;

    const payload = {
      tx_ref:          txRef,
      amount:          Number(amount),
      currency,
      redirect_url:    redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      payment_options: paymentOptions,
      customer: {
        email,
        name:         name  || 'Customer',
        phonenumber:  phone || '',
      },
      customizations: {
        title:       'AlxLite Checkout',
        description: `Payment for order ${orderId}`,
        logo:        `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
      meta: {
        orderId,  // echoed back in webhook payload so we can match the order
      },
    };

    const res = await fetch(`${FLW_BASE_URL}/payments`, {
      method:  'POST',
      headers: getFlutterwaveHeaders(),
      body:    JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      console.error('[FLW initiate-payment] API error:', data);
      throw new Error(data.message || 'Failed to initiate Flutterwave payment');
    }

    return NextResponse.json({
      success:    true,
      txRef,
      paymentLink: data.data.link, // hosted payment page URL (Standard flow)
    });

  } catch (error) {
    console.error('[FLW initiate-payment]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}