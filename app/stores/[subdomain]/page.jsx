import { notFound } from 'next/navigation';
import Storefront from '@/components/storefronts/Storefront';
import StoreThemeProvider from '@/components/storefronts/StoreThemeProvider';
import { storeDomain } from '@/lib/domain';

// Fetch the store + its products/services/categories from the dedicated,
// vendor-scoped storefront API (one round trip). This is the SAME public API the
// standalone template can call at runtime, so SSR and client stay consistent.
async function getStore(domain) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';

    const res = await fetch(`${baseUrl}/api/storefront?domain=${domain}`, {
      cache: 'no-store',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      }
    });

    if (!res.ok) {
      return null;
    }

    const result = await res.json();
    return result.success ? result.data : null;

  } catch (error) {
    console.error(`[Server Component] Fetch failed for ${domain}:`, error);
    return null;
  }
}

// ── Per-vendor SEO ──────────────────────────────────────────────────────────
// Give every storefront a proper, unique document <head> (title, description,
// canonical, Open Graph + Twitter cards, favicon from the logo). Search engines
// and social unfurls read THIS — the visible storefront renders in an iframe, so
// the head metadata (+ JSON-LD below) is what makes each vendor site indexable.
export async function generateMetadata({ params }) {
  const { subdomain } = await params;
  const domain = storeDomain(subdomain);
  const store  = await getStore(domain);

  if (!store) {
    return { title: 'Store not found', robots: { index: false, follow: false } };
  }

  const name        = store.title || 'Online Store';
  const title       = store.seoTitle || `${name} — Online Store`;
  const description = (store.seoDescription || store.description ||
    `Shop ${name} online — browse products and check out securely.`).slice(0, 160);
  const url    = `https://${store.domain || domain}`;
  const ogImg  = store.logo || store.banner || (store.bannerImages && store.bannerImages[0]) || null;
  const images = ogImg ? [ogImg] : [];

  return {
    title,
    description,
    applicationName: name,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, siteName: name, type: 'website',
      ...(images.length ? { images } : {}),
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title, description,
      ...(images.length ? { images } : {}),
    },
    ...(store.logo ? { icons: { icon: store.logo, apple: store.logo } } : {}),
    robots: { index: true, follow: true },
  };
}

// Store/Organization structured data — helps search engines understand the
// storefront and can enable rich results. Rendered as an inert JSON-LD script.
function buildStoreJsonLd(store, domain) {
  const url = `https://${store.domain || domain}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.title || 'Online Store',
    url,
  };
  if (store.description) ld.description = store.description;
  if (store.logo)       ld.logo = store.logo;
  if (store.logo || store.banner) ld.image = store.logo || store.banner;
  if (store.contact?.email) ld.email = store.contact.email;
  if (store.contact?.phone) ld.telephone = store.contact.phone;
  return ld;
}

export default async function SubdomainPage({ params }) {
  // NEXT.JS 15 FIX: You must 'await' the params object before destructuring it.
  const resolvedParams = await params;
  
  // 1. Extract the subdomain from the proxied URL
  const { subdomain } = resolvedParams;
  const domainToSearch = storeDomain(subdomain);


  // 2. Fetch the actual store data from your MongoDB
  const store = await getStore(domainToSearch);

  console.log('====store====', store);
  

  // 3. If no store matches that domain, immediately render the 404 Not Found page
  if (!store) {
    console.log(`[Server Component] ❌ Store NOT found. Forcing 404.`);
    notFound();
  }

  console.log(`[Server Component] ✅ Store loaded: ${store.title}`);

  // 4. Render the Storefront inside the vendor theme (CSS tokens) so the
  //    storefront — and the store-scoped product/cart/checkout pages — all match.
  return (
    <StoreThemeProvider store={store}>
      {/* Structured data for search engines (invisible). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStoreJsonLd(store, domainToSearch)) }}
      />
      {/* Crawlable heading + intro so the store name/description is in the SSR
          HTML even though the visual storefront renders inside an iframe. */}
      <h1 className="sr-only">{store.title}</h1>
      {store.description && <p className="sr-only">{store.description}</p>}
      <Storefront store={store} onBack={null} />
    </StoreThemeProvider>
  );
}