import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Award, PenTool, Star, Flame, ChevronRight, Menu } from 'lucide-react';

const SectionHeader = ({ title, subtitle, rightText }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="text-[18px] md:text-[22px] font-extrabold text-gray-900 tracking-tight leading-none">{title}</h2>
      {subtitle && <p className="text-[12px] md:text-[13px] text-gray-500 mt-2 font-medium">{subtitle}</p>}
    </div>
    {rightText && (
      <a href="#" className="text-[13px] md:text-[14px] text-gray-900 hover:text-[#FE2C55] flex items-center gap-1 font-bold transition-colors">
        {rightText} <ChevronRight size={16} strokeWidth={2.5} />
      </a>
    )}
  </div>
);

const ProductsView = ({ onCategorySelect }) => {
  const [data, setData] = useState({ categories: [], topDeals: [], tailoredSelections: [], productGrid: [], newArrivals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/marketplace',{
          headers: {
            'ngrok-skip-browser-warning': 'true', 
          },
        });
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch products. Is your backend running?');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process flat database categories into a nested tree structure
  const categoryTree = useMemo(() => {
    if (!data.categories || data.categories.length === 0) return [];
    
    if (data.categories[0]?.subCategories) {
      return data.categories;
    }

    const parents = data.categories.filter(c => !c.parentRef);
    const children = data.categories.filter(c => c.parentRef);

    return parents.map(parent => {
      const subCats = children.filter(c => c.parentRef === parent._id);
      return {
        ...parent,
        subCategories: subCats.length > 0 ? subCats : []
      };
    });
  }, [data.categories]);

  if (loading) {
    return <div className="text-center py-20 font-bold text-gray-500 animate-pulse">Loading Marketplace...</div>;
  }

  if (error) {
    return <div className="text-center py-20 font-bold text-red-500">{error}</div>;
  }

  return (
    <>
      {/* TOP UTILITY BAR (Restored to original design) */}
      <div className="hidden sm:flex bg-[#fafafa] py-4 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 flex w-full items-center justify-between">
          <div className="font-extrabold text-gray-900 text-[16px] md:text-[18px] truncate pr-4">
            Welcome to Ola, Admin
          </div>
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-[14px] font-bold text-gray-800 shrink-0">
            <span className="flex items-center gap-2 cursor-pointer hover:text-[#FE2C55] transition-colors">
              <ShieldCheck size={18} strokeWidth={2.5} /> Request for Quotation
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2 cursor-pointer hover:text-[#FE2C55] transition-colors">
              <Award size={18} strokeWidth={2.5} /> Top Ranking
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2 cursor-pointer hover:text-[#FE2C55] transition-colors">
              <PenTool size={18} strokeWidth={2.5} /> Fast customization
            </span>
          </div>
        </div>
      </div>
      
      <main className="max-w-[1400px] mx-auto px-3 md:px-4 pb-10 mt-6 md:mt-8">
        
        {/* 6-COLUMN HERO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8 h-auto lg:h-[320px]">
          
          {/* 1. DYNAMIC INNER SIDEBAR (Restored background & rounded edges) */}
          <div className="hidden lg:flex bg-[#f9f9fa] rounded-xl py-2 flex-col col-span-1 relative z-30">
            
            <div className="group relative px-2">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-gray-800 font-medium hover:bg-gray-200">
                <div className="flex items-center gap-3 text-[13px] truncate">
                  <Star size={18} strokeWidth={2} className="text-gray-700"/>
                  <span className="truncate">Categories for you</span>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0"/>
              </div>
            </div>

            {/* Dynamic Categories */}
            {categoryTree.slice(0, 6).map((cat, idx) => (
              <div key={cat._id || idx} className="group relative px-2">
                <div 
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-gray-800 font-medium hover:bg-gray-200"
                  onClick={() => onCategorySelect && onCategorySelect(cat.slug || cat.name)}
                >
                  <div className="flex items-center gap-3 text-[13px] truncate">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-[18px] h-[18px] object-contain mix-blend-multiply opacity-80 group-hover:opacity-100" />
                    ) : (
                      <span className="w-[18px] h-[18px] flex items-center justify-center bg-gray-300 rounded-full text-[10px] text-white font-bold">{cat.name.charAt(0)}</span>
                    )}
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
                </div>
                
                {/* Sidebar Cascader Flyout */}
                {cat.subCategories?.length > 0 && (
                  <div className="absolute left-[100%] top-0 pl-1 hidden group-hover:block z-50 w-[260px]">
                    <div className="bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <h4 className="font-extrabold text-gray-900 text-[14px]">{cat.name}</h4>
                      </div>
                      <div className="p-2 max-h-[300px] overflow-y-auto">
                        {cat.subCategories.map(sub => (
                          <div 
                            key={sub._id || sub.slug} 
                            className="px-3 py-2 text-[13px] text-gray-600 hover:text-[#FE2C55] hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              onCategorySelect && onCategorySelect(sub.slug || sub.name);
                            }}
                          >
                            {sub.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2. BROWSING HISTORY */}
          <div className="hidden lg:flex bg-[#f9f9fa] rounded-xl p-3 md:p-4 flex-col col-span-1 cursor-pointer group">
            <h3 className="font-bold text-gray-900 text-[16px] mb-3 tracking-tight">Browsing history</h3>
            <div className="relative flex-1 bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow border border-gray-100">
              <img src="https://images.unsplash.com/photo-1596422846543-75c6fc197f0a?w=300&h=300&fit=crop" alt="Browsing History" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[13px] font-extrabold text-gray-900 shadow-sm whitespace-nowrap">
                USh 6,205
              </div>
            </div>
          </div>

          {/* 3. KEEP LOOKING FOR 1 */}
          <div className="hidden lg:flex bg-[#f9f9fa] rounded-xl p-3 md:p-4 flex-col col-span-1 cursor-pointer group">
            <h3 className="font-bold text-gray-900 text-[16px] leading-tight tracking-tight">Keep looking for</h3>
            <p className="text-[13px] text-gray-500 mb-2 truncate">Electric City Bike</p>
            <div className="relative flex-1 bg-white rounded-xl overflow-hidden p-3 shadow-sm group-hover:shadow-md transition-shadow border border-gray-100 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&h=300&fit=crop" alt="Electric Bike" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[13px] font-extrabold text-gray-900 shadow-sm whitespace-nowrap">
                USh 326,789
              </div>
            </div>
          </div>

          {/* 4. KEEP LOOKING FOR 2 */}
          <div className="hidden lg:flex bg-[#f9f9fa] rounded-xl p-3 md:p-4 flex-col col-span-1 cursor-pointer group">
            <h3 className="font-bold text-gray-900 text-[16px] leading-tight tracking-tight">Keep looking for</h3>
            <p className="text-[13px] text-gray-500 mb-2 truncate">Electric Hybrid Bike</p>
            <div className="relative flex-1 bg-white rounded-xl overflow-hidden p-3 shadow-sm group-hover:shadow-md transition-shadow border border-gray-100 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=300&h=300&fit=crop" alt="Hybrid Bike" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[13px] font-extrabold text-gray-900 shadow-sm whitespace-nowrap">
                USh 670,124
              </div>
            </div>
          </div>

          {/* 5. DISCOVER TRENDS BANNER (White with Original Rounding & Shadows) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 lg:col-span-2 relative overflow-hidden flex flex-col cursor-pointer group">
            {/* Top Left Badge */}
            <div className="absolute top-0 left-0 bg-[#e5a05b] text-black font-extrabold px-3 py-1.5 rounded-br-xl text-[14px] z-20 flex items-center justify-center shadow-md">
              A
            </div>
            
            <div className="relative z-10 flex flex-col items-center justify-between h-full py-6 px-4">
              <h3 className="text-gray-900 font-extrabold text-[22px] md:text-[26px] text-center tracking-tight mb-2">
                Discover the latest trends
              </h3>
              
              <div className="flex-1 w-full flex items-center justify-center relative">
                 <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=300&fit=crop" alt="Trends" className="w-[85%] h-auto max-h-[160px] object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-700" />
              </div>
              
              <div className="flex flex-col items-center mt-4">
                <button className="bg-gray-900 text-white font-extrabold text-[15px] px-8 py-2.5 rounded-full mb-4 shadow-md hover:bg-gray-800 transition-colors">
                  View more
                </button>
                
                {/* Slider indicators */}
                <div className="flex items-center gap-2">
                  <span className="w-5 h-1.5 bg-gray-900 rounded-full transition-all"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full transition-all hover:bg-gray-400"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full transition-all hover:bg-gray-400"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full transition-all hover:bg-gray-400"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full transition-all hover:bg-gray-400"></span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* TOP DEALS (Restored background) */}
        {data.topDeals?.length > 0 && (
          <div className="bg-[#f7f8fa] rounded-xl p-4 md:p-6 mb-6 md:mb-10">
            <SectionHeader title="Top Deals" subtitle="Score the lowest prices on Ola" rightText="View more" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
              {data.topDeals.map(deal => (
                <div key={deal._id || deal.id} className="group cursor-pointer flex flex-col bg-white rounded-xl p-2 md:p-3 border border-transparent hover:border-gray-200 transition-colors">
                  <div className="h-[120px] md:h-[170px] flex items-center justify-center mb-2 md:mb-3 relative overflow-hidden bg-white">
                    <img src={deal.image} alt={deal.title} className="object-contain h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex items-center gap-1 font-extrabold text-[#FE2C55] text-[14px] md:text-[17px] mb-0.5 md:mb-1 truncate">
                    <Flame size={14} className="fill-current shrink-0" strokeWidth={2}/> <span className="truncate">{deal.price}</span>
                  </div>
                  <div className="text-[11px] md:text-[12px] text-gray-500 font-medium">MOQ: {deal.moq}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAILORED SELECTIONS (Restored background) */}
        {data.tailoredSelections?.length > 0 && (
          <div className="bg-[#f7f8fa] rounded-xl p-4 md:p-6 mb-6 md:mb-10">
            <SectionHeader title="Tailored Selections" rightText="View more" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {data.tailoredSelections.map((selection, idx) => (
                <div key={idx} className="cursor-pointer group flex flex-col h-full bg-white rounded-xl p-4 md:p-5 border border-transparent hover:border-gray-200 transition-colors">
                  <h3 className="font-extrabold text-gray-900 text-[15px] md:text-[16px] mb-1 md:mb-1.5 leading-snug group-hover:text-[#FE2C55] transition-colors line-clamp-1">{selection.title}</h3>
                  <p className="text-[11px] md:text-[12px] text-gray-500 font-medium mb-3 md:mb-4">{selection.views}</p>
                  <div className="flex gap-2 md:gap-3 mb-4 md:mb-5 mt-auto">
                    {selection.images?.map((img, i) => (
                      <div key={i} className="flex-1 bg-[#f7f8fa] rounded-lg aspect-square p-1.5 md:p-2 border border-transparent group-hover:border-gray-200 transition-colors">
                        <img src={img} alt="Part" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                    ))}
                  </div>
                  <div className="font-extrabold text-gray-900 text-[16px] md:text-[18px]">{selection.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM PRODUCT FEED (Restored #f2f2f6 background) */}
      {data.productGrid?.length > 0 && (
        <div className="bg-[#f2f2f6] w-full py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto px-3 md:px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {data.productGrid.map((product) => (
                <div key={product._id || product.id} className="bg-white rounded-xl p-2 md:p-3 cursor-pointer flex flex-col group border border-transparent hover:border-gray-200 transition-colors">
                  <div className="bg-[#f7f8fa] rounded-lg aspect-square mb-2 md:mb-3 relative overflow-hidden flex items-center justify-center p-2">
                    <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500" />
                  </div>
                  <h3 className="text-[12px] md:text-[13px] text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-[#FE2C55] transition-colors font-medium">
                    {product.title}
                  </h3>
                  <div className="mt-auto">
                    <div className="font-extrabold text-gray-900 text-[14px] md:text-[16px] mb-1 md:mb-1.5">{product.price}</div>
                    <div className="text-[10px] md:text-[11px] text-gray-500 flex justify-between items-center mb-1.5 md:mb-2 font-medium">
                      <span>MOQ: {product.moq}</span>
                      <span>{product.sold}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[10px] md:text-[11px] text-gray-500 font-medium">
                       {product.verified && <span className="text-[#25F4EE] font-bold flex items-center gap-0.5"><ShieldCheck size={12}/> Verified</span>}
                       {product.verified && <span>·</span>}
                       <span>{product.years} yr</span> 
                       <span>·</span> 
                       <span>CN</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductsView;