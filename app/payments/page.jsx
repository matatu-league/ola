"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ClipboardList, DollarSign, Heart, Bookmark, 
  Package, Box, Grid, User, ChevronRight, MapPin, ShoppingCart, 
  Inbox, LogOut, LayoutDashboard, Loader2, CreditCard, Receipt, 
  ArrowUpRight, ArrowDownRight, ShieldCheck, Plus, Settings, CheckCircle2
} from 'lucide-react';

// --- MOCK PAYMENT DATA ---
const TRANSACTIONS = [
  { id: "TRX-99201A", date: "May 10, 2026", amount: "$155.00", type: "Payment", status: "Completed", method: "Visa •••• 4242", vendor: "Zhongshan Yihouse Electric" },
  { id: "TRX-88314B", date: "May 08, 2026", amount: "$890.00", type: "Payment", status: "Processing", method: "Wire Transfer", vendor: "Shenzhen Advanced Tech" },
  { id: "TRX-77192C", date: "Apr 22, 2026", amount: "$44.00", type: "Refund", status: "Completed", method: "Wallet Balance", vendor: "Zhejiang Jingquanda" },
  { id: "TRX-66281D", date: "Apr 15, 2026", amount: "$1,200.00", type: "Payment", status: "Completed", method: "Mastercard •••• 8819", vendor: "Guangzhou Vigor Health" },
];

// ==========================================
// 0. BUYER TOP NAV (Dynamic User Auth)
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
export default function PaymentsPage() {
  const [activeInnerTab, setActiveInnerTab] = useState('transactions');

  return (
    <div className="flex flex-col w-full h-screen bg-white overflow-hidden font-sans">
      <BuyerTopNav />
      <div className="flex flex-1 w-full overflow-hidden">
        <SideNavigation activeTab="payment" />
        
        {/* Main Content Area */}
        <div className="flex-1 h-full bg-[#F5F6F8] overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 md:p-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Payment Management</h1>
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white text-[13px] font-bold rounded-full hover:bg-gray-800 transition-colors shadow-sm">
                <Receipt size={16} /> Download Statements
              </button>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-gray-500 text-[12px] font-bold uppercase tracking-wider">Total Spent (YTD)</div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={20} strokeWidth={2.5}/></div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight">$12,450.00</div>
                  <div className="text-[12px] text-green-600 font-bold flex items-center gap-1 mt-2">
                    <ArrowUpRight size={14} /> +14.5% vs last year
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-gray-500 text-[12px] font-bold uppercase tracking-wider">Ola Wallet Balance</div>
                    <div className="p-2.5 bg-green-100 text-green-700 rounded-xl"><ShieldCheck size={20} strokeWidth={2.5}/></div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-black text-gray-900 tracking-tight">$440.00</div>
                    <button className="text-[13px] text-green-700 font-bold hover:underline mb-1 flex items-center gap-1">
                      Top up <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                 <div className="flex items-start justify-between mb-4">
                  <div className="text-gray-500 text-[12px] font-bold uppercase tracking-wider">Active Payment Methods</div>
                  <div className="p-2.5 bg-orange-50 text-[#FE2C55] rounded-xl"><CreditCard size={20} strokeWidth={2.5}/></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-gray-900">2 Cards Saved</div>
                  <button className="text-[12px] bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full font-bold hover:bg-gray-200 transition-colors">
                    Manage
                  </button>
                </div>
              </div>

            </div>

            {/* Tabs & Content */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex border-b border-gray-200 px-2 bg-[#F8F9FA]">
                <div 
                  className={`px-6 py-4 cursor-pointer text-[14px] font-bold transition-colors relative ${activeInnerTab === 'transactions' ? 'text-black' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setActiveInnerTab('transactions')}
                >
                  Transaction History
                  {activeInnerTab === 'transactions' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm"></div>}
                </div>
                <div 
                  className={`px-6 py-4 cursor-pointer text-[14px] font-bold transition-colors relative ${activeInnerTab === 'methods' ? 'text-black' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setActiveInnerTab('methods')}
                >
                  Payment Methods
                  {activeInnerTab === 'methods' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black rounded-t-sm"></div>}
                </div>
              </div>

              {/* Transactions Table */}
              {activeInnerTab === 'transactions' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-white text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200">
                        <th className="p-4 pl-6">Transaction ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Vendor / Details</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-gray-800">
                      {TRANSACTIONS.map((trx) => (
                        <tr key={trx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                          <td className="p-4 pl-6 font-bold text-gray-900">{trx.id}</td>
                          <td className="p-4 text-gray-500">{trx.date}</td>
                          <td className="p-4 font-medium text-gray-900">{trx.vendor}</td>
                          <td className="p-4 text-gray-500">{trx.method}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit ${
                              trx.status === 'Completed' ? 'bg-[#E6F4EA] text-[#16A34A]' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {trx.status === 'Completed' ? <CheckCircle2 size={12} className="stroke-[3px]" /> : <Loader2 size={12} className="animate-spin stroke-[3px]" />}
                              {trx.status}
                            </span>
                          </td>
                          <td className={`p-4 pr-6 text-right font-black ${trx.type === 'Refund' ? 'text-[#16A34A]' : 'text-gray-900'}`}>
                            <div className="flex items-center justify-end gap-1">
                              {trx.type === 'Refund' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} className="text-gray-400" />}
                              {trx.type === 'Refund' ? '+' : '-'}{trx.amount}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 text-center border-t border-gray-200 bg-[#F8F9FA]">
                    <button className="text-[13px] font-bold text-black hover:underline">View All Transactions</button>
                  </div>
                </div>
              )}

              {/* Payment Methods Tab */}
              {activeInnerTab === 'methods' && (
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Saved Card 1 */}
                    <div className="border-2 border-gray-200 rounded-xl p-5 flex items-center justify-between group hover:border-black transition-colors bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-10 bg-[#1A1F71] rounded-md shadow-sm flex items-center justify-center text-white text-[12px] font-black italic">VISA</div>
                        <div>
                          <p className="font-bold text-[14px] text-gray-900">Visa ending in 4242</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12px] text-gray-500">Expires 12/28</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[11px] font-bold text-black bg-gray-100 px-2 py-0.5 rounded-full">Default</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-black transition-colors"><Settings size={18} /></button>
                    </div>

                    {/* Saved Card 2 */}
                    <div className="border-2 border-gray-200 rounded-xl p-5 flex items-center justify-between group hover:border-black transition-colors bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-10 bg-[#EB001B] rounded-md shadow-sm flex items-center justify-center text-white text-[12px] font-black italic relative overflow-hidden">
                          <div className="absolute left-1 w-6 h-6 rounded-full bg-[#F79E1B]/80 mix-blend-multiply"></div>
                          <div className="absolute right-1 w-6 h-6 rounded-full bg-yellow-400/80 mix-blend-multiply"></div>
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-gray-900">Mastercard ending in 8819</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">Expires 04/27</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-black transition-colors"><Settings size={18} /></button>
                    </div>

                    {/* Add New Card */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#FE2C55] hover:bg-[#FE2C55]/5 transition-colors group h-full min-h-[100px]">
                      <div className="flex items-center gap-2 text-gray-600 group-hover:text-[#FE2C55] font-bold text-[14px] transition-colors">
                        <Plus size={18} /> Add New Payment Method
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}