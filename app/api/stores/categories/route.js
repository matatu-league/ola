import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import Store, { StoreCategory } from '@/models/Store';

// Helper to extract the authenticated User ID from the session cookie
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
// GET: Fetch store categories (For the logged-in merchant OR a public store)
// ----------------------------------------------------------------------
export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Check if the request is asking for a specific public store's categories
    const { searchParams } = new URL(request.url);
    const queryStoreId = searchParams.get('storeId');

    let storeIdToUse = queryStoreId;

    // If no explicit storeId is provided, assume it's the seller dashboard requesting its own categories
    if (!storeIdToUse) {
       const userId = await getUserId();
       if (!userId) {
           return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
       }
       
       // Find the store belonging to this user
       const store = await Store.findOne({ owner: userId }).lean();
       
       // If they haven't created a store yet, just return empty categories
       if (!store) {
           return NextResponse.json({ success: true, data: [] }, { status: 200 });
       }
       
       storeIdToUse = store._id;
    }

    // Fetch the categories linked to this store
    const categories = await StoreCategory.find({ storeRef: storeIdToUse })
      .sort({ name: 1 }) // Sort alphabetically
      .lean();
    
    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch store categories:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST: Create a new Store Category (Created on the fly by the merchant)
// ----------------------------------------------------------------------
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentRef, image } = body;

    if (!name || !name.trim()) {
        return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Ensure the merchant actually has a store to attach this category to
    const store = await Store.findOne({ owner: userId }).lean();
    
    if (!store) {
        return NextResponse.json({ success: false, message: 'You must set up your store profile first.' }, { status: 404 });
    }

    // Generate a URL-friendly slug (e.g., "Heavy Machinery" -> "heavy-machinery")
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if category already exists for this store to prevent duplicates
    const existingCategory = await StoreCategory.findOne({ storeRef: store._id, slug });
    if (existingCategory) {
        return NextResponse.json({ success: true, data: existingCategory }, { status: 200 });
    }

    // Create the custom category
    const newCategory = await StoreCategory.create({
      storeRef: store._id,
      name: name.trim(),
      slug,
      parentRef: parentRef || null,
      image: image || ''
    });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Failed to create store category:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}