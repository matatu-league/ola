"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Plus, Edit, Trash2, Package, Loader2, AlertCircle } from 'lucide-react';

const TABS = ['All Products', 'Active', 'Drafts', 'Out of Stock'];
const LIMIT = 8;

function getStock(product) {
  return product.hasVariants && Array.isArray(product.variants)
    ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Number(product.stock) || 0;
}

/* ─────────────────────────  Popconfirm  ───────────────────────── */
function Popconfirm({ open, position, title, description, onConfirm, onCancel, loading, okText = 'OK', cancelText = 'Cancel' }) {
  useEffect(() => {
    if (!open) return;
    const onKey    = (e) => { if (e.key === 'Escape') onCancel(); };
    const onScroll = () => onCancel();
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, onCancel]);

  if (!open || !position) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1059]" onClick={onCancel} />
      <div
        role="dialog"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          transform: 'translate(-100%, -100%)',
          zIndex: 1060,
        }}
        className="bg-white border border-gray-200 rounded-none shadow-sm min-w-[260px] p-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-2 mb-4">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-black leading-snug">{title}</div>
            {description && (
              <div className="text-xs text-gray-500 mt-1 leading-snug">{description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="bg-white border border-gray-200 hover:border-black text-black px-3 py-1.5 rounded-none font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-none font-semibold text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1"
          >
            {loading && <Loader2 size={10} className="animate-spin" />}
            {okText}
          </button>
        </div>
        {/* arrow */}
        <div className="absolute -bottom-[5px] right-[12px] w-[10px] h-[10px] bg-white border-r border-b border-gray-200 rotate-45" />
      </div>
    </>
  );
}

/* ───────────────────  Image Component  ─────────────────── */
function ProductImage({ src, alt }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  return (
    <div className="w-10 h-10 rounded-none border border-gray-200 overflow-hidden bg-gray-50 shrink-0 relative">
      {imgLoading && !imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 size={12} className="animate-spin text-gray-400" />
        </div>
      )}
      
      {imgError ? (
        <img 
          src="/placeholder.svg" 
          alt={alt || "Placeholder"} 
          className="w-full h-full object-cover"
          onLoad={() => setImgLoading(false)}
        />
      ) : src ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
          onLoad={() => setImgLoading(false)}
          onError={() => {
            setImgError(true);
            setImgLoading(false);
          }}
          style={{ display: imgLoading ? 'none' : 'block' }}
        />
      ) : (
        <img 
          src="/placeholder.svg" 
          alt={alt || "Placeholder"} 
          className="w-full h-full object-cover"
          onLoad={() => setImgLoading(false)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────  Page  ───────────────────────── */
export default function ProductsPage() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const initialTab    = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'All Products';
  const initialSearch = searchParams.get('search') || '';
  const initialPage   = Math.max(1, Number(searchParams.get('page')) || 1);

  const [activeTab,       setActiveTab]       = useState(initialTab);
  const [searchQuery,     setSearchQuery]     = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page,            setPage]            = useState(initialPage);
  const [pagination,      setPagination]      = useState({ total: 0, totalPages: 1, page: initialPage });
  const [products,        setProducts]        = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState(null);
  const [message,         setMessage]         = useState({ type: '', text: '' });
  const [confirmDelete,   setConfirmDelete]   = useState(null);
  const [deleting,        setDeleting]        = useState(false);

  const syncUrl = useCallback((next) => {
    const params = new URLSearchParams();
    const tab    = next.tab    ?? activeTab;
    const search = next.search ?? debouncedSearch;
    const pg     = next.page   ?? page;

    if (tab && tab !== 'All Products') params.set('tab', tab);
    if (search)                        params.set('search', search);
    if (pg > 1)                        params.set('page', String(pg));

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [activeTab, debouncedSearch, page, pathname, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setDebouncedSearch(searchQuery);
        setPage(1);
        syncUrl({ search: searchQuery, page: 1 });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, debouncedSearch, syncUrl]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        owner: 'true',
        limit: String(LIMIT),
        page:  String(page),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res    = await fetch(`/api/products?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setProducts(result.data?.products || []);
        setPagination(result.data?.pagination || { total: 0, totalPages: 1, page });
      } else {
        setError(result.message || 'Failed to load products.');
        setMessage({ type: 'error', text: result.message || 'Failed to load products.' });
      }
    } catch {
      setError('A network error occurred while loading products.');
      setMessage({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    syncUrl({});
  }, []);

  const handleTabChange  = (tab) => { setActiveTab(tab); setPage(1); syncUrl({ tab, page: 1 }); };
  const handlePageChange = (p)   => { setPage(p);                    syncUrl({ page: p }); };

  const openDeleteConfirm = (e, id) => {
    const rect    = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    setConfirmDelete({
      id,
      top:  rect.top - 8,
      left: centerX + 17,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeleting(true);
    try {
      const res    = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const result = await res.json();

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        setMessage({ type: 'success', text: 'Product deleted successfully.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete product.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while deleting.' });
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
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
    return true;
  });

  const pageNumbers = (() => {
    const total = pagination.totalPages || 1;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const window = new Set([1, total, page, page - 1, page + 1]);
    return [...window].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  })();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your store inventory and listings.</p>
        </div>
        <Link
          href="/products/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {message.text && (
        <div className={`mb-6 ${message.type === 'success' ? 'px-4 py-3 rounded-none border bg-green-50 border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2' : 'px-4 py-3 rounded-none border bg-red-50 border-red-200 text-red-600 text-sm font-semibold flex items-center gap-2'}`}>
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
              activeTab === tab
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            {tab}{!isLoading && <span className="ml-1 text-gray-400">({counts[tab]})</span>}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-3 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <img 
                src="/placeholder.svg" 
                alt="Loading" 
                className="w-16 h-16 mb-4 opacity-50"
              />
              <Loader2 className="animate-spin mb-2 text-black" size={24} />
              <p className="text-sm">Loading products...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <img 
                src="/placeholder.svg" 
                alt="Error" 
                className="w-20 h-20 mb-4 opacity-30"
              />
              <AlertCircle className="mb-2 text-red-500" size={32} />
              <p className="text-sm font-bold text-red-600 mb-2">Failed to load products</p>
              <p className="text-xs text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="bg-white border border-gray-300 hover:border-black text-black px-4 py-2 rounded-none font-semibold text-xs transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <img 
                src="/placeholder.svg" 
                alt="No products" 
                className="w-16 h-16 mb-4 opacity-50"
              />
              <Package className="mb-2 opacity-50" size={32} />
              <p className="text-sm font-bold text-black">No products found</p>
              <p className="text-xs">Try adjusting your search or add a new product.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 w-10"></th>
                  <th className="px-5 py-3">Product Info</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const totalStock = getStock(product);

                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <ProductImage src={product.image} alt={product.title} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="font-bold text-sm text-black truncate max-w-[180px] lg:max-w-[250px]">{product.title}</div>
                          {product.isFlashItem && (
                            <span className="bg-red-50 text-red-500 border border-red-200 text-xs font-bold px-1.5 py-0.5 rounded-none uppercase tracking-wider shrink-0">Flash</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{product.sku || (product.hasVariants ? 'Multiple SKUs' : 'No SKU')}</div>
                      </td>
                      <td className="px-5 py-3.5 text-black">{product.categoryId?.name || 'Uncategorized'}</td>
                      <td className="px-5 py-3.5 font-bold text-black">
                        {product.hasVariants && product.variantsHaveDifferentPrices
                          ? <span className="text-gray-500 font-semibold text-xs bg-gray-50 px-2 py-0.5 border border-gray-200 rounded-none">Variable</span>
                          : product.price ? `USh ${Number(product.price).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className={`text-sm ${totalStock === 0 ? 'text-red-500 font-bold' : 'text-black font-semibold'}`}>
                            {totalStock} {totalStock === 0 && '(Empty)'}
                          </span>
                          {product.hasVariants && (
                            <span className="text-xs text-gray-500 mt-0.5">{product.variants?.length || 0} Variants</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-xs font-bold uppercase tracking-wider border ${
                          product.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                          product.status === 'draft'  ? 'bg-gray-50 text-gray-500 border-gray-200' :
                                                        'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products/edit/${product._id}`}
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-none transition-colors flex items-center justify-center"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={(e) => openDeleteConfirm(e, product._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
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

        {!isLoading && !error && pagination.total > 0 && (
          <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500 font-semibold">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} product(s)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="bg-white border border-gray-200 hover:border-black text-black px-3 py-1.5 rounded-none font-semibold text-xs transition-colors disabled:opacity-50 disabled:hover:border-gray-200"
              >
                Prev
              </button>
              {pageNumbers.map((p, i) => {
                const prev    = pageNumbers[i - 1];
                const showGap = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showGap && (
                      <span className="inline-flex items-center justify-center min-w-[24px] text-xs text-gray-500">…</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[32px] px-2 py-1.5 border rounded-none text-xs transition-colors ${
                        page === p
                          ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold'
                          : 'border-gray-200 bg-white text-black font-semibold hover:border-black'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
              <button
                onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="bg-white border border-gray-200 hover:border-black text-black px-3 py-1.5 rounded-none font-semibold text-xs transition-colors disabled:opacity-50 disabled:hover:border-gray-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Popconfirm
        open={!!confirmDelete}
        position={confirmDelete}
        title="Delete this product?"
        description="This action cannot be undone."
        okText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setConfirmDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
