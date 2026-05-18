import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MarketplaceCategory, ProductGrid } from '@/models/Marketplace';

// GET: Fetch all categories with dynamic product counts
export async function GET() {
  try {
    await connectToDatabase();
    
    // 1. Fetch all categories
    const categories = await MarketplaceCategory.find({}).sort({ name: 1 }).lean();
    
    // 2. Aggregate product counts by categoryRef from the ProductGrid
    const productCounts = await ProductGrid.aggregate([
      {
        $group: {
          _id: '$categoryRef',
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Create a lookup map for instant access: { categoryId: count }
    const countMap = {};
    productCounts.forEach(item => {
      if (item._id) {
        countMap[item._id.toString()] = item.count;
      }
    });

    // 4. Attach counts to categories and roll up subcategory counts to parents
    const enrichedCategories = categories.map(cat => {
      const idStr = cat._id.toString();
      let count = countMap[idStr] || 0;
      
      // If this is a parent category, add the counts of all its subcategories
      if (!cat.parentRef) {
         const subCategoryCounts = categories
           .filter(sub => sub.parentRef && sub.parentRef.toString() === idStr)
           .reduce((sum, sub) => sum + (countMap[sub._id.toString()] || 0), 0);
           
         count += subCategoryCounts;
      }
      
      return {
        ...cat,
        productCount: count
      };
    });

    return NextResponse.json({ success: true, data: enrichedCategories }, { status: 200 });
  } catch (error) {
    console.error("Categories API Error (GET):", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}


// POST: Create a new category
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, slug, status, parentRef } = body;

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingCategory = await MarketplaceCategory.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 400 });
    }

    const newCategory = await MarketplaceCategory.create({
      name,
      slug,
      status: status || 'Active',
      parentRef: parentRef || null
    });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Categories API Error (POST):", error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}