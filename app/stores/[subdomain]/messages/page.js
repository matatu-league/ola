// app/(seller)/messages/page.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, Paperclip, Smile, MoreVertical,
  CheckCheck, Check, Loader2, AlertCircle, X,
  ShieldCheck, Package, RefreshCw, MessageSquare, Pencil,
  ClipboardList,
} from 'lucide-react';
import { io as socketIO } from 'socket.io-client';
import { getSessionUser } from '@/lib/domain';

// ── Parser — decodes [Product:...|id|img] or [Order:...|id|total|status|imgs] ──
function parseMessage(msg) {
  if (msg._parsed) return msg;
  const parsed = { ...msg, _parsed: true };

  if (typeof parsed.text !== 'string') return parsed;

  // Order: [Order: number|id|total|status|comma,separated,images]\nrest
  const orderMatch = parsed.text.match(/^\[Order:\s*([^|\]]+)(?:\|([^|\]]*))?(?:\|([^|\]]*))?(?:\|([^|\]]*))?(?:\|([^\]]*))?\](?:\n([\s\S]*))?$/);
  if (orderMatch) {
    const [, number, id, total, status, imgs, rest] = orderMatch;
    parsed._isOrderCard = true;
    parsed._orderNumber = number?.trim() || 'Order';
    parsed._orderId     = id?.trim() || null;
    parsed._orderTotal  = total ? Number(total) : null;
    parsed._orderStatus = status?.trim() || null;
    parsed._orderItems  = imgs
      ? imgs.split(',').filter(Boolean).map(image => ({ image }))
      : [];
    parsed.text = rest ? rest.trim() : '';
    return parsed;
  }

  // Product: [Product: title|id|imageUrl]\nrest
  const productMatch = parsed.text.match(/^\[Product:\s*([^|\]]+)(?:\|([^|\]]*))?(?:\|([^\]]*))?\](?:\n([\s\S]*))?$/);
  if (productMatch) {
    const [, title, id, image, rest] = productMatch;
    parsed._isProductCard = true;
    parsed._productTitle  = title?.trim() || 'Product';
    parsed._productId     = id?.trim() || null;
    parsed._productImage  = image?.trim() || null;
    parsed.text           = rest ? rest.trim() : '';
  }
  return parsed;
}

