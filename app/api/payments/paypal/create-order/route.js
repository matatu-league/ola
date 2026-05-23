// app/api/payments/paypal/create-order/route.js
//
// Step 1 of the PayPal flow.
// Frontend calls this to get a PayPal orderID before showing the PayPal buttons.
// We call PayPal's Orders API v2 server-side using our client credentials.

import { NextResponse } from 'next/server';

// ─── PayPal API base URL ──────────────────────────────────────────────────────
// Sandbox:    https://api-m.sandbox.paypal.com
// Production: https://api-m.paypal.com
function getPayPalBaseURL() {
  return process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

// ─── Get access token ─────────────────────────────────────────────────────────
// PayPal uses OAuth 2.0 client_credentials. We fetch a short-lived token
// and use it to authenticate every API call. Tokens expire in ~9 hours
// but for simplicity we fetch a fresh one per request.
// For production, cache this token in Redis or memory with its expiry.
async function getPayPalAccessToken() {
  const base       = getPayPalBaseURL();
  const clientId   = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not set');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error_description || 'Failed to get PayPal access token');
  }

  return data.access_token;
}

// ─── POST /api/payments/paypal/create-order ───────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'USD', description = 'AlxLite Order' } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    const base        = getPayPalBaseURL();

    // PayPal amounts must be a string with 2 decimal places: "25.00"
    // If your amount is in UGX (no decimals), convert to USD first or
    // use a supported currency. PayPal supports USD, EUR, GBP etc.
    // UGX is NOT supported by PayPal — you must convert.
    const amountValue = Number(amount).toFixed(2);

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
        'PayPal-Request-Id': `order-${Date.now()}`, // idempotency key
      },
      body: JSON.stringify({
        intent: 'CAPTURE', // capture immediately on approval
        purchase_units: [
          {
            description,
            amount: {
              currency_code: currency,
              value:         amountValue,
            },
          },
        ],
        application_context: {
          brand_name:          'AlxLite',
          landing_page:        'NO_PREFERENCE',
          user_action:         'PAY_NOW',
          return_url:          `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
          cancel_url:          `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[PayPal create-order] API error:', data);
      throw new Error(data.message || 'Failed to create PayPal order');
    }

    return NextResponse.json({
      success: true,
      id:      data.id, // PayPal orderID — sent back to frontend PayPalButtons
    });

  } catch (error) {
    console.error('[PayPal create-order]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}
