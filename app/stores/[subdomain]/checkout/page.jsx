/**
 * Store-scoped, theme-matched checkout. Route: store.ola.ug/checkout
 *
 * Reuses the system CheckoutClient verbatim — structure and payment flow are
 * intact — rendered inside <StoreThemeProvider> so its (now token-based) colors,
 * radius and fonts follow the vendor theme.
 */
import StoreThemeProvider from '@/components/storefronts/StoreThemeProvider';
import CheckoutClient from '@/components/checkout/CheckoutClient';
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
    console.error('[Store checkout] store fetch failed:', err);
    return null;
  }
}

export default async function StoreCheckoutPage({ params }) {
  const { subdomain } = await params;
  const store = await getStore(subdomain);

  return (
    <StoreThemeProvider store={store || {}}>
      <div className="py-8" style={{ minHeight: '100vh', background: 'var(--s-bg)' }}>
        <CheckoutClient />
      </div>
    </StoreThemeProvider>
  );
}
