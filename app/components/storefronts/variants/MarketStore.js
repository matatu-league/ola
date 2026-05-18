import React from 'react';
import { Search, ShoppingBag, Menu, MapPin, Phone, ShieldCheck, Heart, Share2, Play, Flame, CheckCircle2 } from 'lucide-react';

export default function SocialStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  // Fallback to TikTok's signature pink/red if no theme color is provided
  const primaryColor = store?.themeColor || "#FE2C55";
  const cyanAccent = "#25F4EE";
  const pageBg = "#f8f8f8"; // Soft gray to make white content cards pop

  const products = store?.products || [];

  return (
    <div className="font-sans pb-0 text-gray-900" style={{ backgroundColor: pageBg }}>
      
      {/* Main Header - Clean & Sticky */}
      <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Mobile Nav */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="md:hidden text-gray-800">
              <Menu size={24} />
            </div>
            {store?.logo ? (
                <div className="h-8 md:h-10 flex items-center justify-start">
                    <img src={store.logo} alt={store?.title || "Store Logo"} className="h-full object-contain" />
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                   <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: primaryColor }}>
                       {store?.title?.charAt(0)?.toUpperCase() || 'S'}
                   </div>
                   <span className="text-xl md:text-2xl font-extrabold tracking-tight">
                      {store?.title || 'SocialShop'}
                   </span>
                </div>
            )}
          </div>
          
          {/* Search Bar - Hidden on small mobile, expands on md */}
          <div className="hidden md:flex flex-1 max-w-xl items-center h-10 bg-gray-100 rounded-full px-2 overflow-hidden transition-all focus-within:ring-2 focus-within:bg-white" style={{ '--tw-ring-color': primaryColor }}>
             <Search size={18} className="text-gray-500 ml-2" />
             <input 
                type="text" 
                placeholder="Search products, brands, and creators..." 
                className="flex-1 h-full bg-transparent border-none outline-none text-gray-800 text-sm px-3" 
             />
             <button className="h-8 px-4 rounded-full text-white font-bold text-xs" style={{ backgroundColor: primaryColor }}>
                Search
             </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-5">
             <Search size={22} className="md:hidden text-gray-800" />
             <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                <ShoppingBag size={24} className="text-gray-800" />
                <span className="absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white rounded-full border border-white" style={{ backgroundColor: primaryColor }}>0</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-[1200px] mx-auto px-0 md:px-4 py-0 md:py-6">
          
          {/* Categories / Tabs Scroller */}
          <div className="bg-white md:bg-transparent border-b border-gray-100 md:border-none mb-2 md:mb-6">
            <div className="flex items-center overflow-x-auto scrollbar-hide text-sm font-bold text-gray-500 px-4 md:px-0 py-3 gap-6">
                <div className="cursor-pointer whitespace-nowrap text-black relative flex flex-col items-center">
                    <span>Shop</span>
                    <div className="w-6 h-1 rounded-full absolute -bottom-3" style={{ backgroundColor: primaryColor }}></div>
                </div>
                <div className="cursor-pointer whitespace-nowrap hover:text-black transition-colors">Campaigns</div>
                <div className="cursor-pointer whitespace-nowrap hover:text-black transition-colors">Creators</div>
                {store?.categories && store.categories.length > 0 ? (
                  store.categories.map((cat, i) => (
                    <div key={i} className="cursor-pointer whitespace-nowrap hover:text-black transition-colors">
                       {cat}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="cursor-pointer whitespace-nowrap hover:text-black transition-colors">Beauty</div>
                    <div className="cursor-pointer whitespace-nowrap hover:text-black transition-colors">Fashion</div>
                    <div className="cursor-pointer whitespace-nowrap hover:text-black transition-colors">Electronics</div>
                  </>
                )}
            </div>
          </div>

          {/* Social Hero Section (Simulating a featured video/content block) */}
          <div className="w-full mb-8 flex flex-col md:flex-row gap-4 px-4 md:px-0">
             
             {/* Featured Content Block (4:5 Aspect Ratio for Social Feel) */}
             <div className="w-full md:w-2/3 lg:w-3/4 rounded-2xl overflow-hidden relative aspect-[4/3] md:aspect-[21/9] bg-black shadow-sm group cursor-pointer">
                <div className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop'})` }}></div>
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Floating Social Icons (Right Side) */}
                <div className="absolute right-4 bottom-16 md:bottom-8 flex flex-col gap-4 items-center z-20">
                    <div className="flex flex-col items-center gap-1 group/icon">
                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                            <Heart size={20} className="group-hover/icon:fill-white" />
                        </div>
                        <span className="text-white text-[10px] font-bold drop-shadow-md">12.4K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 group/icon">
                        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                            <Share2 size={20} />
                        </div>
                        <span className="text-white text-[10px] font-bold drop-shadow-md">Share</span>
                    </div>
                </div>

                {/* Content Details (Bottom Left) */}
                <div className="absolute bottom-6 left-6 right-20 flex flex-col z-20">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                            <img src={store?.logo || "/placeholder.png"} className="w-full h-full object-cover" alt="Avatar"/>
                        </div>
                        <span className="text-white font-bold text-sm drop-shadow-md">@{store?.title?.replace(/\s+/g, '').toLowerCase() || 'officialstore'}</span>
                        <CheckCircle2 size={14} className="text-[#25F4EE] fill-black/50" />
                    </div>
                    <h2 className="text-white text-xl md:text-3xl font-bold leading-tight mb-3 drop-shadow-md line-clamp-2">
                       Trending Now: The viral products everyone is talking about! 🛒✨
                    </h2>
                    
                    {/* Embedded Product Link Mockup */}
                    <div className="bg-white/90 backdrop-blur-md rounded-lg p-2 flex items-center gap-3 w-max max-w-[280px] hover:bg-white transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-gray-200 rounded object-cover overflow-hidden flex-shrink-0">
                            <img src={products[0]?.image || '/placeholder.png'} className="w-full h-full object-cover" alt="Product"/>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-gray-900 truncate">{products[0]?.title || 'Featured Viral Product'}</span>
                            <span className="text-sm font-black" style={{ color: primaryColor }}>${products[0]?.price || '29.99'}</span>
                        </div>
                        <div className="w-7 h-7 rounded-full ml-2 flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                            <ShoppingBag size={14} />
                        </div>
                    </div>
                </div>
             </div>

             {/* Side Trending Banner (Desktop only) */}
             <div className="hidden md:flex w-1/3 lg:w-1/4 rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#FE2C55]/10 to-[#25F4EE]/10 border border-[#FE2C55]/20 flex-col justify-center items-center p-6 text-center shadow-sm">
                <Flame className="text-[#FE2C55] mb-2" size={32} />
                <h3 className="text-2xl font-black mb-2 text-gray-900 leading-tight">Flash<br/>Deals</h3>
                <p className="text-sm text-gray-600 mb-6">Ends in: <span className="font-bold text-[#FE2C55]">04:23:59</span></p>
                <button className="w-full py-3 rounded-full text-white font-bold shadow-md hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
                    Shop the Drop
                </button>
             </div>
          </div>

          {/* Product Grid - Two Columns on Mobile (Social Feed Style) */}
          <div ref={productsRef} className="px-2 md:px-0 scroll-mt-24">
             <div className="flex items-center gap-2 mb-4 px-2">
                 <h3 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                    Just For You
                 </h3>
             </div>
             
             {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                   <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FE2C55] rounded-full animate-spin mb-4"></div>
                   <span className="font-bold text-sm">Loading feed...</span>
                </div>
             ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                   <span className="font-bold">No products available at the moment.</span>
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                  {products.map((prod, i) => {
                    // Generate random "social proof" metrics
                    const soldCount = Math.floor(Math.random() * 900) + 50; 
                    const isVideo = i % 5 === 0; // Fake some products as "video" posts
                    
                    return (
                        <div key={i} className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative pb-2 border border-gray-100">
                          
                          {/* Image Container (4:5 Aspect Ratio for Social Vibe) */}
                          <div className="w-full aspect-[4/5] relative bg-gray-100 overflow-hidden">
                            <img 
                                src={prod.image || '/placeholder.png'} 
                                className="w-full h-full object-cover mix-blend-multiply" 
                                alt={prod.title} 
                            />
                            
                            {/* Top Left Badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {i < 2 && (
                                    <span className="bg-[#FE2C55] text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm leading-none">
                                        Top Seller
                                    </span>
                                )}
                            </div>

                            {/* Bottom Left Social Proof Overlay */}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-white text-[9px] md:text-[10px] font-bold flex items-center gap-1">
                                    <ShoppingBag size={10} /> {soldCount > 1000 ? `${(soldCount/1000).toFixed(1)}k` : soldCount} sold
                                </div>
                                {isVideo && (
                                    <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                                        <Play size={10} className="ml-0.5" />
                                    </div>
                                )}
                            </div>
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-2 md:p-3 flex flex-col flex-grow">
                              <h4 className="text-[12px] md:text-[13px] font-medium text-gray-800 leading-tight line-clamp-2 mb-2 min-h-[34px]">
                                {prod.title}
                              </h4>
                              
                              {/* Price Section */}
                              <div className="mt-auto">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-sm md:text-base font-extrabold" style={{ color: primaryColor }}>
                                        {prod.price ? `$${Number(prod.price).toLocaleString()}` : '-'}
                                    </span>
                                    {prod.price && i % 3 === 0 && (
                                        <span className="text-[10px] md:text-[11px] text-gray-400 line-through">
                                            ${(Number(prod.price) * 1.5).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Free Shipping Tag */}
                                <div className="w-max">
                                    <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#FE2C55]/30 text-[#FE2C55] bg-[#FE2C55]/5">
                                        Free shipping
                                    </span>
                                </div>
                              </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
             )}
          </div>
      </div>

      {/* Footer Area - Minimalist App Style */}
      <div ref={contactRef} className="bg-white text-gray-600 mt-8 border-t border-gray-200">
         <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                
                {/* Store Info */}
                <div className="col-span-1 lg:col-span-1">
                    <h4 className="text-black font-extrabold mb-4 text-lg">{store?.title || 'SocialShop'}</h4>
                    <p className="text-sm mb-4 leading-relaxed text-gray-500">
                        Your daily destination for viral trends, must-have products, and unbeatable deals.
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><div className="w-4 h-4 bg-gray-400 rounded-sm"></div></div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><div className="w-4 h-4 bg-gray-400 rounded-full"></div></div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><div className="w-4 h-4 bg-gray-400 rounded-sm"></div></div>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-black font-bold mb-4 text-sm">Shop</h4>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li className="hover:text-black cursor-pointer transition-colors">All Products</li>
                        <li className="hover:text-black cursor-pointer transition-colors">Trending Now</li>
                        <li className="hover:text-black cursor-pointer transition-colors">New Arrivals</li>
                        <li className="hover:text-black cursor-pointer transition-colors">Flash Sales</li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h4 className="text-black font-bold mb-4 text-sm">Support</h4>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li className="hover:text-black cursor-pointer transition-colors">Help Center</li>
                        <li className="hover:text-black cursor-pointer transition-colors">Track Order</li>
                        <li className="hover:text-black cursor-pointer transition-colors">Return Policy</li>
                        <li className="hover:text-black cursor-pointer transition-colors">Contact Us</li>
                    </ul>
                </div>

                {/* Contact Us */}
                <div>
                    <h4 className="text-black font-bold mb-4 text-sm">Contact</h4>
                    <ul className="space-y-4 text-sm text-gray-500">
                        <li className="flex items-start gap-3">
                           <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: primaryColor }}/> 
                           <span>{store?.location?.address || 'Creator Hub, CA 90210'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                           <Phone size={18} className="flex-shrink-0" style={{ color: primaryColor }}/> 
                           <span>{store?.contact?.phone || '+1 800 123 4567'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                           <ShieldCheck size={18} className="flex-shrink-0" style={{ color: primaryColor }}/> 
                           <span className="font-bold text-gray-800">Secure Checkout</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 pt-6 border-t border-gray-100">
                <p>
                    © {new Date().getFullYear()} {store?.title || 'SocialShop'}. Built for creators and fans.
                </p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <span className="hover:text-gray-600 cursor-pointer">Terms</span>
                    <span className="hover:text-gray-600 cursor-pointer">Privacy</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}