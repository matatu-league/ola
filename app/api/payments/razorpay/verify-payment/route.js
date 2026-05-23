// app/api/payments/razorpay/verify-payment/route.js
//
// Called from the frontend immediately after Razorpay modal fires its success
// handler. Verifies the payment signature server-side before marking order paid.
// No webhook secret needed — this uses your regular RAZORPAY_KEY_SECRET.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,             // your internal DB order _id (optional)
    } = body;

    // ── Validate required fields ────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing Razorpay payment fields' },
        { status: 400 }
      );
    }

    // ── Signature verification ──────────────────────────────────────────────
    // Razorpay spec: HMAC-SHA256( order_id + "|" + payment_id, RAZORPAY_KEY_SECRET )
    // This uses the same KEY_SECRET as create-order — no extra webhook secret.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('[Razorpay verify] Signature mismatch');
      return NextResponse.json(
        { success: false, message: 'Payment verification failed — invalid signature' },
        { status: 400 }
      );
    }

    // ── Mark order paid in DB (if orderId provided) ─────────────────────────
    if (orderId) {
      await connectToDatabase();
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus:    'paid',
          paymentReference: razorpay_payment_id,
          paymentProvider:  'razorpay',
          paidAt:           new Date(),
        },
      });
    }

    return NextResponse.json({
      success:   true,
      paymentId: razorpay_payment_id,
      message:   'Payment verified',
    });

  } catch (error) {
    console.error('[Razorpay verify-payment]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Verification error' },
      { status: 500 }
    );
  }
}
