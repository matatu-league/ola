"use client";

import React, { useState, useEffect } from 'react';
import { Search, Download, CheckCircle2, Truck, Clock, XCircle, Package, Loader2 } from 'lucide-react';

// Tabs map to the real Order.orderStatus enum.
const TABS = [
  { label: 'All Orders', value: '' },
  { label: 'Processing', value: 'processing' },
  { label: 'Confirmed',  value: 'confirmed' },
  { label: 'Shipped',    value: 'shipped' },
  { label: 'Delivered',  value: 'delivered' },
  { label: 'Cancelled',  value: 'cancelled' },
];

const statusStyle = (s) => ({
  delivered:  'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20',
  confirmed:  'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20',
  processing: 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20',
  shipped:    'bg-[#F3E8FF] text-[#9333EA] border-[#9333EA]/20',
  cancelled:  'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20',
}[s] || 'bg-[#F8F8F8] text-[#8A8B91] border-[#E3E3E4]');

const statusIcon = (s) => ({
  delivered:  <CheckCircle2 size={10} />,
  confirmed:  <CheckCircle2 size={10} />,
  processing: <Clock size={10} />,
  shipped:    <Truck size={10} />,
  cancelled:  <XCircle size={10} />,
}[s] || <Package size={10} />);

const payStyle = (s) => ({
  paid:     'text-[#16A34A]',
  pending:  'text-[#D97706]',
  failed:   'text-[#FE2C55]',
  refunded: 'text-[#8A8B91]',
}[s] || 'text-[#8A8B91]');

const money = (n) => `USh ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return '—'; } };

export default function OrdersPage() {
  const [activeTab,   setActiveTab]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders,      setOrders]      = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const load = async (status, page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (status) params.set('status', status);
      const res  = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
        setPagination(json.pagination || { page, pages: 1, total: (json.data || []).length, limit: 15 });
      } else {
        setError(json.message || 'Failed to load orders.');
      }
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeTab, 1); /* reset to page 1 on tab change */ }, [activeTab]);

  const goPage = (p) => { if (p >= 1 && p <= pagination.pages) load(activeTab, p); };

  // Client-side search over the loaded page (order #, customer name/email).
  const q = searchQuery.trim().toLowerCase();
  const shown = q
    ? orders.filter(o =>
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.user?.name || '').toLowerCase().includes(q) ||
        (o.user?.email || '').toLowerCase().includes(q))
    : orders;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Orders &amp; Transactions</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Live orders across all vendors.</p>
        </div>
        <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-[#E3E3E4] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors relative ${activeTab === tab.value ? 'text-[#161823]' : 'text-[#8A8B91] hover:text-[#161823]'}`}
          >
            {tab.label}
            {activeTab === tab.value && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#161823]" />}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          <input
            type="text"
            placeholder="Search by Order # or Customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-[#E3E3E4] overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8A8B91]">
              <Loader2 size={24} className="animate-spin mb-2" /> <span className="text-[13px]">Loading orders…</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-[#FE2C55] text-[13px] font-semibold">{error}</div>
          ) : shown.length === 0 ? (
            <div className="py-20 text-center text-[#8A8B91] text-[13px]">No orders found.</div>
          ) : (
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E3E4]">
                {shown.map((o) => (
                  <tr key={o._id} className="hover:bg-[#F8F8F8] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#161823]">{o.orderNumber || `#${String(o._id).slice(-6)}`}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#161823]">{o.user?.name || o.shippingAddress?.fullName || 'Guest'}</div>
                      <div className="text-[11px] text-[#8A8B91] mt-0.5">{o.user?.email || o.shippingAddress?.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-[#8A8B91]">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#161823]">{money(o.totalAmount)}</div>
                      <div className="text-[11px] text-[#8A8B91]">{(o.items?.length || 0)} item{(o.items?.length || 0) !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${payStyle(o.paymentStatus)}`}>{o.paymentStatus || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${statusStyle(o.orderStatus)}`}>
                        {statusIcon(o.orderStatus)}
                        {o.orderStatus || 'processing'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && shown.length > 0 && (
          <div className="border-t border-[#E3E3E4] px-4 py-3 flex items-center justify-between bg-white">
            <span className="text-[12px] text-[#8A8B91] font-medium">
              Page {pagination.page} of {pagination.pages} · {pagination.total} order{pagination.total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-1">
              <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50">Prev</button>
              <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
