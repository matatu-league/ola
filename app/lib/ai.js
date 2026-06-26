// ─── Config ───────────────────────────────────────────────────────────────────
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const grokApiKey   = process.env.NEXT_PUBLIC_GROK_API_KEY   || '';

const TEXT_MODEL_ID     = 'gemini-2.5-flash';
const TTS_MODEL_ID      = 'gemini-3.1-flash-tts-preview';
const IMAGE_MODEL_ID    = 'grok-imagine-image-quality';
const CUSTOM_IMAGE_API  = 'http://localhost:5000/api/create-image';

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Fetch with exponential-backoff retry.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} [retries=5]
 * @returns {Promise<any>} Parsed JSON body.
 */
export const fetchWithRetry = async (url, options, retries = 5) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res.json();
      if (i === retries) throw new Error(`API Error: ${res.status}`);
    } catch (err) {
      if (i === retries) throw err;
    }
    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
  }
};

/**
 * Read a File/Blob as a raw base64 string (no data-URL prefix).
 *
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

/**
 * Extract raw base64 from a URL (handles CORS via proxy fallbacks).
 *
 * @param {string}  url
 * @param {object}  [cache={}] - Mutable { [url]: base64 } cache object.
 * @returns {Promise<string|null>}
 */
export const extractBase64FromUrl = async (url, cache = {}) => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url.split(',')[1];
  if (cache[url]) return cache[url];

  const tryFetch = async (src) => {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (!blob.type.startsWith('image/'))
      throw new Error(`Unexpected content-type: ${blob.type}`);
    return fileToBase64(blob);
  };

  const proxies = [
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const src of proxies) {
    try { return await tryFetch(src); } catch { /* try next */ }
  }

  console.error('extractBase64FromUrl: all proxies failed for', url);
  return null;
};

/**
 * Convert a data-URL (or remote URL) to a File object.
 *
 * @param {string} dataUrl
 * @param {string} filename
 * @returns {Promise<File>}
 */
