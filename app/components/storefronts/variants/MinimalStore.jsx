import React from 'react';
import { Loader2 } from 'lucide-react';

export default function MinimalStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16">
      <div className="py-24 text-center px-4 md:px-0">
         <h2 className="text-4xl md:text-6xl font-light tracking-tight text-gray-900 mb-6">Simplicity & Form</h2>
         <div className="w-16 h-1 mx-auto mb-8" style={bgThemeStyle}></div>
         <div className="w-full max-w-5xl mx-auto h-[400px] rounded-2xl overflow-hidden mb-16">
            <img src={store?.banner || '/placeholder-banner.jpg'} className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700" alt="Banner"/>
         </div>
         <div className="flex justify-center gap-8 overflow-x-auto">
           {store?.categories?.map((cat, i) => (
              <span key={i} className="text-[13px] font-bold uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer border-b border-transparent hover:border-black pb-1">{cat}</span>
           ))}
         </div>
      </div>
      
      <div ref={productsRef} className="max-w-5xl mx-auto px-4 md:px-0 scroll-mt-24">
         {isLoadingProducts ? (
            <div className="flex justify-center items-center py-10 font-light text-gray-500">
               <Loader2 className="animate-spin mr-2" size={20}/> Fetching items...
            </div>
         ) : store?.products?.length === 0 ? (
            <div className="text-center py-10 font-light text-gray-500">
               No products available.
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {store?.products?.map((prod, i) => (
                  <div key={i} className="group cursor-pointer text-center">
                     <div className="aspect-square overflow-hidden bg-gray-50 mb-6 rounded-lg flex items-center justify-center p-8">
                        <img src={prod.image || '/placeholder.png'} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-700" alt={prod.title}/>
                     </div>
                     <h4 className="text-[14px] font-medium text-gray-900 mb-1">{prod.title}</h4>
                     <div className="text-[14px] text-gray-500 mb-2">{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                  </div>
               ))}
            </div>
         )}
      </div>
      
      <div ref={contactRef} className="max-w-2xl mx-auto text-center mt-24 px-4 md:px-0 scroll-mt-24">
         <h3 className="text-2xl font-light mb-8">Inquiries</h3>
         <div className="flex flex-col gap-6 items-center">
            <input type="email" placeholder="Email Address" className="w-full max-w-md border-b-2 border-gray-200 py-2 outline-none text-center focus:border-black transition-colors bg-transparent"/>
            <textarea placeholder="Message" className="w-full max-w-md border-b-2 border-gray-200 py-2 outline-none text-center focus:border-black transition-colors bg-transparent resize-none" rows="2"></textarea>
            <button className="px-10 py-3 uppercase text-xs font-bold tracking-widest text-white bg-black hover:bg-gray-800 transition">Submit</button>
         </div>
      </div>
    </div>
  );
}