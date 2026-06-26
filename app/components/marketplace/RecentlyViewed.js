"use client";

import React, { useEffect, useState } from 'react';

export default function RecentlyViewed({ onProductClick, onViewAll }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res  = await fetch('/api/products/history?limit=12');
        const json = await res.json();
        if (active && json.success) setItems(json.data || []);
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Hide entirely until we know there's something to show.
  if (loading || items.length === 0) return null;

  const latest = items[0];

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-gray-900">Recently Viewed</h2>
        {items.length > 1 && (
          <button
            onClick={() => onViewAll?.()}
            className="text-[13px] font-semibold text-[#FE2C55] hover:underline"
          >
            View all
          </button>
        )}
      </div>

      {/* Single most-recent product card */}
      <button
        onClick={() => onProductClick?.(latest._id)}
        className="flex items-center gap-3 text-left group w-full sm:w-auto"
      >
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={latest.image || latest.images?.[0] || ''}
            alt={latest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] text-gray-800 line-clamp-2 leading-snug">{latest.title}</p>
          <p className="text-[15px] font-bold text-[#FE2C55] mt-1">{latest.price}</p>
        </div>
      </button>
    </section>
  );
}