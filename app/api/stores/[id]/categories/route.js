/**
 * ============================================================================
 * FILE: app/api/stores/[id]/categories/route.js
 * DESCRIPTION: Fetch all categories or create a new category for a specific store.
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // Matching your import style
import { StoreCategory } from '@/models/Store';

// GET: Fetch all categories for a store
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams; // Extract Store ID directly from the URL path

    if (!id) {
      return NextResponse.json({ success: false, error: 'Store ID is required in the URL' }, { status: 400 });
    }

    const categories = await StoreCategory.find({ storeRef: id }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    console.error("Store Categories API Error (GET):", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST: Create a new category for a store
export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Store ID is required in the URL' }, { status: 400 });
    }

    const body = await req.json();
    const { name, image, parentRef } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newCategory = await StoreCategory.create({
      storeRef: id,
      name,
      slug,
      image: image || null,
      parentRef: parentRef || null
    });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Store Categories API Error (POST):", error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}
