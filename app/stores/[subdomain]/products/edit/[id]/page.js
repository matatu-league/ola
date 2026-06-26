"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProductForm from '@/components/seller/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch the single product by ID on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        // Fetching specifically from our new independent route
        const response = await fetch(`/api/products/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setInitialData(result.data);
        } else {
          setErrorMessage(result.message || 'Product not found.');
        }
      } catch (error) {
        setErrorMessage('Failed to load product data.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleUpdateProduct = async (payload) => {
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      // Pushing payload to the specific [id] endpoint
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push('/seller/products');
      } else {
        setErrorMessage(result.message || 'Failed to update product.');
      }
    } catch (error) {
      setErrorMessage('Network error occurred while updating.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin text-red-500 mb-4" size={32} />
        <p className="text-[13px] font-semibold">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header Navigation Wrapper */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-sm text-[13px] font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {initialData && (
        <ProductForm 
          title="Edit Product"
          initialData={initialData} 
          onSubmit={handleUpdateProduct} 
          isSaving={isSaving} 
        />
      )}
    </div>
  );
}