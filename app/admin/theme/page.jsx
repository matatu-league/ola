"use client";

import React, { useState, useEffect } from 'react';
import { Palette, Save, Loader2, CheckCircle2, LayoutTemplate, Zap } from 'lucide-react';

// --- LIVE PREVIEW COMPONENT (TikTok Flat Aesthetic) ---
const StoreLivePreview = ({ layout, color, title, logo, showFlashSale }) => {
  return (
    <div className="w-full h-full min-h-[500px] border border-[#E3E3E4] rounded-sm bg-white flex flex-col overflow-hidden shadow-sm sticky top-6">
      {/* Mock Browser Chrome */}
      <div className="bg-[#F8F8F8] h-8 flex items-center px-3 gap-1.5 border-b border-[#E3E3E4] shrink-0">
        <div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-400"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-green-400"></div>
        <div className="ml-4 flex-1 bg-white h-4 rounded-sm border border-[#E3E3E4]"></div>
      </div>
      
      {/* Mock Store Content */}
      <div className="flex-1 overflow-hidden pointer-events-none select-none relative bg-white">
        
        {/* 1. CLASSIC */}
        {layout === 'Classic' && (
          <div className="flex flex-col h-full">
            <div className="h-8 border-b border-[#E3E3E4] flex items-center px-3 gap-2">
               {logo ? <img src={logo} alt="Logo" className="w-4 h-4 object-cover border border-[#E3E3E4] rounded-sm" /> : <div className="w-4 h-4 rounded-sm text-[8px] text-white flex items-center justify-center font-bold" style={{backgroundColor: color}}>C</div>}
               <div className="w-16 h-1.5 bg-[#E3E3E4] rounded-sm"></div>
            </div>
            <div className="h-28 w-full relative flex items-center justify-center bg-[#F8F8F8]">
               <div className="flex flex-col items-center">
                 <div className="text-sm font-bold text-[#161823] mb-1.5">{title}</div>
                 <div className="w-20 h-3 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>
            <div className="p-4 flex-1">
               <div className="grid grid-cols-3 gap-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="aspect-square bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-2 flex flex-col">
                     <div className="flex-1 bg-[#E3E3E4] rounded-sm mb-1.5"></div>
                     <div className="w-full h-1.5 bg-[#E3E3E4] rounded-sm mb-1"></div>
                     <div className="w-1/2 h-2 rounded-sm" style={{backgroundColor: color}}></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 2. MODERN */}
        {layout === 'Modern' && (
          <div className="flex flex-col h-full p-3">
            <div className="flex gap-3 h-28 mb-3">
              <div className="w-1/2 bg-[#F8F8F8] rounded-sm border border-[#E3E3E4]"></div>
              <div className="w-1/2 flex flex-col justify-center">
                 <div className="text-xs font-bold text-[#161823] mb-2">{title}</div>
                 <div className="w-16 h-4 rounded-sm" style={{backgroundColor: color}}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-sm p-2 aspect-square border border-[#E3E3E4] flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-[#F8F8F8] rounded-sm mb-2"></div>
                  <div className="w-1/2 h-1.5 bg-[#E3E3E4] rounded-sm mb-1"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. BOLD */}
        {layout === 'Bold' && (
          <div className="flex flex-col h-full border-b-4" style={{borderColor: color}}>
            <div className="h-32 bg-[#161823] flex flex-col items-center justify-center p-4 border-b" style={{borderColor: color}}>
               <div className="text-white font-bold uppercase tracking-tight">{title}</div>
               <div className="mt-3 w-20 h-4 bg-white rounded-sm"></div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[1,2].map(i => (
                <div key={i} className="flex gap-3 p-2 border border-[#E3E3E4] rounded-sm">
                  <div className="w-12 h-12 bg-[#F8F8F8] rounded-sm"></div>
                  <div className="flex flex-col justify-center w-full">
                    <div className="w-3/4 h-2 bg-[#161823] mb-1.5 rounded-sm"></div>
                    <div className="w-1/2 h-2 rounded-sm" style={{backgroundColor: color}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. FURNITURE */}
        {layout === 'Furniture' && (
          <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="h-28 bg-[#E3E3E4] m-1.5 rounded-sm flex items-end p-3">
               <div className="text-white font-serif text-sm">{title}</div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[1,2].map(i => (
                <div key={i} className="bg-white border border-[#E3E3E4] p-1.5 rounded-sm">
                  <div className="w-full aspect-[4/3] bg-[#F8F8F8] rounded-sm mb-2"></div>
                  <div className="w-1/2 h-1.5 bg-[#E3E3E4] rounded-sm mb-1"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. APPAREL */}
        {layout === 'Apparel' && (
          <div className="flex flex-col h-full">
            <div className="py-4 flex flex-col items-center">
               <div className="text-sm font-bold uppercase">{title}</div>
            </div>
            <div className="px-4 grid grid-cols-3 gap-2">
               {[1,2,3].map(i => (
                 <div key={i} className="flex flex-col items-center">
                   <div className="w-full aspect-[3/4] bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm mb-1.5"></div>
                   <div className="w-full h-1 bg-[#161823] rounded-sm"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 6. BEAUTY */}
        {layout === 'Beauty' && (
          <div className="flex flex-col h-full bg-[#FFF0F5]">
            <div className="py-6 flex flex-col items-center">
               <div className="w-12 h-12 rounded-full bg-white border border-[#E3E3E4] mb-2"></div>
               <div className="text-xs font-light text-[#161823] tracking-widest">{title}</div>
            </div>
            <div className="px-4 grid grid-cols-2 gap-4">
               {[1,2].map(i => (
                 <div key={i} className="flex flex-col items-center p-2 bg-white rounded-t-full rounded-b-sm border border-[#E3E3E4]">
                   <div className="w-full aspect-square bg-[#F8F8F8] rounded-full mb-2"></div>
                   <div className="w-1/2 h-1 bg-[#E3E3E4] rounded-sm"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 7. MINIMAL */}
        {layout === 'Minimal' && (
          <div className="flex flex-col h-full p-6">
            <div className="text-sm font-light text-gray-400 mb-8">{title}</div>
            <div className="flex flex-col gap-6">
               {[1,2].map(i => (
                 <div key={i} className="w-full flex items-center justify-between border-b border-gray-100 pb-2">
                   <div className="w-1/3 h-2 bg-gray-200 rounded-sm"></div>
                   <div className="w-12 h-12 bg-gray-50"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 8. TECH */}
        {layout === 'Tech' && (
          <div className="flex flex-col h-full bg-[#0F172A] text-white">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div className="text-xs font-mono">{title}</div>
              <div className="w-4 h-4 rounded-sm" style={{backgroundColor: color}}></div>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
               {[1,2].map(i => (
                 <div key={i} className="bg-[#1E293B] p-2 rounded-sm border border-white/5 flex gap-2">
                   <div className="w-10 h-10 bg-black/50 rounded-sm"></div>
                   <div className="flex-1 flex flex-col justify-center gap-1">
                     <div className="w-3/4 h-1.5 bg-white/50 rounded-sm"></div>
                     <div className="w-1/4 h-1.5 bg-white/20 rounded-sm"></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 9. MARKET */}
        {layout === 'Market' && (
          <div className="flex flex-col h-full">
            <div className="p-3 bg-[#16A34A] text-white font-bold">{title}</div>
            <div className="p-2 grid grid-cols-4 gap-1.5">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <div key={i} className="aspect-square bg-white border border-[#E3E3E4] rounded-sm p-1 flex flex-col">
                   <div className="flex-1 bg-[#F8F8F8] rounded-sm mb-1"></div>
                   <div className="w-full h-3 bg-[#16A34A] rounded-sm mt-auto"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 10. LUXURY */}
        {layout === 'Luxury' && (
          <div className="flex flex-col h-full bg-white border-8 border-gray-100">
            <div className="h-40 bg-gray-900 m-2 flex items-center justify-center text-white font-serif text-lg tracking-widest">
              {title.substring(0, 1) || 'L'}
            </div>
            <div className="p-4 flex justify-center gap-4">
               {[1,2].map(i => (
                 <div key={i} className="w-16 h-24 border border-gray-200 p-1">
                   <div className="w-full h-full bg-gray-50"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 11. AUTO */}
        {layout === 'Auto' && (
          <div className="flex flex-col h-full bg-gray-100">
            <div className="h-24 bg-gray-800 text-white p-3 flex flex-col justify-between">
              <div className="font-bold italic">{title}</div>
              <div className="w-full h-6 bg-white/20 rounded-sm"></div>
            </div>
            <div className="p-2 flex flex-col gap-2">
               {[1,2].map(i => (
                 <div key={i} className="bg-white p-2 rounded-sm shadow-sm">
                   <div className="w-full h-16 bg-gray-200 rounded-sm mb-2"></div>
                   <div className="flex justify-between">
                     <div className="w-1/2 h-2 bg-gray-800 rounded-sm"></div>
                     <div className="w-1/4 h-2" style={{backgroundColor: color}}></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 12. CAMPUS */}
        {layout === 'Campus' && (
          <div className="flex flex-col h-full">
            <div className="h-20 flex items-center justify-center border-b-4" style={{backgroundColor: color, borderColor: '#161823'}}>
              <div className="text-white font-black text-xl tracking-tighter">{title}</div>
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="bg-gray-100 p-2 border-2 border-gray-800 rounded-sm text-center">
                   <div className="w-full aspect-square bg-white border border-gray-300 rounded-sm mb-1"></div>
                   <div className="w-1/2 h-2 bg-gray-800 mx-auto"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 13. HOTEL */}
        {layout === 'Hotel' && (
          <div className="flex flex-col h-full">
            <div className="h-32 bg-gray-200 relative">
               <div className="absolute inset-x-2 bottom-2 bg-white p-2 rounded-sm shadow-sm flex gap-1">
                 <div className="flex-1 h-4 bg-gray-100 rounded-sm"></div>
                 <div className="flex-1 h-4 bg-gray-100 rounded-sm"></div>
                 <div className="w-6 h-4 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>
            <div className="p-3 flex flex-col gap-2">
               {[1,2].map(i => (
                 <div key={i} className="flex gap-2 border border-gray-200 p-1.5 rounded-sm">
                   <div className="w-16 h-12 bg-gray-100 rounded-sm"></div>
                   <div className="flex flex-col justify-between py-1 w-full">
                     <div className="w-3/4 h-1.5 bg-gray-800 rounded-sm"></div>
                     <div className="w-1/4 h-1.5" style={{backgroundColor: color}}></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 14. DIGITAL */}
        {layout === 'Digital' && (
          <div className="flex flex-col h-full bg-[#F8FAFC]">
            <div className="p-4 border-b border-gray-200">
              <div className="text-lg font-extrabold text-blue-600 mb-2">{title}</div>
              <div className="w-full h-8 bg-blue-600 rounded-sm text-white flex items-center justify-center text-[10px]">Buy Now</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
               <div className="w-full h-32 bg-white border border-gray-200 rounded-sm shadow-sm p-3">
                 <div className="w-1/2 h-2 bg-gray-800 rounded-sm mb-4"></div>
                 {[1,2,3].map(i => (
                   <div key={i} className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                     <div className="w-3/4 h-1 bg-gray-300 rounded-sm"></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 15. PROPERTY */}
        {layout === 'Property' && (
          <div className="flex flex-col h-full">
            <div className="h-12 border-b flex items-center px-3 justify-between">
              <div className="font-bold text-gray-800">{title}</div>
              <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-24 bg-blue-50 flex items-center justify-center text-blue-200 text-xs border-b">Map View</div>
            <div className="p-2 grid grid-cols-2 gap-2">
               {[1,2].map(i => (
                 <div key={i} className="border border-gray-200 rounded-sm overflow-hidden">
                   <div className="w-full h-16 bg-gray-100"></div>
                   <div className="p-1.5">
                     <div className="w-full h-1.5 bg-gray-800 rounded-sm mb-1"></div>
                     <div className="w-1/2 h-1 bg-gray-400 rounded-sm"></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 16. CAFE */}
        {layout === 'Cafe' && (
          <div className="flex flex-col h-full bg-[#FFFBF0]">
            <div className="py-4 flex flex-col items-center border-b border-orange-200">
               <div className="text-xl font-serif text-orange-900">{title}</div>
            </div>
            <div className="p-4 flex flex-col gap-4">
               {[1,2,3].map(i => (
                 <div key={i} className="flex justify-between items-center border-b border-orange-100 pb-2">
                   <div className="flex flex-col gap-1 w-2/3">
                     <div className="w-full h-2 bg-orange-900 rounded-sm"></div>
                     <div className="w-1/2 h-1 bg-orange-300 rounded-sm"></div>
                   </div>
                   <div className="w-8 h-8 rounded-full border border-orange-200 flex items-center justify-center text-orange-600 text-[8px]">+</div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 17. FITNESS */}
        {layout === 'Fitness' && (
          <div className="flex flex-col h-full bg-black">
            <div className="h-20 bg-zinc-900 flex items-center justify-center -skew-y-3 mt-4 mb-6">
              <div className="text-white font-black text-xl italic skew-y-3 uppercase">{title}</div>
            </div>
            <div className="px-4 flex flex-col gap-3">
               {[1,2].map(i => (
                 <div key={i} className="bg-zinc-900 border-l-4 p-2" style={{borderColor: color}}>
                   <div className="w-1/2 h-2 bg-white mb-2"></div>
                   <div className="w-full h-1 bg-zinc-700"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 18. PET */}
        {layout === 'Pet' && (
          <div className="flex flex-col h-full bg-[#F0FDF4]">
            <div className="h-20 flex items-center justify-center">
              <div className="font-bold text-green-800 flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                {title}
              </div>
            </div>
            <div className="bg-white rounded-t-[2rem] flex-1 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] grid grid-cols-2 gap-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="bg-green-50 rounded-xl p-2 flex flex-col items-center">
                   <div className="w-12 h-12 bg-white rounded-full mb-2"></div>
                   <div className="w-3/4 h-1.5 bg-green-800 rounded-sm"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 19. BOOK */}
        {layout === 'Book' && (
          <div className="flex flex-col h-full bg-[#F5EFE6]">
            <div className="p-4 border-b border-[#D5CABB]">
              <div className="font-serif text-[#4A3B2C] text-lg">{title}</div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="flex flex-col">
                   <div className="w-full aspect-[2/3] bg-[#E8DFD1] border-l-4 border-l-[#4A3B2C]/20 shadow-sm mb-1"></div>
                   <div className="w-full h-1 bg-[#4A3B2C] rounded-sm"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 20. ART */}
        {layout === 'Art' && (
          <div className="flex flex-col h-full bg-white">
            <div className="py-6 px-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Gallery</div>
              <div className="text-xl font-light text-black">{title}</div>
            </div>
            <div className="px-4 columns-2 gap-2 space-y-2">
               <div className="w-full h-24 bg-gray-100"></div>
               <div className="w-full h-16 bg-gray-100"></div>
               <div className="w-full h-32 bg-gray-100"></div>
               <div className="w-full h-20 bg-gray-100"></div>
            </div>
          </div>
        )}

        {/* FLASH SALE OVERLAY (Applies to all) */}
        {showFlashSale && (
          <div className="absolute top-8 left-0 right-0 bg-[#FE2C55] text-white text-[8px] font-bold py-1 px-3 flex justify-between items-center shadow-md z-50">
             <span>⚡ FLASH SALE</span>
             <span>ENDS IN: 02:45:00</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default function ThemePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Theme states
  const [storeData, setStoreData] = useState({ title: '', logo: '' });
  const [layoutStyle, setLayoutStyle] = useState('Classic');
  const [themeColor, setThemeColor] = useState('#161823');
  const [flashSalesEnabled, setFlashSalesEnabled] = useState(false);

  // Expanded 20 Layout Options
  const layoutOptions = [
    { name: 'Classic', desc: 'Clean & reliable. Great for electronics and mixed inventories.', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80&fit=crop&h=300' },
    { name: 'Modern', desc: 'Minimalist & tech-focused with split-screen imagery.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80&fit=crop&h=300' },
    { name: 'Bold', desc: 'High contrast & stark. Perfect for industrial or machinery.', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80&fit=crop&h=300' },
    { name: 'Furniture', desc: 'Elegant serif typography & soft editorial photography.', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&q=80&fit=crop&h=300' },
    { name: 'Apparel', desc: 'Fashion-forward lookbook style with massive imagery.', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80&fit=crop&h=300' },
    { name: 'Beauty', desc: 'Soft edges, circular framing, and pastel-friendly.', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&fit=crop&h=300' },
    { name: 'Minimal', desc: 'Extreme whitespace. Let the products speak for themselves.', image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&q=80&fit=crop&h=300' },
    { name: 'Tech', desc: 'Dark mode native, sleek borders, and specification grids.', image: 'https://images.unsplash.com/photo-1550009158-9a37b35c09e5?w=500&q=80&fit=crop&h=300' },
    { name: 'Market', desc: 'High density grid for groceries and fast-moving goods.', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80&fit=crop&h=300' },
    { name: 'Luxury', desc: 'Heavy borders, serif fonts, and exclusive aesthetic.', image: 'https://images.unsplash.com/photo-1515562141207-7a8ea4114e17?w=500&q=80&fit=crop&h=300' },
    { name: 'Auto', desc: 'Built for vehicles, parts, and detailed specifications.', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&q=80&fit=crop&h=300' },
    { name: 'Campus', desc: 'Collegiate styling, perfect for school merchandise.', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&q=80&fit=crop&h=300' },
    { name: 'Hotel', desc: 'Optimized for bookings, dates, and property galleries.', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80&fit=crop&h=300' },
    { name: 'Digital', desc: 'Focused on software, courses, and instant downloads.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80&fit=crop&h=300' },
    { name: 'Property', desc: 'Real estate specific with map integration support.', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80&fit=crop&h=300' },
    { name: 'Cafe', desc: 'Restaurant menus, dietary badges, and warm tones.', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80&fit=crop&h=300' },
    { name: 'Fitness', desc: 'High energy, angled layouts, and membership tiers.', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80&fit=crop&h=300' },
    { name: 'Pet', desc: 'Playful UI, rounded corners, and category icons.', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&q=80&fit=crop&h=300' },
    { name: 'Book', desc: 'List views formatted for book covers and authors.', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&q=80&fit=crop&h=300' },
    { name: 'Art', desc: 'Masonry grids to let varied artwork dimensions shine.', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80&fit=crop&h=300' }
  ];

  const colorOptions = ['#161823', '#FE2C55', '#25F4EE', '#2563EB', '#16A34A', '#8B5CF6', '#F59E0B', '#10B981'];

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch('/api/stores');
        const result = await response.json();
        
        if (result.success && result.store) {
          const s = result.store;
          setStoreData({ title: s.title || 'My Store', logo: s.logo || '' });
          if (s.layoutStyle) setLayoutStyle(s.layoutStyle);
          if (s.themeColor) setThemeColor(s.themeColor);
          if (s.features?.flashSales) setFlashSalesEnabled(s.features.flashSales);
        }
      } catch (error) {
        console.error("Failed to load store theme data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStore();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          layoutStyle, 
          themeColor, 
          features: { flashSales: flashSalesEnabled } 
        })
      });
      
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Store theme updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update theme.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#161823]" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Theme & Design</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Customize how your storefront looks to customers.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#FE2C55] hover:bg-[#e0264b] text-white px-6 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Publish Theme'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-10">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:w-[55%] space-y-6">
          
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E3E3E4] pb-3">
              <LayoutTemplate size={18} className="text-[#161823]" />
              <h2 className="text-base font-bold text-[#161823]">Store Templates</h2>
            </div>
            <p className="text-[12px] text-[#8A8B91] mb-5">Select a structural layout for your product catalog and store headers.</p>
            
            {/* SCROLLABLE GRID CONTAINER FOR 20 ITEMS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {layoutOptions.map((layout) => (
                <div 
                  key={layout.name}
                  onClick={() => setLayoutStyle(layout.name)}
                  className={`group relative overflow-hidden rounded-sm border cursor-pointer transition-all ${
                    layoutStyle === layout.name 
                      ? 'border-[#161823] ring-1 ring-[#161823]' 
                      : 'border-[#E3E3E4] hover:border-[#8A8B91]'
                  }`}
                >
                  <div className="h-28 w-full bg-[#F8F8F8] relative border-b border-[#E3E3E4]">
                    <img src={layout.image} alt={layout.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161823]/90 to-transparent"></div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                       <h4 className="font-semibold text-white text-sm">{layout.name}</h4>
                       {layoutStyle === layout.name && <CheckCircle2 size={16} className="text-[#FE2C55]" fill="white" />}
                    </div>
                  </div>
                  <div className="p-3 bg-white h-full">
                    <p className="text-[11px] text-[#8A8B91] leading-relaxed">{layout.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Add a tiny style block to ensure the scrollbar looks clean */}
            <style dangerouslySetInnerHTML={{__html: `
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: #F8F8F8; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
            `}} />
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E3E3E4] pb-3">
              <Palette size={18} className="text-[#161823]" />
              <h2 className="text-base font-bold text-[#161823]">Brand Colors</h2>
            </div>
            <p className="text-[12px] text-[#8A8B91] mb-5">This color will be used for your store's buttons, accents, and highlights.</p>
            
            <div className="flex flex-wrap gap-3">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all ${
                    themeColor === color ? 'ring-2 ring-offset-2 ring-[#161823]' : 'hover:opacity-80 border border-[#E3E3E4]'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {themeColor === color && <CheckCircle2 size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E3E3E4] pb-3">
              <Zap size={18} className="text-[#161823]" />
              <h2 className="text-base font-bold text-[#161823]">Store Modules</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-[13px] font-bold text-[#161823]">Flash Sales Banner</h3>
                 <p className="text-[12px] text-[#8A8B91] mt-0.5">Show a promotional countdown banner highlighting discounted items.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={flashSalesEnabled} 
                  onChange={e => setFlashSalesEnabled(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-[#E3E3E4] peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E3E3E4] after:border after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FE2C55]"></div>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Preview */}
        <div className="lg:w-[45%]">
           <div className="sticky top-6">
             <div className="flex items-center justify-between mb-3 px-1">
               <span className="text-[12px] font-bold text-[#161823] uppercase tracking-wider flex items-center gap-2">
                 Live Preview
               </span>
               <span className="text-[10px] bg-[#F8F8F8] border border-[#E3E3E4] px-2 py-0.5 rounded-sm text-[#8A8B91] font-semibold">
                 {layoutStyle} Theme
               </span>
             </div>
             
             <StoreLivePreview 
               layout={layoutStyle} 
               color={themeColor} 
               title={storeData.title} 
               logo={storeData.logo}
               showFlashSale={flashSalesEnabled}
             />
           </div>
        </div>

      </div>
    </div>
  );
}
