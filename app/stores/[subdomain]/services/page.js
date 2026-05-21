"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Image as ImageIcon, Loader2, Save, X,
  UploadCloud, CalendarCheck, Clock, Search, Briefcase,
  AlertCircle, ShieldCheck, ListChecks, Info,
  ChevronDown, ChevronRight, Tag, Sparkles, Wand2, Palette,
  LogIn, LogOut,
} from 'lucide-react';

// ─── Firebase ─────────────────────────────────────────────────────────────────
import { uploadFileToFirebase, deleteFileFromFirebase, moveTempFileToPermanent } from '@/lib/firebaseLib';

// ─── AI helpers (same as product form) ───────────────────────────────────────
import {
  fileToBase64,
  extractBase64FromUrl,
  convertDataUrlToFile,
  runGeminiImageAnalysis,
  runImageGeneration,
  buildAnglePrompt,
} from '@/lib/ai';

// ─── Loading overlay ──────────────────────────────────────────────────────────
const LOADING_PHRASES = [
  'Analysing service imagery...',
  'Extracting visual context...',
  'Crafting compelling copy...',
  'Aligning lighting and angles...',
  'Refining texture details...',
  'Applying visual enhancements...',
  'Finalising image layers...',
  'Uploading to secure storage...',
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

// ─── Pricing types ────────────────────────────────────────────────────────────
const PRICING_TYPES = [
  { value: 'fixed',       label: 'Fixed Price' },
  { value: 'hourly',      label: 'Hourly Rate' },
  { value: 'starting_at', label: 'Starting At (Variable)' },
  { value: 'contact',     label: 'Contact for Pricing' },
];

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL_FORM = {
  _id:             null,
  title:           '',
  category:        '',
  description:     '',
  tags:            '',
  images:          [],
  pricingType:     'fixed',
  price:           '',
  enableBooking:   false,
  durationMinutes: '60',
  bookingDetails: {
    cancellationPolicy: '',
    requirements:       '',
    amenities:          [],
    checkInTime:        '',
    checkOutTime:       '',
  },
};

// ─── Category Cascader ────────────────────────────────────────────────────────
function CategoryCascader({ dbCategories, value, onChange }) {
  const [open, setOpen]               = useState(false);
  const [activeParentId, setActiveParentId] = useState(null);
  const ref = useRef(null);

  const categoryTree = useMemo(() => {
    const parents = dbCategories.filter(c => !c.parentRef);
    return parents.map(p => ({
      ...p,
      subCategories: dbCategories.filter(c => c.parentRef === p._id),
    }));
  }, [dbCategories]);

  const selectedLabel = useMemo(() => {
    const cat = dbCategories.find(c => c._id === value);
    if (!cat) return 'Select a category';
    const parent = dbCategories.find(p => p._id === cat.parentRef);
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  }, [value, dbCategories]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">
        Service Category <span className="text-[#FE2C55]">*</span>
      </label>
      <div
        onClick={() => setOpen(p => !p)}
        className={`w-full bg-[#F8F8F8] border rounded-sm px-3 py-2 text-[13px] flex justify-between items-center cursor-pointer transition-colors ${
          open ? 'border-[#161823]' : 'border-[#E3E3E4] hover:border-[#161823]'
        }`}
      >
        <span className={value ? 'text-[#161823] font-medium' : 'text-[#8A8B91]'}>{selectedLabel}</span>
        <ChevronDown size={14} className={`text-[#8A8B91] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-sm rounded-sm z-50 flex h-[240px] overflow-hidden">
          <div className="w-1/2 border-r border-[#E3E3E4] overflow-y-auto">
            {categoryTree.map(p => (
              <div
                key={p._id}
                onMouseEnter={() => setActiveParentId(p._id)}
                onClick={() => { if (!p.subCategories.length) { onChange(p._id); setOpen(false); } }}
                className={`px-3 py-2.5 text-[12px] cursor-pointer hover:bg-[#F8F8F8] flex justify-between items-center ${
                  activeParentId === p._id ? 'bg-[#FEE2E2] font-bold text-[#FE2C55] border-l-2 border-[#FE2C55]' : 'text-[#161823]'
                }`}
              >
                {p.name}
                {p.subCategories.length > 0 && <ChevronRight size={14} className="text-[#8A8B91]" />}
              </div>
            ))}
          </div>
          <div className="w-1/2 overflow-y-auto bg-[#F8F8F8]">
            {activeParentId && categoryTree.find(p => p._id === activeParentId)?.subCategories.map(sub => (
              <div
                key={sub._id}
                onClick={() => { onChange(sub._id); setOpen(false); }}
                className={`px-4 py-2.5 text-[12px] cursor-pointer hover:text-[#FE2C55] transition-colors ${
                  value === sub._id ? 'font-bold text-[#FE2C55] bg-white' : 'text-[#161823]'
                }`}
              >
                {sub.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices]       = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [amenityInput, setAmenityInput] = useState('');

  // ── Categories ──────────────────────────────────────────────────────────────
  const [dbCategories, setDbCategories] = useState([]);

  // ── Session for temp uploads ─────────────────────────────────────────────────
  const sessionId = useRef('');
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    }
  }, []);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ ...INITIAL_FORM, images: [] });
  const isEditing = !!formData._id;

  // ── AI state ─────────────────────────────────────────────────────────────────
  const [aiMode, setAiMode]               = useState(true);
  const [imageGenModel, setImageGenModel] = useState('custom');
  const [keepOriginalBg, setKeepOriginalBg] = useState(false);
  const [aiBgColor, setAiBgColor]         = useState('white');
  const [aspectRatio, setAspectRatio]     = useState('1:1');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatus, setAiStatus]           = useState('');
  const [showAiBanner, setShowAiBanner]   = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [recommendedViews, setRecommendedViews] = useState([]);

  const localBase64Cache = useRef({});
  const bgPreference = keepOriginalBg ? 'original' : aiBgColor;

  // ── Fetch on mount ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async (endpoint, setter) => {
      try {
        const res    = await fetch(endpoint, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await res.json();
        if (result.success && result.data) setter(result.data);
      } catch (e) { console.error(`Failed to fetch ${endpoint}`, e); }
    };

    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const res    = await fetch('/api/services', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const result = await res.json();
        if (result.success && result.data) setServices(result.data);
      } catch (e) { console.error('Failed to fetch services', e); }
      finally { setIsLoading(false); }
    };

    fetchServices();
    load('/api/categories', setDbCategories);
  }, []);

  // ── Category label ───────────────────────────────────────────────────────────
  const getCategoryLabel = (id) => {
    const cat = dbCategories.find(c => c._id === id);
    if (!cat) return id || '—';
    const parent = dbCategories.find(p => p._id === cat.parentRef);
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  };

  // ── Image handlers ────────────────────────────────────────────────────────────
  const handleImageFile = async (file) => {
    if (!file?.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const url    = await uploadFileToFirebase(file, 'services/images', !isEditing, sessionId.current);
      localBase64Cache.current[url] = base64;
      const isFirst = (formData.images || []).length === 0;
      setFormData(p => ({ ...p, images: [...(p.images || []), url] }));
      if (aiMode && isFirst) generateDetailsFromImage(file);
    } catch (err) {
      console.error('Image upload error:', err);
      setErrorMessage('Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (idx) => {
    const url = (formData.images || [])[idx];
    setFormData(p => ({ ...p, images: (p.images || []).filter((_, i) => i !== idx) }));
    if (url?.includes('/temp/')) await deleteFileFromFirebase(url);
  };

  // ── AI: Analyse first image ───────────────────────────────────────────────────
  const generateDetailsFromImage = async (file) => {
    if (!aiMode) return;
    setIsAiProcessing(true);
    setAiStatus('Gemini is analysing your service image...');
    try {
      const base64 = await fileToBase64(file);
      const aiData = await runGeminiImageAnalysis(base64, file.type, dbCategories);

      setFormData(p => ({
        ...p,
        title:       aiData.title       || p.title,
        description: aiData.description || p.description,
        tags:        Array.isArray(aiData.tags) ? aiData.tags.join(', ') : aiData.tags || p.tags,
        category:    aiData.category_id || p.category,
      }));

      if (aiData.recommended_views) setRecommendedViews(aiData.recommended_views);
      setShowAiBanner(true);
    } catch (err) {
      console.error('Gemini analysis failed:', err);
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  // ── AI: Generate extra angle images ───────────────────────────────────────────
  const generateAnglesAI = async (views) => {
    const images = formData.images || [];
    if (!images.length) return;
    const anglesToGenerate = views?.length ? views : ['Left side view', 'Right side view', 'Close up detail'];
    setIsAiProcessing(true);

    const originalBase64 = await extractBase64FromUrl(images[0], localBase64Cache.current);
    if (!originalBase64) {
      setErrorMessage('Image extraction blocked by CORS. Re-upload the primary image to generate AI variants.');
      setIsAiProcessing(false);
      return;
    }

    const newImages = [];
    const params    = { aspectRatio, backgroundPreference: bgPreference, imageType: 'service' };

    for (const view of anglesToGenerate) {
      setAiStatus(`Generating ${view}...`);
      try {
        const prompt   = buildAnglePrompt(view, bgPreference, aspectRatio);
        const imageUrl = await runImageGeneration(originalBase64, prompt, params, imageGenModel);

        setAiStatus(`Uploading ${view}...`);
        const file      = imageUrl.startsWith('data:image')
          ? await convertDataUrlToFile(imageUrl, `angle_${Date.now()}.png`)
          : new File([await (await fetch(imageUrl)).blob()], 'angle.png', { type: 'image/png' });

        const uploadUrl = await uploadFileToFirebase(file, 'services/images', !isEditing, sessionId.current);
        localBase64Cache.current[uploadUrl] = await fileToBase64(file);
        newImages.push(uploadUrl);
        setRecommendedViews(p => p.filter(v => v !== view));
      } catch (err) {
        console.error(`Failed to generate angle "${view}":`, err);
      }
    }

    if (newImages.length) setFormData(p => ({ ...p, images: [...(p.images || []), ...newImages] }));
    setIsAiProcessing(false);
    setAiStatus('');
  };

  // ── Amenity helpers ───────────────────────────────────────────────────────────
  const handleAddAmenity = (e) => {
    if (e.key === 'Enter' && amenityInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        bookingDetails: {
          ...prev.bookingDetails,
          amenities: [...(prev.bookingDetails?.amenities || []), amenityInput.trim()],
        },
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (idx) => {
    setFormData(prev => ({
      ...prev,
      bookingDetails: {
        ...prev.bookingDetails,
        amenities: (prev.bookingDetails?.amenities || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Modal open ────────────────────────────────────────────────────────────────
  const handleOpenModal = (service = null) => {
    setErrorMessage('');
    setAmenityInput('');
    setShowAiBanner(false);
    setRecommendedViews([]);
    localBase64Cache.current = {};

    if (service) {
      setFormData({
        ...service,
        images: Array.isArray(service.images) && service.images.length
          ? service.images
          : service.image ? [service.image] : [],
        tags: service.tags || '',
        bookingDetails: {
          cancellationPolicy: service.bookingDetails?.cancellationPolicy || '',
          requirements:       service.bookingDetails?.requirements       || '',
          amenities:          service.bookingDetails?.amenities          || [],
          checkInTime:        service.bookingDetails?.checkInTime        || '',
          checkOutTime:       service.bookingDetails?.checkOutTime       || '',
        },
      });
    } else {
      setFormData({ ...INITIAL_FORM, images: [] });
    }
    setIsModalOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSaveService = async () => {
    setErrorMessage('');

    if (!formData.title?.trim())              return setErrorMessage('Service title is required.');
    if (!formData.category)                   return setErrorMessage('Service category is required.');
    if (!(formData.images || []).length)      return setErrorMessage('At least one service image is required.');
    if (!formData.description?.trim())        return setErrorMessage('Description is required.');
    if (formData.pricingType !== 'contact' && !formData.price)
      return setErrorMessage('Price is required for the selected pricing type.');

    setIsSaving(true);
    try {
      // Move temp files to permanent
      const cache       = localBase64Cache.current;
      const finalImages = await Promise.all(
        (formData.images || []).map(url => moveTempFileToPermanent(url, 'services/images', cache))
      );

      const payload = { ...formData, images: finalImages, image: finalImages[0] || '' };

      const method   = formData._id ? 'PUT' : 'POST';
      const endpoint = formData._id ? `/api/services/${formData._id}` : '/api/services';
      const res      = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setServices(prev =>
          formData._id
            ? prev.map(s => s._id === formData._id ? json.data : s)
            : [json.data, ...prev]
        );
        setIsModalOpen(false);
      } else {
        setErrorMessage(json.message || 'Failed to save service.');
      }
    } catch (e) {
      console.error('Save service error:', e);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteService = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      const res  = await fetch(`/api/services/${id}`, {
        method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const json = await res.json();
      if (json.success) setServices(prev => prev.filter(s => s._id !== id));
    } catch (e) { console.error('Delete error:', e); }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      getCategoryLabel(s.category)?.toLowerCase().includes(q)
    );
  }, [services, searchQuery, dbCategories]);

  const formatPrice = (service) => {
    if (service.pricingType === 'contact') return 'Contact for price';
    if (!service.price) return PRICING_TYPES.find(p => p.value === service.pricingType)?.label || '';
    return `USh ${Number(service.price).toLocaleString()}${service.pricingType === 'hourly' ? '/hr' : ''}`;
  };

  const safeImages = formData.images || [];

  // Detect hotel/accommodation category for check-in/out fields
  const isHotelCategory = useMemo(() => {
    if (!formData.category || !dbCategories.length) return false;
    const cat = dbCategories.find(c => c._id === formData.category);
    if (!cat) return false;
    const parent = dbCategories.find(p => p._id === cat.parentRef);
    const label  = `${parent?.name || ''} ${cat.name}`.toLowerCase();
    return label.includes('hotel') || label.includes('accommodation') ||
           label.includes('lodge') || label.includes('hostel') ||
           label.includes('resort') || label.includes('guesthouse') ||
           label.includes('motel')  || label.includes('bnb') ||
           label.includes('bed and breakfast');
  }, [formData.category, dbCategories]);

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="pb-10 w-full relative">
      {isAiProcessing && <MagicalLoader status={aiStatus} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Services Management</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Configure your offerings and booking rules.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#FE2C55] hover:bg-[#e0264b] text-white px-5 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Add New Service
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search services..."
          className="w-full bg-white border border-[#E3E3E4] rounded-sm pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
        />
      </div>

      {/* ── Service Grid ── */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[#161823]" size={28} />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center text-[#8A8B91]">
          <Briefcase size={40} className="mb-3 opacity-30" />
          <p className="text-[14px] font-medium">No services found</p>
          <p className="text-[12px] mt-1">Add your first service to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map(s => {
            const coverImg = (Array.isArray(s.images) && s.images[0]) || s.image || '';
            return (
              <div key={s._id} className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative h-36 overflow-hidden bg-[#F8F8F8]">
                  {coverImg
                    ? <img src={coverImg} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-[#E3E3E4]" /></div>
                  }
                  {s.enableBooking && (
                    <div className="absolute top-2 left-2 bg-[#161823] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1">
                      <CalendarCheck size={10} /> Bookable
                    </div>
                  )}
                  {Array.isArray(s.images) && s.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                      +{s.images.length - 1}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Tag size={11} className="text-[#8A8B91] shrink-0" />
                    <span className="text-[11px] text-[#8A8B91] font-medium truncate">{getCategoryLabel(s.category)}</span>
                  </div>
                  <h3 className="font-bold text-[14px] text-[#161823] leading-snug mb-1">{s.title}</h3>
                  <p className="text-[12px] text-[#8A8B91] mb-3 line-clamp-2">{s.description}</p>
                  {s.enableBooking && s.bookingDetails?.checkInTime && (
                    <div className="flex items-center gap-3 mb-3 text-[11px] text-[#8A8B91]">
                      <span className="flex items-center gap-1"><LogIn size={11} /> Check-in {s.bookingDetails.checkInTime}</span>
                      {s.bookingDetails?.checkOutTime && (
                        <span className="flex items-center gap-1"><LogOut size={11} /> Check-out {s.bookingDetails.checkOutTime}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#161823]">{formatPrice(s)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(s)} className="text-[11px] font-bold px-3 py-1.5 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm hover:border-[#161823] transition-colors text-[#161823] flex items-center gap-1">
                        <Edit size={12} /> Edit
                      </button>
                      <button onClick={() => handleDeleteService(s._id)} className="text-[11px] font-bold px-2 py-1.5 border border-[#E3E3E4] rounded-sm hover:border-[#FE2C55] hover:text-[#FE2C55] transition-colors text-[#8A8B91]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Modal
      ══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-sm w-full max-w-2xl my-8 shadow-2xl">

            {/* Modal Header — AI Copilot at top level */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E3E4]">
              <h2 className="text-[15px] font-bold text-[#161823]">
                {isEditing ? 'Edit Service' : 'Add New Service'}
              </h2>

              <div className="flex items-center gap-3">
                {/* Model picker */}
                {aiMode && (
                  <select
                    value={imageGenModel}
                    onChange={e => setImageGenModel(e.target.value)}
                    className="text-[11px] font-medium bg-transparent border border-[#E3E3E4] rounded-sm px-2 py-1.5 outline-none focus:border-[#161823] transition-colors"
                  >
                    <option value="custom">Model: Custom API</option>
                    <option value="grok">Model: Grok AI</option>
                  </select>
                )}

                {/* AI Copilot toggle */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#E3E3E4]">
                  <Sparkles size={15} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />
                  <span className="text-[12px] font-semibold text-[#161823]">AI Copilot</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(p => !p)} />
                    <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#7C3AED] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-sm hover:bg-[#F8F8F8] transition-colors text-[#8A8B91] hover:text-[#161823]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

              {/* Error */}
              {errorMessage && (
                <div className="p-3 bg-[#FEE2E2] border border-[#FE2C55]/20 text-[#FE2C55] rounded-sm text-[13px] font-semibold flex items-center gap-2">
                  <AlertCircle size={15} /> {errorMessage}
                </div>
              )}

              {/* ── Images section (AI-enhanced) ── */}
              <div className={`border rounded-sm p-4 ${aiMode ? 'border-[#7C3AED]/40 ring-1 ring-[#7C3AED]/10' : 'border-[#E3E3E4]'}`}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-semibold text-[#161823]">
                    Service Images <span className="text-[#FE2C55]">*</span>
                    {aiMode && safeImages.length > 0 && (
                      <span className="ml-2 text-[11px] font-normal text-[#7C3AED] flex items-center gap-1 inline-flex">
                        <Sparkles size={10} /> AI will analyse first image
                      </span>
                    )}
                  </label>
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {safeImages.map((img, idx) => (
                    <div key={idx} className="aspect-square border border-[#E3E3E4] rounded-sm relative group overflow-hidden bg-[#F8F8F8]">
                      <img src={img} alt="Service" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-[#FEE2E2] transition-all"
                      >
                        <Trash2 size={14} className="text-[#FE2C55]" />
                      </button>
                      {idx === 0 && (
                        <div className="absolute bottom-1 left-1 bg-[#161823] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add slot */}
                  <label className="aspect-square border border-dashed border-[#E3E3E4] rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#161823] transition-colors bg-[#F8F8F8] hover:bg-white">
                    {isUploading
                      ? <Loader2 size={20} className="animate-spin text-[#8A8B91]" />
                      : <UploadCloud size={20} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />}
                    <span className="text-[11px] font-semibold mt-1.5 text-[#161823]">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageFile(e.target.files[0])}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {/* AI Studio — only shows after first image uploaded */}
                {aiMode && safeImages.length > 0 && (
                  <div className="mt-4 border border-[#7C3AED]/30 bg-[#F8F8F8] rounded-sm overflow-hidden">
                    {/* Studio controls */}
                    <div className="bg-white px-4 py-3 border-b border-[#E3E3E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Palette size={15} className="text-[#7C3AED]" />
                        <span className="text-[12px] font-bold text-[#161823]">AI Studio Options</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <select
                          value={aspectRatio}
                          onChange={e => setAspectRatio(e.target.value)}
                          className="text-[11px] font-medium bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-2 py-1 outline-none hover:border-[#7C3AED] text-[#161823]"
                        >
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
                            {[['white','bg-white border-[#E3E3E4]'],['light_grey','bg-gray-200 border-gray-300'],['black','bg-black border-gray-600']].map(([val, cls]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setAiBgColor(val)}
                                className={`w-5 h-5 rounded-sm border shadow-sm ${cls} ${aiBgColor === val ? 'ring-2 ring-[#7C3AED] scale-110' : 'hover:scale-110'} transition-transform`}
                                title={val}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Angle generation */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={13} className="text-[#7C3AED]" />
                        <span className="text-[12px] font-bold text-[#161823]">
                          {recommendedViews.length > 0 ? 'AI Suggested Angles' : 'Generate Extra Angles'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(recommendedViews.length > 0 ? recommendedViews : ['Left side view', 'Right side view', 'Close up detail']).map((view, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => generateAnglesAI([view])}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3E3E4] hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-sm text-[11px] font-semibold text-[#161823] transition-colors shadow-sm"
                          >
                            <Plus size={12} /> {view}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => generateAnglesAI(recommendedViews.length ? recommendedViews : null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#7C3AED] rounded-sm text-[11px] font-bold hover:bg-[#e9d5ff] transition-colors"
                        >
                          <Wand2 size={12} /> Generate All {recommendedViews.length || 3}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI mapped banner */}
                {showAiBanner && (
                  <div className="mt-3 p-3 bg-[#F3E8FF] border border-[#7C3AED]/20 rounded-sm flex items-center justify-between">
                    <p className="text-[12px] font-bold text-[#7C3AED] flex items-center gap-1.5">
                      <Sparkles size={12} /> AI mapped your service details!
                    </p>
                    <button onClick={() => setShowAiBanner(false)} className="text-[11px] text-[#7C3AED] font-bold hover:underline">Dismiss</button>
                  </div>
                )}
              </div>

              {/* ── Category Cascader ── */}
              <CategoryCascader
                dbCategories={dbCategories}
                value={formData.category}
                onChange={id => setFormData(p => ({ ...p, category: id }))}
              />

              {/* ── Title ── */}
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                  Service Title <span className="text-[#FE2C55]">*</span>
                  {aiMode && formData.title && <Sparkles size={13} className="text-[#7C3AED]" />}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Deluxe Ocean View Room"
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                />
              </div>

              {/* ── Description ── */}
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                  Description <span className="text-[#FE2C55]">*</span>
                  {aiMode && formData.description && <Sparkles size={13} className="text-[#7C3AED]" />}
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your service in detail..."
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none resize-none focus:border-[#161823] transition-colors text-[#161823]"
                />
              </div>

              {/* ── Tags ── */}
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                  Tags
                  {aiMode && formData.tags && <Sparkles size={13} className="text-[#7C3AED]" />}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                  placeholder="e.g. luxury, ocean view, spa"
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                />
              </div>

              {/* ── Pricing ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">Pricing Type</label>
                  <select
                    value={formData.pricingType}
                    onChange={e => setFormData(p => ({ ...p, pricingType: e.target.value }))}
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                  >
                    {PRICING_TYPES.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                {formData.pricingType !== 'contact' && (
                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">
                      Price (USh) <span className="text-[#FE2C55]">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                      placeholder="e.g. 150000"
                      className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                    />
                  </div>
                )}
              </div>

              {/* ── Booking Toggle ── */}
              <div className="flex items-center justify-between py-3 border-t border-b border-[#E3E3E4]">
                <div>
                  <p className="text-[13px] font-bold text-[#161823] flex items-center gap-1.5">
                    <CalendarCheck size={15} /> Enable Online Booking
                  </p>
                  <p className="text-[11px] text-[#8A8B91] mt-0.5">Allow customers to book this service online</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.enableBooking}
                    onChange={e => setFormData(p => ({ ...p, enableBooking: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#FE2C55] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              {/* ── Booking Details ── */}
              {formData.enableBooking && (
                <div className="space-y-4 bg-[#F8F8F8] p-4 rounded-sm border border-[#E3E3E4]">
                  <h4 className="font-bold text-[13px] text-[#161823] flex items-center gap-2">
                    <ListChecks size={15} /> Booking Specifics
                  </h4>

                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                      <Clock size={13} /> Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={e => setFormData(p => ({ ...p, durationMinutes: e.target.value }))}
                      placeholder="60"
                      className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                    />
                  </div>

                  {/* ── Hotel check-in / check-out ── */}
                  {isHotelCategory && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-white border border-[#E3E3E4] rounded-sm">
                      <div className="col-span-2 flex items-center gap-1.5 mb-1">
                        <CalendarCheck size={13} className="text-[#FE2C55]" />
                        <span className="text-[12px] font-bold text-[#161823]">Hotel Check-in / Check-out</span>
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                          <LogIn size={13} className="text-[#161823]" /> Check-in Time
                        </label>
                        <input
                          type="time"
                          value={formData.bookingDetails.checkInTime}
                          onChange={e => setFormData(p => ({
                            ...p,
                            bookingDetails: { ...p.bookingDetails, checkInTime: e.target.value },
                          }))}
                          className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                          <LogOut size={13} className="text-[#161823]" /> Check-out Time
                        </label>
                        <input
                          type="time"
                          value={formData.bookingDetails.checkOutTime}
                          onChange={e => setFormData(p => ({
                            ...p,
                            bookingDetails: { ...p.bookingDetails, checkOutTime: e.target.value },
                          }))}
                          className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                        <ShieldCheck size={13} /> Cancellation Policy
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bookingDetails.cancellationPolicy}
                        onChange={e => setFormData(p => ({
                          ...p,
                          bookingDetails: { ...p.bookingDetails, cancellationPolicy: e.target.value },
                        }))}
                        placeholder="e.g. Free cancellation up to 48 hours before..."
                        className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none resize-none focus:border-[#161823] transition-colors text-[#161823]"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold mb-1.5 text-[#161823] flex items-center gap-1.5">
                        <Info size={13} /> Special Requirements
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bookingDetails.requirements}
                        onChange={e => setFormData(p => ({
                          ...p,
                          bookingDetails: { ...p.bookingDetails, requirements: e.target.value },
                        }))}
                        placeholder="e.g. Valid ID required, age limit..."
                        className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none resize-none focus:border-[#161823] transition-colors text-[#161823]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5 text-[#161823]">
                      Amenities / Features
                      <span className="text-[11px] font-normal text-[#8A8B91] ml-2">Press Enter to add</span>
                    </label>
                    <input
                      type="text"
                      value={amenityInput}
                      onChange={e => setAmenityInput(e.target.value)}
                      onKeyDown={handleAddAmenity}
                      placeholder="e.g. Wi-Fi, Pool, Valet..."
                      className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-[#161823] transition-colors text-[#161823] mb-2"
                    />
                    {(formData.bookingDetails?.amenities || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(formData.bookingDetails?.amenities || []).map((a, i) => (
                          <span key={i} className="flex items-center gap-1 bg-[#161823] text-white px-2.5 py-1 rounded-sm text-[11px] font-medium">
                            {a}
                            <button type="button" onClick={() => handleRemoveAmenity(i)}>
                              <X size={10} className="opacity-70 hover:opacity-100" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#F8F8F8] border-t border-[#E3E3E4] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[13px] font-bold text-[#8A8B91] hover:text-[#161823] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-[#161823] hover:bg-black text-white rounded-sm text-[13px] font-bold transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Saving...' : isEditing ? 'Update Service' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}