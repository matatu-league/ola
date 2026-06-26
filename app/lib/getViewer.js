// lib/getViewer.js
import { cookies } from 'next/headers';

/**
 * Reads the logged-in user's id from the `user_session` cookie.
 * The cookie holds a JSON object like { id, ... }, sometimes double
 * URL-encoded and/or wrapped in quotes — we normalize both cases.
 */
async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session')?.value;
  if (!sessionCookie) return null;

  try {
    let decoded = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
    return JSON.parse(decoded).id ?? null;
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
    return null;
  }
}

/**
 * Resolves who is looking at a page.
 *  - userId:    set when the request is authenticated
 *  - sessionId: anonymous fallback (same cookie your cart uses)
 */
export async function getViewer() {
  const userId = await getUserId();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value ?? null;

  return { userId, sessionId };
}