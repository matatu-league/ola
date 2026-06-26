"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Download, Filter, Eye, X, 
  Truck, CheckCircle2, Clock, XCircle, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, PackageCheck, MapPin, Phone
} from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filter State
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Drawer State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const tabs = [
    { label: 'All Orders', value: 'All Orders' },
    { label: 'Processing', value: 'processing' },
    { label: 'Confirmed',  value: 'confirmed' }, // Represents "Ready for Dispatch"
    { label: 'Shipped',    value: 'shipped' },
    { label: 'Delivered',  value: 'delivered' },
    { label: 'Cancelled',  value: 'cancelled' }
  ];

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue);
    setPage(1);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page, limit, status: activeTab, search: debouncedSearch
      });
      const res = await fetch(`/api/stores/orders?${queryParams.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      } else {
        setError(data.error || 'Failed to load orders.');
      }
    } catch (err) {
      setError('A network error occurred while fetching orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, limit, activeTab, debouncedSearch]);

  // ── ORDER ACTION: Mark Ready for Dispatch ──────────────────────────────────
  const handleMarkReadyForDispatch = async (orderId) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/stores/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ready_for_dispatch' })
      });
      const data = await res.json();

      if (data.success) {
        // Update local state instantly
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: 'confirmed' } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: 'confirmed' });
        }
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (err) {
      alert('Network error while updating order.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openDrawer = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedOrder(null), 300); // Wait for transition
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-50 text-green-600 border-green-200';
      case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'processing': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-500 border-red-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle2 size={12} />;
      case 'confirmed': return <PackageCheck size={12} />;
      case 'processing': return <Clock size={12} />;
      case 'shipped': return <Truck size={12} />;
      case 'cancelled': return <XCircle size={12} />;
      default: return null;
    }
  };

  // ── Overlapping Square Images ──────────────────────────────────────────────
  const OrderItemsVisual = ({ items }) => {
    if (!items || items.length === 0) return null;
    const maxVisible = 3;
    const visibleItems = items.slice(0, maxVisible);
    const remainingCount = items.length - maxVisible;

    return (
      <div className="flex items-center">
        {visibleItems.map((item, idx) => (
          <div 
            key={item.product?._id || idx}
            className={`relative w-8 h-8 bg-white border border-gray-200 overflow-hidden rounded-none flex-shrink-0 flex items-center justify-center shadow-sm ${idx > 0 ? '-ml-2' : ''}`}
            style={{ zIndex: 10 - idx }}
          >
            {item.image || item.product?.image ? (
              <img src={item.image || item.product?.image} alt="Product" className="w-full h-full object-cover" />
            ) : <span className="text-xs text-gray-500">📦</span>}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="relative w-8 h-8 bg-gray-50 border border-gray-200 rounded-none flex items-center justify-center text-xs font-bold text-gray-500 -ml-2 shadow-sm" style={{ zIndex: 0 }}>
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  const startItem = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, pagination.total);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8">
      
      {/* ── Main Page Content ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and prepare orders for admin dispatch.</p>
        </div>
        <button className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab.value ? 'text-blue-600' : 'text-gray-500 hover:text-black'}`}
          >
            {tab.label}
            {activeTab === tab.value && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-none py-2 pl-9 pr-3 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>
        <button className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2 rounded-none font-semibold text-sm transition-colors flex items-center gap-2 shrink-0">
          <Filter size={16} /> Filters
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-none border bg-red-50 border-red-200 text-red-600 text-sm font-semibold flex items-center gap-2 mb-6">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 w-[120px]">Products</th>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-black mx-auto mb-3" />
                    <span className="text-gray-500 text-sm font-medium">Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-none flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-gray-400" />
                    </div>
                    <span className="text-black text-sm font-bold block mb-1">No orders found</span>
                    <span className="text-gray-500 text-xs">Try adjusting your search or filters.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <OrderItemsVisual items={order.items} />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-black">
                      {order.orderNumber || `#${order._id.substring(order._id.length - 6).toUpperCase()}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-black text-sm">{order.user?.name || 'Guest User'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{order.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-UG', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-black text-sm">UGX {order.storeTotal?.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 font-semibold mt-0.5">{order.items?.length || 0} Products</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-xs font-bold uppercase tracking-wider border ${getStatusStyle(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus === 'confirmed' ? 'Ready for Dispatch' : order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => openDrawer(order)}
                        className="px-4 py-2 bg-white border border-gray-200 text-black text-xs font-bold rounded-none hover:border-black transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-gray-200 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 gap-3 shrink-0">
          <span className="text-xs text-gray-500 font-semibold text-center sm:text-left">
            Showing {startItem} to {endItem} of {pagination.total} results
          </span>
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="flex items-center justify-center px-3 py-1.5 border border-gray-200 rounded-none bg-white text-black hover:border-black disabled:opacity-50 disabled:hover:border-gray-200 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = page - 2 + i;
              if (page <= 3) pageNum = i + 1;
              if (page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
              if (pageNum > 0 && pageNum <= pagination.totalPages) {
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                    className={`min-w-[32px] px-2 py-1.5 border rounded-none text-xs font-bold transition-colors ${page === pageNum ? 'text-blue-600 bg-blue-50 border-blue-600' : 'bg-white text-black border-gray-200 hover:border-black'}`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
            <button 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages || pagination.totalPages === 0 || isLoading}
              className="flex items-center justify-center px-3 py-1.5 border border-gray-200 rounded-none bg-white text-black hover:border-black disabled:opacity-50 disabled:hover:border-gray-200 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Slide-out Drawer ──────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={closeDrawer}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white border-l border-gray-200 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 rounded-none">
            {selectedOrder && (
              <>
                {/* Drawer Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50">
                  <div>
                    <h2 className="text-base font-bold text-black">
                      Order {selectedOrder.orderNumber || `#${selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}`}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-none text-xs font-bold uppercase tracking-wider border ${getStatusStyle(selectedOrder.orderStatus)}`}>
                      {getStatusIcon(selectedOrder.orderStatus)}
                      {selectedOrder.orderStatus === 'confirmed' ? 'Ready for Dispatch' : selectedOrder.orderStatus}
                    </span>
                  </div>
                  <button onClick={closeDrawer} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-none transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  
                  {/* Action Banner (If Processing) */}
                  {selectedOrder.orderStatus === 'processing' && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-none">
                      <div className="flex gap-3">
                        <PackageCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                        <div>
                          <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Action Required</h4>
                          <p className="text-sm text-gray-500 mt-1 mb-4 leading-relaxed">
                            Once you have packaged these items, mark them as ready. The platform admin will be notified to handle pickup and delivery.
                          </p>
                          <button
                            onClick={() => handleMarkReadyForDispatch(selectedOrder._id)}
                            disabled={isActionLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Mark Ready for Dispatch'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products Section */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Products to Fulfill</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex gap-3 p-4 border border-gray-200 rounded-none bg-white">
                          <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-none overflow-hidden shrink-0">
                            {item.image || item.product?.image ? (
                              <img src={item.image || item.product?.image} alt="" className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-black truncate">{item.name}</p>
                            {item.variants && Object.keys(item.variants).length > 0 && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {Object.values(item.variants).join(' / ')}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-semibold text-gray-500">Qty: {item.quantity}</span>
                              <span className="text-sm font-bold text-black">UGX {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Details</h3>
                    <div className="p-4 border border-gray-200 rounded-none bg-gray-50 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Customer</p>
                        <p className="text-sm font-bold text-black">{selectedOrder.user?.name || 'Guest User'}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.user?.email || 'No email provided'}</p>
                      </div>
                      
                      {selectedOrder.shippingAddress && (
                        <>
                          <div className="h-px w-full bg-gray-200" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><MapPin size={14}/> Shipping Address</p>
                            <p className="text-sm text-black leading-relaxed">
                              {selectedOrder.shippingAddress.addressLine1}<br/>
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}
                            </p>
                          </div>
                          <div className="h-px w-full bg-gray-200" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Phone size={14}/> Contact</p>
                            <p className="text-sm text-black">{selectedOrder.shippingAddress.phone}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-semibold">Store Earnings from Order</span>
                    <span className="text-base font-bold text-black">UGX {selectedOrder.storeTotal?.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
