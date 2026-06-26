// lib/cookies.js
// Shared cookie utilities used after login to write the user_session cookie.
// Reading is handled by UserContext on the client.

export function setWildcardCookie(name, value) {
  if (typeof window === 'undefined') return;
  const hostname  = window.location.hostname;
  const parts     = hostname.split('.');
  const root      = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  const domainStr = hostname.includes('.') ? `domain=.${root};` : '';
  document.cookie = `${name}=${value}; path=/; max-age=604800; ${domainStr} SameSite=Lax`;
}

export function clearCookie(name) {
  if (typeof window === 'undefined') return;
  const hostname  = window.location.hostname;
  const parts     = hostname.split('.');
  const root      = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  const domainStr = hostname.includes('.') ? `domain=.${root};` : '';
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; ${domainStr}`;
}