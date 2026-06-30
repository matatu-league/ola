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
  else if (isBoth)           siteBrief = `This business offers BOTH ${st || 'services'} AND physical products. Structure the site as a multi-view single-page app driven by a top-level \`view\` state (see the NAVIGATION & ROUTING CONTRACT):
   • HOME / landing view (default) — leads with the ${st || 'service'} experience: ${SITE_BRIEFS[st] || SITE_BRIEFS.generic} The services/menu list is the PRIMARY content of the home page; do not bury it under a product grid.
   • A DEDICATED "Shop" / "Products" view — reached from a clearly-labelled top-nav item. This is its own page (toggled via \`setView('products')\`), rendering the full PRODUCT grid (image, name, price, working search/filter, "Add to Cart"). Products are NOT shown on the services home page — they live on this dedicated products view.
   • The top nav must let buyers move between the Services home and the Products view (and the logo / a "Home" item returns to the services home). Clicking a product card opens its real detail route \`/p/{id}\`.`;
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
  const navPagesExample = isProductOnly
    ? `e.g. Shop/Home, Categories, Cart, About, Contact`
    : `e.g. Home/Services, Products/Shop, About, Contact`;
  const bookingRule = isProductOnly
    ? ''
    : `\n5. Booking/quote CTAs for services must open a real on-page booking form/modal (built with React state) — never link out to a non-existent route.`;
  const interactionBookingLine = isProductOnly
    ? ''
    : ` Service "Book"/"Request" opens the on-page booking form.`;

  return `
You are an avant-garde, world-class creative frontend engineer AND product designer, known for building wildly unique, award-winning (Awwwards "Site of the Day" level) custom websites with impeccable UI/UX, motion design and accessibility.
Your mission: generate a COMPLETE, mind-blowing, UNIQUE, PRODUCTION-READY React component (JSX) for the SPECIFIC business described below — every vendor must get a site tailored to THEIR business, never a generic template. Treat this like a flagship client project: obsess over hierarchy, spacing, rhythm, motion, responsiveness and the tiny details that separate a template from a bespoke brand experience.
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

CRITICAL ARCHITECTURE — OUTPUT RULES:
1. Output ONLY raw React JSX code. No markdown fences. No explanations.
2. Main component MUST be named \`App\` and MUST be a standard React arrow function.
   EXACT SYNTAX REQUIRED: \`const App = ({ storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, services, businessType, serviceType, themeColor, apiBase }) => { ... }\`
   DO NOT use shorthand object methods like \`App() { ... }\` or class syntax. You MAY declare small helper components (e.g. \`Reveal\`, icon components, a \`Toast\`) ABOVE or INSIDE \`App\`, but \`App\` remains the single exported root and the last top-level component.
3. DO NOT import or use external icon libraries like lucide-react. Create your own minimal inline SVG icon components (Lucide-inspired, \`stroke="currentColor"\`).
   Example: \`const SearchIcon = ({size=24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;\`
4. DO NOT import React or any module. \`useState\`, \`useEffect\`, \`useMemo\`, \`useRef\` are available globally. Browser APIs (IntersectionObserver, window, document) are available — use them in effects with proper cleanup.
5. Use Tailwind CSS utility classes exclusively for styling (plus the single \`<style>\` keyframes block and occasional inline \`style\` for dynamic values like accent color, clamp() and animation timing). Do NOT rely on any custom Tailwind config/plugin — only stock utilities and arbitrary values (\`bg-[${themeColor}]\`, \`animate-[...]\`, \`text-[clamp(...)]\`).
6. NO DUMMY DATA IN THE OUTPUT: render items strictly by mapping over the \`products\`/\`services\` props. The production page must contain ZERO hardcoded catalog data and ZERO dead links — sample data is supplied by the host ONLY for the builder preview and is never part of your source. Do NOT hardcode fake products, names, prices, reviews, or links. If a list is empty, map yields nothing — so also render a tasteful empty-state / "coming soon" block (with an on-brand Unsplash image per rule 3) for that case. The result must be deploy-ready as-is.
7. ROBUSTNESS: never crash on missing fields — guard with optional chaining / fallbacks (\`item?.image\`, \`Number(item.price||0).toLocaleString()\`). Clean up every listener/observer/timeout in \`useEffect\` returns.

DATA CONTRACT (props passed to App):
  storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, services, businessType, serviceType, themeColor, apiBase
  - \`products\`: array of { id, name, price, image }. \`services\`: array of { id, name, price, image, duration }. These arrive with the store's REAL data at runtime (and harmless sample data ONLY inside the builder preview). Treat both as possibly-empty.
  - \`apiBase\`: the store's own public storefront API base (e.g. "https://acme.ola.ug/api/storefront"). The \`products\`/\`services\` props are ALREADY provided for first paint, so do NOT block rendering on a fetch. You MAY use \`apiBase\` for progressive enhancement only — e.g. "Load more" pagination via \`fetch(apiBase + "/products?page=2&limit=24")\` → \`{ data: { products, pagination } }\`, or refreshing services via \`fetch(apiBase + "/services")\` → \`{ data: { services } }\`. If \`apiBase\` is empty, skip all fetching and rely solely on the props. Never invent other endpoints.

=== NAVIGATION & ROUTING CONTRACT (PRODUCTION-READY — ABSOLUTELY NO GHOST LINKS) ===
This component IS the entire storefront, rendered as ONE single page. It is NOT inside a router, so you must NOT invent page routes.
1. MULTI-"PAGE" NAV = IN-COMPONENT VIEW STATE. Implement separate "pages" (${navPagesExample}) as a top-level \`const [view, setView] = useState('home')\` and conditionally render each section. Nav links call \`setView('...')\` (and may smooth-scroll). They are buttons, not anchors to fake URLs. Scroll to top on view change.
2. THE ONLY REAL URLS you may navigate to (always via \`window.top.location.href\`) are EXACTLY these — nothing else exists:
   - \`"/p/" + id\`  → a product's detail page (use when a PRODUCT card/button is clicked)
   - \`"/cart"\`      → the cart page (use for "View Cart" / after add-to-cart)
   - \`"/checkout"\`  → the checkout page (use for a "Checkout" CTA)
3. NEVER emit a ghost / dead / placeholder / dummy link. Forbidden: \`href="#"\`, \`href="javascript:void(0)"\`, empty \`href\`, \`href="/about"\`, \`href="/services"\`, \`href="/products"\`, \`href="/login"\`, fabricated/example social-media URLs, or any \`onClick\` that does nothing. EVERY interactive element must do something real: \`setView(...)\`, smooth-scroll to an id that ACTUALLY exists on the page, mutate cart state, navigate to one of the 3 real URLs above, or open a real on-page modal/form you also render.
4. If a conventional link has no real destination (e.g. Privacy, Terms, Instagram), render it as plain NON-interactive text (a \`<span>\`), not a clickable dead link.${bookingRule}

CRITICAL INTERACTION RULES:
- Product click → \`window.top.location.href = "/p/" + id;\` (the themed, store-scoped product detail page).
- "Add to Cart" must update a real in-component cart state (count/badge with a bump animation + toast) and may then offer "/cart".${interactionBookingLine}

FINAL SELF-CHECK before you output (fix anything that fails): unique & on-brand (not a template) · accent color & radius applied consistently · motion present and reduced-motion-safe · fully responsive incl. working mobile menu · AA contrast & semantic/aria correct · zero ghost links · zero hardcoded catalog data · empty/loading states present · no // comments in JSX · component named \`App\` with the exact prop signature.

${promptText ? `USER DIRECTIVE / EDIT REQUEST (highest priority — honor this specifically): "${promptText}"` : ''}
`;
};
