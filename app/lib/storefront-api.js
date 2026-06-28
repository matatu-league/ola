// ─── Public storefront API helpers ──────────────────────────────────────────
//
// A vendor's standalone storefront (the AI-generated template) is served from
// its own subdomain — `<sub>.ola.ug`. Because `proxy.js` deliberately does NOT
// rewrite `/api/*`, a request to `<sub>.ola.ug/api/storefront` reaches the
// global route handler with the vendor's Host header intact. These helpers
// resolve WHICH store a public request is for (by Host, with `?domain` / `?storeId`
// query fallbacks for the builder preview and the main marketplace), without
// requiring authentication — storefront reads are public.
//
// Everything here is read-only and safe to cache at the edge.

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Store from '@/models/Store';
import { Category, Product } from '@/models/Marketplace';
import Service from '@/models/Service';
import { ROOT_DOMAIN, isMainHost, normalizeStoreDomain } from '@/lib/domain';

// ── CORS / cache ─────────────────────────────────────────────────────────────
// Storefront reads are public, so allow cross-origin GETs (e.g. a template
// embedded elsewhere) and let the CDN serve them with a short, self-refreshing TTL.
export const STOREFRONT_CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning',
};

/** Build a cached, CORS-enabled JSON response. */
export function storefrontJson(body, { status = 200, sMaxAge = 30, swr = 300 } = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...STOREFRONT_CORS,
      'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
    },
  });
}

/** Standard CORS preflight handler — re-export as `OPTIONS` from each route. */
export function storefrontPreflight() {
  return new Response(null, { status: 204, headers: STOREFRONT_CORS });
}

// ── Store resolution ───────────────────────────────────────────────────────--
/**
 * The store domain a public request targets: the request Host subdomain first
 * (`acme.ola.ug`), then an explicit `?domain=` query, normalised to a FQDN.
 * Returns null on the main marketplace / localhost with no override.
 */
function resolveDomain(request) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  if (host && !isMainHost(host) && host.endsWith(`.${ROOT_DOMAIN}`)) return host;

  const qDomain = new URL(request.url).searchParams.get('domain');
  if (qDomain) return normalizeStoreDomain(qDomain.toLowerCase().trim());

  return null;
}

/**
 * Resolve the public Store document for a request (by Host/`?domain`, or an
 * explicit `?storeId`). No auth — storefront reads are public. Returns null if
 * the store can't be determined or doesn't exist.
 */
export async function findPublicStore(request) {
  await connectToDatabase();

  const storeId = new URL(request.url).searchParams.get('storeId');
  if (storeId) {
    try { return await Store.findById(storeId).lean(); } catch { return null; }
  }

  const domain = resolveDomain(request);
  if (!domain) return null;
  return Store.findOne({ domain }).lean();
}

// ── Public projections (never leak owner/internal fields) ─────────────────────
/** Public-safe subset of a Store document. */
export function publicStoreShape(store) {
  if (!store) return null;
  return {
    id:           store._id?.toString(),
    title:        store.title || '',
    domain:       store.domain || '',
    description:  store.description || '',
    logo:         store.logo || '',
    banner:       store.banner || (store.bannerImages && store.bannerImages[0]) || '',
    themeColor:   store.themeColor || '#161823',
    themeMode:    store.themeMode || 'light',
    theme:        store.theme || null,          // structured design tokens (StoreThemeProvider)
    layoutStyle:  store.layoutStyle || 'Classic',
    themeTemplate: store.themeTemplate || null,
    businessType: store.businessType || 'products',
    serviceType:  store.serviceType || null,
    contactEmail: store.contact?.email || '',
    contactPhone: store.contact?.phone || '',
    flashSales:   store.features?.flashSales || false,
  };
}

/** Normalise a Product into the storefront contract `{ id, name, price, image, category }`. */
export function formatProduct(p) {
  let price = 0;
  if (typeof p.price === 'number') price = p.price;
  else if (typeof p.price === 'string') price = parseFloat(p.price.replace(/[^0-9.-]+/g, '')) || 0;

  return {
    id:       (p._id || p.id || '').toString(),
    name:     p.title || p.name || '',
    price:    Number.isNaN(price) ? 0 : price,
    image:    p.image || p.images?.[0] || '',
    category: p.storeCategoryId?.name || p.categoryId?.name || null,
  };
}

/** Normalise a Service into the storefront contract `{ id, name, price, image, duration, category }`. */
export function formatService(s) {
  return {
    id:       (s._id || s.id || '').toString(),
    name:     s.title || s.name || '',
    price:    s.price ?? '',
    image:    s.image || s.images?.[0] || '',
    duration: s.durationMinutes ? `${s.durationMinutes} min` : (s.duration || ''),
    category: s.category?.name || null,
  };
}

// ── Data fetchers (scoped to a resolved store) ───────────────────────────────-
/** Active products for a store, formatted and paginated. */
export async function fetchStoreProducts(store, { limit = 100, page = 1, q = '', category = '' } = {}) {
  const query = { storeId: store._id, status: 'active' };
  if (category) query.storeCategoryId = category;
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: rx }, { description: rx }];
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [docs, total] = await Promise.all([
    Product.find(query)
      .populate('categoryId', 'name')
      .populate('storeCategoryId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products:   docs.map(formatProduct),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasMore: skip + docs.length < total },
  };
}

/** Active services for a store, formatted. */
export async function fetchStoreServices(store) {
  const docs = await Service.find({ storeId: store._id, status: 'active' })
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(formatService);
}

/**
 * Distinct store-categories present in a store's catalogue — handy for nav.
 * Falls back to the store's own `categories` field, then the global category
 * names referenced by its products.
 */
export async function fetchStoreCategories(store) {
  if (Array.isArray(store.categories) && store.categories.length) {
    return store.categories.map(c => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
  }

  const docs = await Product.find({ storeId: store._id, status: 'active' })
    .populate('storeCategoryId', 'name')
    .populate('categoryId', 'name')
    .select('storeCategoryId categoryId')
    .lean();

  const names = new Set();
  for (const p of docs) {
    const name = p.storeCategoryId?.name || p.categoryId?.name;
    if (name) names.add(name);
  }
  return [...names];
}

/** The absolute storefront API base for a store (so a standalone template can self-fetch). */
export function storeApiBase(store) {
  const domain = store?.domain || '';
  if (!domain) return '/api/storefront';
  const proto = domain.includes('localhost') ? 'http://' : 'https://';
  return `${proto}${domain}/api/storefront`;
}

// Touch Category so its model is registered when this module is the entry point
// (populate on storeCategoryId/categoryId relies on the Category schema existing).
void Category;
