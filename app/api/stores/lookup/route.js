// File: app/api/store/lookup/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { Product } from '@/models/Marketplace';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain parameter is required' },
        { status: 400 },
      );
    }

    // Connect using your shared database utility
    await connectToDatabase();

    // Query for the exact domain (lowercased & trimmed for matching consistency)
    const store = await Store.findOne({
      domain: domain.toLowerCase().trim(),
    }).lean();

    // 404 indicates the domain is totally free to register!
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 },
      );
    }

    // Fetch products belonging to this specific store owner
    const products = await Product.find({ owner: store.owner }).lean();

    // Construct the structured response with safe fallbacks matching your Theme API logic
    return NextResponse.json(
      {
        success: true,
        data: {
          ...store,
          products: products || [],
          layoutStyle: store.layoutStyle || 'Classic',
          themeColor: store.themeColor || '#161823',
          flashSales: store.features?.flashSales || false,
          themeTemplate: store.themeTemplate || null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Store Lookup API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
