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
      {/* Ambient background — clamped to the viewport so the glow circles can
          never force horizontal scroll on a narrow phone. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#161823] via-[#1d1f2b] to-[#3a0d1a]" />
      <div className="absolute -top-24 -right-24 -z-10 w-[min(420px,80vw)] h-[min(420px,80vw)] rounded-full bg-[#FE2C55]/25 blur-[100px] sm:blur-[120px]" />
      <div className="absolute -bottom-32 -left-24 -z-10 w-[min(420px,80vw)] h-[min(420px,80vw)] rounded-full bg-[#2563EB]/20 blur-[100px] sm:blur-[120px]" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] sm:text-[12px] font-semibold text-white/90 backdrop-blur">
            <Sparkles size={13} className="text-[#FFD166] shrink-0" /> One marketplace · products &amp; services
          </span>

          <h1 className="mt-4 sm:mt-5 text-white font-black tracking-tight leading-[1.08] sm:leading-[1.05]" style={{ fontSize: 'clamp(1.75rem, 8vw, 3.75rem)' }}>
            Shop anything. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FE2C55] to-[#ff7a90]">Book anyone.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-[14px] sm:text-[15px] md:text-[17px] leading-relaxed text-white/70 max-w-2xl">
            Discover products and services from trusted local stores — from electronics and fashion to salons, catering and home services. Buy and book, all in one place, with secure checkout.
          </p>

          {/* CTAs — full-width stacked on phones (easy thumb targets), inline
              from sm up. py-3.5 keeps both buttons at a comfortable ≥44px
              touch height. */}
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <button
              onClick={() => onTabChange?.('Products')}
              className="inline-flex items-center justify-center gap-2 bg-[#FE2C55] hover:bg-[#e6284b] active:scale-[0.98] text-white font-bold text-[14px] px-5 py-3.5 sm:py-3 rounded-xl transition-all shadow-lg shadow-[#FE2C55]/25"
            >
              <ShoppingBag size={17} className="shrink-0" /> Shop products
            </button>
            <button
              onClick={() => onTabChange?.('Stores')}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/20 text-white font-bold text-[14px] px-5 py-3.5 sm:py-3 rounded-xl transition-all backdrop-blur"
            >
              <StoreIcon size={17} className="shrink-0" /> Explore stores <ArrowRight size={15} className="shrink-0" />
            </button>
          </div>

          {/* Category quick-links — horizontally scrollable on phones (a long
              chip row wraps into a tall, cramped block otherwise); wraps
              normally from sm up where there's room. */}
          {categories.length > 0 && (
            <div className="mt-7 sm:mt-8">
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-white/45 mb-3">Popular categories</p>
              <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0 hide-scrollbar">
                {categories.map((c) => (
                  <button
                    key={c._id || c.slug}
                    onClick={() => onCategorySelect?.(c.slug || c._id)}
                    className="shrink-0 rounded-full bg-white/8 hover:bg-white/15 active:scale-[0.97] border border-white/12 text-white/85 text-[13px] font-medium px-3.5 py-2 transition-all"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trust stats */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-white/6 border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur">
              <s.icon size={17} className="text-[#FFD166] shrink-0" />
              <span className="text-[12px] sm:text-[13px] font-semibold text-white/85 leading-snug">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
