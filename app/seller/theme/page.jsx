"use client";

import React, { useState, useEffect } from 'react';
import { Palette, Save, Loader2, CheckCircle2, LayoutTemplate, Zap } from 'lucide-react';

// --- LIVE PREVIEW COMPONENT (TikTok Flat Aesthetic) ---
const StoreLivePreview = ({ layout, color, title, logo, showFlashSale }) => {
  return (
    <div className="w-full h-full min-h-[500px] border border-[#E3E3E4] rounded-sm bg-white flex flex-col overflow-hidden shadow-sm sticky top-6">
      {/* Mock Browser Chrome - Squared */}
      <div className="bg-[#F8F8F8] h-8 flex items-center px-3 gap-1.5 border-b border-[#E3E3E4] shrink-0">
        <div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-400"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-green-400"></div>
        <div className="ml-4 flex-1 bg-white h-4 rounded-sm border border-[#E3E3E4]"></div>
      </div>
      
      {/* Mock Store Content */}
      <div className="flex-1 overflow-hidden pointer-events-none select-none relative bg-white">
        
        {/* 1. CLASSIC PREVIEW */}
        {layout === 'Classic' && (
          <div className="flex flex-col h-full">
            <div className="h-8 border-b border-[#E3E3E4] flex items-center px-3 gap-2">
               {logo ? (
                 <img src={logo} alt="Logo" className="w-4 h-4 object-cover border border-[#E3E3E4] rounded-sm" />
               ) : (
                 <div className="w-4 h-4 rounded-sm text-[8px] text-white flex items-center justify-center font-bold" style={{backgroundColor: color}}>C</div>
               )}
               <div className="w-16 h-1.5 bg-[#E3E3E4] rounded-sm"></div>
            </div>
            <div className="h-28 w-full relative flex items-center justify-center px-4 text-center">
               <div className="absolute inset-0 bg-[#F8F8F8]"></div>
               <div className="relative z-10 w-full flex flex-col items-center">
                 <div className="text-sm font-bold text-[#161823] mb-1.5 truncate w-full">{title}</div>
                 <div className="w-20 h-3 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>
            <div className="p-4 flex-1">
               {/* NEW: Classic Flash Sale Mock */}
               {showFlashSale && (
                 <div className="mb-3 bg-white border border-[#E3E3E4] p-1.5 rounded-sm flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1">
                       <div className="flex items-center gap-1.5">
                          <div className="w-1 h-2.5 rounded-sm" style={{backgroundColor: color}}></div>
                          <div className="text-[8px] font-bold text-[#161823] uppercase">Flash Sale</div>
                       </div>
                       <div className="flex gap-0.5">
                          <div className="w-2.5 h-2.5 bg-[#161823] text-white text-[5px] flex items-center justify-center rounded-sm">02</div>
                          <div className="w-2.5 h-2.5 bg-[#161823] text-white text-[5px] flex items-center justify-center rounded-sm">45</div>
                       </div>
                    </div>
                    <div className="flex gap-1.5 overflow-hidden px-1">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-10 shrink-0 aspect-[3/4] bg-[#F8F8F8] rounded-sm border border-[#E3E3E4] relative">
                          <div className="absolute top-0 right-0 w-3 h-3 text-[5px] text-white flex items-center justify-center font-bold rounded-bl-sm" style={{backgroundColor: color}}>-20%</div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               <div className="w-16 h-2 bg-[#E3E3E4] rounded-sm mb-3"></div>
               <div className="grid grid-cols-3 gap-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="aspect-square bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex flex-col p-2">
                     <div className="flex-1 bg-[#E3E3E4] rounded-sm mb-1.5"></div>
                     <div className="w-full h-1.5 bg-[#E3E3E4] rounded-sm mb-1"></div>
                     <div className="w-1/2 h-2 rounded-sm mt-auto" style={{backgroundColor: color}}></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 2. MODERN PREVIEW */}
        {layout === 'Modern' && (
          <div className="flex flex-col h-full p-3">
            <div className="flex gap-3 h-28 mb-3">
              <div className="w-1/2 bg-[#F8F8F8] rounded-sm border border-[#E3E3E4] flex items-center justify-center overflow-hidden">
                {logo && <img src={logo} alt="Logo" className="w-12 h-12 object-cover opacity-80" />}
              </div>
              <div className="w-1/2 flex flex-col justify-center">
                 <div className="w-10 h-1.5 rounded-sm mb-1.5" style={{backgroundColor: color}}></div>
                 <div className="text-xs font-bold text-[#161823] leading-tight mb-2 truncate">{title}</div>
                 <div className="w-16 h-4 rounded-sm" style={{backgroundColor: color}}></div>
              </div>
            </div>

            {/* NEW: Modern Flash Sale Mock */}
            {showFlashSale && (
              <div className="w-full mb-3 bg-[#161823] rounded-sm p-1.5 flex gap-2 overflow-hidden items-center">
                 <div className="shrink-0 text-white flex flex-col items-center justify-center w-8">
                    <div className="text-[6px] uppercase font-bold text-[#8A8B91]">Ends In</div>
                    <div className="text-[8px] font-bold" style={{color: color}}>02:45</div>
                 </div>
                 <div className="flex-1 flex gap-1">
                   {[1,2].map(i => (
                     <div key={i} className="h-8 flex-1 bg-white rounded-sm relative border border-white/20">
                       <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-black/50 to-transparent"></div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="w-full flex-1 flex flex-col items-center">
               <div className="w-20 h-2 bg-[#161823] rounded-sm mb-3"></div>
               <div className="grid grid-cols-2 gap-3 w-full">
                 {[1,2].map(i => (
                   <div key={i} className="bg-white rounded-sm p-2 aspect-square flex flex-col items-center justify-center border border-[#E3E3E4]">
                     <div className="w-10 h-10 bg-[#F8F8F8] rounded-sm mb-2 border border-[#E3E3E4]"></div>
                     <div className="w-1/2 h-1.5 bg-[#E3E3E4] rounded-sm mb-1.5"></div>
                     <div className="w-1/3 h-2 rounded-sm" style={{backgroundColor: color}}></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 3. BOLD PREVIEW */}
        {layout === 'Bold' && (
          <div className="flex flex-col h-full border-b-4" style={{borderColor: color}}>
            <div className="h-32 bg-[#161823] flex flex-col items-center justify-center p-4 text-center border-b" style={{borderColor: color}}>
               {logo && <img src={logo} alt="Logo" className="w-10 h-10 object-cover mb-2 border border-white/20 rounded-sm" />}
               <div className="text-white font-bold text-sm uppercase tracking-tight truncate w-full">{title}</div>
               <div className="mt-3 w-20 h-4 bg-white rounded-sm flex items-center justify-center">
                 <div className="w-10 h-0.5 bg-[#161823] rounded-sm"></div>
               </div>
            </div>
            <div className="p-4">
               {/* NEW: Bold Flash Sale Mock */}
               {showFlashSale && (
                 <div className="mb-4 bg-[#FE2C55] rounded-sm p-2 flex flex-col items-center" style={{backgroundColor: color}}>
                    <div className="text-white text-[8px] font-black tracking-widest uppercase mb-1.5 border-b border-white/30 pb-1 w-full text-center">Lightning Deals</div>
                    <div className="w-full h-8 bg-white rounded-sm flex items-center justify-between px-2">
                       <div className="w-8 h-1.5 bg-[#161823] rounded-sm"></div>
                       <div className="text-[8px] font-black" style={{color: color}}>-50%</div>
                    </div>
                 </div>
               )}

               <div className="w-24 h-2 bg-[#161823] mb-4 border-l-2 pl-1 rounded-sm" style={{borderColor: color}}></div>
               <div className="flex flex-col gap-3">
                 {[1,2].map(i => (
                   <div key={i} className="flex gap-3 p-2 border border-[#E3E3E4] rounded-sm">
                     <div className="w-12 h-12 bg-[#F8F8F8] shrink-0 rounded-sm"></div>
                     <div className="flex flex-col justify-center w-full">
                       <div className="w-3/4 h-2 bg-[#161823] mb-1.5 rounded-sm"></div>
                       <div className="w-full h-2 rounded-sm mt-1" style={{backgroundColor: color}}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 4. FURNITURE PREVIEW */}
        {layout === 'Furniture' && (
          <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="h-28 relative overflow-hidden bg-[#E3E3E4] m-1.5 rounded-sm">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 text-center items-center">
                 {logo && <img src={logo} alt="Logo" className="w-8 h-8 object-cover mb-1 border border-white/30 rounded-sm" />}
                 <div className="text-white font-serif text-sm tracking-wide mb-1 w-full truncate">{title}</div>
                 <div className="w-16 h-1 bg-white/50 rounded-sm"></div>
               </div>
            </div>
            <div className="p-4 flex flex-col items-center">
               {/* NEW: Furniture Flash Sale Mock */}
               {showFlashSale && (
                 <div className="mb-4 w-full border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm flex items-center p-1.5">
                    <div className="w-12 text-center border-r border-[#E3E3E4] pr-1.5 mr-1.5">
                       <div className="text-[6px] font-serif text-[#161823] uppercase">Limited</div>
                       <div className="text-[8px] font-serif" style={{color: color}}>02:45:00</div>
                    </div>
                    <div className="flex-1 h-8 bg-white border border-[#E3E3E4] rounded-sm flex items-center justify-center">
                       <div className="w-1/2 h-1 bg-[#E3E3E4] rounded-sm"></div>
                    </div>
                 </div>
               )}

               <div className="w-20 h-1.5 bg-[#E3E3E4] rounded-sm mb-4"></div>
               <div className="grid grid-cols-2 gap-3 w-full">
                 {[1,2].map(i => (
                   <div key={i} className="flex flex-col border border-[#E3E3E4] p-1.5 bg-white rounded-sm">
                     <div className="w-full aspect-[4/3] bg-[#F8F8F8] rounded-sm mb-2"></div>
                     <div className="flex justify-between items-center px-1 pb-0.5">
                       <div className="w-1/2 h-1.5 bg-[#E3E3E4] rounded-sm"></div>
                       <div className="w-1/4 h-2 rounded-sm" style={{backgroundColor: color}}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 5. APPAREL PREVIEW */}
        {layout === 'Apparel' && (
          <div className="flex flex-col h-full">
            <div className="py-4 flex flex-col items-center justify-center">
               {logo && <img src={logo} alt="Logo" className="w-8 h-8 object-cover mb-2 rounded-sm" />}
               <div className="text-sm font-bold uppercase tracking-tight mb-1 truncate w-3/4 text-center text-[#161823]">{title}</div>
               <div className="w-16 h-4 border flex items-center justify-center rounded-sm" style={{borderColor: color}}>
                 <div className="w-8 h-0.5 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>

            {/* NEW: Apparel Flash Sale Mock */}
            {showFlashSale && (
              <div className="mb-3 w-full bg-[#F8F8F8] border-y border-[#E3E3E4] p-1.5 flex flex-col items-center">
                 <div className="text-[7px] font-black uppercase tracking-widest text-[#161823] mb-1.5 mt-0.5">Flash Drop</div>
                 <div className="flex gap-1 w-full px-2 mb-1">
                   {[1,2,3].map(i => (
                      <div key={i} className="flex-1 aspect-[4/5] bg-white border border-[#E3E3E4] rounded-sm relative">
                        <div className="absolute top-0.5 left-0.5 bg-[#161823] text-white text-[4px] px-0.5 py-0.5 font-bold uppercase rounded-sm">Sale</div>
                      </div>
                   ))}
                 </div>
              </div>
            )}

            <div className="px-4 grid grid-cols-3 gap-2">
               {[1,2,3].map(i => (
                 <div key={i} className="flex flex-col items-center border border-[#E3E3E4] p-1.5 rounded-sm">
                   <div className="w-full aspect-[3/4] bg-[#F8F8F8] rounded-sm mb-1.5"></div>
                   <div className="w-full h-1.5 bg-[#161823] rounded-sm mb-1"></div>
                   <div className="w-1/2 h-1.5 bg-[#E3E3E4] rounded-sm"></div>
                 </div>
               ))}
            </div>
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
  
  // Flash Sales feature state
  const [flashSalesEnabled, setFlashSalesEnabled] = useState(false);

  const layoutOptions = [
    { 
      name: 'Classic', 
      desc: 'Clean & reliable. Great for electronics and mixed inventories.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80&fit=crop&h=300'
    },
    { 
      name: 'Modern', 
      desc: 'Minimalist & tech-focused with split-screen imagery.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80&fit=crop&h=300'
    },
    { 
      name: 'Bold', 
      desc: 'High contrast & stark. Perfect for industrial or machinery.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80&fit=crop&h=300'
    },
    { 
      name: 'Furniture', 
      desc: 'Elegant serif typography & soft editorial photography.',
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&q=80&fit=crop&h=300'
    },
    { 
      name: 'Apparel', 
      desc: 'Fashion-forward lookbook style with massive imagery.',
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80&fit=crop&h=300'
    }
  ];

  const colorOptions = ['#161823', '#FE2C55', '#25F4EE', '#2563EB', '#16A34A', '#8B5CF6', '#F59E0B', '#10B981'];

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch('/api/seller/store', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
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
      const response = await fetch('/api/seller/store', {
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="p-3 bg-white">
                    <p className="text-[11px] text-[#8A8B91] leading-relaxed">{layout.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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

          {/* NEW: Store Features / Modules */}
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
             
             {/* Pass showFlashSale to dynamically control the preview mock */}
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