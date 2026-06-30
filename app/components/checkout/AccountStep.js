"use client";

import { Loader2, CheckCircle2 } from 'lucide-react';

export default function AccountStep({
  activeStep, user, isAuthLoading, onGoogleLogin,
  needsPhone = false, phoneValue = '', setPhoneValue, onSavePhone, phoneSaving = false, phoneError = '',
}) {
  const isDone = activeStep > 1;
  const isActive = activeStep === 1;

  return (
    <div className={`bg-white border rounded-sm transition-all duration-300 ${isActive ? 'border-[var(--s-text,#161823)] ring-1 ring-[var(--s-primary,#161823)]' : 'border-[var(--s-border,#E3E3E4)]'}`}>
      {/* Header */}
      <div className={`p-4 md:p-5 flex items-center justify-between bg-white ${isActive ? 'border-b border-[var(--s-border,#E3E3E4)]' : ''} rounded-t-sm`}>
        <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${isDone ? 'text-[var(--s-muted,#8A8B91)]' : 'text-[var(--s-text,#161823)]'}`}>
          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${isDone ? 'bg-[#10B981] text-white' : 'bg-[var(--s-primary,#161823)] text-white'}`}>
            {isDone ? <CheckCircle2 size={14} strokeWidth={3} /> : '1'}
          </span>
          Account Details
        </h3>
      </div>

      {/* Active + first-time user: collect a phone number before continuing */}
      {isActive && needsPhone && (
        <div className="p-5 md:p-6">
          <h4 className="text-[15px] font-bold text-[var(--s-text,#161823)] mb-1.5 tracking-tight">Add your phone number</h4>
          <p className="text-[12px] text-[var(--s-muted,#8A8B91)] mb-4 font-medium">
            We use it to coordinate delivery and send order updates. Just once — we'll remember it next time.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="tel"
              inputMode="tel"
              autoFocus
              value={phoneValue}
              onChange={(e) => setPhoneValue?.(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSavePhone?.(); }}
              placeholder="e.g. +256 7XX XXX XXX"
              className="flex-1 bg-white border border-[var(--s-border,#E3E3E4)] focus:border-[var(--s-text,#161823)] outline-none rounded-sm px-3.5 py-2.5 text-[14px] text-[var(--s-text,#161823)] transition-colors"
            />
            <button
              onClick={() => onSavePhone?.()}
              disabled={phoneSaving}
              className="inline-flex items-center justify-center gap-2 bg-[var(--s-primary,#161823)] text-[var(--s-on-primary,#fff)] hover:opacity-90 rounded-sm px-5 py-2.5 text-[13px] font-bold transition-opacity disabled:opacity-50 tracking-tight"
            >
              {phoneSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save & continue'}
            </button>
          </div>
          {phoneError && <p className="text-[12px] text-[#EF4444] font-semibold mt-2">{phoneError}</p>}
        </div>
      )}

      {/* Active: show login */}
      {isActive && !needsPhone && (
        <div className="p-5 md:p-6">
          <h4 className="text-[15px] font-bold text-[var(--s-text,#161823)] mb-1.5 tracking-tight">Sign in to checkout</h4>
          <p className="text-[12px] text-[var(--s-muted,#8A8B91)] mb-5 font-medium">
            Log in to use your saved addresses, track your order, and earn rewards.
          </p>
          <button
            onClick={onGoogleLogin}
            disabled={isAuthLoading}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-white border border-[var(--s-border,#E3E3E4)] hover:bg-[var(--s-surface,#F8F8F8)] hover:border-[var(--s-text,#161823)] text-[var(--s-text,#161823)] rounded-sm px-5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 tracking-tight"
          >
            {isAuthLoading ? (
              <Loader2 size={16} className="animate-spin text-[var(--s-muted,#8A8B91)]" />
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
            )}
            Continue with Google
          </button>
        </div>
      )}

      {/* Collapsed summary */}
      {isDone && user && (
        <div className="px-4 md:px-5 pb-4 pt-4 bg-white rounded-b-sm border-t border-[var(--s-border,#E3E3E4)] ml-9">
          <p className="text-[14px] font-semibold text-[var(--s-text,#161823)] mb-0.5">{user.name}</p>
          <p className="text-[12px] text-[var(--s-muted,#8A8B91)]">
            {user.email}{user.phoneNumber ? ` · ${user.phoneNumber}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}