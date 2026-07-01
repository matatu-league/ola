// server.js — project root
// Single process: Next.js + Socket.io on the same port (3000)

import { createServer } from 'http';
import { parse }        from 'url';
import next             from 'next';
import { Server }       from 'socket.io';
import mongoose         from 'mongoose';
import * as dotenv      from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI =
  process.env.MONGODB_URI    ||
  process.env.MONGO_URI      ||
  process.env.DATABASE_URL   ||
  process.env.MONGODB_URL    ||
  process.env.MATATU_DB_URI;

if (!MONGODB_URI) {
  console.error('❌ MongoDB URI not found in .env.local');
  process.exit(1);
}

const dev  = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log('[Server] MongoDB connected');
}

// ── Inline models — text-only, no per-message refs ───────────────────────────
const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['text','image','file','video','system'], default: 'text' },
  text:         { type: String, default: '' },  // includes [Product:...] / [Order:...] prefix if attached
  fileUrl:      { type: String, default: null },
  fileName:     { type: String, default: null },
  readBy: [{
    user:   { type: mongoose.Schema.Types.ObjectId },
    readAt: { type: Date },
  }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId }],
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: {
    text:     { type: String, default: '' },
    senderId: { type: mongoose.Schema.Types.ObjectId },
    sentAt:   { type: Date,   default: null },
    type:     { type: String, default: 'text' },
  },
  unreadCounts: { type: Map, of: Number, default: {} },
  relatedStore: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  deletedFor:   [{ type: mongoose.Schema.Types.ObjectId }],
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

const Message      = mongoose.models.Message      || mongoose.model('Message',      MessageSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);

// Strip reference prefix for lastMessage preview text — keep inbox clean
function stripRefPrefix(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/^\[Product:\s*[^\]]+\](?:\n)?/, '')
    .replace(/^\[Order:\s*[^\]]+\](?:\n)?/, '')
    .trim();
}

