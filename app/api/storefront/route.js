// GET /api/storefront
// ────────────────────────────────────────────────────────────────────────────
// The single, vendor-scoped entry point a standalone storefront fetches to get
// EVERYTHING it needs in one round trip: the public store profile plus its
// products, services and categories. The store is resolved from the request
// Host (`<sub>.ola.ug`), with `?domain=` / `?storeId=` fallbacks for the builder
// preview and the main marketplace.
//
//   GET https://acme.ola.ug/api/storefront            → this store (by Host)
//   GET https://ola.ug/api/storefront?domain=acme     → explicit domain
//   GET https://ola.ug/api/storefront?storeId=<id>    → explicit id
//
// Granular siblings: /api/storefront/products|services|categories
import '@/models/Store';
import {
  findPublicStore, publicStoreShape, storeApiBase,
  fetchStoreProducts, fetchStoreServices, fetchStoreCategories,
  storefrontJson, storefrontPreflight,
} from '@/lib/storefront-api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const store = await findPublicStore(request);
    if (!store) {
      return storefrontJson({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const limit = parseInt(new URL(request.url).searchParams.get('limit'), 10) || 100;

    const [productsResult, services, categories] = await Promise.all([
      fetchStoreProducts(store, { limit }),
      fetchStoreServices(store),
      fetchStoreCategories(store),
    ]);

    return storefrontJson({
      success: true,
      data: {
        ...publicStoreShape(store),
        _id:     store._id.toString(),
        // Kept nested for components that read store.contact.*
        contact: { email: store.contact?.email || '', phone: store.contact?.phone || '' },
        apiBase: storeApiBase(store),
        products:   productsResult.products,
        pagination: productsResult.pagination,
        services,
        categories,
      },
    });
  } catch (error) {
    console.error('[storefront GET]', error);
    return storefrontJson({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export function OPTIONS() {
  return storefrontPreflight();
}
