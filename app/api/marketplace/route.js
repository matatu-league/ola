import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category, Collection, Product } from '@/models/Marketplace';

export async function GET() {
  try {
    await connectToDatabase();

    const [categories, collections, productGrid] = await Promise.all([
      Category.find({}).lean(),
      Collection.find({ active: true }).lean(),
      Product.find({ status: 'active' }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: { categories, collections, productGrid },
    });
  } catch (error) {
    console.error('Marketplace fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marketplace data' },
      { status: 500 },
    );
  }
}