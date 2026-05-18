"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Save, UploadCloud, Loader2, Trash2, ChevronDown, 
  ChevronRight, Plus, Image as ImageIcon, Sparkles, Wand2, 
  FileAudio, Video, Palette, Ruler, Box, ArrowLeft, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM4QQgxx3r7QHsB7rISulJtdHZCZrNPBw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "alxlite-5d4c2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "alxlite-5d4c2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "alxlite-5d4c2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "169080100237",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:169080100237:web:3b89079980c69c324519c4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-41FG7XS9CP"
};

let app, auth, db, storage;

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// Upload function handling Temporary Drafts
export const uploadFileToFirebase = async (file, folderPrefix, isTemp = false, sessionId = '') => {
  if (!storage || !auth) throw new Error('Firebase Storage or Auth is not initialized.');
  
  const userCredential = await signInAnonymously(auth);
  const currentUser = userCredential.user;
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  
  const tempPrefix = isTemp ? `temp/${sessionId}/` : '';
  const filePath = `stores/${currentUser.uid}/${tempPrefix}${folderPrefix}_${Date.now()}_${cleanFileName}`;
  
  const fileRef = ref(storage, filePath);
  const snapshot = await uploadBytesResumable(fileRef, file);
  return await getDownloadURL(snapshot.ref);
};

