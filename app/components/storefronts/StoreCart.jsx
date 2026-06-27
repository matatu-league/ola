'use client';

/**
 * StoreCart — themed, single-vendor cart for a store's buyer flow.
 * Shows only the items belonging to this store (the marketplace keeps its own
 * cross-store cart). Styled entirely from the vendor theme tokens.
 */
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function StoreCart({ storeId, storeTitle }) {
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const items = cartItems.filter(
    (i) => !storeId || String(i.product?.storeId) === String(storeId),
  );
  const subtotal = items.reduce((sum, i) => sum + Number(i.priceAtAddition || 0) * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
        <ShoppingBag size={40} style={{ color: 'var(--s-muted)' }} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--s-text)' }}>Your cart is empty</h1>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--s-muted)' }}>
          Add items from {storeTitle || 'this store'} to get started.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 font-bold text-[14px]"
          style={{ background: 'var(--s-primary)', color: 'var(--s-on-primary)', borderRadius: 'var(--s-radius)' }}
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--s-text)' }}>
        Your cart {storeTitle ? `· ${storeTitle}` : ''}
      </h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-3 border"
            style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)', background: 'var(--s-surface)' }}
          >
            <div
              className="w-16 h-16 shrink-0 overflow-hidden border"
              style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)' }}
            >
              {item.product?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--s-text)' }}>
                {item.product?.title || 'Item'}
              </p>
              <p className="text-[13px] font-bold mt-0.5" style={{ color: 'var(--s-primary)' }}>
                USh {Number(item.priceAtAddition || 0).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 flex items-center justify-center border"
                style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)', color: 'var(--s-text)' }}
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-[14px] font-semibold" style={{ color: 'var(--s-text)' }}>
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 flex items-center justify-center border"
                style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)', color: 'var(--s-text)' }}
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeFromCart(item.id)}
              className="p-1.5"
              style={{ color: 'var(--s-muted)' }}
              aria-label="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div
        className="mt-6 p-4 border flex items-center justify-between"
        style={{ borderColor: 'var(--s-border)', borderRadius: 'var(--s-radius)' }}
      >
        <div>
          <p className="text-[12px]" style={{ color: 'var(--s-muted)' }}>Subtotal</p>
          <p className="text-xl font-black" style={{ color: 'var(--s-text)' }}>
            USh {subtotal.toLocaleString()}
          </p>
        </div>
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 px-7 py-3 font-bold text-[14px]"
          style={{ background: 'var(--s-primary)', color: 'var(--s-on-primary)', borderRadius: 'var(--s-radius)' }}
        >
          Checkout <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
