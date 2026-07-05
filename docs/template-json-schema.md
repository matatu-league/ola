# Ola Storefront Template — JSON Schema (v1 spec)

A structured, safe alternative to storing generated storefronts as raw JSX. The
AI emits **JSON**, a fixed renderer turns it into React. It carries **everything
needed to reproduce a fully custom look**: the exact Tailwind classes per node,
interactions (what happens on click/hover), detailed backgrounds and linear/
radial gradients, motion, and data binding.

> Guiding rule: **the JSON is self-sufficient.** If a look needs a class, a
> gradient, or an interaction, it is written explicitly in the node — the
> renderer never "guesses". Freedom comes from raw Tailwind + inline style
> escape hatches; safety comes from a closed set of node types, action verbs
> and motion tokens.

---

## 1. Document shape

```jsonc
{
  "version": 1,
  "meta": { "name": "VoltEdge — Electronics", "category": "electronics", "businessType": "both" },

  // Theme tokens — referenced by classes as bg-[var(--s-primary)] etc.
  "tokens": {
    "primary": "#FE2C55", "onPrimary": "#ffffff", "accent": "#2563EB",
    "bg": "#0b0b0f", "surface": "#16161c", "text": "#f5f5f7", "muted": "#9b9ba3",
    "border": "#2a2a32", "radius": "14px", "font": "Poppins, system-ui, sans-serif",
    "mode": "dark"
  },

  // A single <style> the renderer injects once (keyframes + reduced-motion).
  "styles": { "keyframes": ["fadeUp", "float", "shimmer"] },

  // Ordered top-level sections.
  "sections": [ /* Node[] */ ]
}
```

The renderer maps `tokens` → CSS variables (`--s-primary`, `--s-radius`, …), so
any node can use `bg-[var(--s-primary)]`, `rounded-[var(--s-radius)]`, etc.

---

## 2. Node model (the core)

Every visual element is a **Node**. Nodes nest via `children`.

```jsonc
{
  "type": "box",              // see §3 for the closed type list
  "as": "section",            // optional semantic tag: section|header|nav|main|footer|h1..h6|p|ul|li|a|button|span

  // ── STYLING ──────────────────────────────────────────────────────────────
  // The FULL Tailwind class string, exactly as it should render — including
  // responsive (md:), state (hover:/focus-visible:/active:/group-hover:),
  // arbitrary values (bg-[#0b0b0f], text-[clamp(2rem,6vw,4rem)]) and gradients.
  "class": "relative flex flex-col gap-4 px-6 md:px-10 py-16 md:py-24 bg-[var(--s-bg)] text-[var(--s-text)] rounded-[var(--s-radius)] overflow-hidden",

  // Optional inline style for things Tailwind can't express cleanly (dynamic
  // gradients, animation timing, clip-path, background-image URLs). CSS keys.
  "style": {
    "backgroundImage": "linear-gradient(135deg, var(--s-bg) 0%, #1d1f2b 55%, #3a0d1a 100%)",
    "animation": "fadeUp .7s ease-out both"
  },

  // Optional structured background (renderer converts to class/style). Use when
  // the AI prefers declarative over raw CSS. `class`/`style` still win if set.
  "background": {
    "kind": "linear-gradient",              // solid | linear-gradient | radial-gradient | image | mesh
    "angle": 135,
    "stops": [ { "color": "#0b0b0f", "at": "0%" }, { "color": "#3a0d1a", "at": "100%" } ]
    // image: { "kind": "image", "src": "loremflickr:electronics,dark", "overlay": "rgba(0,0,0,.45)", "fit": "cover" }
  },

  // ── CONTENT ──────────────────────────────────────────────────────────────
  "text": "Shop the future",                 // literal text, OR a binding (see §5): "{{item.name}}"
  "attrs": { "alt": "{{item.name}}", "aria-label": "Add to cart", "loading": "lazy" },
  "children": [ /* Node[] */ ],

  // ── INTERACTIONS ─────────────────────────────────────────────────────────
  "on": {
    "click": [ { "action": "addToCart", "product": "{{item}}" }, { "action": "toast", "text": "Added" } ],
    "hover": [ { "action": "setState", "key": "hovered", "value": true } ]
  },

  // ── MOTION (token, not raw) ──────────────────────────────────────────────
  "motion": { "enter": "fade-up", "delay": 80, "hover": "lift", "scroll": "reveal" },

  // ── DATA (repeaters) ─────────────────────────────────────────────────────
  "repeat": { "source": "products", "as": "item", "limit": 12, "empty": { /* Node shown when list is empty */ } }
}
```

### Styling: how Tailwind classes are carried
- `class` is the **primary** styling channel and holds the **complete** Tailwind
  string, including every variant needed (`md:grid-cols-3`, `hover:-translate-y-1`,
  `focus-visible:ring-2`, `group-hover:scale-105`, arbitrary `bg-[...]`,
  `text-[clamp(...)]`). Nothing is implied — if a class is needed, it's present.
