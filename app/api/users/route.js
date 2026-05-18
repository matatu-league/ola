import { NextResponse } from 'next/server';
import User from '@/models/User'; // Adjust this import path based on where you put the User model
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build query object
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users with sorting (newest first)
    const users = await User.find(query)
      .select('-__v') // Exclude version key
      .sort({ createdAt: -1 })
      .limit(50); // Pagination limit (can be made dynamic)

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const newUser = await User.create(body);
    
    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    // Handle Mongoose duplicate key errors gracefully
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Email or ID already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}