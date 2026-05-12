"use client";

import React, { useState } from 'react';
import { Search, Download, Filter, MoreHorizontal, Eye, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

  const orders = [
    { id: '#ORD-9021', customer: 'Sarah Jenkins', email: 'sarah.j@example.com', date: 'May 7, 2026', total: '$145.00', items: 3, status: 'Pending' },
    { id: '#ORD-9020', customer: 'Michael Chen', email: 'm.chen@example.com', date: 'May 7, 2026', total: '$89.99', items: 1, status: 'Processing' },
    { id: '#ORD-9019', customer: 'Emma Watson', email: 'emma@example.com', date: 'May 6, 2026', total: '$320.50', items: 4, status: 'Shipped' },
    { id: '#ORD-9018', customer: 'David Miller', email: 'david.m@example.com', date: 'May 5, 2026', total: '$45.00', items: 1, status: 'Completed' },
    { id: '#ORD-9017', customer: 'Olivia Davis', email: 'olivia.d@example.com', date: 'May 5, 2026', total: '$210.00', items: 2, status: 'Cancelled' },
    { id: '#ORD-9016', customer: 'James Wilson', email: 'j.wilson@example.com', date: 'May 4, 2026', total: '$65.00', items: 1, status: 'Completed' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20';
      case 'Processing': return 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20';
      case 'Pending': return 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20';
      case 'Shipped': return 'bg-[#F3E8FF] text-[#9333EA] border-[#9333EA]/20';
      case 'Cancelled': return 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20';
      default: return 'bg-[#F8F8F8] text-[#8A8B91] border-[#E3E3E4]';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={10} />;
      case 'Processing': return <Clock size={10} />;
      case 'Pending': return <Clock size={10} />;
      case 'Shipped': return <Truck size={10} />;
      case 'Cancelled': return <XCircle size={10} />;
      default: return null;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Orders</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage and fulfill your customer orders.</p>
        </div>
        <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-[#E3E3E4] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors relative ${
              activeTab === tab ? 'text-[#161823]' : 'text-[#8A8B91] hover:text-[#161823]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#161823]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823] transition-colors"
          />
        </div>
        <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors shrink-0">
          <Filter size={14} /> Filters
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-sm border border-[#E3E3E4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3E4]">
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-[#F8F8F8] transition-colors group">
                  <td className="px-4 py-3 font-semibold text-[#161823]">{order.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#161823]">{order.customer}</div>
                    <div className="text-[11px] text-[#8A8B91] mt-0.5">{order.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[#8A8B91]">{order.date}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#161823]">{order.total}</div>
                    <div className="text-[11px] text-[#8A8B91]">{order.items} items</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4] rounded-sm transition-colors" title="View Details">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4] rounded-sm transition-colors" title="More Options">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-[#E3E3E4] px-4 py-3 flex items-center justify-between bg-white">
          <span className="text-[12px] text-[#8A8B91] font-medium">Showing 1 to 6 of 42 results</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#161823] bg-[#F8F8F8]">1</button>
            <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8]">2</button>
            <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8]">3</button>
            <button className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}