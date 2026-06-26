"use client";

// contexts/NotificationContext.jsx
//
// Tracks total unread message count.
// Updates in real-time via Socket.io when new messages arrive.
//
// Usage:
//   const { totalUnread } = useNotifications();
//
// Wrap below UserProvider and CartProvider in layout:
//   <UserProvider>
//     <NotificationProvider>
//       <CartProvider>{children}</CartProvider>
//     </NotificationProvider>
//   </UserProvider>

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './UserContext';
import { io as socketIO } from 'socket.io-client';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);

  // ── Load initial unread count from REST API ───────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { setTotalUnread(0); return; }

    fetch('/api/messages/unread')
      .then(r => r.json())
      .then(data => { if (data.success) setTotalUnread(data.totalUnread); })
      .catch(() => {});
  }, [isLoggedIn]);

  // ── Connect Socket.io when user logs in ───────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Socket.io is on the same port as Next.js (shared server.mjs)
    // So we always connect to window.location.origin — works in dev and prod
    const socketUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

    const socket = socketIO(socketUrl, {
      // Default path /socket.io — same server, no proxy needed
      auth:                 { userId: user.id },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionDelay:    2000,
      reconnectionAttempts: 5,
      timeout:              8000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // ── Receive new message (update badge) ────────────────────────────────
    socket.on('message:new', (message) => {
      // Only increment if message is not from this user
      if (String(message.sender?._id || message.sender) !== String(user.id)) {
        setTotalUnread(prev => prev + 1);
      }
    });

    // ── Server pushes explicit unread count per conversation ─────────────
    socket.on('notification:unread', ({ conversationId, count }) => {
      // Re-fetch total to keep it accurate
      fetch('/api/messages/unread')
        .then(r => r.json())
        .then(data => { if (data.success) setTotalUnread(data.totalUnread); })
        .catch(() => {});
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, user?.id]);

  // ── Expose socket for child components (MessagesPage) ────────────────────
  const getSocket = useCallback(() => socketRef.current, []);

  // ── Decrement badge when user reads a conversation ────────────────────────
  const markConversationRead = useCallback(() => {
    fetch('/api/messages/unread')
      .then(r => r.json())
      .then(data => { if (data.success) setTotalUnread(data.totalUnread); })
      .catch(() => {});
  }, []);

  return (
    <NotificationContext.Provider value={{
      totalUnread,
      setTotalUnread,
      markConversationRead,
      getSocket,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
  return ctx;
}