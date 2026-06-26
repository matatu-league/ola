// app/api/categories/route.js
// Dedicated categories endpoint — replaces the /api/products?limit=1 hack.
// Returns all categories as a flat array; the client builds the tree.

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/models/Marketplace';

export async function GET() {
  try {
    await connectToDatabase();

    const categories = await Category.find({})
      .sort({ name: 1 })
      .select('_id name slug image description parentId')
      .lean();

    return NextResponse.json(
      { success: true, data: categories },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes — categories rarely change
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[Categories GET]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
