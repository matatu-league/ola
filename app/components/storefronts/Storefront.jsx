"use client";

import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Mail, Phone, ShieldCheck, Loader2 } from 'lucide-react';

// Import from the variants folder instead of StoreVariants.jsx
import ClassicStore from './variants/ClassicStore';
import ModernStore from './variants/ModernStore';
import BoldStore from './variants/BoldStore';
import FurnitureStore from './variants/FurnitureStore';
import ApparelStore from './variants/ApparelStore';
import BeautyStore from './variants/BeautyStore';
import MinimalStore from './variants/MinimalStore';

const Storefront = ({ store: initialStore, onBack }) => {
  const productsRef = useRef(null);
  const contactRef = useRef(null);

  // Dynamic product fetching logic
  const [fetchedProducts, setFetchedProducts] = useState(initialStore?.products || []);
  const [isLoadingProducts, setIsLoadingProducts] = useState(!initialStore?.products?.length);

  /* STREAMING_CHUNK:Fetching dynamic products */
  useEffect(() => {
    const fetchStoreProducts = async () => {
      if (!initialStore?._id && !initialStore?.domain) {
        setIsLoadingProducts(false);
        return;
      }

      try {
        setIsLoadingProducts(true);
        // Using the same unified fetch approach as your dashboard
        const query = initialStore._id ? `storeId=${initialStore._id}` : `domain=${initialStore.domain}`;
        const response = await fetch(`/api/products?${query}&limit=100`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        const result = await response.json();

        if (result.success) {
          setFetchedProducts(result.data?.products || result.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch store products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchStoreProducts();
  }, [initialStore?._id, initialStore?.domain]);

  if (!initialStore) return null;

  /* STREAMING_CHUNK:Merging store state */
  // Merge initial store with dynamically fetched products
  const activeStore = {
    ...initialStore,
    products: fetchedProducts.length > 0 ? fetchedProducts : (initialStore.products || []),
    categories: initialStore.categories?.length > 0 ? initialStore.categories : ['Featured', 'New Arrivals', 'Trending']
  };

  // Extract theme colors
  const bgThemeStyle = { backgroundColor: activeStore.themeColor || '#000' };
  const themeStyle = { color: activeStore.themeColor || '#000' };

  /* STREAMING_CHUNK:Rendering layout switcher */
  // Dynamic Layout Switcher
  const renderStoreVariant = () => {
    const props = { 
      store: activeStore, 
      bgThemeStyle, 
      themeStyle, 
      productsRef, 
      contactRef, 
      isLoadingProducts 
    };
    
    switch (activeStore.layoutStyle?.toLowerCase()) {
      case 'modern': return <ModernStore {...props} />;
      case 'bold': return <BoldStore {...props} />;
      case 'furniture': return <FurnitureStore {...props} />;
      case 'apparel': return <ApparelStore {...props} />;
      case 'beauty': return <BeautyStore {...props} />;
      case 'minimal': return <MinimalStore {...props} />;
      case 'classic':
      default: return <ClassicStore {...props} />;
    }
  };

  /* STREAMING_CHUNK:Rendering global layout */
  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
             <div className="flex items-center gap-4">
               {onBack && (
                 <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                   <ArrowLeft size={20} />
                 </button>
               )}
               <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-inner" style={bgThemeStyle}>
                 {activeStore.title?.charAt(0) || 'S'}
               </div>
               <h1 className="font-extrabold text-[16px] md:text-[20px] text-gray-900 leading-tight flex items-center gap-2">
                 {activeStore.title || 'Store'}
                 {activeStore.verified && <ShieldCheck size={16} className="text-[#25F4EE]" fill="#25F4EE" stroke="white" />}
               </h1>
             </div>
             <div className="hidden md:flex gap-6 text-sm font-bold text-gray-600">
               <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-black transition-colors">Home</button>
               <button onClick={() => productsRef.current?.scrollIntoView({behavior:'smooth'})} className="hover:text-black transition-colors">Products</button>
               <button onClick={() => contactRef.current?.scrollIntoView({behavior:'smooth'})} className="hover:text-black transition-colors">Contact</button>
             </div>
        </div>
      </div>

      {/* --- DYNAMIC STORE CONTENT --- */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-4">
         {renderStoreVariant()}
      </div>

      /* STREAMING_CHUNK:Rendering footer */
      {/* --- GLOBAL STORE FOOTER --- */}
      <footer ref={contactRef} className="bg-gray-900 text-white mt-auto pt-16 pb-8 border-t-[8px]" style={{ borderTopColor: activeStore.themeColor || '#000' }}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 border-b border-gray-800 pb-12">
            
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded flex items-center justify-center text-white font-black text-xl" style={bgThemeStyle}>
                  {activeStore.title?.charAt(0) || 'S'}
                </div>
                <span className="font-extrabold text-[20px]">{activeStore.title || 'Our Store'}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{activeStore.description || 'Welcome to our online store.'}</p>
              <div className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                {activeStore.years && <span className="px-2 py-1 bg-gray-800 rounded">{activeStore.years} Years</span>}
                {activeStore.staff && <span className="px-2 py-1 bg-gray-800 rounded">{activeStore.staff} Staff</span>}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white uppercase tracking-wider text-sm">Capabilities</h4>
              <ul className="space-y-3">
                {activeStore.capabilities?.length > 0 ? (
                  activeStore.capabilities.map((cap, i) => (
                    <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={bgThemeStyle}></div>
                      {cap.label}: <span className="text-white font-medium">{cap.value}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 text-sm italic">Details coming soon</li>
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400 text-sm">
                  <MapPin size={18} className="shrink-0 mt-0.5" style={themeStyle}/>
                  <span>{activeStore.location?.address || 'Global Shipping Available'}</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <Mail size={18} className="shrink-0" style={themeStyle}/>
                  <span>{activeStore.contact?.email || 'N/A'}</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <Phone size={18} className="shrink-0" style={themeStyle}/>
                  <span>{activeStore.contact?.phone || 'N/A'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between text-gray-500 text-xs font-medium">
            <p>© {new Date().getFullYear()} {activeStore.title}. Powered by Ola Marketplace.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="hover:text-white cursor-pointer transition-colors">Store Terms</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Storefront;