'use client';

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
  Layers,
  CalendarCheck,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Services', href: '/services', icon: CalendarCheck },
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Orders', href: '/orders', icon: ClipboardList },
  { name: 'Store Profile', href: '/profile', icon: Store },
  { name: 'Theme & Design', href: '/theme', icon: Palette },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function SellerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingStore, setIsCheckingStore] = useState(true);

  // Dynamically construct root domain
  const getRootDomain = () => {
    if (typeof window === 'undefined') return '';
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const host = window.location.hostname;

    const parts = host.split('.');
    const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : host;

    return `${protocol}//${rootDomain}${port}`;
  };

  useEffect(() => {
    const rootDomain = getRootDomain();

    const getSessionUser = () => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find((c) =>
        c.trim().startsWith('user_session='),
      );

      if (sessionCookie) {
        try {
          const rawValue = sessionCookie.substring(
            sessionCookie.indexOf('=') + 1,
          );
          let decodedValue = decodeURIComponent(rawValue);
          if (decodedValue.startsWith('%7B'))
            decodedValue = decodeURIComponent(decodedValue);
          return JSON.parse(decodedValue);
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    const parsedUser = getSessionUser();

    // Kick out if cookie completely missing
    if (!parsedUser) {
      window.location.href = `${rootDomain}/`;
      return;
    }

    setUser(parsedUser);

    fetch('/api/stores', {
      headers: { 'Cookie': document.cookie, },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('API Failed');
        return res.json();
      })
      .then((data) => {
        const isOnboardingRoute = pathname.includes('/stores/onboarding');
        const currentHost = window.location.hostname;

        if (data.hasStore === false && !isOnboardingRoute) {
          window.location.href = `${rootDomain}/stores/onboarding`;
        } else if (data.hasStore === true) {
          // FIX: Ensure the domain is strictly formatted!
          let storeDomain = data.store?.domain || parsedUser.domain;

          if (
            storeDomain &&
            !storeDomain.includes('.ola.ug') &&
            !storeDomain.includes('localhost')
          ) {
            storeDomain = `${storeDomain}.ola.ug`;
          }

          const isMainDomain =
            currentHost === 'ola.ug' ||
            currentHost === 'www.ola.ug' ||
            currentHost === 'localhost' ||
            !currentHost.includes('.'); // any flat hostname in dev
          if (isOnboardingRoute || isMainDomain) {
            const protocol = window.location.hostname.includes('localhost')
              ? 'http://'
              : 'https://';
            window.location.href = storeDomain
              ? `${protocol}${storeDomain}/dashboard`
              : `${rootDomain}/dashboard`;
          } else {
            setIsCheckingStore(false);
          }
        } else {
          setIsCheckingStore(false);
        }
      })
      .catch((err) => {
        console.error('Store check failed', err);
        const isOnboardingRoute = pathname.includes('/stores/onboarding');
        const currentHost = window.location.hostname;

        // Fallback: rely strictly on session cookie if API fails
        if (parsedUser.hasStore) {
          let storeDomain = parsedUser.domain;
          if (
            storeDomain &&
            !storeDomain.includes('.ola.ug') &&
            !storeDomain.includes('localhost')
          ) {
            storeDomain = `${storeDomain}.ola.ug`;
          }

          const isMainDomain =
            currentHost === 'ola.ug' ||
            currentHost === 'www.ola.ug' ||
            currentHost === 'localhost' ||
            !currentHost.includes('.'); // any flat hostname in dev
          if (isOnboardingRoute || isMainDomain) {
            const protocol = window.location.hostname.includes('localhost')
              ? 'http://'
              : 'https://';
            window.location.href = storeDomain
              ? `${protocol}${storeDomain}/dashboard`
              : `${rootDomain}/dashboard`;
          } else {
            setIsCheckingStore(false);
          }
        } else if (!isOnboardingRoute) {
          window.location.href = `${rootDomain}/stores/onboarding`;
        } else {
          setIsCheckingStore(false);
        }
      });
  }, [pathname]);

  const handleSignOut = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;

    document.cookie = `user_session=; Max-Age=0; path=/; domain=.${rootDomain};`;
    document.cookie = `user_session=; Max-Age=0; path=/;`; // Fallback
    window.location.href = getRootDomain() + '/';
  };

  const getPageTitle = () => {
    const currentRoute = navigation.find((nav) => pathname.includes(nav.href));
    return currentRoute ? currentRoute.name : 'Dashboard';
  };

  if (isCheckingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-[#E3E3E4] border-t-[#161823] rounded-full"></div>
      </div>
    );
  }

  if (pathname?.includes('/stores/onboarding')) {
    return <div className="min-h-screen bg-white">{children}</div>;
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
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[240px] bg-white border-r border-[#E3E3E4] flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="h-[60px] flex items-center px-5 border-b border-[#E3E3E4] justify-between shrink-0">
          <a
            href={getRootDomain()}
            className="text-[#161823] font-bold text-2xl tracking-tight leading-none relative"
          >
            Ola
            <span className="absolute -top-0 -right-2 text-[#FE2C55] text-2xl leading-none">
              .
            </span>
          </a>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-[#8A8B91] hover:text-[#161823]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <p className="px-3 text-[11px] font-bold text-[#8A8B91] uppercase tracking-wider mb-2 mt-2">
            Menu
          </p>
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
                  ${isActive ? 'bg-[#F8F8F8] text-[#161823]' : 'text-[#8A8B91] hover:bg-[#F8F8F8] hover:text-[#161823]'}
                `}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-[#161823]' : 'text-[#8A8B91]'}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
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
            <div className="relative hidden md:block">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]"
              />
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

            <div className="flex items-center gap-2.5 cursor-pointer group">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-[#E3E3E4]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#161823] text-white flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-bold text-[#161823] leading-tight group-hover:text-[#FE2C55] transition-colors">
                  {user?.name || 'Seller'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          <div className="max-w-6xl mx-auto bg-white">{children}</div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
      `,
        }}
      />
    </div>
  );
}
