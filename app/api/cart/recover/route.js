// app/api/cart/recover/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Cart } from '@/models/Marketplace';

const TOKEN_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token required' }, { status: 400 });
    }

    const cart = await Cart.findOne({
      recoveryToken: token,
      status:        'abandoned',
    })
    .populate('items.product', 'title images price stock active')
    .lean();

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Recovery link is invalid or has already been used' },
        { status: 404 }
      );
    }

    // Check token expiry
    if (cart.recoverySentAt && Date.now() - new Date(cart.recoverySentAt).getTime() > TOKEN_EXPIRY_MS) {
      return NextResponse.json(
        { success: false, message: 'This recovery link has expired' },
        { status: 410 }
      );
    }

    // Filter out deleted / deactivated products
    const validItems = cart.items.filter(item => item.product && item.product.active !== false);

    // Mark cart active again + invalidate the token
    await Cart.findByIdAndUpdate(cart._id, {
      $set: {
        status:         'active',
        lastActivityAt: new Date(),
        recoveryToken:  null,
        source:         'email-recovery',
      },
    });

    return NextResponse.json({ success: true, data: { ...cart, items: validItems } });

  } catch (error) {
    console.error('[Cart recover]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}