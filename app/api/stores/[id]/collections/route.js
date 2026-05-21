import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreCollection } from '@/models/Store';

const DEFAULT_COLLECTIONS = [
  { name: 'New Arrivals',   description: 'Products added in the last 30 days.',                     enabled: true,  icon: 'Sparkles',   color: '#2563EB' },
  { name: 'Best Sellers',   description: 'Your most frequently purchased items.',                   enabled: true,  icon: 'TrendingUp', color: '#16A34A' },
  { name: 'Flash Sale',     description: 'Products with an active discount or countdown timer.',    enabled: false, icon: 'Zap',        color: '#FE2C55' },
  { name: 'Clearance',      description: 'Heavily discounted products with low inventory.',         enabled: false, icon: 'Tag',        color: '#F59E0B' },
  { name: 'Under 50k UGX',  description: 'Budget-friendly products grouped automatically by price.', enabled: true, icon: 'DollarSign', color: '#8B5CF6' },
];

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id) return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 });

    const collections = await StoreCollection.find({ storeId: id }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, data: collections });
  } catch (error) {
    console.error('Store Collections GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id) return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 });

    const existingCount = await StoreCollection.countDocuments({ storeId: id });
    if (existingCount > 0) {
      return NextResponse.json({ success: false, error: 'Collections already initialized for this store' }, { status: 400 });
    }

    const inserted = await StoreCollection.insertMany(
      DEFAULT_COLLECTIONS.map((col) => ({ ...col, storeId: id })),
    );

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (error) {
    console.error('Store Collections POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initialize collections' }, { status: 500 });
  }
}