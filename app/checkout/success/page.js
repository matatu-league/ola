import { notFound } from 'next/navigation';
import TopNav from "@/components/shared/TopNav";
import CheckoutSuccessClient from '@/components/checkout/CheckoutSuccessClient';

export default async function SuccessPage({ searchParams }) {
  // Await the searchParams in Next.js 15+
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    notFound();
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Fetch the order from your backend
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      cache: 'no-store',
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      console.error("Failed to load order:", result.message);
      notFound();
    }

    return (
      <main className="bg-[#F8F8F8] min-h-screen">
        <TopNav showSearch={true} />
        <CheckoutSuccessClient order={result.data} />
      </main>
    );
  } catch (error) {
    console.error("Error fetching order:", error);
    notFound();
  }
}