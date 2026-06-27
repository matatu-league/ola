"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Save, UploadCloud, Loader2, Trash2, ChevronDown, ChevronRight,
  Plus, Image as ImageIcon, Sparkles, Wand2, FileAudio, Video,
  Palette, Ruler, Box, ArrowLeft, Link as LinkIcon, X, Layers, GripVertical
} from 'lucide-react';
import Link from 'next/link';

import { storage } from '@/lib/firebaseLib';
import { uploadFileToFirebase, deleteFileFromFirebase, moveTempFileToPermanent } from '@/lib/firebaseLib';
import { ref } from 'firebase/storage';

import {
  fileToBase64, extractBase64FromUrl, convertDataUrlToFile,
  runGeminiImageAnalysis, runImageGeneration, buildAnglePrompt,
  buildVariantPrompt, suggestStoreCategoriesAI, suggestVariantsAIList, runGeminiTTS,
} from '@/lib/ai';

const LOADING_PHRASES = [
  'Analyzing product composition...', 'Rendering complex geometries...',
  'Adjusting lighting and environment...', 'Calculating shadows and highlights...',
  'Refining texture details...', 'Applying visual enhancements...',
  'Processing final image layers...', 'Optimizing resolution and quality...',
  'Synthesizing new camera angles...', 'Enhancing product realism...',
  'Finalizing visual assets...', 'Just a moment longer, pixels are aligning...',
  'Uploading to secure cloud storage...',
];

