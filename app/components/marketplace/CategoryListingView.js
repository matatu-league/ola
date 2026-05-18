"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, ChevronDown, ChevronLeft, Search, Check } from 'lucide-react';

// Reusable Filter Block component - Flattened for Alibaba Style
const FilterBlock = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-200 py-3">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-bold text-gray-900 text-[13px]">{title}</h4>
        {isOpen ? (
          <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
        ) : (
          <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
        )}
      </div>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

// Default Schema (Fallback)
const DEFAULT_FILTER_SCHEMA = [
  {
    label: "Condition",
    slug: "filter_condition",
    visual_type: "select",
    possible_values: [{ value: "Brand New" }, { value: "Used" }, { value: "Refurbished" }]
  },
  {
    label: "Verified sellers",
    slug: "filter_id_verify",
    visual_type: "select",
    possible_values: [{ value: "Unverified sellers" }]
  }
];

const CategoryListingView = ({ initialCategory = null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Parse Initial State Directly from URL for persistence
  const initialFilters = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter_')) {
      initialFilters[key] = value.split(',');
    }
  });

  const urlCategory = searchParams.get('category') || searchParams.get('name');
  
  // States
  const [activeCategory, setActiveCategory] = useState(urlCategory || initialCategory || null);
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  const [data, setData] = useState({ products: [], categories: [] });
  const [dynamicSchema, setDynamicSchema] = useState(DEFAULT_FILTER_SCHEMA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 16; // Increased slightly for denser grid

  // Handle Category Switching
  const handleCategorySwitch = (slug) => {
    setActiveCategory(slug);
    setSelectedFilters({}); // Reset filters when changing categories
    setPage(1); // Reset to page 1
  };

  // Handle Dynamic Filter Toggling
  const handleFilterToggle = (slug, value, visualType) => {
    setSelectedFilters(prev => {
      const currentValues = prev[slug] || [];
      let newValues;

      if (visualType === 'multiselect') {
        newValues = currentValues.includes(value) 
          ? currentValues.filter(v => v !== value) 
          : [...currentValues, value];
      } else {
        newValues = currentValues.includes(value) ? [] : [value];
      }

      setPage(1); // Reset page to 1 when changing filters
      return { ...prev, [slug]: newValues };
    });
  };

  // Main Fetch & URL Sync Effect
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // --- 1. Construct API Query and Browser URL ---
        const queryParams = new URLSearchParams();
        const browserParams = new URLSearchParams();

        queryParams.set('page', page);
        queryParams.set('limit', limit);
        
        if (page > 1) browserParams.set('page', page);
        
        // Use activeCategory (syncs with URL)
        if (activeCategory) {
          queryParams.set('category', activeCategory);
          browserParams.set('category', activeCategory);
        }

        // Apply filters to URL
        Object.entries(selectedFilters).forEach(([slug, values]) => {
          if (values.length > 0) {
            const valStr = values.join(',');
            queryParams.set(slug, valStr);
            browserParams.set(slug, valStr); 
          }
        });

        // --- 2. Update Browser URL Without Reloading ---
        router.replace(`${pathname}?${browserParams.toString()}`, { scroll: false });

        // --- 3. Fetch from API ---
        const response = await fetch(`/api/products?${queryParams.toString()}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        
        const result = await response.json();
        
        if (result.success) {
          setData({
            products: result.data.products,
            categories: result.data.categories
          });
          
          if (result.data.filterSchema && result.data.filterSchema.length > 0) {
            setDynamicSchema(result.data.filterSchema);
          } else {
            setDynamicSchema(DEFAULT_FILTER_SCHEMA);
          }

          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load category products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, activeCategory, selectedFilters, pathname, router]);

  // Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Process Category Tree for Sidebar (Contextual Siblings/Children)
  const sidebarCategories = useMemo(() => {
    if (!data.categories || data.categories.length === 0) return [];

    let targetParentId = null;

    if (activeCategory) {
      const activeCat = data.categories.find(
        c => c.slug === activeCategory || c.name.toLowerCase() === activeCategory.toLowerCase()
      );
      if (activeCat) {
        targetParentId = activeCat.parentRef || activeCat._id;
      }
    }

    if (targetParentId) {
      return data.categories.filter(c => c.parentRef === targetParentId);
    } else {
      return data.categories.filter(c => !c.parentRef);
    }
  }, [data.categories, activeCategory]);

  // Find Category Data for Breadcrumbs
  const breadcrumbData = useMemo(() => {
    if (!data.categories || !activeCategory) return { parent: null, current: null };

    const current = data.categories.find(
      c => c.slug === activeCategory || c.name.toLowerCase() === activeCategory.toLowerCase()
    );

    const parent = current?.parentRef 
      ? data.categories.find(c => c._id === current.parentRef) 
      : null;

    return { parent, current };
  }, [data.categories, activeCategory]);

  if (error) {
    return <div className="text-center py-20 font-bold text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white min-h-screen pb-12">
      
      {/* BREADCRUMBS - Full Hierarchy */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 text-[12px] text-gray-500 flex items-center gap-2">
        <span 
          className="hover:text-[#FE2C55] cursor-pointer transition-colors" 
          onClick={() => handleCategorySwitch(null)}
        >
          Home
        </span>
        
        {breadcrumbData.parent && (
          <>
            <ChevronRight size={12} />
            <span 
              className="hover:text-[#FE2C55] cursor-pointer transition-colors"
              onClick={() => handleCategorySwitch(breadcrumbData.parent.slug)}
            >
              {breadcrumbData.parent.name}
            </span>
          </>
        )}

        {breadcrumbData.current && (
          <>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium">
              {breadcrumbData.current.name}
            </span>
          </>
        )}
        
        {!breadcrumbData.current && activeCategory && (
          <>
            <ChevronRight size={12} />
            <span className="text-gray-900 capitalize">{activeCategory.replace(/-/g, ' ')}</span>
          </>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 flex flex-col md:flex-row gap-6">
        
        {/* ================= LEFT SIDEBAR (Flat, No Borders, Square) ================= */}
        <aside className="w-full md:w-[240px] shrink-0 bg-white h-fit">
          
          <h2 className="font-extrabold text-[16px] text-gray-900 tracking-tight mb-4">Filters</h2>

          <div className="py-2">
            <h4 className="font-bold text-gray-900 text-[13px] mb-2">Categories</h4>
            <ul className="space-y-2 ml-1 mb-4 max-h-[250px] overflow-y-auto pr-2">
              {sidebarCategories.map(cat => {
                const isActive = cat.slug === activeCategory || cat.name.toLowerCase() === activeCategory?.toLowerCase();
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

          {/* DYNAMIC FILTERS ENGINE */}
          {(dynamicSchema || []).map((filterGroup) => {
            if (!filterGroup || !filterGroup.slug || !Array.isArray(filterGroup.possible_values) || filterGroup.possible_values.length === 0) {
              return null;
            }

            return (
              <FilterBlock key={filterGroup.slug} title={filterGroup.label || 'Filter'}>
                <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-2">
                  {filterGroup.possible_values.map((option, i) => {
                    if (!option || !option.value) return null;

                    const isSelected = selectedFilters[filterGroup.slug]?.includes(option.value);
                    const isMulti = filterGroup.visual_type === 'multiselect';

                    return (
                      <div 
                        key={i} 
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                        onClick={() => handleFilterToggle(filterGroup.slug, option.value, filterGroup.visual_type)}
                      >
                        {isMulti ? (
                          <div className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#FE2C55] border-[#FE2C55]' : 'border-gray-400 group-hover:border-[#FE2C55]'
                          }`}>
                            {isSelected && <Check size={10} className="text-white"/>}
                          </div>
                        ) : (
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[4px] border-[#FE2C55]' : 'border-gray-400 group-hover:border-[#FE2C55]'
                          }`}></div>
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

        {/* ================= MAIN CONTENT (Square Grid) ================= */}
        <main className="flex-1">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
            <h1 className="text-[18px] md:text-[20px] font-bold text-gray-900 tracking-tight capitalize">
              {activeCategory ? activeCategory.replace(/-/g, ' ') : "All products"} 
              <span className="text-[13px] text-gray-500 font-normal ml-2 tracking-normal">({totalItems}+ products available)</span>
            </h1>
            
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-700">Sort by:</span>
              <select className="text-[12px] text-gray-600 bg-transparent focus:outline-none cursor-pointer font-medium border-none outline-none">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-pulse">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-none h-[280px]"></div>
              ))}
            </div>
          ) : (
            <>
              {data.products.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-none p-10 text-center text-gray-500 font-medium">
                  No products found for this category or filter combination.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {data.products.map((product) => (
                    /* REFACTORED: Using Next.js Link to route securely to the product details page */
                    <Link 
                      href={`/products/${product._id || product.id}`} 
                      key={product._id || product.id} 
                      className="bg-white p-2 md:p-3 cursor-pointer flex flex-col group border border-transparent hover:border-gray-200 hover:shadow-sm transition-all duration-300 rounded-none"
                    >
                      <div className="bg-[#f7f8fa] aspect-square mb-3 relative overflow-hidden flex items-center justify-center p-2 rounded-none">
                        <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500" />
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-none text-[10px] text-gray-600 shadow-sm flex items-center gap-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          <Search size={10} /> Preview
                        </div>
                      </div>
                      
                      <h3 className="text-[12px] md:text-[13px] text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-[#FE2C55] transition-colors font-medium">
                        {product.title}
                      </h3>
                      
                      <div className="mt-auto">
                        {product.verified && (
                          <div className="flex items-center gap-1 text-[#0066FF] font-extrabold text-[10px] uppercase mb-1">
                            <ShieldCheck size={12} className="fill-blue-50 text-blue-600"/> Verified
                          </div>
                        )}
                        
                        <div className="font-extrabold text-gray-900 text-[15px] md:text-[16px] mb-1">{product.price}</div>
                        
                        <div className="text-[11px] text-gray-500 flex justify-between items-center font-medium">
                          <span>MOQ: {product.moq || '1'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                  <button 
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-none border border-gray-300 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-[#FE2C55] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === page;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-none text-[13px] font-bold transition-colors ${
                          isActive 
                            ? 'bg-[#FE2C55] text-white border border-[#FE2C55]' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-none border border-gray-300 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-[#FE2C55] transition-colors"
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
};

export default CategoryListingView;