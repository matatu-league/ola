"use client";

// components/shared/TopNav.jsx
// Clean top navigation — category menu is handled by CategoryDropdown component.

import React, { useState } from 'react';
import Link                 from 'next/link';
import { useRouter }        from 'next/navigation';
import {
  Search, ShoppingCart, User, ChevronDown, MapPin,
  Inbox, LogOut, LayoutDashboard, Loader2, MessageSquare,
  Phone, Store, ShoppingBag, CheckCircle2, ShieldCheck,
} from 'lucide-react';

import { useCart }           from '@/contexts/CartContext';
import { useUser }           from '@/contexts/UserContext';
import { useNotifications }  from '@/contexts/NotificationContext';
import { useAuth }           from '@/hooks/useAuth';
import CategoryDropdown      from '@/components/shared/CategoryDropdown';

export default function TopNav({ showSearch = false }) {
  const router = useRouter();

  const { cartCount, toggleDrawer }                              = useCart();
  const { user, logout, sellerPortalUrl, isAdmin }               = useUser();
  const { totalUnread }                                          = useNotifications();
  const { loginWithGoogle, loginWithTikTok, authProvider, updatePhone } = useAuth();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [modalPhone,      setModalPhone]      = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [accountType,     setAccountType]     = useState('buyer');

  const handleSaveProfile = async () => {
    setIsUpdatingPhone(true);
    try {
      await updatePhone(modalPhone, accountType);
      if (accountType === 'seller') router.push('/stores/onboarding');
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const isModalPhoneValid = modalPhone.trim().length >= 9;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap');
        @keyframes menuFadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes modalSlideUp {
          from { opacity:0; transform:translateY(16px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        .ola-logo { font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
        .acct-popover {
          min-width:300px; background:#fff;
          border:1px solid #f0f0f0; border-radius:8px;
          box-shadow:0 6px 16px rgba(0,0,0,0.08),0 3px 6px -4px rgba(0,0,0,0.12),0 9px 28px 8px rgba(0,0,0,0.05);
          animation:menuFadeIn 0.15s cubic-bezier(0.08,0.82,0.17,1) forwards; overflow:hidden;
        }
        .acct-popover-header { padding:16px 20px; background:#fafafa; border-bottom:1px solid #f0f0f0; display:flex; align-items:center; gap:12px; }
        .acct-popover-avatar { width:42px; height:42px; border-radius:50%; border:1px solid #f0f0f0; object-fit:cover; flex-shrink:0; }
        .acct-popover-name   { font-size:14px; font-weight:600; color:rgba(0,0,0,0.88); line-height:1.4; margin:0; }
        .acct-popover-sub    { font-size:12px; color:rgba(0,0,0,0.45); margin:2px 0 0; }
        .acct-menu-divider   { height:1px; background:#f0f0f0; margin:4px 0; }
        .acct-menu-item {
          display:flex; align-items:center; gap:10px; padding:9px 20px;
          font-size:13px; color:rgba(0,0,0,0.65); cursor:pointer;
          transition:background 0.15s,color 0.15s;
          text-decoration:none; width:100%; background:none; border:none; text-align:left;
        }
        .acct-menu-item:hover { background:#fff1f3; color:#FE2C55; }
        .acct-menu-item:hover svg { color:#FE2C55; }
        .acct-menu-item svg { color:rgba(0,0,0,0.35); transition:color 0.15s; flex-shrink:0; }
        .acct-menu-item-danger:hover { background:#fff1f0; color:#ff4d4f; }
        .acct-badge { margin-left:auto; font-size:11px; font-weight:500; background:#fff1f3; color:#FE2C55; border-radius:10px; padding:1px 8px; line-height:18px; }
        .acct-login-panel { padding:24px 20px 20px; }
        .acct-login-title { font-size:15px; font-weight:600; color:rgba(0,0,0,0.88); text-align:center; margin:0 0 4px; }
        .acct-login-sub   { font-size:12px; color:rgba(0,0,0,0.45); text-align:center; margin:0 0 20px; }
        .acct-login-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.2s; border:1px solid transparent;
        }
        .acct-login-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .acct-btn-google { background:#fff; border-color:#d9d9d9; color:rgba(0,0,0,0.88); margin-bottom:10px; }
        .acct-btn-google:hover:not(:disabled) { border-color:#FE2C55; color:#FE2C55; background:#fff1f3; }
        .acct-btn-tiktok { background:#161823; color:#fff; border-color:#161823; }
        .acct-btn-tiktok:hover:not(:disabled) { background:#000; border-color:#000; }
        /* Phone modal */
        .phone-modal-backdrop {
          position:fixed; inset:0; background:rgba(0,0,0,0.55);
          backdrop-filter:blur(3px); display:flex; align-items:center;
          justify-content:center; padding:16px; z-index:2147483647;
        }
        .phone-modal-card {
          background:#fff; border-radius:12px;
          box-shadow:0 20px 60px rgba(0,0,0,0.18);
          width:100%; max-width:440px; overflow:hidden;
          animation:modalSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .phone-modal-header { padding:28px 28px 0; text-align:center; }
        .phone-modal-icon-wrap { width:52px; height:52px; border-radius:50%; background:#FFF0F3; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
        .phone-modal-title { font-size:18px; font-weight:700; color:rgba(0,0,0,0.88); margin:0 0 6px; }
        .phone-modal-sub   { font-size:13px; color:rgba(0,0,0,0.45); margin:0; line-height:1.6; }
        .phone-modal-body  { padding:24px 28px 28px; }
        .seg-control { display:flex; background:#f5f5f5; border-radius:8px; padding:3px; gap:3px; margin-bottom:20px; }
        .seg-option { flex:1; display:flex; align-items:center; justify-content:center; gap:7px; padding:9px 12px; border-radius:6px; border:none; background:transparent; cursor:pointer; font-size:13px; font-weight:500; color:rgba(0,0,0,0.45); transition:background 0.18s,color 0.18s,box-shadow 0.18s; }
        .seg-option.active { background:#fff; color:rgba(0,0,0,0.88); box-shadow:0 1px 4px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.06); }
        .seg-option.active.seller { color:#FE2C55; }
        .seg-badge { font-size:10px; font-weight:600; padding:1px 6px; border-radius:8px; line-height:16px; }
        .seg-badge-seller { background:#FFF0F3; color:#FE2C55; }
        .seg-badge-buyer  { background:#F0FDF9; color:#10B981; }
        .seller-info-strip { background:#FFF8F0; border:1px solid #FFE0B2; border-radius:8px; padding:11px 14px; margin-bottom:18px; display:flex; align-items:flex-start; gap:10px; font-size:12px; color:rgba(0,0,0,0.55); line-height:1.5; }
        .seller-info-strip svg { color:#FF6B35; flex-shrink:0; }
        .phone-input-wrap { position:relative; margin-bottom:20px; }
        .phone-input-wrap svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
        .phone-input { width:100%; padding:10px 14px 10px 38px; border:1px solid #d9d9d9; border-radius:7px; font-size:13px; outline:none; background:#fafafa; color:rgba(0,0,0,0.88); transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
        .phone-input:focus { border-color:#FE2C55; box-shadow:0 0 0 2px rgba(254,44,85,0.12); background:#fff; }
        .phone-modal-cta { width:100%; padding:11px 16px; border-radius:7px; border:none; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; color:#fff; transition:opacity 0.2s,transform 0.1s; }
        .buyer-cta  { background:#FE2C55; }
        .seller-cta { background:linear-gradient(135deg,#FF6B35 0%,#FE2C55 100%); }
        .phone-modal-cta:hover:not(:disabled) { filter:brightness(0.93); transform:translateY(-1px); }
        .phone-modal-cta:disabled { opacity:0.5; cursor:not-allowed; }
        .phone-modal-cancel { width:100%; margin-top:10px; padding:8px; border:none; background:none; font-size:12px; color:rgba(0,0,0,0.35); cursor:pointer; }
        .phone-modal-cancel:hover { color:rgba(0,0,0,0.65); }
      `}</style>

      <header className="bg-white flex flex-col w-full z-50 relative">

        {/* ── Primary bar ────────────────────────────────────────────────── */}
        <div className="max-w-[1400px] w-full mx-auto px-4 py-3 flex items-center justify-between gap-4 lg:gap-8">

          {/* Logo */}
          <Link href="/" className="shrink-0 select-none">
            <span className="ola-logo text-2xl sm:text-3xl font-extrabold text-[#FE2C55] tracking-tighter">
              Ola<span className="text-gray-900">.ug</span>
            </span>
          </Link>

          {/* Search bar */}
          {showSearch && (
            <div className="flex-1 max-w-2xl hidden sm:flex">
              <div className="w-full flex items-center border-2 border-[#FE2C55] h-10">
                <input
                  type="text"
                  placeholder="Search products, brands & shops…"
                  className="flex-1 px-4 text-[13px] outline-none text-gray-900 placeholder-gray-400 h-full bg-white"
                />
                <button className="bg-[#FE2C55] hover:bg-[#e0264b] px-5 md:px-7 h-full text-white flex items-center justify-center font-bold transition-colors">
                  <Search size={16} className="md:mr-2" />
                  <span className="hidden md:block text-[13px]">Search</span>
                </button>
              </div>
            </div>
          )}

          {/* Right icons */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">

            {/* Deliver to — desktop only */}
            <div className="hidden lg:flex items-center gap-1.5">
              <MapPin size={17} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 leading-none mb-0.5">Deliver to</span>
                <span className="text-[12px] font-bold text-gray-900 leading-none">Uganda</span>
              </div>
            </div>

            {/* Account */}
            <div
              className="relative flex items-center gap-1.5 cursor-pointer py-2"
              onMouseEnter={() => setShowAccountMenu(true)}
              onMouseLeave={() => setShowAccountMenu(false)}
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-gray-200 object-cover" />
                : <User size={20} className="text-gray-700" />
              }
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] text-gray-500 leading-none mb-0.5 truncate max-w-[70px]">
                  {user ? `Hi, ${user.name?.split(' ')[0]}` : 'Sign In'}
                </span>
                <span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">
                  Account <ChevronDown size={11} className="ml-0.5" />
                </span>
              </div>

              {showAccountMenu && (
                <div className="acct-popover absolute top-full right-0 z-50" style={{ marginTop: 4 }}>
                  {user ? (
                    <>
                      <div className="acct-popover-header">
                        {user.avatar && (
                          <img src={user.avatar} alt={user.name} className="acct-popover-avatar" />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p className="acct-popover-name">{user.name}</p>
                          <p className="acct-popover-sub">{user.phoneNumber || user.email}</p>
                        </div>
                      </div>
                      <div style={{ padding: '4px 0' }}>
                        <Link href="/orders" className="acct-menu-item">
                          <Inbox size={15} /> My Orders
                        </Link>
                        <Link href="/messages" className="acct-menu-item">
                          <MessageSquare size={15} /> Messages
                          {totalUnread > 0 && (
                            <span className="acct-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
                          )}
                        </Link>
                        <Link href={sellerPortalUrl} className="acct-menu-item">
                          <LayoutDashboard size={15} />
                          {user.hasStore ? 'Seller Dashboard' : 'Open a Store'}
                        </Link>
                        {isAdmin && (
                          <Link href="/admin/dashboard" className="acct-menu-item">
                            <ShieldCheck size={15} /> Admin Dashboard
                          </Link>
                        )}
                        <div className="acct-menu-divider" />
                        <button
                          onClick={logout}
                          className="acct-menu-item acct-menu-item-danger"
                          style={{ color: 'rgba(0,0,0,0.65)' }}
                        >
                          <LogOut size={15} /> Log Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="acct-login-panel">
                      <p className="acct-login-title">Welcome to Ola.ug</p>
                      <p className="acct-login-sub">Sign in to access your account</p>
                      <button
                        onClick={() => loginWithGoogle()}
                        disabled={authProvider !== null}
                        className="acct-login-btn acct-btn-google"
                      >
                        {authProvider === 'google'
                          ? <Loader2 size={16} className="animate-spin" style={{ color: '#999' }} />
                          : (
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                              </g>
                            </svg>
                          )
                        }
                        Continue with Google
                      </button>
                      <button
                        onClick={() => loginWithTikTok()}
                        disabled={authProvider !== null}
                        className="acct-login-btn acct-btn-tiktok"
                      >
                        {authProvider === 'tiktok'
                          ? <Loader2 size={16} className="animate-spin" />
                          : (
                            <>
                              <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.755 4.755 0 0 1-1.161-3.18H10.66v14.596a3.2 3.2 0 1 1-3.2-3.2 3.2 3.2 0 0 1 2.33 1.011v-3.468a6.56 6.56 0 1 0 4.27 6.06V9.452a8.174 8.174 0 0 0 5.53 2.05v-4.816z" />
                              </svg>
                              Continue with TikTok
                            </>
                          )
                        }
                      </button>
                      <div className="acct-menu-divider" style={{ margin: '16px 0 12px' }} />
                      <p style={{ fontSize:11, color:'rgba(0,0,0,0.35)', textAlign:'center', lineHeight:1.5 }}>
                        By signing in you agree to our{' '}
                        <Link href="/terms"   style={{ color:'#FE2C55' }}>Terms</Link> &amp;{' '}
                        <Link href="/privacy" style={{ color:'#FE2C55' }}>Privacy Policy</Link>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <Link href="/messages" className="flex flex-col items-center group relative">
              <div className="relative">
                <MessageSquare size={20} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border border-white px-0.5">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-700 mt-0.5 hidden md:block">Messages</span>
            </Link>

            {/* Orders */}
            <Link href="/orders" className="flex flex-col items-center group">
              <Inbox size={20} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
              <span className="text-[10px] font-medium text-gray-700 mt-0.5 hidden md:block">Orders</span>
            </Link>

            {/* Cart */}
            <div
              onClick={toggleDrawer}
              className="flex flex-col items-center cursor-pointer group relative"
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-700 mt-0.5 hidden md:block">Cart</span>
            </div>
          </div>
        </div>

        {/* Mobile search — shown below primary bar on small screens */}
        {showSearch && (
          <div className="sm:hidden px-4 pb-3">
            <div className="flex items-center border-2 border-[#FE2C55] h-10">
              <input
                type="text"
                placeholder="Search products…"
                className="flex-1 px-3 text-[13px] outline-none text-gray-900 placeholder-gray-400 h-full bg-white"
              />
              <button className="bg-[#FE2C55] px-4 h-full text-white flex items-center justify-center">
                <Search size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Secondary bar ──────────────────────────────────────────────── */}
        <div className="w-full border-b border-gray-200 bg-white relative z-30">
          <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-[13px] font-medium text-gray-700 h-10">

            <div className="flex items-center gap-4 h-full">
              {/* ← CategoryDropdown replaces the old inline menu */}
              <CategoryDropdown />

              <div className="hidden md:flex items-center gap-5 h-full">
                <Link href="/deals"        className="hover:text-[#FE2C55] transition-colors text-[12px]">Today&apos;s Deals</Link>
                <Link href="/flash-sale"   className="hover:text-[#FE2C55] transition-colors text-[12px]">Flash Sale</Link>
                <Link href="/best-sellers" className="hover:text-[#FE2C55] transition-colors text-[12px]">Best Sellers</Link>
                <Link href="/new"          className="hover:text-[#FE2C55] transition-colors text-[12px]">New Arrivals</Link>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4 h-full text-[12px]">
              <Link href="/track" className="hover:text-[#FE2C55] transition-colors">Track Order</Link>
              <Link href="/help"  className="hover:text-[#FE2C55] transition-colors">Help Center</Link>
              <Link href="/app"   className="hover:text-[#FE2C55] transition-colors">Get the App</Link>
              <div className="h-4 w-px bg-gray-200 mx-1" />
              <Link href={sellerPortalUrl} className="hover:text-[#FE2C55] transition-colors font-bold text-gray-900">
                Sell on Ola.ug
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Phone + account type modal ────────────────────────────────────── */}
      {user && !user.phoneNumber && (
        <div className="phone-modal-backdrop">
          <div className="phone-modal-card">
            <div className="phone-modal-header">
              <div className="phone-modal-icon-wrap">
                {accountType === 'seller'
                  ? <Store size={24} color="#FE2C55" />
                  : <Phone size={24} color="#FE2C55" />
                }
              </div>
              <h2 className="phone-modal-title">
                {accountType === 'seller' ? 'Set up your seller account' : 'Secure your account'}
              </h2>
              <p className="phone-modal-sub">
                {accountType === 'seller'
                  ? 'Add your phone number to continue to store setup.'
                  : 'Add your phone number to complete your profile.'}
              </p>
            </div>
            <div className="phone-modal-body">
              <div className="seg-control">
                <button
                  type="button"
                  onClick={() => setAccountType('buyer')}
                  className={`seg-option ${accountType === 'buyer' ? 'active' : ''}`}
                >
                  <ShoppingBag size={15} /> I'm a Buyer
                  {accountType === 'buyer' && <span className="seg-badge seg-badge-buyer">Default</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('seller')}
                  className={`seg-option seller ${accountType === 'seller' ? 'active seller' : ''}`}
                >
                  <Store size={15} /> I'm a Seller
                  {accountType === 'seller' && <span className="seg-badge seg-badge-seller">New</span>}
                </button>
              </div>

              {accountType === 'seller' && (
                <div className="seller-info-strip">
                  <CheckCircle2 size={15} />
                  <span>After saving, you'll be taken to store onboarding to start selling on Ola.ug.</span>
                </div>
              )}

              <div className="phone-input-wrap">
                <Phone size={16} />
                <input
                  type="tel"
                  value={modalPhone}
                  onChange={e => setModalPhone(e.target.value)}
                  placeholder="+256 700 000000"
                  className="phone-input"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={!isModalPhoneValid || isUpdatingPhone}
                className={`phone-modal-cta ${accountType === 'seller' ? 'seller-cta' : 'buyer-cta'}`}
              >
                {isUpdatingPhone
                  ? <Loader2 size={17} className="animate-spin" />
                  : accountType === 'seller'
                    ? <><Store size={16} /> Save &amp; Set Up My Store</>
                    : <><CheckCircle2 size={16} /> Save Phone Number</>
                }
              </button>

              <button onClick={logout} className="phone-modal-cancel">
                Cancel and Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}