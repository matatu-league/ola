import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '../../lib/mongodb';
import { Category, CategoryFilter, Product } from '../../models/Marketplace';
import '../../models/Store';

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

    const search            = searchParams.get('search');
    const categorySlug      = searchParams.get('category');
    const storeCategoryId   = searchParams.get('storeCategoryId');
    const isOwnerQuery      = searchParams.get('owner') === 'true';
    const storeId           = searchParams.get('storeId');
    const status            = searchParams.get('status') || 'active';
    const sortBy            = searchParams.get('sortBy') || 'createdAt';
    const sortOrder         = searchParams.get('sortOrder') || 'desc';

    const query = {};

    // ── Status filter ──────────────────────────────────────────────────
    if (!isOwnerQuery) {
      // For public queries, only show active products
      query.status = status;
    }

    // ── Owner filter ───────────────────────────────────────────────────
    if (isOwnerQuery) {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      query.userId = userId;
    }

    // ── Store filter ───────────────────────────────────────────────────
    if (storeId) {
      query.storeId = storeId;
    }

    // ── Store category filter ──────────────────────────────────────────
    if (storeCategoryId) {
      query.storeCategoryId = storeCategoryId;
    }

    // ── Category filter ────────────────────────────────────────────────
    if (categorySlug) {
      const targetCategory = await Category.findOne({ slug: categorySlug }).lean();

      if (!targetCategory) {
        return NextResponse.json({
          success: true,
          data: { 
            products: [], 
            categories: [], 
            filterSchema: [], 
            pagination: { total: 0, totalPages: 0, page } 
          },
        });
      }

      const subCategories = await Category.find({ parentId: targetCategory._id }).lean();
      query.categoryId = { $in: [targetCategory._id, ...subCategories.map((c) => c._id)] };
    }

    // ── SEARCH FUNCTIONALITY ───────────────────────────────────────────
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      // Split search into individual words for better matching
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      
      // Escape special regex characters
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create search conditions
      const searchConditions = [];
      
      // 1. Exact phrase match (highest relevance)
      searchConditions.push({
        title: { $regex: new RegExp(escapeRegex(searchTerm), 'i') }
      });
      
      // 2. Each word individually in title
      if (searchWords.length > 1) {
        searchWords.forEach(word => {
          if (word.length > 1) { // Skip single characters
            searchConditions.push({
              title: { $regex: new RegExp(escapeRegex(word), 'i') }
            });
          }
        });
      }
      
      // 3. Search in description
      searchConditions.push({
        description: { $regex: new RegExp(escapeRegex(searchTerm), 'i') }
      });
      
      // 4. Search by SKU (exact match)
      searchConditions.push({
        sku: { $regex: new RegExp(`^${escapeRegex(searchTerm)}`, 'i') }
      });
      
      // 5. Search in breadcrumbs
      searchConditions.push({
        breadcrumbs: { $regex: new RegExp(escapeRegex(searchTerm), 'i') }
      });
      
      // 6. Search in attributes (product specifications)
      searchConditions.push({
        'attributes.name': { $regex: new RegExp(escapeRegex(searchTerm), 'i') }
      });
      
      searchConditions.push({
        'attributes.value': { $regex: new RegExp(escapeRegex(searchTerm), 'i') }
      });
      
      // Add search conditions to query
      if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    // ── Attribute filters ──────────────────────────────────────────────
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter_')) {
        const filterKey = key.replace('filter_', '');
        const filterValues = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
        
        if (filterValues.length > 0) {
          // Handle both single and multiple filter values
          if (filterValues.length === 1) {
            query[`attributes.${filterKey}`] = filterValues[0];
          } else {
            query[`attributes.${filterKey}`] = { $in: filterValues };
          }
        }
      }
    }

    // ── Load filter schema ─────────────────────────────────────────────
    let filterSchema = [];
    if (categorySlug) {
      try {
        const filterDoc = await CategoryFilter.findOne({ slug: categorySlug })
          .select('filterSchema')
          .lean();
        filterSchema = filterDoc?.filterSchema || [];
      } catch (err) {
        console.warn(`No filter schema for ${categorySlug}:`, err.message);
      }
    }

    // ── Build sort object ──────────────────────────────────────────────
    const sortObj = {};
    switch (sortBy) {
      case 'price':
        sortObj.price = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'title':
        sortObj.title = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'rating':
        sortObj.rating = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'views':
        sortObj.views = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'sold':
        sortObj.sold = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'createdAt':
      default:
        sortObj.createdAt = sortOrder === 'asc' ? 1 : -1;
        break;
    }

    // If search is present, add relevance-based sorting
    if (search && search.trim()) {
      // Primary sort by title relevance, then by createdAt
      sortObj.title = 1; // Alphabetical as secondary sort after text match
    }

    // ── Execute queries ────────────────────────────────────────────────
    const [products, total, categories] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .populate('storeCategoryId', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      Category.find({}).lean(),
    ]);

    // ── Highlight search terms in results ──────────────────────────────
    let highlightedProducts = products;
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const highlightRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      highlightedProducts = products.map(product => ({
        ...product,
        titleHighlighted: product.title ? product.title.replace(highlightRegex, '<mark>$1</mark>') : product.title,
        _searchMatch: true
      }));
    }

    return NextResponse.json({
      success: true,
      data: { 
        products: highlightedProducts, 
        categories, 
        filterSchema, 
        pagination: { 
          total, 
          totalPages: Math.ceil(total / limit), 
          page,
          limit,
          hasMore: page < Math.ceil(total / limit)
        },
        search: search ? {
          term: search,
          resultsFound: total
        } : null
      },
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