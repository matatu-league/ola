/**
 * ============================================================================
 * FILE: app/lib/domain.js
 * ----------------------------------------------------------------------------
 * Single source of truth for the multi-tenant "store-per-subdomain" model.
 *
 * Each store is accessed on its own full domain (e.g. `acme.ola.ug`). The
 * `proxy.js` middleware rewrites `acme.ola.ug/<path>` → `/stores/acme/<path>`.
 * The browser-side layout and pages need to derive the root domain, normalize
 * store domains, and read the signed-in user from the session cookie.
 *
 * These helpers were previously copy-pasted (and had quietly diverged) across
 * the store layout, storefront page, profile, messages and onboarding screens.
 * Centralizing them here keeps behavior consistent and makes the root domain
 * configurable via NEXT_PUBLIC_ROOT_DOMAIN (defaults to the production value).
 * ============================================================================
 */

// The apex domain stores live under. Override per-environment (e.g. staging)
// with NEXT_PUBLIC_ROOT_DOMAIN; defaults to the production domain.
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'ola.ug';

/**
 * Build a store's full domain from its subdomain slug — e.g. `acme` → `acme.ola.ug`.
 */
export function storeDomain(subdomain) {
  return `${subdomain}.${ROOT_DOMAIN}`;
}

/**
 * The current origin reduced to its root domain, preserving protocol + port.
 * Browser-only — returns '' during SSR. e.g. `https://acme.ola.ug` → `https://ola.ug`.
 */
export function getRootDomain() {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;
  const parts      = hostname.split('.');
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  return `${protocol}//${rootDomain}${port ? `:${port}` : ''}`;
}

/**
 * Read and parse the signed-in user from the `user_session` cookie.
 * Browser-only — returns null when unavailable or unparseable. Tolerates both
 * raw-JSON and quoted/double-encoded cookie values.
 */
export function getSessionUser() {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.split('; ').find(c => c.startsWith('user_session='));
    if (!match) return null;
    let raw = decodeURIComponent(match.split('=')[1]).replace(/^"|"$/g, '');
    if (raw.startsWith('%7B')) raw = decodeURIComponent(raw);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Whether a hostname is the main marketplace host rather than a store subdomain.
 */
export function isMainHost(hostname) {
  return (
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === 'localhost' ||
    !hostname.includes('.')
  );
}

/**
 * Ensure a store domain is fully-qualified. Leaves custom domains and localhost
 * untouched; appends the root domain to bare subdomain slugs.
 */
export function normalizeStoreDomain(domain) {
  if (domain && !domain.includes(`.${ROOT_DOMAIN}`) && !domain.includes('localhost')) {
    return `${domain}.${ROOT_DOMAIN}`;
  }
  return domain;
}

/**
 * Protocol to use when redirecting to a host — http for localhost, https otherwise.
 */
export function protocolFor(host) {
  return host.includes('localhost') ? 'http://' : 'https://';
}

/**
 * The root domain to scope a wildcard cookie to (e.g. `.ola.ug`), derived from
 * the current hostname.
 */
export function getCookieRootDomain(hostname) {
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
}
