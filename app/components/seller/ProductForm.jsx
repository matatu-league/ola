"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Save,
  UploadCloud,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  FileAudio,
  Video,
  Palette,
  Ruler,
  Box,
  ArrowLeft,
  Link as LinkIcon,
  X,
  Layers
} from 'lucide-react';
import Link from 'next/link';

import { storage } from '@/lib/firebaseLib';
import { uploadFileToFirebase, deleteFileFromFirebase, moveTempFileToPermanent } from '@/lib/firebaseLib';
import { ref } from 'firebase/storage';

import {
  fileToBase64,
  extractBase64FromUrl,
  convertDataUrlToFile,
  runGeminiImageAnalysis,
  runImageGeneration,
  buildAnglePrompt,
  buildVariantPrompt,
  suggestStoreCategoriesAI,
  suggestVariantsAIList,
  runGeminiTTS,
} from '@/lib/ai';

const LOADING_PHRASES = [
  'Analyzing product composition...',
  'Rendering complex geometries...',
  'Adjusting lighting and environment...',
  'Calculating shadows and highlights...',
  'Refining texture details...',
  'Applying visual enhancements...',
  'Processing final image layers...',
  'Optimizing resolution and quality...',
  'Synthesizing new camera angles...',
  'Enhancing product realism...',
  'Finalizing visual assets...',
  'Just a moment longer, pixels are aligning...',
  'Uploading to secure cloud storage...',
];

