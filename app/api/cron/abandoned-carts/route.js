// app/api/cron/abandoned-carts/route.js
// Schedule: every 30 min via Vercel Cron or cPanel
// vercel.json: { "crons": [{ "path": "/api/cron/abandoned-carts", "schedule": "*/30 * * * *" }] }

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Cart } from '@/models/Marketplace';
import { v4 as uuidv4 } from 'uuid';

const ABANDON_AFTER_MINUTES  = 60;    // mark abandoned after 1hr inactivity
const RECOVERY_DELAY_1_MIN   = 60;    // send first email 1hr after abandonment
const RECOVERY_DELAY_2_MIN   = 1440;  // send second email 24hr after abandonment
const MAX_RECOVERY_EMAILS    = 2;
const MIN_CART_VALUE_UGX     = 5000;  // only recover carts worth > UGX 5,000

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const now           = new Date();
    const abandonCutoff = new Date(now.getTime() - ABANDON_AFTER_MINUTES * 60 * 1000);

    // ── Step 1: mark stale active carts as abandoned ──────────────────────
    const markResult = await Cart.updateMany(
      {
        status:         'active',
        lastActivityAt: { $lt: abandonCutoff },
        'items.0':      { $exists: true },
      },
      {
        $set: {
          status:      'abandoned',
          abandonedAt: now,
        },
      }
    );

    console.log(`[Abandoned carts] Marked ${markResult.modifiedCount} carts abandoned`);

    // ── Step 2: find carts eligible for recovery email ────────────────────
    const email1Cutoff = new Date(now.getTime() - RECOVERY_DELAY_1_MIN  * 60 * 1000);
    const email2Cutoff = new Date(now.getTime() - RECOVERY_DELAY_2_MIN  * 60 * 1000);

    const candidates = await Cart.find({
      status:        'abandoned',
      user:          { $ne: null },
      recoveryCount: { $lt: MAX_RECOVERY_EMAILS },
      $or: [
        { recoveryCount: 0, abandonedAt:    { $lt: email1Cutoff } },
        { recoveryCount: 1, recoverySentAt: { $lt: email2Cutoff } },
      ],
    })
    .populate('user',            'name email')
    .populate('items.product',   'title images price')
    .limit(100);

    let emailsSent = 0;

    for (const cart of candidates) {
      if (!cart.user?.email) continue;

      const cartValue = cart.totalPrice || 0;
      if (cartValue < MIN_CART_VALUE_UGX) continue;

      const recoveryToken = uuidv4();

      try {
        await sendRecoveryEmail({
          email:       cart.user.email,
          name:        cart.user.name || 'there',
          cartItems:   cart.items,
          cartValue,
          recoveryToken,
          emailNumber: cart.recoveryCount + 1,
        });

        await Cart.findByIdAndUpdate(cart._id, {
          $set: { recoverySentAt: now, recoveryToken },
          $inc: { recoveryCount: 1 },
        });

        emailsSent++;
      } catch (err) {
        console.error(`[Abandoned carts] Email failed for ${cart.user.email}:`, err);
      }
    }

    return NextResponse.json({
      success:            true,
      markedAbandoned:    markResult.modifiedCount,
      recoveryEmailsSent: emailsSent,
    });

  } catch (error) {
    console.error('[Abandoned carts cron]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function sendRecoveryEmail({ email, name, cartItems, cartValue, recoveryToken, emailNumber }) {
  const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cart/recover?token=${recoveryToken}`;
  const subject     = emailNumber === 1
    ? `${name}, you left something in your cart 🛍️`
    : `Last chance — your cart is about to expire`;

  const itemsList = cartItems.slice(0, 3)
    .map(i => `• ${i.product?.title || 'Product'} x${i.quantity} — UGX ${(i.priceAtAddition * i.quantity).toLocaleString()}`)
    .join('\n');

  const body = `Hi ${name},\n\nYou left ${cartItems.length} item(s) worth UGX ${cartValue.toLocaleString()} in your cart.\n\n${itemsList}${cartItems.length > 3 ? `\n...and ${cartItems.length - 3} more` : ''}\n\nComplete your purchase:\n${recoveryUrl}\n\nThis link expires in 48 hours.\n\n— AlxLite Team`.trim();

  // ── Plug in your email provider here ─────────────────────────────────────
  // Resend example:
  // const { Resend } = await import('resend');
  // await new Resend(process.env.RESEND_API_KEY).emails.send({
  //   from: 'AlxLite <noreply@alxlite.com>', to: email, subject, text: body
  // });

  console.log(`[Recovery email #${emailNumber}] → ${email}\n${subject}\n${body}`);
}