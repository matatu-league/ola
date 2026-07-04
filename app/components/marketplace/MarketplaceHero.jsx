"use client";

// Professional, hybrid landing hero — leads with BOTH products and services and
// gives shoppers immediate, working entry points (category quick-links + tab
// CTAs), replacing the previously very minimal top of the marketplace home.
import React, { useEffect, useState } from 'react';
import { ShoppingBag, CalendarCheck, Store as StoreIcon, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function MarketplaceHero({ onCategorySelect, onTabChange }) {
  const [categories, setCategories] = useState([]);
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/marketplace', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const json = await res.json();
        const data = json?.data || json;
        if (!alive) return;
        const cats = (data?.categories || []).filter(c => c?.name && (c?.slug || c?._id)).slice(0, 8);
        setCategories(cats);
        if (Array.isArray(data?.products)) setProductCount(data.products.length);
      } catch (_) { /* hero still renders without chips */ }
    })();
    return () => { alive = false; };
  }, []);

  const stats = [
    { icon: ShoppingBag,   label: productCount != null ? `${productCount.toLocaleString()}+ products` : 'Quality products' },
    { icon: CalendarCheck, label: 'Bookable services' },
    { icon: StoreIcon,     label: 'Local stores' },
    { icon: ShieldCheck,   label: 'Secure checkout' },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#161823] via-[#1d1f2b] to-[#3a0d1a]" />
      <div className="absolute -top-24 -right-24 -z-10 w-[420px] h-[420px] rounded-full bg-[#FE2C55]/25 blur-[120px]" />
      <div className="absolute -bottom-32 -left-24 -z-10 w-[420px] h-[420px] rounded-full bg-[#2563EB]/20 blur-[120px]" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14 md:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur">
            <Sparkles size={13} className="text-[#FFD166]" /> One marketplace · products &amp; services
          </span>

          <h1 className="mt-5 text-white font-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}>
            Shop anything. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FE2C55] to-[#ff7a90]">Book anyone.</span>
          </h1>
          <p className="mt-4 text-[15px] md:text-[17px] leading-relaxed text-white/70 max-w-2xl">
            Discover products and services from trusted local stores — from electronics and fashion to salons, catering and home services. Buy and book, all in one place, with secure checkout.
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onTabChange?.('Products')}
              className="inline-flex items-center gap-2 bg-[#FE2C55] hover:bg-[#e6284b] text-white font-bold text-[14px] px-5 py-3 rounded-xl transition-colors shadow-lg shadow-[#FE2C55]/25"
            >
              <ShoppingBag size={17} /> Shop products
            </button>
            <button
              onClick={() => onTabChange?.('Stores')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-[14px] px-5 py-3 rounded-xl transition-colors backdrop-blur"
            >
              <StoreIcon size={17} /> Explore stores <ArrowRight size={15} />
            </button>
          </div>

          {/* Category quick-links */}
          {categories.length > 0 && (
            <div className="mt-8">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-white/45 mb-3">Popular categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c._id || c.slug}
                    onClick={() => onCategorySelect?.(c.slug || c._id)}
                    className="rounded-full bg-white/8 hover:bg-white/15 border border-white/12 text-white/85 text-[13px] font-medium px-3.5 py-1.5 transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trust stats */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/6 border border-white/10 px-4 py-3 backdrop-blur">
              <s.icon size={18} className="text-[#FFD166] shrink-0" />
              <span className="text-[13px] font-semibold text-white/85">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
