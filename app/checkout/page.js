import React from 'react';
import TopNav from '@/components/shared/TopNav';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export const metadata = {
  title: 'Checkout | Ola.ug',
  description: 'Complete your purchase securely.',
};

export default function CheckoutPage() {
  return (
    <main className="bg-[#F8F8F8] min-h-screen flex flex-col">
      <TopNav />
      <div className="flex-1 py-8">
        <CheckoutClient />
      </div>
    </main>
  );
}