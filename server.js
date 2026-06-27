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

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`[Socket] Connected: ${userId}`);

    await connectDB();

    socket.join(`user:${userId}`);

    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    socket.broadcast.emit('user:online', { userId });

    socket.on('presence:check', ({ userId: targetId }) => {
      socket.emit('presence:status', {
        userId: targetId,
        online: (onlineUsers.get(String(targetId)) || 0) > 0,
      });
    });

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
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? 'development' : 'production'}]`);
    console.log(`> Socket.io attached on same port`);
  });
});