import React from 'react';
import { Search, User, ShoppingCart, Heart, LogIn, CheckCircle, MapPin, Phone, ChevronRight, Mail, Loader2 } from 'lucide-react';

export default function BoldStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  // Fallback to the bright lime green from the design if no theme color is provided
  const primaryColor = store?.themeColor || "#6cb415";

  return (
    <div className="bg-[#f2f2f2] min-h-screen font-sans pb-0">
      
      {/* Top Utility Bar */}
      <div className="w-full bg-[#1a1a1a] text-[#888] text-[10px] py-1 px-6 flex justify-end uppercase tracking-wider">
        <span className="cursor-pointer hover:text-white">EN / $</span>
      </div>

      {/* Header Area */}
      <div className="w-full bg-white relative">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 mb-4 md:mb-0 cursor-pointer">
            {store?.logo ? (
                <div className="h-12 flex items-center justify-start">
                    <img src={store.logo} alt={store?.title || "Store Logo"} className="h-full object-contain" />
                </div>
            ) : (
                <div className="flex flex-col leading-none uppercase tracking-tighter">
                   <span className="text-[32px] font-black text-[#222]">
                      {store?.title ? store.title.split(' ')[0] : 'MOTOR'}
                   </span>
                   <span className="text-[20px] font-black mt-[-4px]" style={{ color: primaryColor }}>
                      {store?.title?.split(' ').slice(1).join(' ') || 'CYCLE'} <span className="text-[10px] text-gray-400 font-normal tracking-normal uppercase">Online Store</span>
                   </span>
                </div>
            )}
          </div>
          
          {/* Right Controls */}
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
             {/* Top Links */}
             <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold" style={{ color: primaryColor }}>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><User size={12}/> My Account</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><Heart size={12}/> My Wishlist</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><ShoppingCart size={12}/> My Cart</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><CheckCircle size={12}/> Checkout</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><LogIn size={12}/> Log In</span>
             </div>

             {/* Cart & Search Bars */}
             <div className="flex items-stretch h-8 overflow-hidden rounded-sm w-full md:w-auto">
                <div className="bg-[#2a2a2a] text-white text-[11px] font-bold px-4 flex items-center whitespace-nowrap">
                   MY CART: <span className="text-gray-400 font-normal ml-1">0 item(s) - $0.00</span>
                </div>
                <div className="flex items-center px-3" style={{ backgroundColor: primaryColor }}>
                   <span className="text-white text-[10px] font-bold uppercase mr-2">Search:</span>
                   <input type="text" className="h-5 w-32 bg-[#1a1a1a] border-none outline-none text-white text-[10px] px-2" />
                   <Search size={12} className="text-white ml-2 cursor-pointer" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="w-full bg-[#2a2a2a] border-b-4 border-[#1a1a1a]">
         <div className="max-w-[1200px] mx-auto flex overflow-x-auto scrollbar-hide text-[11px] font-bold text-white uppercase tracking-wider">
            {store?.categories && store.categories.length > 0 ? (
               store.categories.map((cat, i) => (
                 <div key={i} className={`px-6 py-3 cursor-pointer transition-colors ${i === 0 ? '' : 'hover:bg-[#1a1a1a]'}`} style={i === 0 ? { backgroundColor: primaryColor } : {}}>
                    {cat}
                 </div>
               ))
            ) : (
               <>
                 <div className="px-6 py-3 cursor-pointer" style={{ backgroundColor: primaryColor }}>Cruiser</div>
                 <div className="px-6 py-3 cursor-pointer hover:bg-[#1a1a1a] border-l border-[#333]">Dirt Bike</div>
                 <div className="px-6 py-3 cursor-pointer hover:bg-[#1a1a1a] border-l border-[#333]">Scooter</div>
                 <div className="px-6 py-3 cursor-pointer hover:bg-[#1a1a1a] border-l border-[#333]">Snow</div>
                 <div className="px-6 py-3 cursor-pointer hover:bg-[#1a1a1a] border-l border-[#333]">Street</div>
                 <div className="px-6 py-3 cursor-pointer hover:bg-[#1a1a1a] border-l border-[#333]">Watercraft</div>
               </>
            )}
         </div>
      </div>

      {/* Hero Section */}
      <div className="w-full bg-[#1a1a1a] p-4">
         <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-2 h-auto md:h-[350px]">
            {/* Main Large Banner */}
            <div className="col-span-1 md:col-span-2 relative bg-[#2a2a2a] overflow-hidden group cursor-pointer">
               <div className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop'})` }}></div>
               <div className="absolute bottom-8 left-8">
                  <h2 className="text-white text-[32px] md:text-[42px] font-light uppercase leading-none mb-1">
                     Each Our Customer
                  </h2>
                  <h3 className="text-[20px] md:text-[24px] font-bold uppercase" style={{ color: primaryColor }}>
                     Can Get A Quality Product
                  </h3>
               </div>
            </div>
            {/* Side Small Banners */}
            <div className="col-span-1 flex flex-col gap-2">
               <div className="flex-1 bg-[#111] relative overflow-hidden group cursor-pointer border-l-4" style={{ borderLeftColor: primaryColor }}>
                  <img src={store?.products?.[0]?.image || '/placeholder.png'} className="absolute right-0 top-0 h-full w-2/3 object-contain opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Promo 1"/>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                  <div className="relative z-10 p-6 flex flex-col justify-center h-full">
                     <span className="text-white text-[12px] font-bold uppercase mb-1">New Arrival</span>
                     <span className="text-white text-[22px] font-light uppercase leading-tight mb-2">Featured<br/>Gear</span>
                     <span className="text-gray-400 text-[10px]">Lorem ipsum dolor sit amet.</span>
                  </div>
               </div>
               <div className="flex-1 bg-[#222] relative overflow-hidden group cursor-pointer">
                  <img src={store?.products?.[1]?.image || '/placeholder.png'} className="absolute right-0 top-0 h-full w-2/3 object-contain opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Promo 2"/>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                  <div className="relative z-10 p-6 flex flex-col justify-center h-full">
                     <span className="text-[12px] font-bold uppercase mb-1" style={{ color: primaryColor }}>Top Rated</span>
                     <span className="text-white text-[22px] font-light uppercase leading-tight mb-2">Essential<br/>Accessories</span>
                     <span className="text-gray-400 text-[10px]">Consectetur adipiscing elit.</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Products Section */}
      <div ref={productsRef} className="max-w-[1200px] mx-auto mt-10 px-4 md:px-0 scroll-mt-24 mb-10">
         <h3 className="text-[14px] font-bold text-[#333] uppercase tracking-wider mb-6 pb-2 border-b border-gray-300">
            Products List
         </h3>
         
         {isLoadingProducts ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
               <Loader2 className="animate-spin mr-2" size={24}/> Loading inventory...
            </div>
         ) : store?.products?.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white border">
               No products available at the moment.
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              {store?.products?.map((prod, i) => (
                <div key={i} className="flex flex-col items-center group cursor-pointer">
                  
                  {/* Image Container with Thick Bottom Border */}
                  <div className="w-full aspect-square bg-white flex items-center justify-center p-4 border-b-[3px] border-[#1a1a1a] transition-colors duration-300 mb-4 shadow-sm" 
                       style={{ '--hover-color': primaryColor }}
                       onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                       onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                  >
                    <img 
                      src={prod.image || '/placeholder.png'} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" 
                      alt={prod.title}
                    />
                  </div>
                  
                  {/* Product Details */}
                  <h4 className="text-[11px] text-gray-600 text-center leading-tight mb-2 px-2 line-clamp-2 min-h-[28px]">
                     {prod.title}
                  </h4>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                     <span className="text-[15px] font-bold" style={{ color: primaryColor }}>
                         {prod.price ? `$${Number(prod.price).toLocaleString()}` : '-'}
                     </span>
                     {/* Mock old price for visual variation on some items like the design */}
                     {i % 2 !== 0 && prod.price && (
                         <span className="text-[11px] text-gray-400 line-through">
                             ${(Number(prod.price) * 1.2).toLocaleString()}
                         </span>
                     )}
                  </div>
                  
                  <button className="text-[10px] uppercase font-bold text-white px-4 py-1.5 flex items-center gap-1 hover:bg-[#1a1a1a] transition-colors" style={{ backgroundColor: primaryColor }}>
                     <span>+</span> Add to cart
                  </button>
                </div>
              ))}
            </div>
         )}
      </div>

      {/* Lower Promo Banners */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-0 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
           <div className="bg-[#2a2a2a] p-6 flex items-center justify-between group cursor-pointer overflow-hidden relative">
              <div className="relative z-10">
                 <h4 className="text-[#888] text-[12px] font-bold uppercase mb-1">Premium</h4>
                 <h3 className="text-white text-[20px] font-light uppercase leading-none mb-1" style={{ color: primaryColor }}>Quality</h3>
                 <p className="text-white text-[10px] uppercase mt-2">Get up to off</p>
                 <p className="text-white text-[42px] font-black leading-none">50%</p>
              </div>
              <img src="/placeholder.png" className="absolute right-[-20%] bottom-0 h-[120%] object-cover opacity-30 group-hover:opacity-50 transition-opacity mix-blend-screen" alt="Promo" />
           </div>
           
           <div className="bg-[#222] p-6 flex items-center justify-between group cursor-pointer overflow-hidden relative">
              <div className="relative z-10">
                 <h4 className="text-[#888] text-[12px] font-bold uppercase mb-1">New</h4>
                 <h3 className="text-white text-[20px] font-light uppercase leading-none mb-1">Collection</h3>
                 <p className="text-white text-[10px] uppercase mt-2">Get up to off</p>
                 <p className="text-white text-[42px] font-black leading-none">50%</p>
              </div>
              <img src="/placeholder.png" className="absolute right-[-20%] bottom-0 h-[120%] object-cover opacity-30 group-hover:opacity-50 transition-opacity mix-blend-screen" alt="Promo" />
           </div>

           <div className="p-6 flex items-center justify-between group cursor-pointer overflow-hidden relative" style={{ backgroundColor: primaryColor }}>
              <div className="relative z-10">
                 <h4 className="text-[#1a1a1a] text-[12px] font-bold uppercase mb-1">Best</h4>
                 <h3 className="text-white text-[20px] font-light uppercase leading-none mb-1">Accessories</h3>
                 <p className="text-white text-[10px] uppercase mt-2">Get up to off</p>
                 <p className="text-white text-[42px] font-black leading-none">20%</p>
              </div>
              <img src="/placeholder.png" className="absolute right-[-20%] bottom-0 h-[120%] object-cover opacity-30 group-hover:opacity-50 transition-opacity mix-blend-screen" alt="Promo" />
           </div>
        </div>
      </div>

      {/* Footer Area */}
      <div ref={contactRef} className="bg-[#262626] text-[#888] pt-12 pb-6 border-t-4 border-[#1a1a1a]">
         <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
                
                {/* Col 1 */}
                <div>
                    <h4 className="text-white text-[12px] font-bold uppercase mb-4">Information</h4>
                    <ul className="space-y-2 text-[11px]">
                        <li className="hover:text-white cursor-pointer transition-colors" style={{ color: primaryColor }}>About Us</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Customer Service</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Site Map</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Search Terms</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Advanced Search</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Orders and Returns</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
                    </ul>
                </div>

                {/* Col 2 */}
                <div>
                    <h4 className="text-white text-[12px] font-bold uppercase mb-4">Why Buy From Us</h4>
                    <ul className="space-y-2 text-[11px]">
                        <li className="hover:text-white cursor-pointer transition-colors">Shipping & Returns</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Secure Shopping</li>
                        <li className="hover:text-white cursor-pointer transition-colors">International Shipping</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Affiliates</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Group Sales</li>
                    </ul>
                </div>

                {/* Col 3 */}
                <div>
                    <h4 className="text-white text-[12px] font-bold uppercase mb-4">My Account</h4>
                    <ul className="space-y-2 text-[11px]">
                        <li className="hover:text-white cursor-pointer transition-colors">Sign In</li>
                        <li className="hover:text-white cursor-pointer transition-colors">View Cart</li>
                        <li className="hover:text-white cursor-pointer transition-colors">My Wishlist</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Track My Order</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Help</li>
                    </ul>
                </div>

                {/* Col 4 */}
                <div>
                    <h4 className="text-white text-[12px] font-bold uppercase mb-4">Contacts</h4>
                    <ul className="space-y-3 text-[11px]">
                        <li className="flex items-start gap-2">
                           <MapPin size={14} style={{ color: primaryColor, marginTop: '2px' }}/> 
                           <span>{store?.location?.address || 'Company Inc., 8901 Marmora Road, Glasgow, D04 89GR'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                           <Phone size={14} style={{ color: primaryColor }}/> 
                           <span>Call us now toll free: <br/><span className="text-white">{store?.contact?.phone || '(800) 2345-6789'}</span></span>
                        </li>
                        <li className="flex items-center gap-2">
                           <Mail size={14} style={{ color: primaryColor }}/> 
                           <span>Email: <br/><span className="text-white">{store?.contact?.email || 'support@example.com'}</span></span>
                        </li>
                    </ul>
                </div>

                {/* Col 5 */}
                <div>
                    <h4 className="text-white text-[12px] font-bold uppercase mb-4">Newsletter</h4>
                    <div className="flex w-full h-8 mb-6">
                        <input 
                            type="email" 
                            className="flex-1 bg-[#1a1a1a] border-none px-3 text-[11px] text-white outline-none" 
                        />
                        <button className="w-8 flex items-center justify-center hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
                           <ChevronRight size={14} className="text-white" />
                        </button>
                    </div>

                    <h4 className="text-white text-[12px] font-bold uppercase mb-4">Follow Us</h4>
                    <div className="flex gap-3 text-[#555]">
                        <div className="cursor-pointer hover:text-white transition-colors"><span className="font-bold">f</span></div>
                        <div className="cursor-pointer hover:text-white transition-colors"><span className="font-bold">t</span></div>
                        <div className="cursor-pointer hover:text-white transition-colors"><span className="font-bold">rss</span></div>
                    </div>
                </div>

            </div>
            
            <div className="text-center text-[10px] text-[#555] pt-6 border-t border-[#333]">
                © {new Date().getFullYear()} {store?.title || 'Motorcycle Online Store'}. All Rights Reserved.
            </div>
         </div>
      </div>
    </div>
  );
}