function Bubble({ msg, isMine }) {
  const time   = new Date(msg.createdAt).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
  const isRead = (msg.readBy?.length || 0) > 1;

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        msg.sender?.avatar
          ? <img src={msg.sender.avatar} alt="" className="w-7 h-7 rounded-none object-cover shrink-0 mb-1" />
          : <div className="w-7 h-7 rounded-none bg-gray-200 flex items-center justify-center text-black text-xs font-bold shrink-0 mb-1">
              {msg.sender?.name?.slice(0, 2).toUpperCase() || '?'}
            </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>

        {/* ── Composite: order card with text as caption ────────────────── */}
        {msg._isOrderCard && (
          <div className={`overflow-hidden rounded-none border border-gray-200 max-w-[300px]
            ${isMine ? 'bg-black' : 'bg-white'}`}
          >
            <a
              href={msg._orderId ? `/orders/${msg._orderId}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-2.5 transition-colors
                ${isMine ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <ClipboardList size={11} className={isMine ? 'text-white/70' : 'text-blue-600'} />
                <p className={`text-xs font-bold uppercase tracking-wider
                  ${isMine ? 'text-white/60' : 'text-blue-600'}`}>
                  Order Inquiry
                </p>
              </div>
              <p className={`text-sm font-bold leading-tight mb-1
                ${isMine ? 'text-white' : 'text-black'}`}>
                {msg._orderNumber}
              </p>
              {msg._orderTotal && (
                <p className={`text-xs ${isMine ? 'text-white/60' : 'text-gray-500'}`}>
                  UGX {Number(msg._orderTotal).toLocaleString()}
                  {msg._orderStatus && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-50 text-yellow-600 font-bold uppercase tracking-wider text-xs border border-yellow-200">
                      {msg._orderStatus}
                    </span>
                  )}
                </p>
              )}
              {msg._orderItems?.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {msg._orderItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-10 h-10 rounded-none border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                      }
                    </div>
                  ))}
                  {msg._orderItems.length > 3 && (
                    <div className="w-10 h-10 rounded-none border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      +{msg._orderItems.length - 3}
                    </div>
                  )}
                </div>
              )}
            </a>

            {/* Caption */}
            {!!msg.text && (
              <div className={`px-3 py-2.5 text-sm leading-relaxed break-words border-t
                ${isMine
                  ? 'text-white border-white/10'
                  : 'text-black border-gray-200 bg-gray-50'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        )}

        {/* ── Composite: product card with text as caption ──────────────── */}
        {msg._isProductCard ? (
          <div className={`overflow-hidden rounded-none border border-gray-200 max-w-[300px]
            ${isMine ? 'bg-black' : 'bg-white'}`}
          >
            <a
              href={msg._productId ? `/products/${msg._productId}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-2.5 transition-colors
                ${isMine ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
            >
              <div className="w-14 h-14 rounded-none border border-gray-200 shrink-0 bg-gray-50 overflow-hidden flex items-center justify-center">
                {msg._productImage
                  ? <img src={msg._productImage} alt={msg._productTitle} className="w-full h-full object-cover" />
                  : <span className="text-xl">📦</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-0.5
                  ${isMine ? 'text-white/60' : 'text-blue-600'}`}>
                  <Package size={10} /> Asking about
                </p>
                <p className={`text-sm font-semibold line-clamp-2 leading-tight
                  ${isMine ? 'text-white' : 'text-black'}`}>
                  {msg._productTitle}
                </p>
              </div>
            </a>

            {/* Caption */}
            {!!msg.text && (
              <div className={`px-3 py-2.5 text-sm leading-relaxed break-words border-t
                ${isMine
                  ? 'text-white border-white/10'
                  : 'text-black border-gray-200 bg-gray-50'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ) : !!msg.text ? (
          <div className={`px-4 py-2.5 text-sm leading-relaxed break-words rounded-none
            ${isMine
              ? 'bg-black text-white'
              : 'bg-gray-50 text-black'
            }`}
          >
            {msg.text}
          </div>
        ) : null}
        <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-500">{time}</span>
          {isMine && (
            isRead
              ? <CheckCheck size={12} className="text-green-600" />
              : <Check      size={12} className="text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
}

function ConvItem({ conv, isActive, onClick, myId, isTyping }) {
  const other   = conv.participants?.find(p => String(p._id) !== String(myId));
  const unread  = conv.myUnread || 0;
  const last    = conv.lastMessage;

  // lastMessage.text is already stripped of [Product:]/[Order:] prefix by server
  const preview = last?.type === 'image' ? '📷 Image'
    : last?.type === 'file'  ? '📎 File'
    : last?.text             || 'No messages yet';

  const timeStr = last?.sentAt
    ? new Date(last.sentAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-200 transition-colors
        ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
    >
      <div className="relative shrink-0">
        {other?.avatar
          ? <img src={other.avatar} alt="" className="w-11 h-11 rounded-none object-cover" />
          : <div className="w-11 h-11 rounded-none bg-gray-200 flex items-center justify-center text-black text-sm font-bold">
              {other?.name?.slice(0, 2).toUpperCase() || '?'}
            </div>
        }
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-none px-1 border border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-black' : 'font-semibold text-black'}`}>
            {other?.name || 'Customer'}
          </p>
          <span className="text-xs text-gray-500 shrink-0">{timeStr}</span>
        </div>
        <p className={`text-xs truncate ${unread > 0 ? 'text-black font-medium' : 'text-gray-500'}`}>
          {isTyping ? (
            <span className="text-green-600 font-medium italic">typing...</span>
          ) : (
            preview
          )}
        </p>
      </div>
    </div>
  );
}

export default function SellerChatPage() {
  const [user,          setUser]          = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [inputText,     setInputText]     = useState('');
  const [search,        setSearch]        = useState('');
  const [typingIndicators, setTypingIndicators] = useState({});
  const [isSending,     setIsSending]     = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs,  setIsLoadingMsgs]  = useState(false);
  const [error,         setError]         = useState('');

  const socketRef   = useRef(null);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    const socket = socketIO(socketUrl, {
      auth:                 { userId: user.id },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 5,
      timeout:              8000,
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('[Seller] Socket connected:', socket.id));
    socket.on('connect_error', err => console.warn('[Seller] Socket connect error:', err.message));

    socket.on('message:new', (msg) => {
      const convId = String(msg.conversation);
      const isMine = String(msg.sender?._id || msg.sender) === String(user.id);

      setConversations(prev => {
        const existing = prev.find(c => String(c._id) === convId);
        if (!existing) {
          fetch('/api/messages/me')
            .then(r => r.json())
            .then(data => { if (data.success) setConversations(data.data || []); })
            .catch(() => {});
          return prev;
        }

        const updated = prev.map(c =>
          String(c._id) === convId
            ? {
                ...c,
                lastMessage: { text: msg.text, sentAt: msg.createdAt, type: msg.type },
                myUnread:    isMine ? c.myUnread : (c.myUnread || 0) + 1,
                updatedAt:   msg.createdAt,
              }
            : c
        );

        return updated.sort((a, b) => new Date(b.updatedAt || b.lastMessage?.sentAt || 0) - new Date(a.updatedAt || a.lastMessage?.sentAt || 0));
      });

      setTypingIndicators(prev => {
        const next = { ...prev };
        delete next[convId];
        return next;
      });

      setActiveConv(prev => {
        if (prev && String(prev._id) === convId) {
          const parsed = parseMessage(msg);
          setMessages(m => {
            if (m.find(x => String(x._id) === String(parsed._id))) return m;
            const myId  = String(user.id);
            const optIx = m.findIndex(x =>
              x._optimistic &&
              String(x.sender?._id || x.sender) === myId &&
              x.text === parsed.text
            );
            if (optIx !== -1) {
              const next = [...m];
              next[optIx] = parsed;
              return next;
            }
            return [...m, parsed];
          });
          socket.emit('message:read', { conversationId: convId });
        }
        return prev;
      });
    });

    socket.on('typing:start', ({ userId, conversationId, text }) => {
      if (String(userId) !== String(user.id)) {
        setTypingIndicators(prev => ({
          ...prev,
          [conversationId]: { isTyping: true, text: text || '' }
        }));
      }
    });

    socket.on('typing:stop', ({ userId, conversationId }) => {
      if (String(userId) !== String(user.id)) {
        setTypingIndicators(prev => ({
          ...prev,
          [conversationId]: { ...prev[conversationId], isTyping: false }
        }));
      }
    });

    socket.on('message:read', ({ conversationId }) => {
      setMessages(prev => prev.map(m =>
        String(m.conversation) === String(conversationId) && m.readBy?.length <= 1
          ? { ...m, readBy: [...(m.readBy || []), { user: 'other' }] }
          : m
      ));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchConvs = async () => {
      setIsLoadingConvs(true);
      try {
        const storeId = user?.storeId || '';
        const res  = await fetch(`/api/messages/me${storeId ? `?storeId=${storeId}` : ''}`);
        const data = await res.json();
        if (data.success) {
          setConversations(data.data || []);
          if (data.data?.length > 0) selectConversation(data.data[0]);
        }
      } catch {
        setError('Failed to load conversations');
      } finally {
        setIsLoadingConvs(false);
      }
    };

    fetchConvs();
  }, [user?.id]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, typingIndicators, activeConv]);

  const selectConversation = useCallback(async (conv) => {
    if (!conv) return;

    if (activeConv) {
      socketRef.current?.emit('leave:conversation', String(activeConv._id));
    }

    setActiveConv(conv);
    setMessages([]);
    setIsLoadingMsgs(true);

    setConversations(prev =>
      prev.map(c => String(c._id) === String(conv._id) ? { ...c, myUnread: 0 } : c)
    );

    socketRef.current?.emit('join:conversation', String(conv._id));
    socketRef.current?.emit('message:read', { conversationId: String(conv._id) });

    try {
      const res  = await fetch(`/api/messages/${conv._id}/history?limit=50`);
      const data = await res.json();
      if (data.success) {
        // Parse each — image/id/title are all encoded in the text prefix
        const parsed = (data.data || []).map(parseMessage);
        setMessages(parsed);
      }
    } catch {
      setError('Failed to load messages');
    } finally {
      setIsLoadingMsgs(false);
    }
  }, [activeConv]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending || !activeConv) return;

    setIsSending(true);
    setInputText('');
    clearTimeout(typingTimer.current);
    socketRef.current?.emit('typing:stop', { conversationId: String(activeConv._id) });

    const optimisticRaw = {
      _id:          `tmp-${Date.now()}`,
      conversation: activeConv._id,
      sender:       { _id: user.id },
      text,
      type:         'text',
      createdAt:    new Date().toISOString(),
      readBy:       [{ user: user.id }],
      _optimistic:  true,
    };
    const optimistic = parseMessage(optimisticRaw);
    setMessages(prev => [...prev, optimistic]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', {
        conversationId: String(activeConv._id), text,
      }, (res) => {
        if (res?.message) {
          const parsed = parseMessage(res.message);
          setMessages(prev => prev.map(m => m._id === optimistic._id ? parsed : m));
        } else if (res?.error) {
          setMessages(prev => prev.filter(m => m._id !== optimistic._id));
        }
        setIsSending(false);
      });
    } else {
      try {
        const res  = await fetch(`/api/messages/${activeConv._id}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.success) {
          const parsed = parseMessage(data.data);
          setMessages(prev => prev.map(m => m._id === optimistic._id ? parsed : m));
        } else {
          setMessages(prev => prev.filter(m => m._id !== optimistic._id));
        }
      } catch {
        setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      }
      setIsSending(false);
    }
  }, [inputText, isSending, activeConv, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socketRef.current && activeConv) {
      socketRef.current.emit('typing:start', { conversationId: String(activeConv._id) });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit('typing:stop', { conversationId: String(activeConv._id) });
      }, 1500);
    }
  };

  const filteredConvs = conversations.filter(conv => {
    if (!search.trim()) return true;
    const other = conv.participants?.find(p => String(p._id) !== String(user?.id));
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.myUnread || 0), 0);
  const activeOther = activeConv?.participants?.find(p => String(p._id) !== String(user?.id));
  const activeTyping = activeConv ? typingIndicators[activeConv._id] : null;

  return (
    <div className="flex h-[calc(100vh-60px)] bg-white border border-gray-200 rounded-none overflow-hidden -m-4 lg:-m-6">

      <div className={`flex flex-col border-r border-gray-200 bg-white
        ${activeConv ? 'hidden md:flex w-[320px] shrink-0' : 'flex w-full md:w-[320px] md:shrink-0'}`}>

        <div className="px-5 py-4 border-b border-gray-200 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-black">Messages</h2>
              {totalUnread > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 uppercase tracking-wider rounded-none">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-none overflow-hidden focus-within:border-black focus-within:bg-white transition-colors">
            <Search size={16} className="ml-3.5 text-gray-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-black placeholder-gray-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="mr-3">
                <X size={14} className="text-gray-500 hover:text-black" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-black" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare size={36} className="text-gray-200 mb-4" />
              <p className="text-base font-bold text-black mb-1">
                {search ? 'No results' : 'No messages yet'}
              </p>
              <p className="text-sm text-gray-500">
                {search ? 'Try a different search.' : 'When customers message you, they appear here.'}
              </p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <ConvItem
                key={conv._id}
                conv={conv}
                isActive={activeConv?._id === conv._id}
                myId={user?.id}
                isTyping={typingIndicators[conv._id]?.isTyping}
                onClick={() => selectConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 bg-gray-50
        ${!activeConv ? 'hidden md:flex' : 'flex'}`}>

        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
            <MessageSquare size={54} className="text-gray-200 mb-5" />
            <p className="text-xl font-bold tracking-tight text-black mb-2">Select a conversation</p>
            <p className="text-sm text-gray-500">Choose a customer from the list to start chatting.</p>
          </div>
        ) : (
          <>
            <div className="h-[64px] border-b border-gray-200 px-5 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="md:hidden text-gray-500 hover:text-black mr-1"
                >
                  ←
                </button>
                {activeOther?.avatar
                  ? <img src={activeOther.avatar} alt="" className="w-10 h-10 rounded-none border border-gray-200 object-cover" />
                  : <div className="w-10 h-10 rounded-none bg-gray-200 flex items-center justify-center text-black text-sm font-bold">
                      {activeOther?.name?.slice(0, 2).toUpperCase() || '?'}
                    </div>
                }
                <div>
                  <p className="text-base font-bold text-black leading-tight">
                    {activeOther?.name || 'Customer'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-500">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-none border border-green-200">
                  <ShieldCheck size={13} /> Protected
                </div>
                <button className="p-2 hover:bg-gray-50 hover:text-black rounded-none transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-white">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-black" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-sm font-medium text-red-500 bg-red-50 border border-red-200 p-4 rounded-none">
                  <AlertCircle size={15} /> {error}
                  <button onClick={() => { setError(''); selectConversation(activeConv); }} className="ml-auto p-1 bg-white rounded-none hover:scale-105 transition-transform">
                    <RefreshCw size={14} />
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <Bubble
                    key={msg._id}
                    msg={msg}
                    isMine={String(msg.sender?._id || msg.sender) === String(user?.id)}
                  />
                ))
              )}

              {(activeTyping?.isTyping || activeTyping?.text) && (
                <div className="flex items-end gap-2 mt-4 mb-2">
                  <div className="w-7 h-7 rounded-none bg-gray-200 flex items-center justify-center text-black text-xs font-bold shrink-0">
                    {activeOther?.name?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div className="bg-gray-50 text-black rounded-none px-4 py-2.5 max-w-[75%] break-words">
                    {activeTyping.text ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm leading-relaxed">
                          {activeTyping.text}....
                        </span>
                        <Pencil size={14} className="text-gray-500 shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 h-[21px]">
                        {[0, 150, 300].map(delay => (
                          <span
                            key={delay}
                            className="w-1.5 h-1.5 bg-gray-500 rounded-none animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={bottomRef} className="h-4 w-full shrink-0" />
            </div>

            <div className="border-t border-gray-200 bg-white shrink-0 p-3 pb-4">
              <div className="flex items-end gap-3 max-w-4xl mx-auto w-full">
                <button className="p-2.5 text-gray-500 hover:text-black hover:bg-gray-50 rounded-none transition-colors shrink-0">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 bg-gray-50 rounded-none border border-gray-300 focus-within:border-gray-200 focus-within:bg-white transition-colors flex items-end px-4 py-1">
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a reply..."
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    className="flex-1 resize-none bg-transparent py-2.5 text-sm text-black placeholder-gray-500 outline-none"
                  />
                  <button className="p-2 mb-1 text-gray-500 hover:text-black rounded-none transition-colors shrink-0">
                    <Smile size={20} />
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isSending}
                  className="w-11 h-11 bg-black hover:bg-blue-600 text-white rounded-none flex items-center justify-center transition-all disabled:opacity-50 hover:scale-105 shrink-0"
                >
                  {isSending
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Send    size={18} className="ml-1" />
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}