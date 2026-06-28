// ─── AI provider abstraction ────────────────────────────────────────────────
//
// One switchable entry point for the long-form text generation that powers the
// AI store-template builder. The active provider is chosen entirely from the
// environment so we can move between Google Gemini and DeepSeek (v4) without
// touching application code:
//
//   NEXT_PUBLIC_AI_TEMPLATE_PROVIDER = 'gemini' | 'deepseek'   (default 'gemini')
//
// Gemini config:
//   NEXT_PUBLIC_GEMINI_API_KEY
//   NEXT_PUBLIC_AI_TEXT_MODEL        (default 'gemini-3.5-flash')
//   NEXT_PUBLIC_AI_TEXT_BASE_URL     (default Google Generative Language API)
//
// DeepSeek config (Anthropic-compatible Messages API — POST {base}/v1/messages):
//   NEXT_PUBLIC_DEEPSEEK_API_KEY
//   NEXT_PUBLIC_DEEPSEEK_MODEL       (default 'deepseek-chat' — points at the latest V-series)
//   NEXT_PUBLIC_DEEPSEEK_BASE_URL    (default 'https://api.deepseek.com/anthropic')
//   NEXT_PUBLIC_DEEPSEEK_VISION      ('true' to attach the logo as a base64 image
//                                     block — only enable for a vision-capable
//                                     model; DeepSeek's text-only chat models
//                                     reject images, so this defaults to false)
//
// Imagery for generated storefronts is sourced from Unsplash (never AI-painted)
// so every design is built from real, high-quality photography; see
// `searchUnsplashImage` / `unsplashSourceUrl` below.

import { fetchWithRetry } from '@/lib/ai';

// ─── Config ─────────────────────────────────────────────────────────────────
export const TEMPLATE_PROVIDER =
  (process.env.NEXT_PUBLIC_AI_TEMPLATE_PROVIDER || 'gemini').toLowerCase();

const GEMINI_KEY      = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL    = process.env.NEXT_PUBLIC_AI_TEXT_MODEL || 'gemini-3.5-flash';
const GEMINI_BASE     = process.env.NEXT_PUBLIC_AI_TEXT_BASE_URL
  || 'https://generativelanguage.googleapis.com/v1beta/models';

const DEEPSEEK_KEY    = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL  = process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_BASE   = (process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic')
  .replace(/\/$/, '');
const DEEPSEEK_VISION = String(process.env.NEXT_PUBLIC_DEEPSEEK_VISION || 'false').toLowerCase() === 'true';

// Resolve the Anthropic-compatible Messages endpoint regardless of how the base
// URL is configured. DeepSeek mounts the Anthropic API at /anthropic, so a bare
// `https://api.deepseek.com` base (a common .env value) would 404 on /v1/messages
// — append /anthropic for it. Also tolerate a base that already ends in /v1.
const deepseekMessagesUrl = () => {
  let base = DEEPSEEK_BASE;
  if (/(?:^|\/\/)[^/]*api\.deepseek\.com$/i.test(base)) base += '/anthropic';
  if (/\/v1$/.test(base)) return `${base}/messages`;
  return `${base}/v1/messages`;
};

const UNSPLASH_KEY    = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

// ─── Text generation ─────────────────────────────────────────────────────────

/**
 * Generate long-form text (the storefront JSX) from a prompt, optionally with
 * reference images (e.g. the brand logo as inline base64) so the model can draw
 * the palette/identity from them. Dispatches to the env-selected provider and
 * returns the RAW model text — callers clean/extract as needed.
 *
 * @param {string} prompt
 * @param {{ mimeType?: string, data: string }[]} [images] - inline base64 images
 * @returns {Promise<string>} raw text from the model
 */
export const generateTemplateText = async (prompt, images = []) => {
  if (TEMPLATE_PROVIDER === 'deepseek') return deepseekGenerate(prompt, images);
  return geminiGenerate(prompt, images);
};

const geminiGenerate = async (prompt, images) => {
  const parts = [{ text: prompt }];
  for (const img of images || []) {
    if (img?.data) parts.push({ inlineData: { mimeType: img.mimeType || 'image/png', data: img.data } });
  }

  const result = await fetchWithRetry(
    `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 1.0 } }),
    }
  );

  return result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const deepseekGenerate = async (prompt, images) => {
  // DeepSeek via its Anthropic-compatible Messages API (POST {base}/v1/messages).
  // The message content is a plain string for text-only models (DeepSeek's chat
  // models are text-only and REJECT image parts). Only when NEXT_PUBLIC_DEEPSEEK_VISION
  // is enabled (i.e. a vision-capable model is configured) do we attach the logo
  // as an Anthropic base64 image block.
  const attachImages = DEEPSEEK_VISION && Array.isArray(images) && images.some(i => i?.data);
  const content = attachImages
    ? [
        { type: 'text', text: prompt },
        ...images
          .filter(img => img?.data)
          .map(img => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mimeType || 'image/png', data: img.data },
          })),
      ]
    : prompt;

  const result = await fetchWithRetry(
    deepseekMessagesUrl(),
    {
      method:  'POST',
      headers: {
        'Content-Type':     'application/json',
        'x-api-key':        DEEPSEEK_KEY,
        Authorization:      `Bearer ${DEEPSEEK_KEY}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:       DEEPSEEK_MODEL,
        max_tokens:  8192,
        temperature: 1.0,
        messages:    [{ role: 'user', content }],
      }),
    }
  );

  // Anthropic Messages response: { content: [{ type:'text', text }, ...] }.
  if (Array.isArray(result?.content)) {
    return result.content.filter(b => b?.type === 'text').map(b => b.text).join('') || '';
  }
  // Fallback for an OpenAI-shaped response, just in case.
  return result?.choices?.[0]?.message?.content || '';
};

// ─── Unsplash imagery ─────────────────────────────────────────────────────────

/**
 * Deterministic Unsplash URL that needs no API key — handy as a prompt
 * instruction and as a fallback. Returns a stable photo for the given keywords.
 *
 * @param {string} query
 * @param {number} [w=1600]
 * @param {number} [h=900]
 * @returns {string}
 */
export const unsplashSourceUrl = (query, w = 1600, h = 900) =>
  `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query || 'business')}`;

/**
 * Resolve a real Unsplash photo URL for a search query. Uses the official API
 * when an access key is configured; otherwise falls back to the keyless source
 * URL. Never returns an AI-generated image — all storefront imagery is real
 * photography.
 *
 * @param {string} query
 * @param {'landscape'|'portrait'|'squarish'} [orientation='landscape']
 * @returns {Promise<string>}
 */
export const searchUnsplashImage = async (query, orientation = 'landscape') => {
  const q = (query || 'business').trim();
  if (!UNSPLASH_KEY) return unsplashSourceUrl(q);

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=${orientation}` +
      `&query=${encodeURIComponent(q)}&client_id=${UNSPLASH_KEY}`
    );
    if (!res.ok) return unsplashSourceUrl(q);
    const data  = await res.json();
    const photo = data?.results?.[0];
    return photo?.urls?.regular || photo?.urls?.full || unsplashSourceUrl(q);
  } catch {
    return unsplashSourceUrl(q);
  }
};
