import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { storeDomain } from '@/lib/domain';

// ── Public vendor page (/page/<slug> on the store's own domain) ──────────────
// Renders a published custom page (About, FAQ, policies, …) authored from the
// dashboard "Pages" section. Server-rendered → indexable, and linkable from the
// generated storefront's footer.

async function getStorePage(subdomain, slug) {
  try {
    await connectToDatabase();
    const store = await Store.findOne({ domain: storeDomain(subdomain) })
      .select('title domain logo themeColor pages')
      .lean();
    if (!store) return { store: null, page: null };
    const page = (store.pages || []).find((p) => p.slug === slug && p.published !== false) || null;
    return { store, page };
  } catch (error) {
    console.error('[Store page] load failed:', error);
    return { store: null, page: null };
  }
}

export async function generateMetadata({ params }) {
  const { subdomain, slug } = await params;
  const { store, page } = await getStorePage(subdomain, slug);
  if (!store || !page) return { title: 'Page not found', robots: { index: false, follow: false } };
  return {
    title: `${page.title} — ${store.title}`,
    description: (page.content || '').slice(0, 160),
    ...(store.logo ? { icons: { icon: store.logo } } : {}),
  };
}

export default async function VendorPage({ params }) {
  const { subdomain, slug } = await params;
  const { store, page } = await getStorePage(subdomain, slug);
  if (!store || !page) notFound();

  const accent = store.themeColor || '#161823';
  // Blank lines separate paragraphs; single newlines stay as line breaks.
  const paragraphs = String(page.content || '').split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-[760px] mx-auto px-5 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            {store.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logo} alt={store.title} className="w-8 h-8 object-cover rounded" />
            ) : (
              <span
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-black"
                style={{ backgroundColor: accent }}
              >
                {store.title?.charAt(0) || 'S'}
              </span>
            )}
            <span className="font-bold text-gray-900 group-hover:opacity-70 transition-opacity">
              {store.title}
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-85"
            style={{ backgroundColor: accent }}
          >
            Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-8">
          {page.title}
        </h1>
        {paragraphs.length ? (
          <div className="space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[15.5px] leading-relaxed text-gray-700 whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">This page has no content yet.</p>
        )}
      </main>
    </div>
  );
}
