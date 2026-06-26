// app/api/cart/merge/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Cart } from '@/models/Marketplace';

export async function POST(request) {
  try {
    await connectToDatabase();
    const { userId, sessionId } = await request.json();

    if (!userId || !sessionId) {
      return NextResponse.json(
        { success: false, message: 'userId and sessionId are required' },
        { status: 400 }
      );
    }

    const [guestCart, userCart] = await Promise.all([
      Cart.findOne({ sessionId, status: 'active' }),
      Cart.findOne({ user: userId, status: 'active' }),
    ]);

    // Nothing to merge
    if (!guestCart || guestCart.items.length === 0) {
      return NextResponse.json({ success: true, message: 'No guest cart to merge', data: userCart });
    }

    if (!userCart) {
      // Reassign guest cart to the user
      guestCart.user      = userId;
      guestCart.sessionId = null;
      guestCart.status    = 'active';
      await guestCart.save();
      return NextResponse.json({ success: true, data: guestCart });
    }

    // Merge: if same product already in user cart, keep the higher quantity
    const userItemMap = new Map();
    for (const item of userCart.items) {
      userItemMap.set(String(item.product), item);
    }

    for (const guestItem of guestCart.items) {
      const key      = String(guestItem.product);
      const existing = userItemMap.get(key);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, guestItem.quantity);
      } else {
        userCart.items.push(guestItem);
      }
    }

    await userCart.save(); // pre-save hook recalculates totals + lastActivityAt

    // Keep guest cart for analytics — just mark merged
    guestCart.status = 'merged';
    await guestCart.save();

    return NextResponse.json({ success: true, data: userCart });

  } catch (error) {
    console.error('[Cart merge]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}