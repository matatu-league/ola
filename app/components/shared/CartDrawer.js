"use client";

import React, { useEffect, useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer, cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();

  const [isValidating, setIsValidating] = useState(false);
  const [stockError, setStockError]     = useState('');

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      // Clear any previous stock error when drawer reopens
      setStockError('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setStockError('');
    setIsValidating(true);

    try {
      // ── Validate stock availability before leaving the cart ───────────────
      // Sends the current cart items to a lightweight backend endpoint that
      // checks each product's current stock without creating an order.
      // This catches: out-of-stock items, quantity > available stock,
      // deactivated/deleted products, price changes since adding to cart.
      const res = await fetch('/api/cart/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.product._id,
            quantity:  item.quantity,
            price:     item.priceAtAddition,
          })),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Show which item has an issue so the user knows what to fix
        setStockError(data.message || 'Some items in your cart are no longer available.');
        setIsValidating(false);
        return;
      }

      // ── All good — proceed to checkout ────────────────────────────────────
      closeDrawer();
      router.push('/checkout');

    } catch (err) {
      // Network error — don't block checkout, just proceed
      // A failed validation call shouldn't stop the user entirely
      console.error('Cart validation error:', err);
      closeDrawer();
      router.push('/checkout');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-md bg-white h-full flex flex-col animate-slide-in-right"
        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#FE2C55]" />
            Your Cart ({cartItems.length})
          </h2>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingBag size={48} className="opacity-20" />
              <p className="text-[14px]">Your cart is currently empty.</p>
              <button
                onClick={closeDrawer}
                className="mt-2 text-[#FE2C55] font-bold text-[14px] hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-50 rounded-lg border border-gray-100 shrink-0 overflow-hidden">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-gray-900 line-clamp-2 leading-tight">
                      {item.product.title}
                    </h4>

                    {Object.entries(item.variants || {}).length > 0 && (
                      <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-1">
                        {Object.entries(item.variants).map(([k, v]) => (
                          <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded">{v}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[14px] font-bold text-[#FE2C55]">
                      UGX {parseFloat(item.priceAtAddition || 0).toLocaleString()}
                    </p>

                    {/* Qty Selector */}
                    <div className="flex items-center border border-gray-200 rounded-md text-[13px] bg-white text-gray-900 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="px-3 py-1.5 border-x border-gray-200 font-bold bg-gray-50">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors self-start"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50">

            {/* Stock error banner */}
            {stockError && (
              <div className="flex items-start gap-2 bg-[#FFF0F3] border border-[#FE2C55] rounded-lg p-3 mb-4">
                <AlertCircle size={14} className="text-[#FE2C55] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#FE2C55] font-semibold leading-snug">{stockError}</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-1">
              <span className="text-[14px] font-semibold text-gray-600">Subtotal</span>
              <span className="text-[18px] font-bold text-gray-900">
                UGX {cartTotal.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-4">Shipping and taxes calculated at checkout.</p>

            <button
              onClick={handleCheckout}
              disabled={isValidating}
              className="w-full flex items-center justify-center gap-2 bg-[#FE2C55] hover:bg-[#e0264b] text-white py-3.5 rounded-xl font-bold text-[14px] transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isValidating
                ? <><Loader2 size={16} className="animate-spin" /> Checking availability...</>
                : <>Proceed to Checkout <ArrowRight size={16} /></>
              }
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
