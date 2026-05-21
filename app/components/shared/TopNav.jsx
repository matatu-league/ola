"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, ShoppingCart, User, Menu, ChevronDown, MapPin,
  Inbox, ChevronRight, LogOut, LayoutDashboard, Loader2, MessageSquare
} from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- NEW COOKIE HELPER ---
function setWildcardCookie(name, value) {
  const hostname = window.location.hostname;
  // Dynamically extract "ola.ug" from "www.ola.ug" or "gogo.ola.ug"
  const parts = hostname.split('.');
  const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  const domainString = hostname.includes('.') ? `domain=.${rootDomain};` : '';
  
  document.cookie = `${name}=${value}; path=/; max-age=604800; ${domainString} SameSite=Lax`;
}

function getCookieValue(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function deleteCookie(name) {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  document.cookie = `${name}=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`; // Fallback
}

function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

async function generateCodeChallenge(verifier) {
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const data = new TextEncoder().encode(verifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  } catch {}
  return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ICON_MAP = {
  'smart-products': '📱', 'cars': '🚗', 'apparel': '👕', 'home-furniture': '🛋️',
  'machinery': '⚙️', 'beauty': '💄', 'sports': '⚽', 'default': '📁',
};

export default function TopNav({ showSearch = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(0);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [authProvider, setAuthProvider] = useState(null); 

  const categoryMenuRef = useRef(null);

  useEffect(() => {
    const raw = getCookieValue('user_session');
    if (!raw) return;
    try {
      const value = raw.startsWith('%7B') ? decodeURIComponent(raw) : raw;
      setUser(JSON.parse(value));
    } catch (e) {
      console.error('Failed to parse user_session cookie', e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch('/api/products?limit=1', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await res.json();
        if (!cancelled && result.success && result.data?.categories) setDbCategories(result.data.categories);
      } catch (err) {} finally {
        if (!cancelled) setIsLoadingCategories(false);
      }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const categoryTree = useMemo(() => {
    if (!dbCategories.length) return [];
    const parents = dbCategories.filter(c => !c.parentRef);
    const children = dbCategories.filter(c => c.parentRef);
    return parents.map(parent => {
      const subs = children.filter(c => c.parentRef === parent._id);
      return {
        ...parent,
        icon: parent.icon ?? (ICON_MAP[parent.slug] || ICON_MAP['default']),
        subCategories: subs.length ? subs : [{ _id: `all-${parent._id}`, name: `All ${parent.name}`, slug: parent.slug }],
      };
    });
  }, [dbCategories]);

  useEffect(() => {
    const handler = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) setShowCategories(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    deleteCookie('user_session');
    setUser(null);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setAuthProvider('google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL
        })
      });

      const data = await res.json();

      if (data.success) {
        const sessionData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          hasStore: data.user.hasStore,
          domain: data.user.storeDomain
        };

        // FIX: Using our new Wildcard cookie setter
        const encodedSession = encodeURIComponent(JSON.stringify(sessionData));
        setWildcardCookie('user_session', encodedSession);

        window.location.reload();
      } else {
        setAuthProvider(null);
      }
    } catch (err) {
      setAuthProvider(null);
    }
  };

  const handleTikTokLogin = async () => {
    setAuthProvider('tiktok');
    try {
      const clientKey = 'sbawx7ufskuzcslm8j';
      const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/auth/tiktok/callback`;
      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
      const domainAttr = hostname.includes('.') ? `domain=.${rootDomain};` : '';

      document.cookie = `tiktok_auth_state=${state}; path=/; max-age=3600; ${domainAttr} SameSite=Lax`;
      document.cookie = `tiktok_code_verifier=${codeVerifier}; path=/; max-age=3600; ${domainAttr} SameSite=Lax`;

      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.set('client_key', clientKey);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'user.info.basic');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      window.location.href = authUrl.toString();
    } catch (err) {
      setAuthProvider(null);
    }
  };

  const handleCategorySelect = (slug) => {
    setShowCategories(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'Products');
    if (slug) params.set('category', slug);
    else params.delete('category');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sellerPortalUrl = user?.hasStore
    ? (user.domain || user.storeDomain ? `//${user.domain ?? user.storeDomain}/dashboard` : '/store/dashboard')
    : '/stores/onboarding';

  return (
    <header className="bg-white flex flex-col w-full z-50 relative">
      <div className="max-w-[1400px] w-full mx-auto px-4 py-4 flex items-center justify-between gap-6 lg:gap-10 relative z-40">
        <Link href="/" className="shrink-0 select-none" onClick={() => handleCategorySelect(null)}>
          <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">Ola<span className="text-gray-900">.ug</span></span>
        </Link>
        <div className="flex-1 max-w-3xl">
          {showSearch && (
            <div className="w-full flex items-center border-2 border-[#FE2C55] rounded-none h-10 transition-shadow">
              <div className="hidden sm:flex items-center bg-[#F8F8F8] px-3 py-2 text-[12px] font-semibold text-gray-700 border-r border-gray-200 cursor-pointer h-full hover:bg-gray-100 transition-colors select-none">
                Products <ChevronDown size={14} className="ml-1" />
              </div>
              <input type="text" placeholder="What are you looking for?" className="flex-1 px-4 text-[13px] outline-none text-gray-900 placeholder-gray-400 h-full bg-white" />
              <button className="bg-[#FE2C55] hover:bg-[#e0264b] px-6 md:px-8 h-full text-white flex items-center justify-center font-bold transition-colors cursor-pointer rounded-none">
                <Search size={16} className="md:mr-2" />
                <span className="hidden md:block text-[14px]">Search</span>
              </button>
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
          <div className="hidden lg:flex items-center gap-2 cursor-pointer group">
            <MapPin size={18} className="text-gray-400 group-hover:text-[#FE2C55] transition-colors" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 leading-none mb-0.5">Deliver to</span>
              <span className="text-[12px] font-bold text-gray-900 leading-none">Uganda</span>
            </div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group relative py-2" onMouseEnter={() => setShowAccountMenu(true)} onMouseLeave={() => setShowAccountMenu(false)}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-gray-200 object-cover" /> : <User size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />}
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-gray-500 leading-none mb-0.5 truncate max-w-[80px]">{user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In'}</span>
              <span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">Account <ChevronDown size={12} className="ml-0.5" /></span>
            </div>
            {showAccountMenu && (
              <div className="absolute top-full right-0 w-64 bg-white border border-gray-200 shadow-xl rounded-none py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200" />
                      <div><p className="text-[13px] font-bold text-gray-900 leading-tight">{user.name}</p><p className="text-[11px] text-gray-500">Logged in</p></div>
                    </div>
                    <div className="py-2">
                      <Link href={sellerPortalUrl} className="px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2"><LayoutDashboard size={14} /> My Seller Portal</Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2"><LogOut size={14} /> Log Out</button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[13px] font-bold text-gray-900 mb-4">Welcome to Ola.ug</p>
                    <button onClick={handleGoogleLogin} disabled={authProvider !== null} className="flex items-center justify-center gap-2 w-full bg-white border border-[#E3E3E4] hover:bg-gray-50 text-[#161823] rounded-sm py-2.5 text-[13px] font-bold transition-colors disabled:opacity-70 mb-3">
                      {authProvider === 'google' ? <Loader2 size={16} className="animate-spin text-gray-500" /> : (
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                          </g>
                        </svg>
                      )}
                      Sign In with Google
                    </button>
                    <button onClick={handleTikTokLogin} disabled={authProvider !== null} className="flex items-center justify-center gap-2 w-full bg-[#161823] hover:bg-black text-white rounded-sm py-2.5 text-[13px] font-bold transition-colors disabled:opacity-70">
                      {authProvider === 'tiktok' ? <Loader2 size={16} className="animate-spin" /> : <><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.755 4.755 0 0 1-1.161-3.18H10.66v14.596a3.2 3.2 0 1 1-3.2-3.2 3.2 3.2 0 0 1 2.33 1.011v-3.468a6.56 6.56 0 1 0 4.27 6.06V9.452a8.174 8.174 0 0 0 5.53 2.05v-4.816z" /></svg>Sign In with TikTok</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link href="/messages" className="flex flex-col items-center cursor-pointer group relative"><div className="relative"><MessageSquare size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" /><span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">5</span></div><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span></Link>
          <div className="flex flex-col items-center cursor-pointer group"><Inbox size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" /><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Orders</span></div>
          <div className="flex flex-col items-center cursor-pointer group relative"><div className="relative"><ShoppingCart size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" /><span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">3</span></div><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span></div>
        </div>
      </div>
      <div className="w-full border-b border-gray-200 bg-white relative z-30">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-[13px] font-medium text-gray-700 h-10">
          <div className="flex items-center gap-6 h-full">
            <div className="relative h-full flex items-center" ref={categoryMenuRef}>
              <button type="button" className={`flex items-center gap-2 transition-colors h-full px-1 ${showCategories ? 'text-[#FE2C55]' : 'hover:text-[#FE2C55]'}`} onClick={() => setShowCategories(prev => !prev)} aria-expanded={showCategories} aria-haspopup="true"><Menu size={16} /><span className="font-bold text-gray-900">All categories</span></button>
              {showCategories && (
                <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl z-50 flex rounded-none mt-[1px] min-h-[420px]">
                  {isLoadingCategories ? <div className="w-[500px] flex flex-col items-center justify-center text-gray-400 py-12"><Loader2 className="animate-spin mb-3" size={24} /><span className="text-[13px]">Loading categories…</span></div> : categoryTree.length === 0 ? <div className="w-[500px] flex items-center justify-center text-gray-500 text-[13px]">No categories available.</div> : (
                    <><div className="w-64 border-r border-gray-100 py-2 bg-white shrink-0">{categoryTree.map((cat, idx) => (<div key={cat._id ?? cat.slug} onMouseEnter={() => setHoveredCategory(idx)} className={`px-4 py-3 text-[13px] cursor-default flex justify-between items-center transition-colors ${hoveredCategory === idx ? 'bg-gray-50 text-[#FE2C55] font-semibold' : 'text-gray-700 hover:text-[#FE2C55]'}`}><span className="flex items-center gap-3"><span className={`text-base transition-all ${hoveredCategory === idx ? 'grayscale-0 opacity-100' : 'grayscale opacity-70'}`}>{cat.icon}</span><span className="capitalize">{cat.name}</span></span><ChevronRight size={14} className={hoveredCategory === idx ? 'text-[#FE2C55]' : 'text-gray-300'} /></div>))}</div><div className="w-[500px] p-6 bg-white shrink-0">{categoryTree[hoveredCategory] && (<><h3 className="text-[15px] font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 capitalize">{categoryTree[hoveredCategory].name}</h3><div className="grid grid-cols-2 gap-y-4 gap-x-8">{categoryTree[hoveredCategory].subCategories.map(sub => (<button type="button" key={sub._id ?? sub.slug} className="text-[13px] text-gray-600 hover:text-[#FE2C55] cursor-pointer transition-colors flex items-center group capitalize text-left" onClick={() => handleCategorySelect(sub.slug)}><span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover:bg-[#FE2C55] transition-colors" />{sub.name}</button>))}</div></>)}</div></>
                  )}
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center gap-6 h-full"><span className="cursor-pointer hover:text-[#FE2C55] transition-colors px-1">Verified manufacturers</span><span className="cursor-pointer hover:text-[#FE2C55] transition-colors px-1">Order protection</span></div>
          </div>
          <div className="hidden lg:flex items-center gap-5 h-full text-[12px]"><span className="cursor-pointer hover:text-[#FE2C55] transition-colors">Ola Work</span><span className="cursor-pointer hover:text-[#FE2C55] transition-colors">Buyer Central</span><span className="cursor-pointer hover:text-[#FE2C55] transition-colors">App & extensions</span><div className="h-4 w-px bg-gray-300 mx-1" /><Link href={sellerPortalUrl} className="cursor-pointer hover:text-[#FE2C55] transition-colors font-bold text-gray-900">Seller Portal</Link></div>
        </div>
      </div>
    </header>
  );
}