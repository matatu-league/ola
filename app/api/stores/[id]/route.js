import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const storeid = resolvedParams.id || resolvedParams.storeid;

    console.log("API GET /api/stores/[storeid] - Searching for ID:", storeid);

    const store = await Store.findById(storeid);

    if (!store) {
      console.log("Store not found in database for ID:", storeid);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      layoutStyle: store.layoutStyle || 'Classic',
      themeColor: store.themeColor || '#161823',
      flashSales: store.features?.flashSales || false,
      themeTemplate: store.themeTemplate || null,
      title: store.title,
      logo: store.logo
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch store theme:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const storeid = resolvedParams.id || resolvedParams.storeid;

    console.log("API PUT /api/stores/[storeid] - Updating ID:", storeid);

    // --- Auth check: only the store owner can update theme ---
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/user_session=([^;]+)/);

    if (!sessionMatch) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionMatch[1]));
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const store = await Store.findById(storeid);

    if (!store) {
      console.log("Store not found for PUT update for ID:", storeid);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify the requesting user actually owns this store
    if (store.userId.toString() !== session.id) {
      console.warn(`Forbidden PUT attempt: user ${session.id} tried to update store ${storeid}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // ---------------------------------------------------------

    const body = await request.json();
    const { layoutStyle, themeColor, flashSales, themeTemplate } = body;

    if (layoutStyle !== undefined) {
      store.layoutStyle = layoutStyle;
    }

    if (themeColor !== undefined) {
      store.themeColor = themeColor;
    }

    if (themeTemplate !== undefined) {
      store.themeTemplate = themeTemplate;
    }

    if (flashSales !== undefined) {
      if (!store.features) store.features = {};
      store.features.flashSales = flashSales;
    }

    await store.save();

    console.log("Successfully updated store theme for ID:", storeid);

    return NextResponse.json(
      { message: 'Theme updated successfully', store },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to update store theme:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}