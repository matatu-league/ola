// app/api/payments/flutterwave/verify-payment/route.js
// Flutterwave v4 — secret key is a plain string (not FLWSECK_ prefixed)
// e.g. FLUTTERWAVE_SECRET_KEY=6nCccAID9ryPQjf6kJkLPXI1rI4svoFE

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

function getHeaders() {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');
  return {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type':  'application/json',
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { transactionId, orderId, expectedAmount, expectedCurrency = 'UGX' } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'transactionId is required' },
        { status: 400 }
      );
    }

    // ── Call Flutterwave v3 REST API to verify ──────────────────────────────
    // The REST endpoint is v3 regardless of key version
    const res = await fetch(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
      method:  'GET',
      headers: getHeaders(),
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      console.error('[FLW verify]', data);
      throw new Error(data.message || 'Verification request failed');
    }

    const tx = data.data;

    // ── Validate status ─────────────────────────────────────────────────────
    if (tx.status !== 'successful') {
      return NextResponse.json(
        { success: false, message: `Transaction status: ${tx.status}` },
        { status: 400 }
      );
    }

    // ── Validate amount — prevent underpayment fraud ────────────────────────
    if (expectedAmount && Number(tx.amount) < Number(expectedAmount)) {
      console.warn(`[FLW verify] Amount mismatch — expected ${expectedAmount}, got ${tx.amount}`);
      return NextResponse.json(
        { success: false, message: 'Payment amount does not match order total' },
        { status: 400 }
      );
    }

    // ── Validate currency ───────────────────────────────────────────────────
    if (tx.currency !== expectedCurrency) {
      return NextResponse.json(
        { success: false, message: `Currency mismatch: expected ${expectedCurrency}, got ${tx.currency}` },
        { status: 400 }
      );
    }

    // ── Mark order paid ─────────────────────────────────────────────────────
    const dbOrderId = orderId || tx.meta?.orderId;
    if (dbOrderId) {
      await connectToDatabase();
      await Order.findByIdAndUpdate(dbOrderId, {
        $set: {
          paymentStatus:    'paid',
          paymentReference: String(transactionId),
          paymentProvider:  'flutterwave',
          paidAt:           new Date(),
        },
      });
    }

    return NextResponse.json({
      success:       true,
      transactionId: tx.id,
      txRef:         tx.tx_ref,
      amount:        tx.amount,
      currency:      tx.currency,
      message:       'Payment verified successfully',
    });

  } catch (error) {
    console.error('[FLW verify-payment]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Verification error' },
      { status: 500 }
    );
  }
}