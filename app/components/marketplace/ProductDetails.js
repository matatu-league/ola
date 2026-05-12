"use client";

import React, { useState } from 'react';
import { 
  ChevronRight, Star, Heart, Share2, Search, 
  MessageCircle, ShieldCheck, ChevronLeft, Check, 
  Shield, ThumbsUp
} from 'lucide-react';

export default function ProductDetails({ product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('Attributes');
  
  // Provide robust fallbacks 
  const safeProduct = product || {
    title: "Placeholder Product",
    price: "0",
    images: [],
    breadcrumbs: ['Home', 'Products'],
    variants: [],
    reviewStats: { average: 5, total: 0 },
    owner: null,
    recommendations: [],
    attributes: [],
    reviews: []
  };

  // Create an array of all images (primary + gallery) and remove duplicates
  const allImages = Array.from(new Set([safeProduct.image, ...(safeProduct.images || [])].filter(Boolean)));
  if (allImages.length === 0) {
      allImages.push('/placeholder.png'); // Fallback if no images
  }
  
  // Safe image index check
  const currentImage = allImages[activeImage] || allImages[0];
  
  const initialVariants = {};
  if (safeProduct.variants && safeProduct.variants.length > 0) {
    initialVariants['Selection'] = safeProduct.variants[0].name;
  }
  const [selectedVariants, setSelectedVariants] = useState(initialVariants);

  const tabs = ['Service', 'Attributes', 'Reviews', 'Supplier', 'Description'];

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-[#333]">
      
      {/* ========================================== */}
      {/* BREADCRUMBS                                */}
      {/* ========================================== */}
      <div className="max-w-[1400px] mx-auto pt-4 pb-4 px-4 text-[12px] text-[#666] flex items-center gap-2 flex-wrap">
        {safeProduct.breadcrumbs?.map((crumb, i) => (
          <React.Fragment key={i}>
            <span className={`hover:text-[#ff6a00] cursor-pointer transition-colors ${i === safeProduct.breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}`}>
              {crumb}
            </span>
            {i < safeProduct.breadcrumbs.length - 1 && <ChevronRight size={12} className="text-[#999]" />}
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 flex flex-col lg:flex-row gap-4">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: Main Content                  */}
        {/* ========================================== */}
        <div className="flex-1 w-full lg:w-0">
          
          {/* Header Info */}
          <div className="bg-white p-5 rounded-lg mb-4 border border-[#e5e5e5]">
            <h1 className="text-[18px] md:text-[20px] font-bold leading-snug mb-3 text-gray-900">{safeProduct.title}</h1>
            
            <div className="flex items-center flex-wrap gap-y-2 text-[12px] mb-4">
              <div className="flex items-center text-[#ff6a00] mr-4">
                <span className="font-bold mr-1">{safeProduct.reviewStats?.average?.toFixed(1) || '5.0'}</span>
                <div className="flex mr-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      fill={i < Math.round(safeProduct.reviewStats?.average || 5) ? "currentColor" : "none"} 
                      stroke="currentColor" 
                    />
                  ))}
                </div>
                <span className="text-[#666] hover:underline cursor-pointer">
                  ({safeProduct.reviewStats?.total || 0} reviews)
                </span>
              </div>
              <div className="text-[#666] mr-4">{safeProduct.sold || 0}+ orders</div>
              <div className="flex items-center text-[#666]">
                <ShieldCheck size={14} className="text-[#008a00] mr-1" />
                Complies with platform standards
              </div>
            </div>

            {/* Store Badge Row */}
            {safeProduct.owner && (
              <div className="flex items-center flex-wrap gap-2 text-[12px] p-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-sm">
                <span className="text-[#ff6a00] font-bold mr-2">Premium Merchant</span>
                <a href={`/store/${safeProduct.owner.domain || safeProduct.owner._id}`} className="font-semibold text-gray-900 hover:underline cursor-pointer flex items-center gap-1.5 no-underline">
                  {safeProduct.owner.logo ? (
                    <img src={safeProduct.owner.logo} alt={safeProduct.owner.title || 'Store'} className="w-5 h-5 rounded-full object-cover border border-[#e5e5e5]" />
                  ) : (
                    <StoreIcon /> 
                  )}
                  {safeProduct.owner.title || 'Supplier Store'}
                </a>
                {safeProduct.owner.verified && (
                  <span className="flex items-center text-[#0066cc] bg-[#e5f0ff] px-1.5 rounded-sm font-semibold">
                    <Check size={10} className="mr-1"/> Verified
                  </span>
                )}
                {safeProduct.owner.years && (
                  <span className="text-[#666] border-l border-[#ccc] pl-2">{safeProduct.owner.years} yrs</span>
                )}
                {safeProduct.owner.location?.address && (
                  <span className="text-[#666] border-l border-[#ccc] pl-2 flex items-center gap-1 truncate max-w-[200px]">
                    📍 {safeProduct.owner.location.address}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Image Gallery */}
          <div className="bg-white p-5 rounded-lg mb-4 flex flex-col md:flex-row gap-4 relative border border-[#e5e5e5]">
             <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible w-full md:w-[60px] shrink-0 hide-scrollbar">
               {allImages.map((img, i) => (
                 <div 
                   key={i} 
                   onClick={() => setActiveImage(i)}
                   className={`w-[60px] h-[60px] rounded-sm border-2 cursor-pointer overflow-hidden shrink-0 transition-all ${activeImage === i ? 'border-[#ff6a00]' : 'border-transparent hover:border-[#ccc]'}`}
                 >
                   <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`}/>
                 </div>
               ))}
             </div>
             
             <div className="flex-1 bg-[#f8f8f8] relative rounded-md overflow-hidden aspect-square flex items-center justify-center group">
                <img src={currentImage} className="max-w-full max-h-full object-contain" alt="Main Product" />
                
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button className="w-9 h-9 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center text-[#666] hover:text-[#ff6a00] transition"><Heart size={18} /></button>
                  <button className="w-9 h-9 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center text-[#666] hover:text-[#ff6a00] transition"><Share2 size={18} /></button>
                  <button className="w-9 h-9 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center text-[#666] hover:text-[#ff6a00] transition"><Search size={18} /></button>
                </div>

                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 border border-[#e5e5e5] rounded-full flex items-center justify-center text-[#333] opacity-0 group-hover:opacity-100 transition-opacity"
                    ><ChevronLeft size={20}/></button>
                    <button 
                      onClick={() => setActiveImage(prev => prev < allImages.length - 1 ? prev + 1 : 0)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 border border-[#e5e5e5] rounded-full flex items-center justify-center text-[#333] opacity-0 group-hover:opacity-100 transition-opacity"
                    ><ChevronRight size={20}/></button>
                  </>
                )}
             </div>
          </div>

          {/* Dynamic Recommendations */}
          {safeProduct.recommendations && safeProduct.recommendations.length > 0 && (
            <div className="bg-white p-5 rounded-lg mb-4 border border-[#e5e5e5]">
              <h3 className="font-bold text-[14px] mb-4 text-gray-900">Other recommendations for your business</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {safeProduct.recommendations.map((rec, i) => (
                  <a href={`/product/${rec._id}`} key={i} className="w-[180px] shrink-0 cursor-pointer group block border border-transparent hover:border-gray-200 p-2 rounded-md transition-all no-underline">
                    <div className="w-full aspect-square bg-[#f8f8f8] rounded-sm overflow-hidden mb-2 p-2 flex items-center justify-center border border-[#e5e5e5]">
                      <img src={rec.image || '/placeholder.png'} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" alt={rec.title}/>
                    </div>
                    <h4 className="text-[12px] text-[#333] line-clamp-2 leading-tight mb-1 group-hover:text-[#ff6a00] font-medium">{rec.title}</h4>
                    <div className="font-bold text-[14px] text-gray-900">USh {Number(rec.price).toLocaleString()}</div>
                    <div className="text-[12px] text-[#999]">MOQ: {rec.moq || '1'}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* TABS NAVIGATION */}
          <div className="bg-white rounded-lg overflow-hidden border border-[#e5e5e5] mb-8 sticky top-[64px] z-40">
            <div className="flex border-b border-[#e5e5e5] overflow-x-auto hide-scrollbar bg-white px-2">
              {tabs.map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-[#666] hover:text-gray-900'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              
              {/* TAB CONTENT: Attributes */}
              <div className={activeTab === 'Attributes' ? 'block' : 'hidden'}>
                <h3 className="font-bold text-[16px] mb-4 text-gray-900">Key attributes</h3>
                
                {safeProduct.attributes && safeProduct.attributes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#e5e5e5] text-[13px]">
                    {safeProduct.attributes.map((attr, i) => (
                      <div key={i} className="flex border-b border-r border-[#e5e5e5]">
                        <div className="w-[40%] bg-[#f8f8f8] p-3 text-[#666] font-medium flex items-center">{attr.name}</div>
                        <div className="w-[60%] bg-white p-3 text-gray-900 flex items-center">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#666] text-sm">No specific attributes listed.</p>
                )}

                {safeProduct.packaging && (
                  <>
                    <h3 className="font-bold text-[16px] mt-8 mb-4 text-gray-900">Packaging and delivery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#e5e5e5] text-[13px]">
                       <div className="flex border-b border-r border-[#e5e5e5]">
                          <div className="w-[40%] bg-[#f8f8f8] p-3 text-[#666]">Selling Units:</div>
                          <div className="w-[60%] bg-white p-3">{safeProduct.packaging.sellingUnits || '-'}</div>
                       </div>
                       <div className="flex border-b border-r border-[#e5e5e5]">
                          <div className="w-[40%] bg-[#f8f8f8] p-3 text-[#666]">Package size:</div>
                          <div className="w-[60%] bg-white p-3">{safeProduct.packaging.singlePackageSize || '-'}</div>
                       </div>
                       <div className="flex border-b border-r border-[#e5e5e5]">
                          <div className="w-[40%] bg-[#f8f8f8] p-3 text-[#666]">Gross weight:</div>
                          <div className="w-[60%] bg-white p-3">{safeProduct.packaging.singleGrossWeight || '-'}</div>
                       </div>
                    </div>
                  </>
                )}
              </div>

              {/* TAB CONTENT: Reviews */}
              <div className={activeTab === 'Reviews' ? 'block' : 'hidden'}>
                 <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-[#e5e5e5]">
                    {/* Overall Score */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                       <div className="text-[48px] font-bold text-gray-900 leading-none mb-2">
                         {safeProduct.reviewStats?.average?.toFixed(1) || '5.0'}
                       </div>
                       <div className="flex mb-1 text-[#ff6a00]">
                         {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              fill={i < Math.round(safeProduct.reviewStats?.average || 5) ? "currentColor" : "none"} 
                              stroke="currentColor" 
                            />
                         ))}
                       </div>
                       <div className="text-[12px] text-[#666]">Overall Rating</div>
                       <div className="text-[12px] text-[#999] mt-1">Based on {safeProduct.reviewStats?.total || 0} reviews</div>
                    </div>
                 </div>

                 {/* Reviews List */}
                 <div className="space-y-6">
                    {!safeProduct.reviews || safeProduct.reviews.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">There are no reviews for this product yet.</p>
                    ) : (
                      safeProduct.reviews.map((review, i) => (
                        <div key={i} className="flex gap-4 border-b border-[#f0f0f0] pb-6 last:border-0">
                           <div className="w-10 shrink-0 flex flex-col items-center text-center">
                              <div className="w-8 h-8 rounded-full bg-[#ff6a00] text-white flex items-center justify-center font-bold text-[14px] mb-1">
                                 {review.reviewerName?.charAt(0) || 'U'}
                              </div>
                              <span className="text-[10px] text-[#999] break-all">{review.reviewerName || 'User'}</span>
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                   <div className="flex text-[#ff6a00]">
                                     {[...Array(review.rating)].map((_, idx) => <Star key={idx} size={12} fill="currentColor" stroke="none" />)}
                                   </div>
                                   {review.reviewerCountry && (
                                     <span className="text-[12px] text-[#666] flex items-center gap-1">
                                        <span className="text-[10px]">{review.reviewerFlag || '🌍'}</span> {review.reviewerCountry}
                                     </span>
                                   )}
                                 </div>
                                 <span className="text-[12px] text-[#999]">
                                   {new Date(review.createdAt).toLocaleDateString()}
                                 </span>
                              </div>
                              <p className="text-[13px] text-[#333] leading-relaxed mb-3">{review.comment}</p>
                              
                              {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 mb-3">
                                  {review.images.map((img, idx) => (
                                    <img key={idx} src={img} className="w-16 h-16 object-cover rounded border border-[#e5e5e5] cursor-pointer hover:opacity-90" alt="Review"/>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-[12px] text-[#999]">
                                 <button className="flex items-center gap-1 hover:text-[#ff6a00] transition-colors"><ThumbsUp size={14}/> Helpful ({review.helpfulCount || 0})</button>
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              {/* Placeholder for other tabs */}
              {['Service', 'Supplier', 'Description'].includes(activeTab) && (
                 <div className="py-10 text-center text-[#999] text-[14px]">
                    {safeProduct.description || `Detailed ${activeTab.toLowerCase()} information goes here.`}
                 </div>
              )}

            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: Sticky Sidebar               */}
        {/* ========================================== */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-[#e5e5e5] lg:sticky lg:top-[86px]">
            
            <div className="text-[12px] text-[#666] mb-1 font-bold tracking-wider uppercase">Wholesale Price</div>
            <div className="text-[28px] font-extrabold text-gray-900 mb-6">
              USh {Number(safeProduct.price).toLocaleString()}
            </div>

            {/* Dynamic Variants */}
            {safeProduct.hasVariants && safeProduct.variants && safeProduct.variants.length > 0 && (
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-gray-900">Selections</span>
                  <span className="text-[#0066cc] font-medium">{safeProduct.variants.length} Options</span>
                </div>
                
                <div>
                  <div className="flex flex-wrap gap-2">
                    {safeProduct.variants.map((variant, i) => (
                      <button 
                        key={i}
                        onClick={() => setSelectedVariants({ Selection: variant.name })}
                        className={`px-3 py-1.5 text-[12px] border rounded-sm transition-all ${
                          selectedVariants['Selection'] === variant.name 
                            ? 'border-gray-900 text-gray-900 font-bold ring-1 ring-gray-900' 
                            : 'border-[#e5e5e5] text-[#666] hover:border-[#999]'
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Customization */}
            {safeProduct.customization && safeProduct.customization.length > 0 && (
              <div className="mb-6 pt-4 border-t border-[#f0f0f0]">
                 <div className="flex items-center gap-1 text-[13px] font-bold mb-3 text-gray-900">
                   Supplier's customization ability <ShieldCheck size={14} className="text-[#0066cc]"/>
                 </div>
                 <ul className="text-[12px] text-[#666] space-y-2">
                   {safeProduct.customization.map((item, i) => (
                     <li key={i} className="flex items-start gap-2">
                       <span className="w-1 h-1 rounded-full bg-[#ccc] mt-1.5 shrink-0"></span> {item}
                     </li>
                   ))}
                 </ul>
              </div>
            )}

            {/* Shipping */}
            {safeProduct.shipping && (
              <div className="mb-6 pt-4 border-t border-[#f0f0f0]">
                 <h4 className="text-[13px] font-bold mb-2 text-gray-900">Shipping</h4>
                 <p className="text-[12px] text-[#666] mb-2">{safeProduct.shipping.fee || 'To be negotiated'}</p>
                 <div className="bg-[#fff0e5] text-[#ff6a00] p-2 text-[12px] rounded-sm flex items-start gap-2 border border-[#ffe0cc]">
                    <MessageCircle size={14} className="shrink-0 mt-0.5"/>
                    {safeProduct.shipping.note || 'Chat with supplier for details.'}
                 </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 mb-6">
               <button className="w-full bg-[#ff6a00] hover:bg-[#e65c00] text-white font-bold py-2.5 rounded-full text-[14px] transition-colors flex justify-center items-center gap-2">
                  Send inquiry
               </button>
               {safeProduct.owner && (
                 <a 
                   href={`mailto:${safeProduct.owner.contact?.email}`}
                   className="w-full bg-white border border-[#e5e5e5] hover:bg-[#f8f8f8] text-gray-900 font-bold py-2.5 rounded-full text-[14px] transition-colors flex justify-center items-center gap-2 block text-center no-underline"
                 >
                    Chat now
                 </a>
               )}
            </div>

            {/* Protection */}
            <div className="pt-4 border-t border-[#f0f0f0]">
               <div className="flex justify-between items-center cursor-pointer group mb-4">
                  <span className="font-bold text-[13px] text-gray-900 group-hover:text-[#ff6a00] transition-colors">Platform order protection</span>
                  <ChevronRight size={16} className="text-[#999] group-hover:text-[#ff6a00]"/>
               </div>
               <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-900 mb-1">
                       <ShieldCheck size={14} className="text-[#008a00]"/> Secure payments
                    </div>
                    <p className="text-[11px] text-[#999] pl-5 leading-tight">Every payment is secured with strict SSL encryption and PCI DSS data protection protocols</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-900 mb-1">
                       <Shield size={14} className="text-[#008a00]"/> Money-back protection
                    </div>
                    <p className="text-[11px] text-[#999] pl-5 leading-tight">Claim a refund if your order doesn't ship, is missing, or arrives with product issues.</p>
                  </div>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Mini Icon for Store
function StoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#666]">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}