/**
 * ============================================================================
 * FILE: app/api/stores/[id]/collection/[collectionId]/route.js
 * DESCRIPTION: Update (PUT) a specific smart collection (e.g. toggle enabled).
 * NOTE: If your folder is named "collections" instead of "collection", 
 * simply adjust the path accordingly.
 * ============================================================================
 */
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreCollection } from '@/models/Store';

// PUT: Update an existing smart collection (Toggle on/off, change details)
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { enabled, name, description, color, icon } = body;
    
    // FIX: Await the params object (Required in Next.js 15+)
    const resolvedParams = await params;
    const { id, collectionId } = resolvedParams;

    if (!id || !collectionId) {
      return NextResponse.json({ success: false, error: 'Store ID and Collection ID are required in the URL' }, { status: 400 });
    }

    const updateData = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    // Ensure the collection belongs to the specific store before updating
    const updatedCollection = await StoreCollection.findOneAndUpdate(
      { _id: collectionId, storeRef: id },
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