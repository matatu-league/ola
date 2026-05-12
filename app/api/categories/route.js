import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MarketplaceCategory } from '@/models/Marketplace';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch all categories quickly without pulling any product data
    const categories = await MarketplaceCategory.find({}).sort({ name: 1 }).lean();
    
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    console.error("Categories API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}