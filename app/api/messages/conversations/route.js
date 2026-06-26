// app/api/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation } from '@/models/Message';

// Register models referenced by .populate() — without these you get
// "Schema hasn't been registered for model 'User'/'Product'"
import '@/models/User';
import '@/models/Marketplace';
import mongoose from 'mongoose';

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

// ── GET /api/messages/conversations ──────────────────────────────────────────
// Returns all conversations for the logged-in user, sorted by latest message.
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const conversations = await Conversation.find({
      participants: userId,
      isActive:     true,
      deletedFor:   { $ne: userId },
    })
    .sort({ updatedAt: -1 })
    .populate('participants',    'name avatar email')
    .populate('relatedProduct',  'title images')
    .populate('relatedOrder',    'orderNumber totalAmount')
    .lean();

    // Attach unread count for THIS user
    const withUnread = conversations.map(conv => ({
      ...conv,
      myUnread: conv.unreadCounts?.[userId] || 0,
      // The other participant (for 1-to-1 chats)
      otherParticipant: conv.participants.find(p => String(p._id) !== userId),
    }));

    return NextResponse.json({ success: true, data: withUnread });

  } catch (err) {
    console.error('[GET /api/messages/conversations]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST /api/messages/conversations ─────────────────────────────────────────
// Start or get existing conversation with another user.
// Body: { recipientId, relatedProductId?, relatedOrderId? }
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const { recipientId, relatedProductId, relatedOrderId, relatedStoreId } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ success: false, message: 'recipientId is required' }, { status: 400 });
    }
    if (recipientId === userId) {
      return NextResponse.json({ success: false, message: 'Cannot message yourself' }, { status: 400 });
    }

    // Conversations are buyer ↔ store (NOT per-product or per-order).
    // One conversation per pair of participants. Product/order references
    // are attached at the MESSAGE level via [Product: ...] / [Order: ...]
    // prefixes — not as conversation scoping.
    const matchQuery = {
      participants: { $all: [userId, recipientId], $size: 2 },
      isActive: true,
    };

    let conversation = await Conversation.findOne(matchQuery)
      .populate('participants', 'name avatar email');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        // Only relatedStore stays on the conversation (for store-dashboard filtering).
        // Product and order references are message-level via text prefixes.
        relatedStore: relatedStoreId || null,
        unreadCounts: { [userId]: 0, [recipientId]: 0 },
      });
      await conversation.populate('participants', 'name avatar email');
    }

    return NextResponse.json({ success: true, data: conversation }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/messages/conversations]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}