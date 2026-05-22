import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Store from '@/models/Store'; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, name, email, avatar } = body; // 🔴 Removed phoneNumber

    if (!id || !email) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check if user already exists via Google ID or Email
    let user = await User.findOne({
      $or: [{ googleId: id }, { email: email }]
    });

    if (user) {
      // 2. Update existing user's Google ID, provider list
      const updates = {};
      let needsUpdate = false;

      if (!user.googleId) {
        updates.googleId = id;
        needsUpdate = true;
      }
      if (!user.authProviders.includes('google')) {
        updates.$addToSet = { authProviders: 'google' };
        needsUpdate = true;
      }

      if (needsUpdate) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }

    } else {
      // 3. Create a brand new user
      user = await User.create({
        googleId: id,
        email: email,
        displayName: name || 'Google User',
        avatarUrl: avatar || '',
        phoneNumber: '', // 🔴 Empty for now
        authProviders: ['google'],
        role: 'seller', 
        status: 'active'
      });
    }

    // 4. Check if this user already has a store attached to their Mongo ID
    const store = await Store.findOne({ userId: user._id });

    // 5. Return the true MongoDB _id AND phoneNumber so it can be cached in the session object
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id.toString(), 
        name: user.displayName,
        email: user.email,
        avatar: user.avatarUrl,
        phoneNumber: user.phoneNumber || null, 
        hasStore: !!store,
        storeDomain: store ? store.domain : null
      }
    });

  } catch (error) {
    console.error('Google auth sync error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}