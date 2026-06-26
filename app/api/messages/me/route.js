// app/api/messages/me/route.js
// Returns conversations for the logged-in user.
// Optional: ?storeId=xxx to filter conversations related to a specific store.

import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation } from '@/models/Message';

// Register User model so .populate('participants') resolves
import '@/models/User';

async function getUserId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('user_session')?.value;
  if (!raw) return null;
  try {
    let decoded = decodeURIComponent(raw).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    const user = JSON.parse(decoded);
    // Support both id shapes
    return user.id || user._id || user.userId || null;
  } catch (err) {
    console.error('[getUserId] parse error:', err);
    return null;
  }
}

export async function GET(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId'); // optional store filter

    const query = {
      participants: userId,
      isActive:     true,
      deletedFor:   { $ne: userId },
    };

    // If storeId provided, filter conversations related to that store
    if (storeId) {
      query.relatedStore = storeId;
    }

    // Only populate participants — product/order refs are encoded in
    // individual message text prefixes ([Product:...] / [Order:...]),
    // NOT on the conversation document
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .populate('participants', 'name avatar email')
      .lean();

    const userIdStr = String(userId);
    const result = conversations.map(conv => {
      // Resolve unread count — Mongoose Map becomes plain object after .lean()
      let myUnread = 0;
      if (conv.unreadCounts) {
        myUnread = conv.unreadCounts[userIdStr] ||
                   conv.unreadCounts[userId]    ||
                   Object.entries(conv.unreadCounts).find(([k]) => String(k) === userIdStr)?.[1] ||
                   0;
      }

      // Find the other participant
      const otherParticipant = conv.participants?.find(p =>
        p && String(p._id) !== userIdStr
      ) || null;

      return {
        ...conv,
        myUnread,
        otherParticipant,
      };
    });

    const totalUnread = result.reduce((sum, c) => sum + c.myUnread, 0);

    return NextResponse.json({ success: true, data: result, totalUnread });

  } catch (err) {
    console.error('[GET /api/messages/me]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
