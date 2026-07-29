"use client";

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Share } from 'lucide-react';

const DISMISS_KEY = 'ola_install_dismissed_at';
const DISMISS_DAYS = 14;

const isDismissed = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
    return elapsedDays < DISMISS_DAYS;
  } catch {
    return false;
  }
};

const dismiss = (hide) => {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  hide();
};

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

// Custom "Add to Home Screen" prompt — Chrome/Edge/Android fire
// `beforeinstallprompt` and we capture + replay it from our own on-brand
// banner (browsers only show their own generic one once, then never again,
// so this is the only reliable repeat entry point). iOS Safari never fires
// that event at all, so it gets a short instructional hint instead.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    const onInstalled = () => {
      setShowBanner(false);
      setShowIOSHint(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari has no beforeinstallprompt — detect it directly and show the
    // manual instructions instead, after a short delay so it doesn't compete
    // with the page's own first-load content.
    const ua = window.navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);
    let timer;
    if (isIOS && isSafari) {
      timer = setTimeout(() => setShowIOSHint(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const hide = useCallback(() => { setShowBanner(false); setShowIOSHint(false); }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner && !showIOSHint) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] z-[70] bg-[#161823] text-white rounded-xl shadow-2xl border border-white/10 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        {showIOSHint ? <Share size={18} className="text-white" /> : <Download size={18} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold">Install Ola</h3>
        {showIOSHint ? (
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            Tap <Share size={11} className="inline -mt-0.5" /> Share, then &quot;Add to Home Screen&quot; for the full app experience.
          </p>
        ) : (
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            Add Ola to your home screen for a faster, full-screen experience.
          </p>
        )}
        {!showIOSHint && (
          <button
            type="button"
            onClick={handleInstall}
            className="mt-3 bg-[#FE2C55] hover:bg-[#e6284b] active:scale-[0.98] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
          >
            Install
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(hide)}
        aria-label="Dismiss"
        className="p-1 -mt-1 -mr-1 text-white/40 hover:text-white transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
