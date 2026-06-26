import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Marketplace';
import { getStoreId } from '@/lib/store-context';

export async function GET(request) {
  try {
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store not found or unauthorized' }, { status: 401 });
    }

    // Extract query parameters for pagination, search, and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || 'All Orders';
    const search = searchParams.get('search') || '';

    await connectToDatabase();

    // Build the query object
    let query = { 'items.storeId': storeId };

    // 1. Apply Tab Filter
    if (status && status !== 'All Orders') {
      query.orderStatus = status.toLowerCase();
    }

    // 2. Apply Search Filter (Order Number or Customer Name/Email)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const orConditions = [{ orderNumber: searchRegex }];

      // Securely search by user details if the User model is registered
      if (mongoose.models.User) {
        const matchingUsers = await mongoose.models.User.find({
          $or: [{ name: searchRegex }, { email: searchRegex }]
        }).select('_id').lean();

        if (matchingUsers.length > 0) {
          orConditions.push({ user: { $in: matchingUsers.map(u => u._id) } });
        }
      }

      query.$or = orConditions;
    }

    // 3. Count total documents matching the query for pagination metadata
    const total = await Order.countDocuments(query);

    // 4. Fetch paginated data
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map orders to attach the specific store's items and totals
    const storeOrders = orders.map(order => {
      const storeItems = order.items.filter(item => String(item.storeId) === String(storeId));
      const storeTotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...order,
        items: storeItems,
        storeTotal, 
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: storeOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching store orders:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
