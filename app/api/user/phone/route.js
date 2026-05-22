import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const { userId, phoneNumber } = await request.json();

    if (!userId || !phoneNumber) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Update the user's document with the provided phone number
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { phoneNumber: phoneNumber },
      { new: true }
    );

    if (!updatedUser) {
       return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, phoneNumber: updatedUser.phoneNumber });

  } catch (error) {
    console.error('Update phone number error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}