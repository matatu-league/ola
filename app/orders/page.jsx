"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { 
  MessageSquare, ClipboardList, DollarSign, Heart, Bookmark, 
  Package, Box, Grid, User, ChevronRight, ChevronDown,
  Search, ShieldCheck, MapPin, ShoppingCart, Inbox, LogOut, 
  LayoutDashboard, Loader2, Calendar, Info
} from 'lucide-react';

// --- MOCK ORDERS DATA ---
const MOCK_ORDERS = [
  {
    id: "300746355001021351",
    date: "10 May 2026, GMT-07:00",
    total: "155.00",
    storeName: "Zhongshan Yihouse Electric Co., Ltd.",
    status: "Waiting for payment",
    statusId: "unpaid",
    items: [
      {
        title: "5500W Mini Water Heater Bathroom Electric Bathing Heater Hot Water Heater",
        variant: "black F1-H, without plug, 220 x 1 items",
        image: "https://s.alicdn.com/@sc04/kf/H5507eaab4ec64ba5ac05a766324b13ee6.jpg_120x120.jpg"
      },
      {
        title: "DC 24V/48V Solar Induction Stove Battery-Powered New Design for Indoor/Outdoor Use Inspired US Hotels Cars RVs",
        variant: "Black DC 24v induction cooker, no plug, DC 24V x 2 items",
        image: "https://s.alicdn.com/@sc04/kf/H7e85c29cc6c84c17b5f63d6f734dc386K.jpg_120x120.jpg"
      }
    ]
  },
  {
    id: "224603226501021351",
    date: "2024-09-18",
    total: "44.00",
    storeName: "Zhejiang Jingquanda Environmental Protection Technology ...",
    status: "Waiting for payment",
    statusId: "unpaid",
    items: [
      {
        title: "Ultrafiltration Water Purifiers Ultrawf Household Water Filters under Sink Auto Back Wash 40 Micron Pre-Filtter",
        variant: "US, silver x 2 items",
        image: "https://s.alicdn.com/@sc04/kf/H7b0a880017db4b1da9895c1a880629ceX.jpg_120x120.jpg"
      }
    ]
  },
  {
    id: "998877665544332211",
    date: "2024-08-10",
    total: "890.00",
    storeName: "Shenzhen Advanced Tech Co., Ltd.",
    status: "Completed",
    statusId: "completed",
    items: [
      {
        title: "Industrial Grade High Precision 3D Printer for Manufacturing",
        variant: "Standard Edition, 110V x 1 items",
        image: "https://s.alicdn.com/@sc04/kf/H22ea7945d8b24d7cb0ef19602fa9c661P.jpg_120x120.jpg"
      }
    ]
  }
];

// ==========================================
// 0. BUYER TOP NAV (Dynamic User Auth)
// ==========================================
const BuyerTopNav = () => {
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  const handleLogout = () => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  };

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
    <header className="bg-white flex flex-col w-full z-50 border-b border-gray-200 shrink-0">
      <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between gap-6 lg:gap-10">
        <div className="shrink-0 cursor-pointer select-none">
          <a href="/">
            <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">
              Ola<span className="text-gray-900">.com</span>
            </span>
          </a>
        </div>
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
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
                Account <ChevronRight size={12} className="ml-0.5 rotate-90" />
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

          <a href="/messages" className="flex flex-col items-center cursor-pointer group">
            <MessageSquare size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span>
          </a>
          <a href="/orders" className="flex flex-col items-center cursor-pointer relative">
            <Inbox size={22} className="text-[#FE2C55]" />
            <span className="text-[11px] font-bold text-[#FE2C55] mt-1 hidden md:block">Orders</span>
          </a>
          <div className="flex flex-col items-center cursor-pointer group relative">
            <ShoppingCart size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// 1. SIDE NAVIGATION (Orders Active)
// ==========================================
const SideNavigation = () => {
  return (
    <div className="w-[280px] h-full bg-[#F5F6F8] border-r border-gray-200 flex flex-col overflow-y-auto p-4 flex-shrink-0 hidden md:flex">
      
      {/* Messages (Gray Card) */}
      <a href="/messages" className="bg-[#EAECEF] rounded-xl p-4 flex items-center justify-between mb-3 cursor-pointer hover:bg-[#e1e4e8] transition-colors">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-gray-700" />
          <span className="text-[15px] text-gray-800">Messages</span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </a>

      {/* Orders (Active Card) */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between mb-6 shadow-sm cursor-pointer border border-gray-100">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-black fill-black" />
          <span className="font-bold text-[15px] text-black">Orders</span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Main Menu Group */}
      <div className="bg-transparent space-y-1 mb-6">
        <MenuItem icon={<DollarSign size={20} />} label="Payment" />
        <MenuItem icon={<Heart size={20} />} label="Saved & history" />
      </div>

      <div className="bg-transparent space-y-1 border-t border-gray-200 pt-4 mb-6">
        <MenuItem icon={<Bookmark size={20} />} label="Subscription" badge="New" />
        <MenuItem icon={<Package size={20} />} label="Logistics services" />
        <MenuItem icon={<Box size={20} />} label="Reseller Hub" />
        <MenuItem icon={<Grid size={20} />} label="More services" />
      </div>

      {/* Footer Group */}
      <div className="bg-transparent space-y-1 border-t border-gray-200 pt-4 mt-auto">
        <MenuItem icon={<User size={20} />} label="Account settings" hideChevron />
      </div>

    </div>
  );
};

