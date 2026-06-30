// ─── Storefront ⇄ system bridge (runs INSIDE the generated-template iframe) ──────
//
// The AI storefront template renders inside a sandboxed `srcDoc` iframe that is
// `allow-same-origin`, so it shares the parent app's localStorage and cookies.
// This bridge is injected into that iframe and exposes `window.__OLA__` — the
// ONE place that knows how to talk to the real system:
//
//   • CART      — reads/writes the SAME `localStorage['cart_items']` shape that
//                 CartContext uses, so the real cart drawer, /cart and /checkout
//                 pages pick up exactly what the template added. Also best-effort
//                 syncs to /api/cart so a logged-in/guest backend cart matches.
//   • AUTH      — reads the shared `user_session` cookie so the template can greet
//                 a signed-in shopper; the real pages stay the source of truth.
//   • HANDOFF   — checkout/cart/product navigations move the TOP frame to the real
//                 themed system routes (/checkout, /cart, /p/<id>) where Google
//                 login, address autocomplete, payment gateways and order-to-DB
//                 already live. We do NOT re-implement checkout in the template.
//
// Keep this string free of backticks and `${` so it embeds cleanly inside the
// iframe-building template literals in Storefront.jsx / the theme builder.

/**
 * @param {{ storeId?: string|null, live?: boolean }} cfg
 *   live=true  → real storefront (Storefront.jsx): real top-frame handoff.
 *   live=false → theme-builder preview: cart works locally, checkout is a polite
 *                no-op so designers can click through without leaving the editor.
 * @returns {string} JS to inject into the iframe (before the template code).
 */
export function olaBridgeScript({ storeId = null, live = false } = {}) {
  const cfg = JSON.stringify({ storeId: storeId || null, live: !!live });
  return `
;(function(){
  var CFG = ${cfg};
  var KEY = 'cart_items', SID = 'cart_session_id';
  function uuid(){ try { return crypto.randomUUID(); } catch(e){ return 'sid-' + Date.now() + '-' + Math.random().toString(16).slice(2); } }
  function sessionId(){ try { var s = localStorage.getItem(SID); if(!s){ s = uuid(); localStorage.setItem(SID, s); } return s; } catch(e){ return null; } }
  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; } }
  function write(items){ try { localStorage.setItem(KEY, JSON.stringify(items)); } catch(e){} try { window.dispatchEvent(new CustomEvent('ola:cart', { detail: items })); } catch(e){} return items; }
  function num(x){ var n = (typeof x === 'number') ? x : parseFloat(String(x == null ? '' : x).replace(/[^0-9.-]+/g, '')); return isNaN(n) ? 0 : n; }
  function getUser(){ try { var m = document.cookie.split('; ').find(function(r){ return r.indexOf('user_session=') === 0; }); if(!m) return null; var raw = decodeURIComponent(m.split('=')[1]).replace(/^"|"$/g, ''); if(raw.indexOf('%7B') === 0) raw = decodeURIComponent(raw); return JSON.parse(raw); } catch(e){ return null; } }
  function norm(p){
    p = p || {};
    var id = (p._id || p.id || '').toString();
    var images = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
    return { _id: id, storeId: (p.storeId || CFG.storeId || null), title: (p.title || p.name || ''), images: images, price: num(p.price) };
  }
  function syncBackend(items){
    try {
      var u = getUser();
      fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u ? u.id : null, sessionId: u ? null : sessionId(), items: items }) }).catch(function(){});
    } catch(e){}
  }
  function nav(path){ try { if (CFG.live && window.top) { window.top.location.href = path; } else { window.location.href = path; } } catch(e){ try { window.location.href = path; } catch(_){} } }
  var api = {
    config: CFG,
    getUser: getUser,
    getCart: function(){ return read(); },
    cartCount: function(){ return read().reduce(function(s,i){ return s + (i.quantity || 0); }, 0); },
    cartTotal: function(){ return read().reduce(function(s,i){ return s + num(i.priceAtAddition) * (i.quantity || 0); }, 0); },
    addToCart: function(product, quantity, variants){
      quantity = quantity || 1; variants = variants || {};
      var prod = norm(product);
      if(!prod._id) return read();
      var itemId = prod._id + '-' + JSON.stringify(variants);
      var items = read();
      var ex = items.filter(function(i){ return i.id === itemId; })[0];
      if(ex){ ex.quantity += quantity; }
      else { items.push({ id: itemId, product: prod, quantity: quantity, priceAtAddition: prod.price, variants: variants }); }
      write(items); syncBackend(items);
      return items;
    },
    updateQty: function(itemId, qty){
      var items = read();
      if(qty < 1){ items = items.filter(function(i){ return i.id !== itemId; }); }
      else { var it = items.filter(function(i){ return i.id === itemId; })[0]; if(it) it.quantity = qty; }
      write(items); syncBackend(items); return items;
    },
    removeFromCart: function(itemId){ var items = read().filter(function(i){ return i.id !== itemId; }); write(items); syncBackend(items); return items; },
    clearCart: function(){ write([]); return []; },
    onCartChange: function(cb){ var h = function(e){ try { cb(e.detail || read()); } catch(_){} }; window.addEventListener('ola:cart', h); window.addEventListener('storage', function(e){ if(e.key === KEY) cb(read()); }); return function(){ window.removeEventListener('ola:cart', h); }; },
    checkout: function(){ if(CFG.live){ nav('/checkout'); } else { try { console.info('[OLA preview] Checkout → real themed system checkout (sign-in, address autocomplete, payment) on the live store.'); window.dispatchEvent(new CustomEvent('ola:checkout-preview')); } catch(e){} } },
    viewCart: function(){ if(CFG.live){ nav('/cart'); } },
    viewProduct: function(id){ if(CFG.live && id){ nav('/p/' + id); } }
  };
  window.__OLA__ = api;
})();
`;
}
