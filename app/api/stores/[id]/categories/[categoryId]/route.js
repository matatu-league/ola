/**
 * ============================================================================
 * FILE: app/api/stores/categories/[categoryId]/route.js
 * DESCRIPTION: Update (PUT) or Delete (DELETE) a specific custom store category.
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreCategory } from '@/models/Store';

// PUT: Update an existing store category by ID
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, image, parentRef } = body;
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Store ID and Category ID are required in the URL' }, { status: 400 });
    }

    // Prevent a category from being its own parent
    if (id === parentRef) {
      return NextResponse.json({ success: false, error: 'A category cannot be its own parent' }, { status: 400 });
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (image !== undefined) updateData.image = image;
    if (parentRef !== undefined) updateData.parentRef = parentRef;

    // Ensure the category actually belongs to this specific store
    const updatedCategory = await StoreCategory.findOneAndUpdate(
      { _id: id, storeId: id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found or does not belong to this store' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCategory }, { status: 200 });
  } catch (error) {
    console.error("Store Category API Error (PUT):", error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE: Remove a specific store category by ID
export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Store ID is required in the URL' }, { status: 400 });
    }

    // Server-side safety check: Ensure it doesn't have subcategories
    const subcategories = await StoreCategory.find({ parentId: id, storeId: id });
    if (subcategories.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete this category because it contains subcategories. Please reassign or delete them first.' 
      }, { status: 400 });
    }

    // Find and delete, ensuring it belongs to the correct store
    const deletedCategory = await StoreCategory.findOneAndDelete({ _id: id, storeId: id });

    if (!deletedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found or does not belong to this store' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedCategory }, { status: 200 });
  } catch (error) {
    console.error("Store Category API Error (DELETE):", error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}