export const convertDataUrlToFile = async (dataUrl, filename) => {
  try {
    const res  = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png', lastModified: Date.now() });
  } catch {
    // Fallback: manual decode
    const [header, b64] = dataUrl.split(',');
    const mime  = header.match(/:(.*?);/)[1];
    const raw   = atob(b64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return new File([bytes], filename, { type: mime, lastModified: Date.now() });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Robustly extract a JSON value from a Gemini API response.
 * Handles markdown fences, conversational preamble, and blocked responses.
 *
 * @param {object} apiResult - Raw API response object.
 * @returns {any}            - Parsed JSON value.
 */
const safeExtractJSON = (apiResult) => {
  const text = apiResult?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('AI returned empty/blocked response:', apiResult);
    throw new Error('Empty or blocked response from AI.');
  }

  try {
    const match       = text.match(/[\{\[][\s\S]*[\}\]]/);
    const cleanString = match
      ? match[0]
      : text.replace(/```(?:json)?\n?/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleanString);
  } catch {
    console.error('Failed to parse AI JSON. Raw output:', text);
    throw new Error('AI returned a malformed response.');
  }
};

/** Build a background prompt fragment from a preference string. */
const bgPromptFor = (pref) => {
  if (pref === 'original')    return 'Maintain the original background, lighting, and environment exactly as it is.';
  if (pref === 'black')       return 'Use a sleek black studio background.';
  if (pref === 'light_grey')  return 'Use a seamless light grey studio background.';
  return 'Use a clean white background, keeping natural ground shadows for realism.';
};

// ─── Gemini: Image Analysis ───────────────────────────────────────────────────

/**
 * Analyse a product image with Gemini and return structured data.
 *
 * @param {string}   base64Data   - Raw base64 image string (no prefix).
 * @param {string}   mimeType     - Image MIME type (e.g. 'image/jpeg').
 * @param {object[]} dbCategories - Array of { _id, name } category objects.
 * @returns {Promise<{title,description,tags,category_id,attributes,recommended_views}>}
 */
export const runGeminiImageAnalysis = async (base64Data, mimeType, dbCategories) => {
  const categoryContext = dbCategories.length > 0
    ? `From this list: [${dbCategories.map(c => `[ID: ${c._id}] ${c.name}`).join(', ')}], select exactly one Category ID.`
    : 'Return an empty string for category_id.';

  const prompt = `Analyze this product image and provide:
1. A professional e-commerce title.
2. A 2-paragraph description.
3. A comma-separated string of 5 SEO keywords for tags.
4. ${categoryContext}
5. Suggest 3–5 technical product specifications as key-value pairs.
6. Provide exactly 3 short descriptions (under 5 words each) of logical additional camera angles for THIS specific product type.
IMPORTANT: Return ONLY a raw, valid JSON object.`;

  const result = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title:             { type: 'STRING' },
              description:       { type: 'STRING' },
              tags:              { type: 'STRING' },
              category_id:       { type: 'STRING' },
              attributes:        { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, value: { type: 'STRING' } } } },
              recommended_views: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
        },
      }),
    }
  );

  return safeExtractJSON(result);
};

// ─── Gemini: Text Suggestions ─────────────────────────────────────────────────

/**
 * Suggest store subcategories for a given global category name.
 *
 * @param {string} globalCatName
 * @returns {Promise<string[]>}
 */
export const suggestStoreCategoriesAI = async (globalCatName) => {
  const prompt = `A merchant is listing a product in the global category "${globalCatName}". Suggest 3 short, logical custom "Store Subcategories". Return ONLY a raw JSON array of strings.`;

  const result = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  return safeExtractJSON(result);
};

/**
 * Suggest product variant options for a given variant type.
 *
 * @param {string} productTitle
 * @param {string} variantType  - e.g. 'Color', 'Size', 'Material'.
 * @returns {Promise<string[]>}
 */
export const suggestVariantsAIList = async (productTitle, variantType) => {
  const prompt = `Based on "${productTitle}", suggest 3 logical "${variantType}" options. Return a raw JSON array of strings.`;

  const result = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
        },
      }),
    }
  );

  return safeExtractJSON(result);
};

// ─── Image Generation / Editing ───────────────────────────────────────────────

/**
 * Generate or edit a product image via Custom API or Grok.
 *
 * @param {string} originalBase64 - Source image as raw base64.
 * @param {string} prompt         - Editing instruction.
 * @param {{aspectRatio:string, backgroundPreference:string, imageType:string}} params
 * @param {'custom'|'grok'} imageGenModel
 * @returns {Promise<string>} - Data URL or remote URL of the generated image.
 */
export const runImageGeneration = async (originalBase64, prompt, params, imageGenModel) => {
  if (imageGenModel === 'custom') {
    const payload = {
      prompt,
      imageParams: params,
      generateImage: true // Explicitly tell the backend an image is requested
    };

    // 1 & 2: Only attach if an image is provided, and prevent double data-URL prefixes
    if (originalBase64 && originalBase64.trim() !== '') {
      payload.imageBase64 = originalBase64.startsWith('data:') 
        ? originalBase64 
        : `data:image/jpeg;base64,${originalBase64}`;
    }

    const result = await fetchWithRetry(CUSTOM_IMAGE_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    // 3: Handle both custom backend mapped formats (result.image) and native gemini-browser array (result.images)
    if (result?.success) {
      if (result.image) return result.image;
      if (result.images && result.images.length > 0) return result.images[0];
    }
    throw new Error('Custom Image API returned no image.');
  }

  // Grok
  const grokPayload = {
    model:           IMAGE_MODEL_ID,
    prompt,
    n:               1,
    response_format: 'b64_json',
  };

  if (originalBase64 && originalBase64.trim() !== '') {
     const cleanBase64 = originalBase64.startsWith('data:') ? originalBase64.split(',')[1] : originalBase64;
     grokPayload.image = { url: `data:image/jpeg;base64,${cleanBase64}` };
  }

  // Fallback to generations endpoint if no source image is provided for Grok edits
  const grokEndpoint = (originalBase64 && originalBase64.trim() !== '') 
    ? 'https://api.x.ai/v1/images/edits' 
    : 'https://api.x.ai/v1/images/generations';

  const result = await fetchWithRetry(grokEndpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
    body:    JSON.stringify(grokPayload),
  });

  if (result?.data?.[0]?.b64_json) return `data:image/png;base64,${result.data[0].b64_json}`;
  if (result?.data?.[0]?.url)      return result.data[0].url;
  throw new Error('Grok Image API returned no image.');
};

/**
 * Build a prompt for a specific camera angle / view variant.
 *
 * @param {string} viewDescription          - e.g. "left side view".
 * @param {string} backgroundPreference     - 'white' | 'black' | 'light_grey' | 'original'.
 * @param {string} [aspectRatio='1:1']
 * @returns {string}
 */
export const buildAnglePrompt = (viewDescription, backgroundPreference, aspectRatio = '1:1') => {
  const bgPart     = bgPromptFor(backgroundPreference);
  const aspectPart = aspectRatio !== '1:1' ? ` Ensure the final image strictly has a ${aspectRatio} aspect ratio.` : '';
  return `Modify the product in the image to show exactly this view: "${viewDescription}". Ensure the product can be viewed clearly as requested. ${bgPart}${aspectPart} Keep the exact same product design, branding, color, and texture.`;
};

/**
 * Build a prompt for a product variant (colour / size / material change).
 *
 * @param {string} variantType              - e.g. 'Color'.
 * @param {string} variantName              - e.g. 'Midnight Blue'.
 * @param {string} backgroundPreference
 * @param {string} [aspectRatio='1:1']
 * @returns {string}
 */
export const buildVariantPrompt = (variantType, variantName, backgroundPreference, aspectRatio = '1:1') => {
  const bgPart     = bgPromptFor(backgroundPreference);
  const aspectPart = aspectRatio !== '1:1' ? ` Ensure the final image strictly has a ${aspectRatio} aspect ratio.` : '';
  return `Modify the product in the image to be the ${variantType}: "${variantName}". ${bgPart}${aspectPart} Maintain the overall design.`;
};

// ─── Gemini: Text-to-Speech ───────────────────────────────────────────────────

/**
 * Generate a WAV audio Blob from descriptive text using Gemini TTS.
 *
 * @param {string} text - Product description / ad copy to vocalise.
 * @returns {Promise<Blob>} - audio/wav Blob ready to upload or play.
 */
export const runGeminiTTS = async (text) => {
  const result = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL_ID}:generateContent?key=${geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents: [{ parts: [{ text: `Read enthusiastically: ${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      }),
    }
  );

  const binary = atob(result.candidates[0].content.parts[0].inlineData.data);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Build a minimal WAV header (PCM 16-bit mono 24 kHz)
  const header = new ArrayBuffer(44);
  const view   = new DataView(header);
  const ws     = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };

  ws(0,  'RIFF'); view.setUint32(4,  36 + bytes.length, true);
  ws(8,  'WAVE'); ws(12, 'fmt ');
  view.setUint32(16, 16,     true);   // chunk size
  view.setUint16(20, 1,      true);   // PCM
  view.setUint16(22, 1,      true);   // mono
  view.setUint32(24, 24000,  true);   // sample rate
  view.setUint32(28, 48000,  true);   // byte rate
  view.setUint16(32, 2,      true);   // block align
  view.setUint16(34, 16,     true);   // bits per sample
  ws(36, 'data'); view.setUint32(40, bytes.length, true);

  return new Blob([header, bytes], { type: 'audio/wav' });
};
