import React from 'react';
import { Search, User, ShoppingCart, Menu, MapPin, Phone, ShieldCheck, ChevronRight, Truck, RefreshCcw, Tag, Flame, Star } from 'lucide-react';

export default function DealsStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  // Fallback to Temu's signature bright orange if no theme color is provided
  const primaryColor = store?.themeColor || "#fb7701";
  const pageBg = "#f5f5f5"; // Very light gray background to make white cards pop

  const products = store?.products || [];

  return (
    <div className="font-sans pb-0 text-gray-800" style={{ backgroundColor: pageBg }}>
      
      {/* Top Utility Bar (Trust & Urgency) */}
      <div className="w-full text-white text-[11px] md:text-[13px] font-bold py-2 px-4 flex justify-center items-center gap-4 md:gap-8 cursor-pointer transition-colors hover:brightness-110" style={{ backgroundColor: primaryColor }}>
        <span className="flex items-center gap-1.5"><Truck size={16} /> Free shipping on all orders</span>
        <span className="hidden md:flex items-center gap-1.5"><RefreshCcw size={14} /> Free returns within 90 days</span>
        <span className="hidden md:flex items-center gap-1.5"><Tag size={14} /> Price adjustment within 30 days</span>
      </div>

      {/* Main Header */}
      <header className="w-full bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-8">
          
          {/* Logo & Mobile Nav */}
          <div className="w-full md:w-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="md:hidden text-gray-700">
                <Menu size={26} />
              </div>
              {store?.logo ? (
                  <div className="h-8 md:h-11 flex items-center justify-start">
                      <img src={store.logo} alt={store?.title || "Store Logo"} className="h-full object-contain" />
                  </div>
              ) : (
                  <div className="flex items-center gap-1">
                     <span className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: primaryColor }}>
                        {store?.title || 'MegaDeals'}
                     </span>
                  </div>
              )}
            </div>

            {/* Mobile Cart */}
            <div className="flex md:hidden items-center gap-4 text-gray-700">
              <div className="relative">
                <ShoppingCart size={26} />
                <span className="absolute -top-1.5 -right-2 w-5 h-5 flex items-center justify-center text-[11px] font-bold text-white rounded-full border-2 border-white" style={{ backgroundColor: primaryColor }}>0</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Center */}
          <div className="w-full md:flex-1 md:max-w-3xl flex items-center h-10 md:h-12 border-[2.5px] rounded-full overflow-hidden bg-white" style={{ borderColor: primaryColor }}>
             <input 
                type="text" 
                placeholder="Search for amazing deals..." 
                className="flex-1 h-full bg-transparent border-none outline-none text-gray-800 text-sm md:text-base px-5 font-medium" 
             />
             <button className="h-full px-6 md:px-8 flex items-center justify-center text-white font-bold text-sm md:text-base transition-colors hover:brightness-105" style={{ backgroundColor: primaryColor }}>
                <Search size={20} className="md:hidden" />
                <span className="hidden md:block">Search</span>
             </button>
          </div>

          {/* Right Controls - Desktop */}
          <div className="hidden md:flex items-center gap-8">
             <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <User size={28} className="text-gray-700" />
                <div className="flex flex-col">
                    <span className="text-[12px] text-gray-500 leading-none">Sign in / Register</span>
                    <span className="text-[14px] font-bold leading-none mt-1">Orders & Account</span>
                </div>
             </div>
             
             <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity relative">
                <div className="relative text-gray-700">
                  <ShoppingCart size={30} />
                  <span className="absolute -top-1.5 -right-2.5 w-5 h-5 flex items-center justify-center text-[12px] font-bold text-white rounded-full border-2 border-white" style={{ backgroundColor: primaryColor }}>0</span>
                </div>
             </div>
          </div>
        </div>
        
        {/* Categories Scroller */}
        <div className="border-t border-gray-100">
            <div className="max-w-[1400px] mx-auto flex items-center overflow-x-auto scrollbar-hide text-[14px] font-bold text-gray-700 px-2 md:px-4">
                <div className="px-4 py-2.5 cursor-pointer border-b-[3px] whitespace-nowrap" style={{ borderColor: primaryColor, color: primaryColor }}>
                    Best Sellers
                </div>
                <div className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">
                    5-Star Rated
                </div>
                <div className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">
                    Lightning Deals
                </div>
                {store?.categories && store.categories.length > 0 ? (
                  store.categories.map((cat, i) => (
                    <div key={i} className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">
                       {cat}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">Home & Kitchen</div>
                    <div className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">Women's Clothing</div>
                    <div className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">Electronics</div>
                    <div className="px-4 py-2.5 cursor-pointer hover:text-[#fb7701] border-b-[3px] border-transparent transition-colors whitespace-nowrap">Beauty & Health</div>
                  </>
                )}
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-2 md:px-4 py-4 md:py-6">
          
          {/* Hero Section */}
          <div className="w-full mb-6 rounded-xl overflow-hidden relative aspect-[16/6] md:aspect-[21/6] shadow-sm cursor-pointer group bg-[#111]">
             {/* Abstract background representing typical marketplace sale graphics */}
             <div className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2000&auto=format&fit=crop'})` }}></div>
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
             
             <div className="absolute inset-y-0 left-0 p-6 md:p-12 flex flex-col justify-center max-w-xl text-white z-10">
                <div className="flex items-center gap-2 mb-2 md:mb-4">
                    <Flame className="text-yellow-400 fill-yellow-400 animate-pulse" size={24} />
                    <span className="text-yellow-400 font-black text-sm md:text-lg tracking-wider uppercase">Mega Clearance</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black leading-none mb-2 md:mb-4 tracking-tight drop-shadow-lg">
                   Up to <span style={{ color: primaryColor }}>90%</span> OFF
                </h2>
                <p className="text-sm md:text-xl font-medium mb-6 md:mb-8 text-gray-200 drop-shadow-md">
                   Shop the biggest discounts of the year. Limited quantities available!
                </p>
                <button className="w-max px-8 py-3 md:px-10 md:py-4 rounded-full text-white font-black text-sm md:text-lg transition-transform hover:scale-105 shadow-[0_4px_14px_0_rgba(251,119,1,0.39)]" style={{ backgroundColor: primaryColor }}>
                   SHOP NOW
                </button>
             </div>
          </div>

          {/* Trust Badges Strip (Mobile visible, Desktop prominent) */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6 bg-white p-3 md:p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
             <div className="flex items-center gap-2 text-gray-700 text-[11px] md:text-sm font-bold">
                 <ShieldCheck size={18} style={{ color: primaryColor }}/> Safe Payment Options
             </div>
             <span className="hidden md:block text-gray-300">|</span>
             <div className="flex items-center gap-2 text-gray-700 text-[11px] md:text-sm font-bold">
                 <MapPin size={18} style={{ color: primaryColor }}/> Tracked Delivery
             </div>
             <span className="hidden md:block text-gray-300">|</span>
             <div className="flex items-center gap-2 text-gray-700 text-[11px] md:text-sm font-bold">
                 <Star size={18} className="fill-yellow-400 text-yellow-400"/> Authentic Reviews
             </div>
          </div>

          {/* Products Grid */}
          <div ref={productsRef} className="scroll-mt-32">
             <div className="flex items-center gap-2 mb-4 px-2 md:px-0">
                 <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Flame className="text-red-500 fill-red-500" size={24}/> Lightning Deals
                 </h3>
             </div>
             
             {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm">
                   <Search className="animate-pulse mb-4 text-gray-300" size={48}/> 
                   <span className="font-bold">Loading amazing deals...</span>
                </div>
             ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl shadow-sm">
                   <span className="font-bold">No deals available at the moment.</span>
                </div>
             ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                  {products.map((prod, i) => {
                    // Generate mock data for the urgency/deal aesthetic
                    const discount = Math.floor(Math.random() * (90 - 40 + 1) + 40); // 40% to 90% off
                    const soldCount = Math.floor(Math.random() * 50) + 5; // 5k to 55k
                    const rating = (4 + (i % 10) / 10).toFixed(1);
                    
                    return (
                        <div key={i} className="flex flex-col bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative">
                          
                          {/* Image */}
                          <div className="w-full aspect-square relative bg-white">
                            <img 
                                src={prod.image || '/placeholder.png'} 
                                className="w-full h-full object-contain mix-blend-multiply p-2 group-hover:scale-105 transition-transform duration-300" 
                                alt={prod.title} 
                            />
                            {/* "Almost Sold Out" or "Sale" Badges */}
                            {i % 4 === 0 && (
                                <span className="absolute bottom-0 left-0 w-full bg-[#fcedeb] text-[#e02b2b] text-[10px] md:text-[11px] font-bold px-2 py-1 text-center">
                                    Almost sold out
                                </span>
                            )}
                          </div>
                          
                          <div className="p-2 md:p-3 flex flex-col flex-grow">
                              {/* Title */}
                              <h4 className="text-[12px] md:text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 mb-1 min-h-[36px] md:min-h-[38px] group-hover:underline">
                                {prod.title}
                              </h4>

                              {/* Ratings Mock */}
                              <div className="flex items-center gap-1 mb-2">
                                 <Star size={10} className="text-gray-400 fill-gray-400"/>
                                 <span className="text-[11px] font-bold text-gray-500">{rating}</span>
                                 <span className="text-[11px] text-gray-400 ml-1">({soldCount}k+ sold)</span>
                              </div>
                              
                              {/* Price Section */}
                              <div className="mt-auto relative">
                                <div className="flex items-end gap-1.5 flex-wrap">
                                    <span className="text-lg md:text-2xl font-black leading-none tracking-tight" style={{ color: primaryColor }}>
                                        {prod.price ? `$${Number(prod.price).toLocaleString()}` : '-'}
                                    </span>
                                    {prod.price && (
                                        <span className="text-[11px] md:text-[12px] text-gray-400 line-through mb-0.5">
                                            ${(Number(prod.price) * (1 + discount/100)).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Free Shipping Tag */}
                                <div className="mt-1.5">
                                    <span className="text-[10px] md:text-[11px] font-bold text-gray-600">
                                        Free shipping
                                    </span>
                                </div>

                                {/* Mini Add to Cart Button (Bottom Right) */}
                                <button className="absolute bottom-0 right-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: primaryColor }}>
                                    <ShoppingCart size={16} />
                                </button>
                              </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
             )}
          </div>
      </div>

      {/* Footer Area */}
      <div ref={contactRef} className="bg-white text-gray-600 mt-8 border-t border-gray-200">
         <div className="max-w-[1400px] mx-auto px-4 py-10 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                
                {/* Col 1 */}
                <div>
                    <h4 className="text-black font-black mb-4 uppercase tracking-wider text-sm">Customer Service</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Return and refund policy</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Intellectual property policy</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Shipping info</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Report suspicious activity</li>
                    </ul>
                </div>

                {/* Col 2 */}
                <div>
                    <h4 className="text-black font-black mb-4 uppercase tracking-wider text-sm">Help</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Support center & FAQ</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Safety center</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Purchase protection</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Sitemap</li>
                    </ul>
                </div>

                {/* Col 3 */}
                <div>
                    <h4 className="text-black font-black mb-4 uppercase tracking-wider text-sm">About {store?.title || 'Store'}</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">About us</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Affiliate program</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Careers</li>
                        <li className="hover:text-black hover:underline cursor-pointer transition-colors">Press</li>
                    </ul>
                </div>

                {/* Col 4 */}
                <div>
                    <h4 className="text-black font-black mb-4 uppercase tracking-wider text-sm">Contact Us</h4>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-start gap-3">
                           <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: primaryColor }}/> 
                           <span>{store?.location?.address || 'Global E-commerce Hub'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                           <Phone size={18} className="flex-shrink-0" style={{ color: primaryColor }}/> 
                           <span>{store?.contact?.phone || '+1 888 123 4567'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                           <ShieldCheck size={18} className="flex-shrink-0" style={{ color: primaryColor }}/> 
                           <span className="font-bold text-gray-800">Secure Payments Guaranteed</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 pt-8 border-t border-gray-200">
                <p>
                    © {new Date().getFullYear()} {store?.title || 'MegaDeals'} Inc. All rights reserved.
                </p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <span className="hover:text-black hover:underline cursor-pointer">Terms of use</span>
                    <span className="hover:text-black hover:underline cursor-pointer">Privacy policy</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}