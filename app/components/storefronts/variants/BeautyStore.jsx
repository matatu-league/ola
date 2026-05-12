import React from 'react';
import { Sparkles, Heart, Loader2 } from 'lucide-react';

export default function BeautyStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16 px-4 md:px-0">
       <div className="mt-4 rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 shadow-sm" style={{backgroundColor: `${store?.themeColor || '#000'}15`}}>
          <div className="flex-1 text-center md:text-left">
             <div className="inline-block px-4 py-1 rounded-full bg-white text-xs font-bold mb-4" style={themeStyle}>New Arrivals</div>
             <h2 className="text-4xl md:text-6xl font-medium text-gray-900 mb-6 leading-tight">Reveal Your <br/>Natural Glow.</h2>
             <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="px-8 py-3 rounded-full text-white font-bold shadow-md hover:-translate-y-1 transition" style={bgThemeStyle}>Shop Collection</button>
          </div>
          <div className="flex-1 h-[300px] md:h-[400px] rounded-[30px] overflow-hidden">
             <img src={store?.banner || '/placeholder-banner.jpg'} className="w-full h-full object-cover" alt="Banner"/>
          </div>
       </div>
       
       <div className="py-12 flex justify-center gap-4 flex-wrap">
          {store?.categories?.map((cat, i) => (
             <div key={i} className="px-6 py-3 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700 cursor-pointer hover:shadow-md transition border border-gray-100 flex items-center gap-2">
                <Sparkles size={16} style={themeStyle}/> {cat}
             </div>
          ))}
       </div>
       
       <div ref={productsRef} className="scroll-mt-24 max-w-5xl mx-auto">
          <h3 className="text-2xl font-medium text-center mb-10">Bestsellers</h3>
          
          {isLoadingProducts ? (
             <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={24}/> Fetching inventory...
             </div>
          ) : store?.products?.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
                No items available at the moment. Check back soon!
             </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {store?.products?.map((prod, i) => (
                  <div key={i} className="bg-white rounded-[30px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow cursor-pointer flex flex-col items-center text-center border border-gray-50">
                     <div className="w-full aspect-square bg-gray-50 rounded-[20px] mb-4 p-4 overflow-hidden">
                        <img src={prod.image || '/placeholder.png'} className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition duration-500" alt={prod.title}/>
                     </div>
                     <h4 className="font-medium text-gray-800 text-sm mb-1">{prod.title}</h4>
                     <div className="font-bold text-lg mb-2" style={themeStyle}>{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                  </div>
                ))}
             </div>
          )}
       </div>
       
       <div ref={contactRef} className="mt-20 scroll-mt-24">
          <div className="max-w-2xl mx-auto bg-white rounded-[40px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 text-center">
             <Heart size={32} style={themeStyle} className="mx-auto mb-4"/>
             <h3 className="text-2xl font-medium mb-2">We'd love to hear from you</h3>
             <p className="text-gray-500 text-sm mb-8">Reach out for wholesale pricing and customized beauty solutions.</p>
             <div className="space-y-4">
                <input type="email" placeholder="Your Email Address" className="w-full bg-gray-50 rounded-full py-3 px-6 outline-none focus:ring-2 focus:ring-pink-100 text-sm" />
                <textarea placeholder="How can we help?" rows="3" className="w-full bg-gray-50 rounded-3xl py-3 px-6 outline-none focus:ring-2 focus:ring-pink-100 text-sm resize-none"></textarea>
                <button className="w-full py-3 rounded-full text-white font-bold shadow-md hover:opacity-90 transition" style={bgThemeStyle}>Send Love</button>
             </div>
          </div>
       </div>
    </div>
  );
}