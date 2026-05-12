import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Store from '@/models/Store';

// Helper to securely get authenticated user ID from cookie
async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  
  if (!sessionCookie) return null;
  
  try {
    let decodedValue = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decodedValue.startsWith('%7B')) {
      decodedValue = decodeURIComponent(decodedValue);
    }
    const sessionData = JSON.parse(decodedValue);
    return sessionData.id;
  } catch (e) {
    console.error("Failed to parse session cookie:", e);
    return null;
  }
}

// ----------------------------------------------------------------------
// GET: Fetch the currently logged in user's profile
// ----------------------------------------------------------------------
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId).select('-__v'); 

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT: Update the currently logged in user's profile
// ----------------------------------------------------------------------
export async function PUT(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    // Prevent users from changing restricted fields like their tiktokId or Role directly
    delete body.tiktokId;
    delete body.role;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: body },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Delete the user account (and optionally their store)
// ----------------------------------------------------------------------
export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 2. Cascade Delete: Delete their store if it exists
    await Store.findOneAndDelete({ owner: userId });

    // Note: To be completely thorough, you would also delete all Products 
    // where owner === userId here, depending on your database design preferences.

    return NextResponse.json({ success: true, message: 'User account and associated store deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}