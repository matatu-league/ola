// app/api/services/[id]/route.js
// Update / delete a single service. Owner-scoped via the user_session cookie.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';

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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    // Strip immutable / ownership fields so they can't be reassigned.
    const { _id, userId: _u, storeId: _s, ...updates } = body;

    const service = await Service.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('[Services PUT]', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const deleted = await Service.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Services DELETE]', error);
    return NextResponse.json({ success: false, message: 'Failed to delete service' }, { status: 500 });
  }
}
