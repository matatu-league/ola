import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Marketplace';
import { getStoreId } from '@/lib/store-context';

export async function GET(request, props) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store not found or unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify the order exists AND has items for this store
    const order = await Order.findOne({ _id: id, 'items.storeId': storeId })
      .populate('user', 'name email')
      .populate('items.product', 'sku image verified')
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Filter down to only this store's items
    const storeItems = order.items.filter(item => String(item.storeId) === String(storeId));
    const storeTotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    order.items = storeItems;
    order.storeTotal = storeTotal;

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching single store order:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, props) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const storeId = await getStoreId();
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store not found or unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    await connectToDatabase();

    // Find the order ensuring the store actually has items in it
    const order = await Order.findOne({ _id: id, 'items.storeId': storeId });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Handle "Ready for Dispatch" action
    if (action === 'ready_for_dispatch') {
      // In a multi-vendor cart scenario, updating the global order status to 'confirmed'
      // indicates to the admin that the products are ready to be picked up.
      order.orderStatus = 'confirmed';
      await order.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Order marked as ready for dispatch',
        data: order
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action provided' }, { status: 400 });

  } catch (error) {
    console.error('Error updating store order:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}