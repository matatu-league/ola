import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreCollection } from '@/models/Store'; // Adjust if your model path is different
import { getStoreId } from '@/lib/store-context';

const DEFAULT_COLLECTIONS = [
  {
    collectionId: 'new_arrivals',
    name: 'New Arrivals',
    description: 'Automatically showcases products added in the last 30 days.',
    icon: 'Sparkles',
    color: '#3B82F6', // Blue
    enabled: true
  },
  {
    collectionId: 'best_sellers',
    name: 'Best Sellers',
    description: 'Products with the highest sales volume across your store.',
    icon: 'TrendingUp',
    color: '#16A34A', // Green
    enabled: true
  },
  {
    collectionId: 'flash_sale',
    name: 'Flash Sale',
    description: 'Highlights items with active discounts or marked as flash items.',
    icon: 'Zap',
    color: '#FE2C55', // Red
    enabled: false
  },
  {
    collectionId: 'clearance',
    name: 'Clearance',
    description: 'Auto-groups items with low stock or huge discounts.',
    icon: 'Tag',
    color: '#F59E0B', // Orange
    enabled: false
  }
];

export async function GET(request) {
  try {
    // getStoreId is now fully self-contained! No params needed.
    const storeId = await getStoreId();
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or store not found' }, 
        { status: 404 }
      );
    }

    await connectToDatabase();

    let collections = await StoreCollection.find({ storeId }).sort({ createdAt: 1 }).lean();

    // Auto-seed collections on first GET request if none exist
    if (collections.length === 0) {
      const defaultData = DEFAULT_COLLECTIONS.map(col => ({
        ...col,
        storeId
      }));
      
      const insertedCollections = await StoreCollection.insertMany(defaultData);
      
      // Convert mongoose docs to plain objects if needed, though insertMany returns the docs
      collections = insertedCollections.map(doc => doc.toObject ? doc.toObject() : doc);
    }

    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // getStoreId is now fully self-contained! No params needed.
    const storeId = await getStoreId();
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or store not found' }, 
        { status: 404 }
      );
    }

    await connectToDatabase();

    // Check if collections already exist to avoid duplicates
    const existingCount = await StoreCollection.countDocuments({ storeId });
    if (existingCount > 0) {
      const existing = await StoreCollection.find({ storeId }).lean();
      return NextResponse.json({ success: true, data: existing });
    }

    // Map the defaults to include the storeId dynamically fetched from cookie
    const defaultData = DEFAULT_COLLECTIONS.map(col => ({
      ...col,
      storeId
    }));

    // Insert all defaults at once
    const insertedCollections = await StoreCollection.insertMany(defaultData);

    return NextResponse.json({ success: true, data: insertedCollections }, { status: 201 });
  } catch (error) {
    console.error('Error initializing collections:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}