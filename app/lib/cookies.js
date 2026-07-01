// lib/cookies.js
// Cross-subdomain-aware cookie helpers for the client-read `user_session`.
// Reading is handled by UserContext on the client.
//
// ── Cross-subdomain SSO (login on ola.ug → app.ola.ug just works) ────────────
// The session cookie must be scoped to the REGISTRABLE domain (e.g. `.ola.ug`)
// so every *.ola.ug host shares it. In production set:
//
//   NEXT_PUBLIC_COOKIE_DOMAIN=.ola.ug
//
// …which forces that scope reliably regardless of the current host.
//
// ── Why the "re-login on every reload" happened ──────────────────────────────
// On localhost, raw IPs, and PUBLIC-SUFFIX preview hosts (*.vercel.app,
// *.ngrok-free.app, *.pages.dev, …) a wildcard `Domain=` cookie is REJECTED by
// the browser (you can't set a cookie for a public suffix), so the session was
// silently dropped and the user had to log in again after every reload. There
// we now fall back to a HOST-ONLY cookie, which persists correctly.

const PUBLIC_SUFFIXES = [
  'vercel.app', 'ngrok.io', 'ngrok-free.app', 'ngrok.app', 'ngrok.dev',
  'netlify.app', 'onrender.com', 'herokuapp.com', 'pages.dev', 'web.app',
  'firebaseapp.com', 'github.io', 'workers.dev', 'railway.app', 'fly.dev',
];

/**
 * The `domain=...; ` attribute to write — or '' for a host-only cookie.
 * Exported so every login path stays consistent.
 */
export function cookieDomainAttr() {
  if (typeof window === 'undefined') return '';

  // Explicit production override wins (e.g. ".ola.ug").
  const override = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (override) return `domain=${override.startsWith('.') ? override : '.' + override}; `;

  const host = window.location.hostname;
  // Host-only for localhost / bare hosts / IP addresses → reliable persistence.
  if (!host || host === 'localhost' || !host.includes('.') || /^[0-9.]+$/.test(host)) return '';

  const parts     = host.split('.');
  const lastTwo   = parts.slice(-2).join('.');
  const lastThree = parts.slice(-3).join('.');
  // Never set a cookie on a public suffix — the browser would reject it.
  if (PUBLIC_SUFFIXES.includes(lastTwo) || PUBLIC_SUFFIXES.includes(lastThree)) return '';

  // Registrable domain = last two labels (ola.ug, example.com, …).
  return `domain=.${lastTwo}; `;
}

export function setWildcardCookie(name, value, maxAge = 604800) {
  if (typeof window === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? ' Secure;' : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; ${cookieDomainAttr()}SameSite=Lax;${secure}`;
}

export function clearCookie(name) {
  if (typeof window === 'undefined') return;
  const expire = 'expires=Thu, 01 Jan 1970 00:00:01 GMT';
  // Clear BOTH the domain-scoped and the host-only variants so logout is total.
  document.cookie = `${name}=; path=/; ${expire}; ${cookieDomainAttr()}`;
  document.cookie = `${name}=; path=/; ${expire};`;
}
