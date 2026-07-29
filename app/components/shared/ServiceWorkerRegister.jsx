"use client";

import { useEffect } from 'react';

// Registers public/sw.js once the page has finished loading. Skipped outside
// production — the Next.js dev server's own HMR/caching doesn't play well
// with a service worker intercepting fetches, and a stale dev-registered
// worker is a classic source of "my change isn't showing up" confusion.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
