"use client";

import { useState, useEffect } from 'react';
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

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export function setWildcardCookie(name, value, maxAge = 604800) {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  const domainString = hostname.includes('.') ? `domain=.${rootDomain};` : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; ${domainString} SameSite=Lax`;
}

export function getCookieValue(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function deleteCookie(name) {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  document.cookie = `${name}=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
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

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const raw = getCookieValue('user_session');
    if (raw) {
      try {
        const value = raw.startsWith('%7B') ? decodeURIComponent(raw) : raw;
        setUser(JSON.parse(value));
      } catch (e) {
        console.error('Failed to parse user_session cookie', e);
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async () => {
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
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        const sessionData = { 
          id: data.user.id, 
          name: data.user.name, 
          email: data.user.email, 
          avatar: data.user.avatar, 
          phoneNumber: data.user.phoneNumber, // Include phone number in session
          hasStore: data.user.hasStore, 
          domain: data.user.storeDomain 
        };
        setWildcardCookie('user_session', encodeURIComponent(JSON.stringify(sessionData)));
        setUser(sessionData);
        window.location.reload();
      } else { 
        setAuthProvider(null); 
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setAuthProvider(null); 
    }
  };

  const loginWithTikTok = async () => {
    setAuthProvider('tiktok');
    
    try {
      const clientKey = 'sbawx7ufskuzcslm8j'; // Ensure this matches your TikTok credentials
      const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ola.ug'}/api/auth/tiktok/callback`;
      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      setWildcardCookie('tiktok_auth_state', state, 3600);
      setWildcardCookie('tiktok_code_verifier', codeVerifier, 3600);
      
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
      console.error("TikTok Auth Error:", err);
      setAuthProvider(null); 
    }
  };

  const updatePhone = async (phoneNumber) => {
    if (!user?.id) return { success: false, message: 'Not logged in' };
    
    try {
      const res = await fetch('/api/user/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phoneNumber })
      });
      const data = await res.json();
      
      if (data.success) {
        // Update local session cookie and React State seamlessly
        const updatedUser = { ...user, phoneNumber };
        setWildcardCookie('user_session', encodeURIComponent(JSON.stringify(updatedUser)));
        setUser(updatedUser);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error("Update Phone Error:", err);
      return { success: false, message: 'Server error' };
    }
  };

  const logout = () => {
    deleteCookie('user_session');
    setUser(null);
    window.location.reload();
  };

  return {
    user,
    isLoading,
    authProvider,
    loginWithGoogle,
    loginWithTikTok,
    logout,
    updatePhone
  };
}
