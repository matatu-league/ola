import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { ProductGrid } from '@/models/Marketplace'; 

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { storeId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      Store.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Store.countDocuments(query)
    ]);

    // Extract only the actual Store ObjectIds
    const storeIds = stores.map(store => store._id).filter(Boolean);

    let productCounts = [];
    if (storeIds.length > 0) {
      try {
        // Aggregate directly against the new storeId reference in the ProductGrid!
        productCounts = await ProductGrid.aggregate([
          { $match: { storeId: { $in: storeIds } } },
          { $group: { _id: '$storeId', count: { $sum: 1 } } }
        ]);
      } catch (aggError) {
        console.warn("ProductGrid aggregation failed, defaulting to 0:", aggError);
      }
    }

    const countMap = {};
    productCounts.forEach(item => {
      if (item._id) {
        countMap[item._id.toString()] = item.count;
      }
    });

    const enrichedStores = stores.map(store => {
      const storeIdStr = store._id ? store._id.toString() : null;
      
      return {
        ...store,
        productCount: storeIdStr && countMap[storeIdStr] ? countMap[storeIdStr] : 0
      };
    });

    return NextResponse.json({ 
      success: true, 
      stores: enrichedStores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[Stores API - GET] Error fetching stores:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Auto-generate domain if not provided, using title
    if (!body.domain && body.title) {
      body.domain = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '.store.com';
    }

    // Auto-generate a readable custom storeId if not provided
    if (!body.storeId) {
      const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
      body.storeId = `STR-${randomChars}`;
    }

    const newStore = await Store.create(body);
    
    return NextResponse.json({ success: true, store: newStore }, { status: 201 });
  } catch (error) {
    console.error('[Stores API - POST] Error creating store:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Store domain or title already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create store' }, { status: 500 });
  }
}