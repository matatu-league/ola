"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Palette, Save, Loader2, CheckCircle2, LayoutTemplate,
  Zap, Sparkles, X, ArrowLeft, Code, ExternalLink,
  Monitor, Smartphone, Tablet, ChevronDown, Sun, Moon,
  Wand2, Settings2, FileUp, Link as LinkIcon,
  Image as ImageIcon, Check, Plus, Trash2, FileText
} from 'lucide-react';
import { sanitizeTemplateCode } from '@/lib/templateSanitize';
import { uploadFileToFirebase } from '@/lib/firebaseLib';
import { generateTemplateText, searchUnsplashImage, unsplashSourceUrl, AI_PROVIDERS, TEMPLATE_PROVIDER } from '@/lib/aiProvider';
import { buildTemplatePrompt, LOGO_DECODE_PROMPT } from '@/lib/templatePrompt';
import { buildJsonTemplatePrompt } from '@/lib/templateJsonPrompt';
import { parseTemplateJson } from '@/lib/templateJson';
import { buildJsonStorefrontSrcDoc } from '@/lib/templateJsonRuntime';
import { olaBridgeScript } from '@/lib/storefrontBridge';

// Category-appropriate SAMPLE catalog for the builder preview, so an electronics
// store previews electronics (names + on-category Unsplash imagery), a fashion
// store previews fashion, etc. Real products replace these on the live store.
const _img = (kw) => unsplashSourceUrl(kw, 600, 600);
const _mk  = (arr) => arr.map((x, i) => ({ id: String(i + 1), name: x[0], price: x[1], image: _img(x[2]) }));
function sampleCatalog(industry) {
  const i = (industry || '').toLowerCase();
  if (/electronic|tech|gadget|computer|phone|device|digital|appliance/.test(i))
    return { categories: ['New Arrivals', 'Laptops', 'Phones', 'Audio', 'Accessories'], products: _mk([
      ['Wireless Noise-Cancelling Headphones', 220, 'wireless headphones'], ['Ultrabook Pro 14"', 1450, 'laptop computer'],
      ['Flagship Smartphone', 980, 'smartphone'], ['4K Action Camera', 310, 'action camera'],
      ['Mechanical Keyboard', 130, 'mechanical keyboard'], ['Smart Watch Series X', 260, 'smartwatch'],
      ['Portable Bluetooth Speaker', 90, 'bluetooth speaker'], ['USB-C Fast Charger', 35, 'usb charger gadget'],
    ]) };
  if (/beauty|cosmet|skincare|makeup|salon|spa|hair/.test(i))
    return { categories: ['Bestsellers', 'Skincare', 'Makeup', 'Fragrance'], products: _mk([
      ['Radiance Serum', 48, 'skincare serum'], ['Velvet Matte Lipstick', 24, 'lipstick cosmetics'],
      ['Hydrating Day Cream', 39, 'face cream jar'], ['Signature Eau de Parfum', 95, 'perfume bottle'],
      ['Silk Foundation', 42, 'makeup foundation'], ['Nourishing Hair Oil', 28, 'hair oil bottle'],
      ['Clay Detox Mask', 32, 'face mask skincare'], ['Rose Gold Brush Set', 55, 'makeup brushes'],
    ]) };
  if (/food|grocer|restaurant|cafe|bakery|drink|beverage|coffee|kitchen/.test(i))
    return { categories: ['Fresh', 'Bakery', 'Beverages', 'Pantry'], products: _mk([
      ['Artisan Sourdough Loaf', 6, 'sourdough bread'], ['Single-Origin Coffee Beans', 18, 'coffee beans bag'],
      ['Cold-Pressed Juice', 5, 'fresh juice bottle'], ['Farm Fresh Eggs', 4, 'fresh eggs carton'],
      ['Handmade Chocolate Box', 22, 'chocolate box'], ['Organic Honey Jar', 12, 'honey jar'],
      ['Seasonal Fruit Basket', 30, 'fruit basket'], ['Stone-Baked Pizza', 14, 'gourmet pizza'],
    ]) };
  if (/furnitur|home|decor|interior|kitchenware|homeware/.test(i))
    return { categories: ['Living', 'Bedroom', 'Lighting', 'Decor'], products: _mk([
      ['Oak Lounge Chair', 420, 'lounge chair furniture'], ['Linen Sofa 3-Seater', 980, 'modern sofa'],
      ['Ceramic Table Lamp', 85, 'table lamp decor'], ['Handwoven Area Rug', 240, 'area rug interior'],
      ['Solid Wood Dining Table', 650, 'dining table wood'], ['Minimalist Bookshelf', 190, 'bookshelf interior'],
      ['Velvet Accent Cushion', 35, 'throw cushion decor'], ['Framed Wall Art Set', 120, 'framed wall art'],
    ]) };
  if (/sport|fitness|gym|outdoor|athletic/.test(i))
    return { categories: ['Training', 'Footwear', 'Apparel', 'Gear'], products: _mk([
      ['Performance Running Shoes', 130, 'running shoes'], ['Adjustable Dumbbell Set', 220, 'dumbbells gym'],
      ['Breathable Training Tee', 38, 'sports t-shirt'], ['Yoga Mat Pro', 45, 'yoga mat'],
      ['Insulated Water Bottle', 25, 'sports water bottle'], ['Resistance Band Kit', 30, 'resistance bands'],
      ['Trail Backpack 30L', 90, 'hiking backpack'], ['Smart Fitness Tracker', 150, 'fitness tracker'],
    ]) };
  if (/fashion|cloth|apparel|wear|boutique|shoe|jewel|accessor/.test(i))
    return { categories: ['New In', 'Men', 'Women', 'Accessories'], products: _mk([
      ['Minimalist Linen Shirt', 85, 'linen shirt'], ['Essential Cotton Crew', 45, 'cotton t-shirt'],
      ['Relaxed Fit Trousers', 120, 'tailored trousers'], ['Classic Wool Coat', 295, 'wool coat fashion'],
      ['Leather Weekend Bag', 180, 'leather bag'], ['Silk Blend Scarf', 65, 'silk scarf'],
      ['Premium Knit Beanie', 35, 'knit beanie'], ['Suede Chelsea Boots', 210, 'chelsea boots'],
    ]) };
  // Generic fallback — keyed to whatever the industry is.
  const kw = i || 'premium product';
  const tags = ['premium', 'classic', 'modern', 'deluxe', 'essential', 'signature', 'limited', 'pro'];
  return {
    categories: ['Featured', 'New Arrivals', 'Best Sellers', 'Deals'],
    products: tags.map((t, n) => ({ id: String(n + 1), name: `${industry || 'Signature'} ${t.charAt(0).toUpperCase() + t.slice(1)}`, price: 40 + n * 25, image: _img(`${t} ${kw}`) })),
  };
}

// --- CONFIG & UTILITIES ---
// Template text generation is provider-switchable (Gemini / DeepSeek v4) via
// env — see @/lib/aiProvider. This key is only used for the lightweight inline
// text rewrites in Visual Edit mode (always Gemini).
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const TEXT_MODEL_ID = process.env.NEXT_PUBLIC_AI_TEXT_MODEL || 'gemini-3.5-flash';

// Replace only the FIRST exact occurrence of `a` with `b` in `src`. Used by the
// visual editor to map a click-to-edit change back to the template source. If
// `a` isn't found (e.g. it was dynamic, data-driven content), this is a safe
// no-op — which is exactly why the editor only affects static content.
const replaceFirst = (src, a, b) => {
  if (!a) return src;
  const i = src.indexOf(a);
  return i === -1 ? src : src.slice(0, i) + b + src.slice(i + a.length);
};

// ── Post-generation image review ────────────────────────────────────────────
// The AI fills hero/decorative photography with stock imagery (LoremFlickr by
// default, or real Unsplash photos when a key is configured) per the prompt's
// image rule — never product/service photos (those are the vendor's real data)
// and never the vendor's own logo (Firebase-hosted). Matching only these two
// stock domains means the review list is exactly "placeholders worth swapping".
const DUMMY_IMAGE_RE = /https:\/\/(?:loremflickr\.com|images\.unsplash\.com)\/[^\s"'\\]+/g;

const extractDummyImages = (sourceText) => {
  if (!sourceText) return [];
  const matches = sourceText.match(DUMMY_IMAGE_RE) || [];
  return Array.from(new Set(matches));
};

// Replace EVERY occurrence of one dummy image URL across the generated source.
// Works for both output formats: JSX is a plain string; JSON is compared/
// replaced via its serialised text (safe here since these URLs contain no
// characters that need JSON-escaping), then re-parsed back into an object.
const replaceImageEverywhere = (format, code, jsonDoc, oldUrl, newUrl) => {
  if (format === 'json') {
    const nextText = JSON.stringify(jsonDoc).split(oldUrl).join(newUrl);
    try { return { code, jsonDoc: JSON.parse(nextText) }; } catch { return { code, jsonDoc }; }
  }
  return { code: code.split(oldUrl).join(newUrl), jsonDoc };
};

// Injected into the preview iframe in Visual Edit mode. Plain JS (no JSX). Makes
// static text leaves click-to-edit and images click-to-replace, posting changes
// to the parent. Dynamic content edits are harmless (see replaceFirst).
const EDITOR_BRIDGE = `
(function(){
  var TAGS = 'H1,H2,H3,H4,H5,H6,P,SPAN,A,BUTTON,LI,BLOCKQUOTE,LABEL,SMALL,STRONG,EM,FIGCAPTION,DIV'.split(',');
  function isTextLeaf(el){
    if(!el || TAGS.indexOf(el.tagName)===-1) return false;
    if(el.children.length>0) return false;
    return el.textContent.trim().length>0;
  }

  // ── Noticeable "replace image" hover affordance ───────────────────────────
  // A floating overlay positioned over whichever <img> is hovered — a dashed
  // border, dark scrim, upload icon and "Click to replace image" label — so
  // images read as obviously editable, distinct from the thin text-hover
  // outline. pointer-events:none on the overlay lets the click still land on
  // the underlying <img>, which the existing click handler below opens the
  // replace popover for.
  var overlay = null;
  function ensureOverlay(){
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.setAttribute('data-ola-image-overlay', '1');
    overlay.style.cssText = 'position:fixed;z-index:2147483647;display:none;align-items:center;justify-content:center;flex-direction:column;gap:6px;background:rgba(15,15,20,.6);color:#fff;font:700 12px/1.3 system-ui,-apple-system,sans-serif;pointer-events:none;box-sizing:border-box;border:2px dashed rgba(255,255,255,.9);text-align:center;padding:8px;';
    overlay.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      '<span>Click to replace image</span>';
    document.body.appendChild(overlay);
    return overlay;
  }
  function showOverlayOn(img){
    var o = ensureOverlay();
    var r = img.getBoundingClientRect();
    o.style.top = r.top + 'px';
    o.style.left = r.left + 'px';
    o.style.width = r.width + 'px';
    o.style.height = r.height + 'px';
    o.style.display = 'flex';
  }
  function hideOverlay(){ if (overlay) overlay.style.display = 'none'; }
  window.addEventListener('scroll', function(){ if (hovered && hovered.tagName === 'IMG') showOverlayOn(hovered); }, true);
  window.addEventListener('resize', function(){ if (hovered && hovered.tagName === 'IMG') showOverlayOn(hovered); });

  // Image hover-to-replace is ALWAYS on (regardless of Visual Edit mode) — a
  // vendor should see a photo is replaceable without hunting for a toggle
  // first. Text click-to-edit (contenteditable + the blanket anchor-click
  // guard that protects it from navigating away mid-edit) stays gated behind
  // window.__OLA_TEXT_EDIT__, since rewriting copy is a more deliberate action.
  var hovered=null;
  document.addEventListener('mouseover', function(e){
    if(hovered && hovered.tagName!=='IMG'){ hovered.style.outline=''; hovered.style.cursor=''; }
    var el=e.target;
    if(el.tagName==='IMG'){ el.style.cursor='pointer'; showOverlayOn(el); hovered=el; return; }
    hideOverlay();
    if(window.__OLA_TEXT_EDIT__ && isTextLeaf(el)){ el.style.outline='2px solid #2563EB'; el.style.outlineOffset='1px'; el.style.cursor='text'; hovered=el; }
  });
  document.addEventListener('mouseout', function(e){
    if(e.target && e.target.tagName==='IMG') hideOverlay();
  });
  document.addEventListener('click', function(e){
    var el=e.target;
    if(el.tagName==='IMG'){
      e.preventDefault(); e.stopPropagation();
      hideOverlay();
      parent.postMessage({ __olaEdit:true, type:'image-edit', src: el.getAttribute('src') }, '*');
      return;
    }
    if(!window.__OLA_TEXT_EDIT__) return;
    var a=e.target.closest && e.target.closest('a'); if(a) e.preventDefault();
    if(isTextLeaf(el) && !el.getAttribute('data-ola-editing')){
      e.preventDefault(); e.stopPropagation();
      el.setAttribute('data-ola-editing','1');
      el.setAttribute('contenteditable','true');
      var original = el.textContent.trim();
      el.focus();
      parent.postMessage({ __olaEdit:true, type:'text-focus', original: original }, '*');
      var done=function(){
        el.removeAttribute('contenteditable'); el.removeAttribute('data-ola-editing');
        el.style.outline='';
        var updated=el.textContent.trim();
        if(updated && updated!==original){
          parent.postMessage({ __olaEdit:true, type:'text-edit', original: original, updated: updated }, '*');
        }
        el.removeEventListener('blur', done);
      };
      el.addEventListener('blur', done);
    }
  }, true);
})();
`;

// Clean raw model text into bare JSX: strip markdown fences and stray exports.
const cleanTemplateText = (text) => {
  if (!text) throw new Error('Empty or blocked response from AI.');
  let cleanCode = text.replace(/```(?:jsx|javascript|js|react|html)?\n?/gi, '').replace(/```/gi, '').trim();
  cleanCode = cleanCode.replace(/export\s+default\s+[a-zA-Z0-9_]+;?/gi, '');
  return cleanCode;
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

// Fetch an image URL and return it as inline image data ({ mimeType, data })
// so it can be attached to the AI request.
const urlToInlineImage = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return { mimeType: blob.type, data: await fileToBase64(blob) };
  } catch {
    return null;
  }
};

// Decode a logo image into a rich TEXT brief (colors, wordmark, typography,
// mark, layout, mood + suggested palette) using the active vision engine. Run
// ONCE per logo and cache the result on the store — thereafter every template
// generation attaches this text instead of re-uploading the image bytes, which
// is cheaper on tokens and gives the designer model a fuller picture of the
// brand. Returns a trimmed string, or '' if the logo can't be read.
const describeLogo = async (logoUrl, provider) => {
  const img = await urlToInlineImage(logoUrl);
  if (!img) return '';
  const text = await generateTemplateText(
    LOGO_DECODE_PROMPT,
    [{ mimeType: img.mimeType, data: img.data }],
    provider,
  );
  return (text || '').trim();
};

// Admin-defined "command" for this industry (global + most-specific), stored
// in the DB and editable from the admin dashboard. Layered into the brief.
const fetchHouseCommand = async (business = {}, categoryContext = '') => {
  try {
    const params = new URLSearchParams();
    const catSlug = (business.industry || categoryContext || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (catSlug) params.set('category', catSlug);
    if (business.serviceType) params.set('serviceType', business.serviceType);
    if (business.businessType) params.set('businessType', business.businessType);
    const res  = await fetch(`/api/commands?${params.toString()}`);
    const json = await res.json();
    if (json?.success) return json.command || '';
  } catch (_) { /* no command → default brief only */ }
  return '';
};

// --- CORE AI CODE GENERATION ENGINE ---
const generateCodeAI = async (
  promptText, imageBase64, imageMimeType, currentCode,
  categoryContext, blueprintPrompt, themeColor, themeMode, artDirection,
  advancedConfig, isEditingExplicit, business = {}
) => {
  const { aiProvider } = advancedConfig;
  const command = await fetchHouseCommand(business, categoryContext);

  // The master prompt lives in its own module (@/lib/templatePrompt) so it can
  // evolve independently of this page — see buildTemplatePrompt for the full brief.
  const prompt = buildTemplatePrompt({
    promptText,
    currentCode,
    categoryContext,
    blueprintPrompt,
    themeColor,
    themeMode,
    artDirection,
    advancedConfig,
    isEditingExplicit,
    business,
    command,
  });

  // Attach the store's REAL logo as inline image bytes ONLY when we don't have a
  // cached text decode of it — the decode (business.logoDescription, injected
  // into the prompt above) already carries the colors/typography/mark/mood, so
  // re-sending the image every time is wasted tokens. There is NO banner —
  // hero/section imagery comes from Unsplash (see prompt). An optional user
  // style reference can also be attached.
  const images = [];
  if (!business.logoDescription && business.logoBase64) {
    images.push({ mimeType: business.logoMime || 'image/png', data: business.logoBase64 });
  }
  if (imageBase64 && imageMimeType) images.push({ mimeType: imageMimeType, data: imageBase64 });

  // Provider-switchable (Gemini / DeepSeek v4 / Custom) — the engine selector in
  // the theme studio passes an explicit choice; otherwise the env default wins.
  const text = await generateTemplateText(prompt, images, aiProvider);
  return cleanTemplateText(text);
};

// --- STRUCTURED JSON GENERATION ENGINE (templateFormat: 'json') ---
// Asks the model for the structured document (docs/template-json-schema.md),
// validates it, and — the reliability win over raw JSX — feeds validation
// errors back for ONE corrective retry before giving up.
const generateJsonAI = async (
  promptText, currentJson,
  categoryContext, themeColor, themeMode, artDirection,
  advancedConfig, business = {}
) => {
  const { aiProvider } = advancedConfig;
  const command = await fetchHouseCommand(business, categoryContext);

  const base = {
    promptText, currentJson, categoryContext, themeColor, themeMode,
    artDirection, advancedConfig, business, command,
  };

  // Text decode of the logo replaces image bytes (see logoDescription); only
  // attach the raw logo when no decode exists.
  const images = [];
  if (!business.logoDescription && business.logoBase64) {
    images.push({ mimeType: business.logoMime || 'image/png', data: business.logoBase64 });
  }

  let text = await generateTemplateText(buildJsonTemplatePrompt(base), images, aiProvider);
  let { doc, errors } = parseTemplateJson(text);
  if (!doc) {
    text = await generateTemplateText(
      buildJsonTemplatePrompt({ ...base, validationErrors: errors }),
      images, aiProvider,
    );
    ({ doc, errors } = parseTemplateJson(text));
  }
  if (!doc) throw new Error(`The model returned an invalid template document: ${errors.slice(0, 3).join(' · ')}`);
  return doc;
};

// --- DATA LISTS ---
const PRESET_COLORS = [
  '#2563EB', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
  '#EC4899', '#161823', '#ffffff', '#F97316', '#3B82F6',
  '#06B6D4', '#84CC16',
];

const ART_DIRECTIONS = [
  { id: 'random', name: '✨ Surprise Me (AI Choice)', prompt: 'Be wildly creative. Invent a unique, unpredictable, out-of-the-box aesthetic.' },
  { id: 'luxury', name: 'High-End Luxury', prompt: 'Enormous whitespace, delicate typography, overlapping images, muted tones, cinematic feel.' },
  { id: 'brutalism', name: 'Neo-Brutalism', prompt: 'Harsh contrasts, thick black borders, flat vibrant colors, brutalist large typography, hard shadows.' },
  { id: 'glassmorphism', name: 'Glassmorphism', prompt: 'Lots of translucent layers, backdrop-blur-xl, subtle white borders on cards, floating elements.' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'Neon accents, dark mode forced, monospace fonts, glitchy sharp UI elements, glowing drop shadows.' },
  { id: 'minimalist', name: 'Zen Minimalist', prompt: 'Extreme minimalism. Almost no borders. Rely purely on typography, spacing, and grid alignment.' },
  { id: 'horizontal', name: 'Horizontal Flow', prompt: 'Utilize horizontal scrolling containers for product categories to save vertical space. Modern and sleek.' }
];

const layoutBlueprints = [
  {
    id: 'none', name: '✨ Let AI Decide',
    prompt: '',
    icon: (
      <div className="flex flex-col items-center justify-center w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-none">
        <Sparkles size={24} className="text-blue-500 opacity-50 animate-pulse" />
      </div>
    )
  },
  {
    id: 'classic', name: 'Classic Grid',
    prompt: 'Top Navigation Header -> Big Hero Image below header -> Horizontal Categories row below Hero -> 4-Column Product Grid -> Standard Footer.',
    icon: (
      <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-none">
        <div className="w-full h-2 bg-white/60 rounded-none"></div>
        <div className="w-full h-6 bg-white/20 rounded-none"></div>
        <div className="w-full h-2 bg-blue-500/80 rounded-none"></div>
        <div className="flex-1 grid grid-cols-2 gap-1"><div className="bg-white/30 rounded-none"></div><div className="bg-white/30 rounded-none"></div></div>
      </div>
    )
  },
  {
    id: 'megamarket', name: 'Mega Market',
    prompt: 'Alibaba Style: Top Header -> Split Hero area where Left 25% is a vertical Category Menu and Right 75% is the Hero image slider -> Dense Product Grid -> Footer.',
    icon: (
      <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-none">
        <div className="w-full h-2 bg-white/60 rounded-none"></div>
        <div className="flex gap-1 h-8"><div className="w-1/3 h-full bg-blue-500/80 rounded-none"></div><div className="flex-1 h-full bg-white/20 rounded-none"></div></div>
        <div className="flex-1 grid grid-cols-3 gap-1"><div className="bg-white/30 rounded-none"></div><div className="bg-white/30 rounded-none"></div><div className="bg-white/30 rounded-none"></div></div>
      </div>
    )
  },
  {
    id: 'inlinehero', name: 'Inline Hero',
    prompt: 'Top Header -> Middle Section: Left 20% Categories (STRICTLY same height as hero banner), Right 80% Hero Banner -> Below: Full 100% width Product Grid -> Footer.',
    icon: (
      <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-none">
        <div className="w-full h-2 bg-white/60 rounded-none"></div>
        <div className="flex gap-1 h-6"><div className="w-1/4 h-full bg-white/40 rounded-none"></div><div className="flex-1 h-full bg-blue-500/60 rounded-none"></div></div>
        <div className="flex-1 w-full bg-white/20 rounded-none"></div>
      </div>
    )
  },
  {
    id: 'threecolumn', name: 'Three Column',
    prompt: 'Top Header -> Middle Section: Left Categories, Center Hero Banner, Right Promotions -> Below: Full width Product Grid -> Footer.',
    icon: (
      <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-none">
        <div className="w-full h-2 bg-white/60 rounded-none"></div>
        <div className="flex gap-1 h-6"><div className="w-1/4 h-full bg-white/40 rounded-none"></div><div className="flex-1 h-full bg-blue-500/60 rounded-none"></div><div className="w-1/4 h-full bg-white/40 rounded-none"></div></div>
        <div className="flex-1 w-full bg-white/20 rounded-none"></div>
      </div>
    )
  },
  {
    id: 'sidebar', name: 'Sidebar Menu',
    prompt: 'Left Sidebar (Logo, Navigation, Vertical Categories) -> Right Side scrollable content (Hero Image -> Product Grid -> Footer).',
    icon: (
      <div className="flex gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-none">
        <div className="w-[30%] h-full flex flex-col gap-2 bg-white/10 p-1 rounded-none"><div className="w-full h-2 bg-blue-500/60 rounded-none"></div><div className="w-full h-1 bg-blue-500/60 rounded-none"></div></div>
        <div className="flex-1 flex flex-col gap-1"><div className="w-full h-6 bg-white/20 rounded-none"></div><div className="flex-1 bg-white/30 rounded-none"></div></div>
      </div>
    )
  }
];

const INITIAL_REACT_CODE = `import React, { useState, useMemo } from 'react';

const SearchIcon = ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const ChevronLeftIcon = ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRightIcon = ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const MapPinIcon = ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const PhoneIcon = ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const MailIcon = ({size=24, className=""}) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const ShoppingBagIcon = ({size=24, className="", style}) => <svg width={size} height={size} className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

const App = ({ storeName = "My Store", storeLogo, storeBanner, contactEmail = "hello@store.com", contactPhone = "+1 234 567 890", categories = ["Featured", "New Arrivals"], products = [], themeColor = "#2563EB" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleProductClick = (id) => {
    window.top.location.href = "https://ola.ug/products/" + id;
  };

  const SvgPlaceholder = () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon size={24} style={{ color: themeColor }} />
            {storeLogo ? <img src={storeLogo} alt={storeName} className="h-8 object-contain rounded-none" /> : <h1 className="text-xl font-bold tracking-tight">{storeName}</h1>}
          </div>
          
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-50 border border-gray-300 rounded-none py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full p-6 mt-4">
        <div className="w-full h-[250px] md:h-[400px] rounded-none overflow-hidden relative mb-12">
          {storeBanner ? (
            <img src={storeBanner} className="w-full h-full object-cover" alt="Store Banner" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-800 to-black"></div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-6">
            <h2 className="text-white text-xl md:text-3xl font-bold tracking-tight mb-4">Welcome to {storeName}</h2>
          </div>
        </div>

        {currentProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map(p => (
              <div key={p.id} onClick={() => handleProductClick(p.id)} className="bg-white rounded-none overflow-hidden border border-gray-200 cursor-pointer group hover:shadow-sm transition-all flex flex-col">
                <div className="aspect-square overflow-hidden bg-gray-50 relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  ) : null}
                  <div style={{ display: p.image ? 'none' : 'flex' }} className="absolute inset-0 items-center justify-center bg-gray-50">
                     <SvgPlaceholder />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm font-bold mb-1 line-clamp-2 leading-tight flex-1">{p.name}</p>
                  <p className="text-sm font-bold mt-2 mb-3" style={{ color: themeColor }}>\${p.price}</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none py-2 text-xs font-bold transition-colors mt-auto">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-none border border-gray-200 disabled:opacity-50 hover:bg-gray-50"><ChevronLeftIcon size={16} /></button>
            <span className="text-sm font-semibold px-4">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-none border border-gray-200 disabled:opacity-50 hover:bg-gray-50"><ChevronRightIcon size={16} /></button>
          </div>
        )}
      </main>

      <footer className="bg-black text-white mt-16 py-12">
        <div className="max-w-[1200px] mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-base font-bold mb-4">{storeName}</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">Your premium destination for the best products on the ola.ug marketplace.</p>
          </div>
          <div>
            <h3 className="text-base font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center gap-2"><MailIcon size={16}/> {contactEmail}</li>
              <li className="flex items-center gap-2"><PhoneIcon size={16}/> {contactPhone}</li>
              <li className="flex items-center gap-2"><MapPinIcon size={16}/> Kampala, Uganda</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-bold mb-4">Legal</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-6 pt-8 mt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {storeName}. Powered by ola.ug.
        </div>
      </footer>
    </div>
  );
};
export default App;`;

const LiveCodePreview = ({ code, viewMode = 'desktop', storeProfile = {}, themeColor, editMode = false, onVisualEdit, format = 'jsx', jsonDoc = null, pages = [] }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Receive click-to-edit events from the in-iframe editor bridge.
  useEffect(() => {
    const handler = (e) => {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      if (e.data && e.data.__olaEdit) onVisualEdit?.(e.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onVisualEdit]);

  const dynamicStoreData = {
    // Identity reflects THIS store so the preview looks like the real business.
    storeName:    storeProfile.title || "",
    storeLogo:    storeProfile.logo || "",
    storeBanner:  storeProfile.banner || unsplashSourceUrl(storeProfile.industry || 'modern storefront business', 2000, 1000),
    contactEmail: storeProfile.contactEmail || "",
    contactPhone: storeProfile.contactPhone || "+1 (555) 123-4567",
    businessType: storeProfile.businessType || "products",
    serviceType:  storeProfile.serviceType || null,
    themeColor:   themeColor || "#2563EB",
    // Category-matched sample catalog (electronics store → electronics, etc.).
    categories: sampleCatalog(storeProfile.industry).categories,
    products:   sampleCatalog(storeProfile.industry).products,
    // Custom pages managed live in this dialog — reflected in the preview
    // immediately, before saving, so the vendor sees them wired up right away.
    pages: (pages || []).filter((p) => p.published !== false).map((p) => ({ title: p.title, slug: p.slug, content: p.content })),
    // Preview-only sample services so service / "both" templates render their
    // services view. Real services are injected at runtime on the live store.
    services: [
      { id: "s1", name: "Signature Consultation", price: 120, duration: "60 min", image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&auto=format&fit=crop" },
      { id: "s2", name: "Premium Session",        price: 200, duration: "90 min", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&auto=format&fit=crop" },
      { id: "s3", name: "Express Service",        price: 75,  duration: "30 min", image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&auto=format&fit=crop" },
      { id: "s4", name: "Full Experience Package", price: 350, duration: "Half day", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&auto=format&fit=crop" }
    ],
    // No live API in the preview — templates fall back to the sample props above.
    apiBase: ""
  };

  const viewWidths = { desktop: 1440, tablet: 768, mobile: 375 };
  const targetWidth = viewWidths[viewMode];

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const PADDING_X = viewMode === 'desktop' ? 0 : 48;
        let newScale = (containerWidth - PADDING_X) / targetWidth;
        if (newScale > 1) newScale = 1;
        setScale(newScale);
      }
    };
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    updateScale();
    return () => observer.disconnect();
  }, [targetWidth, viewMode]);

  const processedCode = useMemo(() => sanitizeTemplateCode(code, 'window.__olaIcons'), [code]);

  // Structured JSON preview — same fixed runtime as the live store, sample data,
  // preview-mode bridge (checkout is a polite no-op). Visual Edit is JSX-only.
  const jsonSrcDoc = useMemo(() => {
    if (format !== 'json' || !jsonDoc) return null;
    return buildJsonStorefrontSrcDoc({
      doc: jsonDoc,
      data: dynamicStoreData,
      storeId: dynamicStoreData.storeId || null,
      live: false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, JSON.stringify(jsonDoc || null), JSON.stringify(dynamicStoreData)]);

  // The full source Babel compiles, built as a plain JS string so it can be
  // safely JSON-stringified into the bootstrap script below (see its comment
  // for why we don't use babel-standalone's <script type="text/babel"> scan).
  const babelSource = useMemo(() => `
    const { useState, useEffect, useRef, useMemo } = React;

    window.lucideFallback = new Proxy({}, {
      get: (_, prop) => (p) => React.createElement('svg', {
        width: p.size || 24, height: p.size || 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
        strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: p.className, style: p.style
      }, React.createElement('circle', {cx: 12, cy: 12, r: 10}), React.createElement('path', {d: 'M12 8v4M12 16h.01'}))
    });

    // Real lucide-react icons (UMD CDN) with a graceful SVG fallback for any
    // name the build doesn't expose — templates can import any icon safely.
    window.__olaIcons = new Proxy({}, {
      get: (_, name) => {
        const lib = window.LucideReact || window.lucideReact || window.lucide || null;
        const Icon = lib && lib[name];
        return (typeof Icon === 'function' || (Icon && Icon.$$typeof)) ? Icon : window.lucideFallback[name];
      }
    });

    ${olaBridgeScript({ storeId: dynamicStoreData.storeId || null, live: false })}

    const dynamicStoreData = ${JSON.stringify(dynamicStoreData)};

    ${processedCode}

    try {
      ReactDOM.createRoot(document.getElementById('root')).render(<App {...dynamicStoreData} />);
      // The image hover-to-replace overlay is ALWAYS on in the builder preview
      // (so a vendor sees "this photo can be replaced" without first finding
      // the Visual Edit toggle). Text click-to-edit stays gated behind that
      // toggle via this flag, since rewriting copy is a more deliberate action.
      window.__OLA_TEXT_EDIT__ = ${editMode ? 'true' : 'false'};
      setTimeout(function(){ ${EDITOR_BRIDGE} }, 350);
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="padding:32px;color:#ef4444;font-family:monospace;font-size:13px;"><h2 style="margin-bottom:12px;">Render Error</h2><pre>' + err.toString() + '</pre></div>';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  `, [processedCode, editMode, JSON.stringify(dynamicStoreData)]);

  const jsxSrcDoc = useMemo(() => `
    <!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script>window.react = window.React;</script>
      <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <script crossorigin src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>body{margin:0;padding:0;}::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,.2);}</style>
    </head><body>
      <div id="root"></div>
      <script>
        window.onerror = function(msg, url, line, col, error) {
          document.getElementById('root').innerHTML = '<div style="padding:32px;color:#ef4444;font-family:monospace;font-size:13px;"><h2 style="margin-bottom:12px;">Syntax/Render Error</h2><pre>' + msg + '</pre></div>';
          return true;
        };
      </script>
      <script>
        // Compile with Babel's JS API directly (filename ending in ".tsx")
        // instead of babel-standalone's <script type="text/babel"> auto-scan.
        // The auto-scan hardcodes filename to "Inline Babel script" (no
        // recognised extension), so its "typescript" preset can't tell JSX is
        // allowed there — any stray TypeScript syntax the model slips in
        // (very common: "(v: any) =>", "as string", ...) throws a hard
        // SyntaxError and white-screens the preview. A ".tsx" filename lets
        // the typescript preset parse both JSX and type annotations.
        try {
          var __compiled = Babel.transform(${JSON.stringify(babelSource)}, {
            filename: 'template.tsx',
            // runtime:'classic' -> React.createElement(...) calls, NOT the
            // automatic runtime's "import { jsx } from 'react/jsx-runtime'"
            // (that import throws "Cannot use import statement outside a
            // module" in this classic, non-module script).
            presets: [['react', { runtime: 'classic' }], 'typescript'],
          }).code;
          var __s = document.createElement('script');
          __s.text = __compiled;
          document.head.appendChild(__s);
        } catch (e) {
          document.getElementById('root').innerHTML = '<div style="padding:32px;color:#ef4444;font-family:monospace;font-size:13px;"><h2 style="margin-bottom:12px;">Template Compile Error</h2><pre>' + String((e && e.message) || e).replace(/</g, '&lt;') + '</pre></div>';
        }
      </script>
    </body></html>
  `, [babelSource]);

  const srcDoc = (format === 'json' && jsonSrcDoc) ? jsonSrcDoc : jsxSrcDoc;

  return (
    <div ref={containerRef} className="w-full h-full flex justify-center overflow-hidden bg-transparent">
      <div
        className="flex-shrink-0 transition-all duration-300 ease-in-out relative shadow-[0_0_80px_rgba(0,0,0,0.4)]"
        style={{
          width: `${targetWidth}px`,
          height: viewMode === 'desktop' ? `calc(100% / ${scale})` : `calc((100% - 48px) / ${scale})`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          overflow: 'hidden',
          marginTop: viewMode !== 'desktop' ? '24px' : '0px',
          borderRadius: viewMode !== 'desktop' ? '36px' : '8px',
          border: viewMode !== 'desktop' ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
      >
        {viewMode !== 'desktop' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[24px] bg-[#111] rounded-b-[16px] z-50"></div>}
        {viewMode !== 'desktop' && <div className="absolute inset-0 pointer-events-none rounded-[36px] border-[12px] border-[#111] z-40"></div>}
        {format === 'json' && !jsonDoc ? (
          <div className="w-full h-full absolute inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-center px-8">
            <Sparkles size={22} className="text-blue-500" />
            <p className="text-sm font-bold text-white">Structured JSON template</p>
            <p className="text-xs text-white/40 max-w-[300px]">No document yet — hit <b>Generate</b> and the design will be produced as validated JSON and previewed here.</p>
          </div>
        ) : (
          <iframe ref={iframeRef} srcDoc={srcDoc} className="w-full h-full border-0 absolute inset-0 bg-white" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups" title="Live AI Preview" />
        )}
      </div>
    </div>
  );
};

// --- AI BUILDER DIALOG (Dark Theme with Blue-600 Primary) ---
const AIBuilderDialog = ({ initialCode, initialFormat = 'jsx', initialJson = null, onSave, onClose, globalThemeColor, globalThemeMode, storeProfile = {}, onLogoDescribed }) => {
  const [code, setCode]                   = useState(initialCode);
  const [activeTab, setActiveTab]         = useState('basic');

  // Output format: 'jsx' (legacy raw component) or 'json' (structured document
  // per docs/template-json-schema.md, rendered by the fixed runtime).
  const [outputFormat, setOutputFormat]   = useState(initialFormat === 'json' ? 'json' : 'jsx');
  const [jsonDoc, setJsonDoc]             = useState(initialJson || null);
  const [jsonText, setJsonText]           = useState(initialJson ? JSON.stringify(initialJson, null, 2) : '');

  // Logo decode cache for THIS dialog session. `storeProfile` is a point-in-
  // time prop snapshot from when the dialog opened — it never updates itself
  // after we PUT a fresh decode to the DB below, so without this local cache a
  // second "Generate" click in the same session would decode the logo AGAIN.
  // Seeded from storeProfile (itself loaded from the DB), then kept current
  // locally and also pushed up via onLogoDescribed so a close/reopen of this
  // dialog (same page load) also sees it without a full page reload.
  const [logoDescription, setLogoDescription]   = useState(storeProfile.logoDescription || '');
  const [logoDescribedFor, setLogoDescribedFor] = useState(storeProfile.logoDescribedFor || '');

  // ── Custom pages (About, FAQ, Shipping policy, …) ──────────────────────────
  // Managed HERE, in the AI Theme Builder — not as a separate seller-dashboard
  // section — because a page is never an independent Next.js route. It's built
  // INTO the generated storefront as its own tab (#/page/<slug>), the same
  // client-state, zero-navigation architecture as Home/Shop/Product, so it can
  // never cause the routing issues a real standalone page would.
  const [pages, setPages]             = useState([]);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTitle, setNewPageTitle]     = useState('');
  const [newPageContent, setNewPageContent] = useState('');
  const [addingPage, setAddingPage]   = useState(false);

  useEffect(() => {
    fetch('/api/stores/pages')
      .then((r) => r.json())
      .then((json) => { if (json.success) setPages(json.pages || []); })
      .catch(() => {});
  }, []);

  const addPage = async () => {
    if (!newPageTitle.trim()) return;
    setAddingPage(true);
    try {
      const res  = await fetch('/api/stores/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPageTitle, content: newPageContent, published: true }),
      });
      const json = await res.json();
      if (json.success) {
        setPages(json.pages || []);
        setNewPageTitle('');
        setNewPageContent('');
        setShowAddPage(false);
      } else {
        setToastMsg(`⚠️ ${json.message || 'Could not add page'}`);
        setTimeout(() => setToastMsg(''), 4000);
      }
    } catch (e) {
      setToastMsg(`⚠️ ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setAddingPage(false); }
  };

  const deletePage = async (slug) => {
    const res  = await fetch(`/api/stores/pages?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) setPages(json.pages || []);
  };

  // Post-generation image review — surfaced the moment a design finishes so
  // the vendor immediately knows which photos are AI stock placeholders and
  // can swap them (or explicitly skip and do it later).
  const [dummyImages, setDummyImages]     = useState([]);   // [{ url, replaced, newUrl? }]
  const [showImageReview, setShowImageReview] = useState(false);
  const [reviewTarget, setReviewTarget]   = useState(null); // url currently being replaced
  const [reviewQuery, setReviewQuery]     = useState('');
  const [reviewBusy, setReviewBusy]       = useState(false);
  const [reviewAction, setReviewAction]   = useState(null); // 'upload' | 'search' | null
  const reviewUploadRef = useRef(null);

  // Basic Form State
  const [formNotes, setFormNotes]         = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState('none');
  const [selectedArtDirection, setSelectedArtDirection] = useState('random');
  const [dialogThemeColor, setDialogThemeColor] = useState(globalThemeColor || '#2563EB');
  const [dialogThemeMode, setDialogThemeMode]   = useState(globalThemeMode  || 'light');
  const [showColorPicker, setShowColorPicker]   = useState(false);
  const colorPickerRef = useRef(null);
  

  // Which AI engine generates the storefront. Defaults to the env-selected
  // provider, but the vendor can switch it per generation in the engine selector.
  const [aiProvider, setAiProvider]       = useState(TEMPLATE_PROVIDER || 'gemini');

  // Advanced Form State
  const [fontFamily, setFontFamily]       = useState('auto');
  const [borderRadius, setBorderRadius]   = useState('auto');
  const [bgStyle, setBgStyle]             = useState('auto');
  const [animationFeel, setAnimationFeel] = useState('auto');

  // Execution State
  const [loading, setLoading]           = useState(false);
  const [previewImg, setPreviewImg]     = useState(null);
  const [rawBase64, setRawBase64]       = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  const [showCode, setShowCode]         = useState(false);
  const [viewport, setViewport]         = useState('desktop');
  const [toastMsg, setToastMsg]         = useState('');

  // Visual edit state
  const [editMode, setEditMode]         = useState(false);
  const [activeText, setActiveText]     = useState(null);   // text literal being edited
  const [imageEdit, setImageEdit]       = useState(null);   // { src } of clicked image
  const [imgOverview, setImgOverview]   = useState('');
  const [editBusy, setEditBusy]         = useState(false);
  // Which image action is in flight — lets the popover show the RIGHT button
  // spinning (and confirms visually that the file is uploading to storage
  // before anything is swapped, not just "busy" generically).
  const [imageAction, setImageAction]   = useState(null); // 'upload' | 'search' | null

  const fileRef = useRef(null);
  const imgReplaceRef = useRef(null);

  // ── Visual editor: handle click-to-edit events from the preview ────────────
  const handleVisualEdit = (msg) => {
    if (msg.type === 'text-focus') { setActiveText(msg.original); return; }
    if (msg.type === 'text-edit') {
      setCode(c => replaceFirst(c, msg.original, msg.updated));
      setActiveText(msg.updated);
      return;
    }
    if (msg.type === 'image-edit') { setImgOverview(''); setImageEdit({ src: msg.src }); }
  };

  // AI rewrite of the currently-selected text literal.
  const rewriteActiveText = async (instruction) => {
    if (!activeText) return;
    setEditBusy(true);
    try {
      const prompt = `${instruction} this website copy. Keep it the same language and intent. Return ONLY the rewritten text, no quotes, no preamble:\n\n${activeText}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const out = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["']|["']$/g, '');
      if (out) { setCode(c => replaceFirst(c, activeText, out)); setActiveText(out); }
    } catch (e) {
      setToastMsg(`⚠️ AI rewrite failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setEditBusy(false); }
  };

  // Swap the clicked image's src in the source for a new URL.
  const applyImageSrc = (newUrl) => {
    if (imageEdit?.src && newUrl) setCode(c => replaceFirst(c, imageEdit.src, newUrl));
    setImageEdit(null);
  };

  // Uploads to Firebase Storage FIRST and only swaps the src once that upload
  // resolves with a real hosted URL — the template never points at a local
  // blob: URL, so what's saved is always a real, durable asset.
  const handleImageUploadReplace = async (file) => {
    if (!file) return;
    setEditBusy(true);
    setImageAction('upload');
    try {
      const url = await uploadFileToFirebase(file, 'stores/template-images');
      applyImageSrc(url);
    } catch (e) {
      setToastMsg(`⚠️ Upload failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setEditBusy(false); setImageAction(null); }
  };

  // Swap the image for a real Unsplash photo matching the user's description
  // (or the store's industry). All template imagery is real photography.
  const handleImageGenerateReplace = async () => {
    setEditBusy(true);
    setImageAction('search');
    try {
      const query = imgOverview.trim() || storeProfile.industry || storeProfile.title || 'business';
      const url = await searchUnsplashImage(query, 'landscape');
      if (!url) throw new Error('No image found');
      applyImageSrc(url);
    } catch (e) {
      setToastMsg(`⚠️ Image search failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setEditBusy(false); setImageAction(null); }
  };

  // ── Post-generation image review actions ──────────────────────────────────
  // Swap ONE placeholder (identified by its exact stock URL) everywhere it
  // appears in the generated source, then mark it done in the review list.
  const applyReviewImage = (newUrl) => {
    if (!reviewTarget || !newUrl) { setReviewTarget(null); return; }
    const { code: nextCode, jsonDoc: nextJson } = replaceImageEverywhere(outputFormat, code, jsonDoc, reviewTarget, newUrl);
    if (outputFormat === 'json') { setJsonDoc(nextJson); setJsonText(JSON.stringify(nextJson, null, 2)); }
    else { setCode(nextCode); }
    setDummyImages((prev) => prev.map((d) => (d.url === reviewTarget ? { ...d, replaced: true, newUrl } : d)));
    setReviewTarget(null);
    setReviewQuery('');
  };

  // Uploads to Firebase Storage FIRST, then only swaps the src once the
  // upload resolves with a real hosted URL — never a local blob: URL.
  const handleReviewUpload = async (file) => {
    if (!file || !reviewTarget) return;
    setReviewBusy(true);
    setReviewAction('upload');
    try {
      const url = await uploadFileToFirebase(file, 'stores/template-images');
      applyReviewImage(url);
    } catch (e) {
      setToastMsg(`⚠️ Upload failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setReviewBusy(false); setReviewAction(null); }
  };

  const handleReviewUnsplash = async () => {
    if (!reviewTarget) return;
    setReviewBusy(true);
    setReviewAction('search');
    try {
      const query = reviewQuery.trim() || storeProfile.industry || storeProfile.title || 'business';
      const url = await searchUnsplashImage(query, 'landscape');
      if (!url) throw new Error('No image found');
      applyReviewImage(url);
    } catch (e) {
      setToastMsg(`⚠️ Image search failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setReviewBusy(false); setReviewAction(null); }
  };

  useEffect(() => {
    const handler = (e) => { if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) setShowColorPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openInNewTab = () => {
    const processedCode = sanitizeTemplateCode(code, 'window.__olaIcons');

    // Plain JS string Babel compiles at runtime (see the bootstrap script's
    // comment below for why we don't use <script type="text/babel">).
    const babelSrc = `const{useState,useEffect,useRef,useMemo}=React;window.lucideFallback=new Proxy({},{get:(_,prop)=>(p)=>React.createElement('svg',{width:p.size||24,height:p.size||24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round',className:p.className,style:p.style},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('path',{d:'M12 8v4M12 16h.01'}))});window.__olaIcons=new Proxy({},{get:(_,name)=>{var lib=window.LucideReact||window.lucideReact||window.lucide||null;var Icon=lib&&lib[name];return (typeof Icon==='function'||(Icon&&Icon.$$typeof))?Icon:window.lucideFallback[name];}});${olaBridgeScript({ storeId: null, live: false })}const dynamicStoreData={storeName:"",themeColor:"${dialogThemeColor}",categories:["Featured"],products:[{id:"1",name:"Sample Item",price:85}]};try{${processedCode}\nReactDOM.createRoot(document.getElementById('root')).render(<App {...dynamicStoreData}/>);}catch(e){console.error(e)}`;

    const htmlContent = `<!DOCTYPE html><html><head><script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script>window.react = window.React;</script><script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script crossorigin src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script>window.onerror=function(m,u,l,c,e){document.getElementById('root').innerHTML='<div style="padding:32px;color:red;font-family:monospace;"><h2>Error</h2><pre>'+m+'</pre></div>';return true;}</script><script>
      // Compile with Babel's JS API directly (filename ending in ".tsx") instead
      // of babel-standalone's <script type="text/babel"> auto-scan, whose
      // hardcoded "Inline Babel script" filename has no recognised extension —
      // its typescript preset then can't tell JSX is allowed there, so any
      // stray TypeScript syntax the model slips in ("(v: any) =>", etc.)
      // throws a hard SyntaxError. A ".tsx" filename allows both.
      try {
        // runtime:'classic' -> React.createElement(...), NOT the automatic
        // runtime's "import { jsx } from 'react/jsx-runtime'" (throws "Cannot
        // use import statement outside a module" in this classic script).
        var __compiled = Babel.transform(${JSON.stringify(babelSrc)}, { filename: 'template.tsx', presets: [['react', { runtime: 'classic' }], 'typescript'] }).code;
        var __s = document.createElement('script');
        __s.text = __compiled;
        document.head.appendChild(__s);
      } catch (e) {
        document.getElementById('root').innerHTML = '<div style="padding:32px;color:red;font-family:monospace;"><h2>Template Compile Error</h2><pre>' + String((e && e.message) || e).replace(/</g, '&lt;') + '</pre></div>';
      }
    </script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.open(); w.document.write(htmlContent); w.document.close(); }
  };

  // Require a complete store profile before a NEW site can be generated, so the
  // AI has the full picture (name, story, branding, contacts) to build from.
  const missingProfile = [
    [!storeProfile.title, 'store name'],
    [!storeProfile.description, 'description'],
    [!storeProfile.logo, 'logo'],
    [!dialogThemeColor, 'brand color'],
    [!storeProfile.contactEmail && !storeProfile.contactPhone, 'contact info'],
  ].filter(([missing]) => missing).map(([, label]) => label);
  const profileComplete = missingProfile.length === 0;

  const handleGenerate = async () => {
    if (!isEditingMode && !profileComplete) {
      setToastMsg(`⚠️ Complete your store profile first (${missingProfile.join(', ')}).`);
      setTimeout(() => setToastMsg(''), 6000);
      return;
    }

    const blueprint  = layoutBlueprints.find(b => b.id === selectedBlueprint);
    const artDir     = ART_DIRECTIONS.find(a => a.id === selectedArtDirection);
    // The store's own category (set at onboarding) is the source of truth.
    const categoryContext = storeProfile.industry || '';

    const business = {
      storeName:    storeProfile.title || '',
      description:  storeProfile.description || '',
      industry:     storeProfile.industry || '',
      businessType: storeProfile.businessType || 'products',
      serviceType:  storeProfile.serviceType || null,
      logo:         storeProfile.logo || '',
      logoDescription: logoDescription,
      contactEmail: storeProfile.contactEmail || '',
      contactPhone: storeProfile.contactPhone || '',
      // Custom pages (About, FAQ, Shipping policy, …) — built into the
      // generated site as its own #/page/<slug> view, never an independent
      // Next.js route. Published-only, matching what the live store serves.
      pages: (pages || []).filter((p) => p.published !== false).map((p) => ({ title: p.title, slug: p.slug, content: p.content })),
    };

    setLoading(true);
    try {
      // Decode the logo to a rich TEXT brief ONCE and cache it on the store, then
      // attach that text (not the image) to every generation — cheaper on tokens
      // and a fuller brand picture. Re-decode ONLY when the logo has actually
      // changed (logoDescribedFor !== current logo) — never on every
      // generation. Falls back to sending the image bytes if the decode is
      // unavailable, so we never regress.
      const staleDescription = business.logo && logoDescribedFor !== business.logo;
      if (business.logo && (!business.logoDescription || staleDescription)) {
        try {
          const desc = await describeLogo(business.logo, aiProvider);
          if (desc) {
            business.logoDescription = desc;
            // Cache locally (so a second Generate click in THIS session reuses
            // it) and persist to the DB (so it survives reload / dialog
            // reopen without ever re-decoding the same logo again).
            setLogoDescription(desc);
            setLogoDescribedFor(business.logo);
            onLogoDescribed?.(desc, business.logo);
            fetch('/api/stores', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logoDescription: desc, logoDescribedFor: business.logo }),
            }).catch(() => {});
          }
        } catch (_) { /* fall through to image fallback below */ }
      }

      // Fallback ONLY when we still have no text decode: send the raw logo bytes
      // so the model can still see the brand mark. No banner — hero imagery comes
      // from Unsplash.
      if (!business.logoDescription) {
        const logoImg = await urlToInlineImage(business.logo);
        if (logoImg) { business.logoBase64 = logoImg.data; business.logoMime = logoImg.mimeType; }
      }

      const advancedConfig = {
        bgStyle: bgStyle === 'auto' ? '✨ Let AI Decide based on vibe' : bgStyle,
        fontFamily: fontFamily === 'auto' ? '✨ Let AI Decide based on vibe' : fontFamily,
        borderRadius: borderRadius === 'auto' ? '✨ Let AI Decide based on vibe' : borderRadius,
        animationFeel: animationFeel === 'auto' ? '✨ Let AI Decide based on vibe' : animationFeel,
        aiProvider,
      };

      let sourceForScan = '';
      if (outputFormat === 'json') {
        // Structured document generation (validated, one corrective retry).
        const doc = await generateJsonAI(
          formNotes, isEditingMode ? jsonDoc : null,
          categoryContext, dialogThemeColor, dialogThemeMode, artDir?.prompt || '',
          advancedConfig, business
        );
        setJsonDoc(doc);
        setJsonText(JSON.stringify(doc, null, 2));
        sourceForScan = JSON.stringify(doc);
      } else {
        const newCode = await generateCodeAI(
          formNotes, rawBase64, imageMimeType, code,
          categoryContext, blueprint?.prompt || '', dialogThemeColor, dialogThemeMode, artDir?.prompt || '',
          advancedConfig, isEditingMode, business
        );
        setCode(newCode);
        sourceForScan = newCode;
      }

      // The design is ready — immediately surface every stock placeholder photo
      // it used so the vendor knows it's time to swap them in (or skip for now).
      const foundImages = extractDummyImages(sourceForScan);
      setDummyImages(foundImages.map((url) => ({ url, replaced: false })));
      setShowImageReview(foundImages.length > 0);

      setToastMsg('✨ Design successfully generated!');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (e) {
      setToastMsg(`⚠️ Error: ${e.message}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageMimeType(file.type);
      const b64 = await fileToBase64(file);
      setRawBase64(b64);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col animate-in fade-in duration-300">
      {/* Toolbar */}
      <div className="h-12 bg-[#111] border-b border-white/10 flex items-center justify-between px-6 shrink-0 shadow-lg relative">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-none text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-500 animate-pulse" size={14} />
            <span className="text-sm font-bold text-white tracking-tight">AI Theme Studio</span>
          </div>
        </div>

        {toastMsg && (
          <div className="absolute left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold text-xs px-4 py-1.5 rounded-none shadow-[0_0_15px_rgba(37,99,235,0.3)] animate-in slide-in-from-top-2">
            {toastMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={openInNewTab} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-white/70 hover:text-white rounded-none text-xs font-bold transition-all">
            <ExternalLink size={14} /> Fullscreen
          </button>
          <button onClick={() => setShowCode(!showCode)} className="flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:bg-white/5 text-white rounded-none text-xs font-bold transition-all">
            <Code size={14} /> {showCode ? 'View Render' : 'View Code'}
          </button>
          <button onClick={() => {
              if (outputFormat === 'json' && !jsonDoc) {
                setToastMsg('⚠️ Generate a JSON design first.');
                setTimeout(() => setToastMsg(''), 4000);
                return;
              }
              onSave({ format: outputFormat, code, json: jsonDoc, color: dialogThemeColor, mode: dialogThemeMode });
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold transition-all shadow-md">
            <Save size={14} /> Save to Store
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Form Panel - Dark */}
        <div className="w-[380px] border-r border-white/10 bg-[#161616] flex flex-col shrink-0 relative">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-white/10 bg-[#111] sticky top-0 z-10">
            <button 
              onClick={() => setActiveTab('basic')} 
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'basic' ? 'text-blue-500 border-b-2 border-blue-600 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              Basic Setup
            </button>
            <button 
              onClick={() => setActiveTab('advanced')} 
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'advanced' ? 'text-blue-500 border-b-2 border-blue-600 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Settings2 size={12} /> Advanced
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* --- BASIC TAB CONTENT --- */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                
                {/* Designing for — the store's own category (from onboarding).
                    Locked: it's what the AI builds around; no need to re-pick it. */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Designing for</h3>
                  <div className="w-full flex items-center justify-between bg-[#1a1a1a] border border-white/10 rounded-none px-3 py-2 text-sm text-white">
                    <span>{storeProfile.industry || 'Your store'}</span>
                    {storeProfile.serviceType && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-blue-300 bg-blue-500/10 px-1.5 py-0.5">
                        {storeProfile.businessType === 'both' ? 'Service + Store' : `Service · ${storeProfile.serviceType}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile-completeness gate */}
                {!profileComplete && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    Complete your store profile before generating a site — missing: {missingProfile.join(', ')}.
                  </div>
                )}

                {/* Aesthetics Row */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Aesthetics</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={colorPickerRef}>
                      <button onClick={() => setShowColorPicker(p => !p)} className="w-full flex items-center justify-between bg-[#1a1a1a] border border-white/10 hover:border-blue-500/40 rounded-none px-2.5 py-1.5 text-xs text-white transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-none shadow-inner" style={{ backgroundColor: dialogThemeColor }}></span>
                          <span className="font-mono text-white/80">{dialogThemeColor}</span>
                        </div>
                        <ChevronDown size={12} className="text-white/40" />
                      </button>

                      {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-none p-3 shadow-2xl w-[200px]">
                          <div className="grid grid-cols-6 gap-1.5 mb-3">
                            {PRESET_COLORS.map(c => (
                              <button key={c} onClick={() => { setDialogThemeColor(c); setShowColorPicker(false); }} className={`w-5 h-5 rounded-none transition-all hover:scale-110 ${dialogThemeColor === c ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111] scale-110' : 'border border-white/10'}`} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <div className="flex gap-2 items-center bg-[#1a1a1a] p-1 rounded-none border border-white/10">
                            <input type="color" value={dialogThemeColor} onChange={e => setDialogThemeColor(e.target.value)} className="w-6 h-6 cursor-pointer bg-transparent border-0 rounded-none" />
                            <input type="text" value={dialogThemeColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setDialogThemeColor(e.target.value); }} className="flex-1 bg-transparent border-none text-xs font-mono text-white outline-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex bg-[#1a1a1a] border border-white/10 rounded-none p-0.5">
                      <button onClick={() => setDialogThemeMode('light')} className={`px-2.5 py-1 rounded-none text-xs font-bold flex items-center gap-1 ${dialogThemeMode === 'light' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}><Sun size={12}/> L</button>
                      <button onClick={() => setDialogThemeMode('dark')} className={`px-2.5 py-1 rounded-none text-xs font-bold flex items-center gap-1 ${dialogThemeMode === 'dark' ? 'bg-[#222] text-white' : 'text-white/40 hover:text-white'}`}><Moon size={12}/> D</button>
                    </div>
                  </div>

                  <select value={selectedArtDirection} onChange={(e) => setSelectedArtDirection(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                    {ART_DIRECTIONS.map(art => <option key={art.id} value={art.id}>{art.name}</option>)}
                  </select>
                </div>

                {/* AI Engine — which model builds the storefront. */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={11} className="text-blue-500" /> AI Engine
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AI_PROVIDERS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAiProvider(p.id)}
                        title={p.blurb}
                        className={`flex flex-col items-center justify-center gap-0.5 rounded-none border px-2 py-2 text-xs font-bold transition-all ${aiProvider === p.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 bg-[#1a1a1a] text-white/50 hover:text-white hover:border-white/20'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 leading-tight">
                    {AI_PROVIDERS.find(p => p.id === aiProvider)?.blurb}
                  </p>
                </div>

                {/* Output format — legacy JSX component vs structured JSON doc. */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Template format</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[['jsx', 'JSX (classic)'], ['json', 'JSON (structured)']].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setOutputFormat(id)}
                        className={`rounded-none border px-2 py-2 text-xs font-bold transition-all ${outputFormat === id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 bg-[#1a1a1a] text-white/50 hover:text-white hover:border-white/20'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 leading-tight">
                    {outputFormat === 'json'
                      ? 'Structured document (tokens + sections, validated) rendered by the fixed engine — safer, cheaper, no code compile.'
                      : 'Raw React component compiled in the sandbox — maximum freedom, legacy format.'}
                  </p>
                </div>

                {/* Layout Blueprint */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Layout Structure</h3>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 pt-1">
                    {layoutBlueprints.map(bp => (
                      <button
                        key={bp.id}
                        onClick={() => setSelectedBlueprint(bp.id)}
                        className={`shrink-0 w-[90px] flex flex-col rounded-none border transition-all overflow-hidden ${selectedBlueprint === bp.id ? 'border-blue-500 bg-blue-500/5 scale-[1.02]' : 'border-white/10 bg-[#1a1a1a]'}`}
                      >
                        <div className="w-full h-[60px] p-1.5">{bp.icon}</div>
                        <div className={`w-full px-1 py-1 text-center text-xs font-bold leading-tight border-t ${selectedBlueprint === bp.id ? 'text-blue-500 border-blue-500/20' : 'text-white/50 border-white/5'}`}>{bp.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Pages — built into the generated site as its own
                    tab (#/page/<slug>), never an independent route. */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={11} className="text-blue-500" /> Custom Pages
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddPage((v) => !v)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Add page
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 leading-tight">
                    About, FAQ, Shipping policy… built INTO the generated site as its own tab — never a separate page, so there's nothing to cause routing issues.
                  </p>

                  {pages.length > 0 && (
                    <div className="space-y-1">
                      {pages.map((p) => (
                        <div key={p.slug} className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 px-2.5 py-1.5">
                          <span className="text-xs font-semibold text-white truncate" title={p.title}>{p.title}</span>
                          <button type="button" onClick={() => deletePage(p.slug)} className="text-white/30 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddPage && (
                    <div className="bg-[#1a1a1a] border border-white/10 p-3 space-y-2">
                      <input
                        value={newPageTitle}
                        onChange={(e) => setNewPageTitle(e.target.value)}
                        placeholder="Page title (e.g. About Us)"
                        className="w-full bg-[#111] border border-white/10 rounded-none px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
                      />
                      <textarea
                        rows={3}
                        value={newPageContent}
                        onChange={(e) => setNewPageContent(e.target.value)}
                        placeholder="What should this page say?"
                        className="w-full bg-[#111] border border-white/10 rounded-none px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 resize-none"
                      />
                      <button
                        type="button"
                        onClick={addPage}
                        disabled={addingPage || !newPageTitle.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-none text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {addingPage ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add page
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload & Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Design Commands</h3>
                    <label className="flex items-center gap-1.5 cursor-pointer group bg-white/5 hover:bg-white/10 px-2 py-1 rounded-none transition-colors border border-white/10">
                      <input type="checkbox" checked={isEditingMode} onChange={(e) => setIsEditingMode(e.target.checked)} className="accent-blue-500 w-3 h-3 cursor-pointer rounded-none" />
                      <span className="text-xs font-bold text-white/70 group-hover:text-white uppercase tracking-wider">Edit Current Design</span>
                    </label>
                  </div>
                  
                  {previewImg ? (
                    <div className="relative group w-full rounded-none overflow-hidden border border-white/20">
                      <img src={previewImg} className="w-full h-20 object-cover opacity-80" alt="preview" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setPreviewImg(null); setRawBase64(null); setImageMimeType(null); }} className="bg-red-500 text-white px-3 py-1 rounded-none text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform">
                          <X size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-16 border border-dashed border-white/10 hover:border-blue-500/40 bg-[#1a1a1a] rounded-none flex flex-col items-center justify-center cursor-pointer group">
                      <span className="text-xs text-white/40 group-hover:text-blue-500 font-medium flex items-center gap-2"><FileUp size={14}/> Upload Mockup (Opt)</span>
                      <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={onFileChange} />
                    </label>
                  )}

                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder={isEditingMode ? "Describe what to change in the currently visible design (e.g., 'Make the header blue' or 'Move search to the left')..." : "e.g., Generate a neon cyberpunk layout with floating cards..."}
                    className="w-full bg-[#1a1a1a] border border-white/10 focus:border-blue-500/50 rounded-none text-sm text-white p-2.5 outline-none resize-none h-24 custom-scrollbar placeholder:text-white/25 transition-colors"
                  />
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-500 p-3 rounded-none text-xs leading-relaxed font-medium">
                  Settings left on "Let AI Decide" will automatically adapt to your chosen Design Vibe.
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Border Style / Radius</p>
                  <select value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Sharp 0px borders (rounded-none)">Sharp Corners (0px)</option>
                    <option value="Subtle rounded corners (rounded-md)">Subtle Rounded (4px)</option>
                    <option value="Smooth rounded corners (rounded-xl)">Smooth Rounded (12px)</option>
                    <option value="Fully rounded pill-shapes (rounded-full)">Pill-shaped (Fully Rounded)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Typography</p>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Sans-serif, clean and modern (font-sans)">Sans-serif (Modern)</option>
                    <option value="Serif, elegant and luxurious (font-serif)">Serif (Editorial)</option>
                    <option value="Monospace, technical and brutalist (font-mono)">Monospace (Tech)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Background Style</p>
                  <select value={bgStyle} onChange={(e) => setBgStyle(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Solid flat colors">Solid Flat</option>
                    <option value="Soft gradients (bg-gradient-to-br)">Soft Mesh Gradients</option>
                    <option value="Heavy glassmorphism with backdrop blurs">Glassmorphism</option>
                    <option value="Grainy or noisy textured backgrounds">Grainy Textures</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Animations</p>
                  <select value={animationFeel} onChange={(e) => setAnimationFeel(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Subtle hovers and opacities">Subtle Fades</option>
                    <option value="None. Static, brutalist feel.">None (Static)</option>
                    <option value="Bouncy and playful scaling on hover">Bouncy Scale</option>
                    <option value="Extreme 3D tilts and large shadows">Extreme 3D</option>
                  </select>
                </div>
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="p-5 bg-[#111] border-t border-white/10 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading || (!isEditingMode && !profileComplete)}
              title={!isEditingMode && !profileComplete ? `Complete your store profile first: ${missingProfile.join(', ')}` : ''}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-none text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:-translate-y-0.5"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? 'Compiling AI...' : (isEditingMode ? 'Apply Changes to Design' : 'Generate New Design')}
            </button>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#050505] p-6 flex items-center justify-center overflow-hidden relative">
          
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <span className="bg-black/80 text-blue-500 text-xs font-bold px-2.5 py-1 rounded-none uppercase tracking-wider border border-white/10 shadow-lg backdrop-blur-md flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse"></div>
              {showCode ? 'Source Code' : 'Live Preview'}
            </span>

            {!showCode && (
              <div className="flex bg-black/80 border border-white/10 rounded-none overflow-hidden backdrop-blur-md shadow-lg p-0.5 gap-0.5">
                {[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setViewport(v)}
                    className={`p-1 rounded-none transition-colors ${viewport === v ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Icon size={12} />
                  </button>
                ))}
              </div>
            )}

            {!showCode && (
              <button
                onClick={() => { setEditMode(e => !e); setActiveText(null); setImageEdit(null); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-bold border backdrop-blur-md shadow-lg transition-colors ${editMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/80 text-white/70 border-white/10 hover:text-white'}`}
                title="Click text or images in the preview to edit them"
              >
                <Wand2 size={12} /> {editMode ? 'Editing — click text / images' : 'Visual Edit'}
              </button>
            )}
          </div>

          {showCode ? (
            <div className="w-full max-w-[1280px] h-full overflow-hidden rounded-none border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 bg-[#1e1e1e] relative flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#181818] shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  {outputFormat === 'json' ? 'Template document (JSON) — editable' : 'Template source — editable · paste your own to replace'}
                </span>
                <button
                  onClick={() => {
                    if (outputFormat === 'json') {
                      const { doc, errors } = parseTemplateJson(jsonText);
                      if (!doc) {
                        setToastMsg(`⚠️ Invalid document: ${errors[0] || 'unknown error'}`);
                        setTimeout(() => setToastMsg(''), 5000);
                        return;
                      }
                      setJsonDoc(doc);
                    }
                    setShowCode(false);
                  }}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Apply & view render →
                </button>
              </div>
              <textarea
                value={outputFormat === 'json' ? jsonText : code}
                onChange={(e) => (outputFormat === 'json' ? setJsonText(e.target.value) : setCode(e.target.value))}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={outputFormat === 'json'
                  ? 'Generate a design to see its JSON document here — or paste a valid template document.'
                  : 'Paste or edit the full template component here. It must export a component named App.'}
                className="w-full flex-1 bg-transparent text-[#d4d4d4] font-mono text-sm leading-relaxed p-6 outline-none resize-none custom-scrollbar"
              />
            </div>
          ) : (
            <div className="w-full h-full animate-in zoom-in-95 duration-500 relative flex items-center justify-center">
              <LiveCodePreview code={code} viewMode={viewport} storeProfile={storeProfile} themeColor={dialogThemeColor} editMode={outputFormat === 'jsx' && editMode} onVisualEdit={handleVisualEdit} format={outputFormat} jsonDoc={jsonDoc} pages={pages} />

              {/* Hidden input for replacing an image by upload */}
              <input
                ref={imgReplaceRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUploadReplace(f); e.target.value=''; }}
              />

              {/* Text AI toolbar — shown while a text element is selected */}
              {editMode && activeText && !imageEdit && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#111] border border-white/10 rounded-none px-2 py-1.5 shadow-2xl backdrop-blur-md">
                  <span className="text-[11px] text-white/40 max-w-[160px] truncate pr-1">“{activeText}”</span>
                  {[['Rephrase', 'Rephrase'], ['Shorten', 'Shorten'], ['Expand', 'Expand']].map(([label, instr]) => (
                    <button
                      key={label}
                      type="button"
                      disabled={editBusy}
                      onClick={() => rewriteActiveText(instr)}
                      className="flex items-center gap-1 px-2 py-1 rounded-none text-[11px] font-bold text-white/80 hover:bg-blue-600 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      {editBusy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} {label}
                    </button>
                  ))}
                  <button type="button" onClick={() => setActiveText(null)} className="p-1 text-white/40 hover:text-white"><X size={12} /></button>
                </div>
              )}

              {/* Image edit popover — opens on image click even outside Visual
                  Edit mode, since hover-to-replace is always available. */}
              {imageEdit && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40" onClick={() => setImageEdit(null)}>
                  <div className="bg-[#111] border border-white/10 rounded-none p-4 w-[320px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white">Replace image</h4>
                      <button onClick={() => setImageEdit(null)} className="text-white/40 hover:text-white"><X size={16} /></button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageEdit.src} alt="" className="w-full h-28 object-cover border border-white/10 mb-3" />
                    <button
                      type="button"
                      disabled={editBusy}
                      onClick={() => imgReplaceRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-none text-xs font-bold bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                      {imageAction === 'upload'
                        ? <><Loader2 size={13} className="animate-spin" /> Uploading to storage…</>
                        : <><FileUp size={13} /> Upload an image</>}
                    </button>
                    <textarea
                      rows={2}
                      value={imgOverview}
                      onChange={(e) => setImgOverview(e.target.value)}
                      placeholder="Describe the image to find on Unsplash (optional)…"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-2.5 py-1.5 text-[12px] text-white focus:outline-none focus:border-blue-500/50 resize-none mb-2"
                    />
                    <button
                      type="button"
                      disabled={editBusy}
                      onClick={handleImageGenerateReplace}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-none text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {imageAction === 'search'
                        ? <><Loader2 size={13} className="animate-spin" /> Finding photo…</>
                        : <><Sparkles size={13} /> Find on Unsplash</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post-generation image review — surfaced the instant a design finishes
          so the vendor knows exactly which photos are AI stock placeholders. */}
      {showImageReview && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-white/10 rounded-none w-full max-w-[640px] max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon size={16} className="text-blue-500" /> Your design is ready — review its images
                </h3>
                <p className="text-[12px] text-white/50 mt-1.5 max-w-[480px] leading-relaxed">
                  It uses {dummyImages.length} stock placeholder image{dummyImages.length !== 1 ? 's' : ''} (not your own photos). Swap any of them now, or skip — you can always replace them later from Visual Edit.
                </p>
              </div>
              <button onClick={() => setShowImageReview(false)} className="text-white/40 hover:text-white shrink-0"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 custom-scrollbar">
              {dummyImages.map((d) => (
                <div key={d.url} className="relative border border-white/10 bg-[#1a1a1a] group aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.newUrl || d.url} alt="" className="w-full h-full object-cover" />
                  {d.replaced ? (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-green-400 flex items-center gap-1 bg-black/60 px-2 py-1"><Check size={12} /> Replaced</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setReviewTarget(d.url); setReviewQuery(''); }}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-white px-2.5 py-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Replace</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
              <span className="text-[11px] text-white/40">{dummyImages.filter((d) => d.replaced).length} of {dummyImages.length} replaced</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowImageReview(false)} className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors">
                  Skip for now
                </button>
                <button onClick={() => setShowImageReview(false)} className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-none transition-colors">
                  Done
                </button>
              </div>
            </div>
          </div>

          {/* Per-image replace popover (upload or AI-picked stock photo) */}
          {reviewTarget && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" onClick={() => setReviewTarget(null)}>
              <div className="bg-[#111] border border-white/10 rounded-none p-4 w-[320px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">Replace image</h4>
                  <button onClick={() => setReviewTarget(null)} className="text-white/40 hover:text-white"><X size={16} /></button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reviewTarget} alt="" className="w-full h-28 object-cover border border-white/10 mb-3" />
                <button
                  type="button"
                  disabled={reviewBusy}
                  onClick={() => reviewUploadRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-none text-xs font-bold bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {reviewAction === 'upload'
                    ? <><Loader2 size={13} className="animate-spin" /> Uploading to storage…</>
                    : <><FileUp size={13} /> Upload an image</>}
                </button>
                <textarea
                  rows={2}
                  value={reviewQuery}
                  onChange={(e) => setReviewQuery(e.target.value)}
                  placeholder="Describe the image to find on Unsplash (optional)…"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-none px-2.5 py-1.5 text-[12px] text-white focus:outline-none focus:border-blue-500/50 resize-none mb-2"
                />
                <button
                  type="button"
                  disabled={reviewBusy}
                  onClick={handleReviewUnsplash}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-none text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {reviewAction === 'search'
                    ? <><Loader2 size={13} className="animate-spin" /> Finding photo…</>
                    : <><Sparkles size={13} /> Find on Unsplash</>}
                </button>
              </div>
            </div>
          )}

          <input
            ref={reviewUploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReviewUpload(f); e.target.value = ''; }}
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}}/>
    </div>
  );
};

// --- DEFAULT DASHBOARD PREVIEWER ---
const StoreLivePreview = ({ layout, color, title, logo, showFlashSale, themeMode }) => {
  const bg   = themeMode === 'dark' ? '#111' : '#ffffff';
  const card = themeMode === 'dark' ? '#1a1a1a' : '#ffffff';
  const border = themeMode === 'dark' ? '#333' : '#e5e7eb';
  const text = themeMode === 'dark' ? '#fff' : '#000';
  const muted = themeMode === 'dark' ? '#555' : '#d1d5db';

  return (
    <div className="w-full h-full min-h-[500px] border border-gray-200 rounded-none flex flex-col overflow-hidden sticky top-6" style={{ background: bg }}>
      <div className="h-10 flex items-center px-4 gap-2 border-b shrink-0" style={{ background: card, borderColor: border }}>
        <div className="w-3 h-3 rounded-none bg-red-400"></div>
        <div className="w-3 h-3 rounded-none bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-none bg-green-400"></div>
        <div className="ml-4 flex-1 h-5 rounded-none border" style={{ background: card, borderColor: border }}></div>
      </div>

      <div className="flex-1 overflow-hidden pointer-events-none select-none relative flex flex-col">
        {(layout === 'Classic' || layout === 'Custom_AI') && (
          <div className="flex flex-col h-full flex-1 w-full items-center" style={{ background: bg }}>
            <div className="w-full flex flex-col">
              <div className="h-10 border-b flex items-center px-4 gap-3 w-full" style={{ background: card, borderColor: border }}>
                {logo
                  ? <img src={logo} alt="Logo" className="w-5 h-5 object-cover rounded-none" />
                  : <div className="w-5 h-5 rounded-none text-xs text-white flex items-center justify-center font-bold" style={{ backgroundColor: color }}>S</div>
                }
                <div className="w-20 h-2 rounded-none" style={{ background: muted }}></div>
              </div>
              <div className="h-32 w-full flex items-center justify-center relative overflow-hidden" style={{ background: themeMode === 'dark' ? '#111' : '#f9fafb', borderBottom: `1px solid ${border}` }}>
                <div className="flex flex-col items-center relative z-10">
                  <div className="text-sm font-bold mb-2" style={{ color: text }}>{title}</div>
                  <div className="w-24 h-4 rounded-none" style={{ backgroundColor: color }}></div>
                </div>
              </div>
              <div className="p-4 w-full">
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="aspect-[4/5] border rounded-none p-2 flex flex-col" style={{ background: card, borderColor: border }}>
                      <div className="flex-1 rounded-none mb-2" style={{ background: muted }}></div>
                      <div className="w-full h-1.5 rounded-none mb-1.5" style={{ background: muted }}></div>
                      <div className="w-1/2 h-2 rounded-none" style={{ backgroundColor: color }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {layout === 'Custom_AI' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col text-white z-10 backdrop-blur-sm">
                <Wand2 size={40} className="text-blue-500 mb-3 animate-pulse"/>
                <p className="text-sm font-bold uppercase tracking-wider">Custom AI Theme</p>
                <p className="text-xs text-gray-500 mt-2">Rendered at runtime</p>
              </div>
            )}
          </div>
        )}

        {layout === 'Modern' && (
          <div className="flex flex-col h-full p-4 w-full" style={{ background: bg }}>
            <div className="flex gap-4 h-36 mb-4">
              <div className="w-1/2 rounded-none border" style={{ background: card, borderColor: border }}></div>
              <div className="w-1/2 flex flex-col justify-center">
                <div className="text-sm font-bold mb-3" style={{ color: text }}>{title}</div>
                <div className="w-20 h-5 rounded-none" style={{ backgroundColor: color }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              {[1,2].map(i => (
                <div key={i} className="rounded-none p-3 aspect-square border flex flex-col items-center justify-center" style={{ background: card, borderColor: border }}>
                  <div className="w-12 h-12 rounded-none mb-3" style={{ background: muted }}></div>
                  <div className="w-1/2 h-2 rounded-none" style={{ background: muted }}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {layout === 'Bold' && (
          <div className="flex flex-col h-full border-b-8 w-full" style={{ borderColor: color, background: bg }}>
            <div className="h-40 flex flex-col items-center justify-center p-6 border-b" style={{ background: '#111', borderColor: color }}>
              <div className="text-xl font-bold uppercase tracking-tight text-white">{title}</div>
              <div className="mt-4 w-24 h-5 bg-white rounded-none"></div>
            </div>
            <div className="p-6 flex flex-col gap-4 w-full">
              {[1,2].map(i => (
                <div key={i} className="flex gap-4 p-3 border rounded-none" style={{ borderColor: border }}>
                  <div className="w-16 h-16 rounded-none" style={{ background: muted }}></div>
                  <div className="flex flex-col justify-center w-full">
                    <div className="w-3/4 h-3 mb-2 rounded-none" style={{ background: text }}></div>
                    <div className="w-1/2 h-3 rounded-none" style={{ backgroundColor: color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!['Classic', 'Modern', 'Bold', 'Custom_AI'].includes(layout) && (
          <div className="flex items-center justify-center h-full text-center p-6 w-full">
            <div>
              <LayoutTemplate size={48} className="mx-auto mb-4" style={{ color: muted }} />
              <p className="text-base font-bold mb-1" style={{ color: muted }}>{layout} Template</p>
              <p className="text-xs" style={{ color: muted }}>Theme Color: <span style={{ color }}>■</span> {color}</p>
            </div>
          </div>
        )}

        {showFlashSale && (
          <div className="absolute top-10 left-0 right-0 bg-red-500 text-white text-xs font-bold py-1.5 px-4 flex justify-between items-center z-50">
            <span className="flex items-center gap-1"><Zap size={10}/> FLASH SALE</span>
            <span>02:45:00</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ThemePage() {
  const [isLoading, setIsLoading]           = useState(true);
  const [isSaving, setIsSaving]             = useState(false);
  const [message, setMessage]               = useState({ type: '', text: '' });
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  // Arriving from the onboarding wizard's "Design my site" step → open the
  // builder straight away for a continuous flow.
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('onboarding') === '1') {
      setIsAiDialogOpen(true);
    }
  }, []);

  const [storeId, setStoreId]           = useState(null);
  const [storeData, setStoreData]       = useState({ title: 'My Store', logo: '' });
  const [layoutStyle, setLayoutStyle]   = useState('Classic');
  const [themeColor, setThemeColor]     = useState('#161823');
  const [themeMode, setThemeMode]       = useState('light');
  const [flashSalesEnabled, setFlashSalesEnabled] = useState(false);
  const [themeTemplate, setThemeTemplate] = useState(null);
  const [templateFormat, setTemplateFormat] = useState('jsx');
  const [templateJson, setTemplateJson]     = useState(null);

  const layoutOptions = [
    { name: 'Classic',   desc: 'Clean & reliable. Great for electronics and mixed inventories.',       image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80&fit=crop&h=300' },
    { name: 'Modern',    desc: 'Minimalist & tech-focused with split-screen imagery.',               image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80&fit=crop&h=300' },
    { name: 'Bold',      desc: 'High contrast & stark. Perfect for industrial or machinery.',        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80&fit=crop&h=300' },
    { name: 'Furniture', desc: 'Elegant serif typography & soft editorial photography.',             image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&q=80&fit=crop&h=300' },
    { name: 'Apparel',   desc: 'Fashion-forward lookbook style with massive imagery.',               image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80&fit=crop&h=300' },
    { name: 'Beauty',    desc: 'Soft edges, circular framing, and pastel-friendly.',                 image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&fit=crop&h=300' },
    { name: 'Minimal',   desc: 'Extreme whitespace. Let the products speak for themselves.',         image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&q=80&fit=crop&h=300' },
    { name: 'Tech',      desc: 'Dark mode native, sleek borders, and specification grids.',          image: 'https://images.unsplash.com/photo-1550009158-9a37b35c09e5?w=500&q=80&fit=crop&h=300' }
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes  = await fetch('/api/stores');
        if (!sessionRes.ok) throw new Error("Failed to fetch session store");
        const sessionData = await sessionRes.json();
        if (sessionData.hasStore && sessionData.store) {
          const id = sessionData.store._id || sessionData.store.id;
          setStoreId(id);
          const s = sessionData.store;
          setStoreData({
            title:        s.title || 'My Store',
            logo:         s.logo || '',
            logoDescription:  s.logoDescription || '',
            logoDescribedFor: s.logoDescribedFor || '',
            banner:       s.banner || (s.bannerImages && s.bannerImages[0]) || '',
            description:  s.description || '',
            industry:     s.industry || '',
            businessType: s.businessType || 'products',
            serviceType:  s.serviceType || null,
            contactEmail: s.contact?.email || '',
            contactPhone: s.contact?.phone || '',
          });
          const themeRes = await fetch(`/api/stores/${id}`);
          if (themeRes.ok) {
            const data = await themeRes.json();
            setLayoutStyle(data.layoutStyle || 'Classic');
            setThemeColor(data.themeColor || '#161823');
            setThemeMode(data.themeMode || 'light');
            setFlashSalesEnabled(data.flashSales || false);
            setThemeTemplate(data.themeTemplate || null);
            setTemplateFormat(data.templateFormat || 'jsx');
            setTemplateJson(data.templateJson || null);
          }
        }
      } catch (err) {
        console.error("Failed to initialize", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!storeId) { setMessage({ type: 'error', text: 'Store ID missing. Cannot save.' }); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutStyle: layoutStyle === 'Custom_AI' ? 'Custom_AI' : layoutStyle,
          themeColor, themeMode, flashSales: flashSalesEnabled,
        })
      });
      if (res.ok) setMessage({ type: 'success', text: `Theme published live!` });
      else throw new Error('Save failed');
    } catch {
      setMessage({ type: 'error', text: 'Failed to save theme settings.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleAiTemplateSave = async (payload, legacyColor, legacyMode) => {
    if (!storeId) return;
    // Accept both the new payload object ({ format, code, json, color, mode })
    // and the legacy (code, color, mode) positional signature.
    const p = typeof payload === 'string'
      ? { format: 'jsx', code: payload, json: null, color: legacyColor, mode: legacyMode }
      : (payload || {});

    setLayoutStyle('Custom_AI');
    if (p.color) setThemeColor(p.color);
    if (p.mode)  setThemeMode(p.mode);

    const body = { layoutStyle: 'Custom_AI', themeColor: p.color, themeMode: p.mode };
    if (p.format === 'json' && p.json) {
      // Structured document — saved to the DB as JSON (templateJson), rendered
      // by the fixed runtime on the live store.
      body.templateFormat = 'json';
      body.templateJson   = p.json;
      setTemplateFormat('json');
      setTemplateJson(p.json);
    } else {
      body.templateFormat = 'jsx';
      body.themeTemplate  = p.code || '';
      setTemplateFormat('jsx');
      setThemeTemplate(p.code || '');
    }

    await fetch(`/api/stores/${storeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setMessage({ type: 'success', text: p.format === 'json' ? 'AI template saved as structured JSON & applied!' : 'AI template saved & applied!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-black w-8 h-8" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black">Design Studio</h1>
            <p className="text-sm text-gray-500 mt-1">Customize your storefront architecture and visual identity.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiDialogOpen(true)}
              className="bg-black hover:bg-blue-600 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} className="text-blue-500"/> Build with AI
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Publish Theme'}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-none border text-sm font-semibold flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-500'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[55%] space-y-6">

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                <LayoutTemplate size={18} className="text-black" />
                <h2 className="text-base font-bold text-black">Store Architecture</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                <div
                  onClick={() => setIsAiDialogOpen(true)}
                  className={`group relative overflow-hidden rounded-none border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-6 text-center h-[170px] ${
                    layoutStyle === 'Custom_AI' ? 'border-blue-600 bg-blue-50' : 'border-transparent bg-black hover:shadow-sm'
                  }`}
                >
                  <div className="w-12 h-12 bg-white/10 text-white rounded-none flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10">
                    <Code size={24} className="text-blue-500"/>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1 relative z-10 flex items-center gap-2">
                    {layoutStyle === 'Custom_AI' && <CheckCircle2 size={16} className="text-blue-500" />}
                    AI Custom Build
                  </h4>
                  <p className="text-xs text-gray-400 relative z-10 px-2">{themeTemplate ? 'Custom template saved. Click to edit.' : 'Generate a unique store design with AI.'}</p>
                </div>

                {layoutOptions.map((layout) => (
                  <div
                    key={layout.name}
                    onClick={() => setLayoutStyle(layout.name)}
                    className={`group relative overflow-hidden rounded-none border cursor-pointer transition-all ${
                      layoutStyle === layout.name ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <div className="h-28 w-full bg-gray-50 relative border-b border-gray-200">
                      <img src={layout.image} alt={layout.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <h4 className="font-semibold text-white text-sm">{layout.name}</h4>
                        {layoutStyle === layout.name && <CheckCircle2 size={16} className="text-blue-600" fill="white" />}
                      </div>
                    </div>
                    <div className="p-3 bg-white"><p className="text-xs text-gray-500 leading-relaxed">{layout.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                <Palette size={18} className="text-black" />
                <h2 className="text-base font-bold text-black">Brand Identity</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Primary Color</p>
                  <div className="flex flex-wrap gap-2.5 mb-4">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`w-10 h-10 rounded-none flex items-center justify-center transition-all ${
                          themeColor === color ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-105 border border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {themeColor === color && <CheckCircle2 size={16} className="text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:w-[200px]">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Display Mode</p>
                  <div className="flex bg-gray-50 rounded-none p-1 border border-gray-300">
                    <button onClick={() => setThemeMode('light')} className={`flex-1 py-2.5 rounded-none text-sm font-bold flex items-center justify-center gap-2 transition-colors ${themeMode === 'light' ? 'bg-white border border-gray-200 text-black' : 'text-gray-500 hover:text-black'}`}>
                      <Sun size={14}/> Light
                    </button>
                    <button onClick={() => setThemeMode('dark')} className={`flex-1 py-2.5 rounded-none text-sm font-bold flex items-center justify-center gap-2 transition-colors ${themeMode === 'dark' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}>
                      <Moon size={14}/> Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:w-[45%]">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Preview</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-none" style={{ backgroundColor: themeColor }}></span>
                  <span className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-none text-black font-bold flex items-center gap-1.5">
                    {themeMode === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                    {layoutStyle === 'Custom_AI' ? 'Custom AI' : layoutStyle}
                  </span>
                </div>
              </div>
              <StoreLivePreview layout={layoutStyle} color={themeColor} title={storeData.title} logo={storeData.logo} showFlashSale={flashSalesEnabled} themeMode={themeMode} />
            </div>
          </div>
        </div>
      </div>

      {isAiDialogOpen && (
        <AIBuilderDialog
          initialCode={themeTemplate || INITIAL_REACT_CODE}
          initialFormat={templateFormat}
          initialJson={templateJson}
          onSave={handleAiTemplateSave}
          onClose={() => setIsAiDialogOpen(false)}
          globalThemeColor={themeColor}
          globalThemeMode={themeMode}
          storeProfile={storeData}
          onLogoDescribed={(desc, logoUrl) => setStoreData((prev) => ({ ...prev, logoDescription: desc, logoDescribedFor: logoUrl }))}
        />
      )}
    </div>
  );
}