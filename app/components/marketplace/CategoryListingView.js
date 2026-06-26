"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, ChevronDown, ChevronLeft, Search, Check } from 'lucide-react';

// ── Collapsible filter block ──────────────────────────────────────────────────
const FilterBlock = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200 py-3">
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-bold text-gray-900 text-[13px]">{title}</h4>
        {isOpen
          ? <ChevronDown  size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
          : <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
        }
      </div>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

// ── Fallback filter schema ────────────────────────────────────────────────────
const DEFAULT_FILTER_SCHEMA = [
  {
    label: 'Condition',
    slug: 'filter_condition',
    visual_type: 'select',
    possible_values: [{ value: 'Brand New' }, { value: 'Used' }, { value: 'Refurbished' }],
  },
  {
    label: 'Verified sellers',
    slug: 'filter_id_verify',
    visual_type: 'select',
    possible_values: [{ value: 'Unverified sellers' }],
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function CategoryListingView({ initialCategory = null }) {
  const router       = useRouter();
  const pathname     = usePathname();  // will be /products
  const searchParams = useSearchParams();

  // Parse initial filter state from URL (?filter_condition=Brand+New etc.)
  const initialFilters = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter_')) initialFilters[key] = value.split(',');
  });

  // ── URL is the single source of truth ────────────────────────────────────
  // Read directly from searchParams on every render so any URL change
  // (back/forward, programmatic push) automatically triggers a re-fetch.
  const activeCategory = searchParams.get('category') || initialCategory || null;
  const page           = parseInt(searchParams.get('page') || '1');

  // selectedFilters stays in local state since it doesn't need to be in the URL
  // for the initial render — it gets written to the URL on change.
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);

  const [data,          setData]          = useState({ products: [], categories: [] });
  const [dynamicSchema, setDynamicSchema] = useState(DEFAULT_FILTER_SCHEMA);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalItems,    setTotalItems]    = useState(0);

  const LIMIT = 16;

  // ── Category switch — push to URL, searchParams change triggers re-fetch ──
  const handleCategorySwitch = (slug) => {
    setSelectedFilters({}); // reset filters on category change
    if (slug) {
      router.push(`/products?category=${slug}`);
    } else {
      router.push('/products');
    }
  };

  // ── Filter toggle — update local state, useEffect writes to URL ───────────
  const handleFilterToggle = (slug, value, visualType) => {
    setSelectedFilters(prev => {
      const current = prev[slug] || [];
      const next = visualType === 'multiselect'
        ? current.includes(value) ? current.filter(v => v !== value) : [...current, value]
        : current.includes(value) ? [] : [value];
      return { ...prev, [slug]: next };
    });
  };

  // ── Serialise filters for useEffect dependency ────────────────────────────
  // JSON.stringify so the effect re-runs when filter VALUES change,
  // not just when the object reference changes.
  const filtersKey = JSON.stringify(selectedFilters);

  // ── Fetch products ────────────────────────────────────────────────────────
  // Depends on: activeCategory (from URL), page (from URL), filtersKey (stringified)
  // Any URL navigation (TopNav click, back button, etc.) updates activeCategory
  // via searchParams → triggers this effect → fetches new data automatically.
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiParams     = new URLSearchParams();
        const browserParams = new URLSearchParams();

        apiParams.set('page',  String(page));
        apiParams.set('limit', String(LIMIT));
        if (page > 1) browserParams.set('page', String(page));

        if (activeCategory) {
          apiParams.set('category', activeCategory);
          browserParams.set('category', activeCategory);
        }

        const filters = JSON.parse(filtersKey);
        Object.entries(filters).forEach(([slug, values]) => {
          if (values.length > 0) {
            const str = values.join(',');
            apiParams.set(slug, str);
            browserParams.set(slug, str);
          }
        });

        // Sync filter state into URL without triggering navigation
        router.replace(`/products?${browserParams.toString()}`, { scroll: false });

        const res    = await fetch(`/api/products?${apiParams.toString()}`);
        const result = await res.json();

        if (result.success) {
          setData({
            products:   result.data.products,
            categories: result.data.categories,
          });
          setDynamicSchema(
            result.data.filterSchema?.length > 0
              ? result.data.filterSchema
              : DEFAULT_FILTER_SCHEMA
          );
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        } else {
          setError(result.error || 'Failed to load products');
        }
      } catch {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, page, filtersKey]); // ← stable primitives, not objects

  // ── Sidebar categories ────────────────────────────────────────────────────
  const sidebarCategories = useMemo(() => {
    if (!data.categories?.length) return [];
    const activeCat = data.categories.find(
      c => c.slug === activeCategory || c.name?.toLowerCase() === activeCategory?.toLowerCase()
    );
    const targetParentId = activeCat?.parentRef || activeCat?._id;
    return targetParentId
      ? data.categories.filter(c => c.parentRef === targetParentId)
      : data.categories.filter(c => !c.parentRef);
  }, [data.categories, activeCategory]);

  // ── Breadcrumbs ───────────────────────────────────────────────────────────
  const breadcrumbData = useMemo(() => {
    if (!data.categories?.length || !activeCategory) return { parent: null, current: null };
    const current = data.categories.find(
      c => c.slug === activeCategory || c.name?.toLowerCase() === activeCategory?.toLowerCase()
    );
    const parent = current?.parentRef
      ? data.categories.find(c => c._id === current.parentRef)
      : null;
    return { parent, current };
  }, [data.categories, activeCategory]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-[#FE2C55] mb-4">{error}</p>
        <button
          onClick={() => setPage(1)}
          className="px-4 py-2 border border-[#E3E3E4] rounded-sm text-[13px] font-semibold hover:border-[#161823] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-12">

      {/* ── Breadcrumbs ──────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 text-[12px] text-gray-500 flex items-center gap-2 flex-wrap">
        {/* Home — always a Link */}
        <Link href="/" className="hover:text-[#FE2C55] transition-colors">Home</Link>

        {/* Products — always a Link */}
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-[#FE2C55] transition-colors">Products</Link>

        {breadcrumbData.parent && (
          <>
            <ChevronRight size={12} />
            <Link
              href={`/products?category=${breadcrumbData.parent.slug}`}
              className="hover:text-[#FE2C55] transition-colors capitalize"
            >
              {breadcrumbData.parent.name}
            </Link>
          </>
        )}

        {breadcrumbData.current ? (
          <>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium">{breadcrumbData.current.name}</span>
          </>
        ) : activeCategory ? (
          <>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium capitalize">
              {activeCategory.replace(/-/g, ' ')}
            </span>
          </>
        ) : null}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row gap-6">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-full md:w-[240px] shrink-0 bg-white h-fit">

          <h2 className="font-extrabold text-[16px] text-gray-900 tracking-tight mb-4">Filters</h2>

          {/* Categories list */}
          <div className="py-2">
            <h4 className="font-bold text-gray-900 text-[13px] mb-2">Categories</h4>
            <ul className="space-y-2 ml-1 mb-4 max-h-[250px] overflow-y-auto pr-2">
              {/* All products option */}
              <li
                onClick={() => handleCategorySwitch(null)}
                className={`text-[12px] cursor-pointer transition-colors ${
                  !activeCategory ? 'text-[#FE2C55] font-bold' : 'text-gray-600 hover:text-[#FE2C55]'
                }`}
              >
                All products
              </li>
              {sidebarCategories.map(cat => {
                const isActive =
                  cat.slug === activeCategory ||
                  cat.name?.toLowerCase() === activeCategory?.toLowerCase();
                return (
                  <li
                    key={cat._id || cat.slug}
                    onClick={() => handleCategorySwitch(cat.slug)}
                    className={`text-[12px] cursor-pointer flex justify-between items-center transition-colors ${
                      isActive ? 'text-[#FE2C55] font-bold' : 'text-gray-600 hover:text-[#FE2C55]'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Dynamic filters */}
          {dynamicSchema.map(filterGroup => {
            if (
              !filterGroup?.slug ||
              !Array.isArray(filterGroup.possible_values) ||
              filterGroup.possible_values.length === 0
            ) return null;

            return (
              <FilterBlock key={filterGroup.slug} title={filterGroup.label || 'Filter'}>
                <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-2">
                  {filterGroup.possible_values.map((option, i) => {
                    if (!option?.value) return null;
                    const isSelected = selectedFilters[filterGroup.slug]?.includes(option.value);
                    const isMulti    = filterGroup.visual_type === 'multiselect';

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                        onClick={() => handleFilterToggle(filterGroup.slug, option.value, filterGroup.visual_type)}
                      >
                        {isMulti ? (
                          <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#FE2C55] border-[#FE2C55]' : 'border-gray-400 group-hover:border-[#FE2C55]'
                          }`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                        ) : (
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[4px] border-[#FE2C55]' : 'border-gray-400 group-hover:border-[#FE2C55]'
                          }`} />
                        )}
                        <span className={`text-[12px] ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {option.title || option.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </FilterBlock>
            );
          })}
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="flex-1">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
            <h1 className="text-[18px] md:text-[20px] font-bold text-gray-900 tracking-tight capitalize">
              {activeCategory ? activeCategory.replace(/-/g, ' ') : 'All products'}
              <span className="text-[13px] text-gray-500 font-normal ml-2">
                ({totalItems.toLocaleString()}+ products)
              </span>
            </h1>

            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-700">Sort by:</span>
              <select className="text-[12px] text-gray-600 bg-transparent focus:outline-none cursor-pointer font-medium border-none">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-pulse">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-100 border border-gray-100 h-[280px]" />
              ))}
            </div>
          ) : data.products.length === 0 ? (
            <div className="bg-white border border-gray-200 p-10 text-center text-gray-500 font-medium">
              No products found for this category or filter combination.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {data.products.map(product => (
                  <Link
                    href={`/products/${product._id}`}
                    key={product._id}
                    className="bg-white p-2 md:p-3 cursor-pointer flex flex-col group border border-transparent hover:border-gray-200 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="bg-[#f7f8fa] aspect-square mb-3 relative overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={product.image || product.images?.[0]}
                        alt={product.title}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 text-[10px] text-gray-600 shadow-sm flex items-center gap-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        <Search size={10} /> Preview
                      </div>
                    </div>

                    <h3 className="text-[12px] md:text-[13px] text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-[#FE2C55] transition-colors font-medium">
                      {product.title}
                    </h3>

                    <div className="mt-auto">
                      {product.verified && (
                        <div className="flex items-center gap-1 text-blue-600 font-extrabold text-[10px] uppercase mb-1">
                          <ShieldCheck size={12} className="fill-blue-50 text-blue-600" /> Verified
                        </div>
                      )}
                      <div className="font-extrabold text-gray-900 text-[15px] md:text-[16px] mb-1">
                        UGX {Number(product.price).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        MOQ: {product.moq || '1'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                  <button
                    onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', String(newPage));
                    router.push(`/products?${params.toString()}`);
                  }}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-[#FE2C55] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {[...Array(Math.min(7, totalPages))].map((_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 6, page - 3)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.set('page', String(p));
                          router.push(`/products?${params.toString()}`);
                        }}
                        className={`w-8 h-8 flex items-center justify-center text-[13px] font-bold transition-colors border ${
                          page === p
                            ? 'bg-[#FE2C55] text-white border-[#FE2C55]'
                            : 'bg-white border-gray-300 text-gray-700 hover:text-[#FE2C55]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', String(newPage));
                    router.push(`/products?${params.toString()}`);
                  }}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-[#FE2C55] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
