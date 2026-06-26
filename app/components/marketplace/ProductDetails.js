"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Star, Heart, Share2, Search,
  MessageCircle, ShieldCheck, ChevronLeft, Check,
  Truck, X, AlertCircle, Minus, Plus,
  ShoppingBag, ShoppingCart, MapPin, ExternalLink,
  Package, Clock, Play, Volume2
} from 'lucide-react';

import { useCart }              from '@/contexts/CartContext';
import ProductChatPopover      from '@/components/marketplace/MessagePopover';
import { useUser } from '@/contexts/UserContext';

export default function ProductDetails({ product }) {
  const router = useRouter();
  const { addToCart, openDrawer } = useCart();
  const { user } = useUser();

  // ── Image gallery ─────────────────────────────────────────────────────────
  const [activeImage, setActiveImage] = useState(0);
  const thumbnailRefs = useRef([]);

  const baseImages = [product.image, ...(product.images || [])].filter(Boolean);
  const variantImages = (product.variants || []).map(v => v.image).filter(Boolean);
  const allImages = Array.from(new Set([...baseImages, ...variantImages]));
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&fit=crop');
  }
  const currentImage = allImages[activeImage] || allImages[0];

  useEffect(() => {
    thumbnailRefs.current[activeImage]?.scrollIntoView({
      behavior: 'smooth', block: 'nearest', inline: 'center',
    });
  }, [activeImage]);

  // ── Tabs (static – no Video/Audio tabs) ──────────────────────────────────
  const TABS = ['Attributes', 'Description', 'Reviews', 'Shipping', 'Supplier'];
  const [activeTab, setActiveTab] = useState('Attributes');

  // ── Media modals ─────────────────────────────────────────────────────────
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const hasVideo = !!product.videoDescription;
  const hasAudio = !!product.audioDescription;

  // ── Variants ──────────────────────────────────────────────────────────────
  const groupedVariants = useMemo(() => {
    return (product.variants || []).reduce((acc, v) => {
      const t = v.type || 'Selection';
      if (!acc[t]) acc[t] = [];
      acc[t].push(v);
      return acc;
    }, {});
  }, [product.variants]);

  const [selectedVariants, setSelectedVariants] = useState({});

  const handleVariantSelect = (type, variant) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variant.name }));
    setModalError('');
    if (variant.image) {
      const idx = allImages.indexOf(variant.image);
      if (idx !== -1) setActiveImage(idx);
    }
  };

  // ── Quantity ──────────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const maxStock = product.stock || 999;

  // ── Variant selection popover ─────────────────────────────────────────────
  const popoverRef    = useRef(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalError, setModalError]       = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPopoverOpen]);

  const getMissingVariants = () =>
    Object.keys(groupedVariants).filter(t => !selectedVariants[t]);

  const handleActionClick = (actionType) => {
    const missing = getMissingVariants();
    if (missing.length > 0) {
      setPendingAction(actionType);
      setIsPopoverOpen(true);
      return;
    }
    executeAction(actionType);
  };

  const executeAction = (actionType) => {
    addToCart(product, quantity, selectedVariants);
    setIsPopoverOpen(false);
    if (actionType === 'cart') {
      openDrawer();
    } else {
      router.push('/checkout');
    }
  };

  const handlePopoverConfirm = () => {
    const missing = getMissingVariants();
    if (missing.length > 0) {
      setModalError(`Please select: ${missing.join(', ')}`);
      return;
    }
    setModalError('');
    executeAction(pendingAction);
  };

  // ── Store data ────────────────────────────────────────────────────────────
  const store = product.store;
  const storeUrl = store?.domain ? `https://${store.domain}` : null;

  // ── Price formatting ──────────────────────────────────────────────────────
  const price = Number(product.price) || 0;

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-[#161823]">

      {/* Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto pt-4 pb-3 px-4 text-[12px] text-[#8A8B91] flex items-center gap-1.5 flex-wrap font-medium">
        <Link href="/" className="hover:text-[#FE2C55] transition-colors">Home</Link>
        {(product.breadcrumbs || []).slice(1).map((crumb, i, arr) => (
          <React.Fragment key={i}>
            <ChevronRight size={11} className="text-[#C5C5C8]" />
            {i < arr.length - 1 ? (
              <Link
                href={`/?category=${crumb.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-[#FE2C55] transition-colors capitalize"
              >
                {crumb}
              </Link>
            ) : (
              <span className="text-[#161823] font-semibold line-clamp-1 max-w-[200px]">{crumb}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 flex flex-col lg:flex-row items-start gap-4">

        {/* ══════════════ LEFT COLUMN ══════════════ */}
        <div className="flex-1 w-full lg:w-0 bg-white border border-[#E3E3E4] rounded-sm overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-[#E3E3E4]">
            <h1 className="text-[20px] md:text-[22px] font-bold leading-snug mb-3 text-[#161823] tracking-tight">
              {product.title}
            </h1>
            <div className="flex items-center flex-wrap gap-y-2 gap-x-4 text-[13px] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#161823]">
                  {product.reviewStats?.average?.toFixed(1) || '5.0'}
                </span>
                <div className="flex text-[#F5C400]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill={i < Math.round(product.reviewStats?.average || 5) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('Reviews')}
                  className="text-[#8A8B91] hover:text-[#161823] hover:underline transition-colors"
                >
                  ({product.reviewStats?.total || 0} reviews)
                </button>
              </div>
              <span className="text-[#8A8B91]">{product.sold || 0}+ sold</span>
              <div className="flex items-center gap-1 text-[#8A8B91]">
                <ShieldCheck size={14} className="text-[#05C168]" />
                Trusted product
              </div>
            </div>
          </div>

          {/* Image gallery with embedded video/audio previews */}
          <div className="p-6 flex flex-col md:flex-row gap-5 border-b border-[#E3E3E4]">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full md:w-[68px] shrink-0 hide-scrollbar md:max-h-[440px]">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  ref={el => (thumbnailRefs.current[i] = el)}
                  onClick={() => setActiveImage(i)}
                  className={`w-[68px] h-[68px] border shrink-0 overflow-hidden rounded-sm transition-all
                    ${activeImage === i
                      ? 'border-[#161823] ring-1 ring-[#161823]'
                      : 'border-[#E3E3E4] hover:border-[#8A8B91]'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>

            {/* Main image area */}
            <div className="flex-1 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm relative overflow-hidden flex items-center justify-center group h-[340px] md:h-[440px]">
              <img
                src={currentImage}
                className="max-w-full max-h-full object-contain mix-blend-multiply"
                alt={product.title}
              />

              {/* Top-right action buttons */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {[
                  { Icon: Heart,  label: 'Wishlist' },
                  { Icon: Share2, label: 'Share'    },
                  { Icon: Search, label: 'Zoom'     },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-9 h-9 bg-white border border-[#E3E3E4] flex items-center justify-center text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] transition-all rounded-full shadow-sm"
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>

              {/* Navigation arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(p => p > 0 ? p - 1 : allImages.length - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border border-[#E3E3E4] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImage(p => p < allImages.length - 1 ? p + 1 : 0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 border border-[#E3E3E4] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {activeImage + 1} / {allImages.length}
              </div>

              {/* ── Video & Audio Preview Segments (bottom bar) ────────── */}
              {(hasVideo || hasAudio) && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  {hasVideo && (
                    <button
                      onClick={() => setVideoModalOpen(true)}
                      className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#E3E3E4] text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] font-medium text-[12px] px-3 py-1.5 rounded-full shadow-sm transition-colors"
                    >
                      <Play size={14} className="fill-current" /> Video
                    </button>
                  )}
                  {hasAudio && (
                    <button
                      onClick={() => setAudioModalOpen(true)}
                      className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#E3E3E4] text-[#161823] hover:text-[#FE2C55] hover:border-[#FE2C55] font-medium text-[12px] px-3 py-1.5 rounded-full shadow-sm transition-colors"
                    >
                      <Volume2 size={14} /> Audio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div>
            <div className="flex border-b border-[#E3E3E4] overflow-x-auto hide-scrollbar px-2 bg-white">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3.5 text-[13px] font-bold whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === tab
                      ? 'border-[#161823] text-[#161823]'
                      : 'border-transparent text-[#8A8B91] hover:text-[#161823]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* Attributes */}
              {activeTab === 'Attributes' && (
                <div>
                  <h3 className="font-bold text-[15px] mb-4 text-[#161823] flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#FE2C55] rounded-sm" />
                    Key Attributes
                  </h3>
                  {product.attributes?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#E3E3E4] rounded-sm overflow-hidden text-[13px]">
                      {product.attributes.map((attr, i) => (
                        <div key={i} className="flex border-b border-r border-[#E3E3E4]">
                          <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold">{attr.name}</div>
                          <div className="w-[60%] bg-white p-3 text-[#161823] font-medium">{attr.value}</div>
                        </div>
                      ))}
                      {product.packaging?.sellingUnits && (
                        <div className="flex border-b border-r border-[#E3E3E4]">
                          <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold">Selling Unit</div>
                          <div className="w-[60%] bg-white p-3 text-[#161823] font-medium">{product.packaging.sellingUnits}</div>
                        </div>
                      )}
                      {product.packaging?.packageSize && (
                        <div className="flex border-b border-r border-[#E3E3E4]">
                          <div className="w-[40%] bg-[#F8F8F8] p-3 text-[#8A8B91] font-semibold">Package Size</div>
                          <div className="w-[60%] bg-white p-3 text-[#161823] font-medium">{product.packaging.packageSize}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[#8A8B91] text-[13px]">No attributes listed.</p>
                  )}
                </div>
              )}

              {/* Description */}
              {activeTab === 'Description' && (
                <div>
                  <h3 className="font-bold text-[15px] mb-4 text-[#161823] flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#FE2C55] rounded-sm" />
                    Product Description
                  </h3>
                  <p className="text-[13px] text-[#161823] leading-relaxed whitespace-pre-line">
                    {product.description || 'No description provided.'}
                  </p>
                </div>
              )}

              {/* Reviews */}
              {activeTab === 'Reviews' && (
                <div>
                  <h3 className="font-bold text-[15px] mb-5 text-[#161823] flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#FE2C55] rounded-sm" />
                    Customer Reviews
                  </h3>
                  <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#E3E3E4]">
                    <div className="text-center">
                      <div className="text-[48px] font-extrabold text-[#161823] leading-none mb-1">
                        {product.reviewStats?.average?.toFixed(1) || '5.0'}
                      </div>
                      <div className="flex justify-center mb-1 text-[#F5C400]">
                        {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" stroke="currentColor" />)}
                      </div>
                      <div className="text-[11px] text-[#8A8B91]">{product.reviewStats?.total || 0} reviews</div>
                    </div>
                  </div>
                  {product.reviews?.length > 0 ? (
                    <div className="space-y-4">
                      {product.reviews.map((review, i) => (
                        <div key={i} className="border border-[#E3E3E4] rounded-sm p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-[#F5C400]">
                              {[...Array(5)].map((_, j) => (
                                <Star key={j} size={12} fill={j < review.rating ? 'currentColor' : 'none'} stroke="currentColor" />
                              ))}
                            </div>
                            <span className="text-[12px] font-bold text-[#161823]">{review.reviewerName}</span>
                            {review.reviewerCountry && (
                              <span className="text-[11px] text-[#8A8B91]">{review.reviewerFlag} {review.reviewerCountry}</span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#161823]">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[#8A8B91]">No reviews yet. Be the first!</p>
                  )}
                </div>
              )}

              {/* Shipping */}
              {activeTab === 'Shipping' && (
                <div>
                  <h3 className="font-bold text-[15px] mb-4 text-[#161823] flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#FE2C55] rounded-sm" />
                    Shipping Information
                  </h3>
                  <div className="space-y-3 text-[13px]">
                    <div className="flex items-start gap-3 p-3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm">
                      <Truck size={15} className="text-[#FE2C55] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-[#161823] mb-0.5">Shipping Fee</p>
                        <p className="text-[#8A8B91]">{product.shipping?.fee || 'To be negotiated'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm">
                      <Clock size={15} className="text-[#FE2C55] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-[#161823] mb-0.5">Delivery Note</p>
                        <p className="text-[#8A8B91]">{product.shipping?.note || 'Chat with supplier for details.'}</p>
                      </div>
                    </div>
                    {store?.location?.address && (
                      <div className="flex items-start gap-3 p-3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm">
                        <MapPin size={15} className="text-[#FE2C55] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-[#161823] mb-0.5">Ships From</p>
                          <p className="text-[#8A8B91]">{store.location.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Supplier */}
              {activeTab === 'Supplier' && store && (
                <div>
                  <h3 className="font-bold text-[15px] mb-4 text-[#161823] flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#FE2C55] rounded-sm" />
                    Supplier Information
                  </h3>
                  <div className="flex items-start gap-4 p-4 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm mb-4">
                    {store.logo && (
                      <img src={store.logo} alt={store.title} className="w-14 h-14 rounded-sm object-cover border border-[#E3E3E4] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[14px] text-[#161823]">{store.title}</span>
                        {store.verified && (
                          <Check size={11} strokeWidth={3} className="text-white bg-[#05C168] p-0.5 rounded-full shrink-0" />
                        )}
                      </div>
                      {store.location?.address && (
                        <p className="text-[12px] text-[#8A8B91] flex items-center gap-1">
                          <MapPin size={11} /> {store.location.address}
                        </p>
                      )}
                      <div className="flex gap-3 mt-1 text-[12px] text-[#8A8B91]">
                        {store.years && <span>{store.years} yrs in business</span>}
                        {store.rating && (
                          <span className="flex items-center gap-0.5">
                            <Star size={11} fill="currentColor" className="text-[#F5C400]" /> {store.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ProductChatPopover
                      product={product}
                      sellerId={product.userId?._id || product.userId}
                    />
                    {storeUrl && (
                      <Link
                        href={storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 border border-[#E3E3E4] hover:border-[#161823] text-[#161823] text-[13px] font-semibold rounded-sm transition-colors"
                      >
                        <ExternalLink size={13} /> Visit Store
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════ RIGHT COLUMN ══════════════ */}
        <div className="w-full lg:w-[440px] shrink-0 bg-white border border-[#E3E3E4] rounded-sm lg:sticky lg:top-4 z-[60]">

          {/* Price + variants + actions */}
          <div className="p-5 border-b border-[#E3E3E4]">
            <p className="text-[11px] text-[#FE2C55] font-bold uppercase tracking-wide mb-1">Wholesale Price</p>
            <div className="text-[30px] font-extrabold text-[#161823] mb-1 tracking-tight leading-none">
              UGX {price.toLocaleString()}
            </div>
            {product.moq && product.moq !== '1' && (
              <p className="text-[12px] text-[#8A8B91] mb-4">Min. order: {product.moq} pieces</p>
            )}

            {/* Variants */}
            {Object.keys(groupedVariants).length > 0 && (
              <div className="mb-5 space-y-5">
                {Object.entries(groupedVariants).map(([type, options]) => (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[13px] font-bold text-[#161823]">{type}</span>
                      <span className="text-[11px] text-[#8A8B91]">{options.length} options</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {options.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => handleVariantSelect(type, v)}
                          className={`flex items-center gap-2.5 p-1.5 pr-3.5 border rounded-sm transition-all text-[13px]
                            ${selectedVariants[type] === v.name
                              ? 'border-[#161823] ring-1 ring-[#161823] font-bold bg-white'
                              : 'border-[#E3E3E4] font-medium hover:border-[#161823] bg-[#F8F8F8]'}`}
                        >
                          {v.image && (
                            <div className="w-11 h-11 shrink-0 bg-white border border-[#E3E3E4] rounded-sm overflow-hidden">
                              <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <span className="block font-bold text-[#161823] text-[13px] mb-2">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#E3E3E4] rounded-sm overflow-hidden h-10 w-[120px] bg-white focus-within:border-[#161823] transition-colors">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-full flex items-center justify-center hover:bg-[#F8F8F8] transition-colors disabled:opacity-40"
                  >
                    <Minus size={15} strokeWidth={2} />
                  </button>
                  <span className="flex-1 text-center text-[#161823] font-bold text-[14px] border-x border-[#E3E3E4]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className="w-10 h-full flex items-center justify-center hover:bg-[#F8F8F8] transition-colors disabled:opacity-40"
                  >
                    <Plus size={15} strokeWidth={2} />
                  </button>
                </div>
                <span className="text-[12px] text-[#8A8B91] flex items-center gap-1">
                  <Package size={12} /> {maxStock} available
                </span>
              </div>
            </div>

            {/* Action buttons + variant popover */}
            <div className="relative" ref={popoverRef}>
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleActionClick('cart')}
                  className="flex-1 bg-white border-2 border-[#FE2C55] text-[#FE2C55] hover:bg-[#FFF0F3] font-bold py-2.5 text-[13px] rounded-sm transition-colors flex justify-center items-center gap-1.5 tracking-tight"
                >
                  <ShoppingCart size={15} /> Add to Cart
                </button>
                <button
                  onClick={() => handleActionClick('buy')}
                  className="flex-1 bg-[#FE2C55] hover:bg-[#e0264b] text-white font-bold py-2.5 text-[13px] rounded-sm transition-colors flex justify-center items-center gap-1.5 tracking-tight"
                >
                  <ShoppingBag size={15} /> Buy Now
                </button>
              </div>

              {/* Variant selection popover */}
              {isPopoverOpen && (
                <div
                  className="absolute top-full left-0 mt-3 w-full bg-white rounded-sm shadow-xl border border-[#E3E3E4] z-[100]"
                  style={{ animation: 'popoverFadeIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}
                >
                  <div className="absolute -top-[7px] left-10 w-3.5 h-3.5 bg-white border-t border-l border-[#E3E3E4] rotate-45" />
                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#E3E3E4]">
                      <h4 className="text-[13px] font-bold text-[#161823] flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-[#FE2C55]" />
                        Select options to continue
                      </h4>
                      <button
                        onClick={() => setIsPopoverOpen(false)}
                        className="text-[#8A8B91] hover:text-[#161823] transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar pr-1 mb-3 space-y-4">
                      {Object.entries(groupedVariants).map(([type, options]) => (
                        <div key={type}>
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-[#FE2C55] font-bold text-[12px]">*</span>
                            <span className="text-[12px] text-[#161823] font-bold">{type}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {options.map((v, i) => (
                              <button
                                key={i}
                                onClick={() => handleVariantSelect(type, v)}
                                className={`px-3 py-1.5 text-[12px] rounded-sm border transition-all font-medium
                                  ${selectedVariants[type] === v.name
                                    ? 'border-[#FE2C55] text-[#FE2C55] bg-[#FFF0F3] ring-1 ring-[#FE2C55]'
                                    : 'border-[#E3E3E4] text-[#161823] bg-[#F8F8F8] hover:border-[#161823]'}`}
                              >
                                {v.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {modalError && (
                      <p className="text-[11px] text-[#FE2C55] mb-2.5 bg-[#FFF0F3] border border-[#FE2C55]/30 p-2 rounded-sm font-medium">
                        {modalError}
                      </p>
                    )}

                    <button
                      onClick={handlePopoverConfirm}
                      className="w-full py-2.5 rounded-sm text-[13px] font-bold text-white bg-[#FE2C55] hover:bg-[#e0264b] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check size={13} /> Confirm & Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping note */}
          <div className="px-5 py-4 border-b border-[#E3E3E4]">
            <div className="flex items-start gap-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-3 text-[12px]">
              <Truck size={13} className="text-[#FE2C55] shrink-0 mt-0.5" />
              <span className="text-[#8A8B91]">
                {product.shipping?.note || 'Chat with supplier for shipping details.'}
              </span>
            </div>
          </div>

          {/* Store card */}
          {store && (
            <div className="rounded-b-sm overflow-hidden">
              {/* Banner */}
              <div className="relative h-[80px] bg-[#F8F8F8]">
                {store.banner && (
                  <img
                    src={store.banner}
                    className="w-full h-full object-cover"
                    alt={`${store.title} banner`}
                  />
                )}
                {/* Logo */}
                <div className="absolute -bottom-5 left-4 w-[48px] h-[48px] bg-white border-2 border-white rounded-sm shadow-md overflow-hidden">
                  {store.logo
                    ? <img src={store.logo} className="w-full h-full object-cover" alt={store.title} />
                    : <div className="w-full h-full bg-[#161823] flex items-center justify-center text-white text-[14px] font-bold">
                        {store.title?.slice(0, 2).toUpperCase()}
                      </div>
                  }
                </div>
              </div>

              <div className="pt-8 px-4 pb-4">
                {/* Store name + verified */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[14px] text-[#161823]">{store.title || 'Independent Seller'}</span>
                  {store.verified && (
                    <Check size={11} strokeWidth={3} className="text-white bg-[#05C168] p-0.5 rounded-full shrink-0" />
                  )}
                </div>

                {/* Store meta */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-4 text-[11px] text-[#8A8B91]">
                  {store.years && <span>{store.years} yrs</span>}
                  {store.rating && (
                    <span className="flex items-center gap-0.5">
                      <Star size={10} fill="currentColor" className="text-[#F5C400]" /> {store.rating}
                    </span>
                  )}
                  {store.location?.address && (
                    <span className="flex items-center gap-0.5">
                      <MapPin size={10} /> {store.location.address}
                    </span>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="flex gap-2">
                  <ProductChatPopover
                    product={product}
                    sellerId={product.userId?._id || product.userId}
                  />
                  {storeUrl && (
                    <Link
                      href={storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 border border-[#E3E3E4] hover:border-[#161823] text-[#161823] text-[12px] font-semibold rounded-sm transition-colors"
                    >
                      <ExternalLink size={12} /> Visit Store
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {product.recommendations?.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 mt-8">
          <h2 className="text-[17px] font-bold text-[#161823] mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#FE2C55] rounded-sm" />
            Similar Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {product.recommendations.map(rec => (
              <Link
                key={rec._id}
                href={`/products/${rec._id}`}
                className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden hover:border-[#161823] hover:shadow-sm transition-all group"
              >
                <div className="aspect-square bg-[#F8F8F8] overflow-hidden">
                  <img
                    src={rec.image || rec.images?.[0]}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-[#161823] line-clamp-2 leading-tight mb-1">{rec.title}</p>
                  <p className="text-[12px] font-bold text-[#FE2C55]">UGX {Number(rec.price).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Video Modal ────────────────────────────────────────────────────── */}
      {videoModalOpen && hasVideo && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-sm shadow-2xl max-w-4xl w-full p-4">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-[#E3E3E4] rounded-full text-[#161823] hover:text-[#FE2C55] z-10"
            >
              <X size={18} />
            </button>
            <video
              controls
              autoPlay
              className="w-full rounded-sm"
              poster={product.image || allImages[0]}
              style={{ maxHeight: '70vh' }}
            >
              <source src={product.videoDescription} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* ── Audio Modal ────────────────────────────────────────────────────── */}
      {audioModalOpen && hasAudio && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-sm shadow-2xl max-w-md w-full p-6 text-center">
            <button
              onClick={() => setAudioModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-[#E3E3E4] rounded-full text-[#161823] hover:text-[#FE2C55] z-10"
            >
              <X size={18} />
            </button>
            <Volume2 size={40} className="text-[#FE2C55] mx-auto mb-4" />
            <h4 className="font-bold text-[16px] mb-4">Audio Description</h4>
            <audio controls autoPlay className="w-full mb-2">
              <source src={product.audioDescription} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <p className="text-[12px] text-[#8A8B91]">
              You can listen to the product details.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popoverFadeIn {
          from { transform: translateY(-6px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F8F8F8; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
      `}</style>
    </div>
  );
}
