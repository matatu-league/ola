import React from 'react';
import { Search, User, ShoppingCart, Menu, MapPin, Phone, Mail, ChevronRight, Grid, LayoutGrid } from 'lucide-react';

export default function ModernStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  // Fallback to the classic Walmart Blue if no theme color is provided
  const primaryColor = store?.themeColor || "#0071ce";
  const accentColor = "#ffc220"; // Signature yellow accent
  const pageBg = "#f2f8fd"; // Light blue/gray page background

  const products = store?.products || [];

  return (
    <div className="font-sans pb-0" style={{ backgroundColor: pageBg }}>
      
      {/* Header Area */}
      <header className="w-full text-white sticky top-0 z-50 shadow-md" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-[1440px] mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Top Row for Mobile (Logo & Icons) */}
          <div className="w-full md:w-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="md:hidden bg-white/20 p-1.5 rounded-full cursor-pointer hover:bg-white/30 transition-colors">
                <Menu size={24} />
              </div>
              {store?.logo ? (
                  <div className="h-10 flex items-center justify-start bg-white rounded-full px-3 py-1">
                      <img src={store.logo} alt={store?.title || "Store Logo"} className="h-full object-contain" />
                  </div>
              ) : (
                  <div className="flex items-center gap-2">
                     <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="text-2xl font-black" style={{ color: primaryColor }}>
                           {store?.title?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                     </div>
                     <span className="text-xl md:text-2xl font-bold tracking-tight">
                        {store?.title || 'MegaMart'}
                     </span>
                  </div>
              )}
            </div>

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center gap-4">
              <User size={24} />
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-black rounded-full" style={{ backgroundColor: accentColor }}>0</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Center */}
          <div className="w-full md:flex-1 md:max-w-3xl flex items-center h-10 md:h-12 bg-white rounded-full px-2 overflow-hidden shadow-sm">
             <input 
                type="text" 
                placeholder="Search everything at online store..." 
                className="flex-1 h-full bg-transparent border-none outline-none text-gray-800 text-sm md:text-base px-4 placeholder-gray-500" 
             />
             <div className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105" style={{ backgroundColor: accentColor }}>
                <Search size={18} style={{ color: primaryColor }} />
             </div>
          </div>

          {/* Right Controls - Desktop */}
          <div className="hidden md:flex items-center gap-6">
             <div className="flex flex-col items-start cursor-pointer hover:bg-black/10 px-3 py-1.5 rounded-full transition-colors">
                <span className="text-[11px] font-medium leading-none">Sign In</span>
                <span className="text-[14px] font-bold flex items-center gap-1 leading-none mt-1">Account <User size={16}/></span>
             </div>
             
             <div className="flex flex-col items-center cursor-pointer hover:bg-black/10 px-3 py-1.5 rounded-full transition-colors relative">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-black rounded-full" style={{ backgroundColor: accentColor }}>0</span>
                </div>
                <span className="text-[12px] font-bold mt-1 leading-none">$0.00</span>
             </div>
          </div>

        </div>
      </header>

      {/* Main Navigation (Departments & Services) */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm hidden md:block relative z-40">
         <div className="max-w-[1440px] mx-auto px-4 flex items-center gap-2 overflow-x-auto scrollbar-hide text-sm font-bold text-gray-700 py-2">
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer mr-2 border border-gray-200">
               <Grid size={16} /> Departments
            </div>
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer mr-2 border border-gray-200">
               <LayoutGrid size={16} /> Services
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            {store?.categories && store.categories.length > 0 ? (
               store.categories.map((cat, i) => (
                 <div key={i} className="px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer whitespace-nowrap transition-colors">
                    {cat}
                 </div>
               ))
            ) : (
               <>
                 <div className="px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer whitespace-nowrap transition-colors">Electronics</div>
                 <div className="px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer whitespace-nowrap transition-colors">Home & Furniture</div>
                 <div className="px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer whitespace-nowrap transition-colors">Clothing</div>
                 <div className="px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer whitespace-nowrap transition-colors">Toys</div>
                 <div className="px-4 py-2 hover:bg-gray-100 rounded-full cursor-pointer whitespace-nowrap transition-colors">Grocery</div>
               </>
            )}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
          
          {/* Hero Section */}
          <div className="w-full mb-10 rounded-2xl md:rounded-[2rem] overflow-hidden relative aspect-[21/9] md:aspect-[3/1] bg-gray-900 shadow-sm cursor-pointer group">
             <div className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2000&auto=format&fit=crop'})` }}></div>
             <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
             
             <div className="absolute inset-y-0 left-0 p-6 md:p-12 flex flex-col justify-center max-w-2xl text-white">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-2 md:mb-4">
                   Everyday low prices, <br/> guaranteed.
                </h2>
                <p className="text-sm md:text-xl font-medium mb-6 md:mb-8 text-gray-200">
                   Discover millions of items ready to ship today.
                </p>
                <button className="w-max px-8 py-3 md:px-10 md:py-4 rounded-full text-black font-bold text-sm md:text-base transition-transform hover:scale-105 shadow-md" style={{ backgroundColor: accentColor }}>
                   Shop All Rollbacks
                </button>
             </div>
          </div>

          {/* Products Section */}
          <div ref={productsRef} className="scroll-mt-32">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                    Featured Products
                 </h3>
                 <span className="text-sm font-bold underline cursor-pointer hover:opacity-80" style={{ color: primaryColor }}>View All</span>
             </div>
             
             {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm">
                   <Search className="animate-pulse mb-4 text-gray-300" size={48}/> 
                   <span className="font-bold">Loading inventory...</span>
                </div>
             ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm">
                   <span className="font-bold">No products available at the moment.</span>
                </div>
             ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                  {products.map((prod, i) => (
                    <div key={i} className="flex flex-col bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-gray-100 transition-all cursor-pointer group">
                      
                      {/* Image */}
                      <div className="w-full aspect-square flex items-center justify-center p-2 mb-4 relative overflow-hidden">
                        <img 
                            src={prod.image || '/placeholder.png'} 
                            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                            alt={prod.title} 
                        />
                        {/* Mock Best Seller Badge on first item */}
                        {i === 0 && (
                            <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg rounded-tl-lg uppercase tracking-wider">
                                Best Seller
                            </span>
                        )}
                      </div>
                      
                      {/* Price Section */}
                      <div className="mb-2">
                         <span className="text-xl md:text-2xl font-black text-[#2a8703]">
                             {prod.price ? `$${Number(prod.price).toLocaleString()}` : '-'}
                         </span>
                         {i % 3 === 0 && prod.price && (
                             <span className="text-xs font-medium text-gray-500 line-through ml-2">
                                 ${(Number(prod.price) * 1.3).toLocaleString()}
                             </span>
                         )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm text-gray-700 font-medium leading-tight mb-4 line-clamp-2 min-h-[38px] group-hover:underline decoration-gray-400">
                         {prod.title}
                      </h4>
                      
                      {/* Add to Cart Button */}
                      <button 
                          className="mt-auto w-full py-2 md:py-2.5 rounded-full text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 hover:brightness-110" 
                          style={{ backgroundColor: primaryColor }}
                      >
                         <span>Add to cart</span>
                      </button>
                    </div>
                  ))}
                </div>
             )}
          </div>
      </div>

      {/* Footer Area */}
      <div ref={contactRef} className="text-white mt-12" style={{ backgroundColor: '#004f9a' }}>
         <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-12 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                
                {/* Col 1 */}
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <span className="text-xl font-black" style={{ color: '#004f9a' }}>
                                {store?.title?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            {store?.title || 'MegaMart'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed pr-4">
                        Save Money. Live Better. We are dedicated to providing the lowest prices every single day.
                    </p>
                </div>

                {/* Col 2 */}
                <div>
                    <h4 className="text-white text-sm font-bold mb-4">Customer Service</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li className="hover:text-white hover:underline cursor-pointer">Help Center</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Returns</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Product Recalls</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Accessibility</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Contact Us</li>
                    </ul>
                </div>

                {/* Col 3 */}
                <div>
                    <h4 className="text-white text-sm font-bold mb-4">About Us</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li className="hover:text-white hover:underline cursor-pointer">Our Story</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Careers</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Corporate Responsibility</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Investors</li>
                        <li className="hover:text-white hover:underline cursor-pointer">Suppliers</li>
                    </ul>
                </div>

                {/* Col 4 */}
                <div className="col-span-2 md:col-span-1 lg:col-span-2">
                    <h4 className="text-white text-sm font-bold mb-4">Contact Information</h4>
                    <ul className="space-y-4 text-sm text-gray-300">
                        <li className="flex items-start gap-3">
                           <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: accentColor }}/> 
                           <span>{store?.location?.address || '123 Main Street, Retail City, USA'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                           <Phone size={18} className="shrink-0" style={{ color: accentColor }}/> 
                           <span>{store?.contact?.phone || '1-800-555-0199'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                           <Mail size={18} className="shrink-0" style={{ color: accentColor }}/> 
                           <span>{store?.contact?.email || 'help@megamart.com'}</span>
                        </li>
                    </ul>
                </div>

            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-300 pt-8 border-t border-white/20">
                <p>© {new Date().getFullYear()} {store?.title || 'MegaMart'} Inc. All Rights Reserved.</p>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4 md:mt-0">
                    <span className="hover:text-white hover:underline cursor-pointer">Terms of Use</span>
                    <span className="hover:text-white hover:underline cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-white hover:underline cursor-pointer">CA Privacy Rights</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}