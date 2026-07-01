// ─── Client-side image optimisation (resize + compress before upload) ────────
//
// Vendors upload logos straight from their phones/desktops — often multi-MB,
// multi-thousand-pixel files. Before they hit Firebase Storage (and become the
// storefront logo, favicon and social/OG preview) we downscale them to a sane
// standard size and re-encode them, cutting bytes dramatically without a visible
// quality loss. Runs entirely in the browser via <canvas>; server-safe no-op.

/**
 * Resize (preserving aspect ratio) and re-encode an image File.
 *
 * @param {File} file
 * @param {object} [opts]
 * @param {number} [opts.maxWidth=1024]
 * @param {number} [opts.maxHeight=1024]
 * @param {string} [opts.mimeType]   Output type; defaults to preserving the
 *                                   source (png→png so transparency survives,
 *                                   jpeg→jpeg, webp→webp, else png).
 * @param {number} [opts.quality=0.9] For lossy encoders (jpeg/webp).
 * @param {string} [opts.background] Optional flat background (e.g. '#ffffff').
 * @returns {Promise<File>} The optimised file — or the original if we couldn't
 *                          beat it (e.g. already tiny, SVG, or non-image).
 */
export async function optimizeImage(file, opts = {}) {
  if (!file || typeof window === 'undefined' || typeof document === 'undefined') return file;

  const type = (file.type || '').toLowerCase();
  // SVG is already resolution-independent and tiny — never rasterise it.
  if (type.includes('svg')) return file;
  if (!type.startsWith('image/')) return file;

  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.9,
    background = null,
  } = opts;

  const mimeType = opts.mimeType || (
    type.includes('png')  ? 'image/png'  :
    type.includes('webp') ? 'image/webp' :
    (type.includes('jpeg') || type.includes('jpg')) ? 'image/jpeg' :
    'image/png'
  );

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = dataUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return file;

    const ratio   = Math.min(maxWidth / w, maxHeight / h, 1); // never upscale
    const targetW = Math.max(1, Math.round(w * ratio));
    const targetH = Math.max(1, Math.round(h * ratio));

    const canvas = document.createElement('canvas');
    canvas.width  = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, targetW, targetH); }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    if (!blob || blob.size === 0) return file;
    // Only adopt the result if it actually saves bytes.
    if (blob.size >= file.size) return file;

    const ext      = mimeType.split('/')[1] || 'img';
    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
  } catch {
    // Any failure (CORS-tainted canvas, decode error, …) → keep the original.
    return file;
  }
}

/**
 * Standard LOGO preset. Fits within a 512×512 box (plenty for a storefront
 * header, favicon and OG/social preview) and preserves the source format so a
 * transparent PNG stays transparent — important for favicons and clean previews.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export function optimizeLogo(file) {
  return optimizeImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.92 });
}
