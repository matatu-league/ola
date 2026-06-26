/**
 * ============================================================================
 * FILE: app/api/stores/[id]/categories/route.js
 * DESCRIPTION: Fetch all categories or create a new category for a specific store.
 * NOTE: Now secured using the server-side cookie context via getStoreId()
 * VERSION: Optimized with MongoDB Aggregation for product counts
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; 
import { StoreCategory } from '@/models/Store';
import { getStoreId } from '@/lib/store-context';
import mongoose from 'mongoose';

// GET: Fetch all categories for a store with product counts using aggregation
export async function GET(req) {
  try {
    // Securely get the store ID from the cookie context instead of URL params
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or store not found' }, 
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    
    // Use aggregation pipeline to get categories with product counts
    // The Product model has storeCategoryId that references StoreCategory
    const categoriesWithCounts = await StoreCategory.aggregate([
      // Step 1: Filter categories for this store only
      {
        $match: { 
          storeId: storeObjectId 
        }
      },
      
      // Step 2: Left join with products collection
      // Product.storeCategoryId references StoreCategory._id
      {
        $lookup: {
          from: 'products', // MongoDB collection name (lowercase, pluralized 'Product' -> 'products')
          localField: '_id', // StoreCategory._id
          foreignField: 'storeCategoryId', // Product.storeCategoryId
          as: 'products'
        }
      },
      
      // Step 3: Count only active products for each category
      {
        $addFields: {
          productCount: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'active'] }
              }
            }
          },
          // Also count total products (including drafts/archived)
          totalProductCount: {
            $size: '$products'
          },
          // Count products by status
          activeProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'active'] }
              }
            }
          },
          draftProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'draft'] }
              }
            }
          },
          archivedProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'archived'] }
              }
            }
          }
        }
      },
      
      // Step 4: Remove the full products array from response (we only need counts)
      {
        $project: {
          products: 0 // Don't send full product data
        }
      },
      
      // Step 5: Sort by creation date (newest first)
      {
        $sort: { 
          createdAt: -1 
        }
      }
    ]);
    
    return NextResponse.json(
      { 
        success: true, 
        data: categoriesWithCounts,
        count: categoriesWithCounts.length
      }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Store Categories API Error (GET):", error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' }, 
      { status: 500 }
    );
  }
}

// POST: Create a new category for a store
export async function POST(req) {
  try {
    // Securely get the store ID from the cookie context
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or store not found' }, 
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { name, image, parentCategory } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' }, 
        { status: 400 }
      );
    }

    // Check for duplicate category name
    const existingCategory = await StoreCategory.findOne({
      storeId: storeId,
      name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive check
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' }, 
        { status: 409 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newCategory = await StoreCategory.create({
      storeId, // Bind the new category strictly to the authenticated store
      name,
      slug,
      image: image || null,
      parentId: parentCategory || null
    });

    // Convert to plain object and add product counts (all 0 for new category)
    const categoryObj = newCategory.toObject();
    categoryObj.productCount = 0;
    categoryObj.totalProductCount = 0;
    categoryObj.activeProducts = 0;
    categoryObj.draftProducts = 0;
    categoryObj.archivedProducts = 0;

    return NextResponse.json(
      { success: true, data: categoryObj }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Store Categories API Error (POST):", error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' }, 
      { status: 500 }
    );
  }
}

// PUT: Update a category
export async function PUT(req) {
  try {
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or store not found' }, 
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const body = await req.json();
    const { categoryId, name, image, parentCategory } = body;

    if (!categoryId || !name) {
      return NextResponse.json(
        { success: false, error: 'Category ID and name are required' }, 
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check for duplicate name (excluding current category)
    const duplicateCategory = await StoreCategory.findOne({
      storeId: storeId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: categoryId }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' }, 
        { status: 409 }
      );
    }

    const updatedCategory = await StoreCategory.findOneAndUpdate(
      {
        _id: categoryId,
        storeId: storeId // Ensure category belongs to this store
      },
      {
        name,
        slug,
        image: image || null,
        parentId: parentCategory || null
      },
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found or unauthorized' }, 
        { status: 404 }
      );
    }

    // Get product counts using aggregation for the updated category
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
    
    const [categoryWithCounts] = await StoreCategory.aggregate([
      {
        $match: { 
          _id: categoryObjectId,
          storeId: storeObjectId 
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'storeCategoryId',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'active'] }
              }
            }
          },
          totalProductCount: { $size: '$products' },
          activeProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'active'] }
              }
            }
          },
          draftProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'draft'] }
              }
            }
          },
          archivedProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.status', 'archived'] }
              }
            }
          }
        }
      },
      {
        $project: {
          products: 0
        }
      }
    ]);

    return NextResponse.json(
      { success: true, data: categoryWithCounts }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Store Categories API Error (PUT):", error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' }, 
      { status: 500 }
    );
  }
}

// DELETE: Delete a category
export async function DELETE(req) {
  try {
    const storeId = await getStoreId();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or store not found' }, 
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' }, 
        { status: 400 }
      );
    }

    // Check if category has products before deleting
    const productCount = await mongoose.model('Product').countDocuments({
      storeId: storeId,
      storeCategoryId: categoryId
    });

    if (productCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${productCount} products. Remove or reassign products first.` 
        }, 
        { status: 400 }
      );
    }

    const deletedCategory = await StoreCategory.findOneAndDelete({
      _id: categoryId,
      storeId: storeId // Ensure category belongs to this store
    });

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found or unauthorized' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Category deleted successfully' }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Store Categories API Error (DELETE):", error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' }, 
      { status: 500 }
    );
  }
}