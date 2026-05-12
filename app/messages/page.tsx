"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ClipboardList, DollarSign, Heart, Bookmark, 
  Package, Box, Grid, User, ChevronRight, 
  Search, ShieldCheck, Phone, Video, Smile, Image as ImageIcon, 
  Folder, Paperclip, MoreVertical, MapPin, ShoppingCart, Inbox,
  LogOut, LayoutDashboard, Loader2
} from 'lucide-react';

// --- MOCK DATA ---
const CHAT_LIST = [
  { id: 1, name: 'Fiona Ms', company: 'Hebei Rongztai Metal W...', preview: 'you want blackout or semi-bl...', date: '2026-04-09', unread: false, avatar: 'F' },
  { id: 2, name: 'Cathy Xu', company: 'Changzhou Newdoon Po...', preview: 'Hi! May I know the dropout a...', date: '2026-04-05', unread: true, avatar: 'C' },
  { id: 3, name: 'Joe Hu', company: 'Leading', preview: '[Video]', date: '2026-03-24', unread: false, avatar: 'J', isBrand: true },
  { id: 4, name: 'pang xiao', company: 'GuangDong Meizhou Cit...', preview: 'Thank you.', date: '2026-02-20', unread: false, avatar: 'P' },
  { id: 5, name: 'bai wei', company: 'GuangDong Meizhou Cit...', preview: '[Read] EOS 2011', date: '2026-02-20', unread: false, avatar: 'B', isBrand: true },
  { id: 6, name: 'Yuko Xuan', company: 'Guangzhou Vigor Health...', preview: 'Ok dear', date: '2026-02-18', unread: false, avatar: 'Y' },
];

// ==========================================
// 0. MESSAGE TOP NAV (Dynamic User, No Search, No Categories)
// ==========================================
const MessageTopNav = () => {
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
        
        {/* Left: Logo */}
        <div className="shrink-0 cursor-pointer select-none">
          <a href="/">
            <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">
              Ola<span className="text-gray-900">.com</span>
            </span>
          </a>
        </div>

        {/* Right: User Actions */}
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
          
          {/* Deliver To */}
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

          {/* Messages (Active) */}
          <a href="/messages" className="flex flex-col items-center cursor-pointer relative">
            <div className="relative">
              <MessageSquare size={22} className="text-[#FE2C55]" />
              <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                5
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#FE2C55] mt-1 hidden md:block">Messages</span>
          </a>

          {/* Orders */}
          <div className="flex flex-col items-center cursor-pointer group">
            <Inbox size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Orders</span>
          </div>

          {/* Cart */}
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
    </header>
  );
};

