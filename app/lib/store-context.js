import { cookies, headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { ROOT_DOMAIN, isMainHost } from '@/lib/domain';

/**
 * Multi-store resolution.
 *
 * A user may own up to 3 stores, each on its own subdomain (`<sub>.ola.ug`).
 * The *active* store is therefore identified by the request Host: dashboard
 * calls from `b.ola.ug` hit `b.ola.ug/api/...`, so the Host tells us which
 * store the owner is managing. We resolve by Host first, then fall back to the
 * session cookie's `domain`, then the user's first store — and always verify
 * the resolved store belongs to the signed-in user.
 */

// ── Session helpers (read straight from the user_session cookie) ─────────────
async function getSession() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('user_session')?.value;
    if (!raw) return null;
    let decoded = decodeURIComponent(raw).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[Store Context] Failed to parse session cookie:', error);
    return null;
  }
}

// The current request's store subdomain (`b.ola.ug`), or null on the main
// marketplace / localhost.
async function getHostDomain() {
  try {
    const h = await headers();
    const host = (h.get('host') || '').split(':')[0].toLowerCase();
    if (!host || isMainHost(host)) return null;
    return host.endsWith(`.${ROOT_DOMAIN}`) ? host : null;
  } catch {
    return null;
  }
}

/**
 * The full active Store document for the signed-in user, scoped to the current
 * subdomain when present. Always ownership-verified. Returns null if the user
 * has no stores.
 */
export async function getActiveStore() {
  const session = await getSession();
  const userId = session?.id;
  if (!userId) return null;

  await connectToDatabase();
  const ownerFilter = { $or: [{ userId }, { owner: userId }] };

  // Prefer the subdomain we're on; then the cookie's last-used domain.
  const domain = (await getHostDomain()) || session.domain || null;
  if (domain) {
    const scoped = await Store.findOne({ domain, ...ownerFilter }).lean();
    if (scoped) return scoped;
  }

  // Fallback: the user's first store.
  return Store.findOne(ownerFilter).sort({ createdAt: 1 }).lean();
}

/** Active store's id (string), or null. */
export async function getStoreId() {
  const store = await getActiveStore();
  return store ? store._id.toString() : null;
}

/** All stores owned by a user — for the dashboard store switcher. */
export async function getUserStores(userId) {
  if (!userId) return [];
  await connectToDatabase();
  return Store.find({ $or: [{ userId }, { owner: userId }] })
    .select('_id title domain logo businessType serviceType')
    .sort({ createdAt: 1 })
    .lean();
}

// Retained for backwards-compatibility (resolution is no longer cached, so this
// is a no-op). Kept so any existing imports don't break.
export function invalidateStoreCache() {}
