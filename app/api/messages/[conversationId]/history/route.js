// app/api/messages/[conversationId]/history/route.js
// Returns paginated message history for a conversation.
// Uses cookie auth — no userId in URL.

import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Message, Conversation } from '@/models/Message';

// Register User model so .populate('sender') resolves
import '@/models/User';

async function getUserId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('user_session')?.value;
  if (!raw) return null;
  try {
    let decoded = decodeURIComponent(raw).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    const user = JSON.parse(decoded);
    return user.id || user._id || user.userId || null;
  } catch { return null; }
}

export async function GET(request, { params }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { conversationId } = await params;
    const { searchParams }   = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '30'));
    const page  = Math.max(1,   parseInt(searchParams.get('page')  || '1'));
    const skip  = (page - 1) * limit;

    // Verify user is a participant
    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) {
      return NextResponse.json({ success: false, message: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conv.participants.map(String).includes(String(userId));
    if (!isParticipant) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Just text + sender — references are encoded inside the text
    const [messages, total] = await Promise.all([
      Message.find({
        conversation: conversationId,
        deletedFor:   { $ne: userId },
        deletedAt:    null,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .lean(),

      Message.countDocuments({ conversation: conversationId, deletedAt: null }),
    ]);

    // Mark as read — fire and forget
    Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, 'readBy.user': { $ne: userId } },
      { $push: { readBy: { user: userId, readAt: new Date() } } }
    ).exec();

    Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    }).exec();

    return NextResponse.json({
      success: true,
      data:    messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });

  } catch (err) {
    console.error('[GET /api/messages/:id/history]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}