const MenuItem = ({ icon, label, badge, hideChevron }) => (
  <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group">
    <div className="flex items-center gap-3">
      <div className="text-gray-600 group-hover:text-black transition-colors">{icon}</div>
      <span className="text-[15px] text-gray-700 group-hover:text-black transition-colors">{label}</span>
      {badge && (
        <span className="text-[11px] font-bold text-[#E53935] ml-1">{badge}</span>
      )}
    </div>
    {!hideChevron && <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />}
  </div>
);

// ==========================================
// 2. MAIN ORDERS CONTENT (With URL Params)
// ==========================================
const OrdersContent = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Read active tab from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'confirming', label: 'Confirming', count: 1 },
    { id: 'unpaid', label: 'Unpaid', count: 4 },
    { id: 'preparing', label: 'Preparing to ship' },
    { id: 'delivering', label: 'Delivering' },
    { id: 'refunds', label: 'Refunds & after-sales' },
    { id: 'completed', label: 'Completed & in review' },
    { id: 'closed', label: 'Closed', count: 3 },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = MOCK_ORDERS.filter(order => {
    if (activeTab === 'all') return true;
    return order.statusId === activeTab;
  });

  return (
    <div className="flex-1 h-full bg-white overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Your orders</h1>
          <button className="px-5 py-2 border border-gray-900 rounded-full text-[13px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            Submit remittance proof
          </button>
        </div>

        {/* Tabs Row */}
        <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div 
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`pb-3 cursor-pointer text-[14px] transition-colors relative ${
                  isActive ? 'text-gray-900 font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} {tab.count && `(${tab.count})`}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 flex items-center border border-gray-300 rounded-md overflow-hidden hover:border-gray-400 focus-within:border-black transition-colors bg-white">
            <input 
              type="text" 
              placeholder="Search by name, order number, or other information" 
              className="flex-1 px-4 py-2 text-[13px] outline-none placeholder-gray-400"
            />
            <button className="px-4 py-2 border-l border-gray-200 hover:bg-gray-50 text-gray-600">
              <Search size={18} />
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white">
              <span className="text-[13px] text-gray-800 mr-2">Order date</span>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white w-[200px] justify-between">
              <span className="text-[13px] text-gray-400">Select time</span>
              <Calendar size={16} className="text-gray-500" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-[14px]">
              No orders found in this category.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                
                {/* Order Card Header */}
                <div className="bg-[#F8F8F8] px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-[12px] text-gray-600">
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-1.5 font-medium text-gray-800">
                      <ShieldCheck size={16} className="text-[#FF9900] fill-[#FF9900]/20" />
                      Order #{order.id}
                    </div>
                    <span>Order date: {order.date}</span>
                    <div className="flex items-center gap-1 text-gray-800">
                      Total: USD {order.total} <Info size={14} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Sold by: {order.storeName}</span>
                    <button className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                      <MessageSquare size={14} className="fill-blue-600/20" /> Chat now
                    </button>
                  </div>
                </div>

                {/* Order Card Body */}
                <div className="p-5 flex flex-col md:flex-row gap-6">
                  {/* Left Side: Status & Items */}
                  <div className="flex-1">
                    <h3 className="font-bold text-[14px] text-gray-900 mb-4">{order.status}</h3>
                    
                    <div className="space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 group cursor-pointer">
                          <div className="w-[80px] h-[80px] bg-gray-50 border border-gray-100 rounded-md overflow-hidden shrink-0">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[13px] text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                            <p className="text-[12px] text-gray-500 mt-1.5 flex items-start gap-1">
                              <span className="inline-block mt-0.5"><Box size={12} /></span> {item.variant}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="w-full md:w-[180px] shrink-0 flex flex-col gap-2.5 justify-center md:border-l md:border-gray-100 md:pl-6">
                    {order.statusId === 'unpaid' ? (
                      <button className="w-full bg-[#E04006] hover:bg-[#c93905] text-white font-bold py-2 px-4 rounded-full text-[13px] transition-colors">
                        Make payment
                      </button>
                    ) : order.statusId === 'completed' ? (
                      <button className="w-full bg-white border border-[#E04006] text-[#E04006] hover:bg-orange-50 font-bold py-2 px-4 rounded-full text-[13px] transition-colors">
                        Buy again
                      </button>
                    ) : null}
                    
                    <button className="w-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 font-bold py-2 px-4 rounded-full text-[13px] transition-colors">
                      View order details
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-1 text-[13px] font-bold text-gray-700 hover:text-black py-1 mt-1">
                      More actions <ChevronDown size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

// ==========================================
// PAGE EXPORT (Wrapped in Suspense for useSearchParams)
// ==========================================
export default function OrdersPage() {
  return (
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden font-sans">
      <BuyerTopNav />
      <div className="flex flex-1 w-full overflow-hidden">
        <SideNavigation />
        <Suspense fallback={
          <div className="flex-1 h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        }>
          <OrdersContent />
        </Suspense>
      </div>
    </div>
  );
}