// GET /api/storefront/categories
// Vendor-scoped, public list of the store's catalogue categories (for nav).
import '@/models/Store';
import { findPublicStore, fetchStoreCategories, storefrontJson, storefrontPreflight } from '@/lib/storefront-api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const store = await findPublicStore(request);
    if (!store) {
      return storefrontJson({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const categories = await fetchStoreCategories(store);
    return storefrontJson({ success: true, data: { categories } });
  } catch (error) {
    console.error('[storefront/categories GET]', error);
    return storefrontJson({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export function OPTIONS() {
  return storefrontPreflight();
}
