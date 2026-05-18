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
  X,
  Users,
  MessageSquare,
  LifeBuoy,
  Activity,
  ScrollText,
  ShieldCheck,
  ChevronDown,
  Tags
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'System Monitoring', href: '/admin/monitoring', icon: Activity },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Categories', href: '/admin/categories', icon: Tags },
      { name: 'Orders & Transactions', href: '/admin/orders', icon: ClipboardList },
      { name: 'All Products', href: '/admin/products', icon: Package },
      { name: 'Users & Customers', href: '/admin/users', icon: Users },
      { name: 'Stores', href: '/admin/stores', icon: Store },
    ]
  },
  {
    title: 'Communication',
    items: [
      { name: 'Live Chat', href: '/admin/chat', icon: MessageSquare },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Global Settings', href: '/admin/settings', icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Replace this with your actual authentication fetch/check
    const timer = setTimeout(() => {
      setUser({ name: 'Super Admin', role: 'System Administrator', avatar: '' });
      setIsCheckingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = () => {
    document.cookie = 'user_session=; Max-Age=0; path=/';
    router.push('/admin/login');
  };

  const getPageTitle = () => {
    for (const group of navigationGroups) {
      const currentRoute = group.items.find(nav => pathname?.includes(nav.href));
      if (currentRoute) return currentRoute.name;
    }
    return 'Admin Control Panel';
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin w-8 h-8 border-2 border-[#E3E3E4] border-t-[#161823]"></div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-[#F8F9FA]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#161823] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-[#E3E3E4] flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="h-[64px] flex items-center px-6 border-b border-[#E3E3E4] justify-between shrink-0">
          <Link href="/admin/dashboard" className="text-[#161823] font-black text-2xl tracking-tighter leading-none relative flex items-center gap-2">
            <div className="w-8 h-8 bg-[#161823] flex items-center justify-center text-white">
               <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            Admin<span className="text-[#FE2C55]">.</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-[#8A8B91] hover:text-[#161823] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links Grouped */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {navigationGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-[#8A8B91] uppercase tracking-wider mb-2">
                {group.title}
              </p>
              {group.items.map((item) => {
                const isActive = pathname?.includes(item.href);
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200
                      ${isActive
                        ? 'bg-[#161823] text-white'
                        : 'text-[#5A5B60] hover:bg-[#F2F2F3] hover:text-[#161823]'}
                    `}
                  >
                    <Icon 
                      size={18} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={isActive ? 'text-white' : 'text-[#8A8B91] group-hover:text-[#161823]'} 
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Actions */}
        <div className="p-4 border-t border-[#E3E3E4] bg-[#FAFAFA]">
          <div
            onClick={handleSignOut}
            className="flex items-center justify-between px-3 py-2.5 text-[13.5px] font-semibold text-[#5A5B60] hover:bg-[#FEECEF] hover:text-[#FE2C55] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span>Sign Out Session</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-[64px] bg-white border-b border-[#E3E3E4] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 lg:hidden text-[#161823] hover:bg-[#F2F2F3] transition-colors"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#161823] tracking-tight hidden sm:block">
                {getPageTitle()}
              </h1>
              <p className="text-[12px] text-[#8A8B91] hidden sm:block font-medium mt-0.5">
                Super Admin Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            {/* Global Search */}
            <div className="relative hidden md:block group">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8B91] group-focus-within:text-[#161823] transition-colors" />
              <input
                type="text"
                placeholder="Search users, orders, settings..."
                className="w-[280px] pl-10 pr-4 py-2 bg-[#F2F2F3] border border-transparent text-[13px] font-medium focus:outline-none focus:border-[#E3E3E4] focus:bg-white transition-all placeholder:text-[#8A8B91]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-[#8A8B91] bg-white border border-[#E3E3E4]">⌘</kbd>
                <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-[#8A8B91] bg-white border border-[#E3E3E4]">K</kbd>
              </div>
            </div>

            <button className="relative p-2 text-[#8A8B91] hover:text-[#161823] transition-colors hover:bg-[#F2F2F3]">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#FE2C55] border-2 border-white"></span>
            </button>

            <div className="h-6 w-px bg-[#E3E3E4] hidden sm:block mx-1"></div>

            {/* Profile Element */}
            <div className="flex items-center gap-3 cursor-pointer group hover:bg-[#F2F2F3] p-1.5 pr-3 transition-colors">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-8 h-8 object-cover border-2 border-white" />
              ) : (
                <div className="w-8 h-8 bg-[#161823] text-white flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-[13px] font-bold text-[#161823] leading-none mb-1">{user?.name || 'Administrator'}</p>
                <p className="text-[11px] font-semibold text-[#8A8B91] leading-none uppercase tracking-wider">{user?.role || 'Super Admin'}</p>
              </div>
              <ChevronDown size={14} className="text-[#8A8B91] hidden sm:block ml-1" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative bg-white">
          <div className="max-w-[1400px] mx-auto relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}