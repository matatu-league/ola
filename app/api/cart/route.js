// app/api/cart/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Cart } from '@/models/Marketplace';

// ── GET /api/cart ─────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId    = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json({ success: false, message: 'userId or sessionId required' }, { status: 400 });
    }

    const query = userId
      ? { user: userId, status: 'active' }
      : { sessionId,   status: 'active' };

    const cart = await Cart.findOne(query)
      .populate('items.product', 'title images price stock active flashSalePrice isFlashItem')
      .lean();

    return NextResponse.json({ success: true, data: cart || null });

  } catch (error) {
    console.error('[Cart GET]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── POST /api/cart — full cart sync (debounced from client) ───────────────────
export async function POST(request) {
  try {
    await connectToDatabase();
    const { userId, sessionId, items } = await request.json();

    if (!userId && !sessionId) {
      return NextResponse.json({ success: false, message: 'userId or sessionId required' }, { status: 400 });
    }
    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'items must be an array' }, { status: 400 });
    }

    const query = userId
      ? { user: userId, status: 'active' }
      : { sessionId,   status: 'active' };

    // Map frontend cart items to CartItemSchema shape
    const mappedItems = items.map(i => ({
      product:         i.product._id || i.product,
      quantity:        i.quantity,
      priceAtAddition: i.priceAtAddition,
      variants:        i.variants || {},
    }));

    // findOneAndUpdate with upsert — creates cart if it doesn't exist yet.
    // We set items and let the pre-save hook recalculate totalQuantity/totalPrice.
    const cart = await Cart.findOneAndUpdate(
      query,
      {
        $set: {
          items,
          status:         'active',
          lastActivityAt: new Date(),
          ...(userId    ? { user: userId }       : {}),
          ...(sessionId ? { sessionId }          : {}),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Manually run pre-save totals since findOneAndUpdate bypasses middleware
    await Cart.findByIdAndUpdate(cart._id, {
      $set: {
        totalQuantity: mappedItems.reduce((s, i) => s + i.quantity, 0),
        totalPrice:    mappedItems.reduce((s, i) => s + i.priceAtAddition * i.quantity, 0),
      },
    });

    return NextResponse.json({ success: true, data: cart });

  } catch (error) {
    console.error('[Cart POST]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── DELETE /api/cart — mark as converted after order placed ───────────────────
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId    = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const orderId   = searchParams.get('orderId');

    const query = userId
      ? { user: userId, status: 'active' }
      : { sessionId,   status: 'active' };

    await Cart.findOneAndUpdate(query, {
      $set: {
        status:           'converted',
        convertedAt:      new Date(),
        items:            [],
        totalQuantity:    0,
        totalPrice:       0,
        ...(orderId ? { convertedOrderId: orderId } : {}),
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Cart DELETE]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}