const MagicalLoader = ({ status }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_PHRASES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-sm flex flex-col items-center max-w-sm w-full text-center border border-[#E3E3E4]">
        <Loader2 size={40} className="text-[#161823] animate-spin mb-6" />
        <h3 className="font-bold text-[16px] text-[#161823] mb-2 tracking-tight">{status}</h3>
        <div className="h-6 overflow-hidden flex items-center justify-center w-full">
          <p key={idx} className="text-[13px] font-medium text-[#8A8B91] animate-pulse">
            {LOADING_PHRASES[idx]}
          </p>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_FORM = {
  title: '', description: '', price: '', moq: '1', sku: '', stock: '1',
  category: '', storeCategory: '', collectionId: '', tags: '', status: 'active',
  isFlashItem: false, discountPercentage: '',
  attributes: [], videoDescription: '', audioDescription: '',
};

export default function ProductForm({ initialData = null, onSubmit, isSaving = false }) {
  const [formData, setFormData]             = useState(DEFAULT_FORM);
  const [images, setImages]                 = useState([]);
  const [errorMessage, setErrorMessage]     = useState('');
  const [internalIsSaving, setInternalIsSaving] = useState(false);
  const [isUploading, setIsUploading]       = useState({ image: false, video: false, audio: false });

  const isEditing   = !!initialData;
  const pageTitle   = isEditing ? 'Edit Product' : 'Add New Product';
  const pageDescription = isEditing
    ? 'Update your product details, inventory, and variants.'
    : 'Create a new item listing for your store catalog.';

  const sessionId = useRef('');
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    }
  }, []);

  const [dbCategories, setDbCategories]         = useState([]);
  const [showCategoryCascader, setShowCategoryCascader] = useState(false);
  const [activeParentId, setActiveParentId]     = useState(null);
  const cascaderRef = useRef(null);

  const [storeCategories, setStoreCategories]           = useState([]);
  const [suggestedStoreCategories, setSuggestedStoreCategories] = useState([]);
  const [isSuggestingStoreCats, setIsSuggestingStoreCats] = useState(false);
  const [storeCategoryInput, setStoreCategoryInput]     = useState('');
  const [showStoreCatDropdown, setShowStoreCatDropdown] = useState(false);
  const [syncMarketplaceCat, setSyncMarketplaceCat]     = useState(true);
  const [isSavingCategory, setIsSavingCategory]         = useState(false);
  const storeCatRef = useRef(null);

  const [storeCollections, setStoreCollections]         = useState([]);

  const [dynamicSchema, setDynamicSchema]       = useState([]);
  const [dynamicValues, setDynamicValues]       = useState({});
  const [isLoadingSchema, setIsLoadingSchema]   = useState(false);

  const [hasVariants, setHasVariants]                   = useState(false);
  const [activeVariantTab, setActiveVariantTab]         = useState('Color');
  const [variantsHaveDifferentPrices, setVariantsHaveDifferentPrices] = useState(false);
  const [variants, setVariants]                         = useState([]);
  const [videoMode, setVideoMode] = useState('upload');

  const [aiMode, setAiMode]               = useState(true);
  const [imageGenModel, setImageGenModel] = useState('custom');
  const [keepOriginalBg, setKeepOriginalBg] = useState(false);
  const [aiBgColor, setAiBgColor]         = useState('white');
  const [aspectRatio, setAspectRatio]     = useState('1:1');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatus, setAiStatus]           = useState('');
  const [showAiPrompts, setShowAiPrompts] = useState(false);
  const [recommendedViews, setRecommendedViews] = useState([]);

  const localBase64Cache = useRef({});
  const bgPreference = keepOriginalBg ? 'original' : aiBgColor;

  useEffect(() => {
    if (initialData) return;
    try {
      const saved = localStorage.getItem('product_draft');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.formData)         setFormData(parsed.formData);
      if (parsed.images)           setImages(parsed.images);
      if (parsed.variants)         setVariants(parsed.variants);
      if (parsed.sessionId)        sessionId.current = parsed.sessionId;
      if (parsed.storeCategoryInput) setStoreCategoryInput(parsed.storeCategoryInput);
      if (parsed.dynamicValues)    setDynamicValues(parsed.dynamicValues);
    } catch { /* ignore corrupt draft */ }
  }, [initialData]);

  useEffect(() => {
    if (initialData || (!formData.title && images.length === 0)) return;
    const draft = { formData, images, variants, sessionId: sessionId.current, storeCategoryInput, dynamicValues };
    localStorage.setItem('product_draft', JSON.stringify(draft));
  }, [formData, images, variants, storeCategoryInput, dynamicValues, initialData]);

  useEffect(() => {
    const load = async (endpoint, setter) => {
      try {
        const res    = await fetch(endpoint, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await res.json();
        if (result.success && result.data) setter(result.data);
      } catch (e) { console.error(`Failed to fetch ${endpoint}`, e); }
    };
    load('/api/categories',             setDbCategories);
    load('/api/stores/categories',      setStoreCategories);
    load('/api/stores/collections',            setStoreCollections);
  }, []);

  useEffect(() => {
    if (!formData.category) {
      setDynamicSchema([]);
      return;
    }
    const cat = dbCategories.find(c => c._id === formData.category);
    
    // Fetch schema if it's a subcategory with a slug
    if (cat && cat.parentId && cat.slug) {
      setIsLoadingSchema(true);
      fetch(`/api/filters/${cat.slug}`)
        .then(res => {
          if (!res.ok) throw new Error('No schema file found');
          return res.json();
        })
        .then(data => {
          if (data.schema) setDynamicSchema(data.schema);
        })
        .catch(err => {
          console.warn(`No dynamic schema found for ${cat.slug}`);
          setDynamicSchema([]);
        })
        .finally(() => setIsLoadingSchema(false));
    } else {
      setDynamicSchema([]);
    }
  }, [formData.category, dbCategories]);

  useEffect(() => {
    if (!syncMarketplaceCat || !formData.category || !dbCategories.length) return;
    const selected = dbCategories.find(c => c._id === formData.category);
    if (!selected) return;
    setStoreCategoryInput(selected.name);
    const match = storeCategories.find(c => c.name.toLowerCase() === selected.name.toLowerCase());
    setFormData(prev => ({ ...prev, storeCategory: match?._id ?? '' }));
  }, [formData.category, syncMarketplaceCat, dbCategories, storeCategories]);

  useEffect(() => {
    if (!formData.category || !aiMode || syncMarketplaceCat) {
      setSuggestedStoreCategories([]);
      return;
    }
    const globalCat = dbCategories.find(c => c._id === formData.category);
    if (!globalCat) return;

    const tid = setTimeout(async () => {
      setIsSuggestingStoreCats(true);
      try {
        const suggestions = await suggestStoreCategoriesAI(globalCat.name);
        if (Array.isArray(suggestions)) setSuggestedStoreCategories(suggestions);
      } catch (e) { console.error('Store cat suggestions failed', e); }
      finally { setIsSuggestingStoreCats(false); }
    }, 800);

    return () => clearTimeout(tid);
  }, [formData.category, aiMode, syncMarketplaceCat, dbCategories]);

  useEffect(() => {
    if (!initialData) return;
    setFormData({
      title:              initialData.title              || '',
      description:        initialData.description        || '',
      price:              initialData.price              || '',
      moq:                initialData.moq                || '1',
      sku:                initialData.sku                || '',
      tags:               initialData.tags               || '',
      stock:              initialData.stock !== undefined ? String(initialData.stock) : '1',
      category:           initialData.categoryRef?._id   || initialData.categoryRef || '',
      storeCategory:      initialData.storeCategoryRef?._id || initialData.storeCategoryRef || '',
      collectionId:       initialData.collectionId       || '',
      status:             initialData.status             || 'active',
      isFlashItem:        initialData.isFlashItem        || false,
      discountPercentage: initialData.discountPercentage || '',
      attributes:         initialData.attributes         || [],
      videoDescription:   initialData.videoDescription   || '',
      audioDescription:   initialData.audioDescription   || '',
    });
    setStoreCategoryInput(initialData.storeCategoryRef?.name || '');
    setImages(initialData.images?.length ? initialData.images : (initialData.image ? [initialData.image] : []));
    setHasVariants(initialData.hasVariants || false);
    setVariantsHaveDifferentPrices(initialData.variantsHaveDifferentPrices || false);
    setVariants(
      initialData.variants?.map((v, i) => ({
        ...v, id: v._id || String(i), type: v.type || 'Color',
        name: v.name || '', stock: v.stock !== undefined ? String(v.stock) : '1',
        price: v.price || '', isUploading: false,
      })) ?? []
    );
    if (initialData.videoDescription?.match(/youtube\.com|youtu\.be/)) setVideoMode('youtube');
  }, [initialData]);

  useEffect(() => {
    const handler = (e) => {
      if (cascaderRef.current && !cascaderRef.current.contains(e.target)) setShowCategoryCascader(false);
      if (storeCatRef.current  && !storeCatRef.current.contains(e.target))  setShowStoreCatDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addAttribute    = ()            => setFormData(p => ({ ...p, attributes: [...p.attributes, { name: '', value: '' }] }));
  const removeAttribute = (i)           => setFormData(p => ({ ...p, attributes: p.attributes.filter((_, j) => j !== i) }));
  const updateAttribute = (i, k, val)   => setFormData(p => {
    const attrs = [...p.attributes]; attrs[i][k] = val; return { ...p, attributes: attrs };
  });

  const processImageFile = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    setErrorMessage('');
    setIsUploading(p => ({ ...p, image: true }));
    try {
      const base64 = await fileToBase64(file);
      const url    = await uploadFileToFirebase(file, 'products/images', !initialData, sessionId.current);
      localBase64Cache.current[url] = base64;

      const isFirst = images.length === 0;
      setImages(p => [...p, url]);
      if (aiMode && isFirst) generateDetailsFromImage(file);
    } catch (err) {
      console.error('Image upload error:', err);
      setErrorMessage('Image upload failed.');
    } finally {
      setIsUploading(p => ({ ...p, image: false }));
    }
  };

  const removeImage = async (idx) => {
    const url = images[idx];
    setImages(p => p.filter((_, i) => i !== idx));
    if (url.includes('/temp/')) await deleteFileFromFirebase(url);
  };

  const handleExtraMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(p => ({ ...p, [type]: true }));
    try {
      const folder = type === 'video' ? 'products/videos' : 'products/audio';
      const url    = await uploadFileToFirebase(file, folder, !initialData, sessionId.current);
      const field  = type === 'video' ? 'videoDescription' : 'audioDescription';
      setFormData(p => ({ ...p, [field]: url }));
    } catch (err) {
      console.error(`${type} upload error:`, err);
      setErrorMessage(`Failed to upload ${type}.`);
    } finally {
      setIsUploading(p => ({ ...p, [type]: false }));
    }
  };

  const clearMediaField = async (field) => {
    const url = formData[field];
    if (url?.includes('/temp/')) await deleteFileFromFirebase(url);
    setFormData(p => ({ ...p, [field]: '' }));
  };

  const handleVariantImageUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVariants(vs => vs.map(v => v.id === id ? { ...v, isUploading: true } : v));
    try {
      const base64 = await fileToBase64(file);
      const url    = await uploadFileToFirebase(file, 'products/variants', !initialData, sessionId.current);
      localBase64Cache.current[url] = base64;
      setVariants(vs => vs.map(v => v.id === id ? { ...v, image: url, isUploading: false } : v));
    } catch (err) {
      console.error('Variant image upload error:', err);
      setVariants(vs => vs.map(v => v.id === id ? { ...v, isUploading: false } : v));
    }
  };

  const generateDetailsFromImage = async (file) => {
    if (!aiMode) return;
    setIsAiProcessing(true);
    setAiStatus('Gemini is reasoning about your product...');
    try {
      const base64  = await fileToBase64(file);
      const aiData  = await runGeminiImageAnalysis(base64, file.type, dbCategories);

      setFormData(p => ({
        ...p,
        title:       aiData.title       || p.title,
        description: aiData.description || p.description,
        tags:        Array.isArray(aiData.tags) ? aiData.tags.join(', ') : aiData.tags || p.tags,
        category:    aiData.category_id || p.category,
        attributes:  aiData.attributes?.length ? aiData.attributes : p.attributes,
      }));

      if (aiData.recommended_views) setRecommendedViews(aiData.recommended_views);

      if (aiData.category_id && dbCategories.length) {
        const cat = dbCategories.find(c => c._id === aiData.category_id);
        setActiveParentId(cat?.parentId ?? cat?._id ?? null);
      }
      setShowAiPrompts(true);
    } catch (err) {
      console.error('Gemini analysis failed:', err);
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  const generateAnglesAI = async (views) => {
    if (!images.length) return;
    const anglesToGenerate = views?.length ? views : ['Left side view', 'Right side view', 'Close up detail'];
    setIsAiProcessing(true);

    const originalBase64 = await extractBase64FromUrl(images[0], localBase64Cache.current);
    if (!originalBase64) {
      setErrorMessage('Image extraction blocked by Firebase CORS. Re-upload the primary image to generate AI variants.');
      setIsAiProcessing(false);
      return;
    }

    const newImages = [];
    const params    = { aspectRatio, backgroundPreference: bgPreference, imageType: 'product' };

    for (const view of anglesToGenerate) {
      setAiStatus(`Generating ${view}...`);
      try {
        const prompt   = buildAnglePrompt(view, bgPreference, aspectRatio);
        const imageUrl = await runImageGeneration(originalBase64, prompt, params, imageGenModel);

        setAiStatus(`Uploading ${view} to Storage...`);
        const file      = imageUrl.startsWith('data:image')
          ? await convertDataUrlToFile(imageUrl, `angle_${Date.now()}.png`)
          : new File([await (await fetch(imageUrl)).blob()], 'angle.png', { type: 'image/png' });

        const uploadUrl = await uploadFileToFirebase(file, 'products/images', !initialData, sessionId.current);
        localBase64Cache.current[uploadUrl] = await fileToBase64(file);
        newImages.push(uploadUrl);
        setRecommendedViews(p => p.filter(v => v !== view));
      } catch (err) {
        console.error(`Failed to generate angle "${view}":`, err);
      }
    }

    if (newImages.length) setImages(p => [...p, ...newImages]);
    setIsAiProcessing(false);
    setAiStatus('');
  };

  const generateVariantImageAI = async (variantId) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant || !images.length || !variant.name) {
      return setErrorMessage('Upload a primary image and name the variant first.');
    }

    const originalBase64 = await extractBase64FromUrl(images[0], localBase64Cache.current);
    if (!originalBase64) return setErrorMessage('Image extraction blocked by Firebase CORS. Re-upload the primary image.');

    setIsAiProcessing(true);
    setAiStatus(`Generating ${variant.type} image for "${variant.name}"...`);
    try {
      const prompt   = buildVariantPrompt(variant.type, variant.name, bgPreference, aspectRatio);
      const params   = { aspectRatio, backgroundPreference: bgPreference, imageType: 'variant' };
      const imageUrl = await runImageGeneration(originalBase64, prompt, params, imageGenModel);

      setAiStatus('Uploading variant image...');
      const file      = imageUrl.startsWith('data:image')
        ? await convertDataUrlToFile(imageUrl, `variant_${Date.now()}.png`)
        : new File([await (await fetch(imageUrl)).blob()], 'variant.png', { type: 'image/png' });

      const uploadUrl = await uploadFileToFirebase(file, 'products/variants', !initialData, sessionId.current);
      localBase64Cache.current[uploadUrl] = await fileToBase64(file);
      setVariants(vs => vs.map(v => v.id === variantId ? { ...v, image: uploadUrl } : v));
    } catch (err) {
      console.error('Variant image generation failed:', err);
      setErrorMessage('Failed to generate variant image.');
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  const suggestVariantsAI = async () => {
    setIsAiProcessing(true);
    setAiStatus(`Reasoning logical ${activeVariantTab} options...`);
    try {
      const suggested = await suggestVariantsAIList(formData.title, activeVariantTab);
      if (Array.isArray(suggested)) {
        setHasVariants(true);
        setVariants(p => [
          ...p,
          ...suggested.map((name, i) => ({
            id: Date.now() + i, type: activeVariantTab, name,
            price: '', stock: '1', image: '', isUploading: false,
          })),
        ]);
      }
    } catch (err) {
      console.error('Variant suggestion failed:', err);
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  const generateAudioDescriptionAI = async () => {
    if (!formData.description) return setErrorMessage('Generate a description first.');
    setIsAiProcessing(true);
    setAiStatus('Rendering audio ad...');
    try {
      const audioBlob = await runGeminiTTS(formData.description);
      const file      = new File([audioBlob], `audio_${Date.now()}.wav`, { type: 'audio/wav', lastModified: Date.now() });
      setAiStatus('Uploading audio...');
      const url = await uploadFileToFirebase(file, 'products/audio', !initialData, sessionId.current);
      setFormData(p => ({ ...p, audioDescription: url }));
    } catch (err) {
      console.error('TTS failed:', err);
      setErrorMessage('Failed to generate audio.');
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  const generatePromoVideoAI = async () => {
    if (!images.length || !formData.audioDescription)
      return setErrorMessage('Requires images and an audio description.');
    setIsAiProcessing(true);
    setAiStatus('Creating promotional video...');
    try {
      const audioUrl    = URL.createObjectURL(await (await fetch(formData.audioDescription)).blob());
      const audio       = new Audio(audioUrl);

      const loadedImgs  = await Promise.all(images.map(async (src) => {
        const b64    = await extractBase64FromUrl(src, localBase64Cache.current);
        if (!b64) throw new Error('Could not extract image data for video.');
        const objUrl = URL.createObjectURL(await convertDataUrlToFile(`data:image/png;base64,${b64}`, 'f.png'));
        return new Promise(res => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(img); img.src = objUrl; });
      }));

      const canvas      = document.createElement('canvas');
      canvas.width      = 1280; canvas.height = 720;
      const ctx         = canvas.getContext('2d');
      const audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
      const dest        = audioCtx.createMediaStreamDestination();
      const source      = audioCtx.createMediaElementSource(audio);
      source.connect(dest); source.connect(audioCtx.destination);

      const stream   = new MediaStream([...canvas.captureStream(30).getTracks(), ...dest.stream.getTracks()]);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks   = [];
      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = async () => {
        const file = new File(
          [new Blob(chunks, { type: 'video/webm' })],
          `promo_${Date.now()}.webm`, { type: 'video/webm', lastModified: Date.now() }
        );
        setAiStatus('Uploading video...');
        try {
          const url = await uploadFileToFirebase(file, 'products/videos', !initialData, sessionId.current);
          setFormData(p => ({ ...p, videoDescription: url }));
          setVideoMode('upload');
        } catch { setErrorMessage('Failed to upload video.'); }
        setIsAiProcessing(false); setAiStatus(''); audioCtx.close();
      };

      let start = Date.now();
      const draw = () => {
        const imgIdx = Math.floor((Date.now() - start) / 4000) % loadedImgs.length;
        ctx.fillStyle = '#161823'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const img   = loadedImgs[imgIdx];
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
        ctx.drawImage(img, (canvas.width - img.width * scale) / 2, (canvas.height - img.height * scale) / 2, img.width * scale, img.height * scale);
        ctx.shadowBlur = 0; ctx.fillStyle = 'white'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(formData.title, canvas.width / 2, 80);
        if (!audio.ended && !audio.paused) requestAnimationFrame(draw); else recorder.stop();
      };
      recorder.start(); await audio.play(); draw();
    } catch (err) {
      console.error('Promo video generation failed:', err);
      setErrorMessage('Video generation failed.');
      setIsAiProcessing(false); setAiStatus('');
    }
  };

  const handleCreateStoreCategory = async () => {
    if (!storeCategoryInput.trim()) return;
    setIsSavingCategory(true);
    try {
      const res  = await fetch('/api/stores/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeCategoryInput.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStoreCategories(p => [...p, json.data]);
        setFormData(p => ({ ...p, storeCategory: json.data._id }));
        setShowStoreCatDropdown(false);
      }
    } catch (e) { console.error('Failed to create store category:', e); }
    setIsSavingCategory(false);
  };

  const handleFormSubmit = async () => {
    setErrorMessage('');

    if (!formData.title?.trim())          return setErrorMessage('Product Title is required.');
    if (!formData.price)                  return setErrorMessage('Base Price is required. Please scroll to Pricing & Stock.');
    if (!formData.category)               return setErrorMessage('Global Marketplace Category is required.');
    
    // Validate store category ONLY if user typed something but forgot to save
    if (!formData.storeCategory && storeCategoryInput.trim())
      return setErrorMessage('Click "Save" to confirm your new Store Category before submitting, or clear the input.');

    setInternalIsSaving(true);
    setAiStatus('Finalizing assets...');
    setIsAiProcessing(true);

    const cache        = localBase64Cache.current;
    const finalImages  = await Promise.all(images.map(url => moveTempFileToPermanent(url, 'products/images', cache)));

    const finalVideo   = await moveTempFileToPermanent(formData.videoDescription, 'products/videos', cache);
    const finalAudio   = await moveTempFileToPermanent(formData.audioDescription, 'products/audio', cache);

    const finalVariants = hasVariants
      ? await Promise.all(variants.map(async v => ({
          name:  v.name,
          type:  v.type,
          stock: Number(v.stock) || 0,
          image: await moveTempFileToPermanent(v.image, 'products/variants', cache),
          price: variantsHaveDifferentPrices ? v.price : '',
        })))
      : [];

    // Merge Dynamic Values into generic attributes array
    const combinedAttributes = [...formData.attributes];
    dynamicSchema.forEach(field => {
       const val = dynamicValues[field.slug];
       if (val && !['price', 'filter_discount', 'filter_id_verify'].includes(field.slug)) {
          combinedAttributes.push({ name: field.label, value: String(val) });
       }
    });

    const payload = {
      ...formData,
      attributes:    combinedAttributes, // Overwritten with merged attributes
      categoryRef:   formData.category,
      storeCategory: formData.storeCategory || null, // Optional
      collectionId:  formData.collectionId,
      images:        finalImages,
      image:         finalImages[0] || '',
      videoDescription: finalVideo,
      audioDescription: finalAudio,
      hasVariants,
      variantsHaveDifferentPrices,
      variants:      finalVariants,
    };

    localStorage.removeItem('product_draft');
    setIsAiProcessing(false);
    onSubmit?.(payload);
    setInternalIsSaving(false);
  };

  const categoryTree = useMemo(() => {
    const parents = dbCategories.filter(c => !c.parentId);
    return parents.map(p => ({
      ...p,
      subCategories: dbCategories.filter(c => c.parentId === p._id),
    }));
  }, [dbCategories]);

  const selectedCategoryName = useMemo(() => {
    const cat = dbCategories.find(c => c._id === formData.category);
    if (!cat) return 'Select a category';
    const parent = dbCategories.find(p => p._id === cat.parentId);
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  }, [formData.category, dbCategories]);

  const filteredStoreCategories = useMemo(() => {
    if (!storeCategoryInput) return storeCategories;
    return storeCategories.filter(c => c.name.toLowerCase().includes(storeCategoryInput.toLowerCase()));
  }, [storeCategories, storeCategoryInput]);
  
  const activeStoreCollections = useMemo(() => {
    return storeCollections.filter(c => c.enabled);
  }, [storeCollections]);

  const visibleVariants = variants.filter(v => v.type === activeVariantTab);
  const isBusy = isSaving || internalIsSaving;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 relative">
      {isAiProcessing && <MagicalLoader status={aiStatus} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Link href="/products" className="mt-1 p-1.5 border border-[#E3E3E4] text-[#8A8B91] hover:text-[#161823] bg-transparent rounded-sm hover:bg-[#F8F8F8] transition-colors" title="Back">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#161823] tracking-tight">{pageTitle}</h1>
            <p className="text-[13px] text-[#8A8B91] mt-0.5">{pageDescription}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {aiMode && (
            <select value={imageGenModel} onChange={e => setImageGenModel(e.target.value)} className="text-[12px] font-medium bg-transparent border border-[#E3E3E4] rounded-sm px-2 py-1.5 outline-none focus:border-[#161823] transition-colors">
              <option value="custom">Model: Custom API</option>
              <option value="grok">Model: Grok AI</option>
            </select>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#E3E3E4]">
            <Sparkles size={16} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />
            <span className="text-[13px] font-semibold text-[#161823]">AI Copilot</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(p => !p)} />
              <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#7C3AED] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          <button onClick={handleFormSubmit} disabled={isBusy} className="flex items-center gap-2 px-5 py-2 bg-[#161823] rounded-sm text-[13px] font-semibold text-white hover:bg-black transition-colors disabled:opacity-50">
            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isBusy ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 bg-[#FEE2E2] border border-[#FE2C55]/20 text-[#FE2C55] rounded-sm text-[13px] font-semibold flex items-center gap-2">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left column ── */}
        <div className="lg:w-[65%] space-y-6">

          {/* Product Visuals */}
          <div className={`bg-white border rounded-sm p-5 md:p-6 ${aiMode ? 'border-[#7C3AED]/50 ring-1 ring-[#7C3AED]/10' : 'border-[#E3E3E4]'}`}>
            <h2 className="text-[15px] font-bold text-[#161823] mb-4">Product Visuals</h2>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="aspect-square border border-[#E3E3E4] rounded-sm relative group overflow-hidden bg-[#F8F8F8]">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-white/90 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-[#FEE2E2] transition-all">
                    <Trash2 size={14} className="text-[#FE2C55]" />
                  </button>
                  {idx === 0 && <div className="absolute bottom-1 left-1 bg-[#161823] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Cover</div>}
                </div>
              ))}
              <label className="aspect-square border border-dashed border-[#E3E3E4] rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#161823] transition-colors bg-[#F8F8F8] hover:bg-white">
                {isUploading.image
                  ? <Loader2 size={20} className="animate-spin text-[#8A8B91]" />
                  : <UploadCloud size={20} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />}
                <span className="text-[11px] font-semibold mt-1.5 text-[#161823]">Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => processImageFile(e.target.files[0])} disabled={isUploading.image} />
              </label>
            </div>

            {/* AI Studio */}
            {aiMode && images.length > 0 && (
              <div className="mt-6 border border-[#7C3AED]/30 bg-[#F8F8F8] rounded-sm overflow-hidden">
                <div className="bg-white px-4 py-3 border-b border-[#E3E3E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-[#7C3AED]" />
                    <span className="text-[13px] font-bold text-[#161823]">AI Studio Options</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="text-[11px] font-medium bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-2 py-1 outline-none hover:border-[#7C3AED] text-[#161823]">
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
                        {[['white', 'bg-white border-[#E3E3E4]'], ['light_grey', 'bg-gray-200 border-gray-300'], ['black', 'bg-black border-gray-600']].map(([val, cls]) => (
                          <button key={val} onClick={() => setAiBgColor(val)} className={`w-5 h-5 rounded-sm border shadow-sm ${cls} ${aiBgColor === val ? 'ring-2 ring-[#7C3AED] scale-110' : 'hover:scale-110'} transition-transform`} title={val} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[#7C3AED]" />
                    <span className="text-[12px] font-bold text-[#161823]">
                      {recommendedViews.length > 0 ? 'AI Suggested Angles' : 'Generate Extra Angles'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(recommendedViews.length > 0 ? recommendedViews : ['Left side view', 'Right side view', 'Close up detail']).map((view, i) => (
                      <button key={i} type="button" onClick={() => generateAnglesAI([view])} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E3E4] hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-sm text-[11px] font-semibold text-[#161823] transition-colors shadow-sm">
                        <Plus size={12} /> {view}
                      </button>
                    ))}
                    <button type="button" onClick={() => generateAnglesAI(recommendedViews.length ? recommendedViews : null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#7C3AED] rounded-sm text-[11px] font-bold hover:bg-[#e9d5ff] transition-colors">
                      <Wand2 size={12} /> Generate All {recommendedViews.length || 3}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Video + Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[#E3E3E4]">
              {/* Video */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-semibold text-[#161823]">Product Video</label>
                  <div className="flex gap-2">
                    {['upload', 'youtube', 'ai'].map(m => (
                      <button key={m} onClick={() => setVideoMode(m)} className={`text-[11px] font-bold ${videoMode === m ? (m === 'ai' ? 'text-[#7C3AED]' : 'text-[#161823]') : 'text-[#8A8B91]'}`}>
                        {m === 'ai' ? 'AI Promo' : m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm p-3 flex flex-col justify-center min-h-[70px]">
                  {videoMode === 'youtube' ? (
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-[#8A8B91]" />
                      <input type="text" value={formData.videoDescription} onChange={e => setFormData(p => ({ ...p, videoDescription: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className="w-full bg-transparent text-[12px] outline-none text-[#161823]" />
                    </div>
                  ) : videoMode === 'ai' ? (
                    <div className="flex flex-col items-center">
                      <button onClick={generatePromoVideoAI} className="bg-[#7C3AED] text-white px-3 py-1.5 rounded-sm text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#6D28D9] transition-colors">
                        <Wand2 size={14} /> Generate Promo Video
                      </button>
                    </div>
                  ) : formData.videoDescription ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><Video size={16} className="text-[#161823] shrink-0" /><span className="text-[12px] text-[#161823] truncate max-w-[150px]">Video Uploaded</span></div>
                      <button onClick={() => clearMediaField('videoDescription')} className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-[#8A8B91] hover:text-[#161823] transition-colors">
                      {isUploading.video ? <Loader2 size={16} className="animate-spin" /> : <><UploadCloud size={16} className="mb-1" /><span className="text-[11px] font-medium">Upload MP4</span></>}
                      <input type="file" accept="video/*" className="hidden" onChange={e => handleExtraMediaUpload(e, 'video')} disabled={isUploading.video} />
                    </label>
                  )}
                </div>
              </div>

              {/* Audio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-semibold text-[#161823]">Audio Description</label>
                  {aiMode && formData.description && (
                    <button onClick={generateAudioDescriptionAI} className="text-[#7C3AED] text-[11px] font-bold flex items-center gap-1 hover:underline">
                      <Sparkles size={12} /> Generate Ad
                    </button>
                  )}
                </div>
                <div className="border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm p-3 flex flex-col justify-center min-h-[70px]">
                  {formData.audioDescription ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden"><FileAudio size={16} className="text-[#161823] shrink-0" /><audio src={formData.audioDescription} controls className="h-6 w-32" /></div>
                      <button onClick={() => clearMediaField('audioDescription')} className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-[#8A8B91] hover:text-[#161823] transition-colors">
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
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                  placeholder="e.g. Premium Wireless Headphones"
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 flex items-center gap-1.5 text-[#161823]">
                  Description
                  {aiMode && formData.description && <Sparkles size={14} className="text-[#7C3AED]" />}
                </label>
                <textarea 
                  rows={6} 
                  value={formData.description} 
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} 
                  placeholder="Describe your product's features, benefits, and specifics..."
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none resize-none focus:border-[#161823] transition-colors text-[#161823]" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#161823]">Product Variants</h2>
                {aiMode && images.length > 0 && (
                  <span className="text-[11px] text-[#8A8B91] mt-0.5 flex items-center gap-1">
                    <Sparkles size={10} className="text-[#7C3AED]" /> AI Generation uses AI Studio Options above
                  </span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
                <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#FE2C55] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-4">
                {/* Variant tabs */}
                <div className="flex gap-4 border-b border-[#E3E3E4] mb-4">
                  {[{ id: 'Color', icon: Palette }, { id: 'Size', icon: Ruler }, { id: 'Material', icon: Box }].map(t => (
                    <button key={t.id} onClick={e => { e.preventDefault(); setActiveVariantTab(t.id); }} className={`pb-2 text-[12px] font-bold flex items-center gap-1.5 border-b-2 transition-colors ${activeVariantTab === t.id ? 'border-[#161823] text-[#161823]' : 'border-transparent text-[#8A8B91] hover:text-[#161823]'}`}>
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
                      <Sparkles size={12} /> Suggest {activeVariantTab}s
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleVariants.map(v => (
                    <div key={v.id} className="p-4 border border-[#E3E3E4] rounded-sm bg-[#F8F8F8] flex flex-col gap-3">
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <label className="w-16 h-16 bg-white border border-[#E3E3E4] rounded-sm overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#161823] transition-colors">
                            {v.isUploading ? <Loader2 size={16} className="animate-spin text-[#8A8B91]" /> : v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-[#8A8B91]" />}
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleVariantImageUpload(v.id, e)} disabled={v.isUploading} />
                          </label>
                          {aiMode && images.length > 0 && v.name && (
                            <button onClick={e => { e.preventDefault(); generateVariantImageAI(v.id); }} className="absolute -top-2 -right-2 bg-[#161823] text-white p-1.5 rounded-sm z-10 hover:bg-[#7C3AED] transition-colors shadow-sm" title={`Generate AI image for ${v.name}`}>
                              <Wand2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-[#8A8B91] uppercase tracking-wider">{v.type} Name</label>
                          <input type="text" value={v.name || ''} onChange={e => setVariants(vs => vs.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                        </div>
                        <button onClick={() => {
                          if (v.image?.includes('/temp/')) deleteFileFromFirebase(v.image);
                          setVariants(vs => vs.filter(x => x.id !== v.id));
                        }} className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Stock" value={v.stock || ''} onChange={e => setVariants(vs => vs.map(x => x.id === v.id ? { ...x, stock: e.target.value } : x))} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[11px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                        <input type="number" placeholder="Price (USh)" value={v.price || ''} onChange={e => setVariants(vs => vs.map(x => x.id === v.id ? { ...x, price: e.target.value } : x))} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[11px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setVariants(p => [...p, { id: String(Date.now()), type: activeVariantTab, name: '', stock: '1', price: '', image: '', isUploading: false }])} className="w-full py-3 border border-dashed border-[#E3E3E4] hover:border-[#161823] bg-[#F8F8F8] text-[12px] font-bold text-[#8A8B91] hover:text-[#161823] transition-colors rounded-sm flex items-center justify-center gap-1">
                  <Plus size={14} /> Add {activeVariantTab}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4 flex items-center gap-1.5 text-[#161823]">
              Specifications
              {aiMode && formData.attributes.length > 0 && (
                <Sparkles size={14} className="text-[#7C3AED]" />
              )}
            </h2>
            <p className="text-[12px] text-[#8A8B91] mb-5">
              Get your products found easily by filling in these specific details.
            </p>

            {/* Dynamic Schema Inputs */}
            {isLoadingSchema ? (
              <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-[#8A8B91]" size={20} /></div>
            ) : dynamicSchema.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-[#E3E3E4]">
                {dynamicSchema.map(field => {
                  // Skip systemic search filters like price range or verification flags
                  if (['price', 'filter_discount', 'filter_id_verify'].includes(field.slug)) return null;

                  return (
                    <div key={field.slug}>
                      <label className="block text-[12px] font-semibold mb-1.5 text-[#161823] truncate" title={field.label}>
                        {field.label} {field.unit && <span className="text-[#8A8B91] font-normal">({field.unit})</span>}
                      </label>

                      {['select', 'multiselect', 'radio'].includes(field.visual_type) ? (
                        <select
                          value={dynamicValues[field.slug] || ''}
                          onChange={(e) => setDynamicValues(p => ({ ...p, [field.slug]: e.target.value }))}
                          className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823] appearance-none"
                        >
                          <option value="">Select...</option>
                          {field.possible_values?.map(v => (
                            <option key={v.value} value={v.value}>{v.value}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.attr_type === 'int' ? 'number' : 'text'}
                          value={dynamicValues[field.slug] || ''}
                          onChange={(e) => setDynamicValues(p => ({ ...p, [field.slug]: e.target.value }))}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Custom Manual Attributes */}
            <div className="space-y-3">
              <label className="block text-[12px] font-bold text-[#8A8B91] uppercase tracking-wider mb-2">Custom Attributes</label>
              {formData.attributes.map((attr, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={attr.name} onChange={e => updateAttribute(i, 'name', e.target.value)} placeholder="Name (e.g. Warranty)" className="w-1/3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                  <input type="text" value={attr.value} onChange={e => updateAttribute(i, 'value', e.target.value)} placeholder="Value (e.g. 1 Year)" className="flex-1 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                  <button onClick={() => removeAttribute(i)} className="p-2 text-[#8A8B91] hover:text-[#FE2C55] transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
              <button onClick={addAttribute} className="flex items-center gap-1.5 text-[12px] font-bold text-[#8A8B91] hover:text-[#161823] pt-2 transition-colors">
                <Plus size={14} /> Add Custom Attribute
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-[35%] space-y-6">

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4 text-[#161823]">Organization</h2>

            {/* Marketplace category cascader */}
            <div className="relative mb-6" ref={cascaderRef}>
              <label className="block text-[13px] font-semibold mb-1.5 flex justify-between text-[#161823]">
                Marketplace Category <span className="text-[#FE2C55]">*</span>
              </label>
              <div onClick={() => setShowCategoryCascader(p => !p)} className={`w-full bg-[#F8F8F8] border rounded-sm px-3 py-2 text-[13px] flex justify-between items-center cursor-pointer transition-colors ${showCategoryCascader ? 'border-[#161823]' : 'border-[#E3E3E4] hover:border-[#161823]'}`}>
                <span className={formData.category ? 'text-[#161823] font-medium' : 'text-[#8A8B91]'}>{selectedCategoryName}</span>
                <ChevronDown size={14} className={`text-[#8A8B91] transition-transform duration-200 ${showCategoryCascader ? 'rotate-180' : ''}`} />
              </div>
              {showCategoryCascader && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-sm rounded-sm z-50 flex h-[240px] overflow-hidden">
                  <div className="w-1/2 border-r border-[#E3E3E4] overflow-y-auto">
                    {categoryTree.map(p => (
                      <div key={p._id} onMouseEnter={() => setActiveParentId(p._id)} onClick={() => { if (!p.subCategories.length) { setFormData(f => ({ ...f, category: p._id })); setShowCategoryCascader(false); } }} className={`px-3 py-2.5 text-[12px] cursor-pointer hover:bg-[#F8F8F8] flex justify-between items-center ${activeParentId === p._id ? 'bg-[#FEE2E2] font-bold text-[#FE2C55] border-l-2 border-[#FE2C55]' : 'text-[#161823]'}`}>
                        {p.name} {p.subCategories.length > 0 && <ChevronRight size={14} className="text-[#8A8B91]" />}
                      </div>
                    ))}
                  </div>
                  <div className="w-1/2 overflow-y-auto bg-[#F8F8F8]">
                    {activeParentId && categoryTree.find(p => p._id === activeParentId)?.subCategories.map(sub => (
                      <div key={sub._id} onClick={() => { setFormData(f => ({ ...f, category: sub._id })); setShowCategoryCascader(false); }} className={`px-4 py-2.5 text-[12px] cursor-pointer hover:text-[#FE2C55] transition-colors ${formData.category === sub._id ? 'font-bold text-[#FE2C55] bg-white' : 'text-[#161823]'}`}>
                        {sub.name}
                      </div>
                    ))}
                    {activeParentId && (
                      <div onClick={() => { setFormData(f => ({ ...f, category: activeParentId })); setShowCategoryCascader(false); }} className="px-4 py-2.5 text-[12px] font-bold cursor-pointer border-t border-[#E3E3E4] text-[#8A8B91] hover:text-[#161823] transition-colors">
                        Select Parent Category Instead
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Store subcategory (Optional) */}
            <div className="relative mb-6" ref={storeCatRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold flex items-center text-[#161823]">
                  Store Category <span className="text-[10px] font-normal text-[#8A8B91] ml-1.5">(Optional)</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-[#8A8B91] cursor-pointer hover:text-[#161823] transition-colors">
                  <input type="checkbox" checked={syncMarketplaceCat} onChange={e => setSyncMarketplaceCat(e.target.checked)} className="rounded-sm accent-[#7C3AED]" />
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
                    <input type="text" value={storeCategoryInput} onChange={e => { setStoreCategoryInput(e.target.value); setSyncMarketplaceCat(false); setShowStoreCatDropdown(true); setFormData(p => ({ ...p, storeCategory: '' })); }} onFocus={() => setShowStoreCatDropdown(true)} placeholder="e.g. Clearance, Machinery" className="w-full bg-white border border-[#E3E3E4] rounded-sm pl-3 pr-28 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                    {storeCategoryInput && !formData.storeCategory && (
                      <button onClick={handleCreateStoreCategory} type="button" disabled={isSavingCategory} className="absolute right-1 top-1 bottom-1 px-3 bg-[#161823] hover:bg-black transition-colors text-white text-[11px] font-bold rounded-sm flex items-center gap-1">
                        {isSavingCategory ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                      </button>
                    )}
                  </div>

                  {showStoreCatDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-sm rounded-sm z-50 max-h-[220px] overflow-y-auto flex flex-col">
                      {!syncMarketplaceCat && suggestedStoreCategories.length > 0 && !storeCategoryInput && (
                        <div className="p-2 border-b border-[#E3E3E4] bg-[#F3E8FF]">
                          <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1 mb-1 px-1">
                            <Sparkles size={10} /> AI Suggested
                          </span>
                          {suggestedStoreCategories.map((sug, i) => (
                            <div key={`ai-${i}`} onClick={() => { setStoreCategoryInput(sug); setFormData(p => ({ ...p, storeCategory: '' })); setShowStoreCatDropdown(false); }} className="px-2 py-1.5 text-[12px] text-[#161823] cursor-pointer hover:bg-white hover:text-[#7C3AED] rounded-sm font-medium transition-colors">
                              + Pick "{sug}"
                            </div>
                          ))}
                        </div>
                      )}
                      {filteredStoreCategories.length > 0 && (
                        <div className="p-1">
                          {filteredStoreCategories.map(cat => (
                            <div key={cat._id} onClick={() => { setStoreCategoryInput(cat.name); setFormData(p => ({ ...p, storeCategory: cat._id })); setShowStoreCatDropdown(false); }} className={`px-3 py-2 text-[13px] cursor-pointer rounded-sm flex items-center justify-between hover:bg-[#F8F8F8] ${formData.storeCategory === cat._id ? 'bg-[#F8F8F8] font-bold text-[#161823]' : 'text-[#161823]'}`}>
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
            
            {/* Store Collection (Optional) */}
            <div className="mb-6">
               <label className="block text-[13px] font-semibold mb-1.5 flex items-center gap-1.5 text-[#161823]">
                  Store Collection <span className="text-[10px] font-normal text-[#8A8B91]">(Optional)</span>
               </label>
               <div className="relative">
                  <select
                     value={formData.collectionId}
                     onChange={(e) => setFormData(p => ({ ...p, collectionId: e.target.value }))}
                     className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823] appearance-none"
                  >
                     <option value="">No Collection</option>
                     {activeStoreCollections.map(collection => (
                        <option key={collection._id} value={collection.collectionId}>
                           {collection.name}
                        </option>
                     ))}
                  </select>
                  <Layers size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8B91] pointer-events-none" />
               </div>
               <p className="text-[11px] text-[#8A8B91] mt-1.5">
                  Assign this product to a smart collection like "New Arrivals" or "Best Sellers" to showcase it on your storefront.
               </p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Tags</label>
              <input type="text" value={formData.tags || ''} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
            </div>
          </div>

          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4 text-[#161823]">Pricing & Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Base Price (USh) <span className="text-[#FE2C55]">*</span></label>
                <input type="number" value={formData.price || ''} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
              </div>
              {!hasVariants && (
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Global Stock</label>
                  <input type="number" value={formData.stock || ''} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
                </div>
              )}
            </div>
          </div>

          {/* Flash Sale */}
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#161823]">Flash Sale Promotion</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.isFlashItem} onChange={e => setFormData(p => ({ ...p, isFlashItem: e.target.checked }))} />
                <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#FE2C55] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            {formData.isFlashItem && (
              <div className="pt-3 border-t border-[#E3E3E4]">
                <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Discount Percentage (%)</label>
                <input type="number" value={formData.discountPercentage || ''} onChange={e => setFormData(p => ({ ...p, discountPercentage: e.target.value }))} placeholder="e.g. 25" min="1" max="99" className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}