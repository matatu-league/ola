"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Palette, Save, Loader2, CheckCircle2, LayoutTemplate,
  Zap, Sparkles, X, ArrowLeft, Code, ExternalLink, 
  Monitor, Smartphone, Tablet, ChevronDown, Sun, Moon, 
  Wand2, Settings2, FileUp, Link as LinkIcon
} from 'lucide-react';
import { sanitizeTemplateCode } from '@/lib/templateSanitize';

// --- CONFIG & UTILITIES ---
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const TEXT_MODEL_ID = 'gemini-3.5-flash';

const fetchWithRetry = async (url, options, retries = 5) => {
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

const safeExtractCode = (apiResult) => {
  const text = apiResult?.candidates?.[0]?.content?.parts?.[0]?.text;
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

// --- CORE AI CODE GENERATION ENGINE ---
const generateCodeAI = async (
  promptText, imageBase64, imageMimeType, currentCode, 
  categoryContext, businessType, blueprintPrompt, themeColor, themeMode, artDirection,
  advancedConfig, isEditingExplicit
) => {
  const { bgStyle, fontFamily, borderRadius, animationFeel } = advancedConfig;
  
  const isEditing = isEditingExplicit || (promptText && currentCode && promptText.toLowerCase().includes("change"));

  const prompt = `
You are an avant-garde, world-class creative frontend engineer known for building wildly unique, award-winning (Awwwards level) custom web experiences.
Your mission: generate a COMPLETE, mind-blowing, and UNPREDICTABLE React component (JSX) for an entire digital storefront.

${isEditing ? `CRITICAL EDITING INSTRUCTION: The user wants to MODIFY their current design. I am providing the CURRENT SOURCE CODE below. Apply their requested changes specifically to this code without breaking existing logic.\n\n--- CURRENT CODE ---\n${currentCode}\n--- END CURRENT CODE ---\n` : ''}

BUSINESS TYPE: ${businessType.toUpperCase()}
${businessType === 'both' ? 'CRITICAL (HYBRID STORE): This business offers BOTH services/bookings AND physical products. You MUST include a clear top Navigation Menu with distinct tabs for the main service (e.g., "Rooms", "Bookings", "Services") AND a specific "Store" or "Shop Items" tab. The page must elegantly showcase both bookable services and a grid of physical items.' : ''}
${businessType === 'services' ? 'CRITICAL (SERVICE BUSINESS): This is a purely service business. Focus heavily on service offerings, booking/appointment interfaces, portfolios, pricing tiers, and "Book Now" or "Get a Quote" buttons. Layout should be spacious and professional. Do not use shopping carts.' : ''}
${businessType === 'products' ? 'CRITICAL (PRODUCT BUSINESS): This is a purely product business. Focus heavily on product grids, prices, and "Buy Now" or "Add to Cart" buttons. Layout should be optimized for e-commerce.' : ''}

CRITICAL ARCHITECTURE RULES (STRICT COMPLIANCE):
1. BREAK THE GRID: Do NOT output a standard, boring Bootstrap-style grid unless requested. Use overlapping elements, asymmetrical masonry, massive typography, and advanced Tailwind classes.
2. CARDS MUST BE UNIQUE: Invent new ways to present items! Use horizontal cards, floating text over images, 3D tilt effects, sliding panels, etc.
3. IMAGES: ALL images MUST adhere to strict aspect ratios (e.g. \`aspect-square\` or \`aspect-video\`) using \`object-cover\`.
4. IMAGE FALLBACKS: You MUST include inline SVG fallbacks for missing images (e.g. \`<svg>...</svg>\` when \`!item.image\`).
5. AVOID RAW COMMENTS: NEVER use single-line comments (//) inside the JSX return block as they render as text on screen. Use {/* comment */} instead.
6. DARK FOOTER: The bottom of the page MUST include a dark-themed footer (#161823 or similar) containing contact details, location, and legal links.
7. DESIGN SYSTEM: Use subtle rounded corners (rounded-sm) on elements. Use #161823 as the primary dark color and ${themeColor} for accents.

${categoryContext ? `========================================================================\nCRITICAL CATEGORY NICHE: "${categoryContext}"\nYou MUST strictly adapt the aesthetic, copywriting placeholders, and layout vibe to perfectly match the "${categoryContext}" industry.\n\nSPECIAL NICHE RULES:\n- If the category is "Hotels & Accommodation" or similar, you MUST generate a Hotel Website Layout. This includes a Hero section with a Date/Guest Check-in/Check-out availability picker, cards representing Rooms/Suites (not generic products), an Amenities list, and "Book Room" buttons.\n- If the category is "Salon" or "Clinic", use Service Menus, Practitioner profiles, and "Book Appointment" buttons.\n========================================================================` : ''}

THEME SETTINGS:
- Brand Color: ${themeColor}
- Color Mode: ${themeMode === 'dark' ? 'DARK MODE (rich dark backgrounds, light text)' : 'LIGHT MODE (clean light backgrounds, dark text)'}
- Macro Layout Blueprint: ${blueprintPrompt ? blueprintPrompt : 'None specified. AI has complete freedom to invent the layout.'}
- Art Direction & Vibe: ${artDirection}

ADVANCED STYLING DIRECTIVES:
- Background: ${bgStyle}
- Typography: ${fontFamily}
- Border Radius: ${borderRadius}
- Animation: ${animationFeel}

OUTPUT RULES:
1. Output ONLY raw React JSX code. No markdown fences. No explanations.
2. Main component MUST be named \`App\` and MUST be a standard React arrow function.
   EXACT SYNTAX REQUIRED: \`const App = ({ storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, themeColor }) => { ... }\`
   DO NOT use shorthand object methods like \`App() { ... }\` or class syntax.
3. DO NOT import or use external icon libraries like lucide-react. You MUST create your own minimal inline SVG icon components (inspired by Lucide). 
4. DO NOT import React. Use \`useState\` and \`useMemo\` globally if needed, or import them standardly.
5. Use Tailwind CSS utility classes exclusively.

DATA CONTRACT (Props passed to App):
  storeName, storeLogo, storeBanner, contactEmail, contactPhone, categories, products, themeColor

CRITICAL INTERACTION RULE:
Redirect to: \`window.top.location.href = "https://ola.ug/products/" + id;\` on item click.

${promptText ? `USER DIRECTIVE / EDIT REQUEST: "${promptText}"` : ''}
`;

  const contents = [{ parts: [{ text: prompt }] }];
  if (imageBase64 && imageMimeType) {
    contents[0].parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
  }

  const result = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contents, generationConfig: { temperature: 1.0 } }),
    }
  );

  return safeExtractCode(result);
};

