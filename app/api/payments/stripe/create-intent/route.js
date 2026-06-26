// app/api/payments/stripe/create-intent/route.js

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// ── POST /api/payments/stripe/create-intent ───────────────────────────────────
// Called by the frontend StripeForm before confirming a card payment.
// Returns a clientSecret the frontend uses with stripe.confirmCardPayment().
//
// IMPORTANT: Instantiate Stripe INSIDE the handler, not at module level.
// Module-level instantiation runs at compile time when process.env is not
// yet populated — causing "No API key provided" 500 errors.

export async function POST(request) {
  try {
    // ── Key check — fail fast with a clear message ────────────────────────
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      console.error('[Stripe create-intent] STRIPE_SECRET_KEY is not set in environment variables');
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured on the server.' },
        { status: 500 }
      );
    }

    // Instantiate inside handler so env vars are loaded
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // ── UGX is a zero-decimal currency in Stripe ──────────────────────────
    // That means you pass the amount as-is (55000 = UGX 55,000).
    // Do NOT multiply by 100 (that's only for USD/EUR/GBP etc.)
    //
    // NOTE: Stripe does NOT support UGX for payouts to Ugandan bank accounts.
    // If your Stripe account is registered in Uganda, use a supported currency
    // like USD and convert: Math.round(amount / 3900) gives approximate USD cents.
    //
    // If your Stripe account is in a supported country (US/UK/EU):
    //   → use currency: 'ugx', amount: amount  (integer shillings, no multiply)
    //
    // If your Stripe account is NOT in a supported country for UGX:
    //   → use currency: 'usd', amount: Math.round((amount / 3900) * 100)

    // ── Currency conversion ───────────────────────────────────────────────
    // Stripe does NOT support UGX as a settlement currency.
    // We convert UGX → USD cents for the PaymentIntent.
    // Exchange rate: use a live rate API in production (e.g. Open Exchange Rates).
    // For now we use a fixed rate. 1 USD ≈ 3,900 UGX (update periodically).
    const UGX_TO_USD_RATE = Number(process.env.UGX_TO_USD_RATE || 3900);

    // amount arrives as UGX integer (e.g. 55000)
    // → divide by rate to get USD → multiply by 100 to get cents → round up
    const amountInUsdCents = Math.ceil((amount / UGX_TO_USD_RATE) * 100);

    // Stripe minimum is 50 cents ($0.50)
    const MIN_USD_CENTS = 50;
    if (amountInUsdCents < MIN_USD_CENTS) {
      return NextResponse.json(
        {
          success: false,
          message: `Order total is too low for card payment. Minimum is approximately UGX ${Math.ceil((MIN_USD_CENTS / 100) * UGX_TO_USD_RATE).toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    console.log(`[Stripe create-intent] UGX ${amount} → USD ${(amountInUsdCents / 100).toFixed(2)} (${amountInUsdCents} cents)`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountInUsdCents,  // USD cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source:       'alxlite-checkout',
        amountUGX:    amount.toString(),
        exchangeRate: UGX_TO_USD_RATE.toString(),
      },
    });

    // Sanity-check — client_secret should always be present on a new PaymentIntent
    if (!paymentIntent.client_secret) {
      console.error('[Stripe create-intent] PaymentIntent created but client_secret is missing:', paymentIntent);
      return NextResponse.json(
        { success: false, message: 'Stripe returned an invalid payment intent (no client_secret)' },
        { status: 500 }
      );
    }

    console.log('[Stripe create-intent] Created PaymentIntent:', paymentIntent.id, '| status:', paymentIntent.status);

    return NextResponse.json({
      success:      true,
      clientSecret: paymentIntent.client_secret,  // pi_xxx_secret_xxx
      intentId:     paymentIntent.id,
    });

  } catch (error) {
    // Log the full Stripe error so you can see it in your server logs
    console.error('[Stripe create-intent] Error:', {
      type:    error.type,
      code:    error.code,
      message: error.message,
      param:   error.param,
      raw:     error.raw,
    });

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create payment intent',
        // Include Stripe error code in dev so you know exactly what went wrong
        ...(process.env.NODE_ENV === 'development' ? { stripeCode: error.code, stripeType: error.type } : {}),
      },
      { status: 500 }
    );
  }
}