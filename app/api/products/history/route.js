// app/api/products/history/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductView } from '@/models/Marketplace';
import { getViewer } from '@/lib/getViewer';
import '@/models/Marketplace'; // ensure Product is registered for populate

export async function GET(request) {
  try {
    await connectToDatabase();

    const viewer = await getViewer();
    if (!viewer.userId && !viewer.sessionId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50);

    const filter = viewer.userId
      ? { user: viewer.userId }
      : { sessionId: viewer.sessionId };

    const history = await ProductView.find(filter)
      .sort({ lastViewedAt: -1 })
      .limit(limit)
      .populate({
        path:   'product',
        select: 'title price moq image images storeId rating status',
      })
      .lean();

    // Drop rows whose product was deleted; flatten + attach view metadata.
    const data = history
      .filter((h) => h.product)
      .map((h) => ({
        ...h.product,
        viewedAt:  h.lastViewedAt,
        viewCount: h.viewCount,
      }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Product History GET]', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 },
    );
  }
}

// Optional: let users clear their history
export async function DELETE() {
  try {
    await connectToDatabase();
    const viewer = await getViewer();
    if (!viewer.userId && !viewer.sessionId) {
      return NextResponse.json({ success: true, message: 'Nothing to clear' });
    }
    const filter = viewer.userId ? { user: viewer.userId } : { sessionId: viewer.sessionId };
    await ProductView.deleteMany(filter);
    return NextResponse.json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('[Product History DELETE]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}