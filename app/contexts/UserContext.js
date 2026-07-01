"use client";

// contexts/UserContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearCookie } from '@/lib/cookies';

// ── Cookie parser ─────────────────────────────────────────────────────────────
function parseUserCookie() {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie
      .split('; ')
      .find(r => r.startsWith('user_session='));
    if (!match) return null;

    let raw = decodeURIComponent(match.split('=')[1]).replace(/^"|"$/g, '');
    // Handle double-encoded cookies
    if (raw.startsWith('%7B')) raw = decodeURIComponent(raw);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const UserContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function UserProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true on first render — avoids flash

  // ── Read cookie on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const parsed = parseUserCookie();
    setUser(parsed);
    setIsLoading(false);
  }, []);

  // ── Update user (e.g. after Google login, phone update) ───────────────────
  // Call this after writing a new cookie so the context stays in sync.
  const refreshUser = useCallback(() => {
    setUser(parseUserCookie());
  }, []);

  // ── Logout — clears cookie + resets state ─────────────────────────────────
  const logout = useCallback(() => {
    // Clear across all subdomains (host-only + domain-scoped variants).
    clearCookie('user_session');
    setUser(null);

    // Redirect to home
    window.location.href = '/';
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const isLoggedIn = !!user;
  const hasStore   = !!user?.hasStore;
  const isAdmin    = user?.role === 'admin';

  // Seller portal URL — computed from user data
  const sellerPortalUrl = hasStore
    ? (user?.domain || user?.storeDomain
        ? `//${user.domain ?? user.storeDomain}/dashboard`
        : '/store/dashboard')
    : '/stores/onboarding';

  return (
    <UserContext.Provider value={{
      // ── Core user data ─────────────────────────────────────────────────
      user,           // full session object: { id, name, email, avatar, phoneNumber, hasStore, ... }
      isLoggedIn,     // boolean shorthand
      isLoading,      // true on first render before cookie is read

      // ── Store / seller ──────────────────────────────────────────────────
      hasStore,
      isAdmin,        // user.role === 'admin' — gates admin-dashboard access
      sellerPortalUrl,

      // ── Actions ────────────────────────────────────────────────────────
      refreshUser,    // re-read cookie after login/update
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}