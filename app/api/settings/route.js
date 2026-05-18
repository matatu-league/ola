import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Look for the single global settings document
    let settings = await Settings.findOne({ isGlobal: true }).lean();
    
    // If it doesn't exist yet, Mongoose will create it using the defaults in the Schema
    if (!settings) {
      const newSettings = await Settings.create({ isGlobal: true });
      settings = newSettings.toObject();
    }
    
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error('[Settings API - GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Security: Prevent updating the singleton identifier or ID
    delete body._id;
    delete body.isGlobal;

    // Update the global document, or insert it if it somehow doesn't exist
    const updatedSettings = await Settings.findOneAndUpdate(
      { isGlobal: true },
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({ success: true, settings: updatedSettings }, { status: 200 });
  } catch (error) {
    console.error('[Settings API - PATCH] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}