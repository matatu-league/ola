"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ClipboardList, DollarSign, Heart, Bookmark, 
  Package, Box, Grid, User, ChevronRight, Search, MapPin, 
  ShoppingCart, Inbox, LogOut, LayoutDashboard, Loader2,
  ScanSearch, MoreHorizontal, ShieldCheck
} from 'lucide-react';

// --- MOCK SAVED PRODUCTS ---
const MOCK_SAVED = [
  {
    id: 1,
    title: "WIFI RF Rolling Code Automatic Curtain Module Switch Electric Roller Shutter Mot...",
    price: "$6.5 - $9.99",
    moq: "50 pieces",
    image: "https://s.alicdn.com/@sc04/kf/H31cf7ab63e5b4b1a8f6a9e1e90e791b4L.jpg_300x300.jpg",
    supplier: "Shenzhen Huafangyuan Electronic Co., Ltd.",
    years: "9yrs",
    country: "China",
    verified: true,
    guaranteed: false,
    rating: 0
  },
  {
    id: 2,
    title: "KONST DC Motor Forward Reverse Speed Control Switch for Lifting Equipment...",
    price: "$6.3 - $7.3",
    moq: "1 set",
    image: "https://s.alicdn.com/@sc04/kf/H75677d704bb945d7a8d5db3214b7ec80j.jpg_300x300.jpg",
    supplier: "Shenzhen Konst Electronic Technology Co., Ltd.",
    years: "3yrs",
    country: "China",
    verified: false,
    guaranteed: false,
    rating: 0
  },
  {
    id: 3,
    title: "5500W Smart Portable Instant Electric Water Heater For Bathroom Shower",
    price: "$22.0",
    moq: "1 piece",
    image: "https://s.alicdn.com/@sc04/kf/H5507eaab4ec64ba5ac05a766324b13ee6.jpg_300x300.jpg",
    supplier: "Zhongshan Yihouse Electric Co., Ltd.",
    years: "9yrs",
    country: "China",
    verified: false,
    guaranteed: true,
    rating: 4
  },
  {
    id: 4,
    title: "230V 5.5kW Glass Panel Bathroom Tankless Electric Hot Water Heater with Hand...",
    price: "$26.0 - $38.0",
    moq: "1 piece",
    image: "https://s.alicdn.com/@sc04/kf/He4b3a4a1c5d947b1897e974e8b3941450.jpg_300x300.jpg",
    supplier: "Zhongshan Yihouse Electric Co., Ltd.",
    years: "9yrs",
    country: "China",
    verified: false,
    guaranteed: true,
    rating: 4
  }
];

