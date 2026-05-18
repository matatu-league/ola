"use client";

import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, MoreHorizontal, Eye, Plus, ShoppingBag, ShieldAlert, ShieldCheck, Trash2, Store as StoreIcon, X, ExternalLink } from 'lucide-react';

export default function StoresAdminPage() {
  const [activeTab, setActiveTab] = useState('All Stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Floating dropdown state
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStoreForm, setNewStoreForm] = useState({ title: '', contactEmail: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabs = ['All Stores', 'Active', 'Suspended', 'Closed'];

  const fetchStores = async () => {
    setLoading(true);
    try {
      let url = `/api/stores/admin?page=${currentPage}&limit=10&`;
      if (activeTab === 'Active') url += 'status=active&';
      if (activeTab === 'Suspended') url += 'status=suspended&';
      if (activeTab === 'Closed') url += 'status=closed&';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      
      // NEW: Add a safety check before trying to parse JSON
      if (!res.ok) {
         const errorText = await res.text();
         console.error('Server returned an error:', res.status, errorText);
         setStores([]);
         setLoading(false);
         return;
      }

      const data = await res.json();
      if (data.success) {
        setStores(data.stores);
        if (data.pagination) setPagination(data.pagination);
      } else {
        console.error('Failed to fetch:', data.error);
      }
    } catch (err) {
      console.error('Network error fetching stores or parsing JSON', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, currentPage]);

  useEffect(() => {
    // Close dropdown on scroll
    const handleScroll = () => setActiveDropdown(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const handleUpdateStatus = async (storeId, newStatus) => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/stores/admin/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchStores();
    } catch (err) {
      console.error('Failed to update status', err);
    }
    setActiveDropdown(null);
  };

  const handleDeleteStore = async (storeId) => {
    if (!storeId) return;
    if (!confirm('Are you sure you want to delete this store?')) return;
    try {
      const res = await fetch(`/api/stores/admin/${storeId}`, { method: 'DELETE' });
      if (res.ok) fetchStores();
    } catch (err) {
      console.error('Failed to delete store', err);
    }
    setActiveDropdown(null);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stores/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStoreForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewStoreForm({ title: '', contactEmail: '', description: '' });
        fetchStores();
      }
    } catch (err) {
      console.error('Failed to create store', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDropdown = (e, store) => {
    e.stopPropagation();
    const storeId = store._id?.toString() || store.id;

    if (activeDropdown?.storeId === storeId) {
      setActiveDropdown(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 192; 
    const safeLeft = Math.max(16, rect.right - dropdownWidth); 

    setActiveDropdown({
      storeId,
      status: store.status,
      top: rect.bottom + 4,
      left: safeLeft
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20';
      case 'suspended': return 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20';
      case 'closed': return 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20';
      default: return 'bg-[#F8F8F8] text-[#8A8B91] border-[#E3E3E4]';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-screen pb-20 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Stores Directory</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage marketplace vendors and verify products.</p>
        </div>
        <div className="flex gap-2 relative z-10">
          <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FE2C55] text-white rounded-sm text-[13px] font-semibold hover:bg-[#E6284B] transition-colors shadow-sm">
            <Plus size={16} /> Add Store
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-[#E3E3E4] mb-4 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
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

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 relative z-10">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          <input 
            type="text" 
            placeholder="Search by Store Name or Domain..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823] transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-sm border border-[#E3E3E4] flex flex-col relative z-20">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
              <tr>
                <th className="px-4 py-3">Store Details</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Inventory</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody>
                <tr><td colSpan="6" className="text-center py-8 text-[#8A8B91] text-[13px]">Loading stores...</td></tr>
              </tbody>
            ) : stores.length === 0 ? (
               <tbody>
                <tr><td colSpan="6" className="text-center py-8 text-[#8A8B91] text-[13px]">No stores found.</td></tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#E3E3E4]">
                {stores.map((store) => {
                  const storeId = store._id?.toString() || store.id;

                  return (
                    <tr key={storeId} className="hover:bg-[#F8F8F8] transition-colors group">
                      <td className="px-4 py-3 flex items-center gap-3">
                         {/* Mapped exactly to store.logo */}
                         {store.logo ? (
                            <img src={store.logo} alt={store.title} className="w-10 h-10 rounded-sm object-cover border border-[#E3E3E4] bg-white" />
                         ) : (
                            <div className="w-10 h-10 rounded-sm bg-[#F8F8F8] border border-[#E3E3E4] flex items-center justify-center text-[#8A8B91] font-bold text-[14px] uppercase shrink-0">
                              {store.title ? store.title.substring(0, 2) : <StoreIcon size={18} />}
                            </div>
                         )}
                        <div>
                          {/* Mapped exactly to store.title and store.domain */}
                          <div className="font-semibold text-[#161823] text-[14px]">{store.title || 'Unnamed Store'}</div>
                          {store.domain && (
                            <a 
                              href={`https://${store.domain}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[11px] text-[#2563EB] hover:underline mt-0.5 flex items-center gap-1 w-max"
                            >
                              {store.domain} <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        {/* Mapped exactly to nested contact object */}
                        <div className="text-[#161823]">{store?.contact?.email || 'No email provided'}</div>
                        <div className="text-[11px] text-[#8A8B91] mt-0.5">{store?.contact?.phone || 'No phone'}</div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                           <ShoppingBag size={14} className="text-[#8A8B91]" />
                           <span className="font-semibold text-[#161823]">{store.productCount || 0}</span>
                           <span className="text-[#8A8B91] text-[11px]">items</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[#8A8B91]">
                        {store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(store.status)}`}>
                          {store.status || 'active'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={(e) => toggleDropdown(e, store)}
                            className={`p-1.5 rounded-sm transition-colors ${activeDropdown?.storeId === storeId ? 'text-[#161823] bg-[#E3E3E4]' : 'text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4]'}`}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && stores.length > 0 && pagination.totalPages > 0 && (
          <div className="border-t border-[#E3E3E4] px-4 py-3 flex items-center justify-between bg-white rounded-b-sm">
            <span className="text-[12px] text-[#8A8B91] font-medium">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} stores
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50 transition-colors">Prev</button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (pagination.totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold transition-colors ${currentPage === pageNum ? 'text-[#161823] bg-[#F8F8F8] border-[#161823]/20' : 'text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8]'}`}>{pageNum}</button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Dropdown */}
      {activeDropdown && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed z-[100] w-40 bg-white border border-[#E3E3E4] rounded-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100"
            style={{ top: `${activeDropdown.top}px`, left: `${activeDropdown.left}px` }}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-[#8A8B91] uppercase bg-[#F8F8F8] border-b border-[#E3E3E4]">Store Actions</div>
            {activeDropdown.status === 'active' ? (
              <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(activeDropdown.storeId, 'suspended'); }} className="w-full px-4 py-2 text-[12px] text-[#D97706] hover:bg-[#FFFBEB] flex items-center gap-2 transition-colors">
                <ShieldAlert size={12}/> Suspend Store
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(activeDropdown.storeId, 'active'); }} className="w-full px-4 py-2 text-[12px] text-[#16A34A] hover:bg-[#E6F4EA] flex items-center gap-2 transition-colors">
                <ShieldCheck size={12}/> Activate Store
              </button>
            )}
            <div className="border-t border-[#E3E3E4]"></div>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteStore(activeDropdown.storeId); }} className="w-full px-4 py-2 text-[12px] text-[#FE2C55] hover:bg-[#FEE2E2] flex items-center gap-2 transition-colors">
              <Trash2 size={12}/> Delete Store
            </button>
          </div>
        </>
      )}

      {/* Add Store Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E3E4]">
              <h3 className="font-bold text-[#161823]">Create New Store</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#8A8B91] hover:text-[#161823]"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStore} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#161823] mb-1.5">Store Title *</label>
                <input required type="text" value={newStoreForm.title} onChange={(e) => setNewStoreForm({...newStoreForm, title: e.target.value})} className="w-full px-3 py-2 border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823]" placeholder="e.g. Trendy Boutique" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#161823] mb-1.5">Contact Email</label>
                <input type="email" value={newStoreForm.contactEmail} onChange={(e) => setNewStoreForm({...newStoreForm, contactEmail: e.target.value})} className="w-full px-3 py-2 border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823]" placeholder="store@example.com" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#161823] mb-1.5">Description</label>
                <textarea rows="3" value={newStoreForm.description} onChange={(e) => setNewStoreForm({...newStoreForm, description: e.target.value})} className="w-full px-3 py-2 border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823]" placeholder="What does this store sell?" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-[#E3E3E4] text-[#161823] rounded-sm text-[13px] font-semibold hover:bg-[#F8F8F8]">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#FE2C55] text-white rounded-sm text-[13px] font-semibold hover:bg-[#E6284B] disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}