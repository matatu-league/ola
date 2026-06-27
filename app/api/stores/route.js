import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { Category } from '@/models/Marketplace';
import { cookies } from 'next/headers';

const getUserId = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  if (!sessionCookie) return null;

  try {
    let decoded = decodeURIComponent(sessionCookie);
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    decoded = decoded.replace(/^"|"$/g, '');
    return JSON.parse(decoded).id || null;
  } catch (e) {
    console.error('Failed to parse user_session cookie:', e);
    return null;
  }
};

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const store = await Store.findOne({ $or: [{ userId }, { owner: userId }] });

    return NextResponse.json({ success: true, hasStore: !!store, store });
  } catch (error) {
    console.error('Store GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const existingStore = await Store.findOne({ $or: [{ userId }, { owner: userId }] });
    if (existingStore) {
      return NextResponse.json({ success: false, message: 'You already have a store.' }, { status: 400 });
    }

    const existingDomain = await Store.findOne({ domain: body.domain });
    if (existingDomain) {
      return NextResponse.json({ success: false, message: 'This domain is already taken.' }, { status: 400 });
    }

    // Resolve the chosen category so the store's mode (products/services/both)
    // and serviceType are authoritative server-side, not just trusted from the
    // client. The selected DB category is the single source of truth.
    let category = null;
    if (body.categoryId) {
      category = await Category.findById(body.categoryId).select('name kind serviceType').lean();
    }

    // Derive businessType from the category's kind; a category marked 'service'
    // that also sells items ("I also sell items" checkbox) is promoted to 'both'.
    let businessType = category?.kind ?? body.businessType ?? 'products';
    if (businessType === 'service') businessType = 'services';
    if (category?.kind === 'service' && body.alsoSellsItems) businessType = 'both';

    const newStore = await Store.create({
      userId,
      owner:        userId,
      title:        body.title,
      domain:       body.domain,
      industry:     category?.name || body.industry || 'General',
      businessType,
      serviceType:  category?.serviceType ?? null,
      categories:   body.categoryId ? [body.categoryId] : [],
      themeColor:   body.themeColor  || '#161823',
      layoutStyle:  body.layoutStyle || 'Classic',
      contact: {
        email: body.email,
        phone: body.phone,
      },
    });

    return NextResponse.json({ success: true, store: newStore });
  } catch (error) {
    console.error('Store POST error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create store' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const updatedStore = await Store.findOneAndUpdate(
      { $or: [{ userId }, { owner: userId }] },
      { $set: body },
      { new: true, runValidators: true },
    );

    if (!updatedStore) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, store: updatedStore });
  } catch (error) {
    console.error('Store PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update store' }, { status: 500 });
  }
}