// ==========================================
// 1. SIDE NAVIGATION
// ==========================================
const SideNavigation = () => {
  return (
    <div className="w-[280px] h-full bg-[#F5F6F8] border-r border-gray-200 flex flex-col overflow-y-auto p-4 flex-shrink-0 hidden md:flex">
      
      {/* Messages (Active Card) */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between mb-3 shadow-sm cursor-pointer border border-gray-100">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-black fill-black" />
          <span className="font-bold text-[15px] text-black">Messages</span>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>

      {/* Orders (Gray Card) */}
      <div className="bg-[#EAECEF] rounded-xl p-4 flex items-center justify-between mb-6 cursor-pointer hover:bg-[#e1e4e8] transition-colors">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-gray-700" />
          <span className="text-[15px] text-gray-800">Orders</span>
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
// 2. CHAT INBOX LIST
// ==========================================
const ChatInbox = () => {
  return (
    <div className="w-full md:w-[320px] h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      
      {/* Header & Search */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[16px] text-gray-900">Inbox</h2>
          <div className="bg-gray-100 rounded-full p-1.5 cursor-pointer hover:bg-gray-200">
            <Search size={16} className="text-gray-600" />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center justify-between text-[13px] font-medium">
          <div className="flex gap-6">
            <div className="flex items-center gap-1 cursor-pointer border-b-2 border-black pb-2 text-black font-bold">
              <MessageSquare size={14} className="fill-black" /> All
            </div>
            <div className="flex items-center gap-1 cursor-pointer border-b-2 border-transparent pb-2 text-gray-500 hover:text-gray-800">
              <span className="relative">
                Unread
                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </span>
            </div>
          </div>
          <span className="text-gray-400 pb-2">143</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {CHAT_LIST.map((chat, idx) => (
          <div 
            key={chat.id} 
            className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${idx === 0 ? 'bg-[#F3F4F6]' : 'hover:bg-gray-50 border-b border-gray-50'}`}
          >
            <div className="relative">
              {chat.isBrand ? (
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg">
                  {chat.avatar}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {chat.avatar}
                </div>
              )}
              {idx === 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h4 className="text-[14px] font-bold text-gray-900 truncate pr-2">{chat.name}</h4>
                <span className="text-[11px] text-gray-400 flex-shrink-0">{chat.date}</span>
              </div>
              <p className="text-[12px] text-gray-500 truncate mb-0.5">{chat.company}</p>
              <p className="text-[12px] text-gray-800 truncate">{chat.preview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN CHAT AREA
// ==========================================
const ChatArea = () => {
  const [inputText, setInputText] = useState('');

  return (
    <div className="flex-1 h-full bg-[#F8F9FA] hidden md:flex flex-col relative">
      
      {/* Header */}
      <div className="h-[60px] bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[16px] text-gray-900">Fiona Ms</h2>
          <span className="text-gray-400 text-[12px] flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            12:03 AM Local Time
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <Phone size={18} className="cursor-pointer hover:text-gray-800" />
          <Video size={18} className="cursor-pointer hover:text-gray-800" />
          <User size={18} className="cursor-pointer hover:text-gray-800" />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        
        {/* Trust Notice */}
        <div className="mx-auto bg-[#F0FDF4] border border-[#BBF7D0] rounded-md py-2.5 px-4 flex items-center gap-2 mb-8 shadow-sm">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="text-[13px] text-gray-800">
            Keep chats and transactions on Ola.com to enjoy order protection. <a href="#" className="text-gray-900 underline">Learn more</a>
          </span>
        </div>

        {/* Messages */}
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          
          <div className="flex flex-col items-center gap-6">
            <span className="text-[11px] text-gray-400">2026-04-08 21:54</span>
            <div className="flex items-start gap-3 w-full flex-row-reverse">
               <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold flex-shrink-0">
                 ME
               </div>
               <div className="flex flex-col items-end">
                 <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tr-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                   hi
                 </div>
                 <span className="text-[11px] text-gray-400 mt-1">Read</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-6">
            <span className="text-[11px] text-gray-400 self-center">2026-04-09 04:16</span>
            <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                 F
               </div>
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                 hi
               </div>
            </div>
          </div>

          {/* Translation Notice */}
          <div className="mx-auto bg-white border border-gray-100 rounded-full py-2 px-6 shadow-sm text-[12px] text-gray-500 my-2">
            Need translation? Try our automatic translation feature for smoother communication. <a href="#" className="text-blue-600 font-medium">Try now</a>
          </div>

          <div className="flex flex-col items-start gap-6">
            <span className="text-[11px] text-gray-400 self-center">2026-04-09 05:12</span>
            
            <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                 F
               </div>
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                 you need honeycomb fabric?
               </div>
            </div>

            <div className="flex items-start gap-3 w-full">
               <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 opacity-0">
                 F
               </div>
               <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none py-2.5 px-4 text-[13px] text-gray-800 max-w-[400px]">
                 you want blackout or semi-black?
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0 relative">
        
        {/* Quick Action Chips */}
        <div className="absolute -top-12 left-0 w-full px-6 flex gap-3 overflow-x-auto hide-scrollbar pointer-events-none">
           <div className="pointer-events-auto flex gap-2">
             {['Rate supplier', 'Send order request', 'View all payment options', 'File a complaint', 'Logistics Inquiry'].map((chip, i) => (
                <button key={i} className="bg-white border border-gray-200 shadow-sm rounded-full px-4 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50 hover:text-black transition-colors whitespace-nowrap">
                  {chip}
                </button>
             ))}
           </div>
        </div>

        <div className="p-4 flex flex-col h-[160px]">
          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-3 text-gray-500">
             <Smile size={18} className="cursor-pointer hover:text-gray-800" />
             <ImageIcon size={18} className="cursor-pointer hover:text-gray-800" />
             <Folder size={18} className="cursor-pointer hover:text-gray-800" />
             <Paperclip size={18} className="cursor-pointer hover:text-gray-800" />
             <Phone size={18} className="cursor-pointer hover:text-gray-800" />
             <div className="h-4 w-px bg-gray-300 mx-1"></div>
             <MoreVertical size={18} className="cursor-pointer hover:text-gray-800" />
          </div>

          {/* Text Area */}
          <textarea 
            placeholder="Please enter your message here"
            className="w-full flex-1 resize-none outline-none text-[14px] text-gray-800 placeholder-gray-400 bg-transparent"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>

          {/* Send Button Row */}
          <div className="flex justify-end items-center gap-4 mt-2">
            <span className="text-[12px] text-gray-400">Press "Enter" to send</span>
            <button 
              className={`px-8 py-2 rounded-full text-[13px] font-bold transition-colors ${
                inputText.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PAGE EXPORT
// ==========================================
export default function MessagesPage() {
  return (
    // Instead of using a fixed calc() for height, we use h-screen and flex-col
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden font-sans">
      <MessageTopNav />
      <div className="flex flex-1 w-full overflow-hidden">
        <SideNavigation />
        <ChatInbox />
        <ChatArea />
      </div>
    </div>
  );
}