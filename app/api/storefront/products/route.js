// GET /api/storefront/products
// Vendor-scoped, public, paginated product list for a standalone storefront.
//   ?limit (default 24) ?page ?q=<search> ?category=<storeCategoryId>
import '@/models/Store';
import { findPublicStore, fetchStoreProducts, storefrontJson, storefrontPreflight } from '@/lib/storefront-api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const store = await findPublicStore(request);
    if (!store) {
      return storefrontJson({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const sp = new URL(request.url).searchParams;
    const result = await fetchStoreProducts(store, {
      limit:    parseInt(sp.get('limit'), 10) || 24,
      page:     parseInt(sp.get('page'), 10) || 1,
      q:        sp.get('q') || '',
      category: sp.get('category') || '',
    });

    return storefrontJson({ success: true, data: result });
  } catch (error) {
    console.error('[storefront/products GET]', error);
    return storefrontJson({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export function OPTIONS() {
  return storefrontPreflight();
}
