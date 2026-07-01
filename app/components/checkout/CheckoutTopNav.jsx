"use client";

/**
 * CheckoutTopNav — a slim, distraction-free secondary header for the checkout
 * page (recommended checkout practice: keep the brand + trust + support visible,
 * drop the full marketplace nav so shoppers stay focused on completing the order).
 *
 * Themed entirely from the vendor tokens (var(--s-*)) so it matches the
 * storefront. Support details come from /api/settings (with safe fallbacks).
 */
import { useEffect, useState } from 'react';
import { Lock, Phone, Mail, ChevronLeft } from 'lucide-react';

export default function CheckoutTopNav({ storeName = 'Store', storeLogo = '', backHref = '/' }) {
  const [support, setSupport] = useState({ phoneNumber: '', email: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/settings');
        const json = await res.json();
        if (alive && json?.success && json.settings) {
          setSupport({
            phoneNumber: json.settings.supportPhone || '',
            email:       json.settings.supportEmail || '',
          });
        }
      } catch (_) { /* fall back to nothing */ }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur"
      style={{ background: 'var(--s-bg, #ffffff)', borderColor: 'var(--s-border, #E3E3E4)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* Brand → back to store */}
        <a
          href={backHref}
          className="flex items-center gap-2.5 min-w-0 group"
          style={{ color: 'var(--s-text, #161823)' }}
          aria-label={`Back to ${storeName}`}
        >
          <ChevronLeft size={16} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
          {storeLogo
            ? <img src={storeLogo} alt={storeName} className="h-7 w-7 rounded-[var(--s-radius,0.125rem)] object-cover shrink-0" />
            : <span className="h-7 w-7 rounded-[var(--s-radius,0.125rem)] shrink-0 flex items-center justify-center text-[12px] font-extrabold text-white" style={{ background: 'var(--s-primary, #161823)' }}>{(storeName || 'S').charAt(0).toUpperCase()}</span>
          }
          <span className="font-bold text-[14px] tracking-tight truncate">{storeName}</span>
        </a>

        {/* Secure-checkout trust signal (centre on wider screens) */}
        <div
          className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--s-muted, #8A8B91)' }}
        >
          <Lock size={13} className="shrink-0" />
          <span>Secure Checkout</span>
        </div>

        {/* Support contact */}
        <div className="flex items-center gap-3 text-[12px] font-medium shrink-0" style={{ color: 'var(--s-text, #161823)' }}>
          <span className="hidden md:inline" style={{ color: 'var(--s-muted, #8A8B91)' }}>Need help?</span>
          {support.phoneNumber && (
            <a href={`tel:${support.phoneNumber.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Phone size={13} className="shrink-0" />
              <span className="hidden sm:inline">{support.phoneNumber}</span>
            </a>
          )}
          {support.email && (
            <a href={`mailto:${support.email}`} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Mail size={13} className="shrink-0" />
              <span className="hidden lg:inline">{support.email}</span>
            </a>
          )}
        </div>
      </div>

      {/* Mobile secure badge row */}
      <div
        className="sm:hidden flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold border-t"
        style={{ color: 'var(--s-muted, #8A8B91)', borderColor: 'var(--s-border, #E3E3E4)' }}
      >
        <Lock size={11} /> <span>Secure Checkout · SSL encrypted</span>
      </div>
    </header>
  );
}
