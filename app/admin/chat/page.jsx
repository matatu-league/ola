"use client";

// Admin live chat — lets an admin talk to any user directly. Reuses the same
// realtime backend as the buyer inbox (socket message:send + /api/messages/*),
// but is self-contained so it can't affect the buyer chat. Opens a specific
// conversation when navigated to with ?c=<conversationId> (e.g. from the
// System Monitoring "Chat" button).

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Search, ShieldCheck, Paperclip, Smile, Image as ImageIcon,
  MoreVertical, Loader2, Send, X, CheckCheck, Check, AlertCircle, User,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationContext';

// ── Product-ref parser (mirrors the buyer inbox) ────────────────────────────
function parseMessage(msg, fallbackProduct) {
  if (msg._parsed) return msg;
  const parsed = { ...msg, _parsed: true };
  if (typeof parsed.text === 'string' && parsed.text.startsWith('[Product: ')) {
    const match = parsed.text.match(/^\[Product:\s*(.*?)\](?:\n([\s\S]*))?$/);
    if (match) {
      parsed._isProductCard = true;
      parsed._productTitle  = match[1]?.trim() || fallbackProduct?.title || 'Product';
      parsed.text           = match[2] ? match[2].trim() : '';
      parsed._productImage  = fallbackProduct?.image || (Array.isArray(fallbackProduct?.images) ? fallbackProduct.images[0] : null) || null;
      parsed._productId     = fallbackProduct?._id || null;
    }
  }
  return parsed;
}

