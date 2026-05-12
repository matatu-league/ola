import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '../../../lib/mongodb';
import Store from '@/models/Store';

// Helper to get authenticated user ID from cookie
// FIX: Made this function async to properly await cookies() in Next.js 15
const getUserId = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  
  if (!sessionCookie) return null;
  
  try {
    const rawCookie = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    const sessionData = JSON.parse(decodeURIComponent(rawCookie));
    return sessionData.id;
  } catch (e) {
    return null;
  }
};

export async function GET() {
  try {
    // FIX: Await the new async helper function
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // FIX: Use your connectToDatabase import
    await connectToDatabase();
    
    const store = await Store.findOne({ owner: userId });

    return NextResponse.json({
      success: true,
      hasStore: !!store,
      store
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // FIX: Await the new async helper function
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // FIX: Use your connectToDatabase import
    await connectToDatabase();

    // Check if domain is already taken by another store
    const existingDomain = await Store.findOne({ domain: body.domain });
    if (existingDomain) {
      return NextResponse.json({ success: false, message: 'This domain is already taken. Please choose another.' }, { status: 400 });
    }

    // Create the new store
    const newStore = await Store.create({
      owner: userId,
      title: body.title,
      domain: body.domain,
      themeColor: body.themeColor,
      layoutStyle: body.layoutStyle,
      contact: {
        email: body.email,
        phone: body.phone
      }
    });

    return NextResponse.json({ success: true, store: newStore });

  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ success: false, message: 'Failed to create store' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// NEW: PUT Method to update store profile, theme, and features
// ----------------------------------------------------------------------
export async function PUT(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await connectToDatabase();

    // If they are trying to update the domain, ensure no one else is using it
    if (body.domain) {
      const existingDomain = await Store.findOne({ domain: body.domain, owner: { $ne: userId } });
      if (existingDomain) {
        return NextResponse.json({ success: false, message: 'That custom domain is already registered to another store.' }, { status: 400 });
      }
    }

    // Find the store belonging to this user and update it dynamically
    const updatedStore = await Store.findOneAndUpdate(
      { owner: userId },
      { $set: body }, // Dynamically updates whatever fields were sent (themeColor, layoutStyle, features.flashSales, etc.)
      { new: true, runValidators: true }
    );

    if (!updatedStore) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, store: updatedStore }, { status: 200 });
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json({ success: false, message: 'Failed to update store' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// NEW: DELETE Method just in case a seller wants to delete their store
// ----------------------------------------------------------------------
export async function DELETE(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const deletedStore = await Store.findOneAndDelete({ owner: userId });

    if (!deletedStore) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Store successfully deleted' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json({ success: false, message: 'Failed to delete store' }, { status: 500 });
  }
}