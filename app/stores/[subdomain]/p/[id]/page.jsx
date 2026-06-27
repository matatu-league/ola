/**
 * Store-scoped, theme-matched product detail page.
 * Route: store.ola.ug/p/<productId>  (rewritten to /stores/<sub>/p/<id>)
 *
 * Server-rendered (good for SEO) and styled entirely from the vendor theme
 * tokens via <StoreThemeProvider> + var(--s-*), so it matches the storefront.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StoreThemeProvider from '@/components/storefronts/StoreThemeProvider';
import StoreAddToCart from '@/components/storefronts/StoreAddToCart';
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
    console.error(`[Store product page] fetch failed for ${path}:`, err);
    return null;
  }
}

export default async function StoreProductPage({ params }) {
  const { subdomain, id } = await params;

  const [store, product] = await Promise.all([
    fetchJson(`/api/stores/lookup?domain=${storeDomain(subdomain)}`),
    fetchJson(`/api/products/${id}`),
  ]);

  if (!product) notFound();

  const images = (product.images?.length ? product.images : [product.image]).filter(Boolean);
  const priceLabel = typeof product.price === 'string' ? product.price : `USh ${product.price}`;

  return (
    <StoreThemeProvider store={store || {}}>
      <div className="max-w-[1100px] mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-6"
          style={{ color: 'var(--s-muted)' }}
        >
          ← Back to {store?.title || 'store'}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div
              className="aspect-square overflow-hidden border"
              style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)', background: 'var(--s-surface)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {images[0] && <img src={images[0]} alt={product.title} className="w-full h-full object-cover" />}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 overflow-hidden border"
                    style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--s-text)' }}>
              {product.title}
            </h1>

            <p className="mt-3 text-2xl font-black" style={{ color: 'var(--s-primary)' }}>
              {priceLabel}
            </p>

            {product.moq && (
              <p className="mt-1 text-[13px]" style={{ color: 'var(--s-muted)' }}>
                Min. order: {product.moq}
              </p>
            )}

            {product.description && (
              <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--s-text)' }}>
                {product.description}
              </p>
            )}

            <div className="mt-7">
              <StoreAddToCart product={product} />
            </div>
          </div>
        </div>
      </div>
    </StoreThemeProvider>
  );
}
