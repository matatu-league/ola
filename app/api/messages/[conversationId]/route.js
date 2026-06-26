// app/api/messages/[conversationId]/route.js
import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Message, Conversation } from '@/models/Message';

// Register models referenced by .populate() — without these you get
// "Schema hasn't been registered for model 'User'/'Product'"
import '@/models/User';
import '@/models/Marketplace';

async function getUserId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('user_session')?.value;
  if (!raw) return null;
  try {
    let decoded = decodeURIComponent(raw).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    return JSON.parse(decoded).id;
  } catch { return null; }
}

// ── GET /api/messages/[conversationId] ───────────────────────────────────────
// Returns paginated message history for a conversation.
export async function GET(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const { conversationId } = await params;
    const { searchParams }   = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '30'));
    const skip  = (page - 1) * limit;

    // Verify participant
    const conv = await Conversation.findById(conversationId);
    if (!conv) return NextResponse.json({ success: false, message: 'Conversation not found' }, { status: 404 });

    const isParticipant = conv.participants.map(String).includes(String(userId));
    if (!isParticipant) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const [messages, total] = await Promise.all([
      Message.find({
        conversation: conversationId,
        deletedFor:   { $ne: userId },
        deletedAt:    null,
      })
      .sort({ createdAt: -1 }) // newest first, reverse on client
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .lean(),

      Message.countDocuments({ conversation: conversationId, deletedAt: null }),
    ]);

    // Mark messages as read for this user (fire-and-forget)
    Message.updateMany(
      {
        conversation:   conversationId,
        sender:         { $ne: userId },
        'readBy.user':  { $ne: userId },
      },
      { $push: { readBy: { user: userId, readAt: new Date() } } }
    ).exec();

    // Reset unread count
    Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    }).exec();

    return NextResponse.json({
      success: true,
      data:    messages.reverse(), // return oldest-first
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });

  } catch (err) {
    console.error('[GET /api/messages/:id]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST /api/messages/[conversationId] ──────────────────────────────────────
// HTTP fallback for sending a message (used when WebSocket is unavailable).
export async function POST(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const { conversationId } = await params;
    const { text, type = 'text', fileUrl, fileName } = await request.json();

    if (!text && !fileUrl) {
      return NextResponse.json({ success: false, message: 'Message content required' }, { status: 400 });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const isParticipant = conv.participants.map(String).includes(String(userId));
    if (!isParticipant) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const message = await Message.create({
      conversation: conversationId,
      sender:       userId,
      type,
      text:         text     || '',
      fileUrl:      fileUrl  || null,
      fileName:     fileName || null,
      readBy:       [{ user: userId, readAt: new Date() }],
    });

    await message.populate('sender', 'name avatar');

    // Update conversation
    const otherParticipants = conv.participants.map(String).filter(id => id !== String(userId));
    const unreadUpdate = {};
    for (const pid of otherParticipants) {
      unreadUpdate[`unreadCounts.${pid}`] = (conv.unreadCounts.get(pid) || 0) + 1;
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: { text: text || `[${type}]`, senderId: userId, sentAt: new Date(), type },
        ...unreadUpdate,
      },
    });

    // Note: real-time socket emit happens via server.mjs when WebSocket
    // is connected. This HTTP route is only used as a fallback when WS
    // isn't available, so we just persist and return — recipient will
    // pick up the message on next history fetch or socket reconnect.

    return NextResponse.json({ success: true, data: message }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/messages/:id]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