const app    = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {

  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow localhost/127.0.0.1 and ola.ug + any subdomain, WITH an
        // optional port — dev runs subdomains like store.ola.ug:3000, whose
        // origin ("http://store.ola.ug:3000") must still be accepted (the old
        // `\.ola\.ug$` pattern rejected anything with a :port, breaking chat).
        const allowed =
          !origin ||
          /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
          /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
          /^https?:\/\/([a-z0-9-]+\.)*ola\.ug(:\d+)?$/i.test(origin);
        callback(allowed ? null : new Error('Not allowed'), allowed);
      },
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  20000,
    pingInterval: 10000,
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return next(new Error('Authentication required'));
    socket.userId = userId;
    next();
  });

  const onlineUsers = new Map();

  // ── Live presence for /admin/monitoring ─────────────────────────────────────
  // userId -> { userId, name, avatar, role, page, country, countryCode, ip,
  //             connectedAt, lastActive, sockets }
  const presence = new Map();

  const serializePresence = (e) => ({
    userId: e.userId, name: e.name, avatar: e.avatar, role: e.role,
    page: e.page, country: e.country, countryCode: e.countryCode,
    connectedAt: e.connectedAt, lastActive: e.lastActive,
  });
  const emitPresence = (e) => { try { io.to('admins').emit('admin:presence:update', serializePresence(e)); } catch (_) {} };

  // Profile lookup via the raw users collection (server.js has no @/ alias).
  const getUserProfile = async (uid) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(uid)) return {};
      const u = await mongoose.connection.db.collection('users').findOne(
        { _id: new mongoose.Types.ObjectId(uid) },
        { projection: { displayName: 1, name: 1, avatarUrl: 1, avatar: 1, role: 1 } },
      );
      return u || {};
    } catch { return {}; }
  };

  // Best-effort geo (only when no CDN country header + public IP). Never blocks.
  const lookupCountry = async (ip) => {
    if (!ip || /^(::1|::ffff:127\.|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) return null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,country`, { signal: ctrl.signal });
      clearTimeout(t);
      const j = await res.json();
      if (j && j.status === 'success') return { countryCode: j.countryCode, country: j.country };
    } catch (_) {}
    return null;
  };

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] Connected: ${userId}`);

    await connectDB();

    socket.join(`user:${userId}`);

    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    socket.broadcast.emit('user:online', { userId });

    // ── Presence enrichment (admin monitoring) ──
    try {
      const h        = socket.handshake.headers || {};
      const xff      = String(h['x-forwarded-for'] || '').split(',')[0].trim();
      const ip       = xff || socket.handshake.address || '';
      const hdrCC    = String(h['cf-ipcountry'] || h['x-vercel-ip-country'] || h['x-country-code'] || '').toUpperCase();
      const authPage = socket.handshake.auth?.page;

      let entry = presence.get(userId);
      if (!entry) {
        const prof = await getUserProfile(userId);
        entry = {
          userId,
          name:        prof.displayName || prof.name || 'User',
          avatar:      prof.avatarUrl || prof.avatar || '',
          role:        prof.role || 'buyer',
          page:        typeof authPage === 'string' ? authPage : '/',
          country:     null,
          countryCode: (hdrCC && hdrCC.length === 2 && hdrCC !== 'XX') ? hdrCC : null,
          ip,
          connectedAt: new Date().toISOString(),
          lastActive:  new Date().toISOString(),
          sockets:     0,
        };
        presence.set(userId, entry);
        if (!entry.countryCode) {
          lookupCountry(ip).then((geo) => {
            const cur = presence.get(userId);
            if (geo && cur) { cur.countryCode = geo.countryCode; cur.country = geo.country; emitPresence(cur); }
          });
        }
      }
      entry.sockets   += 1;
      entry.lastActive = new Date().toISOString();
      emitPresence(entry);
    } catch (e) { console.error('[presence connect]', e); }

    socket.on('presence:check', ({ userId: targetId }) => {
      socket.emit('presence:status', {
        userId: targetId,
        online: (onlineUsers.get(String(targetId)) || 0) > 0,
      });
    });

    // ── Admin monitoring: report current page + subscribe to the live feed ──
    socket.on('presence:page', ({ page } = {}) => {
      try {
        const entry = presence.get(userId);
        if (entry) {
          entry.page       = (typeof page === 'string' ? page : '/').slice(0, 200);
          entry.lastActive = new Date().toISOString();
          emitPresence(entry);
        }
      } catch (_) {}
    });

    socket.on('admin:presence:subscribe', async () => {
      try {
        const prof = await getUserProfile(userId);
        if (prof.role !== 'admin') return; // gate: only admins get the feed
        socket.join('admins');
        socket.emit('admin:presence:snapshot', Array.from(presence.values()).map(serializePresence));
      } catch (e) { console.error('[presence subscribe]', e); }
    });
    socket.on('admin:presence:unsubscribe', () => { try { socket.leave('admins'); } catch (_) {} });

    socket.on('join:conversation',  (id) => socket.join(`conv:${id}`));
    socket.on('leave:conversation', (id) => socket.leave(`conv:${id}`));

    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, text, type = 'text', fileUrl, fileName } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return callback?.({ error: 'Conversation not found' });

        const isParticipant = conversation.participants.map(String).includes(String(userId));
        if (!isParticipant) return callback?.({ error: 'Not a participant' });

        const message = await Message.create({
          conversation: conversationId,
          sender:       userId,
          type,
          text:         text     || '',  // ← may include [Product:...|pid|img] / [Order:...|oid|total|status|imgs] prefix
          fileUrl:      fileUrl  || null,
          fileName:     fileName || null,
          readBy:       [{ user: userId, readAt: new Date() }],
        });

        await message.populate('sender', 'name avatar');

        const others = conversation.participants.map(String).filter(id => id !== String(userId));
        const unreadUpdate = {};
        for (const pid of others) {
          unreadUpdate[`unreadCounts.${pid}`] = (conversation.unreadCounts?.get(pid) || 0) + 1;
        }

        // Inbox preview uses cleaned text (no prefix noise)
        const previewText = stripRefPrefix(text) || `[${type}]`;

        await Conversation.findByIdAndUpdate(conversationId, {
          $set: {
            lastMessage: { text: previewText, senderId: userId, sentAt: new Date(), type },
            ...unreadUpdate,
          },
        });

        socket.to(`conv:${conversationId}`).emit('message:new', message);

        for (const pid of others) {
          io.to(`user:${pid}`).emit('message:new', message);
          io.to(`user:${pid}`).emit('notification:unread', {
            conversationId,
            count: (conversation.unreadCounts?.get(pid) || 0) + 1,
          });
        }

        callback?.({ success: true, message });

      } catch (err) {
        console.error('[Socket message:send]', err);
        callback?.({ error: err.message });
      }
    });

    socket.on('message:read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, 'readBy.user': { $ne: userId } },
          { $push: { readBy: { user: userId, readAt: new Date() } } }
        );
        await Conversation.findByIdAndUpdate(conversationId, {
          $set: { [`unreadCounts.${userId}`]: 0 },
        });
        io.to(`conv:${conversationId}`).emit('message:read', { conversationId, readBy: userId });
        socket.emit('notification:unread', { conversationId, count: 0 });
      } catch (err) {
        console.error('[Socket message:read]', err);
      }
    });

    socket.on('typing:start', ({ conversationId, text }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', { userId, conversationId, text });
    });
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { userId, conversationId });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${userId}`);
      const count = (onlineUsers.get(userId) || 1) - 1;
      if (count <= 0) {
        onlineUsers.delete(userId);
        io.emit('user:offline', { userId });
      } else {
        onlineUsers.set(userId, count);
      }

      // ── Presence (admin monitoring) ──
      try {
        const entry = presence.get(userId);
        if (entry) {
          entry.sockets -= 1;
          if (entry.sockets <= 0) {
            presence.delete(userId);
            io.to('admins').emit('admin:presence:offline', { userId });
          } else {
            entry.lastActive = new Date().toISOString();
            emitPresence(entry);
          }
        }
      } catch (_) {}
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? 'development' : 'production'}]`);
    console.log(`> Socket.io attached on same port`);
  });
});