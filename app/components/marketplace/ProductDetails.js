"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronRight, Star, Heart, Share2, Search, 
  MessageCircle, ShieldCheck, ChevronLeft, Check, 
  Shield, ThumbsUp, Truck, MapPin, Store, Link as LinkIcon,
  ShoppingBag, Phone, Mail
} from 'lucide-react';

export default function ProductDetails({ product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('Attributes');
  const thumbnailRefs = useRef([]);
  
  const providedData = {
    "_id": "6a06a5b5a8cf95484506cf99",
    "owner": {
        "_id": "69fd8303ffe395be6ef8f5c8",
        "title": "Matatu's Store",
        "domain": "gogo.ola.ug",
        "bannerImages": [],
        "contact": {
            "email": "rumbiiha.swaibu@gmail.com",
            "phone": "+256766389284"
        },
        "verified": false,
        "rating": 5,
        "banner": "blob:https://simple-maggot-expert.ngrok-free.app/cefb99cc-aed9-416d-a6be-c48050d7c0c6",
        "location": {
            "address": "Kampala uganda"
        },
        "years": 10,
        "logo": "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Flogo_1778255533686_Group1794.png?alt=media&token=9455dd72-816f-485d-9d6a-3170d03886cd"
    },
    "categoryRef": {
        "_id": "69f8a70efa0e0f6d9a3ab711",
        "name": "Fashion",
        "slug": "fashion-and-beauty",
        "image": "https://assets.jijistatic.com/art/attributes/categories/fashion-x3.png",
        "parentRef": null,
        "__v": 0
    },
    "breadcrumbs": [
        "Home",
        "Fashion",
        "Custom Logo White T-Shirt & Shorts Tracksuit Set Casual Summer Outfit"
    ],
    "status": "Active",
    "title": "Custom Logo White T-Shirt & Shorts Tracksuit Set Casual Summer Outfit",
    "description": "Elevate your casual wardrobe with our premium customizable white t-shirt and shorts tracksuit set. This versatile two-piece ensemble allows you to add your unique touch with personalized text or logo printing, making it perfect for branding, team wear, or simply expressing your individual style. The clean white base provides a crisp canvas, complemented by stylish 'Los Angeles' detailing along the neckline and sleeves for a subtle urban flair.Crafted for comfort and style, this set is ideal for daily wear, gym sessions, or relaxed outings. The breathable fabric ensures maximum comfort during warmer seasons, while the relaxed fit offers freedom of movement. Whether you're looking for a coordinated loungewear option or a distinctive athletic outfit, this custom track set delivers both quality and personalized appeal.",
    "price": "6000",
    "moq": "1",
    "sold": 0,
    "rating": 0,
    "reviewsCount": 0,
    "image": "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fimages_1778820069553_Hd661cb80bb834c4fb4db572964948421t.jpg_960x960q80.jpg?alt=media&token=7e8e0330-a6a9-4f58-a918-9c1f8abf612d",
    "images": [
        "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fimages_1778820069553_Hd661cb80bb834c4fb4db572964948421t.jpg_960x960q80.jpg?alt=media&token=7e8e0330-a6a9-4f58-a918-9c1f8abf612d",
        "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fimages_1778820144646_angle_0_1778820144633.png?alt=media&token=6f617d7a-4548-487b-9222-80022d2cd1f1",
        "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fimages_1778820194969_angle_1_1778820194958.png?alt=media&token=a268f7af-09f0-4b3e-ab1f-5cb07f0913dc",
        "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fimages_1778820231733_angle_2_1778820231705.png?alt=media&token=7cc2baaf-4b45-4906-81a9-cae72c52b1d0"
    ],
    "sku": "",
    "stock": 0,
    "isFlashItem": false,
    "variants": [
        {
            "type": "Color",
            "name": "red",
            "stock": 10,
            "image": "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fvariants_1778820338552_variant_0_1778820338510.png?alt=media&token=d96c7b75-f614-4df7-a0ea-844174c4ca83"
        },
        {
            "type": "Color",
            "name": "green",
            "stock": 10,
            "image": "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fvariants_1778820405841_variant_1_1778820405824.png?alt=media&token=aec05f53-a620-4436-8275-cdf8a7761761"
        },
        {
            "type": "Color",
            "name": "blue",
            "stock": 10,
            "image": "https://firebasestorage.googleapis.com/v0/b/alxlite-5d4c2.firebasestorage.app/o/stores%2FHqVNYoKrLOXmogbD8554l3SSv893%2Fproducts%2Fvariants_1778820514452_variant_2_1778820514434.png?alt=media&token=a71e9aea-c04f-440f-96fb-1f4a51b568bf"
        }
    ],
    "attributes": [
        { "name": "Material", "value": "Polyester Blend" },
        { "name": "Color", "value": "White" },
        { "name": "Sleeve Length", "value": "Short Sleeve" },
        { "name": "Pattern Type", "value": "Solid with Graphic Print" },
        { "name": "Customization", "value": "Logo and Text Printing Available" }
    ],
    "packaging": {
        "sellingUnits": "Single item"
    },
    "customization": [],
    "shipping": {
        "fee": "To be negotiated",
        "note": "Chat with supplier for delivery details."
    },
    "reviews": [],
    "reviewStats": {
        "average": 5,
        "total": 0
    },
    "recommendations": []
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

  const [selectedVariants, setSelectedVariants] = useState(() => {
    const initials = {};
    Object.keys(groupedVariants).forEach(type => {
      initials[type] = groupedVariants[type][0].name;
    });
    return initials;
  });

  const handleVariantSelect = (type, variant) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variant.name }));
    if (variant.image) {
      const imgIndex = allImages.indexOf(variant.image);
      if (imgIndex !== -1) setActiveImage(imgIndex);
    }
  };

  useEffect(() => {
    if (thumbnailRefs.current[activeImage]) {
      thumbnailRefs.current[activeImage].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeImage]);

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
                <button className="w-10 h-10 bg-white shadow-sm border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full"><Heart size={18} /></button>
                <button className="w-10 h-10 bg-white shadow-sm border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full"><Share2 size={18} /></button>
                <button className="w-10 h-10 bg-white shadow-sm border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full"><Search size={18} /></button>
              </div>
              {allImages.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : allImages.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow-sm border border-[#E3E3E4] flex items-center justify-center text-[#161823] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-full"><ChevronLeft size={20} /></button>
                  <button onClick={() => setActiveImage(prev => prev < allImages.length - 1 ? prev + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow-sm border border-[#E3E3E4] flex items-center justify-center text-[#161823] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-full"><ChevronRight size={20} /></button>
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
              {/* Attributes Tab */}
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
                {safeProduct.packaging && (
                  <>
                    <h3 className="font-bold text-[16px] mt-10 mb-4 text-[#161823] flex items-center gap-2">
                      <span className="w-1 h-4 bg-[#FE2C55] rounded-sm"></span> Packaging & delivery
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#E3E3E4] text-[13px] rounded-sm overflow-hidden">
                      <div className="flex border-b border-r border-[#E3E3E4]">
                        <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold">Selling Units:</div>
                        <div className="w-[60%] bg-white p-3 font-medium text-[#161823]">{safeProduct.packaging.sellingUnits || '-'}</div>
                      </div>
                      <div className="flex border-b border-r border-[#E3E3E4]">
                        <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold">Package size:</div>
                        <div className="w-[60%] bg-white p-3 font-medium text-[#161823]">{safeProduct.packaging.singlePackageSize || '-'}</div>
                      </div>
                      <div className="flex border-b border-r border-[#E3E3E4]">
                        <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold">Gross weight:</div>
                        <div className="w-[60%] bg-white p-3 font-medium text-[#161823]">{safeProduct.packaging.singleGrossWeight || '-'}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Reviews Tab */}
              <div className={activeTab === 'Reviews' ? 'block' : 'hidden'}>
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-[#E3E3E4]">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="text-[48px] font-bold text-[#161823] leading-none mb-2 tracking-tighter">
                      {safeProduct.reviewStats?.average?.toFixed(1) || '5.0'}
                    </div>
                    <div className="flex mb-1 text-[#F5C400]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < Math.round(safeProduct.reviewStats?.average || 5) ? "currentColor" : "none"} stroke="currentColor" />
                      ))}
                    </div>
                    <div className="text-[12px] text-[#8A8B91] font-medium">Overall Rating</div>
                    <div className="text-[12px] text-[#8A8B91] mt-1">{safeProduct.reviewStats?.total || 0} reviews</div>
                  </div>
                </div>
                <div className="space-y-6">
                  {!safeProduct.reviews || safeProduct.reviews.length === 0 ? (
                    <p className="text-[#8A8B91] text-[13px] text-center py-8 bg-[#F8F8F8] rounded-sm border border-dashed border-[#E3E3E4]">There are no reviews for this product yet.</p>
                  ) : (
                    safeProduct.reviews.map((review, i) => (
                      <div key={i} className="flex gap-4 border-b border-[#E3E3E4] pb-6 last:border-0">
                        <div className="w-10 shrink-0 flex flex-col items-center text-center">
                          <div className="w-8 h-8 bg-[#FE2C55] text-white flex items-center justify-center font-bold text-[14px] mb-1 rounded-full">
                            {review.reviewerName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-[10px] text-[#8A8B91] font-medium break-all">{review.reviewerName || 'User'}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex text-[#F5C400]">
                              {[...Array(review.rating)].map((_, idx) => <Star key={idx} size={12} fill="currentColor" stroke="none" />)}
                            </div>
                            <span className="text-[12px] text-[#8A8B91] font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[13px] text-[#161823] leading-relaxed mb-3">{review.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
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
        <div className="w-full lg:w-[480px] shrink-0 bg-white border border-[#E3E3E4] rounded-md overflow-hidden lg:sticky lg:top-[16px] shadow-sm">

          {/* PRICING & VARIANTS */}
          <div className="p-6 border-b border-[#E3E3E4]">
            <div className="text-[13px] text-[#FE2C55] mb-1 font-bold tracking-tight">Wholesale Price</div>
            <div className="text-[32px] font-extrabold text-[#161823] mb-6 tracking-tight leading-none">
              USh {Number(safeProduct.price).toLocaleString()}
            </div>

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

            {/* BUY NOW button — primary CTA, lives with pricing */}
            <button className="w-full bg-[#FE2C55] hover:bg-[#EF2950] text-white font-bold py-3.5 text-[14px] rounded-sm shadow-sm transition-colors flex justify-center items-center gap-2 tracking-tight">
              <ShoppingBag size={16} />
              Buy Now
            </button>
          </div>

          {/* SHIPPING */}
          <div className="p-6 border-b border-[#E3E3E4]">
            <h4 className="text-[14px] font-bold mb-4 text-[#161823] flex items-center gap-2">
              <Truck size={18} className="text-[#FE2C55]" />
              Shipping & Delivery
            </h4>
            <div className="bg-[#F8F8F8] text-[#161823] p-3 rounded-sm text-[12px] font-medium flex items-start gap-2 border border-[#E3E3E4]">
              <MessageCircle size={14} className="shrink-0 mt-0.5 text-[#FE2C55]" />
              {safeProduct.shipping?.note || 'Shipping cost depends on volume and destination. Chat with supplier for final quotes.'}
            </div>
          </div>

          {/* STORE CARD — self-contained with Chat Now inside */}
          {safeProduct.owner && (
            <div className="border-b border-[#E3E3E4]">
              {/* Store Banner */}
              <div className="relative h-[90px] bg-[#F8F8F8]">
                <img
                  src={safeProduct.owner.banner || 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=200&fit=crop'}
                  className="w-full h-full object-cover"
                  alt="Store Banner"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                {/* Logo badge overlapping the banner bottom */}
                <div className="absolute -bottom-5 left-5 w-[52px] h-[52px] bg-white border-2 border-white rounded-md shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={safeProduct.owner.logo || '/placeholder.png'}
                    className="w-full h-full object-cover"
                    alt="Store Logo"
                  />
                </div>
              </div>

              {/* Store Info */}
              <div className="pt-8 px-5 pb-5">
                {/* Name + verified */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[15px] text-[#161823]">{safeProduct.owner.title}</span>
                  {safeProduct.owner.verified && (
                    <Check size={12} strokeWidth={3} className="text-white bg-[#05C168] p-0.5 rounded-full shrink-0" />
                  )}
                </div>

                {/* Domain pill */}
                {safeProduct.owner.domain && (
                  <div className="inline-flex items-center gap-1 bg-[#F8F8F8] border border-[#E3E3E4] px-2 py-0.5 rounded-sm text-[11px] text-[#8A8B91] mb-3 font-mono font-medium">
                    <LinkIcon size={9} className="text-[#8A8B91]" />
                    <span className="text-[#FE2C55] font-bold">{safeProduct.owner.domain}</span>
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-4 text-[12px] text-[#8A8B91] font-medium mb-4">
                  {safeProduct.owner.years && (
                    <span><span className="font-bold text-[#161823]">{safeProduct.owner.years}</span> yrs on platform</span>
                  )}
                  {safeProduct.owner.location?.address && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} className="shrink-0" />
                      {safeProduct.owner.location.address}
                    </span>
                  )}
                </div>

                {/* Contact actions */}
                <div className="flex flex-col gap-2.5">
                  {safeProduct.owner.contact?.email && (
                    <a
                      href={`mailto:${safeProduct.owner.contact.email}`}
                      className="w-full bg-[#161823] hover:bg-[#2a2b35] text-white font-bold py-2.5 text-[13px] rounded-sm transition-colors flex justify-center items-center gap-2 no-underline tracking-tight"
                    >
                      <MessageCircle size={15} />
                      Chat Now
                    </a>
                  )}
                  <a
                    href={`https://${safeProduct.owner.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border border-[#E3E3E4] hover:border-[#161823] hover:bg-[#F8F8F8] text-[#161823] font-bold py-2.5 text-[13px] rounded-sm transition-colors flex justify-center items-center gap-2 no-underline tracking-tight"
                  >
                    <Store size={15} />
                    Visit Store
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* PROTECTION */}
          <div className="p-6 bg-[#F8F8F8]">
            <div className="flex justify-between items-center cursor-pointer group mb-4">
              <span className="font-bold text-[13px] text-[#161823] group-hover:text-[#FE2C55] transition-colors">Platform order protection</span>
              <ChevronRight size={16} className="text-[#8A8B91] group-hover:text-[#FE2C55] transition-colors" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#161823] mb-1">
                  <ShieldCheck size={14} className="text-[#05C168]" /> Secure payments
                </div>
                <p className="text-[11px] text-[#8A8B91] font-medium pl-5 leading-tight">Every payment is secured with strict SSL encryption and PCI DSS data protection protocols</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#161823] mb-1">
                  <Shield size={14} className="text-[#05C168]" /> Money-back protection
                </div>
                <p className="text-[11px] text-[#8A8B91] font-medium pl-5 leading-tight">Claim a refund if your order doesn't ship, is missing, or arrives with product issues.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}