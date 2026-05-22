import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/lib/models';

/**
 * GET /api/orders/[orderId]
 * Fetch a single order by its database _id
 */
export async function GET(request, props) {
  try {
    await connectToDatabase();
    
    // In Next.js 15, route params must be awaited
    const params = await props.params;
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId)
      .populate('user', 'name email image')
      .populate('items.product', 'sku isFlashItem verified'); 
      // Populating extra product details if needed on frontend

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
 * PATCH /api/orders/[orderId]
 * Update an order (e.g., status, tracking info, payment success)
 */
export async function PATCH(request, props) {
  try {
    await connectToDatabase();
    
    // In Next.js 15, route params must be awaited
    const params = await props.params;
    const { orderId } = params;
    
    const body = await request.json();

    // Fields that are allowed to be updated directly
    const { orderStatus, paymentStatus, trackingNumber } = body;

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true, runValidators: true } // return updated document and validate schemas
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