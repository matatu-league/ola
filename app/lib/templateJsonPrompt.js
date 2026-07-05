// ─── JSON storefront template — generation prompt ────────────────────────────
//
// Companion to @/lib/templatePrompt (the legacy JSX prompt). This one asks the
// model for the STRUCTURED JSON document defined in docs/template-json-schema.md
// and rendered by the fixed runtime in @/lib/templateJsonRuntime. The output is
// validated (see @/lib/templateJson) and saved to Store.templateJson.

import { ACTION_VERBS, NODE_TYPES, REPEAT_SOURCES } from '@/lib/templateJson';

/**
 * @param {object} o — same brief as buildTemplatePrompt
 * @returns {string}
 */
export const buildJsonTemplatePrompt = ({
  promptText,
  currentJson,
  categoryContext,
  themeColor,
  themeMode,
  artDirection,
  advancedConfig = {},
  business = {},
  command = '',
  validationErrors = [],
}) => {
  const bt = business.businessType || 'products';
  const st = business.serviceType || null;

  const retryBlock = validationErrors.length
    ? `\nYOUR PREVIOUS OUTPUT FAILED VALIDATION — fix ALL of these and return the corrected FULL document:\n${validationErrors.map((e) => `  - ${e}`).join('\n')}\n`
    : '';

  const editBlock = currentJson
    ? `\nEDITING MODE: modify the CURRENT template document below according to the user directive, keeping everything else intact. EVERY rule in this brief — the 3 closed routes plus the pages route, tabs/dialogs instead of new routes, cartDrawer, checkout-only-handoff, no ghost interactions — applies EQUALLY to this edit as to a fresh build. If the current document violates any of them, FIX it as part of this edit even if not explicitly requested — preserving a broken pattern is not "keeping everything else intact".\n--- CURRENT TEMPLATE JSON ---\n${JSON.stringify(currentJson)}\n--- END CURRENT TEMPLATE JSON ---\n`
    : '';

  return `
You are a world-class web designer who outputs STRUCTURED JSON, not code.
Design a complete, unique, production-ready storefront for the business below and return it as ONE JSON document — no markdown fences, no prose, no comments. The document is rendered by a fixed engine, so every visual decision must be written EXPLICITLY into the JSON.

=== BUSINESS ===
- Store: ${business.storeName || 'this store'} — ${categoryContext || business.industry || 'General'} (${bt}${st ? `, service type: ${st}` : ''})
- About: ${business.description || '(infer from the industry)'}
- Logo: ${business.logoDescription ? `at "${business.logo}". DECODED BRAND BRIEF (derive the whole palette/mood/typography from this):\n"""${business.logoDescription}"""` : (business.logo ? `at "${business.logo}" — design the palette around it` : 'none — use the store initial + brand color')}
- Primary accent: ${themeColor} · Mode: ${themeMode}
- Art direction: ${artDirection || 'choose one that fits the brand and commit fully'}
- Background style: ${advancedConfig.bgStyle || 'your choice'} · Font vibe: ${advancedConfig.fontFamily || 'your choice'} · Radius: ${advancedConfig.borderRadius || 'your choice'} · Motion feel: ${advancedConfig.animationFeel || 'your choice'}
- Contact: ${business.contactEmail || ''} ${business.contactPhone || ''}
${command ? `\n=== HOUSE COMMAND (admin-defined — HIGH PRIORITY) ===\n${command}\n` : ''}${editBlock}${retryBlock}
=== DOCUMENT SHAPE (return exactly this structure) ===
{
  "version": 1,
  "meta": { "name": string, "category": string },
  "tokens": { "primary": hex, "onPrimary": hex, "accent": hex, "bg": hex, "surface": hex, "text": hex, "muted": hex, "border": hex, "radius": cssSize, "font": cssFontStack, "mode": "${themeMode}" },
  "sections": [ Node, ... ]
}
Tokens become CSS variables: reference them in classes as bg-[var(--s-primary)], text-[var(--s-text)], rounded-[var(--s-radius)], border-[var(--s-border)], etc. Derive ALL token values from the brand (accent ${themeColor}) and the ${themeMode} mode.

=== NODE (every visual element) ===
{
  "type": one of: ${NODE_TYPES.join(' · ')},
  "as": optional semantic tag ("section"|"header"|"nav"|"main"|"footer"|"h1".."h6"|"p"|"ul"|"li"|"span"),
  "route": (TOP-LEVEL sections only) "*" = every view (navbar/footer/cartDrawer), "home", "shop", "product", or "page" (vendor custom pages — one section handles ALL of them, resolved by slug, exactly like "product" handles all products),
  "class": THE FULL TAILWIND CLASS STRING — this is where the design lives. Include EVERY class needed: layout, spacing, color, responsive md:/lg:, states hover:/active:/focus-visible:/group-hover:, arbitrary values (text-[clamp(2rem,6vw,4rem)], bg-[var(--s-surface)]), and gradient utilities (bg-gradient-to-br from-[#0b0b0f] via-[#1d1f2b] to-[#3a0d1a]). Nothing is implied.
  "style": optional inline CSS object for what Tailwind can't express (multi-stop gradients: {"backgroundImage":"linear-gradient(135deg,#0b0b0f 0%,#1d1f2b 55%,#3a0d1a 100%)"}, clip-path, animation timing),
  "text": literal text OR a binding "{{item.name}}" / "USh {{item.price|money}}",
  "attrs": { "src", "alt", "href", "placeholder", "aria-label", "name"+"size" for icon (lucide PascalCase, e.g. "ShoppingCart"), "id" for scrollTo targets, "loading":"lazy" on images },
  "on": { "click": [ { "action": ... } ] },
  "motion": { "enter": "fade"|"fade-up"|"fade-down"|"scale-in"|"slide-left"|"slide-right", "delay": ms, "scroll": "reveal", "hover": "lift"|"zoom"|"glow" },
  "repeat": { "source": ${REPEAT_SOURCES.map((s) => `"${s}"`).join('|')}, "as": "item", "limit": n, "empty": Node },
  "if": "{{path}}" (render only when truthy; "!{{path}}" negates),
  "children": [ Node, ... ]
}

=== ACTIONS (closed set — ${ACTION_VERBS.join(', ')}) ===
- navigate {"to":"#/"|"#/shop"|"#/product/{{item.id}}"|"#/page/{{item.slug}}"} — switches the visible VIEW. There is NO routing of any kind: "to" is just a view name in a familiar spelling; the engine swaps views in memory like tabs and the URL NEVER changes. These are the only view names — everything else within a view is a TAB or a DIALOG (see below). Never put an "href" on a view link — the navigate action IS the link.
- addToCart {"product":"{{item}}","qty":1} · buyNow {"product":"{{item}}"} · checkout {} — real system cart/checkout.
- openDrawer/closeDrawer {} — the cart drawer. setState/toggle {"key":..} for menus. setVariant {"key","value"}. scrollTo {"target":elementId}. openModal/closeModal {"id"}. toast {"text"}. external {"href"} only for real URLs.
- NO GHOST INTERACTIONS: every button/link either carries a real action or is plain text. Footer links with no destination are plain text nodes.

=== EVERYTHING IS A TAB OR A DIALOG — THERE IS NO ROUTING, PERIOD ===
The engine has NO router. Views, tabs, panels, custom pages — ALL of it is in-memory state swapped like tabs; the URL never changes, nothing ever reloads, and nothing ever leaves the page except the checkout handoff (below). This applies to fresh builds AND edits equally. Reach for these whenever a design needs "sections that switch":
- TABS node: {"type":"tabs","attrs":{"key":"pdpTabs"},"children":[ Node, Node, ... ]} — each direct child is one tab's PANEL and MUST carry "attrs":{"tabLabel":"Description"} (its header button text); the runtime renders the tab strip and swaps panels itself, purely client-state, zero navigation. Use this for PDP Description/Specifications/Shipping, shop category filters, service categories, FAQ groups — anywhere content comes in labelled variants.
- MODAL node: {"type":"modal","attrs":{"id":"booking"}, "children":[...]} shown via openModal {"id":"booking"} / hidden via closeModal — use for booking forms, quick-view, filters, confirmations, image lightboxes. Also purely client-state, zero navigation.
- CART is always the built-in cartDrawer node (route "*") — never a route, never a modal you build yourself.
- The ONLY step that ever leaves this page is the checkout action, which hands off to the real, separate, already-themed system checkout. Never build your own checkout UI, never make it a modal/tab, never route to it.

=== DATA BINDINGS ===
Available: {{store.name}} {{store.logo}} {{store.email}} {{store.phone}}; inside repeat: {{item.*}} ({{item.id}}, {{item.name}}, {{item.price}}, {{item.image}}, {{item.description}}, {{item.duration}} for services; {{item.title}}, {{item.slug}} for pages) and {{index}}; {{cartCount}} for the header badge; on the product route: {{product.*}}; on the page route: {{page.title}}, {{page.content}}. Pipe |money formats numbers with thousands separators. Use "{{item}}" (whole object) as the product param of cart actions.

=== CUSTOM PAGES (vendor-authored — About, FAQ, Shipping policy, …) ===
${business.pages && business.pages.length
    ? `This store has ${business.pages.length} custom page(s). They are called "pages" but they are TABS: build them INTO the site as ONE "page" VIEW (route:"page") — never a separate route/page per title, exactly like ONE "product" section handles every product. Render {{page.title}} as a heading and {{page.content}} as body copy with class "whitespace-pre-line" (it's plain text with real line breaks). Add a nav item for EACH page below (in the navbar and/or footer) — a button/text node with the navigate action (NO href):\n${business.pages.map((p) => `  - "${p.title}" → navigate {"to":"#/page/${p.slug}"}`).join('\n')}`
    : 'This store has no custom pages yet — omit the "page" view and any page nav items entirely.'}

=== WHAT TO BUILD ===
${bt === 'products'
    ? 'A pure e-commerce storefront: navbar (route "*", with cart icon → openDrawer + {{cartCount}} badge), a striking hero (route "home"), featured products (route "home"), a full product grid with cards (route "shop"), a product detail section (route "product": gallery image, {{product.name}}, {{product.price|money}} price, a "tabs" node for Description/Specifications/Shipping, Add to Cart + Buy Now), a rich dark footer (route "*"), and a cartDrawer node (route "*"). NO service/booking wording anywhere.'
    : bt === 'both'
      ? `Lead with the ${st || 'service'} experience on route "home" (service menu cards from the services repeat with prices/durations and Book CTAs → openModal a booking modal you also declare), a dedicated shop on route "shop" (full product grid), product detail on route "product" (include a "tabs" node for Description/Specifications/Shipping), navbar with Home/Shop links + cart (route "*"), dark footer (route "*"), cartDrawer (route "*").`
      : `A ${st || 'services'} website: hero, service menu (services repeat: name, duration, price, Book CTA → openModal a booking modal node you also declare), about/trust section, gallery, dark footer, navbar (route "*").`}
Every product/service card image uses its binding ({{item.image}}); decorative/hero photography uses keyword URLs "https://loremflickr.com/1600/900/<industry,keywords>?lock=<n>" with category-specific keywords and a fixed lock number per image. Design for the "${categoryContext || business.industry || 'General'}" category: palette, section names, copy and imagery must instantly signal it.

=== QUALITY BAR ===
Award-level: bold typographic hierarchy (clamp() display sizes), generous section padding (py-20 md:py-28), consistent radius via var(--s-radius), WCAG-AA contrast, motion on every section (enter/reveal + hover lift/zoom on cards, delay-staggered grids), mobile-first responsive grids (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4), empty-state nodes for every repeat, truncation classes (line-clamp-2 break-words) on titles.

OUTPUT: the single JSON document only. It must parse with JSON.parse and pass the schema above.
${promptText ? `\nUSER DIRECTIVE (highest priority): "${promptText}"` : ''}
`;
};
