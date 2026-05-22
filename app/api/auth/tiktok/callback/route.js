import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User'; 
import Store from '@/models/Store'; 

const TIKTOK_CLIENT_KEY = 'sbawx7ufskuzcslm8j';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '0AmPhoUVIk2mvXKm6buK0H9e1C3Ryy4W';

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ola.ug';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const safeRedirect = (path) => NextResponse.redirect(`${APP_URL}${path}`);

  if (error) return safeRedirect(`/?error=${error}`);

  const codeVerifier = request.cookies.get('tiktok_code_verifier')?.value;
  const storedState = request.cookies.get('tiktok_auth_state')?.value;

  if (!state || state !== storedState) return safeRedirect('/?error=state_mismatch');
  if (!code || !codeVerifier) return safeRedirect('/?error=missing_data');

  const redirectUri = `${APP_URL}/api/auth/tiktok/callback`;

  try {
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) return safeRedirect('/?error=token_exchange_failed');

    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,profile_web_link,profile_deep_link,bio_description,is_verified', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    const userData = await userResponse.json();
    const tiktokUser = userData?.data?.user;
    
    let dbUserId = tiktokUser?.open_id; 
    let userHasStore = false; 
    let activePhoneNumber = null;

    try {
      if (typeof connectToDatabase === 'function') await connectToDatabase();

      // 1. SAVE/UPDATE USER
      let dbUser = await User.findOne({ tiktokId: tiktokUser.open_id });

      if (!dbUser) {
        dbUser = await User.create({
          tiktokId: tiktokUser.open_id,
          unionId: tiktokUser.union_id,
          displayName: tiktokUser.display_name,
          avatarUrl: tiktokUser.avatar_url,
          phoneNumber: '', // 🔴 Empty string for new users
          profileWebLink: tiktokUser.profile_web_link,
          profileDeepLink: tiktokUser.profile_deep_link,
          bioDescription: tiktokUser.bio_description,
          isVerified: tiktokUser.is_verified,
          authProviders: ['tiktok'],
          role: 'seller', 
          status: 'active'
        });
      } else {
        dbUser.displayName = tiktokUser.display_name;
        dbUser.avatarUrl = tiktokUser.avatar_url;
        await dbUser.save();
        activePhoneNumber = dbUser.phoneNumber;
      }
      
      dbUserId = dbUser._id.toString();

      // 2. CHECK IF USER ALREADY HAS A STORE
      const existingStore = await Store.findOne({ userId: dbUserId });
      if (existingStore) {
        userHasStore = true;
      }

    } catch (dbError) {
      console.error('⚠️ Database Error:', dbError);
    }
    
    // 3. DYNAMIC REDIRECT
    const destinationPath = userHasStore ? '/seller/dashboard' : '/stores/onboarding';
    const response = safeRedirect(destinationPath);

    // Clean up temporary OAuth cookies
    response.cookies.delete('tiktok_code_verifier');
    response.cookies.delete('tiktok_auth_state');

    // 4. BUILD SESSION
    const sessionData = {
      id: dbUserId, 
      tiktokId: tiktokUser?.open_id,
      name: tiktokUser?.display_name || 'TikTok Seller',
      avatar: tiktokUser?.avatar_url || '',
      phoneNumber: activePhoneNumber || null, // 🔴 Include from DB
      hasStore: userHasStore
    };

    response.cookies.set('user_session', encodeURIComponent(JSON.stringify(sessionData)), {
      path: '/',
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 
    });

    return response;

  } catch (err) {
    return safeRedirect('/?error=server_auth_error');
  }
}