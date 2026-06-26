"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '../../components/shared/TopNav';

const PAGE_SIZE = 10;

// Shared product card — matches the marketplace look & feel.
const ProductCard = ({ product, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer flex flex-col group"
  >
    <div className="bg-[#f5f5f7] rounded-xl aspect-square mb-3 relative overflow-hidden flex items-center justify-center">
      <img
        src={product.image || product.images?.[0] || ''}
        alt={product.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <h3 className="text-[13px] md:text-[14px] text-gray-800 leading-snug line-clamp-2 mb-1.5 group-hover:text-[#FE2C55] transition-colors">
      {product.title}
    </h3>
    <div className="mt-auto flex items-baseline gap-2">
      <span className="font-extrabold text-gray-900 text-[15px] md:text-[17px]">{product.price}</span>
      {product.moq && (
        <span className="text-[11px] md:text-[12px] text-gray-500 font-medium">MOQ: {product.moq}</span>
      )}
    </div>
  </div>
);

export default function HistoryPage() {
  const router = useRouter();

  const [history, setHistory]   = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [visible, setVisible]   = useState(PAGE_SIZE); // how many history items are shown
  const [loading, setLoading]   = useState(true);

  const openProduct = useCallback((id) => router.push(`/products/${id}`), [router]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Browsing history — API caps at 50, which is plenty for this page.
        const histRes  = await fetch('/api/products/history?limit=50', {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const histJson = await histRes.json();
        if (active && histJson.success) setHistory(histJson.data || []);

        // Recommendations — reusing the marketplace feed until a dedicated
        // recommendations endpoint exists.
        const recRes  = await fetch('/api/marketplace', {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const recJson = await recRes.json();
        if (active && recJson.success) setRecommended(recJson.data?.productGrid || []);
      } catch (err) {
        console.error('Failed to load history page:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const shownHistory = history.slice(0, visible);
  const hasMore = visible < history.length;

  return (
    <div className="font-sans text-gray-800 min-h-screen bg-white flex flex-col">
      <TopNav />

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-10 w-full flex-1">

        {/* ── INSPIRED BY YOUR HISTORY ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-[26px] md:text-[34px] font-extrabold text-gray-900 tracking-tight leading-none">
            Inspired by your history
          </h1>
          <span className="hidden sm:block w-px h-7 bg-gray-300" />
          <span className="hidden sm:block text-[15px] md:text-[17px] text-gray-700 font-medium">
            Browsing history in the last three months
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500 animate-pulse">Loading your history…</div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium mb-4">You haven&apos;t viewed any products yet.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#FE2C55] text-white font-bold text-[14px] px-6 py-2.5 rounded-full hover:bg-[#e0264c] transition-colors"
            >
              Browse the marketplace
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {shownHistory.map((p) => (
                <ProductCard key={p._id} product={p} onClick={() => openProduct(p._id)} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8 md:mt-10">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="bg-[#FF6A00] text-white font-bold text-[15px] px-10 py-3 rounded-full shadow-sm hover:bg-[#e85f00] transition-colors"
                >
                  View more
                </button>
              </div>
            )}
          </>
        )}

        {/* ── RECOMMENDED FOR YOU ──────────────────────────────────────────── */}
        {recommended.length > 0 && (
          <section className="mt-14 md:mt-20">
            <h2 className="text-[26px] md:text-[34px] font-extrabold text-gray-900 tracking-tight leading-none mb-6 md:mb-8">
              Recommended for you
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {recommended.map((p) => (
                <ProductCard
                  key={p._id || p.id}
                  product={p}
                  onClick={() => openProduct(p._id || p.id)}
                />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}