// ==========================================
// 0. BUYER TOP NAV (Dynamic User Auth)
// ==========================================
const BuyerTopNav = () => {
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
    if (sessionCookie) {
      try {
        const rawValue = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
        let decodedValue = decodeURIComponent(rawValue);
        if (decodedValue.startsWith('%7B')) decodedValue = decodeURIComponent(decodedValue);
        setUser(JSON.parse(decodedValue));
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  };

  const handleTikTokLogin = async () => {
    setIsAuthenticating(true);
    // Add real PKCE logic here from main TopNav when integrating
    setTimeout(() => setIsAuthenticating(false), 2000); 
  };

  return (
    <header className="bg-white flex flex-col w-full z-50 border-b border-gray-200 shrink-0">
      <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between gap-6 lg:gap-10">
        <div className="shrink-0 cursor-pointer select-none">
          <a href="/">
            <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">Ola<span className="text-gray-900">.com</span></span>
          </a>
        </div>
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
          <div className="hidden lg:flex items-center gap-2 cursor-pointer group">
            <MapPin size={18} className="text-gray-400 group-hover:text-[#FE2C55]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 leading-none mb-0.5">Deliver to</span>
              <span className="text-[12px] font-bold text-gray-900 leading-none">Uganda</span>
            </div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group relative py-2" onMouseEnter={() => setShowAccountMenu(true)} onMouseLeave={() => setShowAccountMenu(false)}>
            {user?.avatar ? <img src={user.avatar} className="w-6 h-6 rounded-full border" /> : <User size={22} className="text-gray-700" />}
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-gray-500 leading-none mb-0.5">{user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In'}</span>
              <span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">Account <ChevronRight size={12} className="ml-0.5 rotate-90" /></span>
            </div>
            {showAccountMenu && (
              <div className="absolute top-full right-0 w-64 bg-white border shadow-xl py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b flex items-center gap-3">
                       <img src={user.avatar} className="w-10 h-10 rounded-full" />
                       <div><p className="text-[13px] font-bold text-gray-900">{user.name}</p><p className="text-[11px] text-gray-500">Logged in</p></div>
                    </div>
                    <div className="py-2">
                      <a href="/seller/dashboard" className="px-4 py-2 text-[13px] hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2"><LayoutDashboard size={14} /> My Seller Portal</a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2"><LogOut size={14} /> Log Out</button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[13px] font-bold text-gray-900 mb-4">Welcome to Ola.com</p>
                    <button onClick={handleTikTokLogin} disabled={isAuthenticating} className="flex items-center justify-center gap-2 w-full bg-black text-white rounded-sm py-2.5 text-[13px] font-bold">
                      {isAuthenticating ? <Loader2 size={16} className="animate-spin" /> : 'Sign In with TikTok'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <a href="/messages" className="flex flex-col items-center cursor-pointer group">
            <MessageSquare size={22} className="text-gray-700 hover:text-[#FE2C55]" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span>
          </a>
          <a href="/orders" className="flex flex-col items-center cursor-pointer group">
            <Inbox size={22} className="text-gray-700 hover:text-[#FE2C55]" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Orders</span>
          </a>
          <div className="flex flex-col items-center cursor-pointer group relative">
            <ShoppingCart size={22} className="text-gray-700 hover:text-[#FE2C55]" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// 1. SIDE NAVIGATION (Dynamic Active State)
// ==========================================
const SideNavigation = ({ activeTab }) => {
  return (
    <div className="w-[280px] h-full bg-[#F5F6F8] border-r border-gray-200 flex flex-col overflow-y-auto p-4 flex-shrink-0 hidden md:flex">
      <a href="/messages" className="bg-transparent rounded-xl p-3 flex items-center justify-between mb-1 hover:bg-[#EAECEF] transition-colors group">
        <div className="flex items-center gap-3"><MessageSquare size={20} className="text-gray-600 group-hover:text-black" /><span className="text-[15px] text-gray-700 group-hover:text-black">Messages</span></div>
      </a>
      <a href="/orders" className="bg-transparent rounded-xl p-3 flex items-center justify-between mb-6 hover:bg-[#EAECEF] transition-colors group">
        <div className="flex items-center gap-3"><ClipboardList size={20} className="text-gray-600 group-hover:text-black" /><span className="text-[15px] text-gray-700 group-hover:text-black">Orders</span></div>
      </a>

      <div className="bg-transparent space-y-1 mb-6">
        <a href="/payments" className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'payment' ? 'bg-white shadow-sm border border-gray-100 font-bold text-black' : 'hover:bg-gray-100 text-gray-700'}`}>
          <DollarSign size={20} className={activeTab === 'payment' ? 'text-black' : 'text-gray-600'} /> <span className="text-[15px]">Payment</span>
        </a>
        <a href="/saved" className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'saved' ? 'bg-white shadow-sm border border-gray-100 font-bold text-black' : 'hover:bg-gray-100 text-gray-700'}`}>
          <Heart size={20} className={activeTab === 'saved' ? 'text-black fill-black' : 'text-gray-600'} /> <span className="text-[15px]">Saved & history</span>
        </a>
      </div>

      <div className="bg-transparent space-y-1 border-t border-gray-200 pt-4 mb-6">
        <div className="p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 text-gray-700 cursor-pointer"><Bookmark size={20} className="text-gray-600"/> <span className="text-[15px]">Subscription</span> <span className="text-[11px] font-bold text-[#E53935] ml-1">New</span></div>
        <div className="p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 text-gray-700 cursor-pointer"><Package size={20} className="text-gray-600"/> <span className="text-[15px]">Logistics services</span></div>
        <div className="p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 text-gray-700 cursor-pointer"><Box size={20} className="text-gray-600"/> <span className="text-[15px]">Reseller Hub</span></div>
      </div>

      <div className="bg-transparent space-y-1 border-t border-gray-200 pt-4 mt-auto">
        <div className="p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 text-gray-700 cursor-pointer"><User size={20} className="text-gray-600"/> <span className="text-[15px]">Account settings</span></div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE EXPORT
// ==========================================
export default function FavoritesPage() {
  const [activeInnerTab, setActiveInnerTab] = useState('products');
  const [activeList, setActiveList] = useState('all');

  return (
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden font-sans">
      <BuyerTopNav />
      <div className="flex flex-1 w-full overflow-hidden">
        <SideNavigation activeTab="saved" />
        
        {/* Main Content Area */}
        <div className="flex-1 h-full bg-white overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            
            {/* Header & Tabs */}
            <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight mb-6">Favorites</h1>
            <div className="flex gap-6 border-b border-gray-200 mb-8">
              <div 
                className={`pb-3 cursor-pointer text-[15px] font-bold relative ${activeInnerTab === 'products' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveInnerTab('products')}
              >
                Products
                {activeInnerTab === 'products' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm"></div>}
              </div>
              <div 
                className={`pb-3 cursor-pointer text-[15px] font-bold relative ${activeInnerTab === 'suppliers' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveInnerTab('suppliers')}
              >
                Suppliers
                {activeInnerTab === 'suppliers' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm"></div>}
              </div>
            </div>

            {/* Content Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Inner Sidebar: Lists */}
              <div className="w-full lg:w-[200px] shrink-0">
                <h3 className="font-bold text-[16px] text-gray-900 mb-4">My list</h3>
                <button className="text-[13px] text-gray-900 underline mb-4 hover:text-[#FF6A00] transition-colors">Create a list</button>
                
                <div className="space-y-1 mt-2">
                  <div 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${activeList === 'all' ? 'bg-[#F8F8F8] font-bold text-gray-900' : 'text-gray-700 hover:bg-[#F8F8F8]'}`}
                    onClick={() => setActiveList('all')}
                  >
                    <div className="text-[14px]">All</div>
                    <div className="text-[12px] text-gray-500 font-normal">34 items</div>
                  </div>
                  <div 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${activeList === 'ungrouped' ? 'bg-[#F8F8F8] font-bold text-gray-900' : 'text-gray-700 hover:bg-[#F8F8F8]'}`}
                    onClick={() => setActiveList('ungrouped')}
                  >
                    <div className="text-[14px]">Ungrouped</div>
                    <div className="text-[12px] text-gray-500 font-normal">34 items</div>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {MOCK_SAVED.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-[12px] overflow-hidden group bg-white flex flex-col hover:shadow-lg transition-shadow">
                    
                    {/* Image Area */}
                    <div className="w-full aspect-square bg-[#F7F8FA] relative p-4 flex items-center justify-center">
                      <img src={item.image} alt="Product" className="w-full h-full object-contain mix-blend-multiply" />
                      
                      {/* Heart Icon (Favorite) */}
                      <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 transition-transform">
                        <Heart size={16} className="text-[#FF6A00] fill-[#FF6A00]" />
                      </div>
                      
                      {/* Scan / Find Similar */}
                      <div className="absolute bottom-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-white transition-colors group/scan relative">
                        <ScanSearch size={16} className="text-gray-700" />
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-[12px] px-3 py-1.5 rounded opacity-0 group-hover/scan:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                          Find similar items
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4 flex flex-col flex-1">
                      
                      {item.guaranteed && (
                        <div className="flex items-center gap-1 text-[13px] font-bold mb-1">
                          <span className="text-[#FF6A00]">Ola</span>
                          <span className="text-black">Guaranteed</span>
                        </div>
                      )}

                      <h4 className="text-[13px] text-gray-800 leading-snug line-clamp-2 mb-3 hover:underline cursor-pointer">
                        {item.title}
                      </h4>
                      
                      <div className="mt-auto">
                        <div className="font-extrabold text-[18px] text-gray-900 mb-0.5">{item.price}</div>
                        <div className="text-[12px] text-gray-500 mb-3">Min. order: {item.moq}</div>
                        
                        {/* Supplier Info */}
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5">
                          {item.verified && <span className="text-blue-600 font-bold flex items-center gap-0.5"><ShieldCheck size={12}/> Verified</span>}
                          {!item.verified && item.rating > 0 && (
                            <div className="flex items-center text-[#FF6A00]">
                              {[...Array(4)].map((_, i) => <span key={i} className="text-[10px]">💎</span>)}
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mb-4">
                          {item.years} {item.country} <span className="hover:underline cursor-pointer">{item.supplier}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {item.guaranteed ? (
                            <button className="flex-1 bg-[#FF6A00] hover:bg-[#e65f00] text-white font-bold py-1.5 rounded-full text-[13px] transition-colors">
                              Add to cart
                            </button>
                          ) : (
                            <button className="flex-1 bg-white border border-gray-400 hover:border-gray-900 hover:text-black text-gray-800 font-bold py-1.5 rounded-full text-[13px] transition-colors">
                              Chat now
                            </button>
                          )}
                          <button className="w-[32px] h-[32px] shrink-0 border border-gray-400 hover:border-gray-900 rounded-full flex items-center justify-center text-gray-600 hover:text-black transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}