// --- DATA LISTS ---
const PRESET_COLORS = [
  '#2563EB', '#8B5CF6', '#F59E0B', '#FE2C55', '#16A34A',
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
    id: 'none', name: '✨ AI Magic',
    prompt: '',
    icon: (
      <div className="flex flex-col items-center justify-center w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-sm">
        <Sparkles size={24} className="text-blue-500 opacity-50 animate-pulse" />
      </div>
    )
  },
  {
    id: 'classic', name: 'Classic Grid',
    prompt: 'Top Navigation Header -> Big Hero Image below header -> Horizontal Categories row below Hero -> 4-Column Grid -> Standard Footer.',
    icon: (
      <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-sm">
        <div className="w-full h-2 bg-white/60 rounded-sm"></div>
        <div className="w-full h-6 bg-white/20 rounded-sm"></div>
        <div className="w-full h-2 bg-blue-500/80 rounded-sm"></div>
        <div className="flex-1 grid grid-cols-2 gap-1"><div className="bg-white/30 rounded-sm"></div><div className="bg-white/30 rounded-sm"></div></div>
      </div>
    )
  },
  {
    id: 'megamarket', name: 'Split Hero',
    prompt: 'Top Header -> Split Hero area where Left 25% is a vertical Category Menu and Right 75% is the Hero image slider -> Dense Grid -> Footer.',
    icon: (
      <div className="flex flex-col gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-sm">
        <div className="w-full h-2 bg-white/60 rounded-sm"></div>
        <div className="flex gap-1 h-8"><div className="w-1/3 h-full bg-blue-500/80 rounded-sm"></div><div className="flex-1 h-full bg-white/20 rounded-sm"></div></div>
        <div className="flex-1 grid grid-cols-3 gap-1"><div className="bg-white/30 rounded-sm"></div><div className="bg-white/30 rounded-sm"></div><div className="bg-white/30 rounded-sm"></div></div>
      </div>
    )
  },
  {
    id: 'inlinehero', name: 'Left Sidebar',
    prompt: 'Left Sidebar (Logo, Navigation, Vertical Categories) -> Right Side scrollable content (Hero Image -> Grid -> Footer).',
    icon: (
      <div className="flex gap-1 w-full h-full p-1.5 bg-white/5 border border-white/10 rounded-sm">
        <div className="w-[30%] h-full flex flex-col gap-2 bg-white/10 p-1 rounded-sm"><div className="w-full h-2 bg-blue-500/60 rounded-sm"></div><div className="w-full h-1 bg-blue-500/60 rounded-sm"></div></div>
        <div className="flex-1 flex flex-col gap-1"><div className="w-full h-6 bg-white/20 rounded-sm"></div><div className="flex-1 bg-white/30 rounded-sm"></div></div>
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
const StoreIcon = ({size=24, className="", style}) => <svg width={size} height={size} className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

const App = ({ storeName = "My Business", storeLogo, storeBanner, contactEmail = "hello@store.com", contactPhone = "+1 234 567 890", categories = ["Featured", "New Arrivals"], products = [], themeColor = "#2563EB" }) => {
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
    <div className="w-full h-full bg-[#F8F8F8] flex items-center justify-center">
      <svg className="w-12 h-12 text-[#8A8B91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#161823] font-sans flex flex-col">
      <header className="bg-white border-b border-[#E3E3E4] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-[#161823]">
              <StoreIcon size={20} style={{ color: themeColor }} />
            </div>
            {storeLogo ? <img src={storeLogo} alt={storeName} className="h-8 object-contain rounded-sm" /> : <h1 className="text-xl font-bold tracking-tight">{storeName}</h1>}
          </div>
          
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-1 focus:ring-[#161823] focus:border-[#161823]"
            />
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 md:p-6 mt-4">
        <div className="w-full h-[250px] md:h-[350px] rounded-sm overflow-hidden relative mb-10 shadow-sm">
          {storeBanner ? (
            <img src={storeBanner} className="w-full h-full object-cover" alt="Store Banner" />
          ) : (
            <div className="w-full h-full bg-[#161823]"></div>
          )}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-white text-2xl md:text-4xl font-bold tracking-tight mb-4">Welcome to {storeName}</h2>
            <p className="text-[#E3E3E4] text-sm md:text-base font-medium max-w-lg">Discover our premium selection of tailored offerings built just for you.</p>
          </div>
        </div>

        {currentProducts.length === 0 ? (
          <div className="text-center py-20 text-[#8A8B91] font-medium">No results found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {currentProducts.map(p => (
              <div key={p.id} onClick={() => handleProductClick(p.id)} className="bg-white rounded-sm overflow-hidden border border-[#E3E3E4] cursor-pointer group hover:shadow-md hover:border-[#8A8B91] transition-all flex flex-col">
                <div className="aspect-square overflow-hidden bg-[#F8F8F8] relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  ) : null}
                  <div style={{ display: p.image ? 'none' : 'flex' }} className="absolute inset-0 items-center justify-center bg-[#F8F8F8]">
                     <SvgPlaceholder />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[14px] font-bold mb-1 line-clamp-2 leading-tight flex-1 text-[#161823]">{p.name}</p>
                  <p className="text-[15px] font-bold mt-2 mb-4" style={{ color: themeColor }}>\${p.price}</p>
                  <button className="w-full text-white rounded-sm py-2 text-[13px] font-bold transition-transform active:scale-[0.98]" style={{ backgroundColor: themeColor }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-sm border border-[#E3E3E4] disabled:opacity-50 hover:bg-[#F8F8F8]"><ChevronLeftIcon size={16} /></button>
            <span className="text-[13px] font-bold px-4 text-[#8A8B91]">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-sm border border-[#E3E3E4] disabled:opacity-50 hover:bg-[#F8F8F8]"><ChevronRightIcon size={16} /></button>
          </div>
        )}
      </main>

      <footer className="bg-[#161823] text-white mt-16 py-12">
        <div className="max-w-[1200px] mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-[15px] font-bold mb-4">{storeName}</h3>
            <p className="text-[#8A8B91] text-[13px] leading-relaxed max-w-xs">Your premium destination on the ola.ug marketplace.</p>
          </div>
          <div>
            <h3 className="text-[15px] font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-[#8A8B91] text-[13px]">
              <li className="flex items-center gap-2"><MailIcon size={14}/> {contactEmail}</li>
              <li className="flex items-center gap-2"><PhoneIcon size={14}/> {contactPhone}</li>
              <li className="flex items-center gap-2"><MapPinIcon size={14}/> Kampala, Uganda</li>
            </ul>
          </div>
          <div>
            <h3 className="text-[15px] font-bold mb-4">Legal</h3>
            <ul className="space-y-3 text-[#8A8B91] text-[13px]">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-6 pt-8 mt-8 border-t border-white/10 text-center text-[11px] text-[#8A8B91] font-medium">
          © {new Date().getFullYear()} {storeName}. Powered by ola.ug.
        </div>
      </footer>
    </div>
  );
};
export default App;`;

const LiveCodePreview = ({ code, viewMode = 'desktop' }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const dynamicStoreData = {
    storeName: "AURA STUDIO",
    storeLogo: "",
    storeBanner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000",
    contactEmail: "hello@aurastudio.com",
    contactPhone: "+1 (555) 123-4567",
    themeColor: "#2563EB",
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
        } catch(err) {
          document.getElementById('root').innerHTML = '<div style="padding:32px;color:#ef4444;font-family:monospace;font-size:13px;"><h2 style="margin-bottom:12px;">Render Error</h2><pre>' + err.toString() + '</pre></div>';
        }
      </script>
    </body></html>
  `, [processedCode]);

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
          borderRadius: viewMode !== 'desktop' ? '36px' : '6px',
          border: viewMode !== 'desktop' ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
      >
        {viewMode !== 'desktop' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[24px] bg-[#111] rounded-b-[16px] z-50"></div>}
        {viewMode !== 'desktop' && <div className="absolute inset-0 pointer-events-none rounded-[36px] border-[12px] border-[#111] z-40"></div>}
        <iframe srcDoc={srcDoc} className="w-full h-full border-0 absolute inset-0 bg-white" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups" title="Live AI Preview" />
      </div>
    </div>
  );
};

// --- AI BUILDER DIALOG (Dark Theme) ---
const AIBuilderDialog = ({ 
  initialCode, onSave, onClose, globalThemeColor, globalThemeMode,
  storeCategoryName, storeCategoryId, businessType
}) => {
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

  const fileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) setShowColorPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openInNewTab = () => {
    const processedCode = sanitizeTemplateCode(code);

    const htmlContent = `<!DOCTYPE html><html><head><script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script>window.react = window.React;</script><script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script>window.onerror=function(m,u,l,c,e){document.getElementById('root').innerHTML='<div style="padding:32px;color:red;font-family:monospace;"><h2>Error</h2><pre>'+m+'</pre></div>';return true;}</script><script type="text/babel">const{useState,useEffect,useRef,useMemo}=React;window.lucideFallback=new Proxy({},{get:(_,prop)=>(p)=>React.createElement('svg',{width:p.size||24,height:p.size||24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round',className:p.className,style:p.style},React.createElement('circle',{cx:12,cy:12,r:10}),React.createElement('path',{d:'M12 8v4M12 16h.01'}))});const dynamicStoreData={storeName:"AURA STUDIO",themeColor:"${dialogThemeColor}",categories:["Featured"],products:[{id:"1",name:"Sample Item",price:85}]};try{${processedCode}\nReactDOM.createRoot(document.getElementById('root')).render(<App {...dynamicStoreData}/>);}catch(e){console.error(e)}</script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.open(); w.document.write(htmlContent); w.document.close(); }
  };

  const handleGenerate = async () => {
    const blueprint = layoutBlueprints.find(b => b.id === selectedBlueprint);
    const artDir    = ART_DIRECTIONS.find(a => a.id === selectedArtDirection);
    
    // Inject the store category directly without manual selection
    const finalContext = storeCategoryName || '';

    setLoading(true);
    try {
      const advancedConfig = {
        bgStyle: bgStyle === 'auto' ? '✨ Let AI Decide based on vibe' : bgStyle,
        fontFamily: fontFamily === 'auto' ? '✨ Let AI Decide based on vibe' : fontFamily,
        borderRadius: borderRadius === 'auto' ? '✨ Let AI Decide based on vibe' : borderRadius,
        animationFeel: animationFeel === 'auto' ? '✨ Let AI Decide based on vibe' : animationFeel
      };

      const newCode = await generateCodeAI(
        formNotes, rawBase64, imageMimeType, code,
        finalContext, businessType, blueprint?.prompt || '', dialogThemeColor, dialogThemeMode, artDir?.prompt || '',
        advancedConfig, isEditingMode
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
      <div className="h-12 bg-[#161823] border-b border-white/10 flex items-center justify-between px-6 shrink-0 shadow-lg relative">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-500 animate-pulse" size={14} />
            <span className="text-[13px] font-bold text-white tracking-tight">AI Theme Studio</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-sm ml-2">
              {businessType === 'services' ? 'Services' : businessType === 'both' ? 'Hybrid' : 'Products'}
            </span>
            {storeCategoryName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-sm ml-2">
                {storeCategoryName}
              </span>
            )}
          </div>
        </div>

        {toastMsg && (
          <div className="absolute left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold text-xs px-4 py-1.5 rounded-sm shadow-[0_0_15px_rgba(37,99,235,0.3)] animate-in slide-in-from-top-2">
            {toastMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={openInNewTab} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-sm text-[12px] font-bold transition-all">
            <ExternalLink size={14} /> Fullscreen
          </button>
          <button onClick={() => setShowCode(!showCode)} className="flex items-center gap-2 px-3 py-1.5 border border-white/20 hover:bg-white/10 text-white rounded-sm text-[12px] font-bold transition-all">
            <Code size={14} /> {showCode ? 'View Render' : 'View Code'}
          </button>
          <button onClick={() => { onSave(code, dialogThemeColor, dialogThemeMode); onClose(); }}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-[12px] font-bold transition-all shadow-md">
            <Save size={14} /> Save to Store
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Form Panel - Dark */}
        <div className="w-[380px] border-r border-white/10 bg-[#161823] flex flex-col shrink-0 relative">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-white/10 bg-[#161823] sticky top-0 z-10">
            <button 
              onClick={() => setActiveTab('basic')} 
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'basic' ? 'text-blue-500 border-b-2 border-blue-600 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              Basic Setup
            </button>
            <button 
              onClick={() => setActiveTab('advanced')} 
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'advanced' ? 'text-blue-500 border-b-2 border-blue-600 bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Settings2 size={12} /> Advanced
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* --- BASIC TAB CONTENT --- */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                
                {/* Aesthetics Row */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Aesthetics</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={colorPickerRef}>
                      <button onClick={() => setShowColorPicker(p => !p)} className="w-full flex items-center justify-between bg-black/40 border border-white/10 hover:border-blue-500/40 rounded-sm px-2.5 py-1.5 text-xs text-white transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm shadow-inner" style={{ backgroundColor: dialogThemeColor }}></span>
                          <span className="font-mono text-white/80">{dialogThemeColor}</span>
                        </div>
                        <ChevronDown size={12} className="text-white/40" />
                      </button>

                      {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-[#161823] border border-white/10 rounded-sm p-3 shadow-2xl w-[200px]">
                          <div className="grid grid-cols-6 gap-1.5 mb-3">
                            {PRESET_COLORS.map(c => (
                              <button key={c} onClick={() => { setDialogThemeColor(c); setShowColorPicker(false); }} className={`w-5 h-5 rounded-sm transition-all hover:scale-110 ${dialogThemeColor === c ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111] scale-110' : 'border border-white/10'}`} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <div className="flex gap-2 items-center bg-black/40 p-1 rounded-sm border border-white/10">
                            <input type="color" value={dialogThemeColor} onChange={e => setDialogThemeColor(e.target.value)} className="w-6 h-6 cursor-pointer bg-transparent border-0 rounded-sm" />
                            <input type="text" value={dialogThemeColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setDialogThemeColor(e.target.value); }} className="flex-1 bg-transparent border-none text-[12px] font-mono text-white outline-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex bg-black/40 border border-white/10 rounded-sm p-0.5">
                      <button onClick={() => setDialogThemeMode('light')} className={`px-2.5 py-1 rounded-sm text-[12px] font-bold flex items-center gap-1 ${dialogThemeMode === 'light' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}><Sun size={12}/> L</button>
                      <button onClick={() => setDialogThemeMode('dark')} className={`px-2.5 py-1 rounded-sm text-[12px] font-bold flex items-center gap-1 ${dialogThemeMode === 'dark' ? 'bg-[#222] text-white' : 'text-white/40 hover:text-white'}`}><Moon size={12}/> D</button>
                    </div>
                  </div>

                  <select value={selectedArtDirection} onChange={(e) => setSelectedArtDirection(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500/50">
                    {ART_DIRECTIONS.map(art => <option key={art.id} value={art.id}>{art.name}</option>)}
                  </select>
                </div>

                {/* Layout Blueprint */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Layout Structure</h3>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 pt-1">
                    {layoutBlueprints.map(bp => (
                      <button
                        key={bp.id}
                        onClick={() => setSelectedBlueprint(bp.id)}
                        className={`shrink-0 w-[90px] flex flex-col rounded-sm border transition-all overflow-hidden ${selectedBlueprint === bp.id ? 'border-blue-500 bg-blue-500/5 scale-[1.02]' : 'border-white/10 bg-black/40 hover:border-white/20'}`}
                      >
                        <div className="w-full h-[60px] p-1.5">{bp.icon}</div>
                        <div className={`w-full px-1 py-1 text-center text-[10px] uppercase font-bold leading-tight border-t ${selectedBlueprint === bp.id ? 'text-blue-500 border-blue-500/20' : 'text-white/50 border-white/5'}`}>{bp.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload & Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Design Commands</h3>
                    <label className="flex items-center gap-1.5 cursor-pointer group bg-white/5 hover:bg-white/10 px-2 py-1 rounded-sm transition-colors border border-white/10">
                      <input type="checkbox" checked={isEditingMode} onChange={(e) => setIsEditingMode(e.target.checked)} className="accent-blue-500 w-3 h-3 cursor-pointer rounded-sm" />
                      <span className="text-[10px] font-bold text-white/70 group-hover:text-white uppercase tracking-wider">Edit Current Design</span>
                    </label>
                  </div>
                  
                  {previewImg ? (
                    <div className="relative group w-full rounded-sm overflow-hidden border border-white/20">
                      <img src={previewImg} className="w-full h-20 object-cover opacity-80" alt="preview" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setPreviewImg(null); setRawBase64(null); setImageMimeType(null); }} className="bg-red-500 text-white px-3 py-1 rounded-sm text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform">
                          <X size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-16 border border-dashed border-white/10 hover:border-blue-500/40 bg-black/40 rounded-sm flex flex-col items-center justify-center cursor-pointer group transition-colors">
                      <span className="text-[12px] text-white/40 group-hover:text-blue-500 font-medium flex items-center gap-2"><FileUp size={14}/> Upload Mockup (Opt)</span>
                      <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={onFileChange} />
                    </label>
                  )}

                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder={isEditingMode ? "Describe what to change in the currently visible design (e.g., 'Make the header blue' or 'Move search to the left')..." : "e.g., Generate a neon cyberpunk layout with floating cards..."}
                    className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-sm text-[13px] text-white p-2.5 outline-none resize-none h-24 custom-scrollbar placeholder:text-white/25 transition-colors"
                  />
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-500 p-3 rounded-sm text-[12px] leading-relaxed font-medium">
                  Settings left on "Let AI Decide" will automatically adapt to your chosen Design Vibe.
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Border Style / Radius</p>
                  <select value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-2 text-[13px] text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Sharp 0px borders (rounded-none)">Sharp Corners (0px)</option>
                    <option value="Subtle rounded corners (rounded-sm)">Subtle Rounded (4px)</option>
                    <option value="Smooth rounded corners (rounded-xl)">Smooth Rounded (12px)</option>
                    <option value="Fully rounded pill-shapes (rounded-full)">Pill-shaped (Fully Rounded)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Typography</p>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-2 text-[13px] text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Sans-serif, clean and modern (font-sans)">Sans-serif (Modern)</option>
                    <option value="Serif, elegant and luxurious (font-serif)">Serif (Editorial)</option>
                    <option value="Monospace, technical and brutalist (font-mono)">Monospace (Tech)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Background Style</p>
                  <select value={bgStyle} onChange={(e) => setBgStyle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-2 text-[13px] text-white outline-none focus:border-blue-500/50">
                    <option value="auto">✨ Let AI Decide</option>
                    <option value="Solid flat colors">Solid Flat</option>
                    <option value="Soft gradients (bg-gradient-to-br)">Soft Mesh Gradients</option>
                    <option value="Heavy glassmorphism with backdrop blurs">Glassmorphism</option>
                    <option value="Grainy or noisy textured backgrounds">Grainy Textures</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Animations</p>
                  <select value={animationFeel} onChange={(e) => setAnimationFeel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-2 text-[13px] text-white outline-none focus:border-blue-500/50">
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
          <div className="p-5 bg-[#161823] border-t border-white/10 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-sm text-[13px] font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:-translate-y-0.5"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? 'Compiling AI...' : (isEditingMode ? 'Apply Changes to Design' : 'Generate New Design')}
            </button>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#050505] p-6 flex items-center justify-center overflow-hidden relative">
          
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <span className="bg-black/80 text-blue-500 text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-widest border border-white/10 shadow-lg backdrop-blur-md flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse rounded-full"></div>
              {showCode ? 'Source Code' : 'Live Preview'}
            </span>

            {!showCode && (
              <div className="flex bg-black/80 border border-white/10 rounded-sm overflow-hidden backdrop-blur-md shadow-lg p-0.5 gap-0.5">
                {[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setViewport(v)}
                    className={`p-1.5 rounded-sm transition-colors ${viewport === v ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {showCode ? (
            <div className="w-full max-w-[1280px] h-full overflow-hidden rounded-sm border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 bg-[#1e1e1e] relative">
              <textarea
                value={code}
                readOnly
                className="w-full h-full bg-transparent text-[#d4d4d4] font-mono text-[13px] leading-relaxed p-6 outline-none resize-none custom-scrollbar"
              />
            </div>
          ) : (
            <div className="w-full h-full animate-in zoom-in-95 duration-500 relative flex items-center justify-center">
              <LiveCodePreview code={code} viewMode={viewport} />
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
    <div className="w-full h-full min-h-[500px] border border-[#E3E3E4] rounded-sm flex flex-col overflow-hidden sticky top-6 shadow-sm" style={{ background: bg }}>
      <div className="h-10 flex items-center px-4 gap-2 border-b shrink-0" style={{ background: card, borderColor: border }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        <div className="ml-4 flex-1 h-5 rounded-sm border" style={{ background: card, borderColor: border }}></div>
      </div>

      <div className="flex-1 overflow-hidden pointer-events-none select-none relative flex flex-col">
        {(layout === 'Classic' || layout === 'Custom_AI') && (
          <div className="flex flex-col h-full flex-1 w-full items-center" style={{ background: bg }}>
            <div className="w-full flex flex-col">
              <div className="h-10 border-b flex items-center px-4 gap-3 w-full" style={{ background: card, borderColor: border }}>
                {logo
                  ? <img src={logo} alt="Logo" className="w-5 h-5 object-cover rounded-sm" />
                  : <div className="w-5 h-5 rounded-sm text-[10px] text-white flex items-center justify-center font-bold" style={{ backgroundColor: color }}>S</div>
                }
                <div className="w-20 h-2 rounded-sm" style={{ background: muted }}></div>
              </div>
              <div className="h-32 w-full flex items-center justify-center relative overflow-hidden" style={{ background: themeMode === 'dark' ? '#111' : '#F8F8F8', borderBottom: `1px solid ${border}` }}>
                <div className="flex flex-col items-center relative z-10">
                  <div className="text-[13px] font-bold mb-2" style={{ color: text }}>{title}</div>
                  <div className="w-24 h-4 rounded-sm" style={{ backgroundColor: color }}></div>
                </div>
              </div>
              <div className="p-4 w-full">
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="aspect-[4/5] border rounded-sm p-2 flex flex-col" style={{ background: card, borderColor: border }}>
                      <div className="flex-1 rounded-sm mb-2" style={{ background: muted }}></div>
                      <div className="w-full h-1.5 rounded-sm mb-1.5" style={{ background: muted }}></div>
                      <div className="w-1/2 h-2 rounded-sm" style={{ backgroundColor: color }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {layout === 'Custom_AI' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col text-white z-10 backdrop-blur-sm">
                <Wand2 size={40} className="text-blue-500 mb-3 animate-pulse"/>
                <p className="text-[11px] font-bold uppercase tracking-widest">Custom AI Theme</p>
                <p className="text-[11px] text-gray-400 mt-2 font-medium">Rendered at runtime</p>
              </div>
            )}
          </div>
        )}

        {layout === 'Modern' && (
          <div className="flex flex-col h-full p-4 w-full" style={{ background: bg }}>
            <div className="flex gap-4 h-36 mb-4">
              <div className="w-1/2 rounded-sm border" style={{ background: card, borderColor: border }}></div>
              <div className="w-1/2 flex flex-col justify-center">
                <div className="text-[13px] font-bold mb-3" style={{ color: text }}>{title}</div>
                <div className="w-20 h-5 rounded-sm" style={{ backgroundColor: color }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              {[1,2].map(i => (
                <div key={i} className="rounded-sm p-3 aspect-square border flex flex-col items-center justify-center" style={{ background: card, borderColor: border }}>
                  <div className="w-12 h-12 rounded-sm mb-3" style={{ background: muted }}></div>
                  <div className="w-1/2 h-2 rounded-sm" style={{ background: muted }}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {layout === 'Bold' && (
          <div className="flex flex-col h-full border-b-8 w-full" style={{ borderColor: color, background: bg }}>
            <div className="h-40 flex flex-col items-center justify-center p-6 border-b" style={{ background: '#161823', borderColor: color }}>
              <div className="text-[15px] font-bold uppercase tracking-tight text-white">{title}</div>
              <div className="mt-4 w-24 h-5 bg-white rounded-sm"></div>
            </div>
            <div className="p-6 flex flex-col gap-4 w-full">
              {[1,2].map(i => (
                <div key={i} className="flex gap-4 p-3 border rounded-sm" style={{ borderColor: border }}>
                  <div className="w-16 h-16 rounded-sm" style={{ background: muted }}></div>
                  <div className="flex flex-col justify-center w-full">
                    <div className="w-3/4 h-3 mb-2 rounded-sm" style={{ background: text }}></div>
                    <div className="w-1/2 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
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
              <p className="text-[13px] font-bold mb-1" style={{ color: muted }}>{layout} Template</p>
              <p className="text-[11px] font-medium" style={{ color: muted }}>Theme Color: <span style={{ color }}>■</span> {color}</p>
            </div>
          </div>
        )}

        {showFlashSale && (
          <div className="absolute top-10 left-0 right-0 bg-red-500 text-white text-[10px] font-bold py-1.5 px-4 flex justify-between items-center z-50">
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

  const [storeId, setStoreId]           = useState(null);
  const [storeData, setStoreData]       = useState({ title: 'My Store', logo: '', categoryName: '', categoryId: '', businessType: 'products' });
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
          
          const themeRes = await fetch(`/api/stores/${id}`);
          if (themeRes.ok) {
            const data = await themeRes.json();
            setStoreData({ 
              title: data.title || sessionData.store.title || 'My Store', 
              logo: data.logo || sessionData.store.logo || '',
              categoryName: data.categoryName || sessionData.store.categoryName || '',
              categoryId: data.categoryId || sessionData.store.categoryId || '',
              businessType: data.businessType || sessionData.store.businessType || 'products'
            });
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

  if (isLoading) return <div className="flex h-screen bg-[#F8F8F8] items-center justify-center"><Loader2 className="animate-spin text-[#161823] w-8 h-8" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-[#F8F8F8] text-[#161823] min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#161823]">Design Studio</h1>
            <p className="text-[13px] text-[#8A8B91] mt-1 font-medium">Customize your storefront architecture and visual identity.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiDialogOpen(true)}
              className="bg-white border border-[#E3E3E4] hover:bg-[#F0F0F0] text-[#161823] px-5 py-2.5 rounded-sm font-bold text-[13px] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Sparkles size={16} className="text-blue-600"/> Build with AI
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#161823] hover:bg-black text-white px-5 py-2.5 rounded-sm font-bold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm active:scale-[0.98]"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Publish Theme'}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-sm border text-[13px] font-bold flex items-center gap-2 ${
            message.type === 'success' ? 'bg-[#ECFDF5] border-[#BBF7D0] text-[#16A34A]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#FE2C55]'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[55%] space-y-6">

            <div className="bg-white border border-[#E3E3E4] rounded-sm shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-[#F0F0F0] pb-3">
                <LayoutTemplate size={18} className="text-[#161823]" />
                <h2 className="text-[14px] font-bold text-[#161823]">Store Architecture</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <div
                  onClick={() => setIsAiDialogOpen(true)}
                  className={`group relative overflow-hidden rounded-sm border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-6 text-center h-[170px] ${
                    layoutStyle === 'Custom_AI' ? 'border-blue-600 bg-blue-50/50' : 'border-transparent bg-[#161823] hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="w-12 h-12 bg-white/10 text-white rounded-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10">
                    <Code size={24} className="text-blue-500"/>
                  </div>
                  <h4 className="font-bold text-white text-[14px] mb-1 relative z-10 flex items-center gap-2">
                    {layoutStyle === 'Custom_AI' && <CheckCircle2 size={16} className="text-blue-500" />}
                    AI Custom Build
                  </h4>
                  <p className="text-[11px] text-[#8A8B91] font-medium relative z-10 px-2">{themeTemplate ? 'Custom template saved. Click to edit.' : 'Generate a unique store design with AI.'}</p>
                </div>

                {layoutOptions.map((layout) => (
                  <div
                    key={layout.name}
                    onClick={() => setLayoutStyle(layout.name)}
                    className={`group relative overflow-hidden rounded-sm border cursor-pointer transition-all ${
                      layoutStyle === layout.name ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4] hover:border-[#8A8B91] hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="h-28 w-full bg-[#F8F8F8] relative border-b border-[#E3E3E4]">
                      <img src={layout.image} alt={layout.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161823]/90 to-transparent"></div>
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <h4 className="font-bold text-white text-[13px]">{layout.name}</h4>
                        {layoutStyle === layout.name && <CheckCircle2 size={16} className="text-blue-500" fill="white" />}
                      </div>
                    </div>
                    <div className="p-3 bg-white"><p className="text-[11px] font-medium text-[#8A8B91] leading-relaxed">{layout.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E3E3E4] rounded-sm shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-[#F0F0F0] pb-3">
                <Palette size={18} className="text-[#161823]" />
                <h2 className="text-[14px] font-bold text-[#161823]">Brand Identity</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-[#8A8B91] uppercase tracking-widest mb-3">Primary Color</p>
                  <div className="flex flex-wrap gap-2.5 mb-4">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all ${
                          themeColor === color ? 'ring-2 ring-offset-2 ring-[#161823] scale-110' : 'hover:scale-105 border border-[#E3E3E4]'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {themeColor === color && <CheckCircle2 size={16} className="text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:w-[200px]">
                  <p className="text-[10px] font-bold text-[#8A8B91] uppercase tracking-widest mb-3">Display Mode</p>
                  <div className="flex bg-[#F8F8F8] rounded-sm p-1 border border-[#E3E3E4]">
                    <button onClick={() => setThemeMode('light')} className={`flex-1 py-2.5 rounded-sm text-[12px] font-bold flex items-center justify-center gap-2 transition-colors ${themeMode === 'light' ? 'bg-white border border-[#E3E3E4] shadow-sm text-[#161823]' : 'text-[#8A8B91] hover:text-[#161823]'}`}>
                      <Sun size={14}/> Light
                    </button>
                    <button onClick={() => setThemeMode('dark')} className={`flex-1 py-2.5 rounded-sm text-[12px] font-bold flex items-center justify-center gap-2 transition-colors ${themeMode === 'dark' ? 'bg-[#161823] text-white shadow-sm' : 'text-[#8A8B91] hover:text-[#161823]'}`}>
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
                <span className="text-[10px] font-bold text-[#8A8B91] uppercase tracking-widest">Store Preview</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: themeColor }}></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E3E3E4] px-2.5 py-1 rounded-sm text-[#161823] flex items-center gap-1.5 shadow-sm">
                    {themeMode === 'dark' ? <Moon size={10} /> : <Sun size={10} />}
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
          storeCategoryName={storeData.categoryName}
          storeCategoryId={storeData.categoryId}
          businessType={storeData.businessType}
        />
      )}
    </div>
  );
}