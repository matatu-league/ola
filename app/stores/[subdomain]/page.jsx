import { notFound } from 'next/navigation';
import Storefront from '@/components/storefronts/Storefront';
import StoreThemeProvider from '@/components/storefronts/StoreThemeProvider';
import { storeDomain } from '@/lib/domain';

// Helper function to fetch the store securely on the server
async function getStore(domain) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
    
    const res = await fetch(`${baseUrl}/api/stores/lookup?domain=${domain}`, {
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
      <Storefront store={store} onBack={null} />
    </StoreThemeProvider>
  );
}