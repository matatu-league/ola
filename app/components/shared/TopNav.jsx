"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, ShoppingCart, User, Menu, ChevronDown, MapPin,
  Inbox, ChevronRight, LogOut, LayoutDashboard, Loader2, MessageSquare,
  TrendingUp, Sparkles, Tag, Star, ArrowRight, Phone, Store, ShoppingBag, CheckCircle2
} from 'lucide-react';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';

const ICON_MAP = {
  'smart-products': '📱', 'cars': '🚗', 'apparel': '👕', 'home-furniture': '🛋️',
  'machinery': '⚙️', 'beauty': '💄', 'sports': '⚽', 'default': '📁',
};

const CATEGORY_COLORS = [
  { accent: '#FE2C55', bg: '#FFF0F3' },
  { accent: '#FF6B35', bg: '#FFF4EF' },
  { accent: '#7C3AED', bg: '#F5F0FF' },
  { accent: '#0EA5E9', bg: '#F0F9FF' },
  { accent: '#10B981', bg: '#F0FDF9' },
  { accent: '#F59E0B', bg: '#FFFBEB' },
  { accent: '#EC4899', bg: '#FDF2F8' },
  { accent: '#6366F1', bg: '#EEF2FF' },
];

const QUICK_FILTERS = [
  { label: 'New arrivals', icon: Sparkles },
  { label: 'On sale',      icon: Tag      },
  { label: 'Top rated',    icon: Star     },
  { label: 'Trending',     icon: TrendingUp },
];

