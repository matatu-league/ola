/**
 * ============================================================================
 * FILE: app/api/stores/collections/[id]/route.js
 * DESCRIPTION: Update (PUT) a specific store collection (e.g., toggling enabled)
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreCollection } from '@/models/Store';
import { getStoreId } from '@/lib/store-context';

// PUT: Update an existing store collection by ID
export async function PUT(req, { params }) {
  try {
    const storeId = await getStoreId();
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Unauthorized or store not found' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { enabled, name, description } = body;
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Collection ID is required in the URL' }, { status: 400 });
    }

    const updateData = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Ensure the collection actually belongs to this specific store using `storeId`
    const updatedCollection = await StoreCollection.findOneAndUpdate(
      { _id: id, storeId: storeId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCollection) {
      return NextResponse.json({ success: false, error: 'Collection not found or does not belong to this store' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCollection }, { status: 200 });
  } catch (error) {
    console.error("Store Collection API Error (PUT):", error);
    return NextResponse.json({ success: false, error: 'Failed to update collection' }, { status: 500 });
  }
}