const MagicalLoader = ({ status }) => {
  const phrases = [
    "Analyzing product composition...",
    "Rendering complex geometries...",
    "Adjusting lighting and environment...",
    "Calculating shadows and highlights...",
    "Refining texture details...",
    "Applying visual enhancements...",
    "Processing final image layers...",
    "Optimizing resolution and quality...",
    "Synthesizing new camera angles...",
    "Enhancing product realism...",
    "Finalizing visual assets...",
    "Just a moment longer, pixels are aligning...",
    "Uploading to secure cloud storage..."
  ];
  
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % phrases.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white p-8 rounded-sm flex flex-col items-center justify-center max-w-sm w-full text-center border border-[#E3E3E4]">
        <Loader2 size={40} className="text-[#161823] animate-spin mb-6" />
        <h3 className="font-bold text-[16px] text-[#161823] mb-2 tracking-tight">{status}</h3>
        <div className="h-6 overflow-hidden flex items-center justify-center w-full">
          <p key={index} className="text-[13px] font-medium text-[#8A8B91] animate-pulse text-center">
            {phrases[index]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function ProductForm({ initialData = null, onSubmit, isSaving = false }) {
  const [isUploading, setIsUploading] = useState({ image: false, video: false, audio: false });
  const [images, setImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [internalIsSaving, setInternalIsSaving] = useState(false);
  
  const isEditing = !!initialData;
  const pageTitle = isEditing ? "Edit Product" : "Add New Product";
  const pageDescription = isEditing 
    ? "Update your product details, inventory, and variants."
    : "Create a new item listing for your store catalog.";

  // Draft / Temp Session ID
  const sessionId = useRef('');
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    }
  }, []);

  // Categories State
  const [dbCategories, setDbCategories] = useState([]);
  const [showCategoryCascader, setShowCategoryCascader] = useState(false);
  const [activeParentId, setActiveParentId] = useState(null);
  const cascaderRef = useRef(null);

  // Store Categories State (Custom Taxonomy)
  const [storeCategories, setStoreCategories] = useState([]);
  const [suggestedStoreCategories, setSuggestedStoreCategories] = useState([]);
  const [isSuggestingStoreCats, setIsSuggestingStoreCats] = useState(false);
  const [storeCategoryInput, setStoreCategoryInput] = useState('');
  const [showStoreCatDropdown, setShowStoreCatDropdown] = useState(false);
  const [syncMarketplaceCat, setSyncMarketplaceCat] = useState(true);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const storeCatRef = useRef(null);
  
  const localBase64Cache = useRef({}); 

  const [hasVariants, setHasVariants] = useState(false);
  const [activeVariantTab, setActiveVariantTab] = useState('Color'); 
  const [variantsHaveDifferentPrices, setVariantsHaveDifferentPrices] = useState(false);
  const [variants, setVariants] = useState([]);
  const [videoMode, setVideoMode] = useState('upload');

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', moq: '1', sku: '', stock: '1',
    category: '', storeCategory: '', tags: '', status: 'Active', isFlashItem: false, discountPercentage: '',
    attributes: [], videoDescription: '', audioDescription: ''
  });

  // AI & Image Generation States
  const [aiMode, setAiMode] = useState(true);
  const [imageGenModel, setImageGenModel] = useState('custom'); 
  
  // AI Studio Toolbar State
  const [keepOriginalBg, setKeepOriginalBg] = useState(false);
  const [aiBgColor, setAiBgColor] = useState('white');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [showAiPrompts, setShowAiPrompts] = useState(false);
  const [recommendedViews, setRecommendedViews] = useState([]);
  
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  const grokApiKey = process.env.NEXT_PUBLIC_GROK_API_KEY || "";

  const TEXT_MODEL_ID = "gemini-2.5-flash";
  const TTS_MODEL_ID = "gemini-3.1-flash-tts-preview";
  const IMAGE_MODEL_ID = "grok-imagine-image-quality";
  const CUSTOM_IMAGE_API = "http://localhost:5000/api/create-image";

  useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem('product_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed.formData || formData);
          if (parsed.images) setImages(parsed.images);
          if (parsed.variants) setVariants(parsed.variants);
          if (parsed.sessionId) sessionId.current = parsed.sessionId;
          if (parsed.storeCategoryInput) setStoreCategoryInput(parsed.storeCategoryInput);
        } catch(e) { console.error("Failed to load draft", e); }
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && (formData.title || images.length > 0)) {
      const draft = { formData, images, variants, sessionId: sessionId.current, storeCategoryInput };
      localStorage.setItem('product_draft', JSON.stringify(draft));
    }
  }, [formData, images, variants, storeCategoryInput, initialData]);

  useEffect(() => {
    const fetchGlobalCategories = async () => {
      try {
        const response = await fetch('/api/categories', { headers: { 'ngrok-skip-browser-warning': 'true' }});
        const result = await response.json();
        if (result.success && result.data) setDbCategories(result.data);
      } catch (error) { console.error("Failed to fetch global categories:", error); }
    };
    
    const fetchStoreCategories = async () => {
      try {
        const response = await fetch('/api/stores/categories', { headers: { 'ngrok-skip-browser-warning': 'true' }});
        const result = await response.json();
        if (result.success && result.data) setStoreCategories(result.data);
      } catch (error) { console.error("Failed to fetch store categories:", error); }
    };

    fetchGlobalCategories();
    fetchStoreCategories();
  }, []);

  useEffect(() => {
    if (syncMarketplaceCat && formData.category && dbCategories.length > 0) {
      const selectedGlobal = dbCategories.find(c => c._id === formData.category);
      if (selectedGlobal) {
        setStoreCategoryInput(selectedGlobal.name);
        const match = storeCategories.find(c => c.name.toLowerCase() === selectedGlobal.name.toLowerCase());
        if (match) {
           setFormData(prev => ({ ...prev, storeCategory: match._id }));
        } else {
           setFormData(prev => ({ ...prev, storeCategory: '' })); // Needs creation
        }
      }
    }
  }, [formData.category, syncMarketplaceCat, dbCategories, storeCategories]);

  useEffect(() => {
    if (!formData.category || !aiMode || syncMarketplaceCat) {
      setSuggestedStoreCategories([]);
      return;
    }

    const globalCat = dbCategories.find(c => c._id === formData.category);
    if (!globalCat) return;

    const generateStoreCatSuggestions = async () => {
      setIsSuggestingStoreCats(true);
      try {
        const prompt = `A merchant is listing a product in the global category "${globalCat.name}". Suggest 3 short, logical custom "Store Subcategories" this merchant might use. Return ONLY a raw JSON array of strings.`;
        const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
        });

        let responseText = result.candidates[0].content.parts[0].text.replace(/```json\n?/gi, '').replace(/\n?পদে```/gi, '').trim();
        const suggestions = JSON.parse(responseText);
        if (Array.isArray(suggestions)) setSuggestedStoreCategories(suggestions);
      } catch (error) { console.error("Failed to suggest store categories", error); } 
      finally { setIsSuggestingStoreCats(false); }
    };

    const timeout = setTimeout(generateStoreCatSuggestions, 800);
    return () => clearTimeout(timeout);
  }, [formData.category, aiMode, syncMarketplaceCat, dbCategories]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '', description: initialData.description || '', price: initialData.price || '',
        moq: initialData.moq || '1', sku: initialData.sku || '', tags: initialData.tags || '',
        stock: initialData.stock !== undefined ? String(initialData.stock) : '1', 
        category: initialData.categoryRef?._id || initialData.categoryRef || '',
        storeCategory: initialData.storeCategoryRef?._id || initialData.storeCategoryRef || '',
        status: initialData.status || 'Active', isFlashItem: initialData.isFlashItem || false,
        discountPercentage: initialData.discountPercentage || '', attributes: initialData.attributes || [],
        videoDescription: initialData.videoDescription || '', audioDescription: initialData.audioDescription || ''
      });
      setStoreCategoryInput(initialData.storeCategoryRef?.name || '');
      setImages(initialData.images?.length > 0 ? initialData.images : (initialData.image ? [initialData.image] : []));
      setHasVariants(initialData.hasVariants || false);
      setVariantsHaveDifferentPrices(initialData.variantsHaveDifferentPrices || false);
      setVariants(initialData.variants?.map((v, i) => ({ 
        ...v, id: v._id || String(i), type: v.type || 'Color', name: v.name || '',
        stock: v.stock !== undefined ? String(v.stock) : '1', price: v.price || '', isUploading: false 
      })) || []);
      if (initialData.videoDescription?.includes('youtube.com') || initialData.videoDescription?.includes('youtu.be')) setVideoMode('youtube');
    }
  }, [initialData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cascaderRef.current && !cascaderRef.current.contains(e.target)) setShowCategoryCascader(false);
      if (storeCatRef.current && !storeCatRef.current.contains(e.target)) setShowStoreCatDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addAttribute = () => setFormData(prev => ({ ...prev, attributes: [...prev.attributes, { name: '', value: '' }] }));
  const removeAttribute = (index) => setFormData(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
  const updateAttribute = (index, field, val) => setFormData(prev => {
    const newAttrs = [...prev.attributes]; newAttrs[index][field] = val; return { ...prev, attributes: newAttrs };
  });

  const handleCreateStoreCategory = async () => {
    if (!storeCategoryInput.trim()) return;
    setIsSavingCategory(true);
    try {
      const res = await fetch('/api/stores/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeCategoryInput.trim() })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStoreCategories(prev => [...prev, json.data]);
        setFormData(prev => ({ ...prev, storeCategory: json.data._id }));
        setShowStoreCatDropdown(false);
      }
    } catch (e) { console.error("Failed to create store category", e); }
    setIsSavingCategory(false);
  };

  const processImageFile = async (file) => {
    setErrorMessage('');
    if (!file?.type.startsWith('image/')) return;
    setIsUploading(prev => ({ ...prev, image: true }));
    try {
      const base64 = await fileToBase64(file);
      const isNewForm = !initialData;
      const url = await uploadFileToFirebase(file, 'products/images', isNewForm, sessionId.current);
      localBase64Cache.current[url] = base64; 
      
      const isFirst = images.length === 0;
      setImages(prev => [...prev, url]);
      if (aiMode && isFirst) generateDetailsFromImage(file);
    } catch (err) { 
      console.error("Image upload error:", err);
      setErrorMessage("Image upload failed."); 
    } 
    finally { setIsUploading(prev => ({ ...prev, image: false })); }
  };

  const removeImage = async (idx) => {
    const urlToRemove = images[idx];
    setImages(prev => prev.filter((_, i) => i !== idx));
    
    // If it's a temp file, permanently delete it from Firebase Storage
    if (urlToRemove.includes('/temp/')) {
      try {
        const fileRef = ref(storage, urlToRemove);
        await deleteObject(fileRef);
      } catch (e) { console.error("Failed to delete temp file", e); }
    }
  };

  const handleExtraMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(prev => ({ ...prev, [type]: true }));
    try {
      const folderPrefix = type === 'video' ? 'products/videos' : 'products/audio';
      const isNewForm = !initialData;
      const url = await uploadFileToFirebase(file, folderPrefix, isNewForm, sessionId.current);
      setFormData(prev => ({ ...prev, [type === 'video' ? 'videoDescription' : 'audioDescription']: url }));
    } catch (err) { 
      console.error(`Media upload error (${type}):`, err);
      setErrorMessage(`Failed to upload ${type}.`); 
    } 
    finally { setIsUploading(prev => ({ ...prev, [type]: false })); }
  };

  const handleVariantImageUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVariants(variants.map(v => v.id === id ? { ...v, isUploading: true } : v));
    try {
      const base64 = await fileToBase64(file);
      const isNewForm = !initialData;
      const downloadURL = await uploadFileToFirebase(file, 'products/variants', isNewForm, sessionId.current);
      localBase64Cache.current[downloadURL] = base64;
      setVariants(variants.map(v => v.id === id ? { ...v, image: downloadURL, isUploading: false } : v));
    } catch (error) { 
      console.error("Variant image upload error:", error);
      setVariants(variants.map(v => v.id === id ? { ...v, isUploading: false } : v)); 
    }
  };

  const fetchWithRetry = async (url, options, retries = 5) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        if (i === retries) throw new Error(`API Error: ${response.status}`);
      } catch (err) { if (i === retries) throw err; }
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const extractBase64FromUrl = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:image')) return url.split(',')[1];
    if (localBase64Cache.current[url]) return localBase64Cache.current[url];
    
    const fetchAsBase64 = async (fetchUrl) => {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const blob = await response.blob();
      
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid content type received: ${blob.type}. Expected an image.`);
      }
      return await fileToBase64(blob);
    };

    try {
      return await fetchAsBase64(url);
    } catch (e) {
      console.warn("Direct fetch failed (likely CORS). Trying proxies...");
      try {
        return await fetchAsBase64(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      } catch (e2) {
        try {
          return await fetchAsBase64(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        } catch (e3) {
          console.error("Base64 extraction failed across all proxy endpoints.");
          return null;
        }
      }
    }
  };

  const convertDataUrlToFile = async (dataUrl, filename) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type || 'image/png', lastModified: Date.now() });
    } catch (e) {
      const arr = dataUrl.split(','); const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n);
      while(n--){ u8arr[n] = bstr.charCodeAt(n); }
      return new File([u8arr], filename, { type: mime, lastModified: Date.now() });
    }
  };

  const moveTempFileToPermanent = async (url, folderPath) => {
    if (!url.includes('/temp/')) return url;
    try {
      let blob;
      if (localBase64Cache.current[url]) {
         const res = await fetch(`data:image/jpeg;base64,${localBase64Cache.current[url]}`);
         blob = await res.blob();
      } else {
         const res = await fetch(url);
         blob = await res.blob();
      }
      
      const fileObj = new File([blob], `perm_${Date.now()}`, { type: blob.type || 'image/jpeg' });
      const permanentUrl = await uploadFileToFirebase(fileObj, folderPath, false); 
      
      try { await deleteObject(ref(storage, url)); } catch(e) { console.error("Temp GC failed", e); }
      return permanentUrl;
    } catch (e) {
      console.error("Failed to move file to permanent storage. Keeping temp url.", e);
      return url; 
    }
  };

  const generateDetailsFromImage = async (file) => {
    if (!aiMode) return;
    setIsAiProcessing(true); setAiStatus('Gemini is reasoning about your product...');
    try {
      const base64Data = await fileToBase64(file);
      const categoryContext = dbCategories.length > 0 
        ? `From this list: [${dbCategories.map(c => `[ID: ${c._id}] ${c.name}`).join(', ')}], select exactly one Category ID.`
        : `Return an empty string for category_id.`;
      const prompt = `Analyze this product image and provide: 1. A professional e-commerce title. 2. A 2-paragraph description. 3. A comma-separated string of 5 SEO keywords for tags. 4. ${categoryContext} 5. Suggest 3 to 5 technical product specifications as key-value pairs. 6. Provide exactly 3 short descriptions (under 5 words each) of logical additional camera angles or views for THIS specific product type (e.g., if clothing: "close up of fabric texture", "back view"; if electronics: "side ports view", etc.). IMPORTANT: Return ONLY a raw, valid JSON object.`;
      
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64Data } }] }],
          generationConfig: { 
            responseMimeType: "application/json",
            responseSchema: { 
              type: "OBJECT", 
              properties: { 
                title: { type: "STRING" }, 
                description: { type: "STRING" }, 
                tags: { type: "STRING" }, 
                category_id: { type: "STRING" }, 
                attributes: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, value: { type: "STRING" } } } }, 
                recommended_views: { type: "ARRAY", items: { type: "STRING" } } 
              } 
            } 
          }
        })
      });

      let responseText = result.candidates[0].content.parts[0].text.replace(/```json\n?/gi, '').replace(/\n?```/gi, '').trim();
      const aiData = JSON.parse(responseText);
      
      setFormData(prev => ({
        ...prev, title: aiData.title || prev.title, description: aiData.description || prev.description, tags: Array.isArray(aiData.tags) ? aiData.tags.join(', ') : aiData.tags || prev.tags,
        category: aiData.category_id || prev.category, attributes: aiData.attributes?.length > 0 ? aiData.attributes : prev.attributes
      }));

      if (aiData.recommended_views) setRecommendedViews(aiData.recommended_views);

      if (aiData.category_id && dbCategories.length > 0) {
        const selectedCat = dbCategories.find(c => c._id === aiData.category_id);
        if (selectedCat?.parentRef) setActiveParentId(selectedCat.parentRef);
        else if (selectedCat) setActiveParentId(selectedCat._id);
      }
      setShowAiPrompts(true);
    } catch (error) { console.error("Gemini Analysis Failed:", error); } 
    finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  const generateAnglesAI = async (viewsToGenerate = null) => {
    if (images.length === 0) return;
    let anglesToGenerate = viewsToGenerate || recommendedViews;
    if (!anglesToGenerate || anglesToGenerate.length === 0) {
      anglesToGenerate = ["left side view", "right side view", "close up detail"];
    }

    setIsAiProcessing(true); const newImages = [];
    const originalBase64 = await extractBase64FromUrl(images[0]);
    if (!originalBase64) { 
      setErrorMessage("Image extraction blocked by Firebase CORS. Please re-upload the primary image manually to generate AI variants, or configure your Firebase Bucket CORS rules."); 
      setIsAiProcessing(false); 
      return; 
    }

    const currentBgPref = keepOriginalBg ? 'original' : aiBgColor;
    const imageParams = {
        aspectRatio,
        backgroundPreference: currentBgPref,
        imageType: 'product'
    };

    for (let i = 0; i < anglesToGenerate.length; i++) {
      setAiStatus(`Generating ${anglesToGenerate[i]}...`);
      try {
        const bgPrompt = currentBgPref === 'original' 
          ? "Maintain the original background, lighting, and environment exactly as it is." 
          : currentBgPref === 'black'
          ? "Use a sleek black studio background."
          : currentBgPref === 'light_grey'
          ? "Use a seamless light grey studio background."
          : "Use a clean white background, keeping natural ground shadows for realism.";
        
        const aspectPrompt = aspectRatio !== '1:1' ? ` Ensure the final image strictly has a ${aspectRatio} aspect ratio.` : "";
        const prompt = `Modify the product in the image to show exactly this view: "${anglesToGenerate[i]}". Ensure the product can be viewed clearly as requested. ${bgPrompt}${aspectPrompt} Keep the exact same product design, branding, color, and texture.`;
        let finalImageUrl = '';

        if (imageGenModel === 'custom') {
          const result = await fetchWithRetry(CUSTOM_IMAGE_API, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, imageBase64: `data:image/jpeg;base64,${originalBase64}`, imageParams })
          });
          if (result.success && result.image) finalImageUrl = result.image;
        } else {
          const result = await fetchWithRetry(`https://api.x.ai/v1/images/edits`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${grokApiKey}` },
            body: JSON.stringify({ model: IMAGE_MODEL_ID, prompt, n: 1, response_format: "b64_json", image: { url: `data:image/jpeg;base64,${originalBase64}` } })
          });
          if (result.data?.[0]?.b64_json) finalImageUrl = `data:image/png;base64,${result.data[0].b64_json}`;
          else if (result.data?.[0]?.url) finalImageUrl = result.data[0].url;
        }
        
        if (finalImageUrl) {
          setAiStatus(`Uploading ${anglesToGenerate[i]} to Storage...`);
          let fileToUpload = finalImageUrl.startsWith('data:image') 
            ? await convertDataUrlToFile(finalImageUrl, `angle_${i}_${Date.now()}.png`)
            : new File([await (await fetch(finalImageUrl)).blob()], `angle_${i}.png`, { type: 'image/png', lastModified: Date.now() });

          const uploadUrl = await uploadFileToFirebase(fileToUpload, 'products/images', !initialData, sessionId.current);
          localBase64Cache.current[uploadUrl] = await fileToBase64(fileToUpload);
          newImages.push(uploadUrl);

          setRecommendedViews(prev => prev.filter(v => v !== anglesToGenerate[i]));
        }
      } catch (error) { console.error(`Failed angle:`, error); }
    }
    if (newImages.length > 0) setImages(prev => [...prev, ...newImages]);
    setIsAiProcessing(false); setAiStatus('');
  };

  const generateVariantImageAI = async (variantId) => {
    const variantIndex = variants.findIndex(v => v.id === variantId);
    if (variantIndex === -1) return;
    const variantToEdit = variants[variantIndex];

    if (images.length === 0 || !variantToEdit.name) return setErrorMessage("Upload primary image and name variant.");
    const originalBase64 = await extractBase64FromUrl(images[0]);
    if (!originalBase64) return setErrorMessage("Image extraction blocked by Firebase CORS. Please re-upload the primary image manually to generate AI variants.");

    setIsAiProcessing(true); setAiStatus(`Generating ${variantToEdit.type} image for "${variantToEdit.name}"...`);
    try {
      const currentBgPref = keepOriginalBg ? 'original' : aiBgColor;
      const bgPrompt = currentBgPref === 'original' 
        ? "Maintain the same lighting, background, and overall environment exactly as it is."
        : currentBgPref === 'black'
        ? "Use a sleek black studio background."
        : currentBgPref === 'light_grey'
        ? "Use a seamless light grey studio background."
        : "Use a clean white background, keeping natural ground shadows for realism.";

      const aspectPrompt = aspectRatio !== '1:1' ? ` Ensure the final image strictly has a ${aspectRatio} aspect ratio.` : "";
      const prompt = `Modify the product in the image to be the ${variantToEdit.type}: "${variantToEdit.name}". ${bgPrompt}${aspectPrompt} Maintain the overall design.`;
      let finalImageUrl = '';

      const imageParams = {
        aspectRatio,
        backgroundPreference: currentBgPref,
        imageType: 'variant'
      };

      if (imageGenModel === 'custom') {
         const result = await fetchWithRetry(CUSTOM_IMAGE_API, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, imageBase64: `data:image/jpeg;base64,${originalBase64}`, imageParams })
         });
         if (result.success && result.image) finalImageUrl = result.image;
      } else {
        const result = await fetchWithRetry(`https://api.x.ai/v1/images/edits`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${grokApiKey}` },
          body: JSON.stringify({ model: IMAGE_MODEL_ID, prompt, n: 1, response_format: "b64_json", image: { url: `data:image/jpeg;base64,${originalBase64}` } })
        });
        finalImageUrl = result.data?.[0]?.b64_json ? `data:image/png;base64,${result.data[0].b64_json}` : result.data?.[0]?.url;
      }

      if (finalImageUrl) {
        setAiStatus('Uploading variant image...');
        let fileToUpload = finalImageUrl.startsWith('data:image') 
            ? await convertDataUrlToFile(finalImageUrl, `variant_${variantIndex}_${Date.now()}.png`)
            : new File([await (await fetch(finalImageUrl)).blob()], `variant_${variantIndex}.png`, { type: 'image/png', lastModified: Date.now() });

        const uploadUrl = await uploadFileToFirebase(fileToUpload, 'products/variants', !initialData, sessionId.current);
        localBase64Cache.current[uploadUrl] = await fileToBase64(fileToUpload);
        
        setVariants(variants.map(v => v.id === variantId ? { ...v, image: uploadUrl } : v));
      }
    } catch (error) { console.error(error); setErrorMessage("Failed to generate variant image."); } 
    finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  const suggestVariantsAI = async () => {
    setIsAiProcessing(true); setAiStatus(`Reasoning logical ${activeVariantTab} options...`);
    try {
      const prompt = `Based on "${formData.title}", suggest 3 logical "${activeVariantTab}" options. Return raw JSON array of strings.`;
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          generationConfig: { 
            responseMimeType: "application/json", 
            responseSchema: { type: "ARRAY", items: { type: "STRING" } } 
          } 
        })
      });
      let responseText = result.candidates[0].content.parts[0].text.replace(/```json\n?/gi, '').replace(/\n?```/gi, '').trim();
      const suggested = JSON.parse(responseText);
      if (Array.isArray(suggested)) {
        setHasVariants(true);
        const newSuggestions = suggested.map((name, i) => ({ 
          id: Date.now().toString() + i, type: activeVariantTab, name, price: '', stock: '1', image: '', isUploading: false 
        }));
        setVariants(prev => [...prev, ...newSuggestions]);
      }
    } catch (error) { console.error(error); } finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  const generateAudioDescriptionAI = async () => {
    if (!formData.description) return setErrorMessage("Generate description first.");
    setIsAiProcessing(true); setAiStatus('Rendering audio ad...');
    try {
      const result = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL_ID}:generateContent?key=${geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Read enthusiastically: ${formData.description}` }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } } })
      });
      const binary = atob(result.candidates[0].content.parts[0].inlineData.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const wavHeader = new ArrayBuffer(44); const view = new DataView(wavHeader);
      const writeString = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      writeString(0, 'RIFF'); view.setUint32(4, 36 + bytes.length, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
      view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, bytes.length, true);
      
      const file = new File([new Blob([wavHeader, bytes], { type: 'audio/wav' })], `audio_${Date.now()}.wav`, { type: 'audio/wav', lastModified: Date.now() });
      setAiStatus('Uploading Audio...');
      const url = await uploadFileToFirebase(file, 'products/audio', !initialData, sessionId.current);
      setFormData(prev => ({...prev, audioDescription: url}));
    } catch (error) { console.error(error); setErrorMessage("Failed to generate audio."); } 
    finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  const generatePromoVideoAI = async () => {
    if (images.length === 0 || !formData.audioDescription) return setErrorMessage("Requires images and audio description.");
    setIsAiProcessing(true); setAiStatus('Creating Promotional Video...');
    try {
      const audioUrl = URL.createObjectURL(await (await fetch(formData.audioDescription)).blob());
      const audio = new Audio(audioUrl);

      const loadedImages = await Promise.all(images.map(async (src) => {
        const b64 = await extractBase64FromUrl(src);
        if (!b64) throw new Error("Failed to extract valid image data for video generation.");
        const objUrl = URL.createObjectURL(await convertDataUrlToFile('data:image/png;base64,' + b64, 'c.png'));
        return new Promise(res => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => res(img); img.src = objUrl; });
      }));

      const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(dest); source.connect(audioCtx.destination); 

      const combinedStream = new MediaStream([...canvas.captureStream(30).getTracks(), ...dest.stream.getTracks()]);
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      const chunks = []; recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = async () => {
        const file = new File([new Blob(chunks, { type: 'video/webm' })], `promo_${Date.now()}.webm`, { type: 'video/webm', lastModified: Date.now() });
        setAiStatus('Uploading Video...');
        try {
          const url = await uploadFileToFirebase(file, 'products/videos', !initialData, sessionId.current);
          setFormData(prev => ({...prev, videoDescription: url})); setVideoMode('upload');
        } catch (e) { setErrorMessage("Failed to upload video."); }
        setIsAiProcessing(false); setAiStatus(''); audioCtx.close();
      };

      let imgIndex = 0; let startTime = Date.now();
      const draw = () => {
        imgIndex = Math.floor((Date.now() - startTime) / 4000) % loadedImages.length;
        ctx.fillStyle = '#161823'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const img = loadedImages[imgIndex];
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
        const w = img.width * scale; const h = img.height * scale;
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.shadowBlur = 0; ctx.fillStyle = 'white'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(formData.title, canvas.width / 2, 80);
        if (!audio.ended && !audio.paused) requestAnimationFrame(draw); else recorder.stop();
      };
      recorder.start(); await audio.play(); draw();
    } catch (error) { console.error(error); setErrorMessage("Video generation failed."); setIsAiProcessing(false); setAiStatus(''); }
  };

  const handleFormSubmit = async () => {
    setErrorMessage('');
    
    // Split the validation to give precise errors
    if (!formData.title || !formData.title.trim()) { 
      setErrorMessage('Product Title is required.'); 
      return; 
    }
    
    if (!formData.price) { 
      setErrorMessage('Base Price is required. Please scroll down to the Pricing & Stock section.'); 
      return; 
    }
    
    if (!formData.category) { 
      setErrorMessage('Global Marketplace Category is required.'); 
      return; 
    }
    
    if (!formData.storeCategory && !storeCategoryInput.trim()) {
      setErrorMessage('A Store Category is required. Please type one and save it.');
      return;
    }
    
    if (!formData.storeCategory && storeCategoryInput.trim()) {
      setErrorMessage('Please click "Save Category" to confirm your new Store Category before submitting.');
      return;
    }
    
    setInternalIsSaving(true);
    setAiStatus('Finalizing assets...');
    setIsAiProcessing(true);

    const finalImages = await Promise.all(images.map(url => moveTempFileToPermanent(url, 'products/images')));
    
    let finalVideoDesc = formData.videoDescription;
    if (finalVideoDesc && finalVideoDesc.includes('/temp/')) {
        finalVideoDesc = await moveTempFileToPermanent(finalVideoDesc, 'products/videos');
    }
    
    let finalAudioDesc = formData.audioDescription;
    if (finalAudioDesc && finalAudioDesc.includes('/temp/')) {
        finalAudioDesc = await moveTempFileToPermanent(finalAudioDesc, 'products/audio');
    }

    const finalVariants = hasVariants ? await Promise.all(variants.map(async (v) => {
        let vImage = v.image;
        if (vImage && vImage.includes('/temp/')) {
             vImage = await moveTempFileToPermanent(vImage, 'products/variants');
        }
        return { 
          name: v.name, type: v.type, stock: Number(v.stock) || 0, image: vImage, 
          price: variantsHaveDifferentPrices ? v.price : '' 
        };
    })) : [];

    const payload = {
      ...formData, 
      categoryRef: formData.category, 
      storeCategory: formData.storeCategory, 
      images: finalImages, 
      image: finalImages[0] || '', 
      videoDescription: finalVideoDesc,
      audioDescription: finalAudioDesc,
      hasVariants, 
      variantsHaveDifferentPrices,
      variants: finalVariants
    };
    
    localStorage.removeItem('product_draft');
    
    setIsAiProcessing(false);
    if (onSubmit) onSubmit(payload);
    setInternalIsSaving(false);
  };

  const categoryTree = useMemo(() => {
    const parents = dbCategories.filter(c => !c.parentRef);
    return parents.map(p => ({ ...p, subCategories: dbCategories.filter(c => c.parentRef === p._id) }));
  }, [dbCategories]);

  const selectedCategoryName = useMemo(() => {
    const cat = dbCategories.find(c => c._id === formData.category);
    if (!cat) return "Select a category";
    const parent = dbCategories.find(p => p._id === cat.parentRef);
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  }, [formData.category, dbCategories]);

  const filteredStoreCategories = useMemo(() => {
    if (!storeCategoryInput) return storeCategories;
    return storeCategories.filter(c => c.name.toLowerCase().includes(storeCategoryInput.toLowerCase()));
  }, [storeCategories, storeCategoryInput]);

  const visibleVariants = variants.filter(v => v.type === activeVariantTab);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 relative">
      {isAiProcessing && <MagicalLoader status={aiStatus} />}
      
      {/* Header Bar - No Background, flat style */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Link 
            href="/seller/products" 
            className="mt-1 p-1.5 border border-[#E3E3E4] text-[#8A8B91] hover:text-[#161823] bg-transparent rounded-sm hover:bg-[#F8F8F8] transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#161823] tracking-tight">{pageTitle}</h1>
            <p className="text-[13px] text-[#8A8B91] mt-0.5">{pageDescription}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {aiMode && (
            <select value={imageGenModel} onChange={(e) => setImageGenModel(e.target.value)} className="text-[12px] font-medium bg-transparent border border-[#E3E3E4] rounded-sm px-2 py-1.5 outline-none focus:border-[#161823] transition-colors">
              <option value="custom">Model: Custom API</option>
              <option value="grok">Model: Grok AI</option>
            </select>
          )}
          <div className="flex items-center gap-2 bg-transparent px-3 py-1.5 rounded-sm border border-[#E3E3E4]">
            <Sparkles size={16} className={aiMode ? "text-[#7C3AED]" : "text-[#8A8B91]"} />
            <span className="text-[13px] font-semibold text-[#161823]">AI Copilot</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(!aiMode)} />
              <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#7C3AED] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          <button onClick={handleFormSubmit} disabled={isSaving || internalIsSaving} className="flex items-center gap-2 px-5 py-2 bg-[#161823] rounded-sm text-[13px] font-semibold text-white hover:bg-black transition-colors disabled:opacity-50">
            {(isSaving || internalIsSaving) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {(isSaving || internalIsSaving) ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {errorMessage && <div className="mb-6 p-3 bg-[#FEE2E2] border border-[#FE2C55]/20 text-[#FE2C55] rounded-sm text-[13px] font-semibold flex items-center gap-2">⚠️ {errorMessage}</div>}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[65%] space-y-6">
          {/* Visuals Section */}
          <div className={`bg-white border rounded-sm p-5 md:p-6 ${aiMode ? 'border-[#7C3AED]/50 ring-1 ring-[#7C3AED]/10' : 'border-[#E3E3E4]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#161823]">Product Visuals</h2>
            </div>
            
            {/* Image Grid - 5 columns for smaller boxes */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="aspect-square border border-[#E3E3E4] rounded-sm relative group overflow-hidden bg-[#F8F8F8]">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-white/90 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-[#FEE2E2] transition-all"><Trash2 size={14} className="text-[#FE2C55]" /></button>
                  {idx === 0 && <div className="absolute bottom-1 left-1 bg-[#161823] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Cover</div>}
                </div>
              ))}
              <label className="aspect-square border border-dashed border-[#E3E3E4] rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#161823] transition-colors bg-[#F8F8F8] hover:bg-white">
                {isUploading.image ? <Loader2 size={20} className="animate-spin text-[#8A8B91]" /> : <UploadCloud size={20} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />}
                <span className="text-[11px] font-semibold mt-1.5 text-[#161823]">Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => processImageFile(e.target.files[0])} disabled={isUploading.image} />
              </label>
            </div>

            {}
            {aiMode && images.length > 0 && (
              <div className="mt-6 border border-[#7C3AED]/30 bg-[#F8F8F8] rounded-sm overflow-hidden">
                
                {/* AI Studio Settings Toolbar */}
                <div className="bg-white px-4 py-3 border-b border-[#E3E3E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-[#7C3AED]" />
                    <span className="text-[13px] font-bold text-[#161823]">AI Studio Options</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="text-[11px] font-medium bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-2 py-1 outline-none hover:border-[#7C3AED] text-[#161823]">
                      <option value="1:1">1:1 Square</option>
                      <option value="4:3">4:3 Wide</option>
                      <option value="16:9">16:9 Cinema</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#161823] cursor-pointer">
                      <input type="checkbox" checked={keepOriginalBg} onChange={e => setKeepOriginalBg(e.target.checked)} className="rounded-sm accent-[#7C3AED]" />
                      Keep original background
                    </label>

                    {!keepOriginalBg && (
                      <div className="flex items-center gap-1 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-1">
                        <button onClick={() => setAiBgColor('white')} className={`w-5 h-5 rounded-sm border border-[#E3E3E4] bg-white shadow-sm ${aiBgColor === 'white' ? 'ring-2 ring-[#7C3AED] scale-110' : 'hover:scale-110'} transition-transform`} title="White Studio"></button>
                        <button onClick={() => setAiBgColor('light_grey')} className={`w-5 h-5 rounded-sm border border-gray-300 bg-gray-200 shadow-sm ${aiBgColor === 'light_grey' ? 'ring-2 ring-[#7C3AED] scale-110' : 'hover:scale-110'} transition-transform`} title="Light Grey Studio"></button>
                        <button onClick={() => setAiBgColor('black')} className={`w-5 h-5 rounded-sm border border-gray-600 bg-black shadow-sm ${aiBgColor === 'black' ? 'ring-2 ring-[#7C3AED] scale-110' : 'hover:scale-110'} transition-transform`} title="Black Studio"></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Suggested Angles Generation UI */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[#7C3AED]" />
                    <span className="text-[12px] font-bold text-[#161823]">
                      {recommendedViews.length > 0 ? 'AI Suggested Angles' : 'Generate Extra Angles'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(recommendedViews.length > 0 ? recommendedViews : ["Left side view", "Right side view", "Close up detail"]).map((view, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => generateAnglesAI([view])}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E3E4] hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-sm text-[11px] font-semibold text-[#161823] transition-colors shadow-sm"
                      >
                        <Plus size={12} /> {view}
                      </button>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => generateAnglesAI(recommendedViews.length > 0 ? recommendedViews : ["Left side view", "Right side view", "Close up detail"])}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#7C3AED] rounded-sm text-[11px] font-bold hover:bg-[#e9d5ff] transition-colors"
                    >
                      <Wand2 size={12} /> Generate All {recommendedViews.length > 0 ? recommendedViews.length : 3}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[#E3E3E4]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-semibold text-[#161823]">Product Video</label>
                  <div className="flex gap-2">
                    <button onClick={() => setVideoMode('upload')} className={`text-[11px] font-bold ${videoMode === 'upload' ? 'text-[#161823]' : 'text-[#8A8B91]'}`}>Upload</button>
                    <button onClick={() => setVideoMode('youtube')} className={`text-[11px] font-bold ${videoMode === 'youtube' ? 'text-[#161823]' : 'text-[#8A8B91]'}`}>YouTube</button>
                    <button onClick={() => setVideoMode('ai')} className={`text-[11px] font-bold ${videoMode === 'ai' ? 'text-[#7C3AED]' : 'text-[#8A8B91]'}`}>AI Promo</button>
                  </div>
                </div>
                <div className="border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm p-3 flex flex-col justify-center relative min-h-[70px]">
                  {videoMode === 'youtube' ? (
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-[#8A8B91]" />
                      <input type="text" value={formData.videoDescription} onChange={e => setFormData({...formData, videoDescription: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="w-full bg-transparent text-[12px] outline-none text-[#161823]" />
                    </div>
                  ) : videoMode === 'ai' ? (
                    <div className="flex flex-col items-center text-center">
                      <button onClick={generatePromoVideoAI} className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-sm text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#6D28D9] transition-colors"><Wand2 size={14} /> Generate Promo Video</button>
                    </div>
                  ) : formData.videoDescription && !formData.videoDescription.includes('youtube') ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Video size={16} className="text-[#161823] shrink-0" /><span className="text-[12px] text-[#161823] truncate max-w-[150px]">Video Uploaded</span></div>
                      <button onClick={() => {
                        if (formData.videoDescription.includes('/temp/')) deleteObject(ref(storage, formData.videoDescription)).catch(console.error);
                        setFormData({...formData, videoDescription: ''});
                      }} className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center hover:text-[#161823] text-[#8A8B91] transition-colors">
                      {isUploading.video ? <Loader2 size={16} className="animate-spin" /> : <><UploadCloud size={16} className="mb-1" /><span className="text-[11px] font-medium">Upload MP4</span></>}
                      <input type="file" accept="video/*" className="hidden" onChange={e => handleExtraMediaUpload(e, 'video')} disabled={isUploading.video} />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-semibold text-[#161823]">Audio Description</label>
                  {aiMode && formData.description && <button onClick={generateAudioDescriptionAI} className="text-[#7C3AED] text-[11px] font-bold flex items-center gap-1 hover:underline"><Sparkles size={12}/> Generate Ad</button>}
                </div>
                <div className="border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm p-3 flex flex-col justify-center relative min-h-[70px]">
                  {formData.audioDescription ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden"><FileAudio size={16} className="text-[#161823] shrink-0" /><audio src={formData.audioDescription} controls className="h-6 w-32" /></div>
                      <button onClick={() => {
                        if (formData.audioDescription.includes('/temp/')) deleteObject(ref(storage, formData.audioDescription)).catch(console.error);
                        setFormData({...formData, audioDescription: ''});
                      }} className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center hover:text-[#161823] text-[#8A8B91] transition-colors">
                      {isUploading.audio ? <Loader2 size={16} className="animate-spin" /> : <><UploadCloud size={16} className="mb-1" /><span className="text-[11px] font-medium">Upload MP3/WAV</span></>}
                      <input type="file" accept="audio/*" className="hidden" onChange={e => handleExtraMediaUpload(e, 'audio')} disabled={isUploading.audio} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {showAiPrompts && (
              <div className="mt-4 p-4 bg-[#F3E8FF] border border-[#7C3AED]/20 rounded-sm flex items-center justify-between">
                <p className="text-[12px] font-bold text-[#7C3AED]">AI mapped your product!</p>
                <button onClick={() => setShowAiPrompts(false)} className="text-[11px] text-[#7C3AED] font-bold hover:underline">Dismiss</button>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4 text-[#161823]">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 flex items-center gap-1.5 text-[#161823]">
                  Product Title <span className="text-[#FE2C55]">*</span>
                  {aiMode && formData.title && <Sparkles size={14} className="text-[#7C3AED]" />}
                </label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 flex items-center gap-1.5 text-[#161823]">
                  Description
                  {aiMode && formData.description && <Sparkles size={14} className="text-[#7C3AED]" />}
                </label>
                <textarea rows="6" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none resize-none focus:border-[#161823] transition-colors text-[#161823]" />
              </div>
            </div>
          </div>

          {}
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold flex items-center gap-1.5 text-[#161823]">
                Specifications 
                {aiMode && formData.attributes.length > 0 && <Sparkles size={14} className="text-[#7C3AED]" />}
              </h2>
            </div>
            <div className="space-y-3">
              {formData.attributes.map((attr, i) => (
                <div key={i} className="flex gap-2 items-center group">
                  <input type="text" value={attr.name} onChange={e => updateAttribute(i, 'name', e.target.value)} placeholder="Name" className="w-1/3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                  <input type="text" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} placeholder="Value" className="flex-1 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                  <button onClick={() => removeAttribute(i)} className="p-2 text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
              <button onClick={addAttribute} className="flex items-center gap-1.5 text-[12px] font-bold text-[#8A8B91] hover:text-[#161823] pt-2 transition-colors">
                <Plus size={14} /> Add Attribute
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            {}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <h2 className="text-[15px] font-bold text-[#161823]">Product Variants</h2>
                {aiMode && images.length > 0 && (
                  <span className="text-[11px] text-[#8A8B91] mt-0.5 flex items-center gap-1">
                    <Sparkles size={10} className="text-[#7C3AED]" /> 
                    AI Generation uses AI Studio Options above
                  </span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
                <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#FE2C55] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            
            {hasVariants && (
              <div className="space-y-4">
                <div className="flex gap-4 border-b border-[#E3E3E4] mb-4">
                  {[{ id: 'Color', icon: Palette }, { id: 'Size', icon: Ruler }, { id: 'Material', icon: Box }].map(t => (
                    <button 
                      key={t.id} 
                      onClick={(e) => { e.preventDefault(); setActiveVariantTab(t.id); }} 
                      className={`pb-2 text-[12px] font-bold flex items-center gap-1.5 border-b-2 transition-colors ${activeVariantTab === t.id ? 'border-[#161823] text-[#161823]' : 'border-transparent text-[#8A8B91] hover:text-[#161823]'}`}
                    >
                      <t.icon size={14} /> {t.id}
                      <span className="bg-[#F8F8F8] text-[#8A8B91] border border-[#E3E3E4] rounded-full px-1.5 py-0.5 text-[9px] ml-1">
                        {variants.filter(v => v.type === t.id).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  {aiMode && (formData.title || images.length > 0) && (
                    <button onClick={suggestVariantsAI} className="text-[#7C3AED] text-[11px] font-bold flex items-center gap-1 hover:underline">
                      <Sparkles size={12}/> Suggest {activeVariantTab}s
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleVariants.map((v) => (
                    <div key={v.id} className="p-4 border border-[#E3E3E4] rounded-sm bg-[#F8F8F8] flex flex-col gap-3 group">
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <label className="w-16 h-16 bg-white border border-[#E3E3E4] rounded-sm relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#161823] transition-colors">
                            {v.isUploading ? <Loader2 size={16} className="animate-spin text-[#8A8B91]" /> : v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#8A8B91]" />}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(v.id, e)} disabled={v.isUploading} />
                          </label>
                          {aiMode && images.length > 0 && v.name && (
                            <button 
                              onClick={(e) => { e.preventDefault(); generateVariantImageAI(v.id); }} 
                              className="absolute -top-2 -right-2 bg-[#161823] text-white p-1.5 rounded-sm z-10 hover:bg-[#7C3AED] transition-colors shadow-sm"
                              title={`Generate AI Image for ${v.name}`}
                            >
                              <Wand2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-[#8A8B91] uppercase tracking-wider">{v.type} Name</label>
                          <input type="text" value={v.name || ''} onChange={e => setVariants(variants.map(varItem => varItem.id === v.id ? { ...varItem, name: e.target.value } : varItem))} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                        </div>
                        <button onClick={() => {
                           if (v.image && v.image.includes('/temp/')) deleteObject(ref(storage, v.image)).catch(console.error);
                           setVariants(variants.filter((varItem) => varItem.id !== v.id))
                        }} className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input type="number" placeholder="Stock" value={v.stock || ''} onChange={e => setVariants(variants.map(varItem => varItem.id === v.id ? { ...varItem, stock: e.target.value } : varItem))} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[11px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                        <input type="number" placeholder="Price (USh)" value={v.price || ''} onChange={e => setVariants(variants.map(varItem => varItem.id === v.id ? { ...varItem, price: e.target.value } : varItem))} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[11px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <button onClick={() => setVariants([...variants, { id: Date.now().toString(), type: activeVariantTab, name: '', stock: '1', price: '', image: '', isUploading: false }])} className="w-full py-3 border border-dashed border-[#E3E3E4] hover:border-[#161823] bg-[#F8F8F8] text-[12px] font-bold text-[#8A8B91] hover:text-[#161823] transition-colors rounded-sm flex items-center justify-center gap-1">
                  <Plus size={14}/> Add {activeVariantTab}
                </button>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="lg:w-[35%] space-y-6">
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4 text-[#161823]">Organization</h2>
            
            <div className="relative mb-6" ref={cascaderRef}>
              <label className="block text-[13px] font-semibold mb-1.5 flex justify-between text-[#161823]">Marketplace Category <span className="text-[#FE2C55]">*</span></label>
              <div onClick={() => setShowCategoryCascader(!showCategoryCascader)} className={`w-full bg-[#F8F8F8] border rounded-sm px-3 py-2 text-[13px] flex justify-between items-center cursor-pointer transition-colors ${showCategoryCascader ? 'border-[#161823]' : 'border-[#E3E3E4] hover:border-[#161823]'}`}>
                <span className={formData.category ? 'text-[#161823] font-medium' : 'text-[#8A8B91]'}>{selectedCategoryName}</span>
                <ChevronDown size={14} className={`text-[#8A8B91] transition-transform duration-200 ${showCategoryCascader ? 'rotate-180' : ''}`} />
              </div>
              {showCategoryCascader && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-sm rounded-sm z-50 flex h-[240px] overflow-hidden">
                  <div className="w-1/2 border-r border-[#E3E3E4] overflow-y-auto">
                    {categoryTree.map(p => (
                      <div key={p._id} onMouseEnter={() => setActiveParentId(p._id)} onClick={() => { if(p.subCategories.length === 0) { setFormData({...formData, category: p._id}); setShowCategoryCascader(false); } }} className={`px-3 py-2.5 text-[12px] cursor-pointer hover:bg-[#F8F8F8] flex justify-between items-center ${activeParentId === p._id ? 'bg-[#FEE2E2] font-bold text-[#FE2C55] border-l-2 border-[#FE2C55]' : 'text-[#161823]'}`}>
                        {p.name} {p.subCategories.length > 0 && <ChevronRight size={14} className="text-[#8A8B91]"/>}
                      </div>
                    ))}
                  </div>
                  <div className="w-1/2 overflow-y-auto bg-[#F8F8F8]">
                    {activeParentId && categoryTree.find(p => p._id === activeParentId)?.subCategories.map(sub => (
                      <div key={sub._id} onClick={() => { setFormData({...formData, category: sub._id}); setShowCategoryCascader(false); }} className={`px-4 py-2.5 text-[12px] cursor-pointer hover:text-[#FE2C55] transition-colors ${formData.category === sub._id ? 'font-bold text-[#FE2C55] bg-white' : 'text-[#161823]'}`}>{sub.name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative mb-4" ref={storeCatRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold flex items-center text-[#161823]">
                  Store Subcategory <span className="text-[#FE2C55] ml-1">*</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-[#8A8B91] cursor-pointer hover:text-[#161823] transition-colors">
                  <input type="checkbox" checked={syncMarketplaceCat} onChange={e => setSyncMarketplaceCat(e.target.checked)} className="rounded-sm border-[#E3E3E4] accent-[#7C3AED]" />
                  Sync Marketplace
                </label>
              </div>
              
              {!formData.category ? (
                <div className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] text-[#8A8B91] cursor-not-allowed">
                  Select a Marketplace Category first
                </div>
              ) : (
                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={storeCategoryInput}
                      onChange={(e) => {
                        setStoreCategoryInput(e.target.value);
                        setSyncMarketplaceCat(false); 
                        setShowStoreCatDropdown(true);
                        setFormData(prev => ({ ...prev, storeCategory: '' })); 
                      }}
                      onFocus={() => setShowStoreCatDropdown(true)}
                      placeholder="e.g. Clearance, Machinery"
                      className="w-full bg-white border border-[#E3E3E4] rounded-sm pl-3 pr-28 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                    />
                    
                    {storeCategoryInput && !formData.storeCategory && (
                      <button 
                        onClick={handleCreateStoreCategory} 
                        type="button" 
                        disabled={isSavingCategory} 
                        className="absolute right-1 top-1 bottom-1 px-3 bg-[#161823] hover:bg-black transition-colors text-white text-[11px] font-bold rounded-sm flex items-center gap-1"
                      >
                        {isSavingCategory ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                        Save
                      </button>
                    )}
                  </div>

                  {showStoreCatDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-sm rounded-sm z-50 max-h-[220px] overflow-y-auto overflow-x-hidden flex flex-col">
                      
                      {!syncMarketplaceCat && suggestedStoreCategories.length > 0 && !storeCategoryInput && (
                        <div className="p-2 border-b border-[#E3E3E4] bg-[#F3E8FF]">
                          <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1 mb-1 px-1">
                            <Sparkles size={10} /> AI Suggested
                          </span>
                          {suggestedStoreCategories.map((sug, idx) => (
                            <div 
                              key={`ai-${idx}`}
                              onClick={() => {
                                setStoreCategoryInput(sug);
                                setFormData(prev => ({ ...prev, storeCategory: '' }));
                                setShowStoreCatDropdown(false);
                              }}
                              className="px-2 py-1.5 text-[12px] text-[#161823] cursor-pointer hover:bg-white hover:text-[#7C3AED] rounded-sm font-medium transition-colors"
                            >
                              + Pick "{sug}"
                            </div>
                          ))}
                        </div>
                      )}

                      {filteredStoreCategories.length > 0 && (
                        <div className="p-1">
                          {filteredStoreCategories.map(cat => (
                            <div
                              key={cat._id}
                              onClick={() => {
                                setStoreCategoryInput(cat.name);
                                setFormData(prev => ({ ...prev, storeCategory: cat._id }));
                                setShowStoreCatDropdown(false);
                              }}
                              className={`px-3 py-2 text-[13px] cursor-pointer rounded-sm flex items-center justify-between hover:bg-[#F8F8F8] ${formData.storeCategory === cat._id ? 'bg-[#F8F8F8] font-bold text-[#161823]' : 'text-[#161823]'}`}
                            >
                              {cat.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Tags</label>
              <input type="text" value={formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4 text-[#161823]">Pricing & Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Base Price (USh) <span className="text-[#FE2C55]">*</span></label>
                <input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
              </div>
              {!hasVariants && (
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Global Stock</label>
                  <input type="number" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#161823]">Flash Sale Promotion</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.isFlashItem} onChange={e => setFormData({...formData, isFlashItem: e.target.checked})} />
                <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#FE2C55] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {formData.isFlashItem && (
              <div className="pt-3 border-t border-[#E3E3E4]">
                 <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Discount Percentage (%)</label>
                 <input type="number" value={formData.discountPercentage || ''} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} placeholder="e.g. 25" className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" min="1" max="99" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
