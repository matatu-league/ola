import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Marketplace';

/**
 * GET /api/orders/[id]
 * Fetch a single order by its database _id
 */
export async function GET(request, props) {
  try {
    await connectToDatabase();

    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id)
      .populate('user', 'name email image')
      .populate('items.product', 'sku isFlashItem verified');

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order }, { status: 200 });

  } catch (error) {
    console.error('Error fetching single order:', error);
    return NextResponse.json(
      { success: false, message: 'Server error fetching order', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Update an order — used in two scenarios:
 *
 *   1. Admin updates (status, tracking):
 *      { orderStatus, trackingNumber }
 *
 *   2. Checkout payment confirmation (after gateway success):
 *      { paymentStatus, paymentReference, paymentProvider, paidAt }
 *
 * Only whitelisted fields are written to the DB.
 */
export async function PATCH(request, props) {
  try {
    await connectToDatabase();

    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ── Whitelist — only these fields can be patched ──────────────────────────
    const {
      orderStatus,
      paymentStatus,
      paymentReference,
      paymentProvider,
      paidAt,
      trackingNumber,
    } = body;

    const updateData = {};

    if (orderStatus)      updateData.orderStatus      = orderStatus;
    if (paymentStatus)    updateData.paymentStatus    = paymentStatus;
    if (paymentReference) updateData.paymentReference = paymentReference;
    if (paymentProvider)  updateData.paymentProvider  = paymentProvider;
    if (paidAt)           updateData.paidAt           = new Date(paidAt);
    if (trackingNumber)   updateData.trackingNumber   = trackingNumber;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedOrder, message: 'Order updated successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating order', error: error.message },
      { status: 500 }
    );
  }
}
