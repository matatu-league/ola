import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function BoldStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16 mt-4 px-4 md:px-0">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
          <div className="md:col-span-2 md:row-span-2 bg-black text-white p-10 flex flex-col justify-end relative overflow-hidden group rounded-xl">
             <img src={store?.banner || '/placeholder-banner.jpg'} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="Banner"/>
             <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">Power.</h2>
                <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="bg-white text-black px-6 py-2 uppercase font-black text-sm hover:bg-gray-200 transition">View Gear</button>
             </div>
          </div>
          
          {!isLoadingProducts && store?.products?.slice(0, 2).map((prod, i) => (
            <div key={i} className="md:col-span-1 md:row-span-1 bg-white border-4 border-black p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition rounded-xl shadow-[4px_4px_0px_#000]">
               <img src={prod.image || '/placeholder.png'} className="h-20 mix-blend-multiply mb-2" alt={prod.title}/>
               <div className="font-black uppercase text-center text-[11px] line-clamp-2">{prod.title}</div>
            </div>
          ))}

          <div className="md:col-span-2 md:row-span-1 text-black p-8 flex flex-col justify-center border-4 rounded-xl border-black shadow-[4px_4px_0px_#000]" style={bgThemeStyle}>
             <h3 className="text-3xl font-black uppercase text-white drop-shadow-md">Heavy Duty.</h3>
          </div>
       </div>
       
       <div ref={productsRef} className="mt-16 scroll-mt-24">
          <div className="border-b-4 border-black pb-2 mb-8"><h3 className="text-3xl font-black uppercase">Inventory</h3></div>
          
          {isLoadingProducts ? (
             <div className="flex items-center justify-center py-10 font-black uppercase text-gray-500">
                <Loader2 className="animate-spin mr-2" size={24}/> Fetching Database...
             </div>
          ) : store?.products?.length === 0 ? (
             <div className="text-center py-10 font-black uppercase text-gray-500">
                No items in inventory.
             </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {store?.products?.map((prod, i) => (
                  <div key={i} className="border-4 border-black rounded-xl p-4 flex flex-col bg-white shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all cursor-pointer">
                     <img src={prod.image || '/placeholder.png'} className="w-full aspect-square object-contain mix-blend-multiply mb-4 bg-gray-100 rounded" alt={prod.title}/>
                     <h4 className="font-black uppercase text-xs leading-tight mb-2">{prod.title}</h4>
                     <div className="mt-auto font-black text-lg" style={themeStyle}>{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                  </div>
                ))}
             </div>
          )}
       </div>
       
       <div ref={contactRef} className="mt-16 border-4 border-black rounded-xl p-8 shadow-[8px_8px_0px_#000] bg-white scroll-mt-24">
          <h3 className="text-3xl font-black uppercase mb-6">Contact Base</h3>
          <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-4">
                <input type="text" placeholder="ID / NAME" className="w-full border-4 border-black p-3 font-bold uppercase outline-none focus:bg-gray-100" />
                <textarea placeholder="TRANSMISSION" rows="3" className="w-full border-4 border-black p-3 font-bold uppercase outline-none focus:bg-gray-100"></textarea>
                <button className="w-full bg-black text-white font-black uppercase py-4 text-xl hover:bg-gray-800 transition">Transmit</button>
             </div>
             <div className="flex-1 flex flex-col justify-center font-black uppercase text-sm space-y-4">
                <div className="flex items-center gap-2"><ArrowRight/> {store?.contact?.email || 'N/A'}</div>
                <div className="flex items-center gap-2"><ArrowRight/> {store?.contact?.phone || 'N/A'}</div>
                <div className="flex items-center gap-2"><ArrowRight/> {store?.location?.address || 'N/A'}</div>
             </div>
          </div>
       </div>
    </div>
  );
}