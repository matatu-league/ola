"use client";

// components/shared/CategoryDropdown.jsx
//
// Self-contained category menu — fetches from /api/categories itself.
// Horizontal layout on desktop, full-screen drawer on mobile.
// No hardcoded fallback data — shows a skeleton while loading.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link          from 'next/link';
import {
  Menu, X, ChevronRight, ArrowRight,
  Loader2, Sparkles, Tag, Star, TrendingUp,
} from 'lucide-react';

// ── Color palette per category (cycles if more than 8) ───────────────────────
const COLORS = [
  { accent: '#FE2C55', bg: '#FFF0F3' },
  { accent: '#FF6B35', bg: '#FFF4EF' },
  { accent: '#7C3AED', bg: '#F5F0FF' },
  { accent: '#0EA5E9', bg: '#F0F9FF' },
  { accent: '#10B981', bg: '#F0FDF9' },
  { accent: '#F59E0B', bg: '#FFFBEB' },
  { accent: '#EC4899', bg: '#FDF2F8' },
  { accent: '#6366F1', bg: '#EEF2FF' },
];

const ICON_MAP = {
  'smart-products':  '📱',
  'cars':            '🚗',
  'apparel':         '👕',
  'home-furniture':  '🛋️',
  'machinery':       '⚙️',
  'beauty':          '💄',
  'sports':          '⚽',
  'food':            '🍎',
  'agriculture':     '🌾',
  'construction':    '🏗️',
  'health':          '💊',
  'education':       '📚',
  'jobs':            '💼',
  'default':         '📦',
};

const QUICK_FILTERS = [
  { label: 'New arrivals', icon: Sparkles   },
  { label: 'On sale',      icon: Tag        },
  { label: 'Top rated',    icon: Star       },
  { label: 'Trending',     icon: TrendingUp },
];

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
    <div className="h-3 w-28 bg-gray-200 rounded-sm" />
  </div>
);

