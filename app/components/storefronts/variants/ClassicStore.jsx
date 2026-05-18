import React from 'react';
import { Search, User, ShoppingCart, Truck, RotateCcw, Headset, Loader2, Mail, Phone, MapPin } from 'lucide-react';

export default function ClassicStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  // Fallback to the signature green if no theme color is provided
  const primaryColor = store?.themeColor || "#3b9c34";

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans pb-0">
      
      {/* Header and Hero Unified Dark Section */}
      <div className="w-full bg-[#111111] relative overflow-hidden flex flex-col">
        
        {/* Top Navigation */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3 cursor-pointer">
            {store?.logo ? (
                <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center bg-white">
                    <img src={store.logo} alt={store?.title || "Store Logo"} className="w-full h-full object-contain" />
                </div>
            ) : (
                <div className="w-8 h-8 flex items-center justify-center rounded font-bold" style={bgThemeStyle}>
                   {store?.title?.charAt(0)?.toUpperCase() || 'S'}
                </div>
            )}
            <span className="text-[22px] font-bold tracking-wide">{store?.title || 'TechNest'}</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium">
            <span className="cursor-pointer hover:text-gray-300">Shop</span>
            <span className="cursor-pointer hover:text-gray-300">About</span>
            <span onClick={() => contactRef.current?.scrollIntoView({behavior:'smooth'})} className="cursor-pointer hover:text-gray-300">Contact</span>
          </nav>
          
          <div className="flex items-center gap-6">
            <Search size={20} className="cursor-pointer hover:text-gray-300"/>
            <User size={20} className="cursor-pointer hover:text-gray-300"/>
            <div className="relative cursor-pointer hover:text-gray-300">
              <ShoppingCart size={20} />
              <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full" style={bgThemeStyle}></span>
            </div>
          </div>
        </header>

        {/* Hero Background Overlay */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-cover bg-right md:bg-center opacity-60 mt-[80px]"
          style={{ 
            backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1606220838315-056192d5e927?q=80&w=2000&auto=format&fit=crop'})` 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/80 to-transparent mt-[80px]"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 md:py-24 text-white">
           <h2 className="text-[36px] md:text-[56px] font-bold leading-[1.1] mb-4 max-w-xl">
             Top Tech Gear<br/>for Your Lifestyle
           </h2>
           <p className="text-[16px] md:text-[18px] text-gray-300 mb-8 max-w-lg">
             Explore the latest gadgets & accessories.
           </p>
           <button 
             onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} 
             className="px-8 py-3 rounded text-white font-bold transition-opacity hover:opacity-90" 
             style={bgThemeStyle}
           >
             Shop Now
           </button>
        </div>
      </div>

      {/* Value Propositions Bar */}
      <div className="w-full bg-[#1a1a1a] border-t border-[#2a2a2a] py-4 hidden md:block">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm text-gray-300 font-medium">
            <div className="flex items-center gap-2">
                <Truck size={20} style={themeStyle} />
                <span>Free Shipping on Orders Over $50</span>
            </div>
            <div className="w-px h-6 bg-[#333]"></div>
            <div className="flex items-center gap-2">
                <RotateCcw size={20} style={themeStyle} />
                <span>30-Day Money Back Guarantee</span>
            </div>
            <div className="w-px h-6 bg-[#333]"></div>
            <div className="flex items-center gap-2">
                <Headset size={20} style={themeStyle} />
                <span>24/7 Customer Support</span>
            </div>
        </div>
      </div>
      
      {/* Products Section */}
      <div ref={productsRef} className="max-w-6xl mx-auto mt-16 px-4 md:px-6 scroll-mt-24 mb-16">
         
         {isLoadingProducts ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
               <Loader2 className="animate-spin mr-2" size={24}/> Loading inventory...
            </div>
         ) : store?.products?.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg border">
               No products available at the moment.
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {store?.products?.map((prod, i) => (
                <div key={i} className="bg-white rounded-md p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col relative group">
                  
                  {/* Mock Badges */}
                  {i === 0 && <span className="absolute top-6 right-6 text-white text-[10px] font-bold px-2 py-1 rounded z-10 uppercase tracking-wider" style={bgThemeStyle}>New</span>}
                  {i === 3 && <span className="absolute top-6 right-6 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded z-10 uppercase tracking-wider">Sale</span>}

                  {/* Image Container */}
                  <div className="bg-[#f4f5f7] rounded mb-4 aspect-square flex items-center justify-center p-2 overflow-hidden">
                    <img 
                      src={prod.image || '/placeholder.png'} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                      alt={prod.title}
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex flex-col flex-grow">
                    <h4 className="text-[15px] font-bold text-gray-900 mb-1 leading-snug">{prod.title}</h4>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="font-extrabold text-[16px] text-gray-900">
                            {prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}
                        </span>
                        {i === 3 && prod.price && (
                            <span className="text-[13px] text-gray-400 line-through">
                                USh {(Number(prod.price) * 1.2).toLocaleString()}
                            </span>
                        )}
                    </div>
                    {prod.moq && <div className="text-[12px] text-gray-500 mb-3">MOQ: {prod.moq}</div>}
                    
                    <button 
                        className="w-full mt-auto py-2.5 rounded text-white font-bold text-sm transition-opacity hover:opacity-90"
                        style={bgThemeStyle}
                    >
                        Shop Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
         )}
      </div>

      {/* Mid-page Banner */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-16">
        <div className="w-full bg-[#111] rounded-lg overflow-hidden flex flex-col md:flex-row items-center p-8 md:p-12 relative">
            <div className="relative z-10 md:w-1/2 text-white">
                <h3 className="text-3xl md:text-4xl font-bold mb-2">Boost Your Productivity</h3>
                <p className="text-gray-300 mb-6">Essential Accessories for Work & Play</p>
                <button className="px-6 py-2 rounded text-white font-bold text-sm transition-opacity hover:opacity-90" style={bgThemeStyle}>
                    Browse Now
                </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#222] to-transparent opacity-50 hidden md:block"></div>
        </div>
      </div>

      {/* Contact Section / Newsletter Area & Footer */}
      <div ref={contactRef} className="bg-[#1a1a1a] text-white pt-16 pb-8 w-full scroll-mt-0 border-t-8" style={{ borderTopColor: primaryColor }}>
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center justify-between mb-12 border-b border-[#333] pb-12">
                <div className="md:w-1/2">
                    <h3 className="text-[28px] font-bold mb-2">Join Our Newsletter</h3>
                    <p className="text-gray-400 text-[15px]">Get the latest deals & updates</p>
                </div>
                <div className="flex w-full md:w-1/2 gap-0">
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="flex-1 border-none rounded-l py-3.5 px-4 text-sm text-black outline-none" 
                    />
                    <button className="px-8 py-3.5 rounded-r text-white font-bold text-sm whitespace-nowrap transition-opacity hover:opacity-90" style={bgThemeStyle}>
                        Subscribe
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px] mb-12">
                <div>
                    <h4 className="font-bold mb-6 text-white text-[15px]">Quick Links</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li className="hover:text-white cursor-pointer transition-colors">Shop</li>
                        <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                        <li className="hover:text-white cursor-pointer transition-colors">FAQs</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-6 text-white text-[15px]">Customer Service</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li className="hover:text-white cursor-pointer transition-colors">Shipping Info</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Return Policy</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Support Center</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-6 text-white text-[15px]">Contact Us</h4>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-center gap-3"><Mail size={16}/> {store?.contact?.email || 'support@example.com'}</li>
                        <li className="flex items-center gap-3"><Phone size={16}/> {store?.contact?.phone || '+1 234 567 890'}</li>
                        <li className="flex items-center gap-3"><MapPin size={16}/> {store?.location?.address || 'Global Shipping'}</li>
                    </ul>
                </div>
                <div>
                    <div className="w-full">
                        <h4 className="font-bold mb-6 text-white text-[15px]">Follow Us</h4>
                        <div className="flex gap-4 text-white">
                            <div className="w-8 h-8 rounded-full bg-transparent border border-gray-600 flex items-center justify-center cursor-pointer hover:bg-[#333] hover:border-gray-400 transition-colors">f</div>
                            <div className="w-8 h-8 rounded-full bg-transparent border border-gray-600 flex items-center justify-center cursor-pointer hover:bg-[#333] hover:border-gray-400 transition-colors">t</div>
                            <div className="w-8 h-8 rounded-full bg-transparent border border-gray-600 flex items-center justify-center cursor-pointer hover:bg-[#333] hover:border-gray-400 transition-colors">ig</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-[#333] pt-6 flex flex-col md:flex-row items-center justify-between text-[12px] text-gray-500">
                <p>© {new Date().getFullYear()} {store?.title || 'TechNest'}. All Rights Reserved. Powered by Shopify.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
