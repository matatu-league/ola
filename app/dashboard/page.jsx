"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, MessageSquare, ClipboardList, DollarSign, 
  Heart, Bookmark, Package, Box, Grid, User, ChevronRight, 
  MapPin, ShoppingCart, Inbox, LogOut, Loader2, Headset, 
  Sparkles, ExternalLink, CreditCard, Flame
} from 'lucide-react';

// --- MOCK DASHBOARD DATA ---
const MOCK_STATS = {
  unreadMessages: "99+",
  newQuotes: "0",
  coupons: "0"
};

const MOCK_RECENT_ORDERS = [
  {
    id: "ORD-56001",
    store: "Shenzhen Precision Tools",
    status: "Waiting for payment",
    total: "56.00",
    variations: "1 variations , 1 items",
    image: "https://s.alicdn.com/@sc04/kf/H75677d704bb945d7a8d5db3214b7ec80j.jpg_120x120.jpg"
  },
  {
    id: "ORD-33502",
    store: "Hilda Welding Equipment",
    status: "Waiting for payment",
    total: "33.50",
    variations: "No variation , 1 items",
    image: "https://s.alicdn.com/@sc04/kf/H5507eaab4ec64ba5ac05a766324b13ee6.jpg_120x120.jpg"
  },
  {
    id: "ORD-20003",
    store: "Guangdong Electrical Controls",
    status: "Waiting for payment",
    total: "200.00",
    variations: "No variation , 10 items",
    image: "https://s.alicdn.com/@sc04/kf/H31cf7ab63e5b4b1a8f6a9e1e90e791b4L.jpg_120x120.jpg"
  }
];

const MOCK_FAVORITES = [
  { title: "Electric Utility Vehicle", price: "US$1,050-1,150", moq: "2 sets", image: "https://s.alicdn.com/@sc04/kf/H22ea7945d8b24d7cb0ef19602fa9c661P.jpg_120x120.jpg" },
  { title: "Double Glazed Window", price: "US$10-12", moq: "2 pieces", image: "https://s.alicdn.com/@sc04/kf/He4b3a4a1c5d947b1897e974e8b3941450.jpg_120x120.jpg" }
];

const MOCK_HISTORY = [
  { title: "Heavy Duty Wood Chipper", price: "US$6,900-7,200", moq: "1 set", image: "https://s.alicdn.com/@sc04/kf/H7e85c29cc6c84c17b5f63d6f734dc386K.jpg_120x120.jpg" },
  { title: "Mini Smart Ev Car", price: "US$590-690", moq: "10 unit", image: "https://s.alicdn.com/@sc04/kf/H7b0a880017db4b1da9895c1a880629ceX.jpg_120x120.jpg" }
];

