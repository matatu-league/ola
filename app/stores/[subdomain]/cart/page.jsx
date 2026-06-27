/**
 * Store-scoped, theme-matched cart. Route: store.ola.ug/cart
 * Single-vendor: shows only this store's items, themed via vendor tokens.
 */
import StoreThemeProvider from '@/components/storefronts/StoreThemeProvider';
import StoreCart from '@/components/storefronts/StoreCart';
import { storeDomain } from '@/lib/domain';

async function getStore(subdomain) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
    const res = await fetch(`${baseUrl}/api/stores/lookup?domain=${storeDomain(subdomain)}`, {
      cache: 'no-store',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error('[Store cart] store fetch failed:', err);
    return null;
  }
}

export default async function StoreCartPage({ params }) {
  const { subdomain } = await params;
  const store = await getStore(subdomain);

  return (
    <StoreThemeProvider store={store || {}}>
      <StoreCart storeId={store?._id} storeTitle={store?.title} />
    </StoreThemeProvider>
  );
}
