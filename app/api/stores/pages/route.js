import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { getActiveStore } from '@/lib/store-context';

// ── Vendor custom pages (About, FAQ, Shipping policy, …) ─────────────────────
// Managed from the dashboard "Pages" section; served publicly on the store's
// own domain at /page/<slug>. Scoped to the ACTIVE store (Host-resolved), so
// multi-store owners always edit the store they're currently managing.

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

export async function GET() {
  try {
    const store = await getActiveStore();
    if (!store) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: true, pages: store.pages || [] });
  } catch (error) {
    console.error('Store pages GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Create or update one page (upsert by slug).
export async function POST(request) {
  try {
    const store = await getActiveStore();
    if (!store) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body  = await request.json();
    const title = String(body.title || '').trim();
    const slug  = slugify(body.slug || title);
    if (!title || !slug) {
      return NextResponse.json({ success: false, message: 'A page needs a title.' }, { status: 400 });
    }

    const page = {
      title,
      slug,
      content:   String(body.content || ''),
      published: body.published !== false,
      updatedAt: new Date(),
    };

    const pages = Array.isArray(store.pages) ? [...store.pages] : [];
    const idx   = pages.findIndex((p) => p.slug === slug);
    if (idx >= 0) pages[idx] = { ...pages[idx], ...page };
    else pages.push(page);

    await Store.updateOne({ _id: store._id }, { $set: { pages } });
    return NextResponse.json({ success: true, page, pages });
  } catch (error) {
    console.error('Store pages POST error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const store = await getActiveStore();
    if (!store) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const slug = new URL(request.url).searchParams.get('slug');
    if (!slug) return NextResponse.json({ success: false, message: 'Missing slug' }, { status: 400 });

    const pages = (store.pages || []).filter((p) => p.slug !== slug);
    await Store.updateOne({ _id: store._id }, { $set: { pages } });
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Store pages DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
