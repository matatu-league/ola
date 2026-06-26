"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare, User, ChevronRight, ChevronDown,
  Search, ShieldCheck, Phone, Video,
  Smile, Image as ImageIcon, Paperclip, MoreVertical,
  MapPin, ShoppingCart, Inbox, LogOut, LayoutDashboard,
  Loader2, Send, X, CheckCheck, Check, AlertCircle
} from 'lucide-react';

import { useUser }          from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useCart }          from '@/contexts/CartContext';

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV
// ─────────────────────────────────────────────────────────────────────────────
const MessageTopNav = () => {
  const { user, logout, sellerPortalUrl } = useUser();
  const { totalUnread }                   = useNotifications();
  const { cartCount, toggleDrawer }       = useCart();
  const [showMenu, setShowMenu]           = useState(false);

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

          {/* Account */}
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
                    <p className="text-[13px] font-bold text-[#161823] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#8A8B91] truncate">{user.email}</p>
                  </div>
                </div>
                <Link href={sellerPortalUrl} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#161823] hover:bg-[#F8F8F8] transition-colors">
                  <LayoutDashboard size={14} className="text-[#8A8B91]" /> Seller Portal
                </Link>
                <div className="border-t border-[#E3E3E4] my-1" />
                <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#FE2C55] hover:bg-[#FFF0F3] transition-colors">
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>

          {/* Messages — active, shows live badge */}
          <Link href="/messages" className="flex flex-col items-center relative">
            <div className="relative">
              <MessageSquare size={20} className="text-[#FE2C55]" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border border-white px-0.5">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-[#FE2C55] mt-1 hidden md:block">Messages</span>
          </Link>

          <Link href="/account/orders" className="flex flex-col items-center group">
            <Inbox size={20} className="text-[#161823] group-hover:text-[#FE2C55] transition-colors" />
            <span className="text-[11px] font-medium text-[#161823] mt-1 hidden md:block">Orders</span>
          </Link>

          <div onClick={toggleDrawer} className="flex flex-col items-center cursor-pointer group relative">
            <div className="relative">
              <ShoppingCart size={20} className="text-[#161823] group-hover:text-[#FE2C55] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#FE2C55] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-[#161823] mt-1 hidden md:block">Cart</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT REF PARSER — extracts [Product: ...] prefix from message text
// ─────────────────────────────────────────────────────────────────────────────
function parseMessage(msg, fallbackProduct) {
  if (msg._parsed) return msg;
  const parsed = { ...msg, _parsed: true };

  if (typeof parsed.text === 'string' && parsed.text.startsWith('[Product: ')) {
    const match = parsed.text.match(/^\[Product:\s*(.*?)\](?:\n([\s\S]*))?$/);
    if (match) {
      // Robust image lookup — supports `image` (single), `images[0]` (array),
      // or `image` populated as URL string
      const productImage =
        fallbackProduct?.image ||
        (Array.isArray(fallbackProduct?.images) ? fallbackProduct.images[0] : null) ||
        fallbackProduct?.thumbnail ||
        null;

      parsed._isProductCard = true;
      parsed._productTitle  = match[1]?.trim() || fallbackProduct?.title || 'Product';
      parsed.text           = match[2] ? match[2].trim() : '';
      parsed._productImage  = productImage;
      parsed._productId     = fallbackProduct?._id || null;
    }
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION LIST ITEM
// ─────────────────────────────────────────────────────────────────────────────
const ConvItem = ({ conv, isActive, onClick, currentUserId }) => {
  // Try server-provided otherParticipant first, fall back to client-side resolution
  const other = conv.otherParticipant ||
    conv.participants?.find(p => String(p?._id) !== String(currentUserId)) ||
    null;
  const unread   = conv.myUnread || 0;
  const lastMsg  = conv.lastMessage;
  const initials = other?.name?.slice(0, 2).toUpperCase() || '??';

  const preview = lastMsg?.type === 'image' ? '📷 Image'
    : lastMsg?.type === 'file'  ? '📎 File'
    : lastMsg?.type === 'video' ? '🎥 Video'
    : lastMsg?.text || 'Start a conversation';

  const timeStr = lastMsg?.sentAt
    ? new Date(lastMsg.sentAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-[#F0F0F0] transition-colors
        ${isActive ? 'bg-[#FFF0F3]' : 'hover:bg-[#F8F8F8]'}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {other?.avatar
          ? <img src={other.avatar} alt="" className="w-10 h-10 rounded-full border border-[#E3E3E4] object-cover" />
          : (
            <div className="w-10 h-10 rounded-full bg-[#161823] flex items-center justify-center text-white text-[13px] font-bold">
              {initials}
            </div>
          )
        }
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FE2C55] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border border-white px-0.5">
            {unread}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className={`text-[13px] truncate ${unread > 0 ? 'font-bold text-[#161823]' : 'font-semibold text-[#161823]'}`}>
            {other?.name || 'Unknown'}
          </p>
          <span className="text-[10px] text-[#8A8B91] shrink-0">{timeStr}</span>
        </div>
        <p className={`text-[11px] truncate ${unread > 0 ? 'text-[#161823] font-medium' : 'text-[#8A8B91]'}`}>
          {preview}
        </p>
        {conv.relatedProduct && (
          <p className="text-[10px] text-[#FE2C55] truncate mt-0.5">
            Re: {conv.relatedProduct.title}
          </p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMine }) => {
  const time = new Date(msg.createdAt).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
  const isRead = msg.readBy?.length > 1;

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        msg.sender?.avatar
          ? <img src={msg.sender.avatar} alt="" className="w-7 h-7 rounded-full border border-[#E3E3E4] object-cover shrink-0 mb-1" />
          : <div className="w-7 h-7 rounded-full bg-[#161823] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-1">
              {msg.sender?.name?.slice(0, 2).toUpperCase() || '?'}
            </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[68%] ${isMine ? 'items-end' : 'items-start'}`}>

        {/* Product reference card — shown above text bubble if message references a product */}
        {msg._isProductCard && (
          <Link
            href={msg._productId ? `/products/${msg._productId}` : '#'}
            className={`flex items-center gap-2 border rounded-sm p-2 max-w-[260px] mb-1 transition-colors
              ${isMine
                ? 'bg-[#F8F8F8] border-[#E3E3E4] hover:border-[#161823]'
                : 'bg-white border-[#E3E3E4] hover:border-[#FE2C55]'
              }`}
          >
            {/* Product image — always rendered; falls back to emoji if missing */}
            <div className="w-10 h-10 rounded-sm border border-[#E3E3E4] shrink-0 bg-[#F8F8F8] overflow-hidden flex items-center justify-center">
              {msg._productImage
                ? <img src={msg._productImage} alt={msg._productTitle} className="w-full h-full object-cover" />
                : <span className="text-base">📦</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-[#FE2C55] font-bold uppercase tracking-wide flex items-center gap-0.5">
                <span>📦</span> Product inquiry
              </p>
              <p className="text-[11px] text-[#161823] font-semibold line-clamp-2 leading-tight">
                {msg._productTitle}
              </p>
            </div>
          </Link>
        )}

        {/* Text bubble — only if there's actual text */}
        {!!msg.text && (
          <div className={`px-3.5 py-2 rounded-sm text-[13px] leading-relaxed break-words
            ${isMine
              ? 'bg-[#161823] text-white rounded-br-none'
              : 'bg-[#F8F8F8] border border-[#E3E3E4] text-[#161823] rounded-bl-none'
            }`}>
            {msg.type === 'image' && msg.fileUrl ? (
              <img src={msg.fileUrl} alt="image" className="max-w-[220px] rounded-sm" />
            ) : msg.type === 'file' && msg.fileUrl ? (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 underline text-[12px]">
                <Paperclip size={13} /> {msg.fileName || 'File'}
              </a>
            ) : (
              msg.text
            )}
          </div>
        )}

        {/* Time + read receipt */}
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-[#8A8B91]">{time}</span>
          {isMine && (
            isRead
              ? <CheckCheck size={12} className="text-[#10B981]" />
              : <Check      size={12} className="text-[#8A8B91]" />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAT AREA
// ─────────────────────────────────────────────────────────────────────────────
const ChatArea = ({ conversation, currentUserId, socket }) => {
  const [messages,    setMessages]    = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [inputText,   setInputText]   = useState('');
  const [isSending,   setIsSending]   = useState(false);
  const [isTyping,    setIsTyping]    = useState(false); // other person typing
  const [error,       setError]       = useState('');

  const { markConversationRead } = useNotifications();
  const bottomRef    = useRef(null);
  const typingTimer  = useRef(null);
  const convId = conversation?._id;
  const other  = conversation?.otherParticipant ||
    conversation?.participants?.find(p => String(p?._id) !== String(currentUserId)) ||
    null;

  // ── Load message history ──────────────────────────────────────────────────
  useEffect(() => {
    if (!convId) return;
    setMessages([]);
    setIsLoading(true);
    setError('');

    fetch(`/api/messages/${convId}/history?limit=50`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Use relatedProduct from the API (populated with full image/images data)
          // falling back to conversation prop if the API didn't include it
          const refProduct = data.relatedProduct || conversation?.relatedProduct;
          const parsed = (data.data || []).map(m => parseMessage(m, refProduct));
          setMessages(parsed);
        }
        else setError(data.message || 'Failed to load messages');
      })
      .catch(() => setError('Could not load messages'))
      .finally(() => setIsLoading(false));

    // Join conversation room + mark read
    if (socket) {
      socket.emit('join:conversation', convId);
      socket.emit('message:read', { conversationId: convId });
      markConversationRead();
    }

    return () => {
      if (socket) socket.emit('leave:conversation', convId);
    };
  }, [convId]);

  // ── Real-time socket events ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !convId) return;

    const onNewMessage = (msg) => {
      if (String(msg.conversation) !== String(convId)) return;
      const parsed = parseMessage(msg, conversation?.relatedProduct);
      setMessages(prev => {
        // Already present — skip
        if (prev.find(x => String(x._id) === String(parsed._id))) return prev;
        // Replace optimistic version if matching
        const myId  = String(currentUserId);
        const optIx = prev.findIndex(x =>
          x._optimistic &&
          String(x.sender?._id || x.sender) === myId &&
          x.text === parsed.text
        );
        if (optIx !== -1) {
          const next = [...prev];
          next[optIx] = parsed;
          return next;
        }
        return [...prev, parsed];
      });
      socket.emit('message:read', { conversationId: convId });
      markConversationRead();
    };

    const onTypingStart = ({ userId }) => {
      if (String(userId) !== String(currentUserId)) setIsTyping(true);
    };
    const onTypingStop = ({ userId }) => {
      if (String(userId) !== String(currentUserId)) setIsTyping(false);
    };
    const onRead = () => {
      // Update read receipts on all messages
      setMessages(prev => prev.map(m => ({
        ...m,
        readBy: m.readBy?.length > 1 ? m.readBy : [...(m.readBy || []), { user: other?._id }],
      })));
    };

    socket.on('message:new',   onNewMessage);
    socket.on('typing:start',  onTypingStart);
    socket.on('typing:stop',   onTypingStop);
    socket.on('message:read',  onRead);

    return () => {
      socket.off('message:new',   onNewMessage);
      socket.off('typing:start',  onTypingStart);
      socket.off('typing:stop',   onTypingStop);
      socket.off('message:read',  onRead);
    };
  }, [socket, convId, currentUserId]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socket && convId) {
      socket.emit('typing:start', { conversationId: convId });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: convId });
      }, 1500);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');
    if (socket) socket.emit('typing:stop', { conversationId: convId });

    // Optimistic UI — add message immediately
    const optimistic = {
      _id:          `temp-${Date.now()}`,
      conversation: convId,
      sender:       { _id: currentUserId },
      text,
      type:         'text',
      createdAt:    new Date().toISOString(),
      readBy:       [{ user: currentUserId }],
      _optimistic:  true,
    };
    setMessages(prev => [...prev, optimistic]);

    if (socket?.connected) {
      // Send via WebSocket
      socket.emit('message:send', { conversationId: convId, text }, (res) => {
        if (res?.error) {
          setError(res.error);
          setMessages(prev => prev.filter(m => m._id !== optimistic._id));
        } else if (res?.message) {
          // Replace optimistic with real message from server
          setMessages(prev => prev.map(m => m._id === optimistic._id ? res.message : m));
        }
        setIsSending(false);
      });
    } else {
      // HTTP fallback
      try {
        const r = await fetch(`/api/messages/${convId}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text }),
        });
        const data = await r.json();
        if (data.success) {
          setMessages(prev => prev.map(m => m._id === optimistic._id ? data.data : m));
        } else {
          setMessages(prev => prev.filter(m => m._id !== optimistic._id));
          setError(data.message);
        }
      } catch {
        setMessages(prev => prev.filter(m => m._id !== optimistic._id));
        setError('Failed to send message');
      }
      setIsSending(false);
    }
  }, [inputText, isSending, socket, convId, currentUserId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!conversation) {
    return (
      <div className="flex-1 h-full hidden md:flex items-center justify-center bg-[#F8F8F8]">
        <div className="text-center">
          <MessageSquare size={48} className="text-[#E3E3E4] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#161823]">Select a conversation</p>
          <p className="text-[12px] text-[#8A8B91] mt-1">Choose from your inbox to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full hidden md:flex flex-col bg-white">

      {/* Header */}
      <div className="h-[56px] border-b border-[#E3E3E4] px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {other?.avatar
            ? <img src={other.avatar} alt="" className="w-8 h-8 rounded-full border border-[#E3E3E4] object-cover" />
            : <div className="w-8 h-8 rounded-full bg-[#161823] flex items-center justify-center text-white text-[11px] font-bold">
                {other?.name?.slice(0, 2).toUpperCase() || '?'}
              </div>
          }
          <div>
            <p className="text-[14px] font-bold text-[#161823] leading-tight">{other?.name}</p>
            {isTyping && (
              <p className="text-[11px] text-[#10B981]">typing...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#8A8B91]">
          <Phone   size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
          <Video   size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
          <User    size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
        </div>
      </div>

      {/* Trust badge */}
      <div className="shrink-0 px-5 py-2.5 border-b border-[#F0F0F0] bg-[#F0FDF4]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-[#10B981] shrink-0" />
          <p className="text-[11px] text-[#065F46]">
            Keep chats and transactions on Ola.ug to enjoy order protection.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#8A8B91]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-[12px] text-[#FE2C55] bg-[#FFF0F3] border border-[#FE2C55] p-3 rounded-sm">
            <AlertCircle size={13} /> {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[13px] text-[#8A8B91]">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMine={String(msg.sender?._id || msg.sender) === String(currentUserId)}
            />
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-[#161823] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {other?.name?.slice(0, 2).toUpperCase() || '?'}
            </div>
            <div className="bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm rounded-bl-none px-4 py-2.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#8A8B91] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#8A8B91] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#8A8B91] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E3E3E4] bg-white shrink-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1 text-[#8A8B91]">
          <Smile      size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
          <ImageIcon  size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
          <Paperclip  size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
          <div className="h-4 w-px bg-[#E3E3E4] mx-1" />
          <MoreVertical size={17} className="cursor-pointer hover:text-[#161823] transition-colors" />
        </div>

        {/* Text + send */}
        <div className="flex items-end gap-3 px-4 pb-4">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={2}
            className="flex-1 resize-none bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[13px] text-[#161823] placeholder-[#8A8B91] outline-none focus:border-[#161823] transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isSending}
            className="bg-[#161823] hover:bg-black text-white p-2.5 rounded-sm transition-colors disabled:opacity-40 shrink-0"
          >
            {isSending
              ? <Loader2 size={16} className="animate-spin" />
              : <Send    size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user, isLoggedIn, isLoading: userLoading } = useUser();
  const { getSocket, totalUnread }                    = useNotifications();

  const [conversations,    setConversations]    = useState([]);
  const [activeConv,       setActiveConv]       = useState(null);
  const [isLoadingConvs,   setIsLoadingConvs]   = useState(true);
  const [search,           setSearch]           = useState('');
  const [activeTab,        setActiveTab]        = useState('all'); // 'all' | 'unread'

  const socket = getSocket();

  // ── Load conversations ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    setIsLoadingConvs(true);

    fetch('/api/messages/me')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setConversations(data.data || []);
          // Auto-select first conversation
          if (data.data?.length > 0 && !activeConv) setActiveConv(data.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingConvs(false));
  }, [isLoggedIn]);

  // ── Real-time: update conversation list when new message arrives ──────────
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      setConversations(prev => prev.map(conv => {
        if (String(conv._id) !== String(msg.conversation)) return conv;
        const isMine = String(msg.sender?._id || msg.sender) === String(user?.id);
        return {
          ...conv,
          lastMessage: { text: msg.text, sentAt: msg.createdAt, type: msg.type },
          myUnread: isMine ? conv.myUnread : (conv.myUnread || 0) + 1,
        };
      }));

      // Re-sort by latest message
      setConversations(prev => [...prev].sort((a, b) =>
        new Date(b.lastMessage?.sentAt || 0) - new Date(a.lastMessage?.sentAt || 0)
      ));
    };

    socket.on('message:new', onNewMessage);
    return () => socket.off('message:new', onNewMessage);
  }, [socket, user?.id]);

  // ── Filter conversations ──────────────────────────────────────────────────
  const filteredConvs = conversations.filter(conv => {
    const otherName = conv.otherParticipant?.name?.toLowerCase() || '';
    const matchSearch = !search || otherName.includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || (activeTab === 'unread' && conv.myUnread > 0);
    return matchSearch && matchTab;
  });

  const unreadCount = conversations.filter(c => c.myUnread > 0).length;

  if (userLoading) {
    return (
      <div className="flex flex-col w-full h-screen bg-white items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#8A8B91]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-white font-sans overflow-hidden">
      <MessageTopNav />

      {/* ── Contained Wrapper ─────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-0 md:p-6 overflow-hidden">
        
        {/* Chat Card Container (Shadows removed completely) */}
        <div className="flex w-full h-full bg-white border-y md:border border-[#E3E3E4] md:rounded-sm overflow-hidden">

          {/* ── Conversation inbox ──────────────────────────────────────────── */}
          <div className="w-full md:w-[320px] h-full bg-white border-r border-[#E3E3E4] flex flex-col flex-shrink-0">

            {/* Search + tabs header */}
            <div className="px-4 pt-4 pb-0 border-b border-[#E3E3E4]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-[#161823]">Messages</h2>
                <div className="bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-1.5 cursor-pointer hover:border-[#161823] transition-colors">
                  <Search size={14} className="text-[#8A8B91]" />
                </div>
              </div>

              {/* Search input */}
              <div className="flex items-center bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm mb-3 overflow-hidden focus-within:border-[#161823] transition-colors">
                <Search size={13} className="ml-2.5 text-[#8A8B91] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="flex-1 px-2 py-2 text-[12px] outline-none bg-transparent text-[#161823] placeholder-[#8A8B91]"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="mr-2">
                    <X size={12} className="text-[#8A8B91]" />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-5">
                {[
                  { id: 'all',    label: 'All',    count: conversations.length },
                  { id: 'unread', label: 'Unread', count: unreadCount },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2.5 text-[13px] font-medium transition-colors relative border-none bg-transparent cursor-pointer
                      ${activeTab === tab.id ? 'text-[#161823] font-bold' : 'text-[#8A8B91] hover:text-[#161823]'}`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold bg-[#FFF0F3] text-[#FE2C55] px-1.5 py-0.5 rounded-sm">
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#161823]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConvs ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-[#8A8B91]" />
                </div>
              ) : !isLoggedIn ? (
                <div className="p-6 text-center">
                  <p className="text-[13px] text-[#8A8B91]">Sign in to view your messages</p>
                  <Link href="/" className="mt-3 inline-block bg-[#FE2C55] text-white px-4 py-2 rounded-sm text-[12px] font-semibold">
                    Sign In
                  </Link>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare size={32} className="text-[#E3E3E4] mx-auto mb-2" />
                  <p className="text-[13px] text-[#8A8B91]">
                    {search ? 'No conversations match your search' : activeTab === 'unread' ? 'No unread messages' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filteredConvs.map(conv => (
                  <ConvItem
                    key={conv._id}
                    conv={conv}
                    isActive={activeConv?._id === conv._id}
                    currentUserId={user?.id}
                    onClick={() => {
                      setActiveConv(conv);
                      // Reset unread locally
                      setConversations(prev =>
                        prev.map(c => c._id === conv._id ? { ...c, myUnread: 0 } : c)
                      );
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Chat area ─────────────────────────────────────────────────── */}
          <ChatArea
            conversation={activeConv}
            currentUserId={user?.id}
            socket={socket}
          />

        </div>
      </main>
    </div>
  );
}
