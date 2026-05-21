import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '../../lib/mongodb';
import { Category, Product } from '../../models/Marketplace';
import '../../models/Store';
import fs from 'fs/promises';
import path from 'path';

async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  if (!sessionCookie) return null;

  try {
    let decoded = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    console.log('Decoded session cookie====:', decoded);
    return JSON.parse(decoded).id;
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
    return null;
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const page    = parseInt(searchParams.get('page'))  || 1;
    const limit   = parseInt(searchParams.get('limit')) || 12;
    const skip    = (page - 1) * limit;

    const categorySlug      = searchParams.get('category');
    const storeCategoryId   = searchParams.get('storeCategoryId');
    const isOwnerQuery      = searchParams.get('owner') === 'true';
    const storeId           = searchParams.get('storeId');

    const query = {};

    if (isOwnerQuery) {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      query.userId = userId;
    }

    if (storeId)           query.storeId         = storeId;
    if (storeCategoryId)   query.storeCategoryId = storeCategoryId;

    if (categorySlug) {
      const targetCategory = await Category.findOne({ slug: categorySlug }).lean();

      if (!targetCategory) {
        return NextResponse.json({
          success: true,
          data: { products: [], categories: [], filterSchema: [], pagination: { total: 0, totalPages: 0, page } },
        });
      }

      const subCategories = await Category.find({ parentId: targetCategory._id }).lean();
      query.categoryId = { $in: [targetCategory._id, ...subCategories.map((c) => c._id)] };
    }

    let filterSchema = [];
    if (categorySlug) {
      try {
        const filePath = path.join(process.cwd(), 'app', 'data', 'filters', `${categorySlug}.json`);
        const fileContents = await fs.readFile(filePath, 'utf8');
        filterSchema = JSON.parse(fileContents).schema || [];
      } catch (err) {
        console.warn(`No filter schema for ${categorySlug}:`, err.message);
      }
    }

    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter_')) {
        query[`attributes.${key}`] = { $in: value.split(',') };
      }
    }

    const [products, total, categories] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .populate('storeCategoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      Category.find({}).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: { products, categories, filterSchema, pagination: { total, totalPages: Math.ceil(total / limit), page } },
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const payload = {
      ...body,
      userId,
      ...(body.category      && { categoryId:      body.category }),
      ...(body.storeCategory && { storeCategoryId: body.storeCategory }),
    };

    const newProduct = await Product.create(payload);
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });

    const updateData = {
      ...rest,
      ...(rest.category      && { categoryId:      rest.category }),
      ...(rest.storeCategory && { storeCategoryId: rest.storeCategory }),
    };

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) return NextResponse.json({ success: false, message: 'Product not found or unauthorized' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Products PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });

    const deleted = await Product.findOneAndDelete({ _id: id, userId });
    if (!deleted) return NextResponse.json({ success: false, message: 'Product not found or unauthorized' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}