'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ClipboardList, Settings, LogOut,
  Menu, Bell, Search, Store, Palette, X, Layers, CalendarCheck,
  MessageSquare,
} from 'lucide-react';
import { io as socketIO } from 'socket.io-client';

const navigation = [
  { name: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard },
  { name: 'Products',     href: '/products',    icon: Package         },
  { name: 'Services',     href: '/services',    icon: CalendarCheck   },
  { name: 'Collections',  href: '/collections', icon: Layers          },
  { name: 'Orders',       href: '/orders',      icon: ClipboardList   },
  { name: 'Messages',     href: '/messages',    icon: MessageSquare   },
  { name: 'Store Profile', href: '/profile',    icon: Store           },
  { name: 'Theme & Design', href: '/theme',     icon: Palette         },
  { name: 'Settings',     href: '/settings',    icon: Settings        },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRootDomain() {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;
  const parts      = hostname.split('.');
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  return `${protocol}//${rootDomain}${port ? `:${port}` : ''}`;
}

function getSessionUser() {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.split('; ').find(c => c.startsWith('user_session='));
    if (!match) return null;
    let raw = decodeURIComponent(match.split('=')[1]);
    if (raw.startsWith('%7B')) raw = decodeURIComponent(raw);
    return JSON.parse(raw);
  } catch { return null; }
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function SellerLayout({ children }) {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user,             setUser]             = useState(null);
  const [isCheckingStore,  setIsCheckingStore]  = useState(true);
  const [unreadCount,      setUnreadCount]      = useState(0);

  const isStorefrontRoot = pathname === '/';

  useEffect(() => {
    if (isStorefrontRoot) {
      setIsCheckingStore(false);
      return;
    }

    const rootDomain = getRootDomain();
    const parsedUser = getSessionUser();

    if (!parsedUser) {
      window.location.href = `${rootDomain}/`;
      return;
    }

    setUser(parsedUser);

    fetch('/api/messages/unread')
      .then(r => r.json())
      .then(data => { if (data.success) setUnreadCount(data.totalUnread); })
      .catch(() => {});

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket    = socketIO(socketUrl, {
      auth:         { userId: parsedUser.id },
      transports:   ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('notification:unread', () => {
      fetch('/api/messages/unread')
        .then(r => r.json())
        .then(data => { if (data.success) setUnreadCount(data.totalUnread); })
        .catch(() => {});
    });

    socket.on('message:new', (msg) => {
      if (String(msg.sender?._id || msg.sender) !== String(parsedUser.id)) {
        setUnreadCount(prev => prev + 1);
      }
    });

    fetch('/api/stores', { headers: { Cookie: document.cookie } })
      .then(async res => {
        if (!res.ok) throw new Error('API Failed');
        return res.json();
      })
      .then(data => {
        const isOnboardingRoute = pathname.includes('/stores/onboarding');
        const currentHost       = window.location.hostname;

        if (data.hasStore === false && !isOnboardingRoute) {
          window.location.href = `${rootDomain}/stores/onboarding`;
          return;
        }

        if (data.hasStore === true) {
          let storeDomain = data.store?.domain || parsedUser.domain;

          if (storeDomain && !storeDomain.includes('.ola.ug') && !storeDomain.includes('localhost')) {
            storeDomain = `${storeDomain}.ola.ug`;
          }

          const isMainDomain =
            currentHost === 'ola.ug' ||
            currentHost === 'www.ola.ug' ||
            currentHost === 'localhost' ||
            !currentHost.includes('.');

          if (isOnboardingRoute || isMainDomain) {
            const protocol = currentHost.includes('localhost') ? 'http://' : 'https://';
            window.location.href = storeDomain
              ? `${protocol}${storeDomain}/dashboard`
              : `${rootDomain}/dashboard`;
            return;
          }
        }

        setIsCheckingStore(false);
      })
      .catch(err => {
        console.error('Store check failed', err);
        const isOnboardingRoute = pathname.includes('/stores/onboarding');
        const currentHost       = window.location.hostname;

        if (parsedUser.hasStore) {
          let storeDomain = parsedUser.domain;
          if (storeDomain && !storeDomain.includes('.ola.ug') && !storeDomain.includes('localhost')) {
            storeDomain = `${storeDomain}.ola.ug`;
          }

          const isMainDomain =
            currentHost === 'ola.ug' ||
            currentHost === 'www.ola.ug' ||
            currentHost === 'localhost' ||
            !currentHost.includes('.');

          if (isOnboardingRoute || isMainDomain) {
            const protocol = currentHost.includes('localhost') ? 'http://' : 'https://';
            window.location.href = storeDomain
              ? `${protocol}${storeDomain}/dashboard`
              : `${rootDomain}/dashboard`;
            return;
          }
        } else if (!isOnboardingRoute) {
          window.location.href = `${rootDomain}/stores/onboarding`;
          return;
        }

        setIsCheckingStore(false);
      });
  }, [pathname, isStorefrontRoot]);

  const handleSignOut = () => {
    const { hostname } = window.location;
    const parts      = hostname.split('.');
    const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
    document.cookie = `user_session=; Max-Age=0; path=/; domain=.${rootDomain};`;
    document.cookie = `user_session=; Max-Age=0; path=/;`;
    window.location.href = getRootDomain() + '/';
  };

  const getPageTitle = () => {
    const match = navigation.find(nav => pathname.includes(nav.href));
    return match ? match.name : 'Dashboard';
  };

  if (isStorefrontRoot) {
    return <>{children}</>;
  }

  if (isCheckingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-black rounded-none" />
      </div>
    );
  }

  if (pathname?.includes('/stores/onboarding')) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white flex text-black">

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Dark (#001529) */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[240px]
          bg-[#001529] flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-white/10 justify-between shrink-0">
          <a href={getRootDomain()} className="text-white font-bold text-xl tracking-tight leading-none relative">
            ola
            <span className="absolute -top-0 -right-2 text-blue-500 text-xl leading-none">.</span>
          </a>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <p className="px-3 text-xs font-bold text-white/40 uppercase tracking-wider mb-2 mt-2">
            Menu
          </p>
          {navigation.map(item => {
            const isActive = pathname.includes(item.href);
            const Icon     = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-semibold transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <div className="relative">
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-white' : 'text-white/60'}
                  />
                  {item.href === '/messages' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-none px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">{item.name}</span>
                {item.href === '/messages' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-none leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-white/10">
          <div
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-red-500 cursor-pointer transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">

        {/* Top header */}
        {/* <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 rounded-none lg:hidden text-black hover:bg-gray-50"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-black tracking-tight hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-5">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-[220px] bg-gray-50 border border-gray-300 rounded-none pl-8 pr-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors placeholder:text-gray-400"
              />
            </div>

            <button className="relative p-1.5 text-gray-500 hover:text-black transition-colors rounded-none hover:bg-gray-50">
              <Bell size={18} />
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-none" />
            </button>

            <div className="h-5 w-px bg-gray-200 hidden sm:block" />

            <div className="flex items-center gap-2.5 cursor-pointer group">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-7 h-7 rounded-none object-cover border border-gray-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-none bg-black text-white flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0) || 'S'}
                </div>
              )}
              <p className="hidden sm:block text-sm font-bold text-black leading-tight group-hover:text-blue-600 transition-colors">
                {user?.name || 'Seller'}
              </p>
            </div>
          </div>
        </header> */}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          <div className="mx-auto bg-white">{children}</div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}} />
    </div>
  );
}