// app/api/orders/me/route.js
// Returns orders for the currently logged-in user.
// Reads userId from the user_session cookie server-side —
// no userId needed in the query string, no client-side cookie parsing.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Marketplace';
import mongoose from 'mongoose';

// ── Extract userId from session cookie (server-side) ─────────────────────────
async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  if (!sessionCookie) return null;
  try {
    let decoded = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    console.log('Decoded session cookie====:', decoded);
    return JSON.parse(decoded).id;
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
    return null;
  }
}

// ── GET /api/orders/me ────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized — please sign in' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const orderStatus = searchParams.get('status');   // optional: filter by orderStatus
    const page        = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit       = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip        = (page - 1) * limit;

    const query = { user: userId };
    if (orderStatus) query.orderStatus = orderStatus;

    const [orders, total, statusCounts] = await Promise.all([

      // ── Paginated order list ──────────────────────────────────────────────
      // Populate items.product and item-level store info so the order card
      // can always derive sellerId for the Chat button
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path:   'items.product',
          select: 'title images price status storeId',
          populate: {
            path:   'storeId',
            select: 'title logo owner',
          },
        })
        .populate('pickupStationId', 'name address city')
        .lean(),

      // ── Total count for pagination ────────────────────────────────────────
      Order.countDocuments(query),

      // ── Per-status counts for tab badges ─────────────────────────────────
      Order.aggregate([
        {
          $match: {
            user: mongoose.Types.ObjectId.isValid(userId)
              ? new mongoose.Types.ObjectId(userId)
              : userId,
          },
        },
        {
          $group: {
            _id:   '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Flatten aggregate result → { processing: 2, confirmed: 1, ... }
    const counts = {};
    for (const { _id, count } of statusCounts) {
      counts[_id] = count;
    }

    // ── Flatten store/seller info onto each order ──────────────────────────
    // The first item's product.storeId carries the store; its owner is the
    // person the buyer would chat with. Surface these at the order level so
    // the OrderCard component has them without digging through populated refs.
    const enrichedOrders = orders.map(order => {
      const firstProduct = order.items?.[0]?.product;
      const store        = firstProduct?.storeId; // populated store doc

      return {
        ...order,
        // For the Chat button — sellerId is the store owner
        sellerId: store?.owner || null,
        storeId:  store?._id   || null,
        store:    store ? {
          _id:   store._id,
          title: store.title,
          logo:  store.logo,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data:    enrichedOrders,
      counts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('[GET /api/orders/me]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
