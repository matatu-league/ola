// app/api/services/route.js
// CRUD for a store's services. GET/POST here; PUT/DELETE in [id]/route.js.
// Scoped to the signed-in owner via the user_session cookie (same pattern as
// /api/products and /api/stores).
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import Store from '@/models/Store';

async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  if (!sessionCookie) return null;
  try {
    let decoded = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    return JSON.parse(decoded).id || null;
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
    return null;
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // Public listing for a storefront (by storeId) — otherwise the owner's own.
    let query;
    if (storeId) {
      query = { storeId, status: 'active' };
    } else {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      query = { userId };
    }

    const services = await Service.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('[Services GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    // Attach the owner's store + serviceType so the storefront can render the
    // right booking experience without an extra lookup.
    const store = await Store.findOne({ $or: [{ userId }, { owner: userId }] })
      .select('_id serviceType')
      .lean();

    const { _id, ...fields } = body; // never trust a client-supplied _id on create

    const service = await Service.create({
      ...fields,
      category:    body.category || null,
      userId,
      storeId:     store?._id || null,
      serviceType: body.serviceType || store?.serviceType || null,
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('[Services POST]', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create service' }, { status: 500 });
  }
}