// ==========================================
// 0. DYNAMIC BUYER TOP NAV
// ==========================================
const BuyerTopNav = () => {
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
      if (sessionCookie) {
        try {
          let decoded = decodeURIComponent(sessionCookie.substring(sessionCookie.indexOf('=') + 1));
          if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
          setUser(JSON.parse(decoded));
        } catch (e) {
          console.error("Failed to parse session", e);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.reload();
  };

  const handleTikTokLogin = async () => {
    setIsAuthenticating(true);
    setTimeout(() => setIsAuthenticating(false), 2000); 
  };

  return (
    <header className="bg-white flex flex-col w-full z-50 border-b border-gray-200 shrink-0">
      <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between gap-6 lg:gap-10">
        <div className="shrink-0 cursor-pointer select-none">
          <a href="/"><span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">Ola<span className="text-gray-900">.com</span></span></a>
        </div>
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
          <div className="hidden lg:flex items-center gap-2 cursor-pointer group">
            <MapPin size={18} className="text-gray-400 group-hover:text-[#FE2C55] transition-colors" />
            <div className="flex flex-col"><span className="text-[10px] text-gray-500 leading-none mb-0.5">Deliver to</span><span className="text-[12px] font-bold text-gray-900 leading-none">Uganda</span></div>
          </div>
          
          <div className="flex items-center gap-2 cursor-pointer group relative py-2" onMouseEnter={() => setShowAccountMenu(true)} onMouseLeave={() => setShowAccountMenu(false)}>
            {user?.avatar ? <img src={user.avatar} className="w-6 h-6 rounded-full border border-gray-200 object-cover" /> : <User size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />}
            <div className="hidden md:flex flex-col"><span className="text-[10px] text-gray-500 leading-none mb-0.5">{user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In'}</span><span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">Account <ChevronRight size={12} className="ml-0.5 rotate-90" /></span></div>
            {showAccountMenu && (
              <div className="absolute top-full right-0 w-64 bg-white border border-gray-200 shadow-xl py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                       <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" />
                       <div><p className="text-[13px] font-bold text-gray-900">{user.name}</p><p className="text-[11px] text-gray-500">Logged in</p></div>
                    </div>
                    <div className="py-2">
                      <a href="/seller/dashboard" className="px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2"><LayoutDashboard size={14} /> My Seller Portal</a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-[#FE2C55] flex items-center gap-2"><LogOut size={14} /> Log Out</button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[13px] font-bold text-gray-900 mb-4">Welcome to Ola.com</p>
                    <button onClick={handleTikTokLogin} disabled={isAuthenticating} className="flex items-center justify-center gap-2 w-full bg-black hover:bg-gray-900 text-white rounded-sm py-2.5 text-[13px] font-bold transition-colors disabled:opacity-70">
                      {isAuthenticating ? <Loader2 size={16} className="animate-spin" /> : 'Sign In with TikTok'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <a href="/messages" className="flex flex-col items-center cursor-pointer group">
            <MessageSquare size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" /><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span>
          </a>
          <a href="/orders" className="flex flex-col items-center cursor-pointer group">
            <Inbox size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" /><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Orders</span>
          </a>
          <div className="flex flex-col items-center cursor-pointer group relative">
            <ShoppingCart size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" /><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// 1. SIDE NAVIGATION (Dashboard Active Layout)
// ==========================================
const SideNavigation = () => {
  return (
    <div className="w-[260px] h-full bg-[#F5F6F8] border-r border-gray-200 flex flex-col overflow-y-auto p-4 flex-shrink-0 hidden md:flex select-none justify-between">
      <div>
        {/* Top-Level Dashboard Pill (Active) */}
        <div className="bg-black text-white rounded-lg p-3 flex items-center gap-3 mb-6 shadow-sm cursor-pointer font-bold">
          <LayoutDashboard size={20} className="text-white" />
          <span className="text-[15px]">Dashboard</span>
        </div>

        {/* Online Trading Section */}
        <div className="mb-6">
          <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Online trading</div>
          <div className="space-y-1">
            <a href="/messages" className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3"><MessageSquare size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Messages</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </a>
            <a href="/orders" className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3"><ClipboardList size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Orders</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </a>
            <a href="/payments" className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3"><DollarSign size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Payment</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </a>
            <a href="/saved" className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3"><Heart size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Saved & history</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </a>
          </div>
        </div>

        {/* Add-on Services Section */}
        <div className="mb-6">
          <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Add-on services</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3"><Bookmark size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Subscription</span><span className="text-[10px] font-bold text-[#FE2C55] bg-[#FE2C55]/10 px-1.5 py-0.5 rounded">New</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3"><Package size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Logistics services</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3"><Box size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Reseller Hub</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3"><Grid size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">More services</span></div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Settings</div>
          <div className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer group">
            <User size={18} className="text-gray-500 group-hover:text-black" /><span className="text-[14px]">Account settings</span>
          </div>
        </div>
      </div>

      {/* Bottom Promo Content */}
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
        {/* Accio/AI Work Banner */}
        <div className="bg-[#FFF4F3] border border-[#FEE2E2] rounded-xl p-3 relative overflow-hidden group">
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">×</button>
          <div className="flex items-center gap-1.5 text-[#FE2C55] font-bold text-[13px] mb-1">
            <Sparkles size={14} className="fill-[#FE2C55]" /> Try Ola AI Work
          </div>
          <p className="text-[11px] text-gray-600 mb-3 leading-snug max-w-[180px]">
            From AI agents to built-in tools, work faster in one place
          </p>
          <button className="bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
            Get started
          </button>
        </div>

        {/* Explore Link */}
        <div className="flex items-center gap-2 px-1 text-gray-700 hover:text-black cursor-pointer font-bold text-[13px]">
          <ExternalLink size={16} className="text-gray-500" /> Explore seller site
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE CONTENT
// ==========================================
export default function DashboardPage() {
  const [activeOrderTab, setActiveOrderTab] = useState('all');

  const ORDER_TABS = ['All', 'Confirming', 'Unpaid', 'Preparing to ship', 'Delivering', 'Refunds & after-sales'];

  return (
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden font-sans">
      <BuyerTopNav />
      <div className="flex flex-1 w-full overflow-hidden">
        <SideNavigation />
        
        {/* Main Content Area */}
        <div className="flex-1 h-full bg-[#F5F6F8] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
            
            {/* Top Row: User Profile Overview Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 border-2 border-orange-200 rounded-full flex items-center justify-center text-2xl shrink-0">
                    🦁
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-extrabold text-gray-900">rumbilha</h2>
                      <span className="bg-[#1890FF] text-white text-[10px] font-bold px-2 py-0.5 rounded">Scaleup</span>
                    </div>
                    <a href="/profile" className="text-[12px] text-gray-500 underline hover:text-black mt-0.5 inline-block font-medium">
                      Profile
                    </a>
                  </div>
                </div>

                <button className="flex items-center gap-2 text-[13px] font-bold text-gray-800 hover:text-black border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors self-start md:self-auto">
                  <Headset size={16} className="text-gray-500" /> Online support
                </button>
              </div>

              {/* Stats Columns */}
              <div className="grid grid-cols-3 text-center py-6 border-b border-gray-100 divide-x divide-gray-100">
                <div>
                  <div className="text-2xl font-black text-gray-900">{MOCK_STATS.unreadMessages}</div>
                  <div className="text-[12px] text-gray-500 font-medium mt-1">Unread messages</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">{MOCK_STATS.newQuotes}</div>
                  <div className="text-[12px] text-gray-500 font-medium mt-1">New quotes</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">{MOCK_STATS.coupons}</div>
                  <div className="text-[12px] text-gray-500 font-medium mt-1">Coupons</div>
                </div>
              </div>

              {/* Footer Banner Inside Card */}
              <div className="pt-4 flex items-center justify-between text-[13px]">
                <span className="text-gray-600 font-medium">Personalize your Ola.com experience</span>
                <a href="/profile/edit" className="text-black font-bold hover:underline flex items-center">
                  Complete profile <ChevronRight size={14} className="ml-0.5" />
                </a>
              </div>
            </div>

            {/* Split Layout: Orders on Left, Promos & Histories on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT MAIN (2 Columns Span): Orders Preview Block */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-extrabold text-gray-900">Orders</h3>
                  <a href="/orders" className="text-[13px] font-bold text-gray-600 hover:text-black flex items-center">
                    View all <ChevronRight size={14} className="ml-0.5" />
                  </a>
                </div>

                {/* Orders Internal Tabs */}
                <div className="flex gap-2 border-b border-gray-100 pb-3 mb-6 overflow-x-auto hide-scrollbar shrink-0">
                  {ORDER_TABS.map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveOrderTab(tab.toLowerCase())}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${
                        activeOrderTab === tab.toLowerCase() || (activeOrderTab === 'all' && tab === 'All') 
                          ? 'bg-black text-white' 
                          : 'border border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Order List */}
                <div className="space-y-6 flex-1">
                  {MOCK_RECENT_ORDERS.map((order, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-6 border-b border-gray-100 last:border-none last:pb-0">
                      <div className="flex gap-4 w-full sm:w-auto flex-1">
                        <div className="w-[72px] h-[72px] bg-[#F7F8FA] border border-gray-100 rounded-lg p-1 shrink-0 overflow-hidden">
                          <img src={order.image} alt="Preview" className="w-full h-full object-cover mix-blend-multiply" />
                        </div>
                        <div className="flex flex-col justify-between py-0.5">
                          <div>
                            <span className="text-[13px] font-bold text-gray-900 block">{order.status}</span>
                            <span className="text-[12px] text-gray-500 mt-1 block">Total: <strong className="text-gray-900">USD {order.total}</strong></span>
                          </div>
                          <span className="text-[11px] text-gray-400">{order.variations}</span>
                        </div>
                      </div>

                      {/* Card Buttons Actions */}
                      <div className="flex flex-col gap-2 w-full sm:w-[150px] shrink-0">
                        <button className="w-full bg-[#E04006] hover:bg-[#c93905] text-white font-bold py-1.5 rounded-full text-[12px] transition-colors">
                          Make payment
                        </button>
                        <button className="w-full bg-white border border-gray-300 text-gray-800 hover:border-gray-900 hover:text-black font-bold py-1.5 rounded-full text-[12px] transition-colors">
                          View order details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: Secondary Cards Stack */}
              <div className="space-y-6">
                
                {/* Favorites Widget */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-extrabold text-gray-900">Favorites</h3>
                    <a href="/saved" className="text-[12px] font-bold text-gray-500 hover:text-black flex items-center">
                      View all <ChevronRight size={14} />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_FAVORITES.map((item, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="w-full aspect-square bg-[#F7F8FA] border border-gray-100 rounded-lg p-2 mb-2 flex items-center justify-center">
                          <img src={item.image} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="font-extrabold text-[13px] text-gray-900 truncate">{item.price}</div>
                        <div className="text-[11px] text-gray-400 truncate">Min. order: {item.moq}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Browsing History Widget */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-extrabold text-gray-900">Browsing history</h3>
                    <a href="/saved" className="text-[12px] font-bold text-gray-500 hover:text-black flex items-center">
                      View all <ChevronRight size={14} />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_HISTORY.map((item, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="w-full aspect-square bg-[#F7F8FA] border border-gray-100 rounded-lg p-2 mb-2 flex items-center justify-center">
                          <img src={item.image} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="font-extrabold text-[13px] text-gray-900 truncate">{item.price}</div>
                        <div className="text-[11px] text-gray-400 truncate">Min. order: {item.moq}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promotions Stack Widget */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-3">
                  <h3 className="text-[16px] font-extrabold text-gray-900 mb-1">Promotion</h3>
                  
                  {/* Banner 1 */}
                  <div className="bg-[#FFF8F6] border border-[#FEECE8] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-orange-200 transition-colors">
                    <div>
                      <h4 className="font-bold text-[13px] text-gray-900">Pay Later for Business</h4>
                      <span className="text-[#E04006] text-[11px] font-bold flex items-center gap-0.5 mt-1">
                        Apply now <ChevronRight size={12} />
                      </span>
                    </div>
                    <CreditCard size={28} className="text-[#E04006] opacity-30 shrink-0" />
                  </div>

                  {/* Banner 2 */}
                  <div className="bg-[#FFF6F5] border border-[#FEE8E7] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-red-200 transition-colors">
                    <div>
                      <h4 className="font-bold text-[13px] text-gray-900">Bring your site to next level</h4>
                      <span className="text-[#FE2C55] text-[11px] font-bold flex items-center gap-0.5 mt-1">
                        Learn more <ChevronRight size={12} />
                      </span>
                    </div>
                    <Flame size={28} className="text-[#FE2C55] opacity-30 shrink-0" />
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}