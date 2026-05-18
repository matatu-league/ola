import { NextResponse } from 'next/server';

export default function proxy(req) {
  const url = req.nextUrl.clone();
  
  // Get the hostname (e.g., 'gogo.ola.ug', 'random-store.ola.ug:3000')
  const hostname = req.headers.get('host') || '';
  
  // Strip out the port if you are testing locally (e.g., ola.ug:3000 -> ola.ug)
  const currentHost = hostname.split(':')[0];

  // --- DEBUGGING START ---
  console.log('\n[Proxy] --- Incoming Request ---');
  console.log('[Proxy] 1. Original Path:', url.pathname);
  console.log('[Proxy] 2. Full Host Header:', hostname);
  console.log('[Proxy] 3. Parsed Hostname:', currentHost);
  // --- DEBUGGING END ---

  // Check if it's a subdomain (not the main ola.ug domain)
  if (currentHost !== 'ola.ug' && currentHost !== 'www.ola.ug' && currentHost.endsWith('.ola.ug')) {
    
    // Extract just the subdomain part (e.g., 'gogo' or 'random-store')
    const subdomain = currentHost.replace('.ola.ug', '');
    
    console.log('[Proxy] 4. Subdomain Detected:', subdomain);
    
    // Rewrite the URL to point to our private _store folder
    url.pathname = `/stores/${subdomain}${url.pathname}`;
    
    console.log('[Proxy] 5. Rewriting Request to:', url.pathname);
    console.log('[Proxy] ------------------------\n');
    
    return NextResponse.rewrite(url);
  }

  console.log('[Proxy] 4. No subdomain detected. Proceeding normally.');
  console.log('[Proxy] ------------------------\n');
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal Next.js requests, static files, and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|fonts|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2|otf|ico)).*)',
  ],
};