export default function TopNav({ showSearch = false }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const { cartCount, toggleDrawer } = useCart();
  const { user, loginWithGoogle, loginWithTikTok, logout, authProvider, updatePhone } = useAuth();

  const [showCategories,      setShowCategories]      = useState(false);
  const [hoveredCategory,     setHoveredCategory]     = useState(0);
  const [showAccountMenu,     setShowAccountMenu]     = useState(false);
  const [dbCategories,        setDbCategories]        = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [menuAnimated,        setMenuAnimated]        = useState(false);

  // Modal state
  const [modalPhone,       setModalPhone]       = useState('');
  const [isUpdatingPhone,  setIsUpdatingPhone]  = useState(false);
  const [accountType,      setAccountType]      = useState('buyer'); // 'buyer' | 'seller'

  const categoryMenuRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res    = await fetch('/api/products?limit=1', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await res.json();
        if (!cancelled && result.success && result.data?.categories)
          setDbCategories(result.data.categories);
      } catch {}
      finally { if (!cancelled) setIsLoadingCategories(false); }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  const categoryTree = useMemo(() => {
    if (!dbCategories.length) return [];
    const parents  = dbCategories.filter(c => !c.parentId);
    const children = dbCategories.filter(c =>  c.parentId);
    return parents.map(parent => {
      const subs = children.filter(c => c.parentId === parent._id);
      return {
        ...parent,
        icon: parent.icon ?? (ICON_MAP[parent.slug] || ICON_MAP['default']),
        subCategories: subs.length
          ? subs
          : [{ _id: `all-${parent._id}`, name: `All ${parent.name}`, slug: parent.slug }],
      };
    });
  }, [dbCategories]);

  const displayCategories = categoryTree.length > 0 ? categoryTree : [
    { _id:'1', name:'Smart Products',  slug:'smart-products',  icon:'📱', subCategories:[{_id:'s1',name:'Phones',slug:'phones'},{_id:'s2',name:'Tablets',slug:'tablets'},{_id:'s3',name:'Laptops',slug:'laptops'},{_id:'s4',name:'Smartwatches',slug:'smartwatches'},{_id:'s5',name:'Headphones',slug:'headphones'},{_id:'s6',name:'Cameras',slug:'cameras'}] },
    { _id:'2', name:'Cars & Motors',   slug:'cars',            icon:'🚗', subCategories:[{_id:'s7',name:'Spare Parts',slug:'spare-parts'},{_id:'s8',name:'Car Audio',slug:'car-audio'},{_id:'s9',name:'Tyres',slug:'tyres'},{_id:'s10',name:'Lubricants',slug:'lubricants'}] },
    { _id:'3', name:'Fashion',         slug:'apparel',         icon:'👕', subCategories:[{_id:'s11',name:"Men's Wear",slug:'mens-wear'},{_id:'s12',name:"Women's Wear",slug:'womens-wear'},{_id:'s13',name:'Kids',slug:'kids'},{_id:'s14',name:'Shoes',slug:'shoes'},{_id:'s15',name:'Bags',slug:'bags'},{_id:'s16',name:'Jewellery',slug:'jewellery'}] },
    { _id:'4', name:'Home & Furniture',slug:'home-furniture',  icon:'🛋️', subCategories:[{_id:'s17',name:'Sofas',slug:'sofas'},{_id:'s18',name:'Beds',slug:'beds'},{_id:'s19',name:'Dining Sets',slug:'dining-sets'},{_id:'s20',name:'Kitchen',slug:'kitchen'}] },
    { _id:'5', name:'Beauty & Health', slug:'beauty',          icon:'💄', subCategories:[{_id:'s21',name:'Skincare',slug:'skincare'},{_id:'s22',name:'Hair Care',slug:'hair-care'},{_id:'s23',name:'Fragrances',slug:'fragrances'},{_id:'s24',name:'Vitamins',slug:'vitamins'}] },
    { _id:'6', name:'Sports & Outdoor',slug:'sports',          icon:'⚽', subCategories:[{_id:'s25',name:'Football',slug:'football'},{_id:'s26',name:'Gym Gear',slug:'gym-gear'},{_id:'s27',name:'Cycling',slug:'cycling'},{_id:'s28',name:'Camping',slug:'camping'}] },
  ];

  useEffect(() => {
    const handler = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target))
        setShowCategories(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (showCategories) requestAnimationFrame(() => setMenuAnimated(true));
    else setMenuAnimated(false);
  }, [showCategories]);

  const handleCategorySelect = (slug) => {
    setShowCategories(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'Products');
    if (slug) params.set('category', slug);
    else params.delete('category');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = async () => {
    setIsUpdatingPhone(true);
    try {
      await updatePhone(modalPhone, accountType); // pass accountType if your hook supports it
      if (accountType === 'seller') {
        router.push('/stores/onboarding');
      }
      // buyer: modal auto-closes because user.phoneNumber is now set
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const sellerPortalUrl = user?.hasStore
    ? (user.domain || user.storeDomain ? `//${user.domain ?? user.storeDomain}/dashboard` : '/store/dashboard')
    : '/stores/onboarding';

  const activeCat   = displayCategories[hoveredCategory];
  const activeColor = CATEGORY_COLORS[hoveredCategory % CATEGORY_COLORS.length];
  const isModalPhoneValid = modalPhone.trim().length >= 9;

  return (
    <>
      <style>{`
        @keyframes menuFadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes modalSlideUp {
          from { opacity:0; transform:translateY(16px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes subFadeIn {
          from { opacity:0; transform:translateX(6px); }
          to   { opacity:1; transform:translateX(0);   }
        }
        .cat-menu-enter  { animation: menuFadeIn 0.18s ease forwards; }
        .cat-sub-enter   { animation: subFadeIn  0.15s ease forwards; }
        .sidebar-item    { transition: background 0.12s, color 0.12s, border-color 0.12s; }
        .sidebar-item:hover { background: rgba(0,0,0,0.03); }
        .sub-card        { transition: border-color 0.15s, color 0.15s; }
        .sub-card:hover  { border-color: #FE2C55 !important; color: #FE2C55 !important; }
        .filter-pill     { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .filter-pill:hover { background: #FE2C55 !important; color: white !important; border-color: #FE2C55 !important; }
        .trending-row    { transition: background 0.12s; border-radius: 6px; }
        .trending-row:hover { background: rgba(0,0,0,0.04); }
        .view-all-btn    { transition: filter 0.15s, transform 0.1s; }
        .view-all-btn:hover { filter: brightness(0.9); transform: scale(1.02); }

        /* ── Ant Design–inspired account popover ── */
        .acct-popover {
          min-width: 300px;
          background: #ffffff;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          box-shadow: 0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);
          animation: menuFadeIn 0.15s cubic-bezier(0.08,0.82,0.17,1) forwards;
          overflow: hidden;
        }
        .acct-popover-header {
          padding: 16px 20px;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .acct-popover-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          border: 1px solid #f0f0f0;
          object-fit: cover;
          flex-shrink: 0;
        }
        .acct-popover-name { font-size:14px; font-weight:600; color:rgba(0,0,0,0.88); line-height:1.4; margin:0; }
        .acct-popover-sub  { font-size:12px; color:rgba(0,0,0,0.45); margin:2px 0 0; }
        .acct-menu-divider { height:1px; background:#f0f0f0; margin:4px 0; }
        .acct-menu-item {
          display:flex; align-items:center; gap:10px;
          padding:9px 20px; font-size:13px; color:rgba(0,0,0,0.65);
          cursor:pointer; transition:background 0.15s, color 0.15s;
          text-decoration:none; width:100%; background:none; border:none; text-align:left;
        }
        .acct-menu-item:hover { background:#fff1f3; color:#FE2C55; }
        .acct-menu-item:hover svg { color:#FE2C55; }
        .acct-menu-item svg { color:rgba(0,0,0,0.35); transition:color 0.15s; flex-shrink:0; }
        .acct-menu-item-danger:hover { background:#fff1f0; color:#ff4d4f; }
        .acct-menu-item-danger:hover svg { color:#ff4d4f; }
        .acct-login-panel { padding:24px 20px 20px; }
        .acct-login-title { font-size:15px; font-weight:600; color:rgba(0,0,0,0.88); text-align:center; margin:0 0 4px; }
        .acct-login-sub   { font-size:12px; color:rgba(0,0,0,0.45); text-align:center; margin:0 0 20px; }
        .acct-login-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:500;
          cursor:pointer; transition:all 0.2s; border:1px solid transparent;
        }
        .acct-login-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .acct-btn-google  { background:#ffffff; border-color:#d9d9d9; color:rgba(0,0,0,0.88); margin-bottom:10px; }
        .acct-btn-google:hover:not(:disabled) { border-color:#FE2C55; color:#FE2C55; background:#fff1f3; }
        .acct-btn-tiktok  { background:#161823; color:#ffffff; border-color:#161823; }
        .acct-btn-tiktok:hover:not(:disabled) { background:#000000; border-color:#000000; }
        .acct-badge {
          margin-left:auto; font-size:11px; font-weight:500;
          background:#fff1f3; color:#FE2C55; border-radius:10px; padding:1px 8px; line-height:18px;
        }

        /* ── Phone modal ── */
        .phone-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          /* sits above EVERYTHING including drawers, popovers, sticky headers */
          z-index: 2147483647;
        }
        .phone-modal-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
          width: 100%;
          max-width: 440px;
          overflow: hidden;
          animation: modalSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
          /* ensure card itself is above backdrop */
          position: relative;
          z-index: 1;
        }
        .phone-modal-header {
          padding: 28px 28px 0;
          text-align: center;
        }
        .phone-modal-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: #FFF0F3;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .phone-modal-title { font-size: 18px; font-weight: 700; color: rgba(0,0,0,0.88); margin: 0 0 6px; }
        .phone-modal-sub   { font-size: 13px; color: rgba(0,0,0,0.45); margin: 0; line-height: 1.6; }
        .phone-modal-body  { padding: 24px 28px 28px; }

        /* Segment control */
        .seg-control {
          display: flex;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
          margin-bottom: 20px;
        }
        .seg-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 12px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: rgba(0,0,0,0.45);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
          position: relative;
        }
        .seg-option.active {
          background: #ffffff;
          color: rgba(0,0,0,0.88);
          box-shadow: 0 1px 4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06);
        }
        .seg-option.active.seller { color: #FE2C55; }
        .seg-option.active.seller svg { color: #FE2C55; }
        .seg-option svg { transition: color 0.18s; }
        .seg-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 8px;
          line-height: 16px;
        }
        .seg-badge-seller { background: #FFF0F3; color: #FE2C55; }
        .seg-badge-buyer  { background: #F0FDF9; color: #10B981; }

        /* Seller info strip */
        .seller-info-strip {
          background: #FFF8F0;
          border: 1px solid #FFE0B2;
          border-radius: 8px;
          padding: 11px 14px;
          margin-bottom: 18px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12px;
          color: rgba(0,0,0,0.55);
          line-height: 1.5;
          animation: menuFadeIn 0.2s ease forwards;
        }
        .seller-info-strip svg { color: #FF6B35; margin-top: 1px; flex-shrink: 0; }

        /* Phone input */
        .phone-input-wrap { position: relative; margin-bottom: 20px; }
        .phone-input-wrap svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
        .phone-input {
          width:100%; padding: 10px 14px 10px 38px;
          border: 1px solid #d9d9d9;
          border-radius: 7px;
          font-size: 13px;
          outline: none;
          background: #fafafa;
          color: rgba(0,0,0,0.88);
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .phone-input::placeholder { color: #bbb; }
        .phone-input:focus {
          border-color: #FE2C55;
          box-shadow: 0 0 0 2px rgba(254,44,85,0.12);
          background: #fff;
        }

        /* CTA button */
        .phone-modal-cta {
          width: 100%;
          padding: 11px 16px;
          border-radius: 7px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, opacity 0.2s, transform 0.1s;
          color: #fff;
        }
        .phone-modal-cta.buyer-cta  { background: #FE2C55; }
        .phone-modal-cta.seller-cta { background: linear-gradient(135deg, #FF6B35 0%, #FE2C55 100%); }
        .phone-modal-cta:hover:not(:disabled) { filter: brightness(0.93); transform: translateY(-1px); }
        .phone-modal-cta:active:not(:disabled){ transform: translateY(0); }
        .phone-modal-cta:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .phone-modal-cancel {
          width: 100%;
          margin-top: 10px;
          padding: 8px;
          border: none;
          background: none;
          font-size: 12px;
          color: rgba(0,0,0,0.35);
          cursor: pointer;
          transition: color 0.15s;
        }
        .phone-modal-cancel:hover { color: rgba(0,0,0,0.65); }
      `}</style>

      <header className="bg-white flex flex-col w-full z-50 relative">
        <div className="max-w-[1400px] w-full mx-auto px-4 py-4 flex items-center justify-between gap-6 lg:gap-10 relative z-40">

          <Link href="/" className="shrink-0 select-none" onClick={() => handleCategorySelect(null)}>
            <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">
              Ola<span className="text-gray-900">.ug</span>
            </span>
          </Link>

          <div className="flex-1 max-w-3xl">
            {showSearch && (
              <div className="w-full flex items-center border-2 border-[#FE2C55] rounded-none h-10">
                <div className="hidden sm:flex items-center bg-[#F8F8F8] px-3 py-2 text-[12px] font-semibold text-gray-700 border-r border-gray-200 cursor-pointer h-full hover:bg-gray-100 transition-colors select-none">
                  Products <ChevronDown size={14} className="ml-1" />
                </div>
                <input type="text" placeholder="What are you looking for?"
                  className="flex-1 px-4 text-[13px] outline-none text-gray-900 placeholder-gray-400 h-full bg-white" />
                <button className="bg-[#FE2C55] hover:bg-[#e0264b] px-6 md:px-8 h-full text-white flex items-center justify-center font-bold transition-colors cursor-pointer">
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

            {/* Account dropdown */}
            <div
              className="flex items-center gap-2 cursor-pointer group relative py-2"
              onMouseEnter={() => setShowAccountMenu(true)}
              onMouseLeave={() => setShowAccountMenu(false)}
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full border border-gray-200 object-cover" />
                : <User size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />}
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] text-gray-500 leading-none mb-0.5 truncate max-w-[80px]">
                  {user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In'}
                </span>
                <span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">
                  Account <ChevronDown size={12} className="ml-0.5" />
                </span>
              </div>

              {showAccountMenu && (
                <div className="acct-popover absolute top-full right-0 z-50" style={{ marginTop: 4 }}>
                  {user ? (
                    <>
                      <div className="acct-popover-header">
                        <img src={user.avatar} alt={user.name} className="acct-popover-avatar" />
                        <div style={{ minWidth: 0 }}>
                          <p className="acct-popover-name">{user.name}</p>
                          <p className="acct-popover-sub">{user.phoneNumber || user.email || 'Logged in'}</p>
                        </div>
                      </div>
                      <div style={{ padding: '4px 0' }}>
                        <Link href="/account/orders" className="acct-menu-item">
                          <Inbox size={15} /> My Orders
                          <span className="acct-badge">3 active</span>
                        </Link>
                        <Link href="/messages" className="acct-menu-item">
                          <MessageSquare size={15} /> Messages
                          <span className="acct-badge">5 new</span>
                        </Link>
                        <Link href={sellerPortalUrl} className="acct-menu-item">
                          <LayoutDashboard size={15} />
                          {user.hasStore ? 'Seller Dashboard' : 'Open a Store'}
                        </Link>
                        <div className="acct-menu-divider" />
                        <button onClick={logout} className="acct-menu-item acct-menu-item-danger" style={{ color: 'rgba(0,0,0,0.65)' }}>
                          <LogOut size={15} /> Log Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="acct-login-panel">
                      <p className="acct-login-title">Welcome to Ola.ug</p>
                      <p className="acct-login-sub">Sign in to access your account</p>
                      <button onClick={() => loginWithGoogle()} disabled={authProvider !== null} className="acct-login-btn acct-btn-google">
                        {authProvider === 'google' ? <Loader2 size={16} className="animate-spin" style={{ color: '#999' }} /> : (
                          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
                              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                            </g>
                          </svg>
                        )}
                        Continue with Google
                      </button>
                      <button onClick={() => loginWithTikTok()} disabled={authProvider !== null} className="acct-login-btn acct-btn-tiktok">
                        {authProvider === 'tiktok' ? <Loader2 size={16} className="animate-spin" /> : (
                          <>
                            <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.755 4.755 0 0 1-1.161-3.18H10.66v14.596a3.2 3.2 0 1 1-3.2-3.2 3.2 3.2 0 0 1 2.33 1.011v-3.468a6.56 6.56 0 1 0 4.27 6.06V9.452a8.174 8.174 0 0 0 5.53 2.05v-4.816z" />
                            </svg>
                            Continue with TikTok
                          </>
                        )}
                      </button>
                      <div className="acct-menu-divider" style={{ margin: '16px 0 12px' }} />
                      <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', textAlign: 'center', lineHeight: 1.5 }}>
                        By signing in you agree to our <span style={{ color: '#FE2C55', cursor: 'pointer' }}>Terms</span> &amp; <span style={{ color: '#FE2C55', cursor: 'pointer' }}>Privacy Policy</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/messages" className="flex flex-col items-center cursor-pointer group relative">
              <div className="relative">
                <MessageSquare size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
                <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">5</span>
              </div>
              <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span>
            </Link>

            <div className="flex flex-col items-center cursor-pointer group">
              <Inbox size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
              <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Orders</span>
            </div>

            <div className="flex flex-col items-center cursor-pointer group relative" onClick={toggleDrawer}>
              <div className="relative">
                <ShoppingCart size={22} className="text-gray-700 group-hover:text-[#FE2C55] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span>
            </div>
          </div>
        </div>

        {/* Second nav bar */}
        <div className="w-full border-b border-gray-200 bg-white relative z-30">
          <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between text-[13px] font-medium text-gray-700 h-10">
            <div className="flex items-center gap-6 h-full">
              <div className="relative h-full flex items-center" ref={categoryMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowCategories(prev => !prev)}
                  aria-expanded={showCategories}
                  aria-haspopup="true"
                  className={`flex items-center gap-2 transition-colors h-full px-1 ${showCategories ? 'text-[#FE2C55]' : 'hover:text-[#FE2C55]'}`}
                >
                  <Menu size={16} />
                  <span className="font-bold text-gray-900">All categories</span>
                  <ChevronDown size={13} className="text-gray-400 transition-transform duration-200"
                    style={{ transform: showCategories ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {showCategories && (
                  <div
                    className={`absolute top-full left-0 bg-white border border-gray-200 z-50 flex flex-col rounded-xl overflow-hidden mt-1 ${menuAnimated ? 'cat-menu-enter' : ''}`}
                    style={{ width: 760, minHeight: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.13)' }}
                  >
                    {isLoadingCategories ? (
                      <div className="flex flex-col items-center justify-center text-gray-400 py-16 min-h-[480px]">
                        <Loader2 className="animate-spin mb-3" size={24} />
                        <span className="text-[13px]">Loading categories…</span>
                      </div>
                    ) : (
                      <div className="flex" style={{ minHeight: 480 }}>
                        <div className="shrink-0 overflow-y-auto py-2 custom-scrollbar"
                          style={{ width: 192, background: '#FAFAFA', borderRight: '1px solid #F0F0F0' }}>
                          {displayCategories.map((cat, idx) => {
                            const color    = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                            const isActive = hoveredCategory === idx;
                            return (
                              <div
                                key={cat._id ?? cat.slug}
                                onMouseEnter={() => setHoveredCategory(idx)}
                                className="sidebar-item flex items-center gap-3 px-4 py-2.5 cursor-default relative"
                                style={{
                                  background:  isActive ? 'white' : 'transparent',
                                  borderLeft:  isActive ? `2.5px solid ${color.accent}` : '2.5px solid transparent',
                                }}
                              >
                                <span
                                  className="flex items-center justify-center rounded-lg text-base shrink-0"
                                  style={{ width:32, height:32, background: isActive ? color.bg : '#F0F0F0', transition:'background 0.15s' }}
                                >
                                  {cat.icon}
                                </span>
                                <span
                                  className="text-[13px] capitalize leading-tight"
                                  style={{ color: isActive ? color.accent : '#374151', fontWeight: isActive ? 600 : 400, transition:'color 0.12s' }}
                                >
                                  {cat.name}
                                </span>
                                {isActive && <ChevronRight size={12} className="ml-auto shrink-0" style={{ color: color.accent }} />}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col flex-1 overflow-hidden bg-white">
                          {activeCat && (
                            <div
                              key={activeCat._id}
                              className="cat-sub-enter flex items-center gap-4 px-5 py-4 shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${activeColor.bg} 0%, white 70%)`,
                                borderBottom: '1px solid #F0F0F0',
                              }}
                            >
                              <div
                                className="flex items-center justify-center rounded-2xl text-4xl shrink-0"
                                style={{ width:64, height:64, background: activeColor.bg, border:`1.5px solid ${activeColor.accent}22` }}
                              >
                                {activeCat.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[17px] font-bold text-gray-900 capitalize leading-tight">{activeCat.name}</p>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                  {activeCat.subCategories.length} subcategories · Uganda
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {QUICK_FILTERS.map(({ label, icon: Icon }) => (
                                    <button
                                      key={label}
                                      onClick={() => handleCategorySelect(activeCat.slug)}
                                      className="filter-pill flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border"
                                      style={{ background:'white', borderColor:'#E5E7EB', color:'#374151' }}
                                    >
                                      <Icon size={11} />
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => handleCategorySelect(activeCat.slug)}
                                className="view-all-btn shrink-0 flex items-center gap-1.5 text-[13px] font-bold text-white px-5 py-2.5 rounded-lg shadow-sm"
                                style={{ background: activeColor.accent }}
                              >
                                View all <ArrowRight size={14} />
                              </button>
                            </div>
                          )}

                          {activeCat && (
                            <div key={`subs-${activeCat._id}`} className="cat-sub-enter p-5 overflow-y-auto flex-1 custom-scrollbar">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Browse subcategories</p>
                              <div className="grid grid-cols-3 gap-2">
                                {activeCat.subCategories.map((sub) => (
                                  <button
                                    key={sub._id ?? sub.slug}
                                    type="button"
                                    onClick={() => handleCategorySelect(sub.slug)}
                                    className="sub-card group text-left px-3 py-2.5 rounded-lg border text-[12px] flex items-center justify-center text-center transition-colors hover:border-[#FE2C55] bg-[#FAFAFA] hover:bg-white"
                                    style={{ borderColor:'#EBEBEB' }}
                                  >
                                    <span className="text-gray-700 capitalize font-medium group-hover:text-[#FE2C55] transition-colors">{sub.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          className="shrink-0 flex flex-col py-4 px-3"
                          style={{ width:156, background:'#FAFAFA', borderLeft:'1px solid #F0F0F0' }}
                        >
                          <div className="flex items-center gap-1.5 mb-3 px-1">
                            <TrendingUp size={12} style={{ color:'#FE2C55' }} />
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Trending</p>
                          </div>
                          {['iPhone 15 cases','Ankara prints','Solar panels','Natural hair care','Football boots'].map((t, i) => (
                            <div key={t} className="trending-row flex items-center gap-2.5 py-2 px-1 cursor-pointer">
                              <span
                                className="text-[11px] font-bold shrink-0 w-4 text-center"
                                style={{ color: i===0?'#FE2C55':i===1?'#FF6B35':i===2?'#F59E0B':'#9CA3AF' }}
                              >{i+1}</span>
                              <span className="text-[12px] text-gray-700 leading-snug">{t}</span>
                            </div>
                          ))}
                          <div className="mt-auto pt-4 border-t border-gray-100 px-1">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Highlights</p>
                            <div
                              className="rounded-lg p-3 text-center cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ background:'#FFF0F3' }}
                              onClick={() => handleCategorySelect(null)}
                            >
                              <p className="text-[11px] font-bold" style={{ color:'#FE2C55' }}>Flash Sale</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Ends in 2h 14m</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-6 h-full">
                <span className="cursor-pointer hover:text-[#FE2C55] transition-colors px-1">Verified manufacturers</span>
                <span className="cursor-pointer hover:text-[#FE2C55] transition-colors px-1">Order protection</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-5 h-full text-[12px]">
              <span className="cursor-pointer hover:text-[#FE2C55] transition-colors">Ola Work</span>
              <span className="cursor-pointer hover:text-[#FE2C55] transition-colors">Buyer Central</span>
              <span className="cursor-pointer hover:text-[#FE2C55] transition-colors">App & extensions</span>
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <Link href={sellerPortalUrl} className="cursor-pointer hover:text-[#FE2C55] transition-colors font-bold text-gray-900">
                Seller Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Phone + Account Type Modal ── rendered via portal-like fixed overlay at max z-index ── */}
      {user && !user.phoneNumber && (
        <div className="phone-modal-backdrop">
          <div className="phone-modal-card">

            {/* Header */}
            <div className="phone-modal-header">
              <div className="phone-modal-icon-wrap">
                {accountType === 'seller'
                  ? <Store size={24} color="#FE2C55" />
                  : <Phone size={24} color="#FE2C55" />}
              </div>
              <h2 className="phone-modal-title">
                {accountType === 'seller' ? 'Set up your seller account' : 'Secure your account'}
              </h2>
              <p className="phone-modal-sub">
                {accountType === 'seller'
                  ? 'Add your phone number to continue to store setup.'
                  : 'Add your phone number to complete your profile and stay updated on orders.'}
              </p>
            </div>

            {/* Body */}
            <div className="phone-modal-body">

              {/* Segment control */}
              <div className="seg-control">
                <button
                  type="button"
                  onClick={() => setAccountType('buyer')}
                  className={`seg-option buyer ${accountType === 'buyer' ? 'active' : ''}`}
                >
                  <ShoppingBag size={15} />
                  I'm a Buyer
                  {accountType === 'buyer' && (
                    <span className="seg-badge seg-badge-buyer">Default</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('seller')}
                  className={`seg-option seller ${accountType === 'seller' ? 'active seller' : ''}`}
                >
                  <Store size={15} />
                  I'm a Seller
                  {accountType === 'seller' && (
                    <span className="seg-badge seg-badge-seller">New</span>
                  )}
                </button>
              </div>

              {/* Seller info hint */}
              {accountType === 'seller' && (
                <div className="seller-info-strip">
                  <CheckCircle2 size={15} />
                  <span>
                    After saving, you'll be taken to store onboarding where you can set up your shop, add products, and start selling on Ola.ug.
                  </span>
                </div>
              )}

              {/* Phone input */}
              <div className="phone-input-wrap">
                <Phone size={16} />
                <input
                  type="tel"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  placeholder="+256 700 000000"
                  className="phone-input"
                />
              </div>

              {/* CTA */}
              <button
                onClick={handleSaveProfile}
                disabled={!isModalPhoneValid || isUpdatingPhone}
                className={`phone-modal-cta ${accountType === 'seller' ? 'seller-cta' : 'buyer-cta'}`}
              >
                {isUpdatingPhone
                  ? <Loader2 size={17} className="animate-spin" />
                  : accountType === 'seller'
                    ? <><Store size={16} /> Save &amp; Set Up My Store</>
                    : <><CheckCircle2 size={16} /> Save Phone Number</>}
              </button>

              {/* Cancel */}
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
