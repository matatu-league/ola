import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, Cart } from '@/lib/models';

/**
 * GET /api/orders
 * Fetches orders based on query parameters.
 * - All Orders: (No params, usually for Admins)
 * - User Orders: ?userId=123
 * - Store Orders: ?storeId=123
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');

    // Build the query object dynamically
    let query = {};
    
    if (userId) {
      query.user = userId;
    }
    
    if (storeId) {
      // Find orders where at least one item belongs to the store
      query['items.storeId'] = storeId;
    }

    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email'); // Populate basic user info

    return NextResponse.json({ success: true, data: orders }, { status: 200 });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Creates a new order
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const {
      user, // User ID
      items,
      shippingAddress,
      subTotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      cartId // Optional: pass cartId to automatically empty it
    } = body;

    // Validate essential fields
    if (!user || !items || !items.length || !shippingAddress || !totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Missing required order fields' },
        { status: 400 }
      );
    }

    // Generate a unique order number (e.g., ORD-168234810-745)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = await Order.create({
      user,
      orderNumber,
      items,
      shippingAddress,
      subTotal,
      shippingFee: shippingFee || 0,
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending', // Starts as pending
      orderStatus: 'processing'
    });

    // Optional: Clear the user's cart if a cartId was provided
    if (cartId) {
       await Cart.findByIdAndDelete(cartId);
    }

    return NextResponse.json(
      { success: true, data: newOrder, message: 'Order created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create order', error: error.message },
      { status: 500 }
    );
  }
}