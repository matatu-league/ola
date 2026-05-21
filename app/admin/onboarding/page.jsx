"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Store, Globe, Palette, Loader2, LayoutDashboard } from 'lucide-react';

// --- LIVE PREVIEW COMPONENT (TikTok Flat Aesthetic) ---
const StoreLivePreview = ({ layout, color, title, logo }) => {
  return (
    <div className="w-full h-full min-h-[380px] border border-[#E3E3E4] rounded-sm bg-white flex flex-col overflow-hidden shadow-sm">
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
            <div className="h-6 border-b border-[#E3E3E4] flex items-center px-3 gap-2">
               <div className="w-3 h-3 rounded-sm text-[6px] text-white flex items-center justify-center font-bold" style={{backgroundColor: color}}>C</div>
               <div className="w-16 h-1.5 bg-[#E3E3E4] rounded-sm"></div>
            </div>
            <div className="h-24 w-full relative flex items-center justify-center px-4 text-center">
               <div className="absolute inset-0 bg-[#F8F8F8]"></div>
               <div className="relative z-10 w-full flex flex-col items-center">
                 <div className="text-xs font-bold text-[#161823] mb-1.5 truncate w-full">{title}</div>
                 <div className="w-16 h-3 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>
            <div className="p-3 flex-1">
               <div className="mb-2.5 bg-white border border-[#E3E3E4] p-1.5 rounded-sm flex flex-col gap-1.5">
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

               <div className="w-12 h-1.5 bg-[#E3E3E4] rounded-sm mb-3"></div>
               <div className="grid grid-cols-3 gap-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="aspect-square bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex flex-col p-1.5">
                     <div className="flex-1 bg-[#E3E3E4] rounded-sm mb-1"></div>
                     <div className="w-full h-1 bg-[#E3E3E4] rounded-sm mb-0.5"></div>
                     <div className="w-1/2 h-1.5 rounded-sm mt-auto" style={{backgroundColor: color}}></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 2. MODERN PREVIEW */}
        {layout === 'Modern' && (
          <div className="flex flex-col h-full p-2">
            <div className="flex gap-2 h-24 mb-3">
              <div className="w-1/2 bg-[#F8F8F8] rounded-sm border border-[#E3E3E4]"></div>
              <div className="w-1/2 flex flex-col justify-center">
                 <div className="w-8 h-1 rounded-sm mb-1" style={{backgroundColor: color}}></div>
                 <div className="text-[10px] font-bold text-[#161823] leading-tight mb-2 truncate">{title}</div>
                 <div className="w-12 h-3 rounded-sm" style={{backgroundColor: color}}></div>
              </div>
            </div>
            
            <div className="w-full mb-3 bg-[#161823] rounded-sm p-1.5 flex gap-2 overflow-hidden items-center">
               <div className="shrink-0 text-white flex flex-col items-center justify-center w-8">
                  <div className="text-[5px] uppercase font-bold text-[#8A8B91]">Ends In</div>
                  <div className="text-[7px] font-bold" style={{color: color}}>02:45</div>
               </div>
               <div className="flex-1 flex gap-1">
                 {[1,2].map(i => (
                   <div key={i} className="h-6 flex-1 bg-white rounded-sm relative border border-white/20"></div>
                 ))}
               </div>
            </div>

            <div className="w-full flex-1 flex flex-col items-center">
               <div className="w-16 h-1.5 bg-[#161823] rounded-sm mb-3"></div>
               <div className="grid grid-cols-2 gap-2 w-full">
                 {[1,2].map(i => (
                   <div key={i} className="bg-white rounded-sm p-1.5 aspect-square flex flex-col items-center justify-center border border-[#E3E3E4]">
                     <div className="w-8 h-8 bg-[#F8F8F8] rounded-sm mb-2 border border-[#E3E3E4]"></div>
                     <div className="w-1/2 h-1 bg-[#E3E3E4] rounded-sm mb-1"></div>
                     <div className="w-1/3 h-1.5 rounded-sm" style={{backgroundColor: color}}></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* 3. BOLD PREVIEW */}
        {layout === 'Bold' && (
          <div className="flex flex-col h-full border-b-2" style={{borderColor: color}}>
            <div className="h-24 bg-[#161823] flex flex-col items-center justify-center p-3 text-center border-b" style={{borderColor: color}}>
               <div className="text-white font-bold text-xs uppercase tracking-tight truncate w-full">{title}</div>
               <div className="mt-2 w-16 h-3 bg-white rounded-sm flex items-center justify-center">
                 <div className="w-8 h-0.5 bg-[#161823] rounded-sm"></div>
               </div>
            </div>
            <div className="p-3">
               <div className="mb-3 bg-[#FE2C55] rounded-sm p-1.5 flex flex-col items-center" style={{backgroundColor: color}}>
                  <div className="text-white text-[7px] font-black tracking-widest uppercase mb-1 border-b border-white/30 pb-0.5 w-full text-center">Lightning Deals</div>
                  <div className="w-full h-6 bg-white rounded-sm flex items-center justify-between px-2">
                     <div className="w-8 h-1 bg-[#161823] rounded-sm"></div>
                     <div className="text-[7px] font-black" style={{color: color}}>-50%</div>
                  </div>
               </div>

               <div className="w-20 h-2 bg-[#161823] mb-3 border-l-2 pl-1 rounded-sm" style={{borderColor: color}}></div>
               <div className="flex flex-col gap-2">
                 {[1,2].map(i => (
                   <div key={i} className="flex gap-2 p-1.5 border border-[#E3E3E4] rounded-sm">
                     <div className="w-10 h-10 bg-[#F8F8F8] shrink-0 rounded-sm"></div>
                     <div className="flex flex-col justify-center w-full">
                       <div className="w-3/4 h-1.5 bg-[#161823] mb-1 rounded-sm"></div>
                       <div className="w-full h-1.5 rounded-sm mt-1" style={{backgroundColor: color}}></div>
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
            <div className="h-24 relative overflow-hidden bg-[#E3E3E4] m-1 rounded-sm">
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-2 text-center items-center">
                 <div className="text-white font-serif text-xs tracking-wide mb-1 w-full truncate">{title}</div>
                 <div className="w-16 h-0.5 bg-white/50 rounded-sm"></div>
               </div>
            </div>
            <div className="p-3 flex flex-col items-center">
               <div className="mb-3 w-full border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm flex items-center p-1">
                  <div className="w-10 text-center border-r border-[#E3E3E4] pr-1.5 mr-1.5">
                     <div className="text-[5px] font-serif text-[#161823] uppercase">Limited</div>
                     <div className="text-[7px] font-serif" style={{color: color}}>02:45:00</div>
                  </div>
                  <div className="flex-1 h-6 bg-white border border-[#E3E3E4] rounded-sm"></div>
               </div>

               <div className="w-16 h-1 bg-[#E3E3E4] rounded-sm mb-3"></div>
               <div className="grid grid-cols-2 gap-2 w-full">
                 {[1,2].map(i => (
                   <div key={i} className="flex flex-col border border-[#E3E3E4] p-1 bg-white rounded-sm">
                     <div className="w-full aspect-[4/3] bg-[#F8F8F8] rounded-sm mb-1.5"></div>
                     <div className="flex justify-between items-center px-1 pb-0.5">
                       <div className="w-1/2 h-1 bg-[#E3E3E4] rounded-sm"></div>
                       <div className="w-1/4 h-1.5 rounded-sm" style={{backgroundColor: color}}></div>
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
            <div className="py-3 flex flex-col items-center justify-center">
               <div className="text-xs font-bold uppercase tracking-tight mb-1 truncate w-3/4 text-center text-[#161823]">{title}</div>
               <div className="w-12 h-3 border flex items-center justify-center rounded-sm" style={{borderColor: color}}>
                 <div className="w-6 h-0.5 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>

            <div className="mb-2 w-full bg-[#F8F8F8] border-y border-[#E3E3E4] p-1 flex flex-col items-center">
               <div className="text-[6px] font-black uppercase tracking-widest text-[#161823] mb-1">Flash Drop</div>
               <div className="flex gap-1 w-full px-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="flex-1 aspect-[4/5] bg-white border border-[#E3E3E4] rounded-sm relative">
                      <div className="absolute top-0.5 left-0.5 bg-[#161823] text-white text-[3px] px-0.5 py-0.5 font-bold uppercase rounded-sm">Sale</div>
                    </div>
                 ))}
               </div>
            </div>

            <div className="px-3 grid grid-cols-3 gap-1.5 mt-1">
               {[1,2,3].map(i => (
                 <div key={i} className="flex flex-col items-center border border-[#E3E3E4] p-1 rounded-sm">
                   <div className="w-full aspect-[3/4] bg-[#F8F8F8] rounded-sm mb-1"></div>
                   <div className="w-full h-1 bg-[#161823] rounded-sm mb-0.5"></div>
                   <div className="w-1/2 h-1 bg-[#E3E3E4] rounded-sm"></div>
                 </div>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default function StoreOnboarding() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    email: '',
    phone: '',
    domain: '',
    layoutStyle: 'Classic',
    themeColor: '#161823'
  });

  // Pre-fill data from TikTok login
  useEffect(() => {
    const localUser = localStorage.getItem('ola_seller_user');
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        if (parsed.name) {
          const cleanName = parsed.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          setFormData(prev => ({ 
            ...prev, 
            title: `${parsed.name}'s Store`,
            domain: `${cleanName}.ola.ug`
          }));
        }
      } catch (e) {
        console.error("Failed to parse local user data", e);
      }
    }
  }, []);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        // FIXED: Redirect the user to their newly created custom domain dashboard
        window.location.href = `https://${formData.domain}/dashboard`;
      } else {
        setError(result.message || 'Failed to create store. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Layout themes mapped with Unsplash preview images
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

  const colorOptions = ['#161823', '#FE2C55', '#25F4EE', '#2563EB', '#16A34A'];

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#161823]">
      {/* Top Progress Bar - Flat & Compact */}
      <div className="bg-white border-b border-[#E3E3E4] py-3 px-4 flex justify-center sticky top-0 z-10">
        <div className="flex items-center gap-2 max-w-sm w-full justify-between">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-[11px] font-bold transition-colors ${step >= num ? 'bg-[#161823] text-white' : 'bg-[#F8F8F8] text-[#8A8B91] border border-[#E3E3E4]'}`}>
                {step > num ? <CheckCircle2 size={12} /> : num}
              </div>
              <div className="hidden sm:block text-[11px] font-semibold text-[#8A8B91] uppercase tracking-wider">
                {num === 1 ? 'Details' : num === 2 ? 'Domain' : 'Design'}
              </div>
              {num !== 3 && <div className={`w-6 sm:w-12 h-[2px] rounded-none ${step > num ? 'bg-[#161823]' : 'bg-[#E3E3E4]'}`}></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-start justify-center p-4 pt-8 md:p-8">
        <div className={`bg-white w-full border border-[#E3E3E4] rounded-sm p-6 md:p-8 transition-all duration-300 ${step === 3 ? 'max-w-4xl' : 'max-w-xl'}`}>
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-10 h-10 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center mb-5">
                <Store className="text-[#161823]" size={18} />
              </div>
              <h2 className="text-xl font-bold text-[#161823] mb-1">Set up your store.</h2>
              <p className="text-sm text-[#8A8B91] mb-6">You can edit these details later in settings.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#161823] mb-1.5">Store Name</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#161823] focus:ring-1 focus:ring-[#161823] transition-colors"
                    placeholder="E.g. Matatu Electronics"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#161823] mb-1.5">Support Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#161823] focus:ring-1 focus:ring-[#161823] transition-colors"
                      placeholder="hello@store.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#161823] mb-1.5">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#161823] focus:ring-1 focus:ring-[#161823] transition-colors"
                      placeholder="+256 700 000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Domain Setup */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-10 h-10 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center mb-5">
                <Globe className="text-[#161823]" size={18} />
              </div>
              <h2 className="text-xl font-bold text-[#161823] mb-1">Claim your web address.</h2>
              <p className="text-sm text-[#8A8B91] mb-6">Generated based on your TikTok profile.</p>

              <div className="space-y-3">
                <label className="block text-[13px] font-semibold text-[#161823]">Your Store URL</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#8A8B91] text-sm select-none">https://</span>
                  <input 
                    type="text" 
                    value={formData.domain.replace('.ola.ug', '')}
                    onChange={(e) => {
                      const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData({...formData, domain: `${sanitized}.ola.ug`})
                    }}
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-[56px] pr-[60px] py-2.5 focus:outline-none focus:border-[#161823] text-sm font-semibold text-[#161823]"
                    placeholder="my-store"
                  />
                  <span className="absolute right-3 text-[#161823] text-sm font-semibold select-none">.ola.ug</span>
                </div>
                <p className="text-[11px] text-[#8A8B91]">Lowercase letters, numbers, and hyphens only.</p>
              </div>
            </div>
          )}

          {/* STEP 3: Theme & Design (SPLIT VIEW) */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              
              <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center shrink-0">
                  <Palette className="text-[#161823]" size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#161823] tracking-tight leading-none mb-1">Pick a store vibe.</h2>
                  <p className="text-[#8A8B91] text-[13px]">Select a layout and color for your brand.</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-[#FE2C55] rounded-sm text-xs font-semibold border border-red-100 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#FE2C55]" /> {error}
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT COLUMN: Controls */}
                <div className="lg:w-[55%] space-y-6">
                  {/* Layout Selector Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {layoutOptions.map((layout) => (
                      <div 
                        key={layout.name}
                        onClick={() => setFormData({...formData, layoutStyle: layout.name})}
                        className={`group relative overflow-hidden rounded-sm border cursor-pointer transition-all ${
                          formData.layoutStyle === layout.name 
                            ? 'border-[#161823] ring-1 ring-[#161823]' 
                            : 'border-[#E3E3E4] hover:border-[#8A8B91]'
                        }`}
                      >
                        <div className="h-20 w-full bg-[#F8F8F8] relative border-b border-[#E3E3E4]">
                          <img src={layout.image} alt={layout.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#161823]/80 to-transparent"></div>
                          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                             <h4 className="font-semibold text-white text-xs">{layout.name}</h4>
                             {formData.layoutStyle === layout.name && <CheckCircle2 size={14} className="text-[#FE2C55]" fill="white" />}
                          </div>
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-[10px] text-[#8A8B91] leading-tight">{layout.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Color Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#161823] mb-2 uppercase tracking-wide">Brand Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setFormData({...formData, themeColor: color})}
                          className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all ${
                            formData.themeColor === color ? 'ring-2 ring-offset-2 ring-[#161823]' : 'hover:opacity-80 border border-[#E3E3E4]'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {formData.themeColor === color && <CheckCircle2 size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Live Preview */}
                <div className="lg:w-[45%]">
                   <div className="sticky top-6">
                     <div className="flex items-center gap-1.5 mb-2 px-1">
                       <LayoutDashboard size={14} className="text-[#8A8B91]" />
                       <span className="text-[11px] font-bold text-[#8A8B91] uppercase tracking-wide">Live Preview</span>
                     </div>
                     <StoreLivePreview 
                       layout={formData.layoutStyle} 
                       color={formData.themeColor} 
                       title={formData.title || 'My Store'} 
                     />
                   </div>
                </div>

              </div>
            </div>
          )}

          {/* Form Actions - Square & Flat */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#E3E3E4]">
            <button 
              onClick={handleBack}
              className={`flex items-center gap-1.5 px-4 py-2 font-semibold text-[#8A8B91] hover:text-[#161823] text-sm transition-colors rounded-sm hover:bg-[#F8F8F8] ${step === 1 ? 'invisible' : 'visible'}`}
            >
              <ArrowLeft size={16} /> Back
            </button>
            
            {step < 3 ? (
              <button 
                onClick={handleNext}
                disabled={step === 1 && !formData.title}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#FE2C55] text-white rounded-sm font-semibold text-sm hover:bg-[#e0264b] transition-all disabled:opacity-50"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#FE2C55] text-white rounded-sm font-semibold text-sm hover:bg-[#e0264b] transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Store size={16} /> Launch Store</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}