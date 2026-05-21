import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { Store } from '@/models/Store'; // Adjust to match your export

// Simple in-memory cache to prevent DB lookups on every API request.
// Note: In serverless environments (like Vercel), this resets on cold starts.
const storeCache = new Map();

/**
 * Helper to securely extract the domain from the user_session cookie.
 */
async function getDomainFromCookie() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user_session')?.value;
    
    if (!sessionCookie) return null;

    // Decode the cookie string safely
    let decoded = decodeURIComponent(sessionCookie).replace(/^"|"$/g, '');
    if (decoded.startsWith('%7B')) {
      decoded = decodeURIComponent(decoded);
    }
    
    // Parse the JSON and return the domain instead of the user ID
    const parsedData = JSON.parse(decoded);
    return parsedData.domain || null;
  } catch (error) {
    console.error('[Cookie Context] Failed to parse session cookie:', error);
    return null;
  }
}

/**
 * Self-contained helper that gets the domain from the cookie,
 * checks the cache, and retrieves the Store ID from MongoDB if needed.
 */
export async function getStoreId() {
  // 1. Get domain completely from the server-side cookie context
  const domain = await getDomainFromCookie();
  
  if (!domain) {
    console.warn('[Cache] No domain found in current session cookie');
    return null;
  }

  // 2. Check the fast in-memory cache first using the extracted domain
  if (storeCache.has(domain)) {
    return storeCache.get(domain);
  }

  // 3. Cache Miss -> Connect to DB and query
  try {
    await connectToDatabase();
    
    // We only need the _id, so we use .select() and .lean() for maximum performance
    const store = await Store.findOne({ domain }).select('_id').lean();

    if (store) {
      const id = store._id.toString();
      // Store the result in cache for subsequent requests
      storeCache.set(domain, id);
      return id;
    }
    
    return null;
  } catch (error) {
    console.error(`[Cache] Error fetching store ID for domain ${domain}:`, error);
    return null;
  }
}

export function invalidateStoreCache(domain) {
  if (domain) {
    storeCache.delete(domain);
  } else {
    storeCache.clear();
  }
}