const IMAGE_DRAG_TYPE = 'PRODUCT_IMAGE';

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Select Tag Input
// ─────────────────────────────────────────────────────────────────────────────
const MultiSelectTagInput = ({ field, value, onChange, isAiFilled }) => {
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = field.possible_values || [];
  const filtered = search
    ? options.filter(o => o.value.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val];
    onChange(next);
  };

  const remove = (val, e) => { e.stopPropagation(); onChange(selected.filter(s => s !== val)); };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(p => !p)}
        className={`w-full min-h-[36px] bg-gray-50 border rounded-none px-2 py-1.5 flex flex-wrap gap-1 items-center cursor-pointer transition-colors ${
          isOpen ? 'border-black' : isAiFilled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-300'
        }`}
      >
        {selected.length === 0 && (
          <span className="text-xs text-gray-400 select-none">Select options...</span>
        )}
        {selected.map(val => (
          <span key={val} className="inline-flex items-center gap-1 bg-black text-white text-xs font-semibold px-1.5 py-0.5 rounded-none">
            {val}
            <button type="button" onClick={(e) => remove(val, e)} className="hover:text-red-400 transition-colors leading-none">
              <X size={9} />
            </button>
          </span>
        ))}
        <ChevronDown size={12} className={`text-gray-400 ml-auto shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm z-40 flex flex-col max-h-[200px]">
          {options.length > 6 && (
            <div className="p-1.5 border-b border-gray-200">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-none outline-none focus:border-black"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No options found</div>}
            {filtered.map(opt => {
              const active = selected.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-black hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {active && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {opt.value}
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="p-1.5 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-500">{selected.length} selected</span>
              <button type="button" onClick={() => onChange([])} className="text-xs font-bold text-red-500 hover:underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Magical Loader Overlay
// ─────────────────────────────────────────────────────────────────────────────
const MagicalLoader = ({ status }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_PHRASES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-8 flex flex-col items-center max-w-sm w-full text-center border border-gray-200">
        <Loader2 size={40} className="text-black animate-spin mb-6" />
        <h3 className="font-bold text-base text-black mb-2 tracking-tight">{status}</h3>
        <div className="h-6 overflow-hidden flex items-center justify-center w-full">
          <p key={idx} className="text-sm font-medium text-gray-500 animate-pulse">{LOADING_PHRASES[idx]}</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Draggable Image Card
// ─────────────────────────────────────────────────────────────────────────────
const DraggableImageCard = ({ img, idx, moveImage, removeImage }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: IMAGE_DRAG_TYPE,
    item: { index: idx },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: IMAGE_DRAG_TYPE,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = idx;
      if (dragIndex === hoverIndex) return;
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`aspect-square border relative group overflow-hidden bg-gray-50 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isOver ? 'border-dashed border-2 border-black scale-105 shadow-lg' : 'border-gray-200'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <img src={img} alt="Product" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
        className="absolute top-1 right-1 p-1 bg-white/90 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
      >
        <Trash2 size={14} className="text-red-500" />
      </button>
      {idx === 0 && (
        <div className="absolute bottom-1 left-1 bg-black text-white text-xs font-bold px-1.5 py-0.5 uppercase tracking-wider">
          Cover
        </div>
      )}
      <div className="absolute top-1 left-1 p-1 bg-white/90 opacity-0 group-hover:opacity-100 transition-all">
        <GripVertical size={14} className="text-gray-400" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared input class helpers
// ─────────────────────────────────────────────────────────────────────────────
const inputCls = (extra = '') =>
  `w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors ${extra}`;

const inputAiCls = (isAi, extra = '') =>
  `w-full bg-gray-50 border rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors ${
    isAi ? 'border-blue-200 bg-blue-50/30' : 'border-gray-300'
  } ${extra}`;

// ─────────────────────────────────────────────────────────────────────────────
// Default form state
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  title: '', description: '', price: '', moq: '1', sku: '', stock: '1',
  category: '', storeCategory: '', collectionId: '', tags: '', status: 'active',
  isFlashItem: false, discountPercentage: '',
  attributes: [], videoDescription: '', audioDescription: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductForm({ initialData = null, onSubmit, isSaving = false }) {
  const [formData, setFormData]               = useState(DEFAULT_FORM);
  const [images, setImages]                   = useState([]);
  const [errorMessage, setErrorMessage]       = useState('');
  const [internalIsSaving, setInternalIsSaving] = useState(false);
  const [isUploading, setIsUploading]         = useState({ image: false, video: false, audio: false });

  const isEditing       = !!initialData;
  const pageTitle       = isEditing ? 'Edit Product' : 'Add New Product';
  const pageDescription = isEditing
    ? 'Update your product details, inventory, and variants.'
    : 'Create a new item listing for your store catalog.';

  const sessionId = useRef('');
  useEffect(() => {
    if (!sessionId.current)
      sessionId.current = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  }, []);

  const [dbCategories, setDbCategories]                     = useState([]);
  const [showCategoryCascader, setShowCategoryCascader]     = useState(false);
  const [activeParentId, setActiveParentId]                 = useState(null);
  const cascaderRef = useRef(null);

  const [storeCategories, setStoreCategories]               = useState([]);
  const [suggestedStoreCategories, setSuggestedStoreCategories] = useState([]);
  const [isSuggestingStoreCats, setIsSuggestingStoreCats]   = useState(false);
  const [storeCategoryInput, setStoreCategoryInput]         = useState('');
  const [showStoreCatDropdown, setShowStoreCatDropdown]     = useState(false);
  const [syncMarketplaceCat, setSyncMarketplaceCat]         = useState(false);
  const [isSavingCategory, setIsSavingCategory]             = useState(false);
  const storeCatRef = useRef(null);

  const [storeCollections, setStoreCollections]             = useState([]);

  const [dynamicSchema, setDynamicSchema]     = useState([]);
  const [dynamicValues, setDynamicValues]     = useState({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isAiSuggestingSpecs, setIsAiSuggestingSpecs] = useState(false);

  const [hasVariants, setHasVariants]                         = useState(false);
  const [activeVariantTab, setActiveVariantTab]               = useState('Color');
  const [variantsHaveDifferentPrices, setVariantsHaveDifferentPrices] = useState(false);
  const [variants, setVariants]                               = useState([]);
  const [videoMode, setVideoMode]                             = useState('upload');

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

  const moveImage = useCallback((dragIndex, hoverIndex) => {
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, moved);
      return next;
    });
  }, []);

  // Draft persistence
  useEffect(() => {
    if (initialData) return;
    try {
      const saved = localStorage.getItem('product_draft');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.formData)          setFormData(parsed.formData);
      if (parsed.images)            setImages(parsed.images);
      if (parsed.variants)          setVariants(parsed.variants);
      if (parsed.sessionId)         sessionId.current = parsed.sessionId;
      if (parsed.storeCategoryInput) setStoreCategoryInput(parsed.storeCategoryInput);
      if (parsed.dynamicValues)     setDynamicValues(parsed.dynamicValues);
    } catch { /* ignore corrupt draft */ }
  }, [initialData]);

  useEffect(() => {
    if (initialData || (!formData.title && images.length === 0)) return;
    const draft = { formData, images, variants, sessionId: sessionId.current, storeCategoryInput, dynamicValues };
    localStorage.setItem('product_draft', JSON.stringify(draft));
  }, [formData, images, variants, storeCategoryInput, dynamicValues, initialData]);

  // Fetch reference data
  useEffect(() => {
    const load = async (endpoint, setter) => {
      try {
        const res    = await fetch(endpoint, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await res.json();
        if (result.success && result.data) setter(result.data);
      } catch (e) { console.error(`Failed to fetch ${endpoint}`, e); }
    };
    // Marketplace categories, scoped to the store's specialization: a store
    // that sells e.g. pets shouldn't see the entire category tree when listing
    // a product. We keep the chosen category's parent group + its children
    // (general "sell everything" stores have no primary category → keep all).
    const scopeToStore = (all, primaryId) => {
      if (!primaryId) return all;
      const primary = all.find(c => String(c._id) === primaryId);
      if (!primary) return all;
      const scopeParentId = primary.parentId ? String(primary.parentId) : String(primary._id);
      return all.filter(c =>
        String(c._id) === scopeParentId || String(c.parentId) === scopeParentId
      );
    };
    (async () => {
      try {
        const [catJson, storeJson] = await Promise.all([
          fetch('/api/categories', { headers: { 'ngrok-skip-browser-warning': 'true' } }).then(r => r.json()),
          fetch('/api/stores',     { headers: { 'ngrok-skip-browser-warning': 'true' } }).then(r => r.json()).catch(() => null),
        ]);
        if (!catJson?.success || !catJson.data) return;
        const primaryId = storeJson?.store?.categories?.[0] ? String(storeJson.store.categories[0]) : '';
        setDbCategories(scopeToStore(catJson.data, primaryId));
      } catch (e) {
        console.error('Failed to fetch categories', e);
      }
    })();
    load('/api/stores/categories',  setStoreCategories);
    load('/api/stores/collections', setStoreCollections);
  }, []);

  useEffect(() => {
    if (!dbCategories.length || !formData.category) return;
    const selectedCat = dbCategories.find(c => c._id === formData.category);
    if (selectedCat?.parentId) setActiveParentId(selectedCat.parentId);
  }, [dbCategories, formData.category]);

  // Dynamic schema fetch
  useEffect(() => {
    if (!formData.category) { setDynamicSchema([]); return; }
    const cat = dbCategories.find(c => c._id === formData.category);
    if (cat?.parentId && cat?.slug) {
      setIsLoadingSchema(true);
      fetch(`/api/filters/${cat.slug}`)
        .then(res => { if (!res.ok) throw new Error('No schema'); return res.json(); })
        .then(data => { if (data.schema) setDynamicSchema(data.schema); })
        .catch(() => { console.warn(`No schema for ${cat.slug}`); setDynamicSchema([]); })
        .finally(() => setIsLoadingSchema(false));
    } else {
      setDynamicSchema([]);
    }
  }, [formData.category, dbCategories]);

  // AI spec pre-population
  useEffect(() => {
    if (!aiMode || !dynamicSchema.length || !formData.title) return;
    if (initialData?.attributes?.length) return;
    const hasExistingValues = dynamicSchema.some(f => {
      const v = dynamicValues[f.slug];
      return Array.isArray(v) ? v.length > 0 : !!v;
    });
    if (hasExistingValues) return;

    const suggestSpecsFromAI = async () => {
      setIsAiSuggestingSpecs(true);
      try {
        const schemaDescription = dynamicSchema
          .filter(f => !['price', 'filter_discount', 'filter_id_verify'].includes(f.slug))
          .map(f => {
            const opts = f.possible_values?.map(v => v.value).join(', ');
            return `${f.label} (slug: ${f.slug}${f.unit ? ', unit: ' + f.unit : ''}${opts ? ', options: ' + opts : ''}, type: ${f.attr_type || 'text'})`;
          }).join('\n');

        const prompt = `You are a product data assistant. Given a product title and a list of specification fields, suggest the most likely values for each field based on common product knowledge.

Product Title: "${formData.title}"
${formData.description ? `Product Description: "${formData.description}"` : ''}

Specification fields:
${schemaDescription}

Respond ONLY with a valid JSON object where each key is the field slug and the value is the suggested string value. Only include fields you are confident about. Example:
{"ram": "8GB", "storage": "256GB", "color": "Black"}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const data = await response.json();
        const text = data.content?.map(b => b.text || '').join('') || '';
        const clean = text.replace(/```json|```/g, '').trim();

        try {
          const suggested = JSON.parse(clean);
          if (suggested && typeof suggested === 'object') {
            setDynamicValues(prev => {
              const merged = { ...prev };
              Object.entries(suggested).forEach(([slug, value]) => {
                const isEmpty = !merged[slug] || (Array.isArray(merged[slug]) && merged[slug].length === 0);
                if (!isEmpty) return;
                const field = dynamicSchema.find(f => f.slug === slug);
                if (!field) return;
                if (field.visual_type === 'multiselect') {
                  const raw = Array.isArray(value) ? value : String(value).split(',').map(s => s.trim());
                  const valid = raw.filter(v => field.possible_values?.some(pv => pv.value.toLowerCase() === v.toLowerCase()))
                    .map(v => { const match = field.possible_values.find(pv => pv.value.toLowerCase() === v.toLowerCase()); return match ? match.value : v; });
                  if (valid.length) merged[slug] = valid;
                } else if (field.possible_values?.length) {
                  const match = field.possible_values.find(pv => pv.value.toLowerCase() === String(value).toLowerCase());
                  if (match) merged[slug] = match.value;
                } else {
                  merged[slug] = String(value);
                }
              });
              return merged;
            });
          }
        } catch (parseErr) { console.warn('Could not parse AI spec suggestions:', parseErr); }
      } catch (err) { console.error('AI spec suggestion failed:', err); }
      finally { setIsAiSuggestingSpecs(false); }
    };

    suggestSpecsFromAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicSchema, aiMode]);

  // Sync store category with marketplace category
  useEffect(() => {
    if (!syncMarketplaceCat || !formData.category || !dbCategories.length) return;
    const selected = dbCategories.find(c => c._id === formData.category);
    if (!selected) return;
    setStoreCategoryInput(selected.name);
    const match = storeCategories.find(c => c.name.toLowerCase() === selected.name.toLowerCase());
    setFormData(prev => ({ ...prev, storeCategory: match?._id ?? '' }));
  }, [formData.category, syncMarketplaceCat, dbCategories, storeCategories]);

  // AI store category suggestions
  useEffect(() => {
    if (!formData.category || !aiMode || syncMarketplaceCat) { setSuggestedStoreCategories([]); return; }
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

  // Initialize from initialData (edit mode)
  useEffect(() => {
    if (!initialData) return;
    const categoryId      = initialData.categoryId?._id      || initialData.categoryId      || '';
    const storeCategoryId = initialData.storeCategoryId?._id || initialData.storeCategoryId || '';

    setFormData({
      title:              initialData.title              || '',
      description:        initialData.description        || '',
      price:              initialData.price              || '',
      moq:                initialData.moq                || '1',
      sku:                initialData.sku                || '',
      tags:               initialData.tags               || '',
      stock:              initialData.stock !== undefined ? String(initialData.stock) : '1',
      category:           categoryId,
      storeCategory:      storeCategoryId,
      collectionId:       initialData.collectionId       || '',
      status:             initialData.status             || 'active',
      isFlashItem:        initialData.isFlashItem        || false,
      discountPercentage: initialData.discountPercentage || '',
      attributes:         initialData.attributes         || [],
      videoDescription:   initialData.videoDescription   || '',
      audioDescription:   initialData.audioDescription   || '',
    });

    setStoreCategoryInput(initialData.storeCategoryId?.name || '');
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

  // Map saved attributes → dynamicValues once schema loads
  useEffect(() => {
    if (!initialData?.attributes?.length || !dynamicSchema.length) return;
    const norm = (s) => String(s).trim().toLowerCase();
    setDynamicValues(prev => {
      const next = { ...prev };
      dynamicSchema.forEach(field => {
        const existing = next[field.slug];
        const alreadySet = Array.isArray(existing) ? existing.length > 0 : !!existing;
        if (alreadySet) return;
        const saved = initialData.attributes.find(a => a?.name && norm(a.name) === norm(field.label));
        if (!saved || saved.value === undefined || saved.value === null || saved.value === '') return;
        const rawValue = saved.value;
        if (field.visual_type === 'multiselect') {
          const parts = Array.isArray(rawValue)
            ? rawValue
            : String(rawValue).split(',').map(s => s.trim()).filter(Boolean);
          const valid = parts.map(p => {
            const match = field.possible_values?.find(pv => norm(pv.value) === norm(p));
            return match ? match.value : null;
          }).filter(Boolean);
          if (valid.length) next[field.slug] = valid;
        } else if (['select', 'radio'].includes(field.visual_type) && field.possible_values?.length) {
          const match = field.possible_values.find(pv => norm(pv.value) === norm(rawValue));
          if (match) next[field.slug] = match.value;
        } else {
          next[field.slug] = String(rawValue);
        }
      });
      return next;
    });

    const schemaLabels = new Set(dynamicSchema.map(f => String(f.label).trim().toLowerCase()));
    setFormData(prev => {
      if (!prev.attributes?.length) return prev;
      const filtered = prev.attributes.filter(a => !a?.name || !schemaLabels.has(String(a.name).trim().toLowerCase()));
      if (filtered.length === prev.attributes.length) return prev;
      return { ...prev, attributes: filtered };
    });
  }, [dynamicSchema, initialData]);

  // Outside click handlers
  useEffect(() => {
    const handler = (e) => {
      if (cascaderRef.current && !cascaderRef.current.contains(e.target)) setShowCategoryCascader(false);
      if (storeCatRef.current  && !storeCatRef.current.contains(e.target))  setShowStoreCatDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addAttribute    = ()          => setFormData(p => ({ ...p, attributes: [...p.attributes, { name: '', value: '' }] }));
  const removeAttribute = (i)         => setFormData(p => ({ ...p, attributes: p.attributes.filter((_, j) => j !== i) }));
  const updateAttribute = (i, k, val) => setFormData(p => {
    const attrs = [...p.attributes]; attrs[i][k] = val; return { ...p, attributes: attrs };
  });

  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/avif', 'image/heic', 'image/heif',
  ];

  const processImageFile = async (file) => {
    if (!file) return;
    const isAllowed = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/');
    if (!isAllowed) return;
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
      const base64 = await fileToBase64(file);
      const aiData = await runGeminiImageAnalysis(base64, file.type, dbCategories);
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
    } catch (err) { console.error('Gemini analysis failed:', err); }
    finally { setIsAiProcessing(false); setAiStatus(''); }
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
        const file = imageUrl.startsWith('data:image')
          ? await convertDataUrlToFile(imageUrl, `angle_${Date.now()}.png`)
          : new File([await (await fetch(imageUrl)).blob()], 'angle.png', { type: 'image/png' });
        const uploadUrl = await uploadFileToFirebase(file, 'products/images', !initialData, sessionId.current);
        localBase64Cache.current[uploadUrl] = await fileToBase64(file);
        newImages.push(uploadUrl);
        setRecommendedViews(p => p.filter(v => v !== view));
      } catch (err) { console.error(`Failed to generate angle "${view}":`, err); }
    }
    if (newImages.length) setImages(p => [...p, ...newImages]);
    setIsAiProcessing(false); setAiStatus('');
  };

  const generateVariantImageAI = async (variantId) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant || !images.length || !variant.name)
      return setErrorMessage('Upload a primary image and name the variant first.');
    const originalBase64 = await extractBase64FromUrl(images[0], localBase64Cache.current);
    if (!originalBase64) return setErrorMessage('Image extraction blocked by Firebase CORS. Re-upload the primary image.');
    setIsAiProcessing(true);
    setAiStatus(`Generating ${variant.type} image for "${variant.name}"...`);
    try {
      const prompt   = buildVariantPrompt(variant.type, variant.name, bgPreference, aspectRatio);
      const params   = { aspectRatio, backgroundPreference: bgPreference, imageType: 'variant' };
      const imageUrl = await runImageGeneration(originalBase64, prompt, params, imageGenModel);
      setAiStatus('Uploading variant image...');
      const file = imageUrl.startsWith('data:image')
        ? await convertDataUrlToFile(imageUrl, `variant_${Date.now()}.png`)
        : new File([await (await fetch(imageUrl)).blob()], 'variant.png', { type: 'image/png' });
      const uploadUrl = await uploadFileToFirebase(file, 'products/variants', !initialData, sessionId.current);
      localBase64Cache.current[uploadUrl] = await fileToBase64(file);
      setVariants(vs => vs.map(v => v.id === variantId ? { ...v, image: uploadUrl } : v));
    } catch (err) {
      console.error('Variant image generation failed:', err);
      setErrorMessage('Failed to generate variant image.');
    } finally { setIsAiProcessing(false); setAiStatus(''); }
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
    } catch (err) { console.error('Variant suggestion failed:', err); }
    finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  const generateAudioDescriptionAI = async () => {
    if (!formData.description) return setErrorMessage('Generate a description first.');
    setIsAiProcessing(true); setAiStatus('Rendering audio ad...');
    try {
      const audioBlob = await runGeminiTTS(formData.description);
      const file      = new File([audioBlob], `audio_${Date.now()}.wav`, { type: 'audio/wav', lastModified: Date.now() });
      setAiStatus('Uploading audio...');
      const url = await uploadFileToFirebase(file, 'products/audio', !initialData, sessionId.current);
      setFormData(p => ({ ...p, audioDescription: url }));
    } catch (err) { console.error('TTS failed:', err); setErrorMessage('Failed to generate audio.'); }
    finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  const generatePromoVideoAI = async () => {
    if (!images.length || !formData.audioDescription)
      return setErrorMessage('Requires images and an audio description.');
    setIsAiProcessing(true); setAiStatus('Creating promotional video...');
    try {
      const audioUrl   = URL.createObjectURL(await (await fetch(formData.audioDescription)).blob());
      const audio      = new Audio(audioUrl);
      const loadedImgs = await Promise.all(images.map(async (src) => {
        const b64    = await extractBase64FromUrl(src, localBase64Cache.current);
        if (!b64) throw new Error('Could not extract image data for video.');
        const objUrl = URL.createObjectURL(await convertDataUrlToFile(`data:image/png;base64,${b64}`, 'f.png'));
        return new Promise(res => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => res(img); img.src = objUrl; });
      }));

      const canvas  = document.createElement('canvas');
      canvas.width  = 1280; canvas.height = 720;
      const ctx     = canvas.getContext('2d');
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest    = audioCtx.createMediaStreamDestination();
      const source  = audioCtx.createMediaElementSource(audio);
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
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    if (!formData.storeCategory && storeCategoryInput.trim())
      return setErrorMessage('Click "Save" to confirm your new Store Category before submitting, or clear the input.');

    setInternalIsSaving(true); setAiStatus('Finalizing assets...'); setIsAiProcessing(true);

    const cache       = localBase64Cache.current;
    const finalImages = await Promise.all(images.map(url => moveTempFileToPermanent(url, 'products/images', cache)));
    const finalVideo  = await moveTempFileToPermanent(formData.videoDescription, 'products/videos', cache);
    const finalAudio  = await moveTempFileToPermanent(formData.audioDescription, 'products/audio', cache);
    const finalVariants = hasVariants
      ? await Promise.all(variants.map(async v => ({
          name: v.name, type: v.type, stock: Number(v.stock) || 0,
          image: await moveTempFileToPermanent(v.image, 'products/variants', cache),
          price: variantsHaveDifferentPrices ? v.price : '',
        })))
      : [];

    const combinedAttributes = [...formData.attributes];
    dynamicSchema.forEach(field => {
      const val = dynamicValues[field.slug];
      if (val && !['price', 'filter_discount', 'filter_id_verify'].includes(field.slug)) {
        const serialized = Array.isArray(val) ? val.join(', ') : String(val);
        if (serialized) combinedAttributes.push({ name: field.label, value: serialized });
      }
    });

    const payload = {
      ...formData, attributes: combinedAttributes,
      categoryRef: formData.category, storeCategory: formData.storeCategory || null,
      collectionId: formData.collectionId, images: finalImages, image: finalImages[0] || '',
      videoDescription: finalVideo, audioDescription: finalAudio,
      hasVariants, variantsHaveDifferentPrices, variants: finalVariants,
    };

    localStorage.removeItem('product_draft');
    setIsAiProcessing(false);
    onSubmit?.(payload);
    setInternalIsSaving(false);
  };

  const categoryTree = useMemo(() => {
    const parents = dbCategories.filter(c => !c.parentId);
    return parents.map(p => ({ ...p, subCategories: dbCategories.filter(c => c.parentId === p._id) }));
  }, [dbCategories]);

  const selectedCategoryName = useMemo(() => {
    const cat = dbCategories.find(c => c._id === formData.category);
    if (!cat) return 'Select a category';
    const parent = dbCategories.find(p => p._id === cat.parentId);
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  }, [formData.category, dbCategories]);

  const storeCategoryDropdownItems = useMemo(() => {
    const selected = formData.storeCategory
      ? storeCategories.find(c => c._id === formData.storeCategory)
      : null;
    const others = storeCategories.filter(c => {
      if (c._id === formData.storeCategory) return false;
      if (!storeCategoryInput) return true;
      return c.name.toLowerCase().includes(storeCategoryInput.toLowerCase());
    });
    return { selected, others };
  }, [storeCategories, formData.storeCategory, storeCategoryInput]);

  const activeStoreCollections = useMemo(() => storeCollections.filter(c => c.enabled), [storeCollections]);
  const visibleVariants = variants.filter(v => v.type === activeVariantTab);
  const isBusy = isSaving || internalIsSaving;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8 relative">
        {isAiProcessing && <MagicalLoader status={aiStatus} />}

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <Link
              href="/products"
              className="mt-1 p-1.5 border border-gray-200 text-gray-500 hover:text-black bg-white rounded-none hover:bg-gray-50 transition-colors"
              title="Back"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-sm text-gray-500 mt-1">{pageDescription}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {aiMode && (
              <select
                value={imageGenModel}
                onChange={e => setImageGenModel(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-200 rounded-none px-2 py-1.5 focus:outline-none focus:border-black transition-colors text-black"
              >
                <option value="custom">Model: Custom API</option>
                <option value="grok">Model: Grok AI</option>
              </select>
            )}

            {/* AI Copilot toggle */}
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white">
              <Sparkles size={14} className={aiMode ? 'text-blue-600' : 'text-gray-400'} />
              <span className="text-sm font-semibold">AI Copilot</span>
              <label className="relative inline-flex items-center cursor-pointer ml-1">
                <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(p => !p)} />
                <div className="w-9 h-5 bg-gray-200 rounded-none peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            <button
              onClick={handleFormSubmit}
              disabled={isBusy}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-none text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isBusy ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 px-4 py-3 rounded-none border bg-red-50 border-red-200 text-red-600 text-sm font-semibold flex items-center gap-2">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ══════════════════════════════════════════════════════════════════
              LEFT COLUMN
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:w-[65%] space-y-6">

            {/* ── Product Visuals ── */}
            <div className={`bg-white border p-6 ${aiMode ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-5">
                <ImageIcon size={18} />
                <h2 className="text-base font-bold">Product Visuals</h2>
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {images.map((img, idx) => (
                  <DraggableImageCard key={img + idx} img={img} idx={idx} moveImage={moveImage} removeImage={removeImage} />
                ))}
                <label className="aspect-square border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors bg-gray-50 hover:bg-white">
                  {isUploading.image
                    ? <Loader2 size={20} className="animate-spin text-gray-400" />
                    : <UploadCloud size={20} className={aiMode ? 'text-blue-600' : 'text-gray-400'} />}
                  <span className="text-xs font-semibold mt-1.5 text-black">Add Image</span>
                  <input
                    type="file" accept="image/*,.avif" className="hidden"
                    onChange={(e) => processImageFile(e.target.files[0])}
                    disabled={isUploading.image}
                  />
                </label>
              </div>

              {/* AI Studio */}
              {aiMode && images.length > 0 && (
                <div className="mt-6 border border-blue-200 bg-gray-50 overflow-hidden">
                  <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Palette size={16} className="text-blue-600" />
                      <span className="text-sm font-bold">AI Studio Options</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <select
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value)}
                        className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-none px-2 py-1 focus:outline-none hover:border-blue-600 text-black"
                      >
                        <option value="1:1">1:1 Square</option>
                        <option value="4:3">4:3 Wide</option>
                        <option value="16:9">16:9 Cinema</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-black cursor-pointer">
                        <input
                          type="checkbox" checked={keepOriginalBg}
                          onChange={e => setKeepOriginalBg(e.target.checked)}
                          className="rounded-none accent-blue-600"
                        />
                        Keep original background
                      </label>
                      {!keepOriginalBg && (
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-none p-1">
                          {[['white','bg-white border-gray-300'],['light_grey','bg-gray-200 border-gray-300'],['black','bg-black border-gray-600']].map(([val, cls]) => (
                            <button
                              key={val} onClick={() => setAiBgColor(val)}
                              className={`w-5 h-5 rounded-none border shadow-sm ${cls} ${aiBgColor === val ? 'ring-2 ring-blue-600 scale-110' : 'hover:scale-110'} transition-transform`}
                              title={val}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-blue-600" />
                      <span className="text-xs font-bold text-black">
                        {recommendedViews.length > 0 ? 'AI Suggested Angles' : 'Generate Extra Angles'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(recommendedViews.length > 0 ? recommendedViews : ['Left side view', 'Right side view', 'Close up detail']).map((view, i) => (
                        <button
                          key={i} type="button" onClick={() => generateAnglesAI([view])}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-600 hover:text-blue-600 rounded-none text-xs font-semibold text-black transition-colors"
                        >
                          <Plus size={12} /> {view}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => generateAnglesAI(recommendedViews.length ? recommendedViews : null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-none text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <Wand2 size={12} /> Generate All {recommendedViews.length || 3}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Video + Audio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
                {/* Video */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold">Product Video</label>
                    <div className="flex gap-3">
                      {['upload', 'youtube', 'ai'].map(m => (
                        <button
                          key={m} onClick={() => setVideoMode(m)}
                          className={`text-xs font-bold transition-colors ${
                            videoMode === m
                              ? (m === 'ai' ? 'text-blue-600' : 'text-black')
                              : 'text-gray-400 hover:text-black'
                          }`}
                        >
                          {m === 'ai' ? 'AI Promo' : m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-gray-50 p-3 flex flex-col justify-center min-h-[70px]">
                    {videoMode === 'youtube' ? (
                      <div className="flex items-center gap-2">
                        <LinkIcon size={16} className="text-gray-400" />
                        <input
                          type="text" value={formData.videoDescription}
                          onChange={e => setFormData(p => ({ ...p, videoDescription: e.target.value }))}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full bg-transparent text-sm focus:outline-none text-black"
                        />
                      </div>
                    ) : videoMode === 'ai' ? (
                      <div className="flex flex-col items-center">
                        <button
                          onClick={generatePromoVideoAI}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Wand2 size={14} /> Generate Promo Video
                        </button>
                      </div>
                    ) : formData.videoDescription ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video size={16} className="text-black shrink-0" />
                          <span className="text-xs text-black truncate max-w-[150px]">Video Uploaded</span>
                        </div>
                        <button onClick={() => clearMediaField('videoDescription')} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors">
                        {isUploading.video
                          ? <Loader2 size={16} className="animate-spin" />
                          : <><UploadCloud size={16} className="mb-1" /><span className="text-xs font-medium">Upload MP4</span></>}
                        <input type="file" accept="video/*" className="hidden" onChange={e => handleExtraMediaUpload(e, 'video')} disabled={isUploading.video} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Audio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold">Audio Description</label>
                    {aiMode && formData.description && (
                      <button
                        onClick={generateAudioDescriptionAI}
                        className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"
                      >
                        <Sparkles size={12} /> Generate Ad
                      </button>
                    )}
                  </div>
                  <div className="border border-gray-200 bg-gray-50 p-3 flex flex-col justify-center min-h-[70px]">
                    {formData.audioDescription ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileAudio size={16} className="text-black shrink-0" />
                          <audio src={formData.audioDescription} controls className="h-6 w-32" />
                        </div>
                        <button onClick={() => clearMediaField('audioDescription')} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors">
                        {isUploading.audio
                          ? <Loader2 size={16} className="animate-spin" />
                          : <><UploadCloud size={16} className="mb-1" /><span className="text-xs font-medium">Upload MP3/WAV</span></>}
                        <input type="file" accept="audio/*" className="hidden" onChange={e => handleExtraMediaUpload(e, 'audio')} disabled={isUploading.audio} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {showAiPrompts && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <p className="text-sm font-bold text-blue-600">AI mapped your product!</p>
                  <button onClick={() => setShowAiPrompts(false)} className="text-xs text-blue-600 font-bold hover:underline">Dismiss</button>
                </div>
              )}
            </div>

            {/* ── Basic Information ── */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-5">
                <h2 className="text-base font-bold">Basic Information</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 block">
                    Product Title <span className="text-red-500">*</span>
                    {aiMode && formData.title && <Sparkles size={14} className="text-blue-600" />}
                  </label>
                  <input
                    type="text" value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Premium Wireless Headphones"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 block">
                    Description
                    {aiMode && formData.description && <Sparkles size={14} className="text-blue-600" />}
                  </label>
                  <textarea
                    rows={6} value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your product's features, benefits, and specifics..."
                    className={inputCls('resize-none')}
                  />
                </div>
              </div>
            </div>

            {/* ── Product Variants ── */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-3">
                <div>
                  <h2 className="text-base font-bold">Product Variants</h2>
                  {aiMode && images.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Sparkles size={10} className="text-blue-600" /> AI generation uses Studio options above
                    </p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
                  <div className="w-9 h-5 bg-gray-200 rounded-none peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-4">
                  {/* Variant type tabs */}
                  <div className="flex gap-4 border-b border-gray-200">
                    {[{ id: 'Color', icon: Palette }, { id: 'Size', icon: Ruler }, { id: 'Material', icon: Box }].map(t => (
                      <button
                        key={t.id}
                        onClick={e => { e.preventDefault(); setActiveVariantTab(t.id); }}
                        className={`pb-2 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors -mb-px ${
                          activeVariantTab === t.id
                            ? 'border-black text-black'
                            : 'border-transparent text-gray-400 hover:text-black'
                        }`}
                      >
                        <t.icon size={14} /> {t.id}
                        <span className="bg-gray-50 text-gray-500 border border-gray-200 rounded-none px-1.5 py-0.5 text-xs ml-1">
                          {variants.filter(v => v.type === t.id).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {aiMode && (formData.title || images.length > 0) && (
                    <div className="flex justify-end">
                      <button
                        onClick={suggestVariantsAI}
                        className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"
                      >
                        <Sparkles size={12} /> Suggest {activeVariantTab}s
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleVariants.map(v => (
                      <div key={v.id} className="p-4 border border-gray-200 bg-gray-50 flex flex-col gap-3">
                        <div className="flex gap-3 items-center">
                          <div className="relative">
                            <label className="w-16 h-16 bg-white border border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-black transition-colors">
                              {v.isUploading
                                ? <Loader2 size={16} className="animate-spin text-gray-400" />
                                : v.image
                                ? <img src={v.image} className="w-full h-full object-cover" />
                                : <ImageIcon size={20} className="text-gray-400" />}
                              <input type="file" accept="image/*,.avif" className="hidden" onChange={e => handleVariantImageUpload(v.id, e)} disabled={v.isUploading} />
                            </label>
                            {aiMode && images.length > 0 && v.name && (
                              <button
                                onClick={e => { e.preventDefault(); generateVariantImageAI(v.id); }}
                                className="absolute -top-2 -right-2 bg-black text-white p-1.5 z-10 hover:bg-blue-600 transition-colors shadow-sm"
                                title={`Generate AI image for ${v.name}`}
                              >
                                <Wand2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{v.type} Name</label>
                            <input
                              type="text" value={v.name || ''}
                              onChange={e => setVariants(vs => vs.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))}
                              className="w-full bg-white border border-gray-300 rounded-none px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors text-black"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (v.image?.includes('/temp/')) deleteFileFromFirebase(v.image);
                              setVariants(vs => vs.filter(x => x.id !== v.id));
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number" placeholder="Stock" value={v.stock || ''}
                            onChange={e => setVariants(vs => vs.map(x => x.id === v.id ? { ...x, stock: e.target.value } : x))}
                            className="w-full bg-white border border-gray-300 rounded-none px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors text-black"
                          />
                          <input
                            type="number" placeholder="Price (USh)" value={v.price || ''}
                            onChange={e => setVariants(vs => vs.map(x => x.id === v.id ? { ...x, price: e.target.value } : x))}
                            className="w-full bg-white border border-gray-300 rounded-none px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors text-black"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setVariants(p => [...p, { id: String(Date.now()), type: activeVariantTab, name: '', stock: '1', price: '', image: '', isUploading: false }])}
                    className="w-full py-3 border border-dashed border-gray-300 hover:border-black bg-gray-50 text-sm font-bold text-gray-500 hover:text-black transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> Add {activeVariantTab}
                  </button>
                </div>
              )}
            </div>

            {/* ── Specifications ── */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-3 w-full">
                  <h2 className="text-base font-bold flex items-center gap-1.5">
                    Specifications
                    {aiMode && formData.attributes.length > 0 && <Sparkles size={14} className="text-blue-600" />}
                  </h2>
                  {isAiSuggestingSpecs && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                      <Loader2 size={12} className="animate-spin" /> AI filling specs...
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 mb-5">
                Get your products found easily by filling in these specific details.
                {aiMode && dynamicSchema.length > 0 && !isAiSuggestingSpecs && (
                  <span className="ml-1 text-blue-600 font-medium">AI has pre-filled suggestions based on your product.</span>
                )}
              </p>

              {isLoadingSchema ? (
                <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
              ) : dynamicSchema.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                  {dynamicSchema.map(field => {
                    if (['price', 'filter_discount', 'filter_id_verify'].includes(field.slug)) return null;
                    const isAiFilled = aiMode && !!dynamicValues[field.slug] &&
                      !(Array.isArray(dynamicValues[field.slug]) && dynamicValues[field.slug].length === 0);

                    return (
                      <div key={field.slug}>
                        <label className="text-xs font-semibold mb-1.5 text-black flex items-center gap-1 truncate block" title={field.label}>
                          {field.label} {field.unit && <span className="text-gray-400 font-normal">({field.unit})</span>}
                          {isAiFilled && <Sparkles size={10} className="text-blue-600 shrink-0" />}
                        </label>

                        {field.visual_type === 'multiselect' ? (
                          <MultiSelectTagInput
                            field={field}
                            value={dynamicValues[field.slug]}
                            onChange={(vals) => setDynamicValues(p => ({ ...p, [field.slug]: vals }))}
                            isAiFilled={isAiFilled}
                          />
                        ) : field.visual_type === 'radio' ? (
                          <div className={`flex flex-wrap gap-1.5 p-2 border ${isAiFilled ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200 bg-gray-50'}`}>
                            {field.possible_values?.map(opt => {
                              const active = dynamicValues[field.slug] === opt.value;
                              return (
                                <button
                                  key={opt.value} type="button"
                                  onClick={() => setDynamicValues(p => ({ ...p, [field.slug]: active ? '' : opt.value }))}
                                  className={`px-2.5 py-1 text-xs font-semibold border transition-colors rounded-none ${
                                    active ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-black'
                                  }`}
                                >
                                  {opt.value}
                                </button>
                              );
                            })}
                          </div>
                        ) : field.visual_type === 'select' ? (
                          <div className="relative">
                            <select
                              value={dynamicValues[field.slug] || ''}
                              onChange={(e) => setDynamicValues(p => ({ ...p, [field.slug]: e.target.value }))}
                              className={inputAiCls(isAiFilled, 'pr-8 appearance-none')}
                            >
                              <option value="">Select...</option>
                              {field.possible_values?.map(v => <option key={v.value} value={v.value}>{v.value}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        ) : (
                          <input
                            type={field.attr_type === 'int' ? 'number' : 'text'}
                            value={dynamicValues[field.slug] || ''}
                            onChange={(e) => setDynamicValues(p => ({ ...p, [field.slug]: e.target.value }))}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className={inputAiCls(isAiFilled)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Custom Attributes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Custom Attributes</label>
                {formData.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text" value={attr.name}
                      onChange={e => updateAttribute(i, 'name', e.target.value)}
                      placeholder="Name (e.g. Warranty)"
                      className="w-1/3 bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors text-black"
                    />
                    <input
                      type="text" value={attr.value}
                      onChange={e => updateAttribute(i, 'value', e.target.value)}
                      placeholder="Value (e.g. 1 Year)"
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors text-black"
                    />
                    <button onClick={() => removeAttribute(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAttribute}
                  className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-black pt-2 transition-colors"
                >
                  <Plus size={14} /> Add Custom Attribute
                </button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT COLUMN
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:w-[35%] space-y-6">

            {/* ── Organization ── */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-5">
                <h2 className="text-base font-bold">Organization</h2>
              </div>

              {/* Marketplace Category Cascader */}
              <div className="relative mb-6" ref={cascaderRef}>
                <label className="text-sm font-semibold mb-2 flex justify-between block">
                  Marketplace Category <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => {
                    setShowCategoryCascader(p => !p);
                    if (!showCategoryCascader && formData.category) {
                      const selectedCat = dbCategories.find(c => c._id === formData.category);
                      if (selectedCat?.parentId) setActiveParentId(selectedCat.parentId);
                    }
                  }}
                  className={`w-full bg-gray-50 border rounded-none px-3 py-2 text-sm flex justify-between items-center cursor-pointer transition-colors ${
                    showCategoryCascader ? 'border-black' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className={formData.category ? 'text-black font-medium' : 'text-gray-400'}>{selectedCategoryName}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showCategoryCascader ? 'rotate-180' : ''}`} />
                </div>

                {showCategoryCascader && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm z-50 flex h-60 overflow-hidden">
                    {/* Parents */}
                    <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                      {categoryTree.map(p => (
                        <div
                          key={p._id}
                          onMouseEnter={() => setActiveParentId(p._id)}
                          onClick={() => { if (!p.subCategories.length) { setFormData(f => ({ ...f, category: p._id })); setShowCategoryCascader(false); } }}
                          className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors ${
                            activeParentId === p._id
                              ? 'bg-blue-50 font-bold text-blue-600 border-l-2 border-blue-600'
                              : 'text-black border-l-2 border-transparent'
                          }`}
                        >
                          {p.name}
                          {p.subCategories.length > 0 && <ChevronRight size={14} className="text-gray-400" />}
                        </div>
                      ))}
                    </div>
                    {/* Sub-categories */}
                    <div className="w-1/2 overflow-y-auto bg-gray-50">
                      {activeParentId && categoryTree.find(p => p._id === activeParentId)?.subCategories.map(sub => (
                        <div
                          key={sub._id}
                          onClick={() => { setFormData(f => ({ ...f, category: sub._id })); setShowCategoryCascader(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                            formData.category === sub._id ? 'font-bold text-blue-600 bg-white' : 'text-black'
                          }`}
                        >
                          {sub.name}
                        </div>
                      ))}
                      {activeParentId && (
                        <div
                          onClick={() => { setFormData(f => ({ ...f, category: activeParentId })); setShowCategoryCascader(false); }}
                          className="px-4 py-2.5 text-sm font-bold cursor-pointer border-t border-gray-200 text-gray-400 hover:text-black transition-colors"
                        >
                          Select Parent Category Instead
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Store Category */}
              <div className="relative mb-6" ref={storeCatRef}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold flex items-center">
                    Store Category <span className="text-xs font-normal text-gray-400 ml-1.5">(Optional)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-black transition-colors" title="Auto-fill with marketplace category name">
                    <input
                      type="checkbox" checked={syncMarketplaceCat}
                      onChange={e => setSyncMarketplaceCat(e.target.checked)}
                      className="accent-blue-600"
                    />
                    Use Marketplace name
                  </label>
                </div>

                {!formData.category ? (
                  <div className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                    Select a Marketplace Category first
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center">
                      <input
                        type="text" value={storeCategoryInput}
                        onChange={e => {
                          setStoreCategoryInput(e.target.value);
                          setSyncMarketplaceCat(false);
                          setShowStoreCatDropdown(true);
                          setFormData(p => ({ ...p, storeCategory: '' }));
                        }}
                        onFocus={() => setShowStoreCatDropdown(true)}
                        placeholder="e.g. Clearance, Machinery"
                        className="w-full bg-white border border-gray-300 rounded-none pl-3 pr-24 py-2 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors text-black"
                      />
                      {storeCategoryInput && !formData.storeCategory && (
                        <button
                          onClick={handleCreateStoreCategory}
                          type="button"
                          disabled={isSavingCategory}
                          className="absolute right-1 top-1 bottom-1 px-3 bg-black hover:bg-blue-600 transition-colors text-white text-xs font-bold flex items-center gap-1"
                        >
                          {isSavingCategory ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                      )}
                    </div>

                    {showStoreCatDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm z-50 max-h-[260px] overflow-y-auto flex flex-col">

                        {/* Selected — pinned top */}
                        {storeCategoryDropdownItems.selected && (
                          <div className="p-1 border-b border-gray-200 bg-gray-50">
                            <div className="px-2 py-1">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selected</span>
                            </div>
                            <div
                              onClick={() => {
                                setStoreCategoryInput(storeCategoryDropdownItems.selected.name);
                                setFormData(p => ({ ...p, storeCategory: storeCategoryDropdownItems.selected._id }));
                                setShowStoreCatDropdown(false);
                              }}
                              className="px-3 py-2 text-sm cursor-pointer flex items-center justify-between bg-white font-bold text-black border border-gray-200 mx-1 my-0.5"
                            >
                              <span>{storeCategoryDropdownItems.selected.name}</span>
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 border border-blue-200">Active</span>
                            </div>
                          </div>
                        )}

                        {/* AI suggested */}
                        {!syncMarketplaceCat && suggestedStoreCategories.length > 0 && !storeCategoryInput && (
                          <div className="p-2 border-b border-gray-200 bg-blue-50">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 mb-1 px-1">
                              <Sparkles size={10} /> AI Suggested
                            </span>
                            {suggestedStoreCategories.map((sug, i) => (
                              <div
                                key={`ai-${i}`}
                                onClick={() => { setStoreCategoryInput(sug); setFormData(p => ({ ...p, storeCategory: '' })); setShowStoreCatDropdown(false); }}
                                className="px-2 py-1.5 text-sm text-black cursor-pointer hover:bg-white hover:text-blue-600 font-medium transition-colors"
                              >
                                + Pick "{sug}"
                              </div>
                            ))}
                          </div>
                        )}

                        {/* All categories */}
                        {storeCategoryDropdownItems.others.length > 0 && (
                          <div className="p-1">
                            {storeCategoryDropdownItems.selected && (
                              <div className="px-2 pt-1 pb-0.5">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">All Categories</span>
                              </div>
                            )}
                            {storeCategoryDropdownItems.others.map(cat => (
                              <div
                                key={cat._id}
                                onClick={() => { setStoreCategoryInput(cat.name); setFormData(p => ({ ...p, storeCategory: cat._id })); setShowStoreCatDropdown(false); }}
                                className="px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 text-black"
                              >
                                {cat.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {storeCategoryDropdownItems.others.length === 0 && !storeCategoryDropdownItems.selected && (
                          <div className="px-3 py-3 text-sm text-gray-400 text-center">
                            No categories found. Type a name and click Save to create one.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Store Collection */}
              <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 block">
                  Store Collection <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.collectionId}
                    onChange={(e) => setFormData(p => ({ ...p, collectionId: e.target.value }))}
                    className={inputCls('pr-8 appearance-none')}
                  >
                    <option value="">No Collection</option>
                    {activeStoreCollections.map(collection => (
                      <option key={collection._id} value={collection.collectionId}>{collection.name}</option>
                    ))}
                  </select>
                  <Layers size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Assign this product to a smart collection like "New Arrivals" or "Best Sellers".
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Tags</label>
                <input
                  type="text" value={formData.tags || ''}
                  onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                  className={inputCls()}
                />
              </div>
            </div>

            {/* ── Pricing & Stock ── */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-5">
                <h2 className="text-base font-bold">Pricing &amp; Stock</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Base Price (USh) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" value={formData.price || ''}
                    onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                    className={inputCls()}
                  />
                </div>
                {!hasVariants && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Global Stock</label>
                    <input
                      type="number" value={formData.stock || ''}
                      onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))}
                      className={inputCls()}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Flash Sale ── */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <h2 className="text-base font-bold">Flash Sale Promotion</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox" className="sr-only peer"
                    checked={formData.isFlashItem}
                    onChange={e => setFormData(p => ({ ...p, isFlashItem: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-none peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              {formData.isFlashItem && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Discount Percentage (%)</label>
                  <input
                    type="number" value={formData.discountPercentage || ''}
                    onChange={e => setFormData(p => ({ ...p, discountPercentage: e.target.value }))}
                    placeholder="e.g. 25" min="1" max="99"
                    className={inputCls()}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DndProvider>
  );
}
