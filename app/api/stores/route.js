import { NextResponse } from 'next/server';
// import { connectToDatabase } from '@/lib/mongodb';
import { connectToDatabase } from '../../lib/mongodb';
import Store from '@/models/Store';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Fetch all verified stores for the marketplace directory
    const stores = await Store.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: stores }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}