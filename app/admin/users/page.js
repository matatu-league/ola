"use client";

import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, MoreHorizontal, Eye, Shield, UserCog, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('All Users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State to handle the floating dropdown menu out of the table flow
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  const tabs = ['All Users', 'Admins', 'Sellers', 'Buyers', 'Suspended'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/users?page=${currentPage}&limit=10&`;
      if (activeTab === 'Admins') url += 'role=admin&';
      if (activeTab === 'Sellers') url += 'role=seller&';
      if (activeTab === 'Buyers') url += 'role=buyer&';
      if (activeTab === 'Suspended') url += 'status=suspended&';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        if (data.pagination) setPagination(data.pagination);
      } else {
        console.error('Failed to fetch:', data.error);
      }
    } catch (err) {
      console.error('Network error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch users whenever tab, search, or page changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, currentPage]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 when changing filters
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 when searching
  };

  useEffect(() => {
    // Close the dropdown if the user scrolls the window or table
    const handleScroll = () => setActiveDropdown(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const handleUpdateRole = async (userId, newRole) => {
    if (!userId) return;
    try {
      console.log(`[Action] Updating user ${userId} to role: ${newRole}`);
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      
      if (res.ok) {
        fetchUsers();
      } else {
        console.error('[Action Error]', data.error);
        alert(`Error updating role: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to update role', err);
    }
    setActiveDropdown(null);
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    if (!userId) return;
    try {
      console.log(`[Action] Updating user ${userId} to status: ${newStatus}`);
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        console.error('[Action Error]', data.error);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
    setActiveDropdown(null);
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      console.log(`[Action] Deleting user ${userId}`);
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
    setActiveDropdown(null);
  };

  const toggleDropdown = (e, user) => {
    e.stopPropagation();
    const userId = user._id?.toString() || user.id;

    if (activeDropdown?.userId === userId) {
      setActiveDropdown(null);
      return;
    }

    // Calculate fixed viewport coordinates for the floating menu
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 192; // 12rem
    const safeLeft = Math.max(16, rect.right - dropdownWidth); 

    setActiveDropdown({
      userId,
      status: user.status,
      top: rect.bottom + 4,
      left: safeLeft
    });
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'admin': return 'bg-[#F3E8FF] text-[#9333EA] border-[#9333EA]/20';
      case 'seller': return 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20';
      case 'buyer': return 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20';
      default: return 'bg-[#F8F8F8] text-[#8A8B91] border-[#E3E3E4]';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20';
      case 'suspended': return 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20';
      case 'banned': return 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20';
      default: return 'bg-[#F8F8F8] text-[#8A8B91] border-[#E3E3E4]';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-screen pb-20 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Users</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage accounts, roles, and platform access.</p>
        </div>
        <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors relative z-10">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-[#E3E3E4] mb-4 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 relative z-10">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          <input 
            type="text" 
            placeholder="Search by Name or Email..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] focus:outline-none focus:border-[#161823] transition-colors"
          />
        </div>
        <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] rounded-sm text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors shrink-0">
          <Filter size={14} /> Filters
        </button>
      </div>

      <div className="bg-white rounded-sm border border-[#E3E3E4] flex flex-col relative z-20">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#8A8B91] text-[13px]">Loading users...</td>
                </tr>
              </tbody>
            ) : users.length === 0 ? (
               <tbody>
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#8A8B91] text-[13px]">No users found.</td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#E3E3E4]">
                {users.map((user) => {
                  // Fallbacks to handle both Mongoose _id and serialized id
                  const userId = user._id?.toString() || user.id;

                  return (
                    <tr key={userId} className="hover:bg-[#F8F8F8] transition-colors group">
                      <td className="px-4 py-3 flex items-center gap-3">
                         {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" />
                         ) : (
                            <div className="w-8 h-8 rounded-full bg-[#E3E3E4] flex items-center justify-center text-[#8A8B91] font-bold text-xs uppercase">
                              {user.displayName?.substring(0, 2) || 'U'}
                            </div>
                         )}
                        <div>
                          <div className="font-semibold text-[#161823] flex items-center gap-1">
                            {user.displayName || 'Unknown User'}
                            {user.isVerified && <ShieldCheck size={12} className="text-[#16A34A]"/>}
                          </div>
                          <div className="text-[11px] text-[#8A8B91] mt-0.5">ID: {userId?.substring(0,8)}...</div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-[#161823]">{user.email || 'No email'}</div>
                        <div className="text-[11px] text-[#8A8B91] mt-0.5">{user.phone || 'No phone'}</div>
                      </td>
                      
                      <td className="px-4 py-3 text-[#8A8B91]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                      </td>
                      
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getRoleStyle(user.role)}`}>
                          {user.role || 'seller'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
                          {user.status || 'active'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                           <button className="p-1.5 text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4] rounded-sm transition-colors" title="View Details">
                            <Eye size={14} />
                          </button>
                          
                          <button 
                            onClick={(e) => toggleDropdown(e, user)}
                            className={`p-1.5 rounded-sm transition-colors ${activeDropdown?.userId === userId ? 'text-[#161823] bg-[#E3E3E4]' : 'text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4]'}`}
                            title="More Options"
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
        {!loading && users.length > 0 && pagination.totalPages > 0 && (
          <div className="border-t border-[#E3E3E4] px-4 py-3 flex items-center justify-between bg-white rounded-b-sm">
            <span className="text-[12px] text-[#8A8B91] font-medium">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:hover:text-[#8A8B91] disabled:hover:bg-transparent transition-colors"
              >
                Prev
              </button>
              
              {/* Dynamic Page Numbers showing up to 5 buttons max to avoid clutter */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (pagination.totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold transition-colors ${
                      currentPage === pageNum 
                        ? 'text-[#161823] bg-[#F8F8F8] border-[#161823]/20' 
                        : 'text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1.5 border border-[#E3E3E4] rounded-sm text-[12px] font-semibold text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:hover:text-[#8A8B91] disabled:hover:bg-transparent transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* This renders strictly OUTSIDE the table structure, ignoring table overflow limitations */}
      {activeDropdown && (
        <>
          {/* Overlay to catch clicks outside the dropdown and close it immediately */}
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setActiveDropdown(null)}
          />
          
          {/* Actual Dropdown Container using Fixed Viewport Coordinates */}
          <div 
            className="fixed z-[100] w-48 bg-white border border-[#E3E3E4] rounded-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: `${activeDropdown.top}px`, 
              left: `${activeDropdown.left}px` 
            }}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-[#8A8B91] uppercase bg-[#F8F8F8] border-b border-[#E3E3E4]">
              Change Role
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleUpdateRole(activeDropdown.userId, 'admin'); }} className="w-full px-4 py-2 text-[12px] text-[#161823] hover:bg-[#F8F8F8] flex items-center gap-2 transition-colors">
              <Shield size={12}/> Make Admin
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleUpdateRole(activeDropdown.userId, 'seller'); }} className="w-full px-4 py-2 text-[12px] text-[#161823] hover:bg-[#F8F8F8] flex items-center gap-2 transition-colors">
              <UserCog size={12}/> Make Seller
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleUpdateRole(activeDropdown.userId, 'buyer'); }} className="w-full px-4 py-2 text-[12px] text-[#161823] hover:bg-[#F8F8F8] flex items-center gap-2 transition-colors">
              <UserCog size={12}/> Make Buyer
            </button>
            
            <div className="px-3 py-2 text-[10px] font-bold text-[#8A8B91] uppercase bg-[#F8F8F8] border-y border-[#E3E3E4]">
              Account Actions
            </div>
            {activeDropdown.status === 'active' ? (
              <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(activeDropdown.userId, 'suspended'); }} className="w-full px-4 py-2 text-[12px] text-[#D97706] hover:bg-[#FFFBEB] flex items-center gap-2 transition-colors">
                <ShieldAlert size={12}/> Suspend User
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(activeDropdown.userId, 'active'); }} className="w-full px-4 py-2 text-[12px] text-[#16A34A] hover:bg-[#E6F4EA] flex items-center gap-2 transition-colors">
                <ShieldCheck size={12}/> Activate User
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(activeDropdown.userId); }} className="w-full px-4 py-2 text-[12px] text-[#FE2C55] hover:bg-[#FEE2E2] flex items-center gap-2 transition-colors">
              <Trash2 size={12}/> Delete User
            </button>
          </div>
        </>
      )}

    </div>
  );
}