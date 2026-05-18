import React from 'react';
import { Search, User, ShoppingCart, Heart, LogIn, CheckCircle, MapPin, Phone, ChevronRight, ChevronDown } from 'lucide-react';

export default function BoldStore({ store, productsRef, contactRef, isLoadingProducts, bgThemeStyle, themeStyle }) {
  const primaryColor = store?.themeColor || "#6cb415";
  const darkGreen = "#5a9611";

  const newProducts = store?.products?.slice(0, 4) || [];
  const specialProducts = store?.products?.slice(4, 8) || store?.products?.slice(0, 4) || [];

  return (
    <div className="font-sans pb-0 bg-white">
      
      {/* Top Utility Bar */}
      <div className="w-full bg-[#1a1a1a] text-[#888] text-xs py-2 px-6 flex justify-end uppercase tracking-wider">
        <span className="cursor-pointer hover:text-white transition-colors">EN / $</span>
      </div>

      {/* Header Area */}
      <div className="w-full bg-white relative pt-10 pb-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-end justify-between">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 mb-6 md:mb-0 cursor-pointer self-start md:self-auto">
            {store?.logo ? (
                <div className="h-16 flex items-center justify-start">
                    <img src={store.logo} alt={store?.title || "Store Logo"} className="h-full object-contain" />
                </div>
            ) : (
                <div className="flex flex-col leading-none uppercase tracking-tighter">
                   <span className="text-5xl font-black text-[#222]">
                      {store?.title ? store.title.split(' ')[0] : 'MOTOR'}
                   </span>
                   <span className="text-3xl font-black mt-[-4px]" style={{ color: primaryColor }}>
                      {store?.title?.split(' ').slice(1).join(' ') || 'CYCLE'} <span className="text-sm text-gray-400 font-normal tracking-normal uppercase ml-1">Online Store</span>
                   </span>
                </div>
            )}
          </div>
          
          {/* Right Controls */}
          <div className="flex flex-col items-end w-full md:w-auto">
             {/* Top Links */}
             <div className="flex flex-wrap items-center gap-6 text-sm font-bold mb-5" style={{ color: primaryColor }}>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><ChevronRight size={14}/> My Account</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><ChevronRight size={14}/> My Wishlist</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><ChevronRight size={14}/> My Cart</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><ChevronRight size={14}/> Checkout</span>
               <span className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors"><ChevronRight size={14}/> Log In</span>
             </div>

             {/* Conjoined Cart & Search Bars */}
             <div className="flex items-stretch h-12 rounded-t-sm overflow-hidden w-full md:w-auto">
                <div className="bg-[#222] text-white text-sm font-bold px-5 flex items-center justify-between whitespace-nowrap min-w-[220px] cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                   <div>MY CART: <span className="text-gray-400 font-normal ml-1">0 item(s) - $0.00</span></div>
                   <ChevronDown size={16} className="text-gray-400 ml-3"/>
                </div>
                <div className="flex items-center px-4" style={{ backgroundColor: primaryColor }}>
                   <span className="text-white text-sm font-bold uppercase mr-3">Search:</span>
                   <input type="text" className="h-8 w-48 bg-[#1a1a1a] border-none outline-none text-white text-sm px-3 shadow-inner" />
                   <div className="bg-[#1a1a1a] h-8 w-8 ml-1 flex items-center justify-center cursor-pointer hover:bg-black transition-colors">
                      <Search size={14} className="text-white" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="w-full bg-[#333] border-b-[6px] border-[#222]">
         <div className="max-w-7xl mx-auto flex overflow-x-auto scrollbar-hide text-sm font-bold text-white uppercase tracking-wider">
            {store?.categories && store.categories.length > 0 ? (
               store.categories.map((cat, i) => (
                 <div key={i} className={`px-8 py-4 cursor-pointer transition-colors ${i === 0 ? '' : 'hover:bg-[#222]'}`} style={i === 0 ? { backgroundColor: primaryColor } : {}}>
                    {cat}
                 </div>
               ))
            ) : (
               <>
                 <div className="px-8 py-4 cursor-pointer" style={{ backgroundColor: primaryColor }}>Cruiser</div>
                 <div className="px-8 py-4 cursor-pointer hover:bg-[#222] border-l border-[#444]">Dirt Bike</div>
                 <div className="px-8 py-4 cursor-pointer hover:bg-[#222] border-l border-[#444]">Scooter</div>
                 <div className="px-8 py-4 cursor-pointer hover:bg-[#222] border-l border-[#444]">Snow</div>
                 <div className="px-8 py-4 cursor-pointer hover:bg-[#222] border-l border-[#444]">Street</div>
                 <div className="px-8 py-4 cursor-pointer hover:bg-[#222] border-l border-[#444]">Watercraft</div>
               </>
            )}
         </div>
      </div>

      {/* Hero Section - FULL WIDTH */}
      <div className="w-full bg-[#e5e5e5]">
         <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-0">
            
            {/* Main Large Banner with Duplicate Mounted Layer Effect */}
            <div className="col-span-1 lg:col-span-2 relative overflow-hidden group cursor-pointer aspect-[16/9] lg:aspect-auto min-h-[400px] lg:min-h-[550px] bg-[#1a1a1a]">
               {/* Background layer (duplicate impression) */}
               <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-[8px] scale-110" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop'})` }}></div>
               
               {/* Foreground mounted layer */}
               <div className="absolute inset-4 md:inset-8 lg:inset-10 bg-[#111] overflow-hidden shadow-2xl border border-white/10">
                   <div className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url(${store?.banner || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop'})` }}></div>
                   
                   {/* Dot pattern overlay from design */}
                   <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4yKSIvPjwvc3ZnPg==')] opacity-40 mix-blend-overlay"></div>
                   
                   <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
                      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-light uppercase leading-none mb-2 drop-shadow-xl">
                         Each Our Customer
                      </h2>
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase drop-shadow-lg" style={{ color: primaryColor }}>
                         Can Get A Quality Bike
                      </h3>
                   </div>
               </div>
            </div>
            
            {/* Side Small Banners */}
            <div className="col-span-1 flex flex-col gap-0 h-auto lg:h-[550px]">
               <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden group cursor-pointer min-h-[250px]">
                  <div className="w-1/2 h-full absolute left-0 p-6 flex items-center justify-center">
                      <img src={store?.products?.[0]?.image || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-screen group-hover:scale-110 transition-transform duration-500" alt="Promo 1"/>
                  </div>
                  <div className="w-[60%] h-full absolute right-0 top-0 flex flex-col justify-center pl-10 pr-6" style={{ backgroundColor: primaryColor, clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                     <span className="text-white text-sm font-bold uppercase mb-1">New 2024</span>
                     <span className="text-white text-3xl font-light uppercase leading-tight mb-2">Cool Pro<br/>Jacket</span>
                     <span className="text-white/90 text-sm leading-snug">Lorem ipsum dolor sit amet conse ctetur adipisicing.</span>
                  </div>
               </div>
               
               <div className="flex-1 bg-[#222] relative overflow-hidden group cursor-pointer min-h-[250px]">
                  <div className="w-1/2 h-full absolute left-0 p-6 flex items-center justify-center">
                      <img src={store?.products?.[1]?.image || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-screen group-hover:scale-110 transition-transform duration-500" alt="Promo 2"/>
                  </div>
                  <div className="w-[60%] h-full absolute right-0 top-0 flex flex-col justify-center pl-10 pr-6 bg-[#111]" style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                     <span className="text-sm font-bold uppercase mb-1" style={{ color: primaryColor }}>New 2024</span>
                     <span className="text-white text-3xl font-light uppercase leading-tight mb-2">Helmet</span>
                     <span className="text-gray-400 text-sm leading-snug">Lorem ipsum dolor sit amet conse ctetur adipisicing.</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* SECTION 1: NEW PRODUCTS */}
      <div ref={productsRef} className="w-full bg-white pt-16 pb-20 scroll-mt-24">
         <div className="max-w-7xl mx-auto px-4 md:px-6">
             <h3 className="text-lg font-bold text-[#555] uppercase tracking-wider mb-10 pb-2 border-b-2 border-gray-100">
                New Products
             </h3>
             
             {isLoadingProducts ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                   <Search className="animate-pulse mr-2" size={32}/> Loading...
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
                  {newProducts.map((prod, i) => (
                    <div key={i} className="flex flex-col items-center group cursor-pointer">
                      <div className="w-full aspect-square bg-white flex items-center justify-center p-6 mb-4">
                        <img src={prod.image || '/placeholder.png'} className="max-w-[85%] max-h-[85%] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt={prod.title} />
                      </div>
                      
                      {/* Colored Divider from Design */}
                      <div className="w-full border-t-4 mb-4" style={{ borderColor: i === 0 ? primaryColor : '#333' }}></div>
                      
                      <h4 className="text-base font-medium text-gray-600 text-center leading-snug mb-3 px-2 line-clamp-2 min-h-[44px]">
                         {prod.title}
                      </h4>
                      
                      <div className="text-xl font-black mb-5" style={{ color: primaryColor }}>
                         {prod.price ? `$${Number(prod.price).toLocaleString()}` : '-'}
                      </div>
                      
                      {/* Split Button Design */}
                      <button className="flex items-stretch hover:opacity-90 transition-opacity shadow-sm">
                         <div className="text-white font-bold px-4 py-2 text-lg flex items-center justify-center" style={{ backgroundColor: darkGreen }}>+</div>
                         <div className="text-white font-bold uppercase text-sm px-5 py-2.5 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>Add to cart</div>
                      </button>
                    </div>
                  ))}
                </div>
             )}
         </div>
      </div>

      {/* SECTION 2: SPECIALS */}
      <div className="w-full bg-[#f2f2f2] pt-16 pb-24">
         <div className="max-w-7xl mx-auto px-4 md:px-6">
             <h3 className="text-lg font-bold text-[#555] uppercase tracking-wider mb-10 pb-2 border-b-2 border-gray-300">
                Specials
             </h3>
             
             {isLoadingProducts ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                   <Search className="animate-pulse mr-2" size={32}/> Loading...
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
                  {specialProducts.map((prod, i) => (
                    <div key={i} className="flex flex-col items-center group cursor-pointer">
                      <div className="w-full aspect-square bg-white flex items-center justify-center p-6 mb-4 shadow-sm border border-gray-200">
                        <img src={prod.image || '/placeholder.png'} className="max-w-[85%] max-h-[85%] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt={prod.title} />
                      </div>
                      
                      <div className="w-full border-t-4 mb-4 border-[#ccc] group-hover:border-[#6cb415] transition-colors" style={{ '--tw-hover-border-opacity': '1', ':hover': { borderColor: primaryColor } }}></div>
                      
                      <h4 className="text-base font-medium text-gray-600 text-center leading-snug mb-3 px-2 line-clamp-2 min-h-[44px]">
                         {prod.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 mb-5">
                         <span className="text-xl font-black" style={{ color: primaryColor }}>
                             {prod.price ? `$${Number(prod.price).toLocaleString()}` : '-'}
                         </span>
                         {prod.price && (
                             <span className="text-sm font-medium text-[#aaa] line-through">
                                 ${(Number(prod.price) * 1.2).toLocaleString()}
                             </span>
                         )}
                      </div>
                      
                      <button className="flex items-stretch hover:opacity-90 transition-opacity shadow-sm">
                         <div className="text-white font-bold px-4 py-2 text-lg flex items-center justify-center" style={{ backgroundColor: darkGreen }}>+</div>
                         <div className="text-white font-bold uppercase text-sm px-5 py-2.5 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>Add to cart</div>
                      </button>
                    </div>
                  ))}
                </div>
             )}
         </div>
      </div>

      {/* LOWER PROMO BANNERS */}
      <div className="w-full bg-[#f2f2f2] pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-[6px] border-[#333]">
               
               <div className="bg-[#333] p-8 flex flex-col justify-center relative overflow-hidden group cursor-pointer min-h-[200px] border-r-2 border-[#444]">
                  <div className="relative z-10">
                     <h4 className="text-[#aaa] text-base font-bold uppercase mb-1" style={{ color: primaryColor }}>Men's</h4>
                     <h3 className="text-white text-3xl font-light uppercase leading-none mb-2">Jacket</h3>
                     <p className="text-gray-400 text-sm uppercase mt-4 font-semibold tracking-wide">Get up to off</p>
                     <p className="text-white text-7xl font-black leading-none -mt-2 drop-shadow-md">50<span className="text-4xl">%</span></p>
                  </div>
                  <img src="/placeholder.png" className="absolute right-[-10%] bottom-0 h-[120%] w-[60%] object-cover opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity" alt="Promo" />
               </div>
               
               <div className="bg-[#222] p-8 flex flex-col justify-center relative overflow-hidden group cursor-pointer min-h-[200px]">
                  <div className="relative z-10">
                     <h4 className="text-[#aaa] text-base font-bold uppercase mb-1" style={{ color: primaryColor }}>Women's</h4>
                     <h3 className="text-white text-3xl font-light uppercase leading-none mb-2">Jacket</h3>
                     <p className="text-gray-400 text-sm uppercase mt-4 font-semibold tracking-wide">Get up to off</p>
                     <p className="text-white text-7xl font-black leading-none -mt-2 drop-shadow-md">50<span className="text-4xl">%</span></p>
                  </div>
                  <img src="/placeholder.png" className="absolute right-[-10%] bottom-0 h-[120%] w-[60%] object-cover opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity" alt="Promo" />
               </div>

               <div className="p-8 flex flex-col justify-center relative overflow-hidden group cursor-pointer min-h-[200px]" style={{ backgroundColor: primaryColor }}>
                  <div className="relative z-10">
                     <h4 className="text-[#222] text-base font-bold uppercase mb-1">Sportbike</h4>
                     <h3 className="text-white text-3xl font-light uppercase leading-none mb-2 drop-shadow-sm">Tires</h3>
                     <p className="text-[#222] text-sm uppercase mt-4 font-bold tracking-wide">Get up to off</p>
                     <p className="text-white text-7xl font-black leading-none -mt-2 drop-shadow-md">20<span className="text-4xl">%</span></p>
                  </div>
                  <img src="/placeholder.png" className="absolute right-[-10%] bottom-0 h-[120%] w-[60%] object-cover opacity-50 mix-blend-multiply group-hover:scale-105 transition-transform" alt="Promo" />
               </div>

            </div>
        </div>
      </div>

      {/* Footer Area */}
      <div ref={contactRef} className="bg-[#2a2a2a] text-[#aaa] pt-16 pb-10 border-t-8 border-[#1a1a1a]">
         <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
                
                {/* Col 1 */}
                <div>
                    <h4 className="text-white text-base font-bold uppercase mb-6 tracking-wide">Information</h4>
                    <ul className="space-y-3 text-sm font-medium">
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
                    <h4 className="text-white text-base font-bold uppercase mb-6 tracking-wide">Why Buy From Us</h4>
                    <ul className="space-y-3 text-sm font-medium">
                        <li className="hover:text-white cursor-pointer transition-colors">Shipping & Returns</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Secure Shopping</li>
                        <li className="hover:text-white cursor-pointer transition-colors">International Shipping</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Affiliates</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Group Sales</li>
                    </ul>
                </div>

                {/* Col 3 */}
                <div>
                    <h4 className="text-white text-base font-bold uppercase mb-6 tracking-wide">My Account</h4>
                    <ul className="space-y-3 text-sm font-medium">
                        <li className="hover:text-white cursor-pointer transition-colors">Sign In</li>
                        <li className="hover:text-white cursor-pointer transition-colors">View Cart</li>
                        <li className="hover:text-white cursor-pointer transition-colors">My Wishlist</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Track My Order</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Help</li>
                    </ul>
                </div>

                {/* Col 4 */}
                <div>
                    <h4 className="text-white text-base font-bold uppercase mb-6 tracking-wide">Contacts</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li className="flex items-start gap-3">
                           <MapPin size={18} style={{ color: primaryColor, marginTop: '2px', flexShrink: 0 }}/> 
                           <span className="leading-relaxed">{store?.location?.address || 'Company Inc., 8901 Marmora Road, Glasgow, D04 89GR'}</span>
                        </li>
                        <li className="flex items-start gap-3">
                           <Phone size={18} style={{ color: primaryColor, marginTop: '2px', flexShrink: 0 }}/> 
                           <span className="leading-relaxed">Call us now toll free: <br/><span className="text-white font-bold mt-1 inline-block">{store?.contact?.phone || '(800) 2345-6789'}</span></span>
                        </li>
                    </ul>
                </div>

                {/* Col 5 */}
                <div>
                    <h4 className="text-white text-base font-bold uppercase mb-6 tracking-wide">Newsletter</h4>
                    <div className="flex w-full h-10 mb-8 shadow-inner">
                        <input 
                            type="email" 
                            className="flex-1 bg-[#1a1a1a] border border-[#1a1a1a] px-3 text-sm text-white outline-none focus:border-[#555] transition-colors" 
                            placeholder="Email Address"
                        />
                        <button className="w-10 flex items-center justify-center hover:bg-[#555] transition-colors ml-1 bg-[#444]">
                           <ChevronRight size={16} className="text-white" />
                        </button>
                    </div>

                    <h4 className="text-white text-base font-bold uppercase mb-6 tracking-wide">Follow Us</h4>
                    <div className="flex gap-5 text-[#777]">
                        <div className="cursor-pointer hover:text-white transition-colors"><span className="font-bold text-lg">f</span></div>
                        <div className="cursor-pointer hover:text-white transition-colors"><span className="font-bold text-lg">t</span></div>
                        <div className="cursor-pointer hover:text-white transition-colors"><span className="font-bold text-lg">rss</span></div>
                    </div>
                </div>

            </div>
            
            <div className="text-left text-sm font-medium text-[#666] pt-8 border-t border-[#333]">
                © {new Date().getFullYear()} {store?.title || 'Motorcycle Online Store'}. All Rights Reserved.
            </div>
         </div>
      </div>
    </div>
  );
}