const ConvItem = ({ conv, isActive, onClick, currentUserId }) => {
  const other    = conv.otherParticipant || conv.participants?.find(p => String(p?._id) !== String(currentUserId)) || null;
  const unread   = conv.myUnread || 0;
  const lastMsg  = conv.lastMessage;
  const initials = other?.name?.slice(0, 2).toUpperCase() || '??';
  const preview  = lastMsg?.type === 'image' ? '📷 Image' : lastMsg?.type === 'file' ? '📎 File' : lastMsg?.text || 'Start a conversation';
  const timeStr  = lastMsg?.sentAt ? new Date(lastMsg.sentAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' }) : '';

  return (
    <div onClick={onClick} className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-[#F0F0F0] transition-colors ${isActive ? 'bg-[#FFF0F3]' : 'hover:bg-[#F8F8F8]'}`}>
      <div className="relative shrink-0">
        {other?.avatar
          ? <img src={other.avatar} alt="" className="w-10 h-10 rounded-full border border-[#E3E3E4] object-cover" />
          : <div className="w-10 h-10 rounded-full bg-[#161823] flex items-center justify-center text-white text-[13px] font-bold">{initials}</div>}
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-[#FE2C55] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border border-white px-0.5">{unread}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className={`text-[13px] truncate ${unread > 0 ? 'font-bold' : 'font-semibold'} text-[#161823]`}>{other?.name || 'Unknown'}</p>
          <span className="text-[10px] text-[#8A8B91] shrink-0">{timeStr}</span>
        </div>
        <p className={`text-[11px] truncate ${unread > 0 ? 'text-[#161823] font-medium' : 'text-[#8A8B91]'}`}>{preview}</p>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, isMine }) => {
  const time   = new Date(msg.createdAt).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
  const isRead = msg.readBy?.length > 1;
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (msg.sender?.avatar
        ? <img src={msg.sender.avatar} alt="" className="w-7 h-7 rounded-full border border-[#E3E3E4] object-cover shrink-0 mb-1" />
        : <div className="w-7 h-7 rounded-full bg-[#161823] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-1">{msg.sender?.name?.slice(0, 2).toUpperCase() || '?'}</div>)}
      <div className={`flex flex-col gap-0.5 max-w-[68%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!!msg.text && (
          <div className={`px-3.5 py-2 rounded-sm text-[13px] leading-relaxed break-words ${isMine ? 'bg-[#161823] text-white rounded-br-none' : 'bg-[#F8F8F8] border border-[#E3E3E4] text-[#161823] rounded-bl-none'}`}>
            {msg.type === 'image' && msg.fileUrl
              ? <img src={msg.fileUrl} alt="" className="max-w-[220px] rounded-sm" />
              : msg.type === 'file' && msg.fileUrl
                ? <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline text-[12px]"><Paperclip size={13} /> {msg.fileName || 'File'}</a>
                : msg.text}
          </div>
        )}
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-[#8A8B91]">{time}</span>
          {isMine && (isRead ? <CheckCheck size={12} className="text-[#10B981]" /> : <Check size={12} className="text-[#8A8B91]" />)}
        </div>
      </div>
    </div>
  );
};

const ChatArea = ({ conversation, currentUserId, socket }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const { markConversationRead } = useNotifications();
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const convId = conversation?._id;
  const other = conversation?.otherParticipant || conversation?.participants?.find(p => String(p?._id) !== String(currentUserId)) || null;

  useEffect(() => {
    if (!convId) return undefined;
    setMessages([]); setIsLoading(true); setError('');
    fetch(`/api/messages/${convId}/history?limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setMessages((data.data || []).map(m => parseMessage(m, data.relatedProduct || conversation?.relatedProduct)));
        else setError(data.message || 'Failed to load messages');
      })
      .catch(() => setError('Could not load messages'))
      .finally(() => setIsLoading(false));
    if (socket) { socket.emit('join:conversation', convId); socket.emit('message:read', { conversationId: convId }); markConversationRead(); }
    return () => { if (socket) socket.emit('leave:conversation', convId); };
  }, [convId]);

  useEffect(() => {
    if (!socket || !convId) return undefined;
    const onNew = (msg) => {
      if (String(msg.conversation) !== String(convId)) return;
      const parsed = parseMessage(msg, conversation?.relatedProduct);
      setMessages(prev => {
        if (prev.find(x => String(x._id) === String(parsed._id))) return prev;
        const optIx = prev.findIndex(x => x._optimistic && String(x.sender?._id || x.sender) === String(currentUserId) && x.text === parsed.text);
        if (optIx !== -1) { const next = [...prev]; next[optIx] = parsed; return next; }
        return [...prev, parsed];
      });
      socket.emit('message:read', { conversationId: convId });
      markConversationRead();
    };
    const onTypingStart = ({ userId }) => { if (String(userId) !== String(currentUserId)) setIsTyping(true); };
    const onTypingStop  = ({ userId }) => { if (String(userId) !== String(currentUserId)) setIsTyping(false); };
    socket.on('message:new', onNew);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => { socket.off('message:new', onNew); socket.off('typing:start', onTypingStart); socket.off('typing:stop', onTypingStop); };
  }, [socket, convId, currentUserId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socket && convId) {
      socket.emit('typing:start', { conversationId: convId });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit('typing:stop', { conversationId: convId }), 1500);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending || !convId) return;
    setIsSending(true); setInputText('');
    if (socket) socket.emit('typing:stop', { conversationId: convId });
    const optimistic = { _id: `temp-${Date.now()}`, conversation: convId, sender: { _id: currentUserId }, text, type: 'text', createdAt: new Date().toISOString(), readBy: [{ user: currentUserId }], _optimistic: true };
    setMessages(prev => [...prev, optimistic]);
    if (socket?.connected) {
      socket.emit('message:send', { conversationId: convId, text }, (res) => {
        if (res?.error) { setError(res.error); setMessages(prev => prev.filter(m => m._id !== optimistic._id)); }
        else if (res?.message) { setMessages(prev => prev.map(m => m._id === optimistic._id ? res.message : m)); }
        setIsSending(false);
      });
    } else {
      try {
        const r = await fetch(`/api/messages/${convId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
        const data = await r.json();
        if (data.success) setMessages(prev => prev.map(m => m._id === optimistic._id ? data.data : m));
        else { setMessages(prev => prev.filter(m => m._id !== optimistic._id)); setError(data.message); }
      } catch { setMessages(prev => prev.filter(m => m._id !== optimistic._id)); setError('Failed to send message'); }
      setIsSending(false);
    }
  }, [inputText, isSending, socket, convId, currentUserId]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  if (!conversation) {
    return (
      <div className="flex-1 h-full hidden md:flex items-center justify-center bg-[#F8F8F8]">
        <div className="text-center">
          <MessageSquare size={48} className="text-[#E3E3E4] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#161823]">Select a conversation</p>
          <p className="text-[12px] text-[#8A8B91] mt-1">Pick someone from the inbox — or open a chat from System Monitoring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="h-[56px] border-b border-[#E3E3E4] px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {other?.avatar
            ? <img src={other.avatar} alt="" className="w-8 h-8 rounded-full border border-[#E3E3E4] object-cover" />
            : <div className="w-8 h-8 rounded-full bg-[#161823] flex items-center justify-center text-white text-[11px] font-bold">{other?.name?.slice(0, 2).toUpperCase() || '?'}</div>}
          <div>
            <p className="text-[14px] font-bold text-[#161823] leading-tight">{other?.name || 'User'}</p>
            {isTyping && <p className="text-[11px] text-[#10B981]">typing…</p>}
          </div>
        </div>
        <User size={17} className="text-[#8A8B91]" />
      </div>

      <div className="shrink-0 px-5 py-2.5 border-b border-[#F0F0F0] bg-[#F0FDF4]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-[#10B981] shrink-0" />
          <p className="text-[11px] text-[#065F46]">You're messaging as Ola.ug Support (admin).</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#8A8B91]" /></div>
        ) : error ? (
          <div className="flex items-center gap-2 text-[12px] text-[#FE2C55] bg-[#FFF0F3] border border-[#FE2C55] p-3 rounded-sm"><AlertCircle size={13} /> {error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12"><p className="text-[13px] text-[#8A8B91]">No messages yet. Say hello! 👋</p></div>
        ) : (
          messages.map(msg => <MessageBubble key={msg._id} msg={msg} isMine={String(msg.sender?._id || msg.sender) === String(currentUserId)} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#E3E3E4] bg-white shrink-0">
        <div className="flex items-center gap-3 px-4 pt-3 pb-1 text-[#8A8B91]">
          <Smile size={17} /><ImageIcon size={17} /><Paperclip size={17} /><div className="h-4 w-px bg-[#E3E3E4] mx-1" /><MoreVertical size={17} />
        </div>
        <div className="flex items-end gap-3 px-4 pb-4">
          <textarea value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Type a message… (Enter to send)" rows={2}
            className="flex-1 resize-none bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[13px] text-[#161823] placeholder-[#8A8B91] outline-none focus:border-[#161823] transition-colors" />
          <button onClick={sendMessage} disabled={!inputText.trim() || isSending} className="bg-[#161823] hover:bg-black text-white p-2.5 rounded-sm transition-colors disabled:opacity-40 shrink-0">
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminChatPage() {
  const { user } = useUser();
  const { getSocket } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [socket, setSocket] = useState(null);
  const initialCidRef = useRef(null);

  // Grab the ?c= conversation id once (avoids the useSearchParams Suspense rule).
  useEffect(() => {
    try { initialCidRef.current = new URLSearchParams(window.location.search).get('c'); } catch (_) {}
  }, []);

  // Resolve the shared socket (connects once the admin is logged in).
  useEffect(() => {
    let poll = null;
    const s = getSocket();
    if (s) setSocket(s);
    else poll = setInterval(() => { const sk = getSocket(); if (sk) { setSocket(sk); clearInterval(poll); } }, 500);
    return () => { if (poll) clearInterval(poll); };
  }, [getSocket]);

  const loadConversations = useCallback(() => {
    setIsLoading(true);
    fetch('/api/messages/me')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const list = data.data || [];
          setConversations(list);
          setActiveConv(prev => {
            if (prev) return list.find(c => String(c._id) === String(prev._id)) || prev;
            const cid = initialCidRef.current;
            return (cid && list.find(c => String(c._id) === String(cid))) || list[0] || null;
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Keep the inbox live.
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (msg) => {
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (String(conv._id) !== String(msg.conversation)) return conv;
          const isMine = String(msg.sender?._id || msg.sender) === String(user?.id);
          return { ...conv, lastMessage: { text: msg.text, sentAt: msg.createdAt, type: msg.type }, myUnread: isMine ? conv.myUnread : (conv.myUnread || 0) + 1 };
        });
        // If it's a conversation we don't have yet, refetch the list.
        if (!updated.find(c => String(c._id) === String(msg.conversation))) loadConversations();
        return [...updated].sort((a, b) => new Date(b.lastMessage?.sentAt || 0) - new Date(a.lastMessage?.sentAt || 0));
      });
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, user?.id, loadConversations]);

  const filtered = conversations.filter(c => {
    const name = c.otherParticipant?.name?.toLowerCase() || c.participants?.find(p => String(p?._id) !== String(user?.id))?.name?.toLowerCase() || '';
    return !search || name.includes(search.toLowerCase());
  });

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#161823] tracking-tight flex items-center gap-2"><MessageSquare size={18} /> Live Chat</h1>
        <p className="text-[13px] text-[#8A8B91] mt-0.5">Talk to buyers and sellers directly.</p>
      </div>

      <div className="flex bg-white border border-[#E3E3E4] rounded-lg overflow-hidden h-[calc(100vh-180px)] min-h-[480px]">
        {/* Inbox */}
        <div className="w-full md:w-[320px] h-full border-r border-[#E3E3E4] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#E3E3E4]">
            <div className="flex items-center bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm overflow-hidden focus-within:border-[#161823] transition-colors">
              <Search size={13} className="ml-2.5 text-[#8A8B91] shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations…" className="flex-1 px-2 py-2 text-[12px] outline-none bg-transparent text-[#161823] placeholder-[#8A8B91]" />
              {search && <button onClick={() => setSearch('')} className="mr-2"><X size={12} className="text-[#8A8B91]" /></button>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-[#8A8B91]" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare size={32} className="text-[#E3E3E4] mx-auto mb-2" />
                <p className="text-[13px] text-[#8A8B91]">No conversations yet. Start one from <Link href="/admin/monitoring" className="text-[#FE2C55] font-semibold">System Monitoring</Link>.</p>
              </div>
            ) : (
              filtered.map(conv => (
                <ConvItem key={conv._id} conv={conv} isActive={activeConv?._id === conv._id} currentUserId={user?.id}
                  onClick={() => { setActiveConv(conv); setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, myUnread: 0 } : c)); }} />
              ))
            )}
          </div>
        </div>
        {/* Thread */}
        <ChatArea conversation={activeConv} currentUserId={user?.id} socket={socket} />
      </div>
    </div>
  );
}
