import React from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';

export default function ModernStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16 mt-4">
       <div className="flex flex-col md:flex-row h-[400px] rounded-3xl overflow-hidden shadow-xl">
          <div className="w-full md:w-1/3 p-10 flex flex-col justify-center text-white" style={bgThemeStyle}>
             <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Future<br/>Ready.</h2>
             <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="bg-white text-black px-6 py-3 rounded-full font-bold self-start mt-4 hover:scale-105 transition">Shop Now</button>
          </div>
          <div className="w-full md:w-2/3 h-full"><img src={store?.banner || '/placeholder-banner.jpg'} className="w-full h-full object-cover" alt="Banner"/></div>
       </div>
       
       <div className="mt-12 flex gap-4 overflow-x-auto hide-scrollbar pb-4 px-4 md:px-0">
          {store?.categories?.map((cat, i) => (
             <div key={i} className="min-w-[140px] bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100 flex-1 hover:-translate-y-1 transition cursor-pointer">
               <LayoutGrid size={24} style={themeStyle} className="mx-auto mb-2"/>
               <span className="text-[12px] font-bold">{cat}</span>
             </div>
          ))}
       </div>
       
       <div ref={productsRef} className="mt-12 px-4 md:px-0 scroll-mt-24">
          <h3 className="text-[20px] font-black text-gray-900 mb-6 uppercase tracking-wider">Trending Tech</h3>
          
          {isLoadingProducts ? (
             <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={24}/> Fetching catalog...
             </div>
          ) : store?.products?.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
                No items available at the moment.
             </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {store?.products?.map((prod, i) => (
                  <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-transparent hover:shadow-lg transition-all cursor-pointer group flex flex-col">
                     <div className="bg-gray-50 rounded-2xl aspect-square mb-4 p-4 relative overflow-hidden">
                       <img src={prod.image || '/placeholder.png'} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition duration-700" alt={prod.title}/>
                     </div>
                     <h4 className="text-[14px] font-bold text-gray-800 line-clamp-1 mb-2">{prod.title}</h4>
                     <div className="flex items-center justify-between mt-auto">
                        <div className="font-extrabold text-[15px]" style={themeStyle}>{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                     </div>
                  </div>
                ))}
             </div>
          )}
       </div>
       
       <div ref={contactRef} className="mt-16 bg-gray-900 text-white rounded-3xl p-10 flex flex-col md:flex-row gap-10 items-center scroll-mt-24 mx-4 md:mx-0">
          <div className="flex-1">
             <h3 className="text-3xl font-black mb-4">Let's Connect</h3>
             <p className="text-gray-400 mb-6">Partner with us for next-gen solutions.</p>
             <div className="space-y-3 text-sm">
               <div><span className="text-gray-500">Email:</span> {store?.contact?.email || 'N/A'}</div>
               <div><span className="text-gray-500">Phone:</span> {store?.contact?.phone || 'N/A'}</div>
             </div>
          </div>
          <div className="flex-1 w-full space-y-4">
             <input type="text" placeholder="Your Name" className="w-full bg-gray-800 border-none rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500" />
             <input type="email" placeholder="Your Email" className="w-full bg-gray-800 border-none rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500" />
             <button className="w-full py-3 rounded-xl font-bold" style={bgThemeStyle}>Send Inquiry</button>
          </div>
       </div>
    </div>
  );
}