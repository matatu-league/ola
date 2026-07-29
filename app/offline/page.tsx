"use client";

// Served by the service worker (see public/sw.js) whenever a page navigation
// fails with no network and nothing cached for that exact URL yet. Kept
// deliberately static — no data fetching — so it always renders even with
// zero connectivity.
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#161823] text-white px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2">You&apos;re offline</h1>
      <p className="text-sm text-white/60 max-w-xs leading-relaxed mb-6">
        This page hasn&apos;t been saved for offline use yet. Reconnect and try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="bg-[#FE2C55] hover:bg-[#e6284b] active:scale-[0.98] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
      >
        Try again
      </button>
    </div>
  );
}
