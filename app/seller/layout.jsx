"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search,
  Store,
  Palette,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/seller/products', icon: Package },
  { name: 'Orders', href: '/seller/orders', icon: ClipboardList },
  { name: 'Store Profile', href: '/seller/profile', icon: Store },
  { name: 'Theme & Design', href: '/seller/theme', icon: Palette },
  { name: 'Settings', href: '/seller/settings', icon: Settings },
];

export default function SellerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingStore, setIsCheckingStore] = useState(true);

  useEffect(() => {
    const getSessionUser = () => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));

      if (sessionCookie) {
        try {
          const rawValue = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
          let decodedValue = decodeURIComponent(rawValue);
          if (decodedValue.startsWith('%7B')) {
            decodedValue = decodeURIComponent(decodedValue);
          }
          return JSON.parse(decodedValue);
        } catch (e) {
          console.error("Failed to parse session cookie", e);
          return null;
        }
      }
      return null;
    };

    const parsedUser = getSessionUser();

    if (parsedUser) {
      setUser(parsedUser);

      fetch('/api/seller/store', { headers: { 'ngrok-skip-browser-warning': 'true' } })
        .then(res => res.json())
        .then(data => {
          if (data.hasStore === false && !pathname.includes('/seller/onboarding')) {
            router.push('/seller/onboarding');
          } else if (data.hasStore === true && pathname.includes('/seller/onboarding')) {
            router.push('/seller/dashboard');
          } else {
            setIsCheckingStore(false);
          }
        })
        .catch((err) => {
          console.error("Store check failed", err);
          if (!pathname.includes('/seller/onboarding')) {
            router.push('/seller/onboarding');
          } else {
            setIsCheckingStore(false);
          }
        });
    } else {
      router.push('/');
    }
  }, [pathname, router]);

  const handleSignOut = () => {
    document.cookie = 'user_session=; Max-Age=0; path=/';
    router.push('/');
  };

  const getPageTitle = () => {
    const currentRoute = navigation.find(nav => pathname.includes(nav.href));
    return currentRoute ? currentRoute.name : 'Dashboard';
  };

  if (isCheckingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-[#E3E3E4] border-t-[#161823] rounded-full"></div>
      </div>
    );
  }

  if (pathname?.includes('/seller/onboarding')) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex text-[#161823]">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[240px] bg-white border-r border-[#E3E3E4] flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-[60px] flex items-center px-5 border-b border-[#E3E3E4] justify-between shrink-0">
          <Link href="/" className="text-[#161823] font-bold text-2xl tracking-tight leading-none relative">
            Ola<span className="absolute -top-0 -right-2 text-[#FE2C55] text-2xl leading-none">.</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-[#8A8B91] hover:text-[#161823]">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="px-3 text-[11px] font-bold text-[#8A8B91] uppercase tracking-wider mb-2 mt-2">Menu</p>
          {navigation.map((item) => {
            const isActive = pathname.includes(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13px] font-semibold transition-colors
                  ${isActive
                    ? 'bg-[#F8F8F8] text-[#161823]'
                    : 'text-[#8A8B91] hover:bg-[#F8F8F8] hover:text-[#161823]'}
                `}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#161823]' : 'text-[#8A8B91]'} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-[#E3E3E4]">
          <div
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-[13px] font-semibold text-[#8A8B91] hover:bg-[#F8F8F8] hover:text-[#FE2C55] cursor-pointer transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Header */}
        <header className="h-[60px] bg-white border-b border-[#E3E3E4] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 rounded-sm lg:hidden text-[#161823] hover:bg-[#F8F8F8]"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-[#161823] tracking-tight hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-5">
            {/* Global Search */}
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
              <input
                type="text"
                placeholder="Search..."
                className="w-[220px] pl-8 pr-3 py-1.5 bg-[#F8F8F8] border border-transparent rounded-sm text-[13px] font-medium focus:outline-none focus:border-[#E3E3E4] focus:bg-white transition-all placeholder:text-[#8A8B91]"
              />
            </div>

            <button className="relative p-1.5 text-[#8A8B91] hover:text-[#161823] transition-colors rounded-sm hover:bg-[#F8F8F8]">
              <Bell size={18} />
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-[#FE2C55] rounded-full"></span>
            </button>

            <div className="h-5 w-px bg-[#E3E3E4] hidden sm:block"></div>

            {/* Profile Element */}
            <div className="flex items-center gap-2.5 cursor-pointer group">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-[#E3E3E4]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#161823] text-white flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-bold text-[#161823] leading-tight group-hover:text-[#FE2C55] transition-colors">{user?.name || 'Seller'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto bg-white">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}