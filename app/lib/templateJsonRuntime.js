// ─── JSON storefront template — runtime renderer ─────────────────────────────
//
// Renders a validated template document (docs/template-json-schema.md) inside
// the storefront iframe with plain React.createElement — NO Babel, no JSX
// compile. The renderer is a fixed, trusted engine: the AI's JSON carries the
// full Tailwind classes / backgrounds / actions / motion tokens, and this file
// turns them into a working single-page storefront wired to the hash router and
// the window.__OLA__ system bridge (shared cart, real checkout).
//
// `olaJsonRuntime` below is authored as a REAL function (so it is lint/build
// checked) and embedded into the iframe via .toString(). It must stay fully
// self-contained: no imports, no closures over module scope, no backticks.

import { olaBridgeScript } from '@/lib/storefrontBridge';

/* eslint-disable prefer-template, no-var */
function olaJsonRuntime() {
  var doc  = window.__OLA_DOC__  || {};
  var data = window.__OLA_DATA__ || {};
  var R = window.React;
  var D = window.ReactDOM;
  var h = R.createElement;

  // ── Tokens → CSS variables + base/motion styles ────────────────────────────
  function kebab(k) { return k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); }
  var tokens = doc.tokens || {};
  var vars = '';
  Object.keys(tokens).forEach(function (k) {
    if (typeof tokens[k] === 'string') vars += '--s-' + kebab(k) + ':' + tokens[k] + ';';
  });
  var baseCss =
    ':root{' + vars + '}' +
    'body{margin:0;background:var(--s-bg,#fff);color:var(--s-text,#111);font-family:var(--s-font,system-ui,sans-serif);-webkit-font-smoothing:antialiased}' +
    '@keyframes olaFade{from{opacity:0}to{opacity:1}}' +
    '@keyframes olaFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}' +
    '@keyframes olaFadeDown{from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}}' +
    '@keyframes olaScaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}' +
    '@keyframes olaSlideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}' +
    '@keyframes olaSlideRight{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}' +
    '@keyframes olaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}' +
    '@keyframes olaDrawer{from{transform:translateX(100%)}to{transform:none}}' +
    '[data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}' +
    '[data-reveal].olaR-in{opacity:1;transform:none}' +
    '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}[data-reveal]{opacity:1;transform:none}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = baseCss;
  document.head.appendChild(styleEl);

  var ENTER = {
    'fade': 'olaFade', 'fade-up': 'olaFadeUp', 'fade-down': 'olaFadeDown',
    'scale-in': 'olaScaleIn', 'slide-left': 'olaSlideLeft', 'slide-right': 'olaSlideRight',
  };
  var HOVER = {
    lift: ' transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl',
    zoom: ' transition-transform duration-500 hover:scale-105',
    glow: ' transition-shadow duration-300 hover:shadow-2xl',
    underline: ' underline-offset-4 hover:underline',
  };
  var TAGS = {
    box: 'div', text: 'span', image: 'img', button: 'button', link: 'a',
    input: 'input', divider: 'hr', spacer: 'div', hero: 'section',
    section: 'section', navbar: 'header', footer: 'footer', banner: 'section',
    stats: 'section', testimonials: 'section', faq: 'section',
    productGrid: 'section', productCard: 'article', serviceMenu: 'section',
    serviceCard: 'article', categoryRail: 'section', gallery: 'section',
    bookingForm: 'form',
  };

  // ── Bindings ("{{path|pipe}}") ─────────────────────────────────────────────
  function lookup(path, ctx) {
    var neg = false;
    if (path.charAt(0) === '!') { neg = true; path = path.slice(1); }
    var parts = path.trim().split('.');
    var cur = ctx;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) break;
      cur = cur[parts[i]];
    }
    return neg ? !cur : cur;
  }
  function pipe(val, name) {
    if (name === 'money') { var n = Number(val || 0); return isNaN(n) ? '0' : n.toLocaleString(); }
    return val;
  }
  function resolve(str, ctx) {
    if (typeof str !== 'string') return str;
    var single = str.match(/^\{\{\s*([^}|]+?)(?:\|(\w+))?\s*\}\}$/);
    if (single) {
      var v = lookup(single[1], ctx);
      return single[2] ? pipe(v, single[2]) : v;
    }
    return str.replace(/\{\{\s*([^}|]+?)(?:\|(\w+))?\s*\}\}/g, function (_, p, f) {
      var v = lookup(p, ctx);
      if (f) v = pipe(v, f);
      return v == null ? '' : String(v);
    });
  }

  // ── Background object → inline style ──────────────────────────────────────
  function bgStyle(bg) {
    if (!bg || typeof bg !== 'object') return null;
    var s = {};
    if (bg.kind === 'solid' && bg.color) s.background = bg.color;
    else if ((bg.kind === 'linear-gradient' || bg.kind === 'radial-gradient') && Array.isArray(bg.stops)) {
      var stops = bg.stops.map(function (st) { return st.color + (st.at ? ' ' + st.at : ''); }).join(', ');
      s.backgroundImage = bg.kind === 'linear-gradient'
        ? 'linear-gradient(' + (bg.angle != null ? bg.angle + 'deg, ' : '135deg, ') + stops + ')'
        : 'radial-gradient(circle, ' + stops + ')';
    } else if (bg.kind === 'image' && bg.src) {
      var url = 'url("' + bg.src + '")';
      s.backgroundImage = bg.overlay
        ? 'linear-gradient(' + bg.overlay + ', ' + bg.overlay + '), ' + url
        : url;
      s.backgroundSize = bg.fit || 'cover';
      s.backgroundPosition = 'center';
    }
    return s;
  }

  // ── App ────────────────────────────────────────────────────────────────────
  function parseHash() {
    var hRaw = (window.location.hash || '#/').replace(/^#\/?/, '');
    var seg = hRaw.split('/');
    if (seg[0] === 'product' && seg[1]) return { view: 'product', id: decodeURIComponent(seg[1]) };
    if (seg[0] === 'shop') return { view: 'shop', id: null };
    return { view: 'home', id: null };
  }

  function App() {
    var routeState = R.useState(parseHash());
    var route = routeState[0], setRoute = routeState[1];
    var uiState = R.useState({});
    var ui = uiState[0], setUiObj = uiState[1];
    var cartState = R.useState((window.__OLA__ && window.__OLA__.getCart()) || []);
    var cart = cartState[0], setCart = cartState[1];
    var toastState = R.useState('');
    var toast = toastState[0], setToast = toastState[1];

    function setUi(key, value) {
      setUiObj(function (prev) { var n = {}; Object.keys(prev).forEach(function (k) { n[k] = prev[k]; }); n[key] = value; return n; });
    }

    R.useEffect(function () {
      function onHash() { setRoute(parseHash()); window.scrollTo(0, 0); }
      window.addEventListener('hashchange', onHash);
      var off = window.__OLA__ && window.__OLA__.onCartChange
        ? window.__OLA__.onCartChange(function (items) { setCart(items || []); })
        : null;
      function onKey(e) { if (e.key === 'Escape') { setUi('__drawer', false); } }
      window.addEventListener('keydown', onKey);
      return function () {
        window.removeEventListener('hashchange', onHash);
        window.removeEventListener('keydown', onKey);
        if (off) off();
      };
    }, []);

    // Scroll-reveal: observe any not-yet-revealed nodes after each render.
    R.useEffect(function () {
      var els = document.querySelectorAll('[data-reveal]:not(.olaR-in)');
      if (!els.length || !window.IntersectionObserver) {
        els.forEach && els.forEach(function (el) { el.classList.add('olaR-in'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('olaR-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
      return function () { io.disconnect(); };
    });

    var products = data.products || [];
    var product = route.view === 'product'
      ? products.filter(function (p) { return String(p.id) === String(route.id) || String(p._id) === String(route.id); })[0] || null
      : null;
    var cartCount = cart.reduce(function (s, i) { return s + (i.quantity || 0); }, 0);
    var cartTotal = cart.reduce(function (s, i) { return s + (Number(i.priceAtAddition) || 0) * (i.quantity || 0); }, 0);

    var ctx = {
      store: {
        name: data.storeName || '', logo: data.storeLogo || '',
        email: data.contactEmail || '', phone: data.contactPhone || '',
      },
      products: products,
      services: data.services || [],
      categories: data.categories || [],
      related: product ? products.filter(function (p) { return p !== product; }).slice(0, 8) : products.slice(0, 8),
      product: product,
      route: route,
      state: ui,
      cart: cart,
      cartCount: cartCount,
      cartTotal: cartTotal,
    };

    function flash(text) {
      setToast(text || 'Done');
      setTimeout(function () { setToast(''); }, 2200);
    }

    function runActions(actions, ctx2, e) {
      (actions || []).forEach(function (a) {
        if (!a || !a.action) return;
        var O = window.__OLA__;
        switch (a.action) {
          case 'navigate': {
            var to = String(resolve(a.to || '#/', ctx2) || '#/');
            window.location.hash = to.charAt(0) === '#' ? to.slice(1) : to;
            break;
          }
          case 'openDrawer': setUi('__drawer', true); break;
          case 'closeDrawer': setUi('__drawer', false); break;
          case 'addToCart': {
            var prod = typeof a.product === 'string' ? resolve(a.product, ctx2) : (a.product || ctx2.item || ctx2.product);
            if (O && prod) { O.addToCart(prod, Number(resolve(a.qty, ctx2)) || 1, a.variants || {}); setCart(O.getCart()); flash('Added to cart'); setUi('__drawer', true); }
            break;
          }
          case 'buyNow': {
            var bp = typeof a.product === 'string' ? resolve(a.product, ctx2) : (a.product || ctx2.item || ctx2.product);
            if (O && bp) { O.addToCart(bp, 1, a.variants || {}); O.checkout(); }
            break;
          }
          case 'checkout': if (O) O.checkout(); break;
          case 'setState': setUi(String(a.key || ''), resolve(a.value, ctx2)); break;
          case 'toggle': setUi(String(a.key || ''), !ctx2.state[String(a.key || '')]); break;
          case 'setVariant': setUi('variant:' + String(a.key || ''), resolve(a.value, ctx2)); break;
          case 'scrollTo': {
            var el = document.getElementById(String(resolve(a.target, ctx2) || ''));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            break;
          }
          case 'openModal': setUi('modal:' + String(a.id || ''), true); break;
          case 'closeModal': setUi('modal:' + String(a.id || ''), false); break;
          case 'toast': flash(String(resolve(a.text, ctx2) || '')); break;
          case 'external': {
            var href = String(resolve(a.href, ctx2) || '');
            if (!href) break;
            try { window.top.location.href = href; } catch (_) { window.location.href = href; }
            break;
          }
          default: break;
        }
      });
    }

    // ── Built-in cart drawer (always correct, themed by tokens) ──────────────
    function cartDrawerEl(node, key) {
      if (!ctx.state.__drawer) return null;
      var panelClass = (node && node.class) ||
        'fixed top-0 right-0 h-full w-[92vw] max-w-[400px] z-50 flex flex-col shadow-2xl';
      return h('div', { key: key },
        h('div', {
          className: 'fixed inset-0 bg-black/50 z-40',
          onClick: function () { setUi('__drawer', false); },
        }),
        h('aside', {
          className: panelClass,
          role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Shopping cart',
          style: { background: 'var(--s-surface,#fff)', color: 'var(--s-text,#111)', animation: 'olaDrawer .3s ease-out both' },
        },
          h('div', { className: 'flex items-center justify-between px-5 py-4 border-b', style: { borderColor: 'var(--s-border,#e5e7eb)' } },
            h('span', { className: 'font-bold text-lg' }, 'Your cart (' + cartCount + ')'),
            h('button', { className: 'text-2xl leading-none px-2', 'aria-label': 'Close cart', onClick: function () { setUi('__drawer', false); } }, '×')),
          cart.length === 0
            ? h('div', { className: 'flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center' },
                h('p', { className: 'font-semibold' }, 'Your cart is empty'),
                h('button', {
                  className: 'mt-2 px-5 py-2 rounded-[var(--s-radius,8px)] font-bold',
                  style: { background: 'var(--s-primary,#111)', color: 'var(--s-on-primary,#fff)' },
                  onClick: function () { setUi('__drawer', false); },
                }, 'Continue shopping'))
            : h('div', { className: 'flex-1 overflow-y-auto px-5 py-4 space-y-4' },
                cart.map(function (it) {
                  var p = it.product || {};
                  var img = (p.images && p.images[0]) || '';
                  return h('div', { key: it.id, className: 'flex gap-3 items-center' },
                    img ? h('img', { src: img, alt: p.title || '', className: 'w-14 h-14 object-cover rounded-[var(--s-radius,8px)]' }) : null,
                    h('div', { className: 'flex-1 min-w-0' },
                      h('p', { className: 'text-sm font-semibold truncate', title: p.title || '' }, p.title || ''),
                      h('p', { className: 'text-xs opacity-70' }, 'USh ' + (Number(it.priceAtAddition || 0)).toLocaleString()),
                      h('div', { className: 'flex items-center gap-2 mt-1' },
                        h('button', { className: 'w-6 h-6 border rounded text-sm', 'aria-label': 'Decrease quantity', onClick: function () { var O = window.__OLA__; if (O) { O.updateQty(it.id, (it.quantity || 1) - 1); setCart(O.getCart()); } } }, '−'),
                        h('span', { className: 'text-sm font-bold w-5 text-center' }, it.quantity || 1),
                        h('button', { className: 'w-6 h-6 border rounded text-sm', 'aria-label': 'Increase quantity', onClick: function () { var O = window.__OLA__; if (O) { O.updateQty(it.id, (it.quantity || 1) + 1); setCart(O.getCart()); } } }, '+'))),
                    h('button', { className: 'text-xs underline opacity-70 shrink-0', onClick: function () { var O = window.__OLA__; if (O) { O.removeFromCart(it.id); setCart(O.getCart()); } } }, 'Remove'));
                })),
          cart.length > 0
            ? h('div', { className: 'px-5 py-4 border-t space-y-3', style: { borderColor: 'var(--s-border,#e5e7eb)' } },
                h('div', { className: 'flex items-center justify-between font-bold' },
                  h('span', null, 'Subtotal'),
                  h('span', null, 'USh ' + cartTotal.toLocaleString())),
                h('button', {
                  className: 'w-full py-3 rounded-[var(--s-radius,8px)] font-bold active:scale-95 transition-transform',
                  style: { background: 'var(--s-primary,#111)', color: 'var(--s-on-primary,#fff)' },
                  onClick: function () { var O = window.__OLA__; if (O) O.checkout(); },
                }, 'Checkout'),
                h('button', { className: 'w-full py-2 text-sm font-semibold opacity-80', onClick: function () { setUi('__drawer', false); } }, 'Continue shopping'))
            : null));
    }

    // ── Generic node renderer ────────────────────────────────────────────────
    function renderNode(node, ctx2, key) {
      if (node == null || typeof node !== 'object') return null;

      if (node.if) {
        var cond = String(node.if);
        var m = cond.match(/^(!?)\{\{\s*([^}]+?)\s*\}\}$/);
        var ok = m ? lookup((m[1] || '') + m[2], ctx2) : lookup(cond, ctx2);
        if (!ok) return null;
      }

      if (node.repeat && node.repeat.source) {
        var src = ctx2[node.repeat.source] || [];
        var limit = node.repeat.limit ? Number(node.repeat.limit) : src.length;
        var list = src.slice(0, limit);
        var asName = node.repeat.as || 'item';
        if (!list.length) {
          return node.repeat.empty ? renderNode(node.repeat.empty, ctx2, key) : null;
        }
        var clone = {};
        Object.keys(node).forEach(function (k) { if (k !== 'repeat') clone[k] = node[k]; });
        return list.map(function (item2, i2) {
          var c3 = {};
          Object.keys(ctx2).forEach(function (k) { c3[k] = ctx2[k]; });
          c3[asName] = item2;
          c3.item = item2; // "{{item}}" always works, whatever the alias
          c3.index = i2;
          return renderNode(clone, c3, (key || 'r') + '-' + i2);
        });
      }

      if (node.type === 'cartDrawer') return cartDrawerEl(node, key);

      if (node.type === 'modal') {
        var mid = (node.attrs && node.attrs.id) || 'modal';
        if (!ctx2.state['modal:' + mid]) return null;
        return h('div', { key: key, className: 'fixed inset-0 z-50 flex items-center justify-center p-4' },
          h('div', { className: 'absolute inset-0 bg-black/60', onClick: function () { setUi('modal:' + mid, false); } }),
          h('div', {
            className: node.class || 'relative w-full max-w-lg rounded-[var(--s-radius,12px)] p-6 shadow-2xl',
            role: 'dialog', 'aria-modal': 'true',
            style: Object.assign({ background: 'var(--s-surface,#fff)', color: 'var(--s-text,#111)' }, node.style || {}),
          },
            h('button', { className: 'absolute top-3 right-4 text-2xl leading-none', 'aria-label': 'Close', onClick: function () { setUi('modal:' + mid, false); } }, '×'),
            (node.children || []).map(function (c, i) { return renderNode(c, ctx2, (key || 'm') + '-' + i); })));
      }

      if (node.type === 'tabs') {
        // A structured, always-in-page tab group — no route/hash change, no
        // reload: just a state index picking which child panel renders. This
        // is the preferred way to switch between content variations (PDP
        // Description/Specs/Shipping, shop category filters, etc.) instead of
        // adding new routes for them.
        var tabsKey = 'tabs:' + ((node.attrs && node.attrs.key) || 'tabs');
        var panels = node.children || [];
        var activeIdx = ctx2.state[tabsKey] || 0;
        if (activeIdx >= panels.length) activeIdx = 0;
        return h('div', { key: key, className: node.class || '' },
          h('div', { className: 'flex gap-1 mb-4', role: 'tablist' },
            panels.map(function (p, i) {
              var isActive = i === activeIdx;
              return h('button', {
                key: 'tab-' + i,
                role: 'tab',
                'aria-selected': isActive,
                className: (p.attrs && p.attrs.tabClass) || ('px-4 py-2 text-sm font-semibold rounded-[var(--s-radius,8px)] transition-colors ' +
                  (isActive ? 'bg-[var(--s-primary,#111)] text-[var(--s-on-primary,#fff)]' : 'text-[var(--s-muted,#888)] hover:text-[var(--s-text,#111)]')),
                onClick: function () { setUi(tabsKey, i); },
              }, (p.attrs && p.attrs.tabLabel) || ('Tab ' + (i + 1)));
            })),
          renderNode(panels[activeIdx], ctx2, (key || 't') + '-panel-' + activeIdx));
      }

      if (node.type === 'icon') {
        var iconName = (node.attrs && node.attrs.name) || 'Circle';
        var Icon = window.__olaIcons ? window.__olaIcons[iconName] : null;
        return Icon
          ? h(Icon, { key: key, size: (node.attrs && node.attrs.size) || 20, className: node.class || '' })
          : null;
      }

      var tag = node.as || TAGS[node.type] || 'div';
      var props = { key: key };

      var cls = resolve(node.class || '', ctx2) || '';
      if (node.motion && node.motion.hover && HOVER[node.motion.hover]) cls += HOVER[node.motion.hover];
      if (cls) props.className = cls;

      var style = {};
      var bs = bgStyle(node.background);
      if (bs) Object.assign(style, bs);
      if (node.style && typeof node.style === 'object') {
        Object.keys(node.style).forEach(function (k) { style[k] = resolve(node.style[k], ctx2); });
      }
      if (node.motion && node.motion.enter && ENTER[node.motion.enter]) {
        style.animation = ENTER[node.motion.enter] + ' .7s ease-out both';
        if (node.motion.delay) style.animationDelay = Number(node.motion.delay) + 'ms';
      }
      if (node.motion && node.motion.ambient === 'float') style.animation = 'olaFloat 5s ease-in-out infinite';
      if (Object.keys(style).length) props.style = style;

      if (node.motion && node.motion.scroll === 'reveal') props['data-reveal'] = '1';

      if (node.attrs && typeof node.attrs === 'object') {
        Object.keys(node.attrs).forEach(function (k) {
          if (k === 'name' || k === 'size') return; // icon-only attrs
          props[k] = resolve(node.attrs[k], ctx2);
        });
      }

      if (node.on && typeof node.on === 'object') {
        var EV = { click: 'onClick', submit: 'onSubmit', change: 'onChange', mouseenter: 'onMouseEnter' };
        Object.keys(node.on).forEach(function (evt) {
          var reactName = EV[evt];
          if (!reactName) return;
          var actions = node.on[evt];
          props[reactName] = function (e) {
            if (evt === 'submit' || (tag === 'a' && evt === 'click')) e.preventDefault();
            runActions(actions, ctx2, e);
          };
        });
      }
      if (tag === 'form' && !props.onSubmit) props.onSubmit = function (e) { e.preventDefault(); flash('Request sent — we will get back to you.'); };
      if (tag === 'img' && !props.onError) {
        props.onError = function (e) { e.target.style.display = 'none'; };
      }

      var kids = [];
      if (node.text != null) kids.push(resolve(String(node.text), ctx2));
      (node.children || []).forEach(function (c, i) { kids.push(renderNode(c, ctx2, (key || 'n') + '-' + i)); });

      if (tag === 'img' || tag === 'input' || tag === 'hr') return h(tag, props);
      return h(tag, props, kids.length ? kids : null);
    }

    // ── Route-filtered top-level sections ─────────────────────────────────────
    function routeName(section) {
      var r = section.route == null ? '*' : String(section.route);
      r = r.replace(/^#\//, '');
      if (r === '' || r === '#/') r = 'home';
      if (r === '*') return '*';
      return r.split('/')[0] || 'home';
    }

    var sections = (doc.sections || []).filter(function (s) {
      var rn = routeName(s);
      return rn === '*' || rn === route.view;
    });

    return h('div', null,
      sections.map(function (s, i) { return renderNode(s, ctx, 'sec-' + i); }),
      toast
        ? h('div', {
            className: 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl',
            style: { background: 'var(--s-primary,#111)', color: 'var(--s-on-primary,#fff)' },
            role: 'status', 'aria-live': 'polite',
          }, toast)
        : null);
  }

  try {
    D.createRoot(document.getElementById('root')).render(h(App));
  } catch (err) {
    document.getElementById('root').innerHTML =
      '<div style="padding:32px;font-family:monospace;color:#b91c1c"><h2>Template error</h2><pre>' +
      String(err && err.message ? err.message : err).replace(/</g, '&lt;') + '</pre></div>';
  }
}
/* eslint-enable prefer-template, no-var */

/**
 * Build the complete iframe srcDoc for a JSON-format storefront.
 * Shared by the LIVE storefront (Storefront.jsx) and the theme-builder preview.
 *
 * @param {object} o
 * @param {object} o.doc     - validated template document
 * @param {object} o.data    - { storeName, storeLogo, contactEmail, contactPhone, products, services, categories, themeColor, … }
 * @param {string} [o.storeId]
 * @param {boolean} [o.live] - true on the real store (real checkout handoff)
 * @returns {string} html
 */
export function buildJsonStorefrontSrcDoc({ doc, data, storeId = null, live = false }) {
  // Neutralise "</script>" inside the embedded JSON.
  const docJson  = JSON.stringify(doc || {}).replace(/</g, '\\u003c');
  const dataJson = JSON.stringify(data || {}).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script>window.react = window.React;</script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>
    <style>
      body { margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // lucide icons with a graceful placeholder for unknown names.
      window.__olaIcons = new Proxy({}, {
        get: function (_, name) {
          var lib = window.LucideReact || window.lucideReact || window.lucide || null;
          var Icon = lib && lib[name];
          if (typeof Icon === 'function' || (Icon && Icon.$$typeof)) return Icon;
          return function (p) {
            p = p || {};
            return window.React.createElement('span', {
              className: p.className,
              style: { display: 'inline-block', width: (p.size || 20) + 'px', height: (p.size || 20) + 'px' }
            });
          };
        }
      });
      ${olaBridgeScript({ storeId: (storeId || '').toString(), live: !!live })}
      window.__OLA_DOC__ = ${docJson};
      window.__OLA_DATA__ = ${dataJson};
      (${olaJsonRuntime.toString()})();
    </script>
  </body>
</html>`;
}
