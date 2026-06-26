// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, Cart } from '@/models/Marketplace';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Generate a short human-readable order number: ALX-20250523-XXXX
function generateOrderNumber() {
  const date   = new Date();
  const ymd    = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `ALX-${ymd}-${suffix}`;
}

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Creates a new order.
// Called in two scenarios:
//   1. paymentStatus: 'pending'  — draft order created before gateway opens
//                                  (so Flutterwave / Razorpay get a real orderId)
//   2. paymentStatus: 'pending'  — COD order (confirmed immediately on success page)
//
// After a gateway succeeds, PATCH /api/orders/[id] updates paymentStatus to 'paid'.

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const {
      user,
      items,
      shippingAddress,
      shippingMethod,
      pickupStationId,
      subTotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentProvider,
      paymentReference,
      paymentStatus = 'pending',
      // Optional — if provided we mark the backend cart as converted
      sessionId,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User is required' },
        { status: 400 }
      );
    }
    if (!items?.length) {
      return NextResponse.json(
        { success: false, message: 'Order must have at least one item' },
        { status: 400 }
      );
    }
    // Accept both 'phone' and 'phoneNumber' from the client for resilience
    if (shippingAddress?.phoneNumber && !shippingAddress?.phone) {
      shippingAddress.phone = shippingAddress.phoneNumber;
    }

    if (!shippingAddress?.fullName) {
      return NextResponse.json({ success: false, message: 'Shipping address: fullName is required' }, { status: 400 });
    }
    if (!shippingAddress?.phone) {
      return NextResponse.json({ success: false, message: 'Shipping address: phone is required' }, { status: 400 });
    }
    if (!shippingAddress?.addressLine1) {
      return NextResponse.json({ success: false, message: 'Shipping address: addressLine1 is required' }, { status: 400 });
    }
    if (!shippingAddress?.city) {
      return NextResponse.json({ success: false, message: 'Shipping address: city is required' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Payment method is required' },
        { status: 400 }
      );
    }

    // ── Create order ──────────────────────────────────────────────────────────
    const order = await Order.create({
      user,
      orderNumber:     generateOrderNumber(),
      items:           items.map(item => ({
        product:  item.product,
        storeId:  item.storeId  || null,
        name:     item.name,
        image:    item.image    || '',
        price:    item.price,
        quantity: item.quantity,
        variants: item.variants || {},
      })),
      shippingAddress: {
        fullName:               shippingAddress.fullName,
        phone:                  shippingAddress.phone,          // matches ShippingAddressSchema
        addressLine1:           shippingAddress.addressLine1,
        city:                   shippingAddress.city,
        country:                shippingAddress.country || 'Uganda',
        additionalInstructions: shippingAddress.additionalInstructions || '',
      },
      shippingMethod:   shippingMethod   || 'standard',
      pickupStationId:  pickupStationId  || null,
      subTotal,
      shippingFee:      shippingFee      || 0,
      totalAmount,
      paymentMethod,
      paymentProvider:  paymentProvider  || null,
      paymentReference: paymentReference || null,
      paymentStatus,
      paidAt: paymentStatus === 'paid' ? new Date() : null,
      orderStatus: 'processing',
    });

    // ── Mark backend cart as converted ────────────────────────────────────────
    // Works whether cart is tied to userId or sessionId
    try {
      const cartQuery = sessionId
        ? { sessionId, status: 'active' }
        : { user,      status: 'active' };

      await Cart.findOneAndUpdate(cartQuery, {
        $set: {
          status:           'converted',
          convertedAt:      new Date(),
          convertedOrderId: order._id,
          items:            [],
          totalQuantity:    0,
          totalPrice:       0,
        },
      });
    } catch (cartErr) {
      // Don't fail the order if cart update errors — just log it
      console.warn('[Orders POST] Cart update failed:', cartErr.message);
    }

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Orders POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

// ── GET /api/orders ───────────────────────────────────────────────────────────
// Fetch orders for a user, or all orders for admins.
// Query params: userId, status, page, limit

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId      = searchParams.get('userId');
    const orderStatus = searchParams.get('status');
    const page        = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit       = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const skip        = (page - 1) * limit;

    const query = {};
    if (userId)      query.user        = userId;
    if (orderStatus) query.orderStatus = orderStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data:    orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('[Orders GET]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
