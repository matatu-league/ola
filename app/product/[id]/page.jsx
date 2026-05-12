import { notFound } from 'next/navigation';
import ProductDetails from '@/components/marketplace/ProductDetails'; // Adjust this import path to match your project

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

    // 🔴 IMPORTANT: Notice this fetch URL! 
    // We are calling the new clean API route: /api/products/12345
    // We are NOT calling /api/products?id=12345 or ?limit=1
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: 'no-store', // Always get the freshest data (reviews, stock, etc.)
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      console.error("Failed to load product:", result.message);
      notFound(); 
    }

    // This is now the perfectly structured single-product JSON object!
    const safeProductData = result.data;

    return (
      <main>
        {/* Pass the clean object down to the UI */}
        <ProductDetails product={safeProductData} />
      </main>
    );

  } catch (error) {
    console.error("Error loading product page:", error);
    notFound(); 
  }
}