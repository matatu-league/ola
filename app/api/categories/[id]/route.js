import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MarketplaceCategory } from '@/models/Marketplace';

// PUT: Update an existing category by ID
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, slug, status, parentRef } = body;
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams; // Extract ID directly from the URL path

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required in the URL' }, { status: 400 });
    }

    // Prevent a category from being its own parent
    if (id === parentRef) {
      return NextResponse.json({ success: false, error: 'A category cannot be its own parent' }, { status: 400 });
    }

    // Check slug uniqueness excluding current document
    if (slug) {
      const slugExists = await MarketplaceCategory.findOne({ slug, _id: { $ne: id } });
      if (slugExists) {
        return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 400 });
      }
    }

    const updatedCategory = await MarketplaceCategory.findByIdAndUpdate(
      id,
      { name, slug, status, parentRef: parentRef || null },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCategory }, { status: 200 });
  } catch (error) {
    console.error("Categories API Error (PUT):", error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE: Remove a category by ID
export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams; // Extract ID directly from the URL path

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required in the URL' }, { status: 400 });
    }

    // Server-side safety check: Ensure it doesn't have subcategories
    const subcategories = await MarketplaceCategory.find({ parentRef: id });
    if (subcategories.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete this category because it contains subcategories. Please reassign or delete them first.' 
      }, { status: 400 });
    }

    const deletedCategory = await MarketplaceCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedCategory }, { status: 200 });
  } catch (error) {
    console.error("Categories API Error (DELETE):", error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}