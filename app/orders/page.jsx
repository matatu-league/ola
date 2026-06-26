"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import {
  Search, ShieldCheck, MapPin, ShoppingCart, Inbox, LogOut, Phone,
  LayoutDashboard, Loader2, AlertCircle, User, ChevronDown,
  MessageSquare, ClipboardList,
  CheckCircle2, Clock, Truck, XCircle, RefreshCw,
} from 'lucide-react';
import MessagePopover from '@/components/marketplace/MessagePopover';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  processing: { label: 'Processing', color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]', border: 'border-[#FCD34D]', Icon: Clock        },
  confirmed:  { label: 'Confirmed',  color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]', border: 'border-[#93C5FD]', Icon: CheckCircle2 },
  shipped:    { label: 'Shipped',    color: 'text-[#8B5CF6]', bg: 'bg-[#F5F3FF]', border: 'border-[#C4B5FD]', Icon: Truck        },
  delivered:  { label: 'Delivered',  color: 'text-[#10B981]', bg: 'bg-[#F0FDF4]', border: 'border-[#6EE7B7]', Icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]', border: 'border-[#FCA5A5]', Icon: XCircle      },
};

const PAYMENT_STATUS_CONFIG = {
  pending:  { label: 'Awaiting Payment', color: 'text-[#F59E0B]' },
  paid:     { label: 'Paid',             color: 'text-[#10B981]' },
  failed:   { label: 'Payment Failed',   color: 'text-[#EF4444]' },
  refunded: { label: 'Refunded',         color: 'text-[#6366F1]' },
};

const TABS = [
  { id: 'all',        label: 'All',        statusFilter: null          },
  { id: 'processing', label: 'Processing', statusFilter: 'processing'  },
  { id: 'confirmed',  label: 'Confirmed',  statusFilter: 'confirmed'   },
  { id: 'shipped',    label: 'Shipped',    statusFilter: 'shipped'     },
  { id: 'delivered',  label: 'Delivered',  statusFilter: 'delivered'   },
  { id: 'cancelled',  label: 'Cancelled',  statusFilter: 'cancelled'   },
];

// ==========================================
// TOP NAV
// ==========================================
const BuyerTopNav = ({ user, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-white border-b border-[#E3E3E4] shrink-0 z-50">
      <div className="max-w-[1400px] w-full mx-auto px-4 py-3 flex items-center justify-between gap-6">

        <Link href="/" className="shrink-0 select-none">
          <span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">
            Ola<span className="text-[#161823]">.ug</span>
          </span>
        </Link>

        <div className="flex items-center gap-5 lg:gap-7 shrink-0">

          <div className="hidden lg:flex items-center gap-2">
            <MapPin size={18} className="text-[#8A8B91]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8A8B91] leading-none mb-0.5">Deliver to</span>
              <span className="text-[12px] font-bold text-[#161823] leading-none">Uganda</span>
            </div>
          </div>

          <div
            className="relative flex items-center gap-2 cursor-pointer py-2"
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full border border-[#E3E3E4] object-cover" />
              : <User size={20} className="text-[#161823]" />
            }
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-[#8A8B91] leading-none mb-0.5 truncate max-w-[80px]">
                {user ? `Hi, ${user.name?.split(' ')[0]}` : 'Account'}
              </span>
              <span className="text-[12px] font-bold text-[#161823] flex items-center leading-none">
                Account <ChevronDown size={12} className="ml-0.5" />
              </span>
            </div>

            {showMenu && user && (
              <div className="absolute top-full right-0 w-[260px] bg-white border border-[#E3E3E4] rounded-sm shadow-lg z-50 py-1">
                <div className="px-4 py-3 border-b border-[#E3E3E4] flex items-center gap-3">
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border border-[#E3E3E4]" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#161823] leading-tight truncate">{user.name}</p>
                    <p className="text-[11px] text-[#8A8B91] truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  href={user.hasStore ? '/store/dashboard' : '/stores/onboarding'}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#161823] hover:bg-[#F8F8F8] transition-colors"
                >
                  <LayoutDashboard size={14} className="text-[#8A8B91]" /> Seller Portal
                </Link>
                <div className="border-t border-[#E3E3E4] my-1" />
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#FE2C55] hover:bg-[#FFF0F3] transition-colors"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>

          <Link href="/messages" className="flex flex-col items-center group">
            <MessageSquare size={20} className="text-[#161823] group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-[#161823] mt-1 hidden md:block">Messages</span>
          </Link>

          <Link href="/orders" className="flex flex-col items-center">
            <Inbox size={20} className="text-[#FE2C55]" />
            <span className="text-[11px] font-bold text-[#FE2C55] mt-1 hidden md:block">Orders</span>
          </Link>

          <Link href="/" className="flex flex-col items-center group">
            <ShoppingCart size={20} className="text-[#161823] group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-[#161823] mt-1 hidden md:block">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// ORDER CARD — now with Chat about order button
// ==========================================
const OrderCard = ({ order }) => {
  const orderCfg   = STATUS_CONFIG[order.orderStatus]           || STATUS_CONFIG.processing;
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.pending;
  const { Icon }   = orderCfg;
  const addr       = order.shippingAddress;

  // Derive store/seller info from order
  // Try multiple fields: order-level, then first item, then storeOwner/seller fields
  const firstItem  = order.items?.[0];
  const sellerId   =
    order.sellerId            ||
    order.storeOwnerId        ||
    order.storeId             ||
    firstItem?.sellerId       ||
    firstItem?.storeOwnerId   ||
    firstItem?.storeId;

  const storeInfo  = order.store || {
    _id:    order.storeId   || firstItem?.storeId,
    title:  order.storeName || firstItem?.storeName || 'Store',
    logo:   order.storeLogo || firstItem?.storeLogo,
  };

  return (
    <div className="border border-[#E3E3E4] rounded-sm bg-white overflow-hidden">

      <div className="bg-[#F8F8F8] border-b border-[#E3E3E4] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 font-semibold text-[#161823]">
            <ShieldCheck size={14} className="text-[#8A8B91]" />
            {order.orderNumber}
          </div>
          <span className="text-[#8A8B91]">
            {new Date(order.createdAt).toLocaleDateString('en-UG', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
          <span className="font-semibold text-[#161823]">
            UGX {Number(order.totalAmount).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold ${paymentCfg.color}`}>
            {paymentCfg.label}
          </span>
          <span className="text-[#E3E3E4]">·</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm border ${orderCfg.color} ${orderCfg.bg} ${orderCfg.border}`}>
            <Icon size={11} /> {orderCfg.label}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col md:flex-row gap-5">

        <div className="flex-1 space-y-4">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-14 h-14 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm shrink-0 overflow-hidden">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#161823] line-clamp-2 leading-tight">
                  {item.name}
                </p>
                {item.variants && Object.keys(item.variants).length > 0 && (
                  <p className="text-[10px] text-[#8A8B91] mt-0.5">
                    {Object.values(item.variants).join(' / ')}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-[#8A8B91]">
                    Qty: <span className="font-bold text-[#161823]">{item.quantity}</span>
                  </span>
                  <span className="text-[#E3E3E4]">·</span>
                  <span className="text-[11px] font-bold text-[#161823]">
                    UGX {Number(item.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {addr && (
            <div className="flex items-start gap-2 pt-3 border-t border-[#E3E3E4] mt-2">
              <MapPin size={13} className="text-[#8A8B91] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#161823]">{addr.fullName}</p>
                <p className="text-[11px] text-[#8A8B91] leading-snug">
                  {[addr.addressLine1, addr.city, addr.country].filter(Boolean).join(', ')}
                </p>
                {(addr.phone || addr.phoneNumber) && (
                  <p className="text-[11px] text-[#8A8B91] flex items-center gap-1 mt-0.5">
                    <Phone size={10} className="shrink-0" />
                    {addr.phone || addr.phoneNumber}
                  </p>
                )}
                {addr.additionalInstructions && (
                  <p className="text-[10px] text-[#8A8B91] italic mt-0.5 line-clamp-1">
                    {addr.additionalInstructions}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions — now includes Chat about order */}
        <div className="w-full md:w-[180px] shrink-0 flex flex-col gap-2 justify-start pt-1 md:border-l md:border-[#E3E3E4] md:pl-4">
          {order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled' && (
            <Link
              href={`/checkout?resumeOrder=${order._id}`}
              className="w-full bg-[#FE2C55] hover:bg-[#e0264b] text-white font-semibold py-2 px-3 rounded-sm text-[12px] transition-colors text-center tracking-tight"
            >
              Complete Payment
            </Link>
          )}

          {/* Chat about order — always shown on every order */}
          {sellerId ? (
            <MessagePopover
              order={order}
              store={storeInfo}
              sellerId={sellerId}
              trigger={
                <button className="w-full bg-[#161823] hover:bg-black text-white font-semibold py-2 px-3 rounded-sm text-[12px] transition-colors flex items-center justify-center gap-1.5">
                  <MessageSquare size={13} />
                  Chat about order
                </button>
              }
            />
          ) : (
            // Fallback when seller ID isn't on the order — link to messages page
            <Link
              href={`/messages?order=${order._id}`}
              className="w-full bg-[#161823] hover:bg-black text-white font-semibold py-2 px-3 rounded-sm text-[12px] transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageSquare size={13} />
              Chat about order
            </Link>
          )}

          {order.orderStatus === 'delivered' && (
            <button className="w-full border border-[#E3E3E4] hover:border-[#161823] text-[#161823] font-semibold py-2 px-3 rounded-sm text-[12px] transition-colors bg-white">
              Buy Again
            </button>
          )}
          <Link
            href={`/orders/${order._id}`}
            className="w-full border border-[#E3E3E4] hover:border-[#161823] text-[#161823] font-semibold py-2 px-3 rounded-sm text-[12px] transition-colors bg-white text-center"
          >
            View Details
          </Link>
          {order.trackingNumber && (
            <p className="text-[10px] text-[#8A8B91] text-center pt-1">
              Tracking: <span className="font-bold text-[#161823]">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN ORDERS CONTENT
// ==========================================
const OrdersContent = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders,    setOrders]    = useState([]);
  const [counts,    setCounts]    = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res  = await fetch('/api/orders/me?limit=50');
        const data = await res.json();
        if (res.status === 401) { setError('Please sign in to view your orders.'); return; }
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load orders');
        setOrders(data.data   || []);
        setCounts(data.counts || {});
      } catch (err) {
        setError(err.message || 'Could not load your orders.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url);
  };

  const filteredOrders = orders.filter(order => {
    const tab = TABS.find(t => t.id === activeTab);
    if (tab?.statusFilter && order.orderStatus !== tab.statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(q) ||
        order.items?.some(i => i.name?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-extrabold text-[#161823] tracking-tight">Your Orders</h1>
          {!isLoading && !error && (
            <span className="text-[12px] text-[#8A8B91]">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="bg-white border border-[#E3E3E4] rounded-sm mb-5 px-1 overflow-x-auto">
          <div className="flex whitespace-nowrap">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const count    = tab.statusFilter ? counts[tab.statusFilter] : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative px-4 py-3 text-[13px] font-medium transition-colors shrink-0 border-none bg-transparent cursor-pointer
                    ${isActive ? 'text-[#161823] font-bold' : 'text-[#8A8B91] hover:text-[#161823]'}`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold bg-[#FFF0F3] text-[#FE2C55] px-1.5 py-0.5 rounded-sm">
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#161823]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center bg-white border border-[#E3E3E4] rounded-sm overflow-hidden hover:border-[#161823] focus-within:border-[#161823] transition-colors max-w-lg">
            <Search size={14} className="ml-3 text-[#8A8B91] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by product name or order number..."
              className="flex-1 px-3 py-2.5 text-[13px] outline-none placeholder-[#8A8B91] text-[#161823] bg-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-[#8A8B91]">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-[13px]">Loading your orders...</p>
          </div>

        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-center bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-12">
            <AlertCircle size={32} className="text-[#FE2C55]" />
            <p className="text-[14px] font-semibold text-[#161823]">{error}</p>
            {error.includes('sign in') ? (
              <Link href="/" className="mt-2 bg-[#161823] hover:bg-black text-white px-5 py-2 rounded-sm text-[12px] font-semibold transition-colors">
                Go to Homepage
              </Link>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 text-[12px] text-[#8A8B91] hover:text-[#161823] mt-1 transition-colors"
              >
                <RefreshCw size={13} /> Try again
              </button>
            )}
          </div>

        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-12">
            <div className="w-16 h-16 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center mb-2">
              <ClipboardList size={28} className="text-[#8A8B91]" />
            </div>
            <p className="text-[15px] font-bold text-[#161823]">
              {search ? 'No orders match your search' : 'No orders yet'}
            </p>
            <p className="text-[12px] text-[#8A8B91]">
              {search ? 'Try a different search term.' : 'When you place an order it will appear here.'}
            </p>
            {!search && (
              <Link
                href="/"
                className="mt-3 bg-[#FE2C55] hover:bg-[#e0264b] text-white px-5 py-2 rounded-sm text-[13px] font-semibold transition-colors tracking-tight"
              >
                Start Shopping
              </Link>
            )}
          </div>

        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default function OrdersPage() {
  const { user, logout } = useUser();

  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-sans">
      <BuyerTopNav user={user} onLogout={logout} />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#8A8B91]" />
        </div>
      }>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
