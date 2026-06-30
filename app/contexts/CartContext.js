// contexts/CartContext.jsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from './UserContext';

const CartContext = createContext(null);

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('cart_session_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('cart_session_id', id);
  }
  return id;
}

function getUserFromCookie() {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.split('; ').find(r => r.startsWith('user_session='));
    if (!match) return null;
    const raw = decodeURIComponent(match.split('=')[1]);
    return JSON.parse(raw.startsWith('%7B') ? decodeURIComponent(raw) : raw);
  } catch { return null; }
}

function mergeItems(localItems, backendItems) {
  const map = new Map();
  for (const item of localItems)  map.set(item.id, item);
  for (const item of backendItems) map.set(item.id, item); // backend wins on conflict
  return Array.from(map.values());
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  // Get user from central context instead of parsing cookie directly
  const { user } = useUser();

  const [cartItems,    setCartItemsState] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen]  = useState(false);
  const [isSyncing,    setIsSyncing]     = useState(false);
  // True once the first load (localStorage + backend attempt) has settled. UIs
  // (e.g. checkout) MUST wait for this before deciding the cart is "empty" —
  // otherwise they flash an empty state during the hydration gap.
  const [isHydrated,   setIsHydrated]    = useState(false);

  const syncTimerRef = useRef(null);
  const hasMergedRef = useRef(false);

  // ── Load cart: instant from localStorage, then reconcile with the backend ──
  // Re-runs when the identity changes (guest → logged-in) so a returning user
  // sees their server-side cart on the same (or any) vendor site.
  const loadCart = useCallback(async () => {
    try {
      const local = localStorage.getItem('cart_items');
      if (local) setCartItemsState(JSON.parse(local));
    } catch (_) {}

    const sessionId = getSessionId();
    const query     = user ? `userId=${user.id}` : `sessionId=${sessionId}`;

    try {
      const res  = await fetch(`/api/cart?${query}`);
      const data = await res.json();
      if (data.success && data.data?.items?.length) {
        const backendItems = data.data.items.map(item => ({
          id:              `${item.product._id}-${JSON.stringify(item.variants || {})}`,
          product:         item.product,
          quantity:        item.quantity,
          priceAtAddition: item.priceAtAddition,
          variants:        item.variants || {},
        }));
        setCartItemsState(prev => {
          const merged = mergeItems(prev, backendItems);
          // Persist the reconciled cart so a full-page handoff (e.g. storefront
          // → /checkout) reads a complete cart and never an empty one.
          try { localStorage.setItem('cart_items', JSON.stringify(merged)); } catch (_) {}
          return merged;
        });
      }
    } catch (_) {
      // Offline — localStorage only
    } finally {
      setIsHydrated(true);
    }
  }, [user?.id]);

  useEffect(() => { loadCart(); }, [loadCart]);

  // ── Merge the guest cart into the user cart when they log in, THEN reload ──
  // Depends on the user id so it fires on the login transition (the checkout
  // case), not only on first mount — otherwise the guest cart is orphaned and
  // the items "disappear" after sign-in.
  useEffect(() => {
    if (!user?.id || hasMergedRef.current) return;
    hasMergedRef.current = true;
    const sessionId = getSessionId();
    (async () => {
      try {
        await fetch('/api/cart/merge', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ userId: user.id, sessionId }),
        });
      } catch (_) {}
      loadCart(); // reflect the merged server cart in the UI
    })();
  }, [user?.id, loadCart]);

  // ── Debounced backend sync ────────────────────────────────────────────────
  const syncToBackend = useCallback((items) => {
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      // user comes from useUser() context above
      const sessionId = getSessionId();
      setIsSyncing(true);
      try {
        await fetch('/api/cart', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            userId:    user?.id   || null,
            sessionId: user       ? null : sessionId,
            items,
          }),
        });
      } catch (_) {}
      finally { setIsSyncing(false); }
    }, 800);
  }, []);

  // ── Internal setter — updates state + localStorage + backend ─────────────
  const setCartItems = useCallback((updater) => {
    setCartItemsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('cart_items', JSON.stringify(next));
      syncToBackend(next);
      return next;
    });
  }, [syncToBackend]);

  // ── Cart operations ───────────────────────────────────────────────────────
  const addToCart = useCallback((product, quantity = 1, variants = {}) => {
    const itemId = `${product._id}-${JSON.stringify(variants)}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      const price = product.isFlashItem && product.flashSalePrice
        ? product.flashSalePrice
        : product.price;
      return [...prev, { id: itemId, product, quantity, priceAtAddition: price, variants }];
    });
  }, [setCartItems]);

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  }, [setCartItems]);

  const updateQuantity = useCallback((itemId, newQty) => {
    if (newQty < 1) { removeFromCart(itemId); return; }
    setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
  }, [setCartItems, removeFromCart]);

  const clearCart = useCallback(async () => {
    setCartItemsState([]);
    localStorage.removeItem('cart_items');
    // user comes from useUser() context above
    const sessionId = getSessionId();
    const query     = user ? `userId=${user.id}` : `sessionId=${sessionId}`;
    try {
      await fetch(`/api/cart?${query}`, { method: 'DELETE' });
    } catch (_) {}
  }, []);

  // ── Drawer controls ───────────────────────────────────────────────────────
  const openDrawer   = useCallback(() => setIsDrawerOpen(true),         []);
  const closeDrawer  = useCallback(() => setIsDrawerOpen(false),        []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

  // ── Derived values ────────────────────────────────────────────────────────
  const cartTotal = cartItems.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      setCartItems,     // exposed for cart recovery page
      cartTotal,
      cartCount,
      isHydrated,       // false until the first cart load settles (avoid empty flash)
      isDrawerOpen,
      isSyncing,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      openDrawer,
      closeDrawer,
      toggleDrawer,     // used by TopNav cart icon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};