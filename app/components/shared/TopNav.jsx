"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, ShoppingCart, User, Menu, ChevronDown, MapPin, 
  Inbox, ChevronRight, LogOut, LayoutDashboard, Loader2, MessageSquare 
} from 'lucide-react';

export default function TopNav({ onCategorySelect, showSearch = false }) {
  const [user, setUser] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(0); 
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const categoryMenuRef = useRef(null);

  // 1. Fetch User Session on Mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
    
    if (sessionCookie) {
      try {
        const rawValue = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
        let decodedValue = decodeURIComponent(rawValue);
        
        if (decodedValue.startsWith('%7B')) {
          decodedValue = decodeURIComponent(decodedValue);
        }
        
        const sessionData = JSON.parse(decodedValue);
        setUser(sessionData);
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }, []);

  // 2. Fetch Dynamic Categories from Database
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch('/api/products?limit=1', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await response.json();
        
        if (result.success && result.data?.categories) {
          setDbCategories(result.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories for TopNav:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // 3. Process Flat DB Categories into Mega Menu Tree
  const categoryTree = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return [];

    const parents = dbCategories.filter(c => !c.parentRef);
    const children = dbCategories.filter(c => c.parentRef);

    const iconMap = {
      'smart-products': '📱',
      'cars': '🚗',
      'apparel': '👕',
      'home-furniture': '🛋️',
      'machinery': '⚙️',
      'beauty': '💄',
      'sports': '⚽',
      'default': '📁'
    };

    return parents.map(parent => {
      let subCats = children.filter(c => c.parentRef === parent._id);
      
      if (subCats.length === 0) {
        subCats = [{ _id: `all-${parent._id}`, name: `All ${parent.name}`, slug: parent.slug }];
      }

      return {
        ...parent,
        icon: parent.icon || iconMap[parent.slug] || iconMap['default'],
        subCategories: subCats
      };
    });
  }, [dbCategories]);

  // 4. Handle Click Outside for Category Menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  };

  // 5. RESTORED: Secure TikTok PKCE Authentication Logic
  const handleTikTokLogin = async () => {
    setIsAuthenticating(true);
    try {
      const clientKey = 'sbawx7ufskuzcslm8j'; // Your App Credentials
      const redirectUri = `${window.location.origin}/api/auth/tiktok/callback`;

      const generateRandomString = (length) => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
          result += charset[randomValues[i] % charset.length];
        }
        return result;
      };

      const generateCodeChallenge = async (verifier) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      };

      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      document.cookie = `tiktok_auth_state=${state}; path=/; max-age=3600; Secure; SameSite=Lax`;
      document.cookie = `tiktok_code_verifier=${codeVerifier}; path=/; max-age=3600; Secure; SameSite=Lax`;

      const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      tiktokAuthUrl.searchParams.append('client_key', clientKey);
      tiktokAuthUrl.searchParams.append('response_type', 'code');
      tiktokAuthUrl.searchParams.append('scope', 'user.info.basic');
      tiktokAuthUrl.searchParams.append('redirect_uri', redirectUri);
      tiktokAuthUrl.searchParams.append('state', state);
      tiktokAuthUrl.searchParams.append('code_challenge', codeChallenge);
      tiktokAuthUrl.searchParams.append('code_challenge_method', 'S256');

      window.location.href = tiktokAuthUrl.toString();
    } catch (error) {
      console.error("TikTok Auth Error:", error);
      setIsAuthenticating(false);
    }
  };

  return (
    <header className="bg-white flex flex-col w-full z-50 relative">
      {/* ================= LEVEL 1: Top Bar (Logo, Search, Account) ================= */}
      <div className="max-w-[1400px] w-full mx-auto px-4 py-4 flex items-center justify-between gap-6 lg:gap-10 relative z-40">
        
        {/* Left: Logo */}
        <div 
          className="shrink-0 cursor-pointer select-none" 
          onClick={() => onCategorySelect && onCategorySelect(null)}
        >
          <a href="/">
            <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">
              Ola<span className="text-gray-900">.com</span>
            </span>
          </a>
        </div>

        {/* Center: Search Bar (Square & Flat) */}
        <div className="flex-1 max-w-3xl">
          {showSearch && (
            <div className="w-full flex items-center border-2 border-[#FE2C55] rounded-none h-10 transition-shadow">
              <div className="hidden sm:flex items-center bg-[#F8F8F8] px-3 py-2 text-[12px] font-semibold text-gray-700 border-r border-gray-200 cursor-pointer h-full hover:bg-gray-100 transition-colors select-none">
                Products <ChevronDown size={14} className="ml-1" />
              </div>
              <input 
                type="text" 
                placeholder="What are you looking for?" 
                className="flex-1 px-4 text-[13px] outline-none text-gray-900 placeholder-gray-400 h-full bg-white"
              />
              <button className="bg-[#FE2C55] hover:bg-[#e0264b] px-6 md:px-8 h-full text-white flex items-center justify-center font-bold transition-colors cursor-pointer rounded-none">
                <Search size={16} className="md:mr-2" />
                <span className="hidden md:block text-[14px]">Search</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: User Actions (Cart, Account, Orders) */}
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
          
          {/* Deliver To (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-2 cursor-pointer group">
            <MapPin size={18} className="text-gray-400 group-hover:text-[#FE2C55] transition-colors" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 leading-none mb-0.5">Deliver to</span>
              <span className="text-[12px] font-bold text-gray-900 leading-none">Uganda</span>
            </div>
          </div>

          {/* DYNAMIC User Account Dropdown */}
          <div 
            className="flex items-center gap-2 cursor-pointer group relative py-2"
            onMouseEnter={() => setShowAccountMenu(true)}
            onMouseLeave={() => setShowAccountMenu(false)}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-gray-200 object-cover" />
            ) : (
              <User size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
            )}
            
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-gray-500 leading-none mb-0.5 truncate max-w-[80px]">
                {user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In'}
              </span>
              <span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">
                Account <ChevronDown size={12} className="ml-0.5" />
              </span>
            </div>

            {/* Account Hover Menu */}
            {showAccountMenu && (
              <div className="absolute top-full right-0 w-64 bg-white border border-gray-200 shadow-xl rounded-none py-2 z-50 transform translate-y-0">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                       <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" />
                       <div>
                         <p className="text-[13px] font-bold text-gray-900 leading-tight">{user.name}</p>
                         <p className="text-[11px] text-gray-500">Logged in</p>
                       </div>
                    </div>
                    <div className="py-2">
                      <a href={user.hasStore ? "/seller/dashboard" : "/seller/onboarding"} className="px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2">
                        <LayoutDashboard size={14} /> My Seller Portal
                      </a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2">
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[13px] font-bold text-gray-900 mb-4">Welcome to Ola.com</p>
                    
                    {/* UPDATED: Black TikTok Login Button with Official SVG Logo */}
                    <button 
                      onClick={handleTikTokLogin}
                      disabled={isAuthenticating}
                      className="flex items-center justify-center gap-2 w-full bg-black hover:bg-gray-900 text-white rounded-sm py-2.5 text-[13px] font-bold transition-colors disabled:opacity-70"
                    >
                      {isAuthenticating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.755 4.755 0 0 1-1.161-3.18H10.66v14.596a3.2 3.2 0 1 1-3.2-3.2 3.2 3.2 0 0 1 2.33 1.011v-3.468a6.56 6.56 0 1 0 4.27 6.06V9.452a8.174 8.174 0 0 0 5.53 2.05v-4.816z"/>
                          </svg>
                          Sign In with TikTok
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MESSAGES (NEWLY ADDED) */}
          <a href="/messages" className="flex flex-col items-center cursor-pointer group relative">
            <div className="relative">
              <MessageSquare size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
              <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                5
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span>
          </a>

          {/* Orders */}
          <div className="flex flex-col items-center cursor-pointer group">
            <Inbox size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Orders</span>
          </div>

          {/* Cart with Badge */}
          <div className="flex flex-col items-center cursor-pointer group relative">
            <div className="relative">
              <ShoppingCart size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
              <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                3
              </span>
            </div>
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span>
          </div>

        </div>
      </div>

      {/* ================= LEVEL 2: Bottom Navigation (Categories & Links) ================= */}
      <div className="w-full border-b border-gray-200 bg-white relative z-30">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-[13px] font-medium text-gray-700 h-10">
          
          {/* Left: Category Menu & Primary Links */}
          <div className="flex items-center gap-6 h-full">
            
            {/* MEGA MENU: Category Cascader */}
            <div className="relative h-full flex items-center" ref={categoryMenuRef}>
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-colors h-full px-1 ${showCategories ? 'text-[#FE2C55]' : 'hover:text-[#FE2C55]'}`}
                onClick={() => setShowCategories(!showCategories)}
              >
                <Menu size={16} />
                <span className="font-bold text-gray-900">All categories</span>
              </div>
              
              {/* Dynamic Category Mega Menu (Split Layout) */}
              {showCategories && (
                <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl z-50 flex rounded-none mt-[1px] min-h-[420px]">
                  
                  {isLoadingCategories ? (
                     <div className="w-[500px] flex flex-col items-center justify-center text-gray-400 py-12">
                       <Loader2 className="animate-spin mb-3" size={24} />
                       <span className="text-[13px]">Loading categories...</span>
                     </div>
                  ) : categoryTree.length === 0 ? (
                     <div className="w-[500px] flex items-center justify-center text-gray-500 text-[13px]">
                       No categories available.
                     </div>
                  ) : (
                    <>
                      {/* Left Column: Primary Categories (Hover Triggers) */}
                      <div className="w-64 border-r border-gray-100 py-2 bg-white shrink-0">
                        {categoryTree.map((cat, idx) => (
                          <div 
                            key={cat._id || cat.slug}
                            onMouseEnter={() => setHoveredCategory(idx)}
                            className={`px-4 py-3 text-[13px] cursor-default flex justify-between items-center transition-colors ${
                              hoveredCategory === idx ? 'bg-gray-50 text-[#FE2C55] font-semibold' : 'text-gray-700 hover:text-[#FE2C55]'
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span className={`text-base transition-all ${hoveredCategory === idx ? 'grayscale-0 opacity-100' : 'grayscale opacity-70'}`}>
                                {cat.icon}
                              </span> 
                              <span className="capitalize">{cat.name}</span>
                            </span>
                            <ChevronRight size={14} className={hoveredCategory === idx ? 'text-[#FE2C55]' : 'text-gray-300'} />
                          </div>
                        ))}
                      </div>

                      {/* Right Column: Subcategories (Clickable Links) */}
                      <div className="w-[500px] p-6 bg-white shrink-0">
                        {categoryTree[hoveredCategory] && (
                          <>
                            <h3 className="text-[15px] font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 capitalize">
                              {categoryTree[hoveredCategory].name}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                              {categoryTree[hoveredCategory].subCategories.map(sub => (
                                <div 
                                  key={sub._id || sub.slug}
                                  className="text-[13px] text-gray-600 hover:text-[#FE2C55] cursor-pointer transition-colors flex items-center group capitalize"
                                  onClick={() => {
                                    if(onCategorySelect) onCategorySelect(sub.slug);
                                    setShowCategories(false);
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 group-hover:bg-[#FE2C55] transition-colors"></span>
                                  {sub.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="hidden md:flex items-center gap-6 h-full">
              <span className="cursor-pointer hover:text-[#FE2C55] transition-colors px-1">Verified manufacturers</span>
              <span className="cursor-pointer hover:text-[#FE2C55] transition-colors px-1">Order protection</span>
            </div>
          </div>

          {/* Right: Secondary Links */}
          <div className="hidden lg:flex items-center gap-5 h-full text-[12px]">
            <span className="cursor-pointer hover:text-[#FE2C55] transition-colors">Ola Work</span>
            <span className="cursor-pointer hover:text-[#FE2C55] transition-colors">Buyer Central</span>
            <span className="cursor-pointer hover:text-[#FE2C55] transition-colors">App & extensions</span>
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            {/* Dynamic Seller Link */}
            <a 
              href={user?.hasStore ? "/seller/dashboard" : "/seller/onboarding"} 
              className="cursor-pointer hover:text-[#FE2C55] transition-colors font-bold text-gray-900"
            >
              Seller Portal
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}