- Gradients are just Tailwind: `bg-gradient-to-br from-[#0b0b0f] via-[#1d1f2b] to-[#3a0d1a]` — or use `style.backgroundImage`/`background` for token-driven or multi-stop gradients Tailwind can't express.
- `style` is the escape hatch for dynamic/complex CSS (animation timing, clip-path, filters, background-image URLs).
- Because arbitrary values are allowed, the renderer requires Tailwind's JIT (already loaded via the CDN in the storefront iframe) OR a safelist step at build time.

---

## 3. Closed node-type catalog (safe surface)

Layout/primitives: `box` · `text` · `image` · `icon` · `button` · `link` ·
`input` · `divider` · `spacer` · `style-block`.

Commerce/section components (render real, wired behaviour): `hero` ·
`productGrid` · `productCard` · `serviceMenu` · `serviceCard` · `categoryRail` ·
`gallery` · `cartDrawer` · `navbar` · `footer` · `banner` · `stats` ·
`testimonials` · `faq` · `bookingForm` · `modal` · `tabs`.

Each section component accepts a small, typed `props` object AND still supports
`class`/`style`/`motion`/`on`, so it's themable but never free-form-unsafe. New
capabilities are added by adding a type here (and, per your AI-commands feature,
a category command can restrict which types/sections an industry may use).

### `tabs` and `modal` — the in-page switching primitives

There is NO routing of any kind — the runtime never reads or writes the URL.
The 4 view names (`#/`, `#/shop`, `#/product/<id>`, `#/page/<slug>` — familiar
spellings, but purely in-memory state switched like tabs) are the only
top-level views; everything else that looks like "switching content" is one of
these two client-state-only primitives — never a new route. The single
interaction that ever leaves the page is the checkout handoff:

- **`tabs`**: `{ "type": "tabs", "attrs": { "key": "pdpTabs" }, "children": [Node, ...] }`.
  Each direct child is one tab's panel and carries `attrs.tabLabel` (its header
  button text). The runtime renders the tab strip and swaps the active panel
  itself, keyed by `attrs.key` in local state — zero navigation. Use it for PDP
  Description/Specifications/Shipping, shop category filters, service
  categories, FAQ groups — anywhere content comes in labelled variants.
- **`modal`**: `{ "type": "modal", "attrs": { "id": "booking" }, "children": [Node, ...] }`,
  shown via the `openModal {"id":"booking"}` action and hidden via `closeModal`.
  Use for booking forms, quick-view, filters, confirmations, image lightboxes.
- **Cart** is always the built-in `cartDrawer` node (route `"*"`) — never a
  route, never a modal you build yourself.
- **Custom pages** (About, FAQ, Shipping policy, …) are vendor-authored content
  managed from the AI Theme Builder — never an independent Next.js route (that
  would reintroduce the exact routing issues this architecture exists to
  avoid). ONE section with `route: "page"` handles every custom page, exactly
  like the `product` route handles every product: it resolves `{{page.title}}`
  / `{{page.content}}` by slug from the `pages` data source, reached via
  `navigate {"to":"#/page/<slug>"}`.

---

## 4. Interactions — closed action verbs

Events: `click`, `hover`, `submit`, `change`, `load`, `inview`. Each holds an
ordered array of **actions**. Every action maps to the runtime (the hash router
+ the `window.__OLA__` bridge already in the storefront):

| action | params | effect |
| --- | --- | --- |
| `navigate` | `to` (`#/shop`, `#/product/{{item.id}}`) | hash route (in-page) |
| `openDrawer` / `closeDrawer` | — | cart drawer |
| `addToCart` | `product`, `qty?`, `variants?` | `__OLA__.addToCart` + badge/toast |
| `buyNow` | `product` | addToCart → `__OLA__.checkout()` |
| `checkout` | — | `__OLA__.checkout()` (real system checkout) |
| `setState` | `key`, `value` | local component state (tabs, gallery index, menu open) |
| `toggle` | `key` | boolean flip |
| `setVariant` | `key`, `value` | selected product variant |
| `scrollTo` | `target` (node id) | smooth-scroll to an existing node |
| `openModal` / `closeModal` | `id` | on-page modal you also declare |
| `toast` | `text` | transient confirmation (aria-live) |
| `external` | `href` | only for real, whitelisted URLs |

Rules the schema enforces: **no ghost actions** (every interactive node must
have at least one real action or be non-interactive), and `navigate.to` must be
a hash route or one of the 3 real URLs (`/p/:id`, `/cart`, `/checkout`).

---

## 5. Data binding

