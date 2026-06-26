// app/cart/recover/page.jsx
// Handles the recovery link from the abandoned cart email:
//   /cart/recover?token=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//
// Finds the cart by token, restores items to localStorage/context,
// then redirects to /checkout.

"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Loader2, ShoppingBag, AlertCircle } from 'lucide-react';

export default function CartRecoverPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { setCartItems } = useCart(); // expose setCartItems in your CartContext

  const [status,  setStatus]  = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Restoring your cart...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid recovery link.');
      return;
    }

    const recover = async () => {
      try {
        const res  = await fetch(`/api/cart/recover?token=${token}`);
        const data = await res.json();

        if (!data.success || !data.data?.items?.length) {
          setStatus('error');
          setMessage('This recovery link has expired or the cart is empty.');
          return;
        }

        // Restore cart items into the frontend context
        // The items come back populated with product details
        setCartItems(data.data.items.map(item => ({
          id:              `${item.product._id}-${JSON.stringify(item.variants || {})}`,
          product:         item.product,
          quantity:        item.quantity,
          priceAtAddition: item.priceAtAddition,
          variants:        item.variants || {},
        })));

        setStatus('success');
        setMessage('Cart restored! Redirecting to checkout...');

        setTimeout(() => router.push('/checkout'), 1500);

      } catch (err) {
        setStatus('error');
        setMessage('Something went wrong. Please try shopping again.');
      }
    };

    recover();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
      <div className="bg-white border border-[#E3E3E4] rounded-sm p-10 max-w-sm w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 size={36} className="animate-spin text-[#161823] mx-auto" />
            <p className="text-[13px] text-[#8A8B91]">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <ShoppingBag size={36} className="text-[#10B981] mx-auto" />
            <p className="text-[14px] font-bold text-[#161823]">Cart Restored!</p>
            <p className="text-[12px] text-[#8A8B91]">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle size={36} className="text-[#FE2C55] mx-auto" />
            <p className="text-[14px] font-bold text-[#161823]">Link Expired</p>
            <p className="text-[12px] text-[#8A8B91] mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#161823] text-white px-5 py-2 rounded-sm text-[12px] font-semibold hover:bg-black transition-colors"
            >
              Back to Shop
            </button>
          </>
        )}
      </div>
    </div>
  );
}