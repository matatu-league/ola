// app/api/messages/unread/route.js
// Returns total unread message count for the logged-in user.
// Called on app load to initialise the notification badge.

import { NextResponse } from 'next/server';
import { cookies }      from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Conversation } from '@/models/Message';

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

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: true, totalUnread: 0 });

    await connectToDatabase();

    const conversations = await Conversation.find({
      participants: userId,
      isActive:     true,
    }).select('unreadCounts').lean();

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCounts?.[userId] || 0);
    }, 0);

    return NextResponse.json({ success: true, totalUnread });

  } catch (err) {
    console.error('[GET /api/messages/unread]', err);
    return NextResponse.json({ success: true, totalUnread: 0 });
  }
}
