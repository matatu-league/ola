import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '../../lib/mongodb';
import { MarketplaceCategory, ProductGrid, ProductReview } from '../../models/Marketplace';
import '../../models/Store'; // <-- ADDED: Ensure Store models are registered so populate('storeCategoryRef') works
import fs from 'fs/promises';
import path from 'path';

// Helper to extract the authenticated User ID from the session cookie
async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  
  if (!sessionCookie) return null;
  
  try {
    let decodedValue = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decodedValue.startsWith('%7B')) {
      decodedValue = decodeURIComponent(decodedValue);
    }
    const sessionData = JSON.parse(decodedValue);
    return sessionData.id;
  } catch (e) {
    console.error("Failed to parse session cookie:", e);
    return null;
  }
}

// ----------------------------------------------------------------------
// GET: Fetch products (Handles ONLY Product Grid)
// ----------------------------------------------------------------------
export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // ==================================================================
    // FETCH PRODUCT GRID / LISTING
    // ==================================================================
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const skip = (page - 1) * limit;
    
    const categorySlug = searchParams.get('category');
    const storeCategoryRef = searchParams.get('storeCategoryRef'); // <-- ADDED: Extract store subcategory ID
    const isOwnerQuery = searchParams.get('owner') === 'true';
    const storeId = searchParams.get('storeId'); 
    
    const query = {};

    // If requesting own products (Seller Dashboard), verify auth and apply filter
    if (isOwnerQuery) {
      const userId = await getUserId();
      if (!userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
      query.owner = userId;
    }

    // If requesting products for a specific storefront UI
    if (storeId) {
       query.owner = storeId;
    }

    // <-- ADDED: Filter by store subcategory if provided
    if (storeCategoryRef) {
       query.storeCategoryRef = storeCategoryRef;
    }

    if (categorySlug) {
      const targetCategory = await MarketplaceCategory.findOne({ slug: categorySlug }).lean();
      
      if (targetCategory) {
        const subCategories = await MarketplaceCategory.find({ parentRef: targetCategory._id }).lean();
        const categoryIds = [targetCategory._id, ...subCategories.map(c => c._id)];
        
        query.categoryRef = { $in: categoryIds };
      } else {
        return NextResponse.json({ 
          success: true, 
          data: { products: [], categories: [], filterSchema: [], pagination: { total: 0, totalPages: 0, page } } 
        });
      }
    }

    let filterSchema = [];
    if (categorySlug) {
      try {
        const filePath = path.join(process.cwd(), 'app', 'data', 'filters', `${categorySlug}.json`);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(fileContents);
        filterSchema = parsedData.schema || [];
      } catch (err) {
        console.warn(`⚠️ Failed to load filter schema for ${categorySlug}:`, err.message);
      }
    }

    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter_')) {
         const valuesArray = value.split(',');
         query[`attributes.${key}`] = { $in: valuesArray }; 
      }
    }

    const [products, total, categories] = await Promise.all([
      ProductGrid.find(query)
        .populate('categoryRef', 'name')
        .populate('storeCategoryRef', 'name slug') // <-- ADDED: Populate the merchant's custom subcategory
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductGrid.countDocuments(query),
      MarketplaceCategory.find({}).lean() 
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        filterSchema, 
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          page
        }
      }
    });

  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Create a new product (Seller Dashboard)
// ----------------------------------------------------------------------
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await connectToDatabase();

    // Map fields safely in case frontend sends 'category' instead of 'categoryRef'
    const payload = {
      ...body,
      owner: userId,
      ...(body.category && { categoryRef: body.category }),
      ...(body.storeCategory && { storeCategoryRef: body.storeCategory }) // <-- ADDED
    };

    const newProduct = await ProductGrid.create(payload);

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT: Update an existing product (Seller Dashboard)
// ----------------------------------------------------------------------
export async function PUT(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updateDataRaw } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Product ID is required for updating' }, { status: 400 });

    await connectToDatabase();

    // Map fields safely for updates
    const updateData = {
      ...updateDataRaw,
      ...(updateDataRaw.category && { categoryRef: updateDataRaw.category }),
      ...(updateDataRaw.storeCategory && { storeCategoryRef: updateDataRaw.storeCategory }) // <-- ADDED
    };

    const updatedProduct = await ProductGrid.findOneAndUpdate(
      { _id: id, owner: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: 'Product not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Remove a product (Seller Dashboard)
// ----------------------------------------------------------------------
export async function DELETE(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });

    await connectToDatabase();

    const deletedProduct = await ProductGrid.findOneAndDelete({ _id: id, owner: userId });

    if (!deletedProduct) {
      return NextResponse.json({ success: false, message: 'Product not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ success: false, message: 'Failed to delete product' }, { status: 500 });
  }
}
