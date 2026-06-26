"use client";

// components/shared/AuthModal.jsx

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  reason   = 'Sign in to continue',
  subtitle = 'Use your Google or TikTok account',
}) {
  const { loginWithGoogle, loginWithTikTok, authProvider } = useAuth();
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setError('');
    try {
      const result = await loginWithGoogle();
      if (result?.success !== false) onSuccess?.();
    } catch (err) {
      setError(err?.message || 'Google sign-in failed');
    }
  };

  const handleTikTok = async () => {
    setError('');
    try {
      const result = await loginWithTikTok();
      if (result?.success !== false) onSuccess?.();
    } catch (err) {
      setError(err?.message || 'TikTok sign-in failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/55"
      style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden"
        style={{ animation: 'authModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 text-center border-b border-[#F0F0F0]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] p-1.5 rounded-lg transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div
            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#FFF0F3,#FFE0E6)' }}
          >
            <MessageSquare size={22} className="text-[#FE2C55]" />
          </div>

          <h2 className="text-[16px] font-bold text-[#161823] mb-1">{reason}</h2>
          <p className="text-[12px] text-[#8A8B91]">{subtitle}</p>
        </div>

        {/* Body — login buttons */}
        <div className="p-6 pt-5">

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={authProvider !== null}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 mb-2.5 border border-[#D9D9D9] hover:border-[#FE2C55] hover:bg-[#FFF0F3] rounded-lg text-[13px] font-semibold text-[#161823] hover:text-[#FE2C55] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authProvider === 'google' ? (
              <Loader2 size={16} className="animate-spin text-[#8A8B91]" />
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
            )}
            Continue with Google
          </button>

          {/* TikTok */}
          <button
            onClick={handleTikTok}
            disabled={authProvider !== null}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[#161823] hover:bg-black border border-[#161823] rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authProvider === 'tiktok' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.755 4.755 0 0 1-1.161-3.18H10.66v14.596a3.2 3.2 0 1 1-3.2-3.2 3.2 3.2 0 0 1 2.33 1.011v-3.468a6.56 6.56 0 1 0 4.27 6.06V9.452a8.174 8.174 0 0 0 5.53 2.05v-4.816z" />
              </svg>
            )}
            Continue with TikTok
          </button>

          {/* Error message */}
          {error && (
            <div className="mt-3 p-2.5 bg-[#FFF0F3] border border-[#FE2C55]/30 rounded-lg text-[11px] text-[#FE2C55] font-medium text-center">
              {error}
            </div>
          )}

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-[#10B981]">
            <ShieldCheck size={11} />
            <span className="font-medium">Secured by Ola.ug · No password needed</span>
          </div>

          {/* Terms footer */}
          <p className="text-[10px] text-[#8A8B91] text-center mt-3 leading-relaxed">
            By signing in you agree to our{' '}
            <Link href="/terms"   className="text-[#FE2C55] hover:underline">Terms</Link> &{' '}
            <Link href="/privacy" className="text-[#FE2C55] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes authModalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}