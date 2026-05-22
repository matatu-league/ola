"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, Star, Heart, Share2, Search, 
  MessageCircle, ShieldCheck, ChevronLeft, Check, 
  Shield, Truck, MapPin, Store, Link as LinkIcon,
  ShoppingBag, ShoppingCart, X, AlertCircle, Minus, Plus
} from 'lucide-react';

// 🔴 IMPORT CART CONTEXT
import { useCart } from '@/contexts/CartContext';

export default function ProductDetails({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('Attributes');
  const thumbnailRefs = useRef([]);
  const popoverRef = useRef(null);
  
  const [quantity, setQuantity] = useState(1);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'cart' or 'buy'
  const [modalError, setModalError] = useState('');
  
  const providedData = {
    "_id": "6a06a5b5a8cf95484506cf99",
    "owner": {
        "_id": "69fd8303ffe395be6ef8f5c8",
        "title": "Matatu's Store",
        "domain": "gogo.ola.ug",
        "contact": { "email": "rumbiiha.swaibu@gmail.com", "phone": "+256766389284" },
        "verified": true,
        "rating": 5,
        "banner": "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=200&fit=crop",
        "location": { "address": "Kampala uganda" },
        "years": 10,
        "logo": "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop"
    },
    "breadcrumbs": ["Home", "Fashion", "Custom Logo White T-Shirt"],
    "status": "Active",
    "title": "Custom Logo White T-Shirt & Shorts Tracksuit Set Casual Summer Outfit",
    "description": "Elevate your casual wardrobe with our premium customizable white t-shirt and shorts tracksuit set.",
    "price": "6000",
    "sold": 142,
    "rating": 4.8,
    "reviewsCount": 12,
    "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&fit=crop"
    ],
    "stock": 100,
    "variants": [
        { "type": "Color", "name": "red", "stock": 10, "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&fit=crop" },
        { "type": "Color", "name": "green", "stock": 10, "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&fit=crop" },
        { "type": "Size", "name": "M", "stock": 50 },
        { "type": "Size", "name": "L", "stock": 50 }
    ],
    "attributes": [
        { "name": "Material", "value": "Polyester Blend" },
        { "name": "Color", "value": "White" }
    ],
    "packaging": { "sellingUnits": "Single item" },
    "shipping": { "fee": "To be negotiated", "note": "Chat with supplier for delivery details." },
    "reviewStats": { "average": 4.8, "total": 12 }
  };

  const safeProduct = product || providedData;

  const baseImages = [safeProduct.image, ...(safeProduct.images || [])].filter(Boolean);
  const variantImages = (safeProduct.variants || []).map(v => v.image).filter(Boolean);
  const allImages = Array.from(new Set([...baseImages, ...variantImages]));
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop');
  }

  const currentImage = allImages[activeImage] || allImages[0];

  const groupedVariants = useMemo(() => {
    return safeProduct.variants?.reduce((acc, variant) => {
      const vType = variant.type || 'Selection';
      if (!acc[vType]) acc[vType] = [];
      acc[vType].push(variant);
      return acc;
    }, {}) || {};
  }, [safeProduct.variants]);

  // INITIAL STATE IS EMPTY SO THEY HAVE TO CHOOSE (TRIGGERS MODAL LOGIC WELL)
  const [selectedVariants, setSelectedVariants] = useState({});

  const handleVariantSelect = (type, variant) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variant.name }));
    setModalError(''); // Clear error if they select something inside modal
    if (variant.image) {
      const imgIndex = allImages.indexOf(variant.image);
      if (imgIndex !== -1) setActiveImage(imgIndex);
    }
  };

  useEffect(() => {
    if (thumbnailRefs.current[activeImage]) {
      thumbnailRefs.current[activeImage].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeImage]);

  // Handle clicking outside the compact popover to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen]);

  // --- CART LOGIC ---
  const handleActionClick = (actionType) => {
    const hasVariants = Object.keys(groupedVariants).length > 0;
    
    // Check if variants exist and if any are missing
    if (hasVariants) {
      const missingTypes = Object.keys(groupedVariants).filter(type => !selectedVariants[type]);
      
      if (missingTypes.length > 0) {
        // Show compact popover if they haven't selected variants
        setPendingAction(actionType);
        setIsPopoverOpen(true);
        return;
      }
    }

    // If no variants, or everything is selected, execute immediately
    executeAction(actionType);
  };

  const executeAction = (actionType) => {
    if (actionType === 'cart') {
      addToCart(safeProduct, quantity, selectedVariants);
      setIsPopoverOpen(false); // Drawer opens automatically via context
    } else if (actionType === 'buy') {
      addToCart(safeProduct, quantity, selectedVariants);
      setIsPopoverOpen(false);
      router.push('/checkout');
    }
  };

  const handlePopoverConfirm = () => {
    const missingTypes = Object.keys(groupedVariants).filter(type => !selectedVariants[type]);
    if (missingTypes.length > 0) {
      setModalError(`Please select: ${missingTypes.join(', ')}`);
      return;
    }
    setModalError('');
    executeAction(pendingAction);
  };

  const tabs = ['Service', 'Attributes', 'Reviews', 'Supplier', 'Description'];

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-[#161823]">

      {/* BREADCRUMBS */}
      <div className="max-w-[1400px] mx-auto pt-4 pb-4 px-4 text-[12px] text-[#8A8B91] flex items-center gap-2 flex-wrap font-medium">
        {safeProduct.breadcrumbs?.map((crumb, i) => (
          <React.Fragment key={i}>
            <span className={`hover:text-[#FE2C55] cursor-pointer transition-colors ${i === safeProduct.breadcrumbs.length - 1 ? 'text-[#161823] font-bold' : ''}`}>
              {crumb}
            </span>
            {i < safeProduct.breadcrumbs.length - 1 && <ChevronRight size={12} className="text-[#8A8B91]" />}
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 flex flex-col lg:flex-row items-start gap-4">

        {/* LEFT COLUMN */}
        <div className="flex-1 w-full lg:w-0 bg-white border border-[#E3E3E4] rounded-md overflow-hidden">
          {/* Header Info */}
          <div className="p-6 border-b border-[#E3E3E4]">
            <h1 className="text-[20px] md:text-[24px] font-bold leading-snug mb-3 text-[#161823] tracking-tight">{safeProduct.title}</h1>
            <div className="flex items-center flex-wrap gap-y-2 text-[13px] font-medium">
              <div className="flex items-center mr-4">
                <span className="font-bold mr-1.5 text-[#161823]">{safeProduct.reviewStats?.average?.toFixed(1) || '5.0'}</span>
                <div className="flex mr-1.5 text-[#F5C400]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(safeProduct.reviewStats?.average || 5) ? "currentColor" : "none"} stroke="currentColor" />
                  ))}
                </div>
                <span className="text-[#8A8B91] hover:text-[#161823] hover:underline cursor-pointer transition-colors">
                  ({safeProduct.reviewStats?.total || 0} reviews)
                </span>
              </div>
              <div className="text-[#8A8B91] mr-4">{safeProduct.sold || 0}+ sold</div>
              <div className="flex items-center text-[#8A8B91]">
                <ShieldCheck size={16} className="text-[#05C168] mr-1" />
                Trusted product
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="p-6 flex flex-col md:flex-row gap-6 relative border-b border-[#E3E3E4]">
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full md:w-[70px] shrink-0 hide-scrollbar md:max-h-[450px] scroll-smooth">
              {allImages.map((img, i) => (
                <div
                  key={i}
                  ref={(el) => (thumbnailRefs.current[i] = el)}
                  onClick={() => setActiveImage(i)}
                  className={`w-[70px] h-[70px] border cursor-pointer overflow-hidden shrink-0 transition-all rounded-sm ${activeImage === i ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4] hover:border-[#8A8B91]'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                </div>
              ))}
            </div>

            <div className="flex-1 bg-[#F8F8F8] rounded-sm relative overflow-hidden flex items-center justify-center group h-[350px] md:h-[450px] border border-[#E3E3E4]">
              <img src={currentImage} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="Main Product" />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="w-10 h-10 bg-white border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full"><Heart size={18} /></button>
                <button className="w-10 h-10 bg-white border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full"><Share2 size={18} /></button>
                <button className="w-10 h-10 bg-white border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full"><Search size={18} /></button>
              </div>
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : allImages.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border border-[#E3E3E4] flex items-center justify-center text-[#161823] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-full"><ChevronLeft size={20} /></button>
                  <button onClick={() => setActiveImage(prev => prev < allImages.length - 1 ? prev + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border border-[#E3E3E4] flex items-center justify-center text-[#161823] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-full"><ChevronRight size={20} /></button>
                </>
              )}
            </div>
          </div>

          {/* TABS */}
          <div className="bg-white sticky top-0 z-40">
            <div className="flex border-b border-[#E3E3E4] overflow-x-auto hide-scrollbar bg-white px-2">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-[14px] font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-[#161823] text-[#161823]' : 'border-transparent text-[#8A8B91] hover:text-[#161823]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-8">
              <div className={activeTab === 'Attributes' ? 'block' : 'hidden'}>
                <h3 className="font-bold text-[16px] mb-4 text-[#161823] flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#FE2C55] rounded-sm"></span> Key attributes
                </h3>
                {safeProduct.attributes && safeProduct.attributes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#E3E3E4] text-[13px] rounded-sm overflow-hidden">
                    {safeProduct.attributes.map((attr, i) => (
                      <div key={i} className="flex border-b border-r border-[#E3E3E4]">
                        <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold flex items-center">{attr.name}</div>
                        <div className="w-[60%] bg-white p-3 text-[#161823] font-medium flex items-center">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8A8B91] text-sm">No specific attributes listed.</p>
                )}
              </div>

              <div className={activeTab === 'Reviews' ? 'block' : 'hidden'}>
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-[#E3E3E4]">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="text-[48px] font-bold text-[#161823] leading-none mb-2 tracking-tighter">
                      {safeProduct.reviewStats?.average?.toFixed(1) || '5.0'}
                    </div>
                    <div className="flex mb-1 text-[#F5C400]">
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < 5 ? "currentColor" : "none"} stroke="currentColor" />)}
                    </div>
                    <div className="text-[12px] text-[#8A8B91] font-medium">Overall Rating</div>
                  </div>
                </div>
              </div>
              
              {['Service', 'Supplier', 'Description'].includes(activeTab) && (
                <div className="py-10 text-center text-[#8A8B91] font-medium text-[14px] bg-[#F8F8F8] rounded-sm border border-dashed border-[#E3E3E4] max-w-[800px] mx-auto">
                  {activeTab === 'Description' ? safeProduct.description : `Detailed ${activeTab.toLowerCase()} information will appear here.`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Sidebar */}
        <div className="w-full lg:w-[480px] shrink-0 bg-white border border-[#E3E3E4] rounded-md lg:sticky lg:top-[16px] z-[60]">

          {/* PRICING & ACTIONS */}
          <div className="p-6 border-b border-[#E3E3E4]">
            <div className="text-[13px] text-[#FE2C55] mb-1 font-bold tracking-tight">Wholesale Price</div>
            <div className="text-[32px] font-extrabold text-[#161823] mb-6 tracking-tight leading-none">
              USh {Number(safeProduct.price).toLocaleString()}
            </div>

            {/* VARIANTS ON PAGE */}
            {Object.keys(groupedVariants).length > 0 && (
              <div className="mb-6 space-y-6">
                {Object.entries(groupedVariants).map(([type, options]) => (
                  <div key={type} className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-bold text-[#161823]">{type}</span>
                      <span className="text-[#8A8B91] font-medium text-[12px]">{options.length} Options</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {options.map((variant, i) => (
                        <button
                          key={i}
                          onClick={() => handleVariantSelect(type, variant)}
                          className={`flex items-center gap-3 p-1.5 pr-4 border transition-all rounded-sm outline-none ${selectedVariants[type] === variant.name ? 'border-[#161823] text-[#161823] font-bold ring-1 ring-[#161823] bg-white' : 'border-[#E3E3E4] text-[#161823] font-medium hover:border-[#161823] bg-[#F8F8F8]'}`}
                        >
                          {variant.image && (
                            <div className="w-12 h-12 shrink-0 bg-white border border-[#E3E3E4] rounded-sm overflow-hidden">
                              <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <span className="text-[13px]">{variant.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* QUANTITY SELECTOR */}
            <div className="mb-6">
              <span className="block font-bold text-[#161823] text-[13px] mb-2.5">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#E3E3E4] rounded-md overflow-hidden h-10 w-[130px] bg-white focus-within:border-[#161823] transition-colors">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    disabled={quantity <= 1}
                    className="w-10 h-full flex items-center justify-center text-[#161823] hover:bg-[#F8F8F8] transition-colors disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <Minus size={16} strokeWidth={2} />
                  </button>
                  <input 
                    type="text" 
                    value={quantity} 
                    readOnly 
                    className="flex-1 w-full text-center text-[#161823] font-bold text-[14px] outline-none bg-white border-x border-[#E3E3E4] h-full" 
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="w-10 h-full flex items-center justify-center text-[#161823] hover:bg-[#F8F8F8] transition-colors"
                  >
                    <Plus size={16} strokeWidth={2} />
                  </button>
                </div>
                <span className="text-[12px] text-[#8A8B91] font-medium">{safeProduct.stock || 100} pieces available</span>
              </div>
            </div>

            {/* DUAL BUTTONS & COMPACT POPOVER */}
            <div className="relative" ref={popoverRef}>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleActionClick('cart')}
                  className="flex-1 bg-white border-2 border-[#FE2C55] text-[#FE2C55] hover:bg-[#FFF0F3] font-bold py-3 text-[14px] rounded-sm transition-colors flex justify-center items-center gap-2 tracking-tight"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button 
                  onClick={() => handleActionClick('buy')}
                  className="flex-1 bg-[#FE2C55] hover:bg-[#EF2950] text-white font-bold py-3 text-[14px] rounded-sm transition-colors flex justify-center items-center gap-2 tracking-tight"
                >
                  <ShoppingBag size={16} /> Buy Now
                </button>
              </div>

              {/* COMPACT ANT DESIGN POPOVER (Anchored right under buttons) */}
              {isPopoverOpen && (
                <div 
                  className="absolute top-full left-0 mt-3 w-full bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E3E3E4] z-[100]"
                  style={{ animation: 'popoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  {/* Upward pointing triangle caret */}
                  <div className="absolute -top-1.5 left-12 w-3 h-3 bg-white border-t border-l border-[#E3E3E4] transform rotate-45"></div>
                  
                  <div className="p-5 relative z-10">
                    <div className="flex justify-between items-center mb-4 border-b border-[#f0f0f0] pb-3">
                      <h4 className="text-[14px] font-bold text-[#161823] flex items-center gap-2">
                        <AlertCircle size={16} className="text-[#FE2C55]" /> 
                        Select options to continue
                      </h4>
                      <button onClick={() => setIsPopoverOpen(false)} className="text-[#8A8B91] hover:text-[#161823] transition-colors p-1">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 mb-4">
                      {/* Variant Choices */}
                      {Object.entries(groupedVariants).map(([type, options]) => (
                        <div key={type} className="mb-4 last:mb-0">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[#FE2C55] font-bold text-[12px]">*</span>
                            <h5 className="text-[12px] text-[#161823] font-bold">{type}</h5>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {options.map((variant, i) => (
                              <button
                                key={i}
                                onClick={() => handleVariantSelect(type, variant)}
                                className={`px-3 py-1.5 text-[12px] rounded-sm border transition-all font-medium ${
                                  selectedVariants[type] === variant.name
                                    ? 'border-[#FE2C55] text-[#FE2C55] bg-[#FFF0F3] shadow-[0_0_0_1px_#FE2C55]' 
                                    : 'border-[#E3E3E4] text-[#161823] bg-[#F8F8F8] hover:border-[#161823] hover:bg-white'
                                }`}
                              >
                                {variant.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {modalError && (
                      <div className="text-[12px] text-[#FE2C55] mb-3 font-medium bg-[#FFF0F3] p-2 rounded-sm border border-[#FE2C55]/20">
                        {modalError}
                      </div>
                    )}

                    <button 
                      onClick={handlePopoverConfirm}
                      className="w-full py-2.5 rounded-sm text-[13px] font-bold text-white bg-[#FE2C55] hover:bg-[#EF2950] transition-colors flex items-center justify-center gap-2 shadow-[#FE2C55]/20"
                    >
                      <Check size={14} /> Confirm Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SHIPPING & STORE (Rest of UI maintained) */}
          <div className="p-6 border-b border-[#E3E3E4]">
            <h4 className="text-[14px] font-bold mb-4 text-[#161823] flex items-center gap-2">
              <Truck size={18} className="text-[#FE2C55]" /> Shipping & Delivery
            </h4>
            <div className="bg-[#F8F8F8] text-[#161823] p-3 rounded-sm text-[12px] font-medium flex items-start gap-2 border border-[#E3E3E4]">
              <MessageCircle size={14} className="shrink-0 mt-0.5 text-[#FE2C55]" />
              {safeProduct.shipping?.note || 'Shipping cost depends on volume and destination.'}
            </div>
          </div>

          {safeProduct.owner && (
            <div className="rounded-b-md overflow-hidden">
              <div className="relative h-[90px] bg-[#F8F8F8]">
                <img src={safeProduct.owner.banner} className="w-full h-full object-cover" alt="Store Banner" onError={e => { e.target.style.display = 'none'; }} />
                <div className="absolute -bottom-5 left-5 w-[52px] h-[52px] bg-white border-2 border-white rounded-md shadow-md flex items-center justify-center overflow-hidden">
                  <img src={safeProduct.owner.logo} className="w-full h-full object-cover" alt="Store Logo" />
                </div>
              </div>
              <div className="pt-8 px-5 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[15px] text-[#161823]">{safeProduct.owner.title}</span>
                  {safeProduct.owner.verified && <Check size={12} strokeWidth={3} className="text-white bg-[#05C168] p-0.5 rounded-full shrink-0" />}
                </div>
                <div className="flex flex-col gap-2.5 mt-4">
                  <a href="#" className="w-full bg-[#161823] hover:bg-[#2a2b35] text-white font-bold py-2.5 text-[13px] rounded-sm transition-colors flex justify-center items-center gap-2 no-underline tracking-tight">
                    <MessageCircle size={15} /> Chat Now
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popoverFadeIn {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F8F8F8; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
      `}</style>
    </div>
  );
}