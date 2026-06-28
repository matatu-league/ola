// GET /api/storefront/services
// Vendor-scoped, public list of a store's active services.
import '@/models/Store';
import { findPublicStore, fetchStoreServices, storefrontJson, storefrontPreflight } from '@/lib/storefront-api';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const store = await findPublicStore(request);
    if (!store) {
      return storefrontJson({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const services = await fetchStoreServices(store);
    return storefrontJson({ success: true, data: { services } });
  } catch (error) {
    console.error('[storefront/services GET]', error);
    return storefrontJson({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export function OPTIONS() {
  return storefrontPreflight();
}
