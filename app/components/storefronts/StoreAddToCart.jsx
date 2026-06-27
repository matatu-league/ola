'use client';

/**
 * StoreAddToCart — themed add-to-cart CTA for the store-scoped product page.
 * Styled entirely from the vendor theme tokens (var(--s-*)) so it matches the
 * surrounding storefront. Uses the shared CartContext.
 */
import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function StoreAddToCart({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, 1, {});
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      style={{ background: 'var(--s-primary)', color: 'var(--s-on-primary)', borderRadius: 'var(--s-radius)' }}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 font-bold text-[15px] transition-opacity hover:opacity-90 active:scale-[0.98]"
    >
      {added ? <><Check size={18} /> Added to cart</> : <><ShoppingCart size={18} /> Add to cart</>}
    </button>
  );
}
