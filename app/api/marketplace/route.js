import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../lib/mongodb';
import { TopDeal, TailoredSelection, ProductGrid, NewArrival, MarketplaceCategory } from '../../models/Marketplace';

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all the marketplace data in parallel for speed
    const [categories, topDeals, tailoredSelections, productGrid, newArrivals] = await Promise.all([
      MarketplaceCategory.find({}).lean(), // Fetching the categories!
      TopDeal.find({}).lean(),
      TailoredSelection.find({}).lean(),
      ProductGrid.find({}).lean(),
      NewArrival.find({}).lean()
    ]);

    // Return exactly what the ProductsView component expects
    return NextResponse.json({
      success: true,
      data: {
        categories, // Now this is included
        topDeals,
        tailoredSelections,
        productGrid,
        newArrivals
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Marketplace fetch error:", error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch marketplace data' 
    }, { status: 500 });
  }
}