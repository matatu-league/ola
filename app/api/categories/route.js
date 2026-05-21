import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category, Product } from '@/models/Marketplace';

export async function GET() {
  try {
    await connectToDatabase();

    const [categories, productCounts] = await Promise.all([
      Category.find({}).sort({ name: 1 }).lean(),
      Product.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = Object.fromEntries(
      productCounts.filter((item) => item._id).map((item) => [item._id.toString(), item.count])
    );

    const enrichedCategories = categories.map((cat) => {
      const idStr = cat._id.toString();
      let count   = countMap[idStr] || 0;

      if (!cat.parentId) {
        count += categories
          .filter((sub) => sub.parentId?.toString() === idStr)
          .reduce((sum, sub) => sum + (countMap[sub._id.toString()] || 0), 0);
      }

      return { ...cat, productCount: count };
    });

    return NextResponse.json({ success: true, data: enrichedCategories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const { name, slug, parentId } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const exists = await Category.findOne({ slug }).lean();
    if (exists) {
      return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 400 });
    }

    const newCategory = await Category.create({ name, slug, parentId: parentId || null });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}