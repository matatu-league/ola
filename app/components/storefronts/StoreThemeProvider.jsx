/**
 * StoreThemeProvider
 * ------------------------------------------------------------------------------
 * Wraps a store-scoped buyer surface and emits the store's design tokens as
 * scoped CSS variables (`--s-primary`, `--s-bg`, `--s-radius`, …). Children
 * style themselves with `var(--s-*)` (or the `bg-store-*` Tailwind aliases),
 * so the storefront, product page, cart and checkout all match the vendor's
 * theme automatically.
 *
 * Server-safe: no hooks, just a styled wrapper. Accepts either a `store` doc or
 * a pre-built `theme` token object.
 */
import { buildStoreTheme, themeToCssVars } from '@/lib/storeTheme';

export default function StoreThemeProvider({ store, theme, className = '', children }) {
  const tokens = theme || buildStoreTheme(store || {});
  const cssVars = themeToCssVars(tokens);

  return (
    <div
      data-store-theme={tokens.mode}
      style={{
        ...cssVars,
        background: 'var(--s-bg)',
        color: 'var(--s-text)',
        fontFamily: 'var(--s-font)',
        minHeight: '100%',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