- **Bindings** in any string: `"{{item.name}}"`, `"USh {{item.price}}"`,
  `"{{store.name}}"`. Context: `store`, `products`, `services`, `categories`,
  plus `item`/`index` inside a `repeat`.
- **Repeaters:** `repeat: { source: "products", as: "item", limit, empty }` clones
  the node per record and exposes `{{item.*}}`. Guards missing fields.
- **Conditionals:** `"if": "{{item.compareAtPrice}}"` renders the node only when
  truthy (e.g. a discount badge).

---

## 6. Motion tokens (smooth + safe)

`motion.enter`: `fade` · `fade-up` · `fade-down` · `scale-in` · `slide-left` ·
`slide-right`. `motion.scroll`: `reveal` (IntersectionObserver). `motion.hover`:
`lift` · `zoom` · `glow` · `underline`. Plus `delay` (ms) and `duration`/`easing`
overrides, and `ambient`: `float` · `marquee` · `parallax` · `gradient-shift`.

Each token maps to a **real** CSS/keyframe implementation in the renderer, so
motion is consistent and **always** `prefers-reduced-motion`-safe. The model
can't emit motion that breaks the page.

---

## 7. Worked example (hero + product grid)

```jsonc
{
  "type": "hero",
  "as": "section",
  "class": "relative isolate px-6 md:px-12 py-20 md:py-28 text-[var(--s-text)] overflow-hidden",
  "style": { "backgroundImage": "linear-gradient(135deg,#0b0b0f 0%,#1d1f2b 55%,#3a0d1a 100%)" },
  "motion": { "enter": "fade-up" },
  "children": [
    { "type": "text", "as": "h1",
      "class": "font-black tracking-tight leading-[1.05] text-[clamp(2.25rem,6vw,4.5rem)]",
      "text": "Power your world, {{store.name}}" },
    { "type": "button",
      "class": "mt-6 inline-flex items-center gap-2 bg-[var(--s-primary)] text-[var(--s-on-primary)] font-bold px-6 py-3 rounded-[var(--s-radius)] transition-transform active:scale-95 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--s-primary)]",
      "text": "Shop now",
      "on": { "click": [ { "action": "navigate", "to": "#/shop" } ] } }
  ]
},
{
  "type": "productGrid",
  "as": "section",
  "class": "px-6 md:px-12 py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
  "repeat": { "source": "products", "as": "item", "limit": 12,
    "empty": { "type": "text", "class": "col-span-full text-center text-[var(--s-muted)] py-16", "text": "New products coming soon." } },
  "children": [
    { "type": "productCard",
      "class": "group flex flex-col bg-[var(--s-surface)] border border-[var(--s-border)] rounded-[var(--s-radius)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl",
      "motion": { "scroll": "reveal" },
      "on": { "click": [ { "action": "navigate", "to": "#/product/{{item.id}}" } ] },
      "children": [
        { "type": "image", "class": "aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105",
          "attrs": { "src": "{{item.image}}", "alt": "{{item.name}}", "loading": "lazy" } },
        { "type": "text", "as": "h3", "class": "px-3 pt-3 font-semibold line-clamp-1", "text": "{{item.name}}", "attrs": { "title": "{{item.name}}" } },
        { "type": "text", "class": "px-3 text-[var(--s-primary)] font-bold", "text": "USh {{item.price}}" },
        { "type": "button", "class": "m-3 mt-auto rounded-[var(--s-radius)] bg-[var(--s-primary)] text-[var(--s-on-primary)] font-bold py-2 active:scale-95",
          "text": "Add to cart",
          "on": { "click": [ { "action": "addToCart", "product": "{{item}}" }, { "action": "openDrawer" } ] } }
      ]
    }
  ]
}
```

---

## 8. Validation & rollout

- Ship a **JSON Schema** (Ajv) the AI output must pass; on failure, one retry
  with the errors fed back. This is the big reliability win over free JSX.
- Store on `Store` as `templateJson` with `templateFormat: 'jsx' | 'json'`
  (default `jsx` — existing stores unaffected). New/opted-in stores render JSON.
- Renderer = one `<TemplateRenderer doc={json} data={{store,products,services}}/>`
  that walks the tree, applies `class`/`style`/`background`, wires `on` actions
  to the hash router + `__OLA__`, and applies `motion` tokens. SSR-able → real
  SEO (unlike today's iframe).
- Per-industry **AI commands** (already shipped) can declare the allowed section
  types / motion vocabulary for a category, keeping output on-brand and bounded.

---

### TL;DR
Yes — put the **exact Tailwind classes** on every node (`class`), allow an inline
`style` + structured `background` for gradients/dynamic CSS, express **interactions**
as a closed set of **action verbs** on events, and **motion** as tokens. That's
enough to reproduce fully-custom, animated storefronts — safely, SSR-friendly,
and cheaper to generate — while a fixed renderer + schema keep it robust.
