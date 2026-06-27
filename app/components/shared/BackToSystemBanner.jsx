'use client';

/**
 * BackToSystemBanner
 * ------------------------------------------------------------------------------
 * Slim, persistent bar shown at the very top of every store-scoped buyer page
 * (storefront, product, cart, checkout). It is intentionally styled in the
 * SYSTEM look — not the vendor theme — so buyers always have a clear, consistent
 * way back to the Ola marketplace from inside any vendor's themed store.
 */
import { ArrowLeft } from 'lucide-react';
import { getRootDomain, ROOT_DOMAIN } from '@/lib/domain';

export default function BackToSystemBanner() {
  // getRootDomain() is browser-only (returns '' during SSR); fall back to the
  // configured apex domain so the link is correct before hydration.
  const href = getRootDomain() || `https://${ROOT_DOMAIN}`;

  return (
    <div className="w-full bg-[#161823] text-white">
      <div className="max-w-[1400px] mx-auto px-4 h-9 flex items-center justify-between text-[12px]">
        <a href={href} className="inline-flex items-center gap-1.5 font-semibold hover:text-blue-300 transition-colors">
          <ArrowLeft size={13} />
          Back to <span className="font-bold">Ola<span className="text-blue-500">.</span>ug</span>
        </a>
        <span className="text-white/50 hidden sm:inline">Powered by Ola Marketplace</span>
      </div>
    </div>
  );
}
