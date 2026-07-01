// ─── Storefront template prompt builder ─────────────────────────────────────
//
// The single source of truth for the master prompt that the AI store-template
// builder sends to whichever engine is active (Gemini / DeepSeek / Custom — see
// @/lib/aiProvider). Kept in its own module so the prompt — by far the most
// important asset in the theme studio — can evolve independently of the React
// page that orchestrates the call (code-splitting).
//
// Everything here is engine-agnostic: `buildTemplatePrompt()` returns a plain
// string. The caller attaches the logo image bytes and dispatches to the engine.
//
// HARD SANDBOX CONTRACT (do not violate when editing the prompt):
//   • The generated component renders inside a Babel-standalone + React 18 UMD
//     sandbox. ONLY `useState`, `useEffect`, `useRef`, `useMemo` are available
//     (globally) — NO imports of any kind, NO animation/icon libraries.
//   • Styling is Tailwind (CDN) utilities + inline SVG icons only.
//   • Motion must therefore be pure CSS/Tailwind or browser-API driven
//     (IntersectionObserver, scroll listeners) — never framer-motion/GSAP.

import { unsplashSourceUrl } from '@/lib/aiProvider';

// Industry-specific blueprint so a hotel gets a hotel site, not a product grid.
const SITE_BRIEFS = {
  hotel:   `Build a HOTEL / ACCOMMODATION website. Hero with a Date / Guests check-in–check-out availability picker, ROOM TYPES as cards (image, nightly price, capacity, a clear "Book Now" button), an AMENITIES section (Wi-Fi, pool, parking, breakfast, AC…), check-in / check-out info, a photo GALLERY, and a location block. Do NOT build a generic product grid.`,
  salon:   `Build a SALON / SPA website. A SERVICE MENU (treatment name, duration, price) with "Book Appointment" CTAs, a stylists/team section, before/after or gallery, and opening hours.`,
  medical: `Build a CLINIC / DOCTOR website. Specialties & services, practitioner profiles, a prominent "Book Appointment" flow, consultation info, opening hours, and trust/credentials.`,
  tickets: `Build an EVENTS / TICKETS website. Featured EVENTS with date, time and venue, TICKET TIERS (price + "Buy Tickets"), and a schedule/lineup section.`,
  venue:   `Build a VENUE / EVENT-SPACE RENTAL website. Spaces as cards (capacity, hourly/day rate, amenities), a "Request Booking" CTA, gallery, and location.`,
  generic: `Build a SERVICES website. Services as cards (what's included + pricing) with "Book" / "Request a Quote" CTAs, an about section, and trust signals.`,
};

const productBrief = `Build a clean, modern, conversion-focused E-COMMERCE STORE — and ONLY that. The entire site is: a brand hero, a PRODUCT GRID (cards: image, name, price, "Add to Cart"), working local search + category filter + pagination, a cart (icon with item count), and a footer. That is the whole site. Do NOT add services, bookings, appointments, reservations, quotes, "our services", "how it works" service steps, or any service-style sections or wording. It is a shop: people browse products and buy them.`;

/**
 * Build the full master prompt for one generation.
 *
 * @param {object}  o
 * @param {string}  [o.promptText]        - the vendor's free-text directive / edit request
 * @param {string}  [o.currentCode]       - existing source (only used when editing)
 * @param {string}  [o.categoryContext]   - resolved store category / industry label
 * @param {string}  [o.blueprintPrompt]   - macro layout blueprint fragment
 * @param {string}  o.themeColor          - primary accent hex
 * @param {string}  o.themeMode           - 'light' | 'dark'
 * @param {string}  [o.artDirection]      - art-direction vibe fragment
 * @param {object}  o.advancedConfig      - { bgStyle, fontFamily, borderRadius, animationFeel }
 * @param {boolean} [o.isEditingExplicit] - vendor ticked "edit current design"
 * @param {object}  [o.business]          - the vendor/business brief
 * @returns {string} the prompt to send to the active engine
 */
