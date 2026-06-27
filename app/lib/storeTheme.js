/**
 * ============================================================================
 * FILE: app/lib/storeTheme.js
 * ----------------------------------------------------------------------------
 * Single source of truth for a store's visual theme. Turns a Store document
 * into a complete set of design tokens, and those tokens into CSS variables.
 *
 * Every store-scoped buyer surface (storefront, product, cart, checkout) reads
 * the same tokens via <StoreThemeProvider>, so they all match the vendor's
 * theme automatically. Pure (no DOM) so it runs on the server and client.
 *
 * Back-compat: stores created before structured theming only have
 * `themeColor` / `themeMode` / `layoutStyle`, so we derive a full token set
 * from those when `store.theme` is absent.
 * ============================================================================
 */

const DEFAULT_PRIMARY = '#161823';

// ── Colour helpers ───────────────────────────────────────────────────────────
function normalizeHex(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toLowerCase()}` : null;
}

function luminance(hex) {
  const h = normalizeHex(hex) || DEFAULT_PRIMARY;
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Perceived brightness (sRGB) — good enough for picking text contrast.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Pick black or white text for the strongest contrast on `hex`. */
export function contrastOn(hex) {
  return luminance(hex) > 0.6 ? '#111111' : '#ffffff';
}

// Map the legacy layoutStyle to a corner radius.
const RADIUS_BY_LAYOUT = {
  Classic: '8px',
  Modern:  '14px',
  Bold:    '2px',
};

/**
 * Build a complete, defaulted token set for a store.
 * Accepts the full Store doc (lean object or mongoose doc) or a plain
 * `{ theme?, themeColor?, themeMode?, layoutStyle? }`.
 */
export function buildStoreTheme(store = {}) {
  const t       = store.theme || {};
  const mode    = t.mode || store.themeMode || 'light';
  const isDark  = mode === 'dark';
  const primary = normalizeHex(t.primary) || normalizeHex(store.themeColor) || DEFAULT_PRIMARY;
  const radius  = t.radius || RADIUS_BY_LAYOUT[store.layoutStyle] || '10px';
  const font    = t.font || 'var(--font-poppins, "Poppins", system-ui, sans-serif)';

  return {
    mode,
    primary,
    onPrimary: t.onPrimary || contrastOn(primary),
    bg:      t.bg      || (isDark ? '#0b0b0f' : '#ffffff'),
    surface: t.surface || (isDark ? '#16161c' : '#f8f8f8'),
    text:    t.text    || (isDark ? '#f5f5f7' : '#161823'),
    muted:   t.muted   || (isDark ? '#9b9ba3' : '#8a8b91'),
    border:  t.border  || (isDark ? '#2a2a32' : '#e3e3e4'),
    radius,
    font,
    sections: Array.isArray(t.sections) ? t.sections : [],
  };
}

/** Tokens → CSS custom properties (consumed via `var(--s-*)`). */
export function themeToCssVars(theme) {
  return {
    '--s-primary':    theme.primary,
    '--s-on-primary': theme.onPrimary,
    '--s-bg':         theme.bg,
    '--s-surface':    theme.surface,
    '--s-text':       theme.text,
    '--s-muted':      theme.muted,
    '--s-border':     theme.border,
    '--s-radius':     theme.radius,
    '--s-font':       theme.font,
  };
}

/** Convenience: Store doc → CSS-var style object. */
export function storeCssVars(store) {
  return themeToCssVars(buildStoreTheme(store));
}