export default function CategoryDropdown() {
  const router = useRouter();

  // ── Desktop: hover open | Mobile: click open ──────────────────────────────
  const [isOpen,       setIsOpen]       = useState(false);
  const [hoveredIdx,   setHoveredIdx]   = useState(0);
  const [menuAnimated, setMenuAnimated] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const containerRef = useRef(null);

  // ── Fetch from /api/categories — only once ────────────────────────────────
  useEffect(() => {
    if (hasFetched) return;
    setHasFetched(true);
    setIsLoading(true);

    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.length) {
          setCategories(data.data);
        }
      })
      .catch(err => console.error('[CategoryDropdown] fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [hasFetched]);

  // ── Build tree from flat array ────────────────────────────────────────────
  const tree = useMemo(() => {
    if (!categories.length) return [];
    const parents  = categories.filter(c => !c.parentId);
    const children = categories.filter(c =>  c.parentId);
    return parents.map((parent, idx) => ({
      ...parent,
      icon:  parent.icon ?? (ICON_MAP[parent.slug] || ICON_MAP.default),
      color: COLORS[idx % COLORS.length],
      subs:  children
        .filter(c => String(c.parentId) === String(parent._id))
        .map(s => ({ ...s, icon: s.icon ?? ICON_MAP[s.slug] ?? null })),
    }));
  }, [categories]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Close on route change ─────────────────────────────────────────────────
  const close = () => setIsOpen(false);

  // ── Animate menu in ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll on mobile
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setMenuAnimated(true));
    } else {
      document.body.style.overflow = '';
      setMenuAnimated(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navigate = (slug) => {
    close();
    router.push(`/products?category=${slug}`);
  };

  const activeParent = tree[hoveredIdx];
  const activeColor  = activeParent?.color || COLORS[0];

  return (
    <div className="relative h-full flex items-center" ref={containerRef}>

      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Browse all categories"
        className={`flex items-center gap-2 h-full px-1 font-medium transition-colors
          ${isOpen ? 'text-[#FE2C55]' : 'text-gray-700 hover:text-[#FE2C55]'}`}
      >
        {isOpen
          ? <X    size={16} className="transition-transform" />
          : <Menu size={16} className="transition-transform" />
        }
        <span className="font-bold text-gray-900 text-[13px] hidden sm:inline">
          All categories
        </span>
        <span className="font-bold text-gray-900 text-[13px] sm:hidden">
          Categories
        </span>
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={close}
          />

          <div
            className={`
              z-50 bg-white border border-gray-200 overflow-hidden
              transition-all duration-200
              ${menuAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}

              /* Mobile — full-screen bottom sheet */
              fixed bottom-0 left-0 right-0 top-[56px] rounded-t-2xl shadow-2xl
              md:absolute md:top-full md:left-0 md:bottom-auto md:right-auto md:rounded-xl md:shadow-[0_8px_40px_rgba(0,0,0,0.13)]
              md:mt-1
            `}
            style={{ width: 'clamp(360px, 90vw, 820px)' }}
          >

            {/* Loading state */}
            {isLoading ? (
              <div className="flex flex-col p-2" style={{ height: 460, overflowY: 'auto' }}>
                {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : tree.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-[13px] text-gray-400">
                No categories available
              </div>
            ) : (
              /* ── Horizontal layout — fixed height so hover never shifts layout ── */
              <div
                className="flex"
                style={{ height: 460 }}  /* fixed height — neither panel can grow */
              >

                {/* Left sidebar — fixed width, scrolls internally if many categories */}
                <div
                  className="shrink-0 overflow-y-auto py-2 border-r border-[#F0F0F0]"
                  style={{ width: 220, background: '#FAFAFA' }}
                >
                  {tree.map((cat, idx) => {
                    const isActive = hoveredIdx === idx;
                    const { accent, bg } = cat.color;
                    return (
                      <div
                        key={cat._id}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onClick={() => navigate(cat.slug)}
                        className="flex items-center gap-3 px-5 py-2.5 cursor-pointer select-none"
                        style={{
                          background:  isActive ? 'white' : 'transparent',
                          borderLeft:  isActive ? `2.5px solid ${accent}` : '2.5px solid transparent',
                          transition:  'background 0.1s, border-color 0.1s',
                        }}
                      >
                        <span
                          className="text-base shrink-0 flex items-center justify-center rounded-lg"
                          style={{
                            width: 32, height: 32,
                            background: isActive ? bg : '#F0F0F0',
                            transition: 'background 0.15s',
                          }}
                        >
                          {cat.icon}
                        </span>
                        <span
                          className="text-[13px] leading-tight capitalize font-semibold"
                          style={{
                            color:      isActive ? accent : '#374151',
                            transition: 'color 0.1s',
                          }}
                        >
                          {cat.name}
                        </span>
                        <ChevronRight
                          size={12}
                          className="ml-auto shrink-0"
                          style={{
                            color:     isActive ? accent : '#D1D5DB',
                            transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'color 0.15s, transform 0.2s',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Right panel — fixed height via parent, flex-col fills it */}
                <div className="flex flex-col flex-1 overflow-hidden bg-white min-w-0" style={{ height: '100%' }}>

                  {activeParent && (
                    <>
                      {/* Category header — fixed height so switching categories never shifts layout */}
                      <div
                        className="flex items-center gap-4 px-5 shrink-0 border-b border-[#F0F0F0]"
                        style={{
                          height: 120,
                          background: `linear-gradient(135deg, ${activeColor.bg} 0%, white 65%)`,
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-2xl text-3xl shrink-0"
                          style={{
                            width: 56, height: 56,
                            background: activeColor.bg,
                            border: `1.5px solid ${activeColor.accent}22`,
                          }}
                        >
                          {activeParent.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[16px] font-bold text-gray-900 capitalize leading-tight">
                            {activeParent.name}
                          </p>
                          {activeParent.subs.length > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {activeParent.subs.length} subcategories
                            </p>
                          )}
                          {/* Quick filter pills */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {QUICK_FILTERS.map(({ label, icon: Icon }) => (
                              <button
                                key={label}
                                onClick={() => navigate(activeParent.slug)}
                                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-white hover:border-[#FE2C55] hover:text-[#FE2C55] transition-colors"
                              >
                                <Icon size={9} /> {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(activeParent.slug)}
                          className="shrink-0 flex items-center gap-1.5 text-[12px] font-bold text-white px-4 py-2 rounded-lg"
                          style={{ background: activeColor.accent }}
                        >
                          View all <ArrowRight size={13} />
                        </button>
                      </div>

                      {/* Subcategories — fills remaining fixed height, scrolls if needed */}
                      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
                        {activeParent.subs.length > 0 ? (
                          <>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                              Browse subcategories
                            </p>
                            {/* Horizontal wrapping grid */}
                            <div className="flex flex-wrap gap-2">
                              {activeParent.subs.map(sub => (
                                <button
                                  key={sub._id}
                                  onClick={() => navigate(sub.slug)}
                                  className="flex items-center gap-1.5 px-3 py-2 border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-[#FE2C55] hover:text-[#FE2C55] text-gray-700 text-[12px] font-medium rounded-sm transition-all capitalize"
                                >
                                  {sub.icon && <span className="text-sm">{sub.icon}</span>}
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <button
                              onClick={() => navigate(activeParent.slug)}
                              className="flex items-center gap-2 text-[13px] font-semibold text-white px-5 py-2.5 rounded-sm"
                              style={{ background: activeColor.accent }}
                            >
                              Browse all {activeParent.name} <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
