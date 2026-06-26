"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/seller/ProductForm';

export default function AddProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateProduct = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push('/products');
      } else {
        setErrorMessage(result.message || 'Failed to create product.');
      }
    } catch (error) {
      setErrorMessage('Network error occurred while saving.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full pb-10">
      {errorMessage && (
        <div className="mb-6 p-3 bg-[#FEE2E2] border border-[#FE2C55]/20 text-[#FE2C55] rounded-sm text-[13px] font-semibold flex items-center gap-2">
          ⚠️ {errorMessage}
        </div>
      )}

      <ProductForm 
        initialData={null} 
        onSubmit={handleCreateProduct} 
        isSaving={isSaving} 
        backUrl="/products"
      />
    </div>
  );
}