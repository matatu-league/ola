import React from 'react';
import { ChevronRight, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

export default function ClassicStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16">
      <div className="w-full h-[300px] md:h-[400px] md:mt-4 md:rounded-2xl relative overflow-hidden flex items-center justify-center shadow-md">
        <img src={store?.banner || '/placeholder-banner.jpg'} className="absolute inset-0 w-full h-full object-cover" alt="Banner"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div className="relative z-10 w-full max-w-4xl px-6 text-white">
           <h2 className="text-[32px] md:text-[52px] font-extrabold leading-tight mb-4 drop-shadow-lg">Precision & Quality</h2>
           <p className="text-[14px] md:text-[18px] text-gray-200 mb-6 max-w-lg font-medium">Explore our wide range of industry-leading products.</p>
           <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="px-8 py-3 rounded-full text-white font-extrabold shadow-lg hover:scale-105 transition-transform" style={bgThemeStyle}>Explore Products</button>
        </div>
      </div>
      
      <div className="mt-12 px-4 md:px-0">
         <h3 className="text-2xl font-extrabold mb-8 text-[#111]">Shop by Category</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {store?.categories?.map((cat, i) => (
             <div key={i} className="bg-white rounded-xl p-4 shadow-sm border hover:border-gray-300 cursor-pointer flex items-center justify-between transition-all">
               <span className="font-bold text-[14px]">{cat}</span><ChevronRight size={16} className="text-gray-400" />
             </div>
           ))}
         </div>
      </div>
      
      <div ref={productsRef} className="mt-16 px-4 md:px-0 scroll-mt-24">
         <h3 className="text-2xl font-extrabold mb-8 text-[#111]">Featured Products</h3>
         
         {isLoadingProducts ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
               <Loader2 className="animate-spin mr-2" size={24}/> Loading inventory...
            </div>
         ) : store?.products?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
               No products available at the moment.
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {store?.products?.map((prod, i) => (
                <div key={i} className="bg-white rounded-xl p-3 shadow-sm border hover:border-gray-300 cursor-pointer group flex flex-col">
                  <div className="bg-[#f7f8fa] rounded-lg aspect-square mb-3 p-4 flex items-center justify-center">
                    <img src={prod.image || '/placeholder.png'} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500" alt={prod.title}/>
                  </div>
                  <h4 className="text-[13px] font-medium text-gray-800 line-clamp-2 mb-2">{prod.title}</h4>
                  <div className="mt-auto">
                    <div className="font-extrabold text-[16px] text-gray-900">{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                    {prod.moq && <div className="text-[11px] text-gray-500">MOQ: {prod.moq}</div>}
                  </div>
                </div>
              ))}
            </div>
         )}
      </div>
      
      <div ref={contactRef} className="mt-16 px-4 md:px-0 scroll-mt-24">
         <h3 className="text-2xl font-extrabold mb-8 text-[#111]">Contact Us</h3>
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <input type="text" placeholder="Name" className="w-full border rounded-lg py-2 px-3 text-sm outline-none" />
              <input type="email" placeholder="Email" className="w-full border rounded-lg py-2 px-3 text-sm outline-none" />
              <textarea placeholder="Message" rows="4" className="w-full border rounded-lg py-2 px-3 text-sm outline-none"></textarea>
              <button className="w-full py-3 rounded-lg text-white font-bold" style={bgThemeStyle}>Send Message</button>
            </div>
            <div className="flex-1 bg-gray-50 p-6 rounded-xl space-y-4 text-sm font-medium text-gray-700">
               <div className="flex items-center gap-3"><Mail style={themeStyle}/> {store?.contact?.email || 'Not provided'}</div>
               <div className="flex items-center gap-3"><Phone style={themeStyle}/> {store?.contact?.phone || 'Not provided'}</div>
               <div className="flex items-center gap-3"><MapPin style={themeStyle}/> {store?.location?.address || 'Not provided'}</div>
            </div>
         </div>
      </div>
    </div>
  );
}