"use client";

// components/marketplace/MessagePopover.jsx
// Unified chat popover — supports BOTH product and order inquiries.
// Encodes reference data INSIDE the message text so no DB schema fields needed.
//
// Format:
//   Product: [Product: Title|productId|imageUrl]
//   Order:   [Order: ORD-001|orderId|totalAmount|status|img1,img2,img3]

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Send, Loader2, MessageSquare, Maximize2, Package, ChevronDown,
  Paperclip, Smile, ShieldCheck, ClipboardList,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/hooks/useAuth';
import { io as socketIO } from 'socket.io-client';

function getSocketConfig() {
  const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return { url, path: '/socket.io' };
}

// ── Encode a product attachment into a text prefix ───────────────────────────
function encodeProduct(product) {
  if (!product) return '';
  const image = product.image || (Array.isArray(product.images) ? product.images[0] : '') || '';
  // Pipe-delimited: title | id | imageUrl
  return `[Product: ${product.title}|${product._id}|${image}]`;
}

// ── Encode an order attachment into a text prefix ────────────────────────────
function encodeOrder(order) {
  if (!order) return '';
  const itemImages = (order.items || [])
    .slice(0, 3)
    .map(i => i.image || '')
    .filter(Boolean)
    .join(',');
  // Pipe-delimited: number | id | total | status | comma-separated image urls
  return `[Order: ${order.orderNumber}|${order._id}|${order.totalAmount}|${order.orderStatus || ''}|${itemImages}]`;
}

