// app/products/page.jsx
// Handles:
//   /products                                → all products
//   /products?category=motorcycles-and-scooters → filtered by category

import { Suspense }            from 'react';
import TopNav                  from '@/components/shared/TopNav';
import CategoryListingView     from '@/components/marketplace/CategoryListingView';
import { Loader2 }             from 'lucide-react';

// ── Dynamic metadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ searchParams }) {
  const sp   = await searchParams;
  const slug = sp.category;

  if (!slug) {
    return {
      title:       'All Products | Ola.ug',
      description: 'Browse thousands of products from verified Ugandan suppliers.',
    };
  }

  // Capitalise slug for title: "skin-care" → "Skin Care"
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title:       `${name} | Ola.ug`,
    description: `Shop ${name} products from verified suppliers on Ola.ug.`,
    alternates:  {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/products?category=${slug}`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ProductsPage({ searchParams }) {
  const sp           = await searchParams;
  const categorySlug = sp.category || null;

  return (
    <main className="bg-white min-h-screen">
      <TopNav showSearch />
      <Suspense fallback={
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#8A8B91]" />
        </div>
      }>
        {/* Pass categorySlug as initialCategory so the component
            reads from the URL on mount */}
        <CategoryListingView initialCategory={categorySlug} />
      </Suspense>
    </main>
  );
}
