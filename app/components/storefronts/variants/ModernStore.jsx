import React from 'react';
import { Search, User, ChevronRight, ShoppingCart, Menu, MapPin, Phone, Mail, ChevronDown, Heart, List, Star, ShieldCheck } from 'lucide-react';

export default function ApparelStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  // Fallback to AliExpress vibrant Red/Orange if no theme color is provided
  const primaryColor = store?.themeColor || "#ff4747";
  const pageBg = "#f2f2f2"; // Standard marketplace light gray background

  const products = store?.products || [];

  return (
    <div className="font-sans pb-0 text-gray-800" style={{ backgroundColor: pageBg }}>
      
      {/* Top Utility Bar */}
      <div className="w-full bg-[#f5f5f5] border-b border-gray-200 text-[11px] md:text-xs text-gray-600 hidden md:block">
        <div className="max-w-[1200px] mx-auto px-4 py-1.5 flex justify-between items-center">
            <div className="flex gap-4">
                <span className="cursor-pointer hover:text-black transition-colors">Sell on {store?.title || 'Marketplace'}</span>
                <span className="cursor-pointer hover:text-black transition-colors">Help Center</span>
            </div>
            <div className="flex gap-4 items-center">
                <span className="cursor-pointer hover:text-black transition-colors flex items-center gap-1">
                    Buyer Protection
                </span>
                <span className="cursor-pointer hover:text-black transition-colors flex items-center gap-1">
                    English / USD <ChevronDown size={12}/>
                </span>
            </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="w-full bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          
          {/* Logo Section */}
          <div className="w-full md:w-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="md:hidden text-gray-600">
                <Menu size={24} />
              </div>
              {store?.logo ? (
                  <div className="h-8 md:h-10 flex items-center justify-start">
                      <img src={store.logo} alt={store?.title || "Store Logo"} className="h-full object-contain" />
                  </div>
              ) : (
                  <div className="flex items-center gap-1">
                     <span className="text-2xl md:text-3xl font-black tracking-tighter" style={{ color: primaryColor }}>
                        {store?.title ? store.title.split(' ')[0] : 'Ali'}
                     </span>
                     <span className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900">
                        {store?.title?.split(' ').slice(1).join(' ') || 'Express'}
                     </span>
                  </div>
              )}
            </div>

            {/* Mobile Cart */}
            <div className="flex md:hidden items-center gap-4 text-gray-700">
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white rounded-full" style={{ backgroundColor: primaryColor }}>0</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Center */}
          <div className="w-full md:flex-1 md:max-w-2xl flex items-center h-10 border-2 rounded-full overflow-hidden transition-colors hover:border-opacity-80 bg-white" style={{ borderColor: primaryColor }}>
             <input 
                type="text" 
                placeholder="I'm shopping for..." 
                className="flex-1 h-full bg-transparent border-none outline-none text-gray-800 text-sm px-4" 
             />
             <button className="h-full px-6 flex items-center justify-center text-white font-bold text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                <Search size={18} className="md:hidden" />
                <span className="hidden md:block">Search</span>
             </button>
          </div>

          {/* Right Controls - Desktop */}
          <div className="hidden md:flex items-center gap-6">
             <div className="flex items-center gap-2 cursor-pointer group">
                <User size={24} className="text-gray-700 group-hover:text-black transition-colors" />
                <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 leading-none">Welcome</span>
                    <span className="text-[13px] font-bold leading-none mt-1">Sign In / Register</span>
                </div>
             </div>
             
             <div className="flex flex-col items-center cursor-pointer group relative">
                <div className="relative text-gray-700 group-hover:text-black transition-colors">
                  <ShoppingCart size={28} />
                  <span className="absolute -top-1 -right-2 w-5 h-5 flex items-center justify-center text-[11px] font-bold text-white rounded-full border-2 border-white" style={{ backgroundColor: primaryColor }}>0</span>
                </div>
                <span className="text-[11px] font-medium mt-1">Cart</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="w-full bg-white border-b border-gray-200 hidden md:block">
         <div className="max-w-[1200px] mx-auto flex items-center">
            
            {/* Categories Dropdown Trigger */}
            <div className="flex items-center gap-2 px-4 py-3 text-white font-bold cursor-pointer w-64" style={{ backgroundColor: primaryColor }}>
               <List size={20} />
               <span>Categories</span>
            </div>
            
            {/* Horizontal Links */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide text-[13px] font-bold text-gray-700 px-4">
               {store?.categories && store.categories.length > 0 ? (
                  store.categories.map((cat, i) => (
                    <div key={i} className="px-4 py-3 cursor-pointer hover:text-[#ff4747] transition-colors whitespace-nowrap">
                       {cat}
                    </div>
                  ))
               ) : (
                  <>
                    <div className="px-4 py-3 cursor-pointer text-[#ff4747] whitespace-nowrap">SuperDeals</div>
                    <div className="px-4 py-3 cursor-pointer hover:text-[#ff4747] transition-colors whitespace-nowrap">Plus</div>
                    <div className="px-4 py-3 cursor-pointer hover:text-[#ff4747] transition-colors whitespace-nowrap">New Arrivals</div>
                    <div className="px-4 py-3 cursor-pointer hover:text-[#ff4747] transition-colors whitespace-nowrap">Top Brand</div>
                    <div className="px-4 py-3 cursor-pointer hover:text-[#ff4747] transition-colors whitespace-nowrap">Tech</div>
                    <div className="px-4 py-3 cursor-pointer hover:text-[#ff4747] transition-colors whitespace-nowrap">Home & Garden</div>
                  </>
               )}
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1200px] mx-auto px-2 md:px-4 py-4 md:py-6">
          
          {/* Hero Section */}
          <div className="w-full mb-8 flex gap-4">
             {/* Left Sidebar Mock (Desktop only) */}
             <div className="hidden md:flex flex-col w-64 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0 p-2">
                 {[...Array(8)].map((_, i) => (
                     <div key={i} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#ff4747] cursor-pointer rounded-lg transition-colors flex justify-between items-center">
                         Category {i + 1} <ChevronRight size={14} className="text-gray-400"/>
                     </div>
                 ))}
             </div>

             {/* Main Hero Banner */}
             <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden relative aspect-[16/7] md:aspect-[21/8] bg-gray-900 shadow-sm cursor-pointer group">
                <div className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2000&auto=format&fit=crop'})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
                
                <div className="absolute inset-y-0 left-0 p-6 md:p-10 flex flex-col justify-center max-w-xl text-white">
                   <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold w-max mb-3 border border-white/30">
                       🔥 Big Sale
                   </div>
                   <h2 className="text-3xl md:text-5xl font-black leading-tight mb-2 drop-shadow-md">
                      Unbeatable Deals <br/> Just For You
                   </h2>
                   <p className="text-sm md:text-lg font-medium mb-6 text-gray-200 max-w-sm drop-shadow-sm">
                      Up to 70% off on top tech, fashion, and home essentials.
                   </p>
                   <button className="w-max px-6 py-2.5 md:px-8 md:py-3 rounded-full text-white font-bold text-sm md:text-base transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: primaryColor }}>
                      Shop Now
                   </button>
                </div>
             </div>
          </div>

          {/* Products Grid */}
          <div ref={productsRef} className="scroll-mt-32">
             <div className="flex items-center gap-2 mb-6 px-2 md:px-0">
                 <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    More to love
                 </h3>
             </div>
             
             {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm">
                   <Search className="animate-pulse mb-4 text-gray-300" size={48}/> 
                   <span className="font-bold">Loading deals...</span>
                </div>
             ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm">
                   <span className="font-bold">No products available at the moment.</span>
                </div>
             ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                  {products.map((prod, i) => (
                    <div key={i} className="flex flex-col bg-white rounded-xl overflow-hidden hover:shadow-lg border border-transparent hover:border-gray-200 transition-all cursor-pointer group relative">
                      
                      {/* Image */}
                      <div className="w-full aspect-square relative bg-[#f9f9f9]">
                        <img 
                            src={prod.image || '/placeholder.png'} 
                            className="w-full h-full object-contain mix-blend-multiply" 
                            alt={prod.title} 
                        />
                        {/* Choice / Welcome Badge Mock */}
                        {i < 3 && (
                            <span className="absolute top-0 left-0 bg-[#ffd900] text-black text-[10px] font-black px-2 py-1 rounded-br-lg uppercase">
                                Choice
                            </span>
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      
                      <div className="p-2 md:p-3 flex flex-col flex-grow">
                          {/* Title */}
                          <h4 className="text-[12px] md:text-[13px] text-gray-700 leading-snug line-clamp-2 mb-1.5 min-h-[36px] md:min-h-[38px] group-hover:text-gray-900 transition-colors">
                            {prod.title}
                          </h4>

                          {/* Ratings Mock */}
                          <div className="flex items-center gap-1 mb-2">
                             <Star size={10} className="text-[#ff9000] fill-[#ff9000]"/>
                             <span className="text-[11px] text-gray-500">{(4 + (i % 10) / 10).toFixed(1)}</span>
                             <span className="text-[11px] text-gray-400 ml-1">· {10 + i * 23} sold</span>
                          </div>
                          
                          {/* Price Section */}
                          <div className="mt-auto">
                            <div className="flex items-baseline gap-1">
                                <span className="text-[11px] font-bold text-gray-900" style={{ color: primaryColor }}>$</span>
                                <span className="text-lg md:text-xl font-black leading-none" style={{ color: primaryColor }}>
                                    {prod.price ? Number(prod.price).toLocaleString() : '-'}
                                </span>
                            </div>
                            
                            {/* Shipping Tag Mock */}
                            <div className="flex items-center gap-1 mt-1.5">
                                <span className="text-[10px] font-bold px-1 py-0.5 rounded-sm bg-[#fff0f0] border border-[#ffcccc]" style={{ color: primaryColor }}>
                                    Free shipping
                                </span>
                            </div>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
      </div>

      {/* Footer Area */}
      <div ref={contactRef} className="bg-[#2a2a2a] text-gray-400 mt-12 text-sm border-t-4" style={{ borderColor: primaryColor }}>
         <div className="max-w-[1200px] mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                
                {/* Col 1 */}
                <div>
                    <h4 className="text-white font-bold mb-4">Customer Service</h4>
                    <ul className="space-y-2">
                        <li className="hover:text-white cursor-pointer transition-colors">Help Center</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Transaction Services</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Agreement for EU Consumers</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Take our feedback survey</li>
                    </ul>
                </div>

                {/* Col 2 */}
                <div>
                    <h4 className="text-white font-bold mb-4">Shopping with Us</h4>
                    <ul className="space-y-2">
                        <li className="hover:text-white cursor-pointer transition-colors">Making payments</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Delivery options</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Buyer Protection</li>
                    </ul>
                </div>

                {/* Col 3 */}
                <div>
                    <h4 className="text-white font-bold mb-4">Collaborate with Us</h4>
                    <ul className="space-y-2">
                        <li className="hover:text-white cursor-pointer transition-colors">Partnerships</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Affiliate program</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Seller Log In</li>
                    </ul>
                </div>

                {/* Col 4 */}
                <div>
                    <h4 className="text-white font-bold mb-4">Contact & Security</h4>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                           <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-300"/> 
                           <span className="text-xs">{store?.location?.address || 'Global Marketplace HQ'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                           <Phone size={16} className="flex-shrink-0 text-gray-300"/> 
                           <span className="text-xs">{store?.contact?.phone || '+1 234 567 890'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                           <ShieldCheck size={16} className="flex-shrink-0 text-gray-300"/> 
                           <span className="text-xs">Secure payments & privacy protection</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-500 pt-8 border-t border-gray-700 flex flex-col gap-2">
                <p>
                    Intellectual Property Protection - Privacy Policy - Sitemap - Terms of Use - Information for EU consumers
                </p>
                <p>
                    © {new Date().getFullYear()} {store?.title || 'Marketplace'} All rights reserved.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
}