// ── Parser — decodes prefix into card metadata ────────────────────────────────
function parseMessage(msg) {
  if (msg._parsed) return msg;
  const parsed = { ...msg, _parsed: true };

  if (typeof parsed.text !== 'string') return parsed;

  // Match [Order: number|id|total|status|imgs]\nrest
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

  // Match [Product: title|id|imgUrl]\nrest
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

// ── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg, myId }) {
  const isMine = String(msg.sender?._id || msg.sender) === String(myId);
  const time   = new Date(msg.createdAt).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
  const isRead = (msg.readBy?.length || 0) > 1;

  return (
    <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex flex-col gap-0.5 max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}>

        {/* ── Composite: order card with text as caption ────────────────── */}
        {msg._isOrderCard && (
          <div className={`overflow-hidden rounded-2xl border border-[#E3E3E4] max-w-[280px]
            ${isMine ? 'bg-[#161823]' : 'bg-white'}`}
          >
            <a
              href={msg._orderId ? `/orders/${msg._orderId}` : '#'}
              className={`block p-2.5 transition-colors
                ${isMine ? 'hover:bg-white/5' : 'hover:bg-[#F8F8F8]'}`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <ClipboardList size={11} className={isMine ? 'text-white/70' : 'text-[#FE2C55]'} />
                <p className={`text-[9px] font-bold uppercase tracking-wide
                  ${isMine ? 'text-white/60' : 'text-[#FE2C55]'}`}>
                  Order Inquiry
                </p>
              </div>
              <p className={`text-[12px] font-bold leading-tight mb-0.5
                ${isMine ? 'text-white' : 'text-[#161823]'}`}>
                {msg._orderNumber}
              </p>
              {msg._orderTotal && (
                <p className={`text-[10px] ${isMine ? 'text-white/60' : 'text-[#8A8B91]'}`}>
                  UGX {Number(msg._orderTotal).toLocaleString()}
                  {msg._orderStatus && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-[#FFF0F3] text-[#FE2C55] font-bold rounded-sm uppercase text-[9px]">
                      {msg._orderStatus}
                    </span>
                  )}
                </p>
              )}
              {msg._orderItems?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {msg._orderItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-9 h-9 rounded border border-[#E3E3E4] overflow-hidden bg-[#F8F8F8]">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[10px]">📦</div>
                      }
                    </div>
                  ))}
                </div>
              )}
            </a>

            {/* Caption — the user's question */}
            {msg.text && (
              <div className={`px-3 py-2 text-[14px] leading-relaxed break-words border-t
                ${isMine
                  ? 'text-white border-white/10'
                  : 'text-[#161823] border-[#F0F0F0] bg-[#FAFAFA]'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        )}

        {/* ── Composite: product card with text as caption ──────────────── */}
        {msg._isProductCard ? (
          <div className={`overflow-hidden rounded-2xl border border-[#E3E3E4] max-w-[280px]
            ${isMine ? 'bg-[#161823]' : 'bg-white'}`}
          >
            {/* Product header — clickable */}
            <a
              href={msg._productId ? `/products/${msg._productId}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 p-2.5 transition-colors
                ${isMine ? 'hover:bg-white/5' : 'hover:bg-[#F8F8F8]'}`}
            >
              <div className="w-14 h-14 rounded-lg shrink-0 bg-white overflow-hidden flex items-center justify-center border border-[#E3E3E4]">
                {msg._productImage
                  ? <img src={msg._productImage} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl">📦</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5
                  ${isMine ? 'text-white/60' : 'text-[#FE2C55]'}`}>
                  <Package size={9} /> Inquiry
                </p>
                <p className={`text-[12px] font-semibold line-clamp-2 leading-tight mt-0.5
                  ${isMine ? 'text-white' : 'text-[#161823]'}`}>
                  {msg._productTitle}
                </p>
              </div>
            </a>

            {/* Caption — the actual text, glued to the card */}
            {msg.text && (
              <div className={`px-3 py-2 text-[14px] leading-relaxed break-words border-t
                ${isMine
                  ? 'text-white border-white/10'
                  : 'text-[#161823] border-[#F0F0F0] bg-[#FAFAFA]'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ) : msg.text ? (
          /* Plain text bubble */
          <div className={`px-4 py-2.5 text-[14px] leading-relaxed break-words rounded-2xl
            ${isMine
              ? 'bg-[#161823] text-white rounded-br-sm'
              : 'bg-[#F0F0F0] text-[#161823] rounded-bl-sm'
            }`}
          >
            {msg.text}
          </div>
        ) : null}

        <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-[#8A8B91]">{time}</span>
          {isMine && (
            <span className={`text-[11px] font-bold ${isRead ? 'text-[#10B981]' : 'text-[#8A8B91]'}`}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PoweredByOla() {
  const [logoFailed, setLogoFailed] = React.useState(false);
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 border-t border-[#F0F0F0] bg-[#FAFAFA]">
      <span className="text-[10px] text-[#8A8B91] font-medium tracking-wide uppercase">Powered by</span>
      {!logoFailed ? (
        <img src="/logo.png" alt="Ola.ug" className="h-3.5 w-auto" onError={() => setLogoFailed(true)} />
      ) : (
        <span className="font-extrabold text-[12px] tracking-tighter leading-none flex items-center">
          <span className="text-[#FE2C55]">Ola</span>
          <span className="text-[#161823]">.ug</span>
        </span>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MessagePopover({ product, order, sellerId, store, trigger }) {
  const router = useRouter();
  const { user, isLoggedIn } = useUser();
  const { loginWithGoogle, loginWithTikTok, authProvider } = useAuth();

  const mode      = order ? 'order' : 'product';
  const isOrder   = mode === 'order';
  const storeData = store || product?.store || order?.store || {};

  const [isOpen,       setIsOpen]       = useState(false);
  const [isMinimised,  setIsMinimised]  = useState(false);
  const [authError,    setAuthError]    = useState('');
  const [isOnline,     setIsOnline]     = useState(false);
  const [conv,         setConv]         = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [inputText,    setInputText]    = useState('');
  const [isSending,    setIsSending]    = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isTyping,     setIsTyping]     = useState(false);
  const [refAttached,  setRefAttached]  = useState(true);
  const [unread,       setUnread]       = useState(0);
  const [socketReady,  setSocketReady]  = useState(false);

  const socketRef   = useRef(null);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimised) setUnread(0);
  }, [isOpen, isMinimised]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const { url, path } = getSocketConfig();
    const socket = socketIO(url, {
      path,
      auth:                 { userId: user.id },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 5,
      timeout:              8000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketReady(true);
      socket.emit('presence:check', { userId: sellerId });
    });
    socket.on('connect_error', () => setSocketReady(false));
    socket.on('disconnect',    () => setSocketReady(false));

    socket.on('user:online',  ({ userId }) => { if (String(userId) === String(sellerId)) setIsOnline(true); });
    socket.on('user:offline', ({ userId }) => { if (String(userId) === String(sellerId)) setIsOnline(false); });
    socket.on('presence:status', ({ userId, online }) => { if (String(userId) === String(sellerId)) setIsOnline(online); });

    socket.on('message:new', (msg) => {
      const convId = String(msg.conversation);
      setConv(prev => {
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
          if (!isOpen || isMinimised) setUnread(n => n + 1);
          socket.emit('message:read', { conversationId: convId });
        }
        return prev;
      });
    });

    socket.on('typing:start', ({ userId: uid }) => { if (String(uid) !== String(user.id)) setIsTyping(true); });
    socket.on('typing:stop',  ({ userId: uid }) => { if (String(uid) !== String(user.id)) setIsTyping(false); });

    socket.on('message:read', () => {
      setMessages(prev => prev.map(m =>
        m.readBy?.length <= 1
          ? { ...m, readBy: [...(m.readBy || []), { user: sellerId }] }
          : m
      ));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, [isLoggedIn, user?.id, sellerId]);

  useEffect(() => {
    if (conv && socketRef.current?.connected) {
      socketRef.current.emit('join:conversation', String(conv._id));
      socketRef.current.emit('message:read', { conversationId: String(conv._id) });
    }
  }, [conv?._id]);

  const openChat = useCallback(async () => {
    setIsOpen(true);
    setIsMinimised(false);
    setUnread(0);

    if (!isLoggedIn || conv) return;

    setIsLoading(true);
    try {
      const res  = await fetch('/api/messages/conversations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          recipientId:    String(sellerId),
          relatedStoreId: storeData?._id ? String(storeData._id) : null,
        }),
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        const conversation = data.data;
        setConv(conversation);

        const msgRes  = await fetch(`/api/messages/${conversation._id}/history?limit=30`);
        const msgData = await msgRes.json();
        if (msgData?.success) {
          // Parse each — refs are encoded in the text itself, no fallback needed
          const parsed = (msgData.data || []).map(parseMessage);
          setMessages(parsed);
        }
      }
    } catch (err) {
      console.error('[Chat] Failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, conv, sellerId, storeData]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending || !conv) return;

    const myId = String(user?.id || '');

    setIsSending(true);
    setInputText('');
    clearTimeout(typingTimer.current);
    socketRef.current?.emit('typing:stop', { conversationId: String(conv._id) });

    // Encode ref into prefix if attached
    let prefix = '';
    if (refAttached) {
      prefix = isOrder ? encodeOrder(order) : encodeProduct(product);
    }
    const serverText = prefix ? `${prefix}\n${text}` : text;

    const tmpId = `tmp-${Date.now()}`;
    // Build optimistic message — parseMessage will be called below so this
    // works for both attached and unattached
    const optimisticRaw = {
      _id:          tmpId,
      conversation: conv._id,
      sender:       { _id: myId, name: user?.name, avatar: user?.avatar },
      text:         serverText,
      type:         'text',
      createdAt:    new Date().toISOString(),
      readBy:       [{ user: myId }],
      _optimistic:  true,
    };
    const optimistic = parseMessage(optimisticRaw);

    setMessages(prev => [...prev, optimistic]);
    if (refAttached) setRefAttached(false);  // clear after sending

    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', {
        conversationId: String(conv._id),
        text:           serverText,
      }, (res) => {
        setIsSending(false);
        if (res?.message) {
          const parsedReal = parseMessage(res.message);
          setMessages(prev => prev.map(m => m._id === tmpId ? parsedReal : m));
        } else {
          setMessages(prev => prev.filter(m => m._id !== tmpId));
        }
      });
    } else {
      try {
        const res = await fetch(`/api/messages/${conv._id}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text: serverText }),
        });
        const d = await res.json();
        if (res.ok && d?.success) {
          const parsedReal = parseMessage(d.data);
          setMessages(prev => prev.map(m => m._id === tmpId ? parsedReal : m));
        } else {
          setMessages(prev => prev.filter(m => m._id !== tmpId));
        }
      } catch {
        setMessages(prev => prev.filter(m => m._id !== tmpId));
      }
      setIsSending(false);
    }
  }, [inputText, isSending, conv, user, refAttached, isOrder, order, product]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    if (socketRef.current?.connected && conv) {
      // Send the actual text along — seller chat shows it in real time
      // as `buyer text....[pencil]` for quick responses
      socketRef.current.emit('typing:start', {
        conversationId: String(conv._id),
        text:           val,
      });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit('typing:stop', { conversationId: String(conv._id) });
      }, 1500);
    }
  };

  const defaultTrigger = (
    <button
      onClick={openChat}
      className="w-full bg-[#161823] hover:bg-[#2A2B38] text-white font-semibold py-3 text-[14px] rounded-xl transition-colors flex justify-center items-center gap-2 tracking-wide relative group"
    >
      <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
      {isOrder ? 'Chat about order' : 'Chat with Store'}
      {unread > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#FE2C55] text-white text-[11px] font-bold min-w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
          {unread}
        </span>
      )}
    </button>
  );

  return (
    <>
      {trigger
        ? <div onClick={openChat} className="inline-block">{trigger}</div>
        : defaultTrigger
      }

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[199] md:hidden bg-black/20" onClick={() => setIsOpen(false)} />
          <div
            className="fixed bottom-4 right-4 z-[200] sm:bottom-6 sm:right-6"
            style={{
              width:  'min(390px, calc(100vw - 32px))',
              height: isMinimised ? 64 : 580,
              transition: 'height 0.3s cubic-bezier(0.16,1,0.3,1)',
              boxShadow:  '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-[#E3E3E4]">

              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5 shrink-0 cursor-pointer select-none"
                style={{ background: 'linear-gradient(135deg, #161823 0%, #2A2B38 100%)' }}
                onClick={() => setIsMinimised(p => !p)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {storeData.logo
                      ? <img src={storeData.logo} alt="" className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" />
                      : <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-[13px] font-bold">
                          {storeData.title?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                    }
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#2A2B38]"
                      style={{ background: isOnline ? '#10B981' : '#8A8B91' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-white leading-tight truncate">
                      {storeData.title || 'Store'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                      {storeData.verified && <span className="text-[#10B981] font-medium">✓ Verified</span>}
                      {storeData.verified && <span className="text-white/30">·</span>}
                      <span className={`font-medium ${isOnline ? 'text-[#10B981]' : 'text-white/60'}`}>
                        {isOnline ? 'Online now' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-white/70">
                  <button onClick={e => { e.stopPropagation(); router.push('/messages'); }} className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Maximize2 size={16} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setIsMinimised(p => !p); }} className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <ChevronDown size={18} style={{ transform: isMinimised ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setIsOpen(false); }} className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Auth gate */}
              {!isMinimised && !isLoggedIn && (
                <div className="flex-1 flex flex-col bg-white">
                  <div className="flex items-center gap-2 px-5 py-3 shrink-0"
                    style={{ background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', borderBottom: '1px solid #D1FAE5' }}>
                    <ShieldCheck size={14} className="text-[#10B981] shrink-0" />
                    <p className="text-[11px] text-[#065F46] font-medium">Sign in to chat — your messages stay protected</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center">
                    {storeData.logo
                      ? <img src={storeData.logo} alt="" className="w-20 h-20 rounded-full border border-[#E3E3E4] object-cover mb-4" />
                      : <div className="w-20 h-20 rounded-full bg-[#161823] flex items-center justify-center text-white text-2xl font-bold mb-4">
                          {storeData.title?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                    }
                    <p className="text-[16px] font-bold text-[#161823] mb-1">
                      Chat with {storeData.title || 'this store'}
                    </p>
                    <p className="text-[13px] text-[#8A8B91] mb-6 max-w-[260px]">
                      Sign in to get a quick reply
                    </p>
                    <div className="w-full max-w-[280px] space-y-3">
                      <button
                        onClick={async () => {
                          setAuthError('');
                          try { await loginWithGoogle(); } catch (err) { setAuthError(err?.message || 'Google sign-in failed'); }
                        }}
                        disabled={authProvider !== null}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#E3E3E4] hover:border-[#FE2C55] hover:bg-[#FFF0F3] rounded-xl text-[13px] font-semibold text-[#161823] transition-all disabled:opacity-50"
                      >
                        {authProvider === 'google' ? <Loader2 size={16} className="animate-spin" /> :
                          <svg viewBox="0 0 24 24" width="16" height="16">
                            <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
                              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                            </g>
                          </svg>
                        }
                        Continue with Google
                      </button>
                      <button
                        onClick={async () => {
                          setAuthError('');
                          try { await loginWithTikTok(); } catch (err) { setAuthError(err?.message || 'TikTok sign-in failed'); }
                        }}
                        disabled={authProvider !== null}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#161823] hover:bg-black rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-50"
                      >
                        {authProvider === 'tiktok' ? <Loader2 size={16} className="animate-spin" /> :
                          <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.755 4.755 0 0 1-1.161-3.18H10.66v14.596a3.2 3.2 0 1 1-3.2-3.2 3.2 3.2 0 0 1 2.33 1.011v-3.468a6.56 6.56 0 1 0 4.27 6.06V9.452a8.174 8.174 0 0 0 5.53 2.05v-4.816z" />
                          </svg>
                        }
                        Continue with TikTok
                      </button>
                      {authError && (
                        <p className="text-[11px] text-[#FE2C55] bg-[#FFF0F3] border border-[#FE2C55]/30 p-2.5 rounded-xl font-medium">{authError}</p>
                      )}
                    </div>
                  </div>
                  <PoweredByOla />
                </div>
              )}

              {/* Chat body */}
              {!isMinimised && isLoggedIn && (
                <>
                  <div className="flex items-center gap-2 px-5 py-2.5 shrink-0"
                    style={{ background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', borderBottom: '1px solid #D1FAE5' }}>
                    <ShieldCheck size={14} className="text-[#10B981] shrink-0" />
                    <p className="text-[11px] text-[#065F46] font-medium">Chats on Ola.ug are protected</p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
                    {isLoading ? (
                      <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#8A8B91]" /></div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[12px] text-[#8A8B91]">Send a message to start chatting</p>
                      </div>
                    ) : (
                      messages.map(msg => <Bubble key={msg._id} msg={msg} myId={user?.id} />)
                    )}

                    {isTyping && (
                      <div className="flex items-end gap-2 mt-2">
                        <div className="bg-[#F0F0F0] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                          {[0, 150, 300].map(d => (
                            <span key={d} className="w-1.5 h-1.5 bg-[#8A8B91] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={bottomRef} className="h-2 w-full shrink-0" />
                  </div>

                  {/* Input area — with attachment chip ABOVE textarea */}
                  <div className="border-t border-[#F0F0F0] bg-white shrink-0">

                    {/* Attachment chip — animates in, sticks until send */}
                    {refAttached && (
                      <div
                        className="mx-3 mt-3 mb-1"
                        style={{ animation: 'attachIn 0.2s ease-out' }}
                      >
                        <div className="flex items-center gap-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded-xl p-2 pr-3">
                          {isOrder ? (
                            <div className="w-9 h-9 rounded-lg bg-[#FFF0F3] flex items-center justify-center shrink-0">
                              <ClipboardList size={14} className="text-[#FE2C55]" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-[#E3E3E4] shrink-0">
                              {(product?.image || product?.images?.[0])
                                ? <img src={product.image || product.images?.[0]} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                              }
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-[#FE2C55] font-bold uppercase tracking-wide leading-tight">
                              {isOrder ? 'Order' : 'Product'} attached
                            </p>
                            <p className="text-[12px] text-[#161823] font-semibold truncate leading-tight">
                              {isOrder ? order.orderNumber : product.title}
                            </p>
                          </div>
                          <button
                            onClick={() => setRefAttached(false)}
                            className="p-1 hover:bg-[#E3E3E4] rounded-full text-[#8A8B91] transition-colors shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Re-attach button */}
                    {!refAttached && (
                      <div className="mx-3 mt-3 mb-1">
                        <button
                          onClick={() => setRefAttached(true)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8A8B91] hover:text-[#161823] hover:bg-[#F8F8F8] px-2.5 py-1.5 rounded-lg border border-dashed border-[#E3E3E4] hover:border-[#161823] transition-all"
                        >
                          {isOrder
                            ? <><ClipboardList size={12} /> Attach order {order.orderNumber}</>
                            : <><Package size={12} /> Attach this product</>
                          }
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-3 max-w-lg mx-auto w-full p-3">
                      <button className="p-2.5 text-[#8A8B91] hover:text-[#161823] hover:bg-[#F4F4F5] rounded-full transition-colors shrink-0">
                        <Paperclip size={20} />
                      </button>
                      <div className="flex-1 bg-[#F4F4F5] rounded-3xl border border-transparent focus-within:border-[#E3E3E4] focus-within:bg-white transition-colors flex items-end px-4 py-1">
                        <textarea
                          value={inputText}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Message..."
                          rows={1}
                          style={{ minHeight: '40px', maxHeight: '120px' }}
                          className="flex-1 resize-none bg-transparent py-2.5 text-[14px] text-[#161823] placeholder-[#8A8B91] outline-none"
                        />
                        <button className="p-2 mb-1 text-[#8A8B91] hover:text-[#161823] rounded-full transition-colors shrink-0">
                          <Smile size={20} />
                        </button>
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!inputText.trim() || isSending}
                        className="w-11 h-11 bg-[#161823] hover:bg-black text-white rounded-full flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 shrink-0"
                      >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                      </button>
                    </div>

                    <style>{`
                      @keyframes attachIn {
                        from { opacity: 0; transform: translateY(8px) scale(0.96); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                      }
                    `}</style>
                  </div>
                  <PoweredByOla />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