export const buildTemplatePrompt = ({
  promptText,
  currentCode,
  categoryContext,
  blueprintPrompt,
  themeColor,
  themeMode,
  artDirection,
  advancedConfig = {},
  isEditingExplicit,
  business = {},
}) => {
  const { bgStyle, fontFamily, borderRadius, animationFeel } = advancedConfig;

  // ── Business brief — makes generation specific to THIS vendor/industry ──────
  const bt = business.businessType || 'products';
  const st = business.serviceType || null;
  const isBoth = bt === 'both';
  // A products-only store is a PURE e-commerce shop — no service/booking wording
  // of any kind. Service language is reserved for 'services' and 'both'.
  const isProductOnly = bt === 'products';

  let siteBrief;
  if (bt === 'products')      siteBrief = productBrief;
  else if (isBoth)           siteBrief = `This business offers BOTH ${st || 'services'} AND physical products. Structure the site as a multi-view single-page app driven by the hash router (see the SINGLE-PAGE, HASH-ROUTED ARCHITECTURE):
   • HOME / landing view (default) — leads with the ${st || 'service'} experience: ${SITE_BRIEFS[st] || SITE_BRIEFS.generic} The services/menu list is the PRIMARY content of the home page; do not bury it under a product grid.
   • A DEDICATED "Shop" / "Products" view — reached from a clearly-labelled top-nav item. This is its own hash route (\`#/shop\`), rendering the full PRODUCT grid (image, name, price, working search/filter, "Add to Cart"). Products are NOT shown on the services home page — they live on this dedicated shop view.
   • The top nav must let buyers move between the Services home (\`#/\`) and the Shop (\`#/shop\`) (and the logo / a "Home" item returns to the services home). Clicking a product card opens its in-page detail view \`#/product/<id>\` (see the hash-router contract below).`;
  else                        siteBrief = SITE_BRIEFS[st] || SITE_BRIEFS.generic;

  const isEditing = isEditingExplicit || (promptText && currentCode && promptText.toLowerCase().includes('change'));

  // ── Mode-specific prompt fragments — products get a PURE e-commerce build with
  //    zero service wording; services/both keep the richer service language. ───
  const modeDirective = isProductOnly
    ? `\nSTRICT SCOPE — PRODUCTS-ONLY E-COMMERCE STORE: build ONLY a shopping experience (catalogue + cart + checkout). Do NOT include any service, booking, appointment, reservation, consultation or quote content or wording ANYWHERE — not in the nav, hero, sections, CTAs, or footer. Ignore the \`services\` prop entirely. Keep copy lean and commercial; no filler "service" paragraphs.\n`
    : '';
  const ctaRule = isProductOnly
    ? `4. PRIMARY CTA: "Add to Cart" on every product card, plus a cart icon with a live count and a checkout CTA. Use ONLY e-commerce wording — never "Book"/"Appointment"/"Reservation"/"Quote".`
    : `4. PRIMARY CTAs: use the correct call to action for the business — "Book Now"/"Book Appointment"/"Buy Tickets"/"Request Booking" for services, "Add to Cart" for products.`;
  const bookingRule = isProductOnly
    ? ''
    : `\n5. Booking/quote CTAs for services must open a real on-page booking form/modal (built with React state) — never link out to a non-existent route.`;
  const interactionBookingLine = isProductOnly
    ? ''
    : ` Service "Book"/"Request" opens the on-page booking form.`;

  return `
You are an avant-garde, world-class creative frontend engineer AND product designer, known for building wildly unique, award-winning (Awwwards "Site of the Day" level) custom websites with impeccable UI/UX, motion design and accessibility.
Your mission: generate a COMPLETE, mind-blowing, UNIQUE, PRODUCTION-READY React component (JSX) for the SPECIFIC business described below — every vendor must get a site tailored to THEIR business, never a generic template. Treat this like a flagship client project: obsess over hierarchy, spacing, rhythm, motion, responsiveness and the tiny details that separate a template from a bespoke brand experience.

=== DESIGN FOR THE CATEGORY: "${categoryContext || business.industry || 'this industry'}" (this drives EVERYTHING) ===
The whole storefront must look and feel like it belongs to a "${categoryContext || business.industry || 'this industry'}" brand — a shopper should instantly know the category from the design alone. Let the category dictate: the aesthetic & mood (e.g. ELECTRONICS/TECH → sleek, dark, high-contrast, neon/blue accents, precise grids, spec-forward cards; FASHION → editorial, airy, big imagery; FOOD/GROCERY → warm, fresh, appetising; BEAUTY → soft, elegant, pastel; FURNITURE/HOME → calm, natural, spacious), the vocabulary & section names (categories, filters, badges, CTAs), the iconography, and — critically — ALL photography. Every Unsplash keyword you use MUST be category-specific (electronics → "modern gadgets", "circuit macro", "smartphone on desk", "headphones product"; a hotel → "luxury hotel lobby"; a salon → "modern hair salon"). Never use off-category or generic stock imagery. Infer sensible category-appropriate product names/copy for any empty-state or hero framing.
${modeDirective}

${isEditing ? `CRITICAL EDITING INSTRUCTION: The user wants to MODIFY their current design. I am providing the CURRENT SOURCE CODE below. Apply their requested changes specifically to this code without breaking existing logic, structure, animations or the data/navigation contracts.\n\n--- CURRENT CODE ---\n${currentCode}\n--- END CURRENT CODE ---\n` : ''}

=== BUSINESS BRIEF (build the site for THIS business) ===
- Store name: ${business.storeName || 'this store'}
- Industry / category: ${categoryContext || business.industry || 'General'}
- Business type: ${bt}${st ? ` (service type: ${st})` : ''}
- About / description: ${business.description || '(none provided — infer from the industry)'}
- Contact: ${business.contactEmail || ''} ${business.contactPhone || ''}
- Logo: ${business.logoBase64 ? `attached below as an image at URL "${business.logo}" — render THIS exact logo (use the URL as the src). The logo is the SOLE creative anchor: derive the entire palette, mood, typography pairing and art direction FROM it so the whole design feels inspired by and built around this logo` : (business.logo ? `available at "${business.logo}" — use this URL as the logo src and design the palette around it` : '(none — render a tasteful placeholder using the store name initial + brand color)')}
- Hero / section imagery: there is NO uploaded banner. For the hero background and every other photographic image, use REAL Unsplash photos via deterministic source URLs of the form \`${unsplashSourceUrl('RELEVANT KEYWORDS', 1600, 900)}\` — replace the keywords with terms specific to THIS business/industry (e.g. for a hotel: "luxury hotel lobby", for a salon: "modern hair salon"). Vary the keywords per section so images differ.

=== WHAT TO BUILD ===
${siteBrief}

CRITICAL ARCHITECTURE RULES (STRICT COMPLIANCE):
1. BREAK THE GRID: avoid a boring Bootstrap-style grid. Use overlapping elements, asymmetry, layered depth, bold editorial typography, generous negative space and advanced Tailwind. Establish a clear focal point per section.
2. UNIQUE CARDS: invent fresh, on-brand ways to present the items relevant to THIS business (rooms, services, events, or products — per the brief above). Cards must feel designed, not stamped out.
3. IMAGES: use \`object-cover\`; product/room/service images should be a clean, consistent aspect ratio (wrap in a fixed-ratio container so cards never jump). Add \`loading="lazy"\` and descriptive \`alt\` text to every image. ALWAYS include inline SVG fallbacks for missing images (when \`!item.image\`). For ALL decorative / hero / gallery / section photography use REAL Unsplash source URLs (\`https://source.unsplash.com/<width>x<height>/?<industry keywords>\`). NEVER invent fake/placeholder/lorem image URLs and NEVER use AI-generated image services — only Unsplash.
${ctaRule}
5. SEARCH/FILTER: where a list of items is shown, implement working local search/filter with React state, with smooth result transitions and a friendly "no results" state.
6. DARK FOOTER: include a rich dark footer (#050505 or similar) with the contact details, location, newsletter/social row (non-interactive where there's no real URL — see routing contract) and legal links.
7. LOGO-DRIVEN DESIGN: use the storeLogo prop in the header (and footer) when present, and let it drive the whole look — palette, accents, gradients and overall feel must be inspired by the logo. For the hero/background imagery use Unsplash photos (rule 3), NOT a storeBanner. Make the design feel bespoke to ${business.storeName || 'the store'}.
8. NO RAW JS COMMENTS IN JSX: NEVER use single-line // comments inside the JSX return block — they render as visible text. Use {/* ... */} only.

=== DESIGN SYSTEM (define it once, apply it everywhere — be consistent) ===
- PRIMARY ACCENT COLOR: ${themeColor} — use THIS color (not any hardcoded blue) for primary buttons, links, highlights, focus rings and key accents. Use it with intent (hierarchy), not everywhere; derive 1–2 supporting tints/shades and at most one complementary accent from it and from the logo.
- Color Mode: ${themeMode === 'dark' ? 'DARK MODE (rich, layered dark backgrounds — not pure #000; light text with proper opacity tiers)' : 'LIGHT MODE (clean light backgrounds; near-black text, never pure #000-on-#fff harshness)'}
- CONTRAST: every text/background pairing MUST meet WCAG AA (≥4.5:1 for body, ≥3:1 for large text). Never put low-contrast text on busy images without a scrim/overlay.
- TYPOGRAPHY: establish a deliberate type scale and a clear hierarchy (oversized display headings → section titles → body → captions/eyebrows). Use fluid sizing where it helps via \`clamp()\` (e.g. \`style={{fontSize:'clamp(2.5rem,6vw,5rem)'}}\` or Tailwind arbitrary \`text-[clamp(2.5rem,6vw,5rem)]\`). Tighten leading/tracking on big headings; keep body line-length readable (~60–75ch).
- SPACING & RHYTHM: use a consistent spacing scale and generous, consistent section padding (e.g. \`py-20 md:py-28\`). Constrain content with a max-width container (\`max-w-7xl mx-auto px-5 md:px-8\`). Maintain vertical rhythm between elements.
- ELEVATION: define a small, consistent shadow ladder (subtle → prominent) and apply it meaningfully (raised cards, sticky header, modals).
- Macro Layout Blueprint: ${blueprintPrompt ? blueprintPrompt : 'None specified — invent a layout that fits the business.'}
- Art Direction & Vibe: ${artDirection || 'Choose an art direction that fits the brand and commit to it fully.'}
- Background treatment: ${bgStyle || 'Choose backgrounds (solid, subtle gradient, mesh, grain, or imagery) that suit the vibe; vary section backgrounds for rhythm.'}
- Typography style: ${fontFamily || 'Pick a tasteful pairing that matches the brand.'}
- Border Radius: ${borderRadius || 'Choose a radius and apply it CONSISTENTLY to every card, button, input and image container.'} — be consistent everywhere.
- Animation feel: ${animationFeel || 'Choose a motion personality (snappy, smooth, playful, elegant) and apply it consistently.'}

=== MOTION & ANIMATION SYSTEM (make it feel alive — but tasteful, never gratuitous) ===
All motion MUST be pure CSS/Tailwind or browser-API driven. There are NO animation libraries available (no framer-motion, GSAP, AOS) — only the global React hooks and the DOM/IntersectionObserver APIs.
A. KEYFRAMES: include ONE \`<style>\` block at the very top of your returned JSX that defines every @keyframes you use (e.g. fadeUp, fadeIn, scaleIn, float, shimmer, gradientShift, marquee). Reference them via Tailwind arbitrary utilities like \`animate-[fadeUp_0.7s_ease-out_both]\` or inline \`style={{animation:'fadeUp .7s ease-out both'}}\`. In that same \`<style>\`, add \`@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}\` so motion is accessible.
B. SCROLL REVEAL: build a small reusable \`Reveal\` component INSIDE App that uses \`useRef\` + \`useEffect\` + IntersectionObserver to add an entrance animation (fade/slide/scale up) when each section/card scrolls into view; stagger children with incremental \`animationDelay\`. Use it to bring sections and card grids to life. Disconnect the observer on cleanup.
C. HOVER & PRESS MICRO-INTERACTIONS: give EVERY interactive element a transition (\`transition-all duration-300 ease-out\`). Cards lift and gain shadow on hover (\`hover:-translate-y-1 hover:shadow-2xl\`); product/hero images zoom within an \`overflow-hidden\` wrapper (\`group\` + \`group-hover:scale-105\`); buttons depress on click (\`active:scale-95\`); nav links get an animated underline; icons subtly translate/rotate. Add \`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[${themeColor}] focus-visible:ring-offset-2\` to all interactive elements.
D. STATEFUL FEEDBACK: "Add to Cart" (or "Book") triggers a brief visual confirmation — a toast/snackbar (aria-live="polite") and a cart-badge bump animation. Show a loading state (spinner via \`animate-spin\`, or skeleton blocks via \`animate-pulse\`) for any async action or while hero/section images load (track \`onLoad\`), then fade the image in.
E. AMBIENT POLISH: tasteful, low-key ambient motion where it suits the vibe — a gently floating hero element, an animated gradient/aurora, a marquee of categories, a subtle parallax on scroll (scroll listener + transform). Keep it subtle; performance and clarity beat spectacle. Honor \`motion-safe:\`/\`motion-reduce:\` Tailwind variants for anything bold.
F. SMOOTH SCROLLING: enable smooth in-page scrolling for anchor/section navigation.

=== RESPONSIVE & MOBILE (mobile-first, flawless on every breakpoint) ===
- Design mobile-first, then enhance at \`sm md lg xl\`. Verify the layout mentally at 375px, 768px and 1280px — nothing overflows, overlaps badly, or becomes unreadable.
- Responsive grids: \`grid-cols-1\` → \`sm:grid-cols-2\` → \`lg:grid-cols-3/4\` as appropriate; fluid hero typography; stack/reflow sections sensibly.
- MOBILE NAV: implement a REAL working mobile menu — a hamburger button toggling a \`useState\` open/close, an accessible slide-in/overlay drawer with the same nav actions, that closes on selection and on backdrop/Escape. The desktop nav hides on small screens and the hamburger shows.
- Touch targets ≥ 44×44px; comfortable tap spacing; no hover-only affordances for critical actions.

=== ACCESSIBILITY & SEMANTICS (non-negotiable) ===
- Use semantic landmarks: \`header\`, \`nav\`, \`main\`, \`section\`, \`footer\`, with a sensible heading order (one \`h1\`).
- Every image has descriptive \`alt\`; icon-only buttons have \`aria-label\`; decorative SVGs are \`aria-hidden\`.
- Modals/drawers: \`role="dialog"\` + \`aria-modal\`, close on Escape and backdrop click, and move focus sensibly.
- Cart count and toasts announce via \`aria-live\`. Visible focus states everywhere (see Motion C). Respect reduced motion (see Motion A).
- SEO-FRIENDLY HEADER & CONTENT: the header is a \`<header>\` with a \`<nav>\`; the hero contains the ONE \`<h1>\` and it MUST include the real store name (e.g. "Welcome to \${storeName}" or the brand name), not a generic word. Use a logical heading order (section titles as \`<h2>\`), descriptive \`alt\` text with product/brand keywords, and meaningful link/button text (no "click here"). This makes each vendor's storefront read as a distinct, indexable brand.

CRITICAL ARCHITECTURE — OUTPUT RULES:
1. Output ONLY raw React JSX code. No markdown fences. No explanations.
2. Main component MUST be named \`App\` and MUST be a standard React arrow function.
   EXACT SYNTAX REQUIRED: \`const App = ({ storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, services, businessType, serviceType, themeColor, apiBase }) => { ... }\`
   DO NOT use shorthand object methods like \`App() { ... }\` or class syntax. You MAY declare small helper components (e.g. \`Reveal\`, icon components, a \`Toast\`) ABOVE or INSIDE \`App\`, but \`App\` remains the single exported root and the last top-level component.
3. ICONS: you MAY use \`lucide-react\` icons — the host loads them from a CDN and wires the import for you. Import normally, e.g. \`import { ShoppingCart, Search, Menu, Star, ChevronRight } from 'lucide-react';\` and render \`<ShoppingCart size={18} />\`. Use PascalCase lucide names; any name the CDN doesn't expose degrades gracefully to a placeholder, so prefer well-known lucide icons. Inline SVGs are still fine for a bespoke logo/mark. Do NOT pull icons from any OTHER library.
4. The ONLY import you may write is from \`'lucide-react'\` (rule 3). Do NOT import React or any other module. \`useState\`, \`useEffect\`, \`useMemo\`, \`useRef\` are available globally. Browser APIs (IntersectionObserver, window, document) are available — use them in effects with proper cleanup.
5. Use Tailwind CSS utility classes exclusively for styling (plus the single \`<style>\` keyframes block and occasional inline \`style\` for dynamic values like accent color, clamp() and animation timing). Do NOT rely on any custom Tailwind config/plugin — only stock utilities and arbitrary values (\`bg-[${themeColor}]\`, \`animate-[...]\`, \`text-[clamp(...)]\`).
6. NO DUMMY DATA IN THE OUTPUT: render items strictly by mapping over the \`products\`/\`services\` props. The production page must contain ZERO hardcoded catalog data and ZERO dead links — sample data is supplied by the host ONLY for the builder preview and is never part of your source. Do NOT hardcode fake products, names, prices, reviews, or links. If a list is empty, map yields nothing — so also render a tasteful empty-state / "coming soon" block (with an on-brand Unsplash image per rule 3) for that case. The result must be deploy-ready as-is.
7. ROBUSTNESS: never crash on missing fields — guard with optional chaining / fallbacks (\`item?.image\`, \`Number(item.price||0).toLocaleString()\`). Clean up every listener/observer/timeout in \`useEffect\` returns.

DATA CONTRACT (props passed to App):
  storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, services, businessType, serviceType, themeColor, apiBase
  - \`products\`: array of { id, name, title, price, compareAtPrice?, image, images[], description, specifications[], variants[], moq?, stock?, storeId }. \`specifications\` is an array of { name, value } (render as a spec table when non-empty). \`variants\` is an array of option objects (e.g. { name, image?, price? }) — render selectable variant chips/swatches when non-empty. \`services\`: array of { id, name, price, image, duration }. These arrive with the store's REAL data at runtime (and harmless sample data ONLY inside the builder preview). EVERY field beyond id/name/price/image is optional — treat all as possibly missing/empty and guard accordingly.
  - \`apiBase\`: the store's own public storefront API base (e.g. "https://acme.ola.ug/api/storefront"). The \`products\`/\`services\` props are ALREADY provided for first paint, so do NOT block rendering on a fetch. You MAY use \`apiBase\` for progressive enhancement only — e.g. "Load more" pagination via \`fetch(apiBase + "/products?page=2&limit=24")\` → \`{ data: { products, pagination } }\`. If \`apiBase\` is empty, skip all fetching and rely solely on the props. Never invent other endpoints.

=== \`window.__OLA__\` — THE SYSTEM BRIDGE (use it for ALL cart + checkout + auth; NEVER reinvent these) ===
The host injects a global \`window.__OLA__\` that connects this storefront to the REAL platform (shared cart, shared login, and the real themed checkout that writes orders to the database). You MUST route every cart and checkout action through it — do NOT build your own cart persistence or your own checkout/payment flow. Always feature-detect (\`window.__OLA__ && window.__OLA__.addToCart(...)\`) so the design still renders if it is ever absent.
  - \`__OLA__.addToCart(product, quantity = 1, variants = {})\` — adds a product (pass the whole product object from \`products\`) to the SHARED system cart. Returns the updated items array.
  - \`__OLA__.getCart()\` → array of { id, product, quantity, priceAtAddition, variants } (product has { _id, storeId, title, images, price }). Use this to render the cart drawer.
  - \`__OLA__.updateQty(itemId, qty)\`, \`__OLA__.removeFromCart(itemId)\`, \`__OLA__.clearCart()\`.
  - \`__OLA__.cartCount()\`, \`__OLA__.cartTotal()\` — for the header badge and drawer subtotal.
  - \`__OLA__.onCartChange(cb)\` — subscribe to cart changes; returns an unsubscribe fn. Call it in a \`useEffect\` (with cleanup) and keep a local \`useState\` mirror so the drawer/badge re-render. Seed that state from \`getCart()\` on mount.
  - \`__OLA__.getUser()\` → the signed-in shopper ({ id, name, email, ... }) from the shared session, or null. Use it to greet a logged-in user; the real checkout still handles auth.
  - \`__OLA__.checkout()\` — hands off to the REAL, theme-matched system checkout (sign-in / Google login, Google-Places address autocomplete, delivery + payment gateways, order saved to the DB). This is the ONLY checkout. Call it from the drawer's "Checkout" button and from PDP "Buy Now" (after addToCart).
  - \`__OLA__.viewCart()\` opens the full system cart page; \`__OLA__.viewProduct(id)\` opens the system product page (optional — you normally show product detail in-page via the hash route below).

=== SINGLE-PAGE ARCHITECTURE: HASH ROUTES FOR BROWSING · DRAWER FOR CART · REAL SYSTEM CHECKOUT ===
This component is the storefront's BROWSING experience (home, shop, product detail) as ONE page, plus a slide-in CART DRAWER. Checkout is NOT rebuilt here — it is the real, theme-matched system checkout, reached via \`window.__OLA__.checkout()\`.
1. HASH ROUTER (build this FIRST). Hold a route in state synced to \`window.location.hash\`; parse into \`{ view, id, tab }\`. The ONLY browsing routes — invent no others:
       \`#/\` → home · \`#/shop\` → product listing/shop · \`#/product/<id>\` → product detail.
   On mount read the hash; add a \`hashchange\` listener in a \`useEffect\` and derive state from it; CLEAN UP on unmount. Navigate via \`const go = (h) => { window.location.hash = h; };\`. Scroll to top on route change. Header nav and product cards navigate by changing the hash (plain \`<a href="#/shop">\` hash anchors are fine and accessible). There is NO \`#/cart\` and NO \`#/checkout\` route — the cart is a DRAWER and checkout is the system handoff.
2. CART = ALWAYS A DRAWER (never a routed page). A header cart icon (with a live count badge from \`__OLA__.cartCount()\`) opens a right-side slide-in drawer overlay (\`role="dialog"\`, \`aria-modal\`, backdrop, slide/fade animation, close on backdrop + Escape). The drawer lists line items from \`__OLA__.getCart()\` — thumbnail, name (truncated), variant, unit price, a live quantity stepper (\`__OLA__.updateQty\`), line total, remove (\`__OLA__.removeFromCart\`) — plus a subtotal (\`__OLA__.cartTotal()\`), a "Checkout" button calling \`__OLA__.checkout()\`, and a "Continue shopping" that just closes the drawer. Empty cart → tasteful empty state inside the drawer. Subscribe via \`__OLA__.onCartChange\` (with a local \`useState\` mirror) so the badge + drawer update instantly after any add.
3. NO GHOST / DEAD LINKS. Forbidden: \`href="#"\`, \`href="javascript:void(0)"\`, empty \`href\`, server paths like \`/about\`/\`/login\`, fabricated social URLs, or any \`onClick\` that does nothing. Every interactive element MUST do something real: change the hash route, open/close the cart drawer, switch a tab, mutate the cart through \`__OLA__\`, call \`__OLA__.checkout()\`, select a variant, smooth-scroll to an id that ACTUALLY exists, or open an on-page modal you also render. If a conventional link has no real destination (Privacy, Terms, Instagram), render it as plain NON-interactive \`<span>\` text — never a clickable dead link. This applies to EVERY button.
4. TABS use the same approach (e.g. product-detail "Description / Specifications / Shipping" tabs). Keep the active tab in state (optionally reflected in the hash, e.g. \`#/product/12?tab=specs\`).${bookingRule}

=== PRODUCT DETAIL VIEW (#/product/<id>) — AS COMPLETE AS THE REAL SYSTEM PDP ===
Find the product by id from the \`products\` prop (if not found → a friendly "product not found" with a link back to \`#/shop\`). Build a rich, conversion-grade detail view:
- BREADCRUMB: Home / Shop / <name> (crumbs navigate via hash; the current product crumb is plain text).
- GALLERY: a large main image in a FIXED-ASPECT container (\`aspect-square\` or \`aspect-[4/5]\`, \`object-cover\`, \`overflow-hidden\`) plus a thumbnail strip when \`product.images\` has more than one — clicking a thumb swaps the main image (state) with an active-thumb ring. One image → no strip. No image → inline-SVG placeholder. Lazy-load + descriptive alt.
- CORE: title, PRICE formatted with currency (e.g. \`USh \${Number(product.price||0).toLocaleString()}\`), a strikethrough \`compareAtPrice\` + discount badge WHEN \`product.compareAtPrice\` is present and higher, and "Min. order"/MOQ when \`product.moq\` is present. Show stock/availability if \`product.stock\` is present.
- VARIANTS: when \`product.variants\` is non-empty, render selectable variant chips/swatches (track the selected one in state; if a variant carries its own image/price, reflect it in the gallery/price). When empty, render no selector.
- SPECIFICATIONS: when \`product.specifications\` is non-empty, render a clean key/value spec table (name → value), exactly like the system product details view. When empty, omit it.
- DESCRIPTION with \`whitespace-pre-line\`; for very long copy add a "Read more / Read less" toggle.
- QUANTITY stepper (min 1, sane max).
- ACTIONS (NO GHOST BUTTONS): "Add to Cart" → \`__OLA__.addToCart(product, qty, selectedVariants)\` then toast + badge bump + open the drawer; "Buy Now" → addToCart then \`__OLA__.checkout()\`. On mobile, a sticky bottom add-to-cart bar.
- SECONDARY: tabbed Description / Specifications / Shipping; truthful generic trust badges only (secure checkout, delivery) — never fabricated claims/reviews.
- RELATED: a "You may also like" grid mapping OTHER products (exclude the current id), each routing to its own \`#/product/<id>\`.

=== CHECKOUT = REAL SYSTEM HANDOFF (do NOT rebuild it) ===
There is NO in-template checkout, payment form, or order page. The drawer "Checkout" and PDP "Buy Now" call \`window.__OLA__.checkout()\`, which carries the shopper into the real, theme-matched platform checkout — sign-in / Google login for guests, Google-Places address autocomplete, delivery options, the live payment gateways, and the order written to the database. Because the bridge shares the SAME cart and the SAME login session as the rest of the platform, whatever the shopper added here is exactly what they pay for there. Never invent your own payment UI or claim to charge a card.

=== EDGE CASES — THINK THESE THROUGH BEFORE BUILDING EACH VIEW ===
Pause and reason deliberately about resilience; the catalogue is REAL vendor data, so assume anything:
- LONG TITLES/NAMES: never overflow or break layout — clamp (\`line-clamp-1/2\`) + \`break-words\`, keep card heights consistent (fixed image ratio + min-height), and add a \`title=\` attribute so the full text is still discoverable.
- LONG DESCRIPTIONS: "Read more" toggle — never an unbounded wall of text.
- MISSING DATA: no image → inline-SVG placeholder; no price → "Price on request"; no description → hide the block; no variants → no selector. Guard everything with optional chaining + fallbacks.
- PRICES: thousands separators; coerce safely (\`Number(x||0)\`); never render \`NaN\`/\`undefined\`.
- QUANTITIES: enforce min 1 on the PDP, allow 0-removal in the cart; recompute totals correctly.
- EMPTY COLLECTIONS: empty shop, empty cart, no related products, no search results — each gets a tasteful empty state.
- VERY MANY ITEMS: keep the grid performant and paginated / "load more" — don't render thousands at once.
- NARROW SCREENS: every view (PDP gallery, cart drawer rows, sticky add-to-cart bar) must reflow cleanly at 375px.

CRITICAL INTERACTION RULES (EVERY button must do something real — NO GHOST LINKS ANYWHERE):
- Product card / "View" → route to \`#/product/<id>\` (the in-page detail view). NEVER load a server route for browsing.
- Cart icon → opens the cart DRAWER. "Add to Cart" → \`window.__OLA__.addToCart(product, qty, variants)\` then toast + badge bump + open drawer. "Buy Now" → addToCart then \`window.__OLA__.checkout()\`. Drawer "Checkout" → \`window.__OLA__.checkout()\` (the real themed system checkout). Always feature-detect \`window.__OLA__\` first.${interactionBookingLine}

FINAL SELF-CHECK before you output (fix anything that fails): unique & on-brand (not a template) · accent color & radius applied consistently · motion present and reduced-motion-safe · fully responsive incl. working mobile menu · AA contrast & semantic/aria correct · hash router works for #/ · #/shop · #/product/<id> (deep-linkable, back/forward, listener cleaned up) · product detail complete (gallery+thumbs, qty, VARIANTS when present, SPECIFICATIONS table when present, tabs, related) · cart is a DRAWER wired to window.__OLA__ (count badge, qty, remove, subtotal, onCartChange subscription) · checkout uses window.__OLA__.checkout() — NO in-template checkout/payment · every EDGE CASE handled (long titles truncate, missing image/price/description/specs/variants, empty states) · ZERO ghost links — every button does something real · zero hardcoded catalog data · no // comments in JSX · component named \`App\` with the exact prop signature.

${promptText ? `USER DIRECTIVE / EDIT REQUEST (highest priority — honor this specifically): "${promptText}"` : ''}
`;
};
