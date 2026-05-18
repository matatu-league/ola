import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';

export async function PATCH(request, context) {
  try {
    await connectToDatabase();
    
    // Safely resolve params for Next.js 13, 14, and 15
    const params = await context.params;
    const id = params.id;
    
    const body = await request.json();

    // Allow updating status, name, description
    const allowedUpdates = ['status', 'name', 'description', 'contactEmail', 'contactPhone'];
    const updates = {};
    
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    console.log(`[PATCH API] Updating Store ${id} with:`, updates);

    if (Object.keys(updates).length === 0) {
       return NextResponse.json({ success: false, error: 'No valid fields provided to update' }, { status: 400 });
    }

    const updatedStore = await Store.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedStore) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, store: updatedStore }, { status: 200 });
  } catch (error) {
    console.error('[PATCH API] Error updating store:', error);
    return NextResponse.json({ success: false, error: 'Failed to update store', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await connectToDatabase();
    
    const params = await context.params;
    const id = params.id;

    console.log(`[DELETE API] Attempting to delete Store ${id}`);

    const deletedStore = await Store.findByIdAndDelete(id);

    if (!deletedStore) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Store deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE API] Error deleting store:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete store' }, { status: 500 });
  }
}