import { notFound } from 'next/navigation';
import ProductDetails from '@/components/marketplace/ProductDetails';
import TopNav from "@/components/shared/TopNav";

export default async function ProductPage({ params }) {
  // In Next.js 15+, params is a promise that must be awaited
  const resolvedParams = await params;
  const { id } = resolvedParams;

  if (!id) {
    notFound(); 
  }

  try {
    // Determine the base URL dynamically
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Call the clean API route to get single product data
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: 'no-store', // Always get the freshest data
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      console.error("Failed to load product:", result.message);
      notFound(); 
    }

    // Perfectly structured single-product JSON object
    const safeProductData = result.data;

    return (
      <main className="bg-[#F8F8F8] min-h-screen">
        <TopNav />
        <ProductDetails product={safeProductData} />
      </main>
    );

  } catch (error) {
    console.error("Error loading product page:", error);
    notFound(); 
  }
}