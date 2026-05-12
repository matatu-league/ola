import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ApparelStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16">
       <div className="relative h-[600px] w-full flex items-center justify-center text-center mt-4 px-4 md:px-0">
          <img src={store?.banner || '/placeholder-banner.jpg'} className="absolute inset-0 w-full h-full object-cover object-top" alt="Banner" />
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative z-10 text-white flex flex-col items-center">
             <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase mb-4">SS/26 Collection</h2>
             <p className="text-lg md:text-xl font-medium tracking-widest uppercase mb-8">Redefining Everyday Wear</p>
             <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="bg-white text-black px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition duration-300">Shop The Look</button>
          </div>
       </div>
       
       <div className="py-12 border-b border-gray-200">
          <div className="flex justify-center gap-8 md:gap-16 uppercase text-xs font-bold tracking-widest overflow-x-auto px-4">
             {store?.categories?.map((cat, i) => (
                <span key={i} className="cursor-pointer hover:text-gray-500 whitespace-nowrap">{cat}</span>
             ))}
          </div>
       </div>
       
       <div ref={productsRef} className="py-16 max-w-[1400px] mx-auto px-4 scroll-mt-10">
          {isLoadingProducts ? (
             <div className="flex justify-center items-center py-20 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={24}/> Fetching latest styles...
             </div>
          ) : store?.products?.length === 0 ? (
             <div className="text-center py-20 text-gray-500 font-medium tracking-widest uppercase">
                No products available right now.
             </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {store?.products?.map((prod, i) => (
                  <div key={i} className="group cursor-pointer">
                     <div className="w-full aspect-[3/4] bg-gray-100 overflow-hidden relative mb-4">
                        <img src={prod.image || '/placeholder.png'} className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700" alt={prod.title}/>
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                           <div className="bg-white text-black text-[10px] uppercase font-bold tracking-widest py-2 px-6">Quick View</div>
                        </div>
                     </div>
                     <div className="text-center">
                        <h4 className="font-bold text-sm uppercase tracking-wide mb-1">{prod.title}</h4>
                        <div className="text-gray-500 text-sm mb-1">{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                        {prod.moq && <div className="text-[10px] text-gray-400 uppercase tracking-widest">MOQ: {prod.moq}</div>}
                     </div>
                  </div>
                ))}
             </div>
          )}
       </div>
       
       <div ref={contactRef} className="mt-16 bg-black text-white py-20 px-4 text-center scroll-mt-24">
          <h3 className="text-3xl uppercase font-black tracking-widest mb-6">Join The List</h3>
          <p className="text-gray-400 mb-10 max-w-md mx-auto text-sm">Sign up for early access to new collections, exclusive wholesale pricing, and more.</p>
          <div className="flex max-w-md mx-auto border-b border-white pb-2">
             <input type="email" placeholder="ENTER YOUR EMAIL" className="bg-transparent flex-1 outline-none text-sm uppercase tracking-widest placeholder-gray-500" />
             <button className="uppercase text-sm font-bold tracking-widest hover:text-gray-400 transition">Subscribe</button>
          </div>
          <div className="mt-16 flex justify-center gap-8 text-xs uppercase tracking-widest text-gray-500">
             <span>{store?.contact?.email || 'N/A'}</span>
             <span className="hidden md:inline">•</span>
             <span>{store?.contact?.phone || 'N/A'}</span>
          </div>
       </div>
    </div>
  );
}