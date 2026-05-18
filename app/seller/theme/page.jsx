"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Save, Loader2, CheckCircle2, LayoutTemplate, 
  Zap, Sparkles, X, Send, Image as ImageIcon, ArrowLeft,
  Search, ChevronRight, ChevronDown, ShoppingCart, Menu, User,
  Heart, Star, MapPin, Mail, Phone, ShoppingBag
} from 'lucide-react';

// --- CONFIG & UTILITIES ---
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const TEXT_MODEL_ID = 'gemini-3.1-flash-lite-preview';

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

const safeExtractJSON = (apiResult) => {
  const text = apiResult?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty or blocked response from AI.');
  try {
    const match = text.match(/[\{\[][\s\S]*[\}\]]/);
    const cleanString = match ? match[0] : text.replace(/```(?:json)?\n?/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleanString);
  } catch {
    throw new Error('AI returned a malformed response.');
  }
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

// --- CORE AI GENERATION ENGINE ---
const generateStoreConfigAI = async (promptText, imageBase64, imageMimeType, currentConfig) => {
  const prompt = `
You are an expert E-commerce Frontend Architect. Your task is to generate a highly flexible JSON schema that dictates the COMPLETE layout, style, and content of an e-commerce store.
You have absolute freedom to mix and match styles to perfectly replicate the user's request. Do NOT limit yourself to one specific style; adapt to ANY e-commerce design paradigm (e.g., luxury minimal, dense marketplace, brutalist, modern tech, etc.).

JSON SCHEMA REQUIRED:
{
  "theme": {
    "primary": "hex color",
    "bg": "hex color",
    "surface": "hex color",
    "text": "hex color",
    "textMuted": "hex color",
    "fontFamily": "sans-serif | serif | monospace",
    "borderRadius": "0px | 4px | 8px | 16px | 9999px"
  },
  "header": {
    "layout": "search-centric" | "logo-center" | "logo-left",
    "bg": "hex color",
    "text": "hex color"
  },
  "hero": {
    "layout": "sidebar-menu" | "centered-overlay" | "split-left" | "split-right",
    "buttonStyle": "solid" | "outline"
  },
  "grid": {
    "columns": 3 | 4 | 5,
    "cardStyle": "minimal" | "shadow" | "bordered",
    "imageAspect": "square" | "portrait" | "landscape",
    "textAlignment": "left" | "center"
  },
  "content": {
    "storeName": "Name",
    "logoText": "Short Name",
    "topBarText": "Promo text",
    "categories": ["Cat1", "Cat2", "Cat3", "Cat4", "Cat5"],
    "heroTitle": "Main Catchy Title",
    "heroSubtitle": "Subtitle",
    "heroImage": "Unsplash URL matching theme",
    "products": [
      { "title": "Product Name", "price": 99.99, "oldPrice": 120, "rating": 4.5, "sales": 1000, "image": "Unsplash URL" }
    ],
    "footerAbout": "Brief compelling company description matching the theme",
    "contactEmail": "Email address",
    "contactPhone": "Phone number",
    "address": "Physical address matching the theme",
    "quickLinks": ["Shop", "About Us", "Blog", "Careers"],
    "customerService": ["Contact Us", "Terms of Service", "Privacy Policy", "Shipping & Returns"]
  }
}

RULES:
1. Return ONLY the valid JSON object. No markdown, no explanations.
2. Ensure you provide exactly 8 products with realistic Unsplash image URLs relevant to the niche.
3. Be highly creative. If the user asks for 'Cyberpunk', use neon greens/pinks, dark backgrounds, monospace fonts, and sharp borders (0px). If 'Luxury Fashion', use muted tones, serif fonts, minimal borders, and portrait image aspects.
`;

  const contents = [{ parts: [{ text: prompt }] }];
  
  if (imageBase64) {
     contents[0].parts.push({ inlineData: { mimeType: imageMimeType || "image/jpeg", data: imageBase64 } });
     contents[0].parts[0].text += `

CRITICAL IMAGE ANALYSIS INSTRUCTIONS:
A screenshot has been attached. You MUST perfectly mimic its look and feel. 
Do not rely on defaults; act as a precise visual clone engine.
1. Extract EXACT hex colors from the image for background, surface, text, and primary accents.
2. Observe the border radius (sharp corners = 0px, slightly rounded = 8px, pill-shaped = 9999px).
3. Observe the font style (serif for luxury/classic, sans-serif for modern, monospace for tech).
4. Match the header layout (Where is the logo? Is there a prominent search bar?).
5. Match the hero layout (Is text over an image, split to the side, or is there a sidebar menu?).
6. Match the product cards (Do they have borders? Shadows? Are images tall (portrait) or wide (landscape)? Is text centered?).
7. Detect the exact industry/products shown and generate matching dummy content and Unsplash images.
Output a JSON schema that reconstructs this exact visual aesthetic as closely as structurally possible.
`;
  } else {
     contents[0].parts[0].text += `\n\nUser Request: "${promptText}"\nCurrent Config: ${JSON.stringify(currentConfig)}`;
  }

  const result = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents,
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  return safeExtractJSON(result);
};

// --- DEFAULT INITIAL STATE ---
const INITIAL_AI_CONFIG = {
  theme: {
    primary: "#000000",
    bg: "#ffffff",
    surface: "#f8f8f8",
    text: "#111111",
    textMuted: "#666666",
    fontFamily: "system-ui, -apple-system, sans-serif",
    borderRadius: "8px"
  },
  header: { layout: "logo-left", bg: "#ffffff", text: "#111111" },
  hero: { layout: "split-left", buttonStyle: "solid" },
  grid: { columns: 4, cardStyle: "shadow", imageAspect: "square", textAlignment: "left" },
  content: {
    storeName: "Aura Studio", logoText: "AURA.", topBarText: "Free worldwide shipping on all orders",
    categories: ["New Arrivals", "Essentials", "Accessories", "Footwear", "Collections"],
    heroTitle: "Redefining Basics", heroSubtitle: "Elevate your everyday wardrobe with our new premium collection.",
    heroImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop",
    products: [
      { title: "Minimalist Linen Shirt", price: 85.00, oldPrice: 110.00, rating: 4.8, sales: 340, image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e98?w=500&auto=format&fit=crop" },
      { title: "Essential Cotton Crew", price: 45.00, oldPrice: null, rating: 4.9, sales: 890, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop" },
      { title: "Relaxed Fit Trousers", price: 120.00, oldPrice: 150.00, rating: 4.7, sales: 210, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop" },
      { title: "Classic Wool Coat", price: 295.00, oldPrice: null, rating: 5.0, sales: 85, image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=500&auto=format&fit=crop" },
      { title: "Leather Crossbody", price: 175.00, oldPrice: 200.00, rating: 4.6, sales: 430, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop" },
      { title: "Premium Denim Jacket", price: 140.00, oldPrice: null, rating: 4.8, sales: 560, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&auto=format&fit=crop" },
      { title: "Suede Chelsea Boots", price: 210.00, oldPrice: 250.00, rating: 4.7, sales: 180, image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop" },
      { title: "Silk Scarf Set", price: 65.00, oldPrice: null, rating: 4.9, sales: 620, image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&auto=format&fit=crop" }
    ],
    footerAbout: "Aura Studio creates premium, sustainable basics designed to last a lifetime. We believe in quality over quantity.",
    contactEmail: "hello@aurastudio.com", contactPhone: "+1 (555) 123-4567", address: "123 Creative Studio Way, NY 10012",
    quickLinks: ["Shop All", "Lookbook", "Our Story", "Journal"],
    customerService: ["FAQ", "Shipping & Returns", "Privacy Policy", "Terms of Service"]
  }
};

// --- DYNAMIC RENDERING ENGINE ---

const DynamicHeader = ({ config }) => {
  const { theme, header, content } = config;

  if (header.layout === 'search-centric') {
    return (
      <div className="w-full flex flex-col" style={{ backgroundColor: header.bg, color: header.text }}>
        <div className="bg-black/5 text-xs py-1.5 px-4 flex justify-between border-b border-black/5">
          <div className="flex gap-4 opacity-80"><span>Welcome to {content.storeName}</span><span>{content.topBarText}</span></div>
          <div className="flex gap-4 opacity-80"><span>Sign In</span><span>Track Order</span></div>
        </div>
        <div className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center gap-8">
          <h1 className="text-3xl font-black tracking-tighter" style={{ color: theme.primary }}>{content.logoText}</h1>
          <div className="flex-1 flex items-center border-2 overflow-hidden" style={{ borderColor: theme.primary, borderRadius: theme.borderRadius }}>
            <input type="text" placeholder="Search products, categories..." className="flex-1 outline-none px-4 py-2.5 text-sm bg-transparent" />
            <button className="px-8 py-2.5 text-white font-bold text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: theme.primary }}>Search</button>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center cursor-pointer hover:opacity-70"><User size={20}/><span className="text-[10px] mt-1">Account</span></div>
            <div className="flex flex-col items-center cursor-pointer hover:opacity-70"><ShoppingCart size={20}/><span className="text-[10px] mt-1">Cart</span></div>
          </div>
        </div>
        <div className="border-t border-black/5 px-6">
           <div className="max-w-7xl mx-auto flex items-center gap-8 text-[13px] font-medium py-3">
             <div className="flex items-center gap-2 font-bold uppercase tracking-wider" style={{ color: theme.primary }}><Menu size={16}/> All Categories</div>
             {content.categories.slice(0, 6).map((c, i) => <span key={i} className="cursor-pointer hover:opacity-70">{c}</span>)}
           </div>
        </div>
      </div>
    );
  }

  if (header.layout === 'logo-center') {
    return (
      <div className="w-full flex flex-col border-b border-black/5 sticky top-0 z-10" style={{ backgroundColor: header.bg, color: header.text }}>
        <div className="w-full bg-black text-white text-[10px] uppercase tracking-widest text-center py-2">{content.topBarText}</div>
        <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[12px] font-medium tracking-wide uppercase flex-1">
             <span className="cursor-pointer hover:opacity-60 transition-opacity">Shop</span>
             <span className="cursor-pointer hover:opacity-60 transition-opacity">Collections</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-center flex-1">{content.logoText}</h1>
          <div className="flex items-center justify-end gap-6 flex-1">
            <Search size={18} className="cursor-pointer hover:opacity-60 transition-opacity"/>
            <User size={18} className="cursor-pointer hover:opacity-60 transition-opacity"/>
            <ShoppingBag size={18} className="cursor-pointer hover:opacity-60 transition-opacity"/>
          </div>
        </div>
      </div>
    );
  }

  // default logo-left
  return (
    <div className="w-full sticky top-0 z-10 border-b border-black/5 shadow-sm" style={{ backgroundColor: header.bg, color: header.text }}>
       <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <h1 className="text-2xl font-black tracking-tight">{content.logoText}</h1>
          <div className="flex gap-8 text-sm font-medium">
             {content.categories.slice(0, 4).map((c, i) => <span key={i} className="cursor-pointer hover:opacity-60 transition-opacity">{c}</span>)}
          </div>
          <div className="flex items-center gap-5">
             <Search size={20} className="cursor-pointer hover:opacity-60 transition-opacity"/>
             <User size={20} className="cursor-pointer hover:opacity-60 transition-opacity"/>
             <div className="relative cursor-pointer hover:opacity-60 transition-opacity">
               <ShoppingCart size={20} />
               <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] text-white flex items-center justify-center font-bold" style={{ backgroundColor: theme.primary, borderRadius: '999px' }}>0</span>
             </div>
          </div>
       </div>
    </div>
  );
};

const DynamicHero = ({ config }) => {
  const { theme, hero, content } = config;

  const btnClass = `px-8 py-3.5 font-bold tracking-wide text-sm transition-transform hover:scale-105`;
  const btnStyle = hero.buttonStyle === 'outline' 
    ? { border: `2px solid ${theme.primary}`, color: theme.primary, borderRadius: theme.borderRadius } 
    : { backgroundColor: theme.primary, color: '#fff', borderRadius: theme.borderRadius };

  if (hero.layout === 'sidebar-menu') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-4 flex gap-4 h-[450px]">
        <div className="w-[260px] bg-white border border-black/5 shadow-sm hidden md:flex flex-col py-3 shrink-0 h-full" style={{ borderRadius: theme.borderRadius }}>
          {content.categories.map((cat, i) => (
            <div key={i} className="px-5 py-3 text-[13px] font-medium cursor-pointer flex justify-between items-center hover:bg-black/5 transition-colors">
               <span>{cat}</span> <ChevronRight size={14} className="opacity-40"/>
            </div>
          ))}
        </div>
        <div className="flex-1 relative overflow-hidden group h-full" style={{ borderRadius: theme.borderRadius }}>
           <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${content.heroImage})` }}></div>
           <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
           <div className="absolute left-10 top-1/2 -translate-y-1/2 max-w-lg">
             <h2 className="text-white text-5xl font-black mb-4 leading-tight">{content.heroTitle}</h2>
             <p className="text-white/90 text-lg mb-8 leading-relaxed">{content.heroSubtitle}</p>
             <button className={btnClass} style={btnStyle}>Shop Now</button>
           </div>
        </div>
      </div>
    );
  }

  if (hero.layout === 'centered-overlay') {
    return (
      <div className="w-full h-[600px] relative flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${content.heroImage})` }}></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-3xl px-6">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-lg">{content.heroTitle}</h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-light drop-shadow-md">{content.heroSubtitle}</p>
          <button className={btnClass} style={btnStyle}>Explore Collection</button>
        </div>
      </div>
    );
  }

  if (hero.layout === 'split-right') {
    return (
      <div className="w-full flex flex-col md:flex-row min-h-[500px]" style={{ backgroundColor: theme.surface }}>
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center" style={{ backgroundImage: `url(${content.heroImage})` }}></div>
        <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center items-start">
           <h2 className="text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tight">{content.heroTitle}</h2>
           <p className="text-lg opacity-70 mb-10 leading-relaxed">{content.heroSubtitle}</p>
           <button className={btnClass} style={btnStyle}>Discover More</button>
        </div>
      </div>
    );
  }

  // default split-left
  return (
    <div className="w-full flex flex-col md:flex-row min-h-[500px]" style={{ backgroundColor: theme.surface }}>
      <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center items-start">
         <h2 className="text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tight">{content.heroTitle}</h2>
         <p className="text-lg opacity-70 mb-10 leading-relaxed">{content.heroSubtitle}</p>
         <button className={btnClass} style={btnStyle}>Discover More</button>
      </div>
      <div className="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center" style={{ backgroundImage: `url(${content.heroImage})` }}></div>
    </div>
  );
};

const DynamicGrid = ({ config }) => {
  const { theme, grid, content } = config;

  const colsClass = grid.columns === 3 ? 'md:grid-cols-3' : grid.columns === 5 ? 'md:grid-cols-4 lg:grid-cols-5' : 'md:grid-cols-4';
  const aspectClass = grid.imageAspect === 'portrait' ? 'aspect-[3/4]' : grid.imageAspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square';
  const alignClass = grid.textAlignment === 'center' ? 'text-center' : 'text-left';
  
  const getCardStyle = () => {
    if (grid.cardStyle === 'shadow') return { border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backgroundColor: theme.surface };
    if (grid.cardStyle === 'bordered') return { border: '1px solid rgba(0,0,0,0.1)', backgroundColor: theme.surface };
    return { border: 'none', backgroundColor: 'transparent' }; // minimal
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-20">
      <div className={`mb-12 ${grid.textAlignment === 'center' ? 'text-center' : 'flex items-end justify-between'}`}>
        <h3 className="text-3xl font-black tracking-tight">Trending Now</h3>
        {grid.textAlignment !== 'center' && <span className="text-sm font-bold cursor-pointer hover:opacity-70" style={{ color: theme.primary }}>View All</span>}
      </div>
      
      <div className={`grid grid-cols-2 ${colsClass} gap-x-6 gap-y-10`}>
        {content.products.map((p, i) => (
          <div key={i} className="group cursor-pointer flex flex-col overflow-hidden" style={{ ...getCardStyle(), borderRadius: theme.borderRadius }}>
            <div className={`w-full ${aspectClass} relative overflow-hidden bg-black/5`}>
               <img src={p.image} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" alt={p.title}/>
               {p.oldPrice && (
                 <div className="absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider" style={{ backgroundColor: theme.primary, borderRadius: theme.borderRadius }}>
                   Sale
                 </div>
               )}
            </div>
            <div className={`p-4 flex flex-col flex-1 ${alignClass}`}>
               <h4 className="text-[14px] font-semibold mb-1.5 leading-snug line-clamp-2 group-hover:opacity-70 transition-opacity">{p.title}</h4>
               <div className={`mt-auto flex items-baseline gap-2 ${grid.textAlignment === 'center' ? 'justify-center' : ''}`}>
                 <span className="text-[16px] font-black" style={{ color: theme.primary }}>${p.price.toFixed(2)}</span>
                 {p.oldPrice && <span className="text-[12px] opacity-50 line-through">${p.oldPrice.toFixed(2)}</span>}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DynamicFooter = ({ config }) => {
  const { theme, content } = config;
  
  return (
    <footer className="w-full pt-20 pb-8 mt-auto border-t border-white/10" style={{ backgroundColor: '#111111', color: '#9ca3af', fontFamily: theme.fontFamily }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-8">
        <div>
          <h3 className="text-3xl font-black tracking-tighter mb-4 text-white">{content.logoText}</h3>
          <p className="text-[13px] leading-relaxed mb-6">{content.footerAbout}</p>
        </div>
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Shop</h4>
          <ul className="space-y-3 text-[13px]">
            {content.quickLinks?.map((link, i) => <li key={i} className="hover:text-white cursor-pointer transition-colors">{link}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Support</h4>
          <ul className="space-y-3 text-[13px]">
            {content.customerService?.map((link, i) => <li key={i} className="hover:text-white cursor-pointer transition-colors">{link}</li>)}
          </ul>
        </div>
        <div>
           <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Contact Us</h4>
           <ul className="space-y-4 text-[13px]">
             <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0" style={{ color: theme.primary }}/><span className="leading-relaxed">{content.address}</span></li>
             <li className="flex items-center gap-3"><Phone size={16} className="shrink-0" style={{ color: theme.primary }}/><span className="hover:text-white cursor-pointer transition-colors">{content.contactPhone}</span></li>
             <li className="flex items-center gap-3"><Mail size={16} className="shrink-0" style={{ color: theme.primary }}/><span className="hover:text-white cursor-pointer transition-colors">{content.contactEmail}</span></li>
           </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[11px] font-medium tracking-wide">
        <div>© {new Date().getFullYear()} {content.storeName}. All Rights Reserved.</div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
           {content.customerService?.filter(l => l.toLowerCase().includes('term') || l.toLowerCase().includes('privacy')).map((legal, i) => (
             <span key={i} className="cursor-pointer hover:text-white transition-colors">{legal}</span>
           ))}
        </div>
      </div>
    </footer>
  );
};

const AdvancedAIPreview = ({ config }) => {
  return (
    <div 
      className="font-sans pb-0 w-full h-full overflow-y-auto custom-scrollbar relative flex flex-col transition-colors duration-500"
      style={{ 
        backgroundColor: config.theme.bg,
        color: config.theme.text,
        fontFamily: config.theme.fontFamily
      }}
    >
      <DynamicHeader config={config} />
      <div className="flex-1">
        <DynamicHero config={config} />
        <DynamicGrid config={config} />
      </div>
      <DynamicFooter config={config} />
      
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
      `}}/>
    </div>
  );
};

// --- AI BUILDER STUDIO INTERFACE ---
const AIBuilderDialog = ({ initialConfig, onClose }) => {
  const [config, setConfig] = useState(initialConfig);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState([
    { role: 'assistant', text: "Welcome to the AI Design Studio. You have infinite freedom here. Describe any e-commerce layout, vibe, or aesthetic—or upload a screenshot for me to clone visually!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [rawBase64, setRawBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  
  const fileRef = useRef(null);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);

  const handleSend = async () => {
    if (!chatInput.trim() && !previewImg) return;
    const userText = chatInput;
    const userImg = previewImg;
    const imageToProcess = rawBase64;
    const mimeToProcess = imageMimeType;
    
    setHistory(prev => [...prev, { role: 'user', text: userText, image: userImg }]);
    setChatInput('');
    setPreviewImg(null);
    setRawBase64(null);
    setImageMimeType(null);
    setLoading(true);

    try {
      if (!geminiApiKey) throw new Error("Missing Gemini API Key.");
      const newConfig = await generateStoreConfigAI(userText, imageToProcess, mimeToProcess, config);
      setConfig(newConfig);
      setHistory(prev => [...prev, { role: 'assistant', text: `Layout completely re-architected! I've applied the '${newConfig.header.layout}' header, '${newConfig.hero.layout}' hero, and adjusted grids, borders (${newConfig.theme.borderRadius}), and colors perfectly.` }]);
    } catch (e) {
      console.warn("AI Generation Failed.", e);
      setHistory(prev => [...prev, { role: 'assistant', text: `⚠️ Generation Error: ${e.message}. Check your API key or MIME types.` }]);
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
      <div className="h-14 bg-[#111] border-b border-white/10 flex items-center justify-between px-6 shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#7C3AED] animate-pulse" size={16} />
            <span className="text-[13px] font-bold text-white tracking-tight">Infinite AI Layout Engine</span>
          </div>
        </div>
        <button onClick={() => { alert('Design Stored in Database!'); onClose(); }} className="flex items-center gap-2 px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-sm text-[12px] font-bold transition-all shadow-md">
          <Save size={14} /> Publish This Design
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[380px] border-r border-white/10 bg-[#161616] flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {history.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-sm px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-[#7C3AED] text-white' : 'bg-[#222] text-white/90 border border-white/10'
                }`}>
                  {msg.image && <img src={msg.image} className="rounded-sm mb-3 max-h-48 object-cover w-full border border-white/10" alt="upload" />}
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 text-white/60 text-[12px] bg-[#222] w-fit p-3 rounded-sm border border-white/10 shadow-sm">
                <Loader2 size={16} className="animate-spin text-[#7C3AED]" /> Synthesizing new architecture...
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <div className="p-4 bg-[#111] border-t border-white/10">
            {previewImg && (
              <div className="mb-3 relative group w-16 shadow-md">
                <img src={previewImg} className="h-16 w-16 object-cover rounded-sm border border-white/20" alt="preview" />
                <button onClick={() => { setPreviewImg(null); setRawBase64(null); setImageMimeType(null); }} className="absolute -top-2 -right-2 bg-[#FE2C55] text-white rounded-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 bg-[#222] p-2 rounded-sm border border-white/10 focus-within:border-[#7C3AED]/50 transition-colors shadow-inner">
              <button onClick={() => fileRef.current.click()} className="p-2 text-white/40 hover:text-[#7C3AED] transition-colors rounded-sm" title="Upload screenshot to clone">
                <ImageIcon size={18} />
                <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={onFileChange} />
              </button>
              <textarea 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Describe a vibe or upload a screenshot..."
                className="flex-1 bg-transparent text-[13px] text-white py-2 px-1 outline-none resize-none max-h-32 min-h-[40px] custom-scrollbar"
                rows={1}
              />
              <button onClick={handleSend} disabled={loading || (!chatInput.trim() && !previewImg)} className="p-2 bg-[#7C3AED] text-white rounded-sm hover:bg-[#6D28D9] disabled:opacity-30 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#050505] p-8 flex items-center justify-center overflow-hidden relative">
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <span className="bg-black/90 text-[#00ffcc] text-[10px] font-mono px-3 py-1.5 rounded-sm uppercase tracking-wider border border-[#00ffcc]/30 shadow-md backdrop-blur-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-[#00ffcc] rounded-full animate-pulse"></div>
               Live DOM Render Engine
            </span>
          </div>
          <div className="w-full max-w-[1280px] h-full overflow-hidden rounded-md border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 bg-white relative">
             <AdvancedAIPreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
};


// --- DEFAULT TIKTOK/DASHBOARD PREVIEWER ---
const StoreLivePreview = ({ layout, color, title, logo, showFlashSale }) => {
  return (
    <div className="w-full h-full min-h-[500px] border border-[#E3E3E4] rounded-sm bg-white flex flex-col overflow-hidden shadow-sm sticky top-6">
      <div className="bg-[#F8F8F8] h-8 flex items-center px-3 gap-1.5 border-b border-[#E3E3E4] shrink-0">
        <div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-400"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-green-400"></div>
        <div className="ml-4 flex-1 bg-white h-4 rounded-sm border border-[#E3E3E4]"></div>
      </div>
      
      <div className="flex-1 overflow-hidden pointer-events-none select-none relative bg-white">
        {layout === 'Classic' && (
          <div className="flex flex-col h-full">
            <div className="h-8 border-b border-[#E3E3E4] flex items-center px-3 gap-2">
               {logo ? <img src={logo} alt="Logo" className="w-4 h-4 object-cover border border-[#E3E3E4] rounded-sm" /> : <div className="w-4 h-4 rounded-sm text-[8px] text-white flex items-center justify-center font-bold" style={{backgroundColor: color}}>C</div>}
               <div className="w-16 h-1.5 bg-[#E3E3E4] rounded-sm"></div>
            </div>
            <div className="h-28 w-full relative flex items-center justify-center bg-[#F8F8F8]">
               <div className="flex flex-col items-center">
                 <div className="text-sm font-bold text-[#161823] mb-1.5">{title}</div>
                 <div className="w-20 h-3 rounded-sm" style={{backgroundColor: color}}></div>
               </div>
            </div>
            <div className="p-4 flex-1">
               <div className="grid grid-cols-3 gap-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="aspect-square bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-2 flex flex-col">
                     <div className="flex-1 bg-[#E3E3E4] rounded-sm mb-1.5"></div>
                     <div className="w-full h-1.5 bg-[#E3E3E4] rounded-sm mb-1"></div>
                     <div className="w-1/2 h-2 rounded-sm" style={{backgroundColor: color}}></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
        {/* Placeholder for other 19 default layouts... (Kept Minimal for brevity) */}
        {layout !== 'Classic' && (
           <div className="flex items-center justify-center h-full text-center p-6">
              <div>
                <LayoutTemplate size={40} className="text-gray-300 mx-auto mb-4"/>
                <p className="text-sm font-bold text-gray-500 mb-1">{layout} Template</p>
                <p className="text-[10px] text-gray-400">Theme Color: <span style={{color}}>{color}</span></p>
              </div>
           </div>
        )}

        {showFlashSale && (
          <div className="absolute top-0 left-0 right-0 bg-[#FE2C55] text-white text-[8px] font-bold py-1 px-3 flex justify-between items-center shadow-md z-50">
             <span>⚡ FLASH SALE</span>
             <span>ENDS IN: 02:45:00</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ThemePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const [storeData] = useState({ title: 'My Store', logo: '' });
  const [layoutStyle, setLayoutStyle] = useState('Classic');
  const [themeColor, setThemeColor] = useState('#161823');
  const [flashSalesEnabled, setFlashSalesEnabled] = useState(false);

  const layoutOptions = [
    { name: 'Classic', desc: 'Clean & reliable. Great for electronics and mixed inventories.', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80&fit=crop&h=300' },
    { name: 'Modern', desc: 'Minimalist & tech-focused with split-screen imagery.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80&fit=crop&h=300' },
    { name: 'Bold', desc: 'High contrast & stark. Perfect for industrial or machinery.', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80&fit=crop&h=300' },
    { name: 'Minimal', desc: 'Extreme whitespace. Let the products speak for themselves.', image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&q=80&fit=crop&h=300' }
  ];
  const colorOptions = ['#161823', '#FE2C55', '#25F4EE', '#2563EB', '#16A34A', '#8B5CF6', '#F59E0B', '#10B981'];

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => {
        setMessage({ type: 'success', text: 'Store theme updated successfully!' });
        setIsSaving(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }, 1000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Theme & Design</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Customize how your storefront looks to customers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAiDialogOpen(true)}
            className="bg-gradient-to-r from-[#7C3AED] to-[#ec4899] hover:opacity-90 text-white px-5 py-2.5 rounded-sm font-semibold text-[13px] transition-all flex items-center gap-2 shadow-md shadow-purple-500/20"
          >
            <Sparkles size={16} className="animate-pulse"/>
            Create with AI
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#FE2C55] hover:bg-[#e0264b] text-white px-6 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Publish Theme'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-10">
        <div className="lg:w-[55%] space-y-6">
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E3E3E4] pb-3">
              <LayoutTemplate size={18} className="text-[#161823]" />
              <h2 className="text-base font-bold text-[#161823]">Store Templates</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <div 
                onClick={() => setIsAiDialogOpen(true)}
                className="group relative overflow-hidden rounded-sm border-2 border-transparent bg-[#111] hover:shadow-xl cursor-pointer transition-all flex flex-col items-center justify-center p-6 text-center h-[166px]"
              >
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black/90"></div>
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm relative z-10">
                   <Sparkles size={24} className="text-[#00ffcc]"/>
                 </div>
                 <h4 className="font-bold text-white text-[15px] mb-1 relative z-10 tracking-wide">Custom AI Design</h4>
                 <p className="text-[11px] text-gray-400 leading-relaxed px-2 relative z-10">Clone screenshots or describe any vibe you want.</p>
              </div>

              {layoutOptions.map((layout) => (
                <div 
                  key={layout.name}
                  onClick={() => setLayoutStyle(layout.name)}
                  className={`group relative overflow-hidden rounded-sm border cursor-pointer transition-all ${
                    layoutStyle === layout.name ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4] hover:border-[#8A8B91]'
                  }`}
                >
                  <div className="h-28 w-full bg-[#F8F8F8] relative border-b border-[#E3E3E4]">
                    <img src={layout.image} alt={layout.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161823]/90 to-transparent"></div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                       <h4 className="font-semibold text-white text-sm">{layout.name}</h4>
                       {layoutStyle === layout.name && <CheckCircle2 size={16} className="text-[#FE2C55]" fill="white" />}
                    </div>
                  </div>
                  <div className="p-3 bg-white h-full">
                    <p className="text-[11px] text-[#8A8B91] leading-relaxed">{layout.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: #F8F8F8; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 4px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
            `}} />
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E3E3E4] pb-3">
              <Palette size={18} className="text-[#161823]" />
              <h2 className="text-base font-bold text-[#161823]">Brand Colors</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all ${
                    themeColor === color ? 'ring-2 ring-offset-2 ring-[#161823]' : 'hover:opacity-80 border border-[#E3E3E4]'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {themeColor === color && <CheckCircle2 size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#E3E3E4] pb-3">
              <Zap size={18} className="text-[#161823]" />
              <h2 className="text-base font-bold text-[#161823]">Store Modules</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-[13px] font-bold text-[#161823]">Flash Sales Banner</h3>
                 <p className="text-[12px] text-[#8A8B91] mt-0.5">Show a promotional countdown banner highlighting discounted items.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={flashSalesEnabled} onChange={e => setFlashSalesEnabled(e.target.checked)} />
                <div className="w-9 h-5 bg-[#E3E3E4] peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E3E3E4] after:border after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FE2C55]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:w-[45%]">
           <div className="sticky top-6">
             <div className="flex items-center justify-between mb-3 px-1">
               <span className="text-[12px] font-bold text-[#161823] uppercase tracking-wider flex items-center gap-2">Live Preview</span>
               <span className="text-[10px] bg-[#F8F8F8] border border-[#E3E3E4] px-2 py-0.5 rounded-sm text-[#8A8B91] font-semibold">{layoutStyle} Theme</span>
             </div>
             <StoreLivePreview layout={layoutStyle} color={themeColor} title={storeData.title} logo={storeData.logo} showFlashSale={flashSalesEnabled} />
           </div>
        </div>
      </div>
      
      {isAiDialogOpen && (
        <AIBuilderDialog 
          initialConfig={INITIAL_AI_CONFIG}
          onClose={() => setIsAiDialogOpen(false)}
        />
      )}
    </div>
  );
}