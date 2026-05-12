import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FurnitureStore({ store, themeStyle, bgThemeStyle, productsRef, contactRef, isLoadingProducts }) {
  return (
    <div className="animate-fade-in pb-16">
       <div className="flex flex-col md:flex-row h-[500px] mt-4 rounded-xl overflow-hidden px-4 md:px-0">
          <div className="w-full md:w-1/2 bg-[#fdfbf7] p-10 md:p-16 flex flex-col justify-center">
             <h2 className="text-4xl md:text-6xl font-serif text-[#3e3b38] mb-6 leading-tight">Curated Living Spaces</h2>
             <p className="text-[#7d7a77] mb-8 font-light text-lg">Elevate your home with our bespoke furnishings and timeless designs.</p>
             <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="self-start px-8 py-3 rounded-sm text-white font-serif tracking-widest text-sm hover:opacity-90" style={bgThemeStyle}>VIEW COLLECTION</button>
          </div>
          <div className="w-full md:w-1/2 h-full"><img src={store?.banner || '/placeholder-banner.jpg'} className="w-full h-full object-cover" alt="Banner"/></div>
       </div>
       
       <div className="py-16 text-center px-4 md:px-0">
          <h3 className="font-serif text-2xl text-[#3e3b38] mb-8">Shop by Room</h3>
          <div className="flex flex-wrap justify-center gap-4">
             {store?.categories?.map((cat, i) => (
                <div key={i} className="px-8 py-4 bg-[#fdfbf7] text-[#3e3b38] font-serif text-sm cursor-pointer hover:bg-[#f3efea] transition border border-[#ebe7e0]">{cat}</div>
             ))}
          </div>
       </div>
       
       <div ref={productsRef} className="max-w-6xl mx-auto px-4 scroll-mt-24">
          {isLoadingProducts ? (
             <div className="flex justify-center items-center py-10 font-serif text-[#7d7a77]">
                <Loader2 className="animate-spin mr-2" size={24}/> Preparing collection...
             </div>
          ) : store?.products?.length === 0 ? (
             <div className="text-center py-10 font-serif text-[#7d7a77]">
                No pieces available at the moment.
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                {store?.products?.map((prod, i) => (
                  <div key={i} className="group cursor-pointer">
                     <div className="w-full aspect-[4/3] bg-[#fdfbf7] mb-4 flex items-center justify-center p-8 overflow-hidden relative">
                        <img src={prod.image || '/placeholder.png'} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-1000" alt={prod.title}/>
                     </div>
                     <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif text-xl text-[#3e3b38] mb-1">{prod.title}</h4>
                          {prod.moq && <p className="text-sm text-[#7d7a77]">Minimum order: {prod.moq}</p>}
                        </div>
                        <div className="font-serif text-lg text-[#3e3b38]">{prod.price ? `USh ${Number(prod.price).toLocaleString()}` : '-'}</div>
                     </div>
                  </div>
                ))}
             </div>
          )}
       </div>
       
       <div ref={contactRef} className="mt-24 bg-[#fdfbf7] py-16 px-4 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center">
             <h3 className="font-serif text-3xl text-[#3e3b38] mb-6">Request a Consultation</h3>
             <p className="text-[#7d7a77] font-light mb-10">Our design specialists are ready to assist you.</p>
             <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input type="text" placeholder="Your Name" className="flex-1 bg-white border border-[#ebe7e0] p-4 font-serif outline-none focus:border-[#3e3b38]" />
                <input type="email" placeholder="Your Email" className="flex-1 bg-white border border-[#ebe7e0] p-4 font-serif outline-none focus:border-[#3e3b38]" />
             </div>
             <button className="w-full py-4 text-white font-serif tracking-widest text-sm hover:opacity-90 transition" style={bgThemeStyle}>SUBMIT REQUEST</button>
          </div>
       </div>
    </div>
  );
}