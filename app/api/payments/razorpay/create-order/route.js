// app/api/payments/razorpay/create-order/route.js

import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

// ─── POST /api/payments/razorpay/create-order ─────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // FIX: instantiate INSIDE the handler so env vars are loaded by the time
    // this runs. Module-level instantiation runs during compilation when
    // process.env is not yet populated, causing "key_id is mandatory" crash.
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Razorpay amounts are always in the smallest currency unit:
    //   INR → paise  (₹500 = 50000)
    //   USD → cents  ($5   = 500)
    //   UGX → no sub-unit, pass integer as-is (UGX 5000 = 5000)
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt:         receipt || `rcpt_${Date.now()}`,
      payment_capture: 1, // auto-capture immediately on success
    });

    return NextResponse.json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
    });

  } catch (error) {
    console.error('[Razorpay create-order]', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.error?.description || error.message || 'Failed to create Razorpay order',
      },
      { status: 500 }
    );
  }
}
