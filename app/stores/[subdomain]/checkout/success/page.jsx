/**
 * Store-scoped, theme-matched order confirmation.
 * Route: store.ola.ug/checkout/success?orderId=...
 * Mirrors app/checkout/success but rendered in the vendor theme (no system nav).
 */
import { notFound } from 'next/navigation';
import StoreThemeProvider from '@/components/storefronts/StoreThemeProvider';
import CheckoutSuccessClient from '@/components/checkout/CheckoutSuccessClient';
import { storeDomain } from '@/lib/domain';

async function fetchJson(path) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
    const res = await fetch(`${baseUrl}${path}`, {
      cache: 'no-store',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error(`[Store success] fetch failed for ${path}:`, err);
    return null;
  }
}

export default async function StoreCheckoutSuccessPage({ params, searchParams }) {
  const { subdomain } = await params;
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const [store, order] = await Promise.all([
    fetchJson(`/api/stores/lookup?domain=${storeDomain(subdomain)}`),
    fetchJson(`/api/orders/${orderId}`),
  ]);

  if (!order) notFound();

  return (
    <StoreThemeProvider store={store || {}}>
      <div style={{ minHeight: '100vh', background: 'var(--s-bg)' }}>
        <CheckoutSuccessClient order={order} />
      </div>
    </StoreThemeProvider>
  );
}
