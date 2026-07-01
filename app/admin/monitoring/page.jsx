"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, MessageSquare, Globe, Loader2, Wifi } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUser } from '@/contexts/UserContext';

// ISO-3166 alpha-2 → flag emoji.
const flag = (cc) => {
  if (!cc || cc.length !== 2) return '🌐';
  try {
    return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
  } catch { return '🌐'; }
};

const timeAgo = (iso) => {
  if (!iso) return '—';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
};

const roleStyle = (r) => ({
  admin:  'bg-[#161823] text-white',
  seller: 'bg-[#EFF6FF] text-[#2563EB]',
}[r] || 'bg-[#F2F2F3] text-[#5A5B60]');

export default function MonitoringPage() {
  const router = useRouter();
  const { getSocket } = useNotifications();
  const { user, isAdmin } = useUser();

  const [users, setUsers]         = useState([]);
  const [connected, setConnected] = useState(false);
  const [chatting, setChatting]   = useState(null);
  const [, forceTick]             = useState(0);

  // Re-render every 15s so the "last active" timestamps stay fresh.
  useEffect(() => {
    const iv = setInterval(() => forceTick(t => t + 1), 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    let socket = null;
    let poll   = null;

    const onSnapshot = (list) => setUsers(Array.isArray(list) ? list : []);
    const onUpdate   = (u) => setUsers(prev => {
      const idx = prev.findIndex(x => x.userId === u.userId);
      if (idx === -1) return [...prev, u];
      const next = prev.slice();
      next[idx] = u;
      return next;
    });
    const onOffline  = ({ userId }) => setUsers(prev => prev.filter(x => x.userId !== userId));
    const subscribe  = () => { try { socket.emit('admin:presence:subscribe'); } catch (_) {} };
    const onConnect    = () => { setConnected(true); subscribe(); };
    const onDisconnect = () => setConnected(false);

    const attach = (s) => {
      socket = s;
      s.on('admin:presence:snapshot', onSnapshot);
      s.on('admin:presence:update',   onUpdate);
      s.on('admin:presence:offline',  onOffline);
      s.on('connect',    onConnect);
      s.on('disconnect', onDisconnect);
      setConnected(!!s.connected);
      subscribe();
    };

    const existing = getSocket();
    if (existing) attach(existing);
    else poll = setInterval(() => { const s = getSocket(); if (s) { clearInterval(poll); poll = null; attach(s); } }, 500);

    return () => {
      if (poll) clearInterval(poll);
      if (socket) {
        socket.off('admin:presence:snapshot', onSnapshot);
        socket.off('admin:presence:update',   onUpdate);
        socket.off('admin:presence:offline',  onOffline);
        socket.off('connect',    onConnect);
        socket.off('disconnect', onDisconnect);
        try { socket.emit('admin:presence:unsubscribe'); } catch (_) {}
      }
    };
  }, [getSocket, isAdmin]);

  const openChat = useCallback(async (u) => {
    setChatting(u.userId);
    try {
      const res  = await fetch('/api/messages/conversations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ recipientId: u.userId }),
      });
      const json = await res.json();
      if (json.success && json.data?._id) router.push(`/admin/chat?c=${json.data._id}`);
    } catch (_) {} finally {
      setChatting(null);
    }
  }, [router]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-[#8A8B91] text-[13px]">Admin access required.</div>
    );
  }

  const sorted = [...users].sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight flex items-center gap-2">
            <Activity size={18} /> System Monitoring
          </h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Users online right now, where they are, and where they're from.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#16A34A] animate-pulse' : 'bg-[#8A8B91]'}`} />
            <span className={connected ? 'text-[#16A34A]' : 'text-[#8A8B91]'}>{connected ? 'Live' : 'Connecting…'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E3E4] rounded-lg text-[13px] font-bold text-[#161823]">
            <Wifi size={14} className="text-[#16A34A]" /> {sorted.length} online
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#E3E3E4] overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          {!connected && sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#8A8B91]">
              <Loader2 size={24} className="animate-spin mb-2" /><span className="text-[13px]">Connecting to live feed…</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-20 text-center text-[#8A8B91] text-[13px]">
              <Globe size={26} className="mx-auto mb-2 opacity-40" />
              No users online right now.
            </div>
          ) : (
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-[#F8F8F8] text-[#8A8B91] text-[11px] font-bold uppercase tracking-wider border-b border-[#E3E3E4]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Browsing</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E3E4]">
                {sorted.map((u) => (
                  <tr key={u.userId} className="hover:bg-[#F8F8F8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-[#E3E3E4]" />
                          : <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#161823] to-[#4A4B55] text-white flex items-center justify-center text-[12px] font-bold">{(u.name || 'U').charAt(0).toUpperCase()}</span>}
                        <span className="font-semibold text-[#161823]">{u.name || 'User'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${roleStyle(u.role)}`}>{u.role || 'buyer'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[16px] leading-none">{flag(u.countryCode)}</span>
                        <span className="text-[#5A5B60] font-medium">{u.country || u.countryCode || 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-[#F2F2F3] text-[#5A5B60] px-1.5 py-0.5 rounded max-w-[220px] inline-block truncate align-middle" title={u.page}>{u.page || '/'}</code>
                    </td>
                    <td className="px-4 py-3 text-[#8A8B91]">{timeAgo(u.lastActive)}</td>
                    <td className="px-4 py-3 text-right">
                      {u.userId === user?.id ? (
                        <span className="text-[11px] text-[#8A8B91] font-medium">You</span>
                      ) : (
                        <button
                          onClick={() => openChat(u)}
                          disabled={chatting === u.userId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161823] hover:bg-black text-white rounded-md text-[12px] font-semibold transition-colors disabled:opacity-60"
                        >
                          {chatting === u.userId ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                          Chat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#8A8B91] mt-3">
        Shows signed-in users with a live socket connection. Country is resolved from the connection where available.
      </p>
    </div>
  );
}
