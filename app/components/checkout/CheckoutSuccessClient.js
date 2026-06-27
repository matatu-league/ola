"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Package, Truck, ArrowLeft, Home } from 'lucide-react';

export default function CheckoutSuccessClient({ order }) {
  const router = useRouter();

  if (!order) return null;

  return (
    <div className="max-w-[700px] mx-auto px-4 py-12 animate-in fade-in duration-500">
      
      {/* Success Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#F0FDF9] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-[#10B981]" />
        </div>
        <h1 className="text-[24px] font-extrabold text-[var(--s-text,#161823)] tracking-tight mb-2">Order Confirmed!</h1>
        <p className="text-[13px] text-[var(--s-muted,#8A8B91)]">Thank you for your purchase. Your order number is <span className="font-bold text-[var(--s-text,#161823)]">{order.orderNumber}</span>.</p>
      </div>

      {/* Main Order Details Card */}
      <div className="bg-white border border-[var(--s-border,#E3E3E4)] rounded-sm p-6 mb-6">
        <h2 className="text-[15px] font-bold text-[var(--s-text,#161823)] mb-6 flex items-center gap-2">
          <Package size={18} /> Order Summary
        </h2>
        
        <div className="space-y-4 mb-6">
          {order.items.map((item) => (
            <div key={item._id} className="flex gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-sm border border-[var(--s-border,#E3E3E4)]" />
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-[var(--s-text,#161823)]">{item.name}</h4>
                <p className="text-[11px] text-[var(--s-muted,#8A8B91)]">Qty: {item.quantity}</p>
              </div>
              <div className="text-[13px] font-bold text-[var(--s-text,#161823)]">
                UGX {item.price.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--s-border,#E3E3E4)] pt-4 space-y-2">
          <div className="flex justify-between text-[12px] text-[var(--s-muted,#8A8B91)]">
            <span>Subtotal</span>
            <span>UGX {order.subTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[12px] text-[var(--s-muted,#8A8B91)]">
            <span>Shipping</span>
            <span>UGX {order.shippingFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[14px] font-bold text-[var(--s-text,#161823)] pt-2">
            <span>Total</span>
            <span className="text-[var(--s-primary,#FE2C55)]">UGX {order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Shipping Details Card */}
      <div className="bg-white border border-[var(--s-border,#E3E3E4)] rounded-sm p-6 mb-8">
        <h2 className="text-[15px] font-bold text-[var(--s-text,#161823)] mb-4 flex items-center gap-2">
          <Truck size={18} /> Shipping Address
        </h2>
        <div className="text-[13px] text-[var(--s-text,#161823)] space-y-1">
          <p className="font-bold">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.addressLine1}</p>
          <p>{order.shippingAddress.city}, Uganda</p>
          <p className="text-[var(--s-muted,#8A8B91)] pt-2">Phone: {order.shippingAddress.phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={() => router.push('/')}
          className="flex-1 bg-[var(--s-primary,#161823)] text-white py-3 rounded-sm font-semibold text-[13px] hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          <Home size={16} /> Continue Shopping
        </button>
        <button 
          onClick={() => router.push('/orders')}
          className="flex-1 bg-white border border-[var(--s-border,#E3E3E4)] text-[var(--s-text,#161823)] py-3 rounded-sm font-semibold text-[13px] hover:bg-[var(--s-surface,#F8F8F8)] transition-colors"
        >
          View All Orders
        </button>
      </div>

    </div>
  );
}
