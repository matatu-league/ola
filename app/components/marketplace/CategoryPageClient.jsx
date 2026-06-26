// components/marketplace/CategoryPageClient.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link       from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  ChevronRight, SlidersHorizontal, ArrowUpDown,
  Star, Package, Loader2, AlertCircle, LayoutGrid, LayoutList
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first'  },
  { value: 'popular',    label: 'Most popular'  },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, layout }) {
  const price = Number(product.price) || 0;
  const image = product.image || product.images?.[0];

  if (layout === 'list') {
    return (
      <Link
        href={`/products/${product._id}`}
        className="flex gap-4 bg-white border border-[#E3E3E4] rounded-sm hover:border-[#161823] hover:shadow-sm transition-all p-3 group"
      >
        <div className="w-24 h-24 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm shrink-0 overflow-hidden">
          {image
            ? <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
          }
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#161823] line-clamp-2 leading-snug mb-1">{product.title}</p>
            {product.rating > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <Star size={11} fill="currentColor" className="text-[#F5C400]" />
                <span className="text-[11px] text-[#8A8B91]">{product.rating} ({product.reviewsCount || 0})</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#FE2C55]">UGX {price.toLocaleString()}</span>
            {product.sold > 0 && (
              <span className="text-[11px] text-[#8A8B91]">{product.sold}+ sold</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product._id}`}
      className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden hover:border-[#161823] hover:shadow-sm transition-all group"
    >
      <div className="aspect-square bg-[#F8F8F8] overflow-hidden">
        {image
          ? <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
        }
      </div>
      <div className="p-3">
        <p className="text-[12px] font-semibold text-[#161823] line-clamp-2 leading-tight mb-2">{product.title}</p>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Star size={10} fill="currentColor" className="text-[#F5C400]" />
            <span className="text-[10px] text-[#8A8B91]">{product.rating}</span>
          </div>
        )}
        <p className="text-[13px] font-bold text-[#FE2C55]">UGX {price.toLocaleString()}</p>
        {product.moq && product.moq !== '1' && (
          <p className="text-[10px] text-[#8A8B91] mt-0.5">Min. {product.moq} pcs</p>
        )}
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CategoryPageClient({ initialData, slug }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [data,      setData]      = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [sort,      setSort]      = useState(searchParams.get('sort') || 'newest');
  const [page,      setPage]      = useState(parseInt(searchParams.get('page') || '1'));
  const [layout,    setLayout]    = useState('grid'); // 'grid' | 'list'

  const { category, parent, subcategories, products, pagination } = data;

  // ── Fetch when sort/page changes ──────────────────────────────────────────
  const fetchProducts = useCallback(async (newSort, newPage) => {
    setIsLoading(true);
    setError('');
    try {
      const qs  = new URLSearchParams({ sort: newSort, page: String(newPage), limit: '24' });
      const res = await fetch(`/api/categories/${slug}?${qs}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Update URL without full page reload
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', newSort);
        params.set('page', String(newPage));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        setError(json.message || 'Failed to load products');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsLoading(false);
    }
  }, [slug, pathname, router, searchParams]);

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1);
    fetchProducts(newSort, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchProducts(sort, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-5">

      {/* ── Breadcrumbs ──────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-[12px] text-[#8A8B91] mb-5 flex-wrap">
        <Link href="/" className="hover:text-[#FE2C55] transition-colors font-medium">Home</Link>
        <ChevronRight size={11} className="text-[#C5C5C8]" />
        <Link href="/categories" className="hover:text-[#FE2C55] transition-colors font-medium">Categories</Link>
        {parent && (
          <>
            <ChevronRight size={11} className="text-[#C5C5C8]" />
            <Link href={`/categories/${parent.slug}`} className="hover:text-[#FE2C55] transition-colors font-medium capitalize">
              {parent.name}
            </Link>
          </>
        )}
        <ChevronRight size={11} className="text-[#C5C5C8]" />
        <span className="text-[#161823] font-semibold capitalize">{category.name}</span>
      </nav>

      {/* ── Category header ───────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 mb-5 flex items-center gap-5">
        {category.image && (
          <img src={category.image} alt={category.name} className="w-16 h-16 object-cover rounded-sm border border-[#E3E3E4] shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-extrabold text-[#161823] tracking-tight capitalize mb-0.5">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-[13px] text-[#8A8B91] line-clamp-2">{category.description}</p>
          )}
          <p className="text-[12px] text-[#8A8B91] mt-1 flex items-center gap-1">
            <Package size={12} />
            {pagination.total.toLocaleString()} product{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* ── Subcategories ─────────────────────────────────────────────────── */}
      {subcategories.length > 0 && (
        <div className="mb-5">
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/categories/${slug}`}
              className="px-3 py-1.5 rounded-sm text-[12px] font-semibold bg-[#161823] text-white"
            >
              All {category.name}
            </Link>
            {subcategories.map(sub => (
              <Link
                key={sub._id}
                href={`/categories/${sub.slug}`}
                className="px-3 py-1.5 rounded-sm text-[12px] font-semibold border border-[#E3E3E4] bg-white text-[#161823] hover:border-[#161823] transition-colors capitalize"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar: sort + layout toggle ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4 bg-white border border-[#E3E3E4] rounded-sm px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] text-[#8A8B91]">
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">{pagination.total.toLocaleString()} results</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={13} className="text-[#8A8B91]" />
            <select
              value={sort}
              onChange={e => handleSortChange(e.target.value)}
              className="text-[12px] font-medium text-[#161823] border border-[#E3E3E4] rounded-sm px-2 py-1.5 outline-none focus:border-[#161823] bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Layout toggle */}
          <div className="flex border border-[#E3E3E4] rounded-sm overflow-hidden">
            <button
              onClick={() => setLayout('grid')}
              className={`p-1.5 transition-colors ${layout === 'grid' ? 'bg-[#161823] text-white' : 'bg-white text-[#8A8B91] hover:bg-[#F8F8F8]'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-1.5 transition-colors border-l border-[#E3E3E4] ${layout === 'list' ? 'bg-[#161823] text-white' : 'bg-white text-[#8A8B91] hover:bg-[#F8F8F8]'}`}
            >
              <LayoutList size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Products ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#8A8B91]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-[#FFF0F3] border border-[#FE2C55] rounded-sm p-4 text-[13px] text-[#FE2C55] font-semibold">
          <AlertCircle size={15} /> {error}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 bg-white border border-[#E3E3E4] rounded-sm">
          <Package size={40} className="text-[#E3E3E4] mx-auto mb-3" />
          <p className="text-[15px] font-bold text-[#161823] mb-1">No products found</p>
          <p className="text-[13px] text-[#8A8B91]">Try browsing a different category.</p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {products.map(p => <ProductCard key={p._id} product={p} layout="grid" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => <ProductCard key={p._id} product={p} layout="list" />)}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:border-[#161823] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            ← Prev
          </button>

          {/* Page number pills */}
          {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
            const p = Math.max(1, Math.min(pagination.pages - 6, page - 3)) + i;
            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-9 h-9 rounded-sm text-[13px] font-semibold transition-colors border
                  ${page === p
                    ? 'bg-[#161823] text-white border-[#161823]'
                    : 'bg-white text-[#161823] border-[#E3E3E4] hover:border-[#161823]'}`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pagination.pages}
            className="px-3 py-2 border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:border-[#161823] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}