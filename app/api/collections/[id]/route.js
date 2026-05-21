import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { StoreCollection } from '@/models/Store';
import { getStoreId } from '@/lib/store-context';

export async function PUT(request, { params }) {
  try {
    const { subdomain, id } = params;
    
    const storeId = await getStoreId(subdomain);
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // We strictly only allow toggling the 'enabled' state from this route
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid state provided' }, { status: 400 });
    }

    await connectToDatabase();

    // Ensure we only update if it belongs to this store
    const updatedCollection = await StoreCollection.findOneAndUpdate(
      { _id: id, storeId },
      { $set: { enabled: body.enabled } },
      { new: true }
    );

    if (!updatedCollection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCollection });
  } catch (error) {
    console.error('Error toggling collection:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}