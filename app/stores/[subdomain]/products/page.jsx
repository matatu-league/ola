"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Package, Loader2 } from 'lucide-react';

const TABS = ['All Products', 'Active', 'Drafts', 'Out of Stock'];

function getStock(product) {
  return product.hasVariants && Array.isArray(product.variants)
    ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Number(product.stock) || 0;
}

export default function ProductsPage() {
  const [activeTab,    setActiveTab]    = useState('All Products');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [products,     setProducts]     = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [message,      setMessage]      = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res    = await fetch('/api/products?owner=true&limit=15');
        const result = await res.json();
        if (result.success) {
          setProducts(result.data?.products || []);
        } else {
          setMessage({ type: 'error', text: result.message || 'Failed to load products.' });
        }
      } catch {
        setMessage({ type: 'error', text: 'A network error occurred.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;

    try {
      const res    = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const result = await res.json();

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setMessage({ type: 'success', text: 'Product deleted successfully.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete product.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while deleting.' });
    }
  };

  const counts = {
    'All Products':  products.length,
    'Active':        products.filter((p) => p.status === 'active').length,
    'Drafts':        products.filter((p) => p.status === 'draft').length,
    'Out of Stock':  products.filter((p) => getStock(p) === 0).length,
  };

  const filteredProducts = products.filter((product) => {
    if (activeTab === 'Active'       && product.status !== 'active') return false;
    if (activeTab === 'Drafts'       && product.status !== 'draft')  return false;
    if (activeTab === 'Out of Stock' && getStock(product) > 0)       return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!product.title?.toLowerCase().includes(q) && !product.sku?.toLowerCase().includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Products</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage your store inventory and listings.</p>
        </div>
        <Link
          href="/products/add"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FE2C55] rounded-sm text-[13px] font-semibold text-white hover:bg-[#e0264b] transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {message.text && (
        <div className={`mb-6 p-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20'
            : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex overflow-x-auto hide-scrollbar border-b border-[#E3E3E4] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors relative ${
              activeTab === tab ? 'text-[#161823]' : 'text-[#8A8B91] hover:text-[#161823]'
            }`}
          >
            {tab} {!isLoading && <span className="ml-1 opacity-70">({counts[tab]})</span>}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#161823]" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823] transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-sm border border-[#E3E3E4] overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#8A8B91]">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-[13px]">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#8A8B91]">
              <Package className="mb-2 opacity-50" size={32} />
              <p className="text-[13px] font-semibold text-[#161823]">No products found</p>
              <p className="text-[12px]">Try adjusting your search or add a new product.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Product Info</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E3E4]">
                {filteredProducts.map((product) => {
                  const totalStock = getStock(product);

                  return (
                    <tr key={product._id} className="hover:bg-[#F8F8F8] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-sm border border-[#E3E3E4] overflow-hidden bg-[#F8F8F8] shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-[#8A8B91]" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="font-semibold text-[#161823] truncate max-w-[180px] lg:max-w-[250px]">{product.title}</div>
                          {product.isFlashItem && (
                            <span className="bg-[#FE2C55] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shrink-0">Flash</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8A8B91]">{product.sku || (product.hasVariants ? 'Multiple SKUs' : 'No SKU')}</div>
                      </td>
                      <td className="px-4 py-3 text-[#8A8B91] font-medium">{product.categoryId?.name || 'Uncategorized'}</td>
                      <td className="px-4 py-3 font-bold text-[#161823]">
                        {product.hasVariants && product.variantsHaveDifferentPrices
                          ? <span className="text-[#8A8B91] font-medium text-[12px] bg-[#F8F8F8] px-2 py-1 border border-[#E3E3E4] rounded-sm">Variable</span>
                          : product.price ? `USh ${Number(product.price).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className={`font-semibold ${totalStock === 0 ? 'text-[#FE2C55]' : 'text-[#161823]'}`}>
                            {totalStock} {totalStock === 0 && '(Empty)'}
                          </span>
                          {product.hasVariants && (
                            <span className="text-[10px] font-medium text-[#8A8B91] mt-0.5">{product.variants?.length || 0} Variants</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                          product.status === 'active' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' :
                          product.status === 'draft'  ? 'bg-[#F8F8F8] text-[#8A8B91] border-[#E3E3E4]' :
                                                        'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
                        }`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products/edit/${product._id}`}
                            className="p-1.5 text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4] rounded-sm transition-colors flex items-center justify-center"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-1.5 text-[#8A8B91] hover:text-[#FE2C55] hover:bg-[#FEE2E2] rounded-sm transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && filteredProducts.length > 0 && (
          <div className="border-t border-[#E3E3E4] px-4 py-3 flex items-center justify-between bg-white">
            <span className="text-[12px] text-[#8A8B91] font-medium">Showing {filteredProducts.length} product(s)</span>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50" disabled>Prev</button>
              <button className="px-3 py-1.5 border border-[#161823] rounded-sm text-[12px] font-semibold text-white bg-[#161823]">1</button>
              <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}