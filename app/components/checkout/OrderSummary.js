"use client";

import { Phone, Mail } from 'lucide-react';

export default function OrderSummary({ cartItems, cartTotal, shippingFee, isFetchingConfig, supportInfo }) {
  const grandTotal = cartTotal + shippingFee;

  return (
    <div className="sticky top-6 space-y-4">

      {/* Cart items + totals */}
      <div className="bg-white border border-[var(--s-border,#E3E3E4)] rounded-sm">
        <h3 className="p-4 md:p-5 font-bold text-[15px] text-[var(--s-text,#161823)] border-b border-[var(--s-border,#E3E3E4)] bg-[var(--s-surface,#F8F8F8)] tracking-tight flex items-center justify-between uppercase">
          <span>Order Summary</span>
          <span className="text-[12px] font-medium text-[var(--s-muted,#8A8B91)] bg-white border border-[var(--s-border,#E3E3E4)] px-2 py-0.5 rounded-sm">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
        </h3>

        {/* Items list */}
        <div className="p-4 md:p-5 max-h-[340px] overflow-y-auto custom-scrollbar border-b border-[var(--s-border,#E3E3E4)]">
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="w-14 h-14 bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm shrink-0 overflow-hidden">
                  {item.product.images?.[0]
                    ? <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[18px]">🛍️</div>
                  }
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[12px] font-semibold text-[var(--s-text,#161823)] line-clamp-2 leading-tight mb-1">
                    {item.product.title}
                  </p>
                  {Object.values(item.variants || {}).length > 0 && (
                    <p className="text-[10px] text-[var(--s-muted,#8A8B91)] font-medium">
                      {Object.values(item.variants).join(' / ')}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[11px] text-[var(--s-muted,#8A8B91)]">
                      Qty: <span className="text-[var(--s-text,#161823)] font-bold">{item.quantity}</span>
                    </span>
                    <span className="text-[12px] font-bold text-[var(--s-text,#161823)]">
                      UGX {parseFloat(item.priceAtAddition || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-4 md:p-5 space-y-2.5 bg-white rounded-b-sm">
          <div className="flex justify-between text-[12px] text-[var(--s-muted,#8A8B91)] font-medium">
            <span>Subtotal</span>
            <span className="text-[var(--s-text,#161823)] font-semibold">UGX {cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[12px] text-[var(--s-muted,#8A8B91)] font-medium">
            <span>Shipping</span>
            <span className="text-[var(--s-text,#161823)] font-semibold">
              {isFetchingConfig ? '—' : shippingFee === 0 ? 'FREE' : `UGX ${shippingFee.toLocaleString()}`}
            </span>
          </div>
          <div className="pt-3 border-t border-[var(--s-border,#E3E3E4)] flex justify-between items-center">
            <span className="text-[13px] font-bold text-[var(--s-text,#161823)]">Total</span>
            <span className="text-[18px] font-extrabold text-[var(--s-primary,#FE2C55)] tracking-tight">
              UGX {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Support box */}
      <div className="bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm p-4 md:p-5">
        <h4 className="text-[12px] font-bold text-[var(--s-text,#161823)] mb-3 uppercase tracking-wide">Need Help?</h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-[var(--s-text,#161823)] shrink-0" />
            <span className="text-[12px] font-medium text-[var(--s-text,#161823)]">{supportInfo.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail size={13} className="text-[var(--s-text,#161823)] shrink-0" />
            <span className="text-[12px] font-medium text-[var(--s-text,#161823)]">{supportInfo.email}</span>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F8F8F8; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
      `}</style>
    </div>
  );
}