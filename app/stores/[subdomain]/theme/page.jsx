"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Palette, Save, Loader2, CheckCircle2, LayoutTemplate,
  Zap, Sparkles, X, ArrowLeft, Code, ExternalLink, 
  Monitor, Smartphone, Tablet, ChevronDown, Sun, Moon, 
  Wand2, Settings2, FileUp, Link as LinkIcon
} from 'lucide-react';
import { sanitizeTemplateCode } from '@/lib/templateSanitize';
import { uploadFileToFirebase } from '@/lib/firebaseLib';
import { generateTemplateText, searchUnsplashImage, unsplashSourceUrl } from '@/lib/aiProvider';

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
  var hovered=null;
  document.addEventListener('mouseover', function(e){
    if(hovered){ hovered.style.outline=''; hovered.style.cursor=''; }
    var el=e.target;
    if(isTextLeaf(el) || el.tagName==='IMG'){ el.style.outline='2px solid #2563EB'; el.style.outlineOffset='1px'; el.style.cursor='text'; hovered=el; }
  });
  document.addEventListener('click', function(e){
    var a=e.target.closest && e.target.closest('a'); if(a) e.preventDefault();
    var el=e.target;
    if(el.tagName==='IMG'){
      e.preventDefault(); e.stopPropagation();
      parent.postMessage({ __olaEdit:true, type:'image-edit', src: el.getAttribute('src') }, '*');
      return;
    }
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
// so it can be attached to the AI request — letting the model actually SEE the
// real logo/banner instead of just receiving a URL string it can't read.
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

// --- CORE AI CODE GENERATION ENGINE ---
const generateCodeAI = async (
  promptText, imageBase64, imageMimeType, currentCode,
  categoryContext, blueprintPrompt, themeColor, themeMode, artDirection,
  advancedConfig, isEditingExplicit, business = {}
) => {
  const { bgStyle, fontFamily, borderRadius, animationFeel } = advancedConfig;

  // ── Business brief — makes generation specific to THIS vendor/industry ──────
  const bt = business.businessType || 'products';
  const st = business.serviceType || null;
  const isBoth = bt === 'both';

  // Industry-specific blueprint so a hotel gets a hotel site, not a product grid.
  const SITE_BRIEFS = {
    hotel:   `Build a HOTEL / ACCOMMODATION website. Hero with a Date / Guests check-in–check-out availability picker, ROOM TYPES as cards (image, nightly price, capacity, a clear "Book Now" button), an AMENITIES section (Wi-Fi, pool, parking, breakfast, AC…), check-in / check-out info, a photo GALLERY, and a location block. Do NOT build a generic product grid.`,
    salon:   `Build a SALON / SPA website. A SERVICE MENU (treatment name, duration, price) with "Book Appointment" CTAs, a stylists/team section, before/after or gallery, and opening hours.`,
    medical: `Build a CLINIC / DOCTOR website. Specialties & services, practitioner profiles, a prominent "Book Appointment" flow, consultation info, opening hours, and trust/credentials.`,
    tickets: `Build an EVENTS / TICKETS website. Featured EVENTS with date, time and venue, TICKET TIERS (price + "Buy Tickets"), and a schedule/lineup section.`,
    venue:   `Build a VENUE / EVENT-SPACE RENTAL website. Spaces as cards (capacity, hourly/day rate, amenities), a "Request Booking" CTA, gallery, and location.`,
    generic: `Build a SERVICES website. Services as cards (what's included + pricing) with "Book" / "Request a Quote" CTAs, an about section, and trust signals.`,
  };
  const productBrief = `Build an online SHOP. A product grid (cards with image, name, price, add-to-cart), working local search and pagination, and category navigation.`;

  let siteBrief;
  if (bt === 'products')      siteBrief = productBrief;
  else if (isBoth)           siteBrief = `${SITE_BRIEFS[st] || SITE_BRIEFS.generic}\n   PLUS, because this business ALSO sells physical items, include a clearly-labelled "Shop" tab/section in the top navigation with a product grid (image, name, price, add-to-cart). Buyers must be able to switch between the ${st || 'service'} experience and the Shop.`;
  else                        siteBrief = SITE_BRIEFS[st] || SITE_BRIEFS.generic;
  
  const isEditing = isEditingExplicit || (promptText && currentCode && promptText.toLowerCase().includes("change"));

  const prompt = `
You are an avant-garde, world-class creative frontend engineer known for building wildly unique, award-winning (Awwwards level) custom websites.
Your mission: generate a COMPLETE, mind-blowing, UNIQUE React component (JSX) for the SPECIFIC business described below — every vendor must get a site tailored to THEIR business, never a generic template.

${isEditing ? `CRITICAL EDITING INSTRUCTION: The user wants to MODIFY their current design. I am providing the CURRENT SOURCE CODE below. Apply their requested changes specifically to this code without breaking existing logic.\n\n--- CURRENT CODE ---\n${currentCode}\n--- END CURRENT CODE ---\n` : ''}

=== BUSINESS BRIEF (build the site for THIS business) ===
- Store name: ${business.storeName || 'this store'}
- Industry / category: ${categoryContext || business.industry || 'General'}
- Business type: ${bt}${st ? ` (service type: ${st})` : ''}
- About / description: ${business.description || '(none provided — infer from the industry)'}
- Contact: ${business.contactEmail || ''} ${business.contactPhone || ''}
- Logo: ${business.logoBase64 ? `attached below as an image at URL "${business.logo}" — render THIS exact logo (use the URL as the src). The logo is the SOLE creative anchor: derive the entire palette, mood, typography pairing and art direction FROM it so the whole design feels inspired by and built around this logo` : (business.logo ? `available at "${business.logo}" — use this URL as the logo src and design the palette around it` : '(none — render a tasteful placeholder using the store name initial + brand color)')}
- Hero / section imagery: there is NO uploaded banner. For the hero background and every other photographic image, use REAL Unsplash photos via deterministic source URLs of the form \`${unsplashSourceUrl('RELEVANT KEYWORDS', 1600, 900)}\` — replace the keywords with terms specific to THIS business/industry (e.g. for a hotel: "luxury hotel lobby", for a salon: "modern hair salon"). Vary the keywords per section so images differ.

=== WHAT TO BUILD ===
${siteBrief}

CRITICAL ARCHITECTURE RULES (STRICT COMPLIANCE):
1. BREAK THE GRID: avoid a boring Bootstrap-style grid. Use overlapping elements, asymmetry, bold typography, advanced Tailwind.
2. UNIQUE CARDS: invent fresh ways to present the items relevant to THIS business (rooms, services, events, or products — per the brief above).
3. IMAGES: use \`object-cover\`; product/room/service images should be a clean aspect ratio. ALWAYS include inline SVG fallbacks for missing images (when \`!item.image\`). For ALL decorative / hero / gallery / section photography use REAL Unsplash source URLs (\`https://source.unsplash.com/<width>x<height>/?<industry keywords>\`). NEVER invent fake/placeholder/lorem image URLs and NEVER use AI-generated image services — only Unsplash.
4. PRIMARY CTAs: use the correct call to action for the business — "Book Now"/"Book Appointment"/"Buy Tickets"/"Request Booking" for services, "Add to Cart" for products.
5. SEARCH/FILTER: where a list of items is shown, implement working local search/filter with React state.
6. DARK FOOTER: include a dark footer (#050505 or similar) with the contact details, location, and legal links.
7. LOGO-DRIVEN DESIGN: use the storeLogo prop in the header (and footer) when present, and let it drive the whole look — palette, accents, and overall feel must be inspired by the logo. For the hero/background imagery use Unsplash photos (rule 3), NOT a storeBanner. Make the design feel bespoke to ${business.storeName || 'the store'}.
8. NO RAW JS COMMENTS IN JSX: NEVER use single-line // comments inside the JSX return block — they render as visible text. Use {/* ... */} only.

DESIGN SYSTEM:
- PRIMARY ACCENT COLOR: ${themeColor} — use THIS color (not any hardcoded blue) for buttons, highlights and accents throughout.
- Color Mode: ${themeMode === 'dark' ? 'DARK MODE (rich dark backgrounds, light text)' : 'LIGHT MODE (clean light backgrounds, dark text)'}
- Macro Layout Blueprint: ${blueprintPrompt ? blueprintPrompt : 'None specified — invent a layout that fits the business.'}
- Art Direction & Vibe: ${artDirection}
- Background: ${bgStyle}
- Typography: ${fontFamily}
- Border Radius: ${borderRadius}
- Animation: ${animationFeel}

OUTPUT RULES:
1. Output ONLY raw React JSX code. No markdown fences. No explanations.
2. Main component MUST be named \`App\` and MUST be a standard React arrow function.
   EXACT SYNTAX REQUIRED: \`const App = ({ storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, services, businessType, serviceType, themeColor }) => { ... }\`
   DO NOT use shorthand object methods like \`App() { ... }\` or class syntax.
3. DO NOT import or use external icon libraries like lucide-react. Create your own minimal inline SVG icon components (Lucide-inspired).
   Example: \`const SearchIcon = ({size=24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;\`
4. DO NOT import React or any module. \`useState\`, \`useEffect\`, \`useMemo\`, \`useRef\` are available globally.
5. Use Tailwind CSS utility classes exclusively.
6. NO DUMMY DATA: render the items strictly from the \`products\`/\`services\` props (these are injected with the store's REAL data at runtime). Do NOT hardcode or fabricate fake sample products, fake names, fake prices, or dummy catalog entries in the source. If a list is empty, render a tasteful empty-state / "coming soon" block (with an on-brand Unsplash hero image per rule 3) instead of inventing items.

DATA CONTRACT (props passed to App):
  storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, services, businessType, serviceType, themeColor

CRITICAL INTERACTION RULE:
On clicking a product, redirect with: \`window.top.location.href = "/p/" + id;\` (the themed, store-scoped product page).

${promptText ? `USER DIRECTIVE / EDIT REQUEST: "${promptText}"` : ''}
`;

  // Attach the store's REAL logo as inline image bytes so the model can "see"
  // it and build the entire palette/identity around it. There is NO banner —
  // hero/section imagery comes from Unsplash (see prompt). An optional user
  // style reference can also be attached.
  const images = [];
  if (business.logoBase64) images.push({ mimeType: business.logoMime || 'image/png', data: business.logoBase64 });
  if (imageBase64 && imageMimeType) images.push({ mimeType: imageMimeType, data: imageBase64 });

  // Provider-switchable (Gemini / DeepSeek v4) — chosen via env in @/lib/aiProvider.
  const text = await generateTemplateText(prompt, images);
  return cleanTemplateText(text);
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

const LiveCodePreview = ({ code, viewMode = 'desktop', storeProfile = {}, themeColor, editMode = false, onVisualEdit }) => {
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
    categories: ["Featured", "New Arrivals", "Trending", "Clearance"],
    products: [
      { id: "1", name: "Minimalist Linen Shirt", price: 85, image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e98?w=500&auto=format&fit=crop" },
      { id: "2", name: "Essential Cotton Crew", price: 45, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop" },
      { id: "3", name: "Relaxed Fit Trousers", price: 120, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop" },
      { id: "4", name: "Classic Wool Coat", price: 295, image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=500&auto=format&fit=crop" },
      { id: "5", name: "Leather Weekend Bag", price: 180, image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=500&auto=format&fit=crop" },
      { id: "6", name: "Silk Blend Scarf", price: 65, image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=500&auto=format&fit=crop" },
      { id: "7", name: "Premium Knit Beanie", price: 35, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&auto=format&fit=crop" },
      { id: "8", name: "Suede Chelsea Boots", price: 210, image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop" }
    ]
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

  const processedCode = useMemo(() => sanitizeTemplateCode(code), [code]);

  const srcDoc = useMemo(() => `
    <!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script>window.react = window.React;</script>
      <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
      <script type="text/babel">
        const { useState, useEffect, useRef, useMemo } = React;
        
        window.lucideFallback = new Proxy({}, { 
          get: (_, prop) => (p) => React.createElement('svg', { 
            width: p.size || 24, height: p.size || 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 
            strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: p.className, style: p.style
          }, React.createElement('circle', {cx: 12, cy: 12, r: 10}), React.createElement('path', {d: 'M12 8v4M12 16h.01'})) 
        });
        
        const dynamicStoreData = ${JSON.stringify(dynamicStoreData)};
        
        ${processedCode}
        
        try {
          ReactDOM.createRoot(document.getElementById('root')).render(<App {...dynamicStoreData} />);
          ${editMode ? `setTimeout(function(){ ${EDITOR_BRIDGE} }, 350);` : ''}
        } catch(err) {
          document.getElementById('root').innerHTML = '<div style="padding:32px;color:#ef4444;font-family:monospace;font-size:13px;"><h2 style="margin-bottom:12px;">Render Error</h2><pre>' + err.toString() + '</pre></div>';
        }
      </script>
    </body></html>
  `, [processedCode, editMode]);

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
        <iframe ref={iframeRef} srcDoc={srcDoc} className="w-full h-full border-0 absolute inset-0 bg-white" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups" title="Live AI Preview" />
      </div>
    </div>
  );
};

// --- AI BUILDER DIALOG (Dark Theme with Blue-600 Primary) ---
const AIBuilderDialog = ({ initialCode, onSave, onClose, globalThemeColor, globalThemeMode, storeProfile = {} }) => {
  const [code, setCode]                   = useState(initialCode);
  const [activeTab, setActiveTab]         = useState('basic');

  // Basic Form State
  const [formNotes, setFormNotes]         = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState('none');
  const [selectedArtDirection, setSelectedArtDirection] = useState('random');
  const [dialogThemeColor, setDialogThemeColor] = useState(globalThemeColor || '#2563EB');
  const [dialogThemeMode, setDialogThemeMode]   = useState(globalThemeMode  || 'light');
  const [showColorPicker, setShowColorPicker]   = useState(false);
  const colorPickerRef = useRef(null);
  

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

  const handleImageUploadReplace = async (file) => {
    if (!file) return;
    setEditBusy(true);
    try {
      const url = await uploadFileToFirebase(file, 'stores/template-images');
      applyImageSrc(url);
    } catch (e) {
      setToastMsg(`⚠️ Upload failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setEditBusy(false); }
  };

  // Swap the image for a real Unsplash photo matching the user's description
  // (or the store's industry). All template imagery is real photography.
  const handleImageGenerateReplace = async () => {
    setEditBusy(true);
    try {
      const query = imgOverview.trim() || storeProfile.industry || storeProfile.title || 'business';
      const url = await searchUnsplashImage(query, 'landscape');
      if (!url) throw new Error('No image found');
      applyImageSrc(url);
    } catch (e) {
      setToastMsg(`⚠️ Image search failed: ${e.message}`); setTimeout(() => setToastMsg(''), 4000);
    } finally { setEditBusy(false); }
  };

  useEffect(() => {
    const handler = (e) => { if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) setShowColorPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openInNewTab = () => {
    const processedCode = sanitizeTemplateCode(code);

    const htmlContent = `<!DOCTYPE html><html><head><script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script>window.react = window.React;</script><script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script>window.onerror=function(m,u,l,c,e){document.getElementById('root').innerHTML='<div style="padding:32px;color:red;font-family:monospace;"><h2>Error</h2><pre>'+m+'</pre></div>';return true;}</script><script type="text/babel">const{useState,useEffect,useRef,useMemo}=React;window.lucideFallback=new Proxy({},{get:(_,prop)=>(p)=>React.createElement('svg',{width:p.size||24,height:p.size||24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round',className:p.className,style:p.style},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('path',{d:'M12 8v4M12 16h.01'}))});const dynamicStoreData={storeName:"",themeColor:"${dialogThemeColor}",categories:["Featured"],products:[{id:"1",name:"Sample Item",price:85}]};try{${processedCode}\nReactDOM.createRoot(document.getElementById('root')).render(<App {...dynamicStoreData}/>);}catch(e){console.error(e)}</script></body></html>`;
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
      contactEmail: storeProfile.contactEmail || '',
      contactPhone: storeProfile.contactPhone || '',
    };

    setLoading(true);
    try {
      // Attach the actual logo as inline image data so the model can SEE the
      // real brand mark and design the whole palette/identity around it. No
      // banner — hero imagery comes from Unsplash.
      const logoImg = await urlToInlineImage(business.logo);
      if (logoImg) { business.logoBase64 = logoImg.data; business.logoMime = logoImg.mimeType; }

      const advancedConfig = {
        bgStyle: bgStyle === 'auto' ? '✨ Let AI Decide based on vibe' : bgStyle,
        fontFamily: fontFamily === 'auto' ? '✨ Let AI Decide based on vibe' : fontFamily,
        borderRadius: borderRadius === 'auto' ? '✨ Let AI Decide based on vibe' : borderRadius,
        animationFeel: animationFeel === 'auto' ? '✨ Let AI Decide based on vibe' : animationFeel
      };

      const newCode = await generateCodeAI(
        formNotes, rawBase64, imageMimeType, code,
        categoryContext, blueprint?.prompt || '', dialogThemeColor, dialogThemeMode, artDir?.prompt || '',
        advancedConfig, isEditingMode, business
      );
      setCode(newCode);
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
          <button onClick={() => { onSave(code, dialogThemeColor, dialogThemeMode); onClose(); }}
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
            <div className="w-full max-w-[1280px] h-full overflow-hidden rounded-none border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 bg-[#1e1e1e] relative">
              <textarea
                value={code}
                readOnly
                className="w-full h-full bg-transparent text-[#d4d4d4] font-mono text-sm leading-relaxed p-6 outline-none resize-none custom-scrollbar"
              />
            </div>
          ) : (
            <div className="w-full h-full animate-in zoom-in-95 duration-500 relative flex items-center justify-center">
              <LiveCodePreview code={code} viewMode={viewport} storeProfile={storeProfile} themeColor={dialogThemeColor} editMode={editMode} onVisualEdit={handleVisualEdit} />

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

              {/* Image edit popover */}
              {editMode && imageEdit && (
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
                      <FileUp size={13} /> Upload an image
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
                      {editBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Find on Unsplash
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

  const handleAiTemplateSave = async (generatedCode, aiColor, aiMode) => {
    if (!storeId) return;
    setThemeTemplate(generatedCode);
    setLayoutStyle('Custom_AI');
    if (aiColor) setThemeColor(aiColor);
    if (aiMode)  setThemeMode(aiMode);
    
    await fetch(`/api/stores/${storeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeTemplate: generatedCode, layoutStyle: 'Custom_AI', themeColor: aiColor, themeMode: aiMode }),
    });
    setMessage({ type: 'success', text: 'AI template saved & applied!' });
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
          onSave={handleAiTemplateSave}
          onClose={() => setIsAiDialogOpen(false)}
          globalThemeColor={themeColor}
          globalThemeMode={themeMode}
          storeProfile={storeData}
        />
      )}
    </div>
  );
}