"use client";

import React, { useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer, cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
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
                    
                    {/* Render Variants if they exist */}
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
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 transition-colors">
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="px-3 py-1.5 border-x border-gray-200 font-bold bg-gray-50">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 transition-colors">
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
            <div className="flex justify-between items-center mb-4">
              <span className="text-[14px] font-semibold text-gray-600">Subtotal</span>
              <span className="text-[18px] font-bold text-gray-900">
                UGX {cartTotal.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-4">Shipping and taxes calculated at checkout.</p>
            
            <button 
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 bg-[#FE2C55] hover:bg-[#e0264b] text-white py-3.5 rounded-xl font-bold text-[14px] transition-transform active:scale-[0.98]"
            >
              Proceed to Checkout <ArrowRight size={16} />
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