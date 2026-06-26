// app/categories/[slug]/page.jsx
// Server component — fetches category data server-side for SEO metadata.
// URL pattern: /categories/teaching-jobs, /categories/phones, etc.

import { notFound }          from 'next/navigation';
import TopNav                from '@/components/shared/TopNav';
import CategoryPageClient    from '@/components/marketplace/CategoryPageClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ── Fetch category data ───────────────────────────────────────────────────────
async function getCategoryData(slug, searchParams = {}) {
  const qs = new URLSearchParams({
    page:  searchParams.page  || '1',
    limit: searchParams.limit || '24',
    sort:  searchParams.sort  || 'newest',
  });

  const res = await fetch(`${BASE_URL}/api/categories/${slug}?${qs}`, {
    cache: 'no-store', // Always fresh — products change
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.success ? json.data : null;
}

// ── Dynamic metadata for SEO ──────────────────────────────────────────────────
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const data     = await getCategoryData(slug);

  if (!data) {
    return {
      title:       'Category Not Found | Ola.ug',
      description: 'This category could not be found.',
    };
  }

  const { category, total } = data;
  const productCount = data.pagination?.total || 0;

  return {
    title:       `${category.name} | Ola.ug — ${productCount.toLocaleString()} products`,
    description: category.description || `Shop ${productCount.toLocaleString()} ${category.name} products on Ola.ug. Find the best deals from verified Ugandan suppliers.`,
    openGraph: {
      title:  `${category.name} on Ola.ug`,
      images: category.image ? [{ url: category.image }] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/categories/${slug}`,
    },
  };
}

// ── Page component ────────────────────────────────────────────────────────────
export default async function CategoryPage({ params, searchParams }) {
  const { slug }   = await params;
  const resolvedSP = await searchParams;
  const data       = await getCategoryData(slug, resolvedSP);

  if (!data) notFound();

  return (
    <main className="bg-[#F8F8F8] min-h-screen">
      <TopNav showSearch />
      <CategoryPageClient initialData={data} slug={slug} />
    </main>
  );
}