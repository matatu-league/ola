"use client";

import React, { useState, useEffect } from 'react';
import { 
  Store, Globe, MapPin, Save, Loader2, Image as ImageIcon, 
  Briefcase, Phone, UploadCloud, Trash2, X, ZoomIn, Check, Sparkles, Wand2
} from 'lucide-react';

import { uploadFileToFirebase } from '@/lib/firebaseLib';

// ============================================================================
// CONFIG — swap these to point at any backend / AI provider
// ============================================================================
const API_ENDPOINTS = {
  store: '/api/seller/store',          // GET + PUT
};

const AI_IMAGE_CONFIG = {
  // Model identifier forwarded to the AI image generation backend
  model: process.env.NEXT_PUBLIC_AI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview',
  // Base URL for the generation API (versioned path only, key appended at call-time)
  baseUrl: process.env.NEXT_PUBLIC_AI_IMAGE_BASE_URL
    || 'https://generativelanguage.googleapis.com/v1beta/models',
  // Public API key — set NEXT_PUBLIC_GEMINI_API_KEY (or equivalent) in your .env
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
};

// ============================================================================
// CUSTOM IMAGE CROPPER MODAL
// ============================================================================
const ImageCropperModal = ({ imageSrc, reqW, reqH, onCropComplete, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgObj, setImgObj] = useState(null);
  const [boxSize, setBoxSize] = useState({ w: 300, h: 300 });
  const [natSize, setNatSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const aspect = reqW / reqH;
      const MAX_WIDTH = 500;
      let bW = MAX_WIDTH;
      let bH = MAX_WIDTH / aspect;
      if (bH > 400) { bH = 400; bW = 400 * aspect; }

      const minS = Math.max(bW / img.width, bH / img.height);
      setNatSize({ w: img.width, h: img.height });
      setMinScale(minS);
      setZoom(minS);
      setPos({ x: (bW - img.width * minS) / 2, y: (bH - img.height * minS) / 2 });
      setBoxSize({ w: bW, h: bH });
      setImgObj(img);
    };
    img.src = imageSrc;
  }, [imageSrc, reqW, reqH]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    const currentImgW = natSize.w * zoom;
    const currentImgH = natSize.h * zoom;
    newX = Math.min(0, Math.max(newX, boxSize.w - currentImgW));
    newY = Math.min(0, Math.max(newY, boxSize.h - currentImgH));
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    const ratio = newZoom / zoom;
    const cx = boxSize.w / 2;
    const cy = boxSize.h / 2;
    let newX = cx - (cx - pos.x) * ratio;
    let newY = cy - (cy - pos.y) * ratio;
    const currentImgW = natSize.w * newZoom;
    const currentImgH = natSize.h * newZoom;
    newX = Math.min(0, Math.max(newX, boxSize.w - currentImgW));
    newY = Math.min(0, Math.max(newY, boxSize.h - currentImgH));
    setZoom(newZoom);
    setPos({ x: newX, y: newY });
  };

  const generateCroppedImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = reqW;
    canvas.height = reqH;
    const ctx = canvas.getContext('2d');

    const sx = -pos.x / zoom;
    const sy = -pos.y / zoom;
    const sW = boxSize.w / zoom;
    const sH = boxSize.h / zoom;

    ctx.drawImage(imgObj, sx, sy, sW, sH, 0, 0, reqW, reqH);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped_image.jpeg', { type: 'image/jpeg' });
        onCropComplete(file);
      }
    }, 'image/jpeg', 0.8);
  };

  if (!imgObj) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E3E4]">
          <div>
            <h3 className="font-bold text-[#161823]">Adjust Image</h3>
            <p className="text-[12px] text-[#8A8B91] mt-0.5">Drag to reposition. Output: {reqW}x{reqH}px</p>
          </div>
          <button onClick={onCancel} className="p-2 text-[#8A8B91] hover:text-[#161823] transition-colors rounded-sm hover:bg-[#F8F8F8]">
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#F8F8F8] flex-1 flex flex-col items-center justify-center p-8 overflow-hidden touch-none border-b border-[#E3E3E4]">
          <div
            className="relative bg-white border border-[#E3E3E4] overflow-hidden cursor-move"
            style={{ width: boxSize.w, height: boxSize.h }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img
              src={imageSrc}
              alt="Crop workspace"
              className="absolute max-w-none pointer-events-none"
              style={{ width: natSize.w * zoom, height: natSize.h * zoom, left: pos.x, top: pos.y }}
            />
            {/* Rule-of-thirds grid overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-black/10">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={[
                    i % 3 !== 2 ? 'border-r' : '',
                    i < 6      ? 'border-b' : '',
                    'border-black/10',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white">
          <div className="flex items-center gap-4 mb-6 px-4">
            <ZoomIn size={18} className="text-[#8A8B91]" />
            <input
              type="range" min={minScale} max={minScale * 3} step="0.001"
              value={zoom} onChange={handleZoomChange}
              className="flex-1 accent-[#161823]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-5 py-2 text-[13px] font-semibold text-[#161823] hover:bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm transition-colors">
              Cancel
            </button>
            <button onClick={generateCroppedImage} className="px-5 py-2 text-[13px] font-semibold text-white bg-[#161823] hover:bg-black rounded-sm transition-colors flex items-center gap-2">
              <Check size={16} /> Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AI IMAGE GENERATION MODAL
// ============================================================================
const AIGenerationModal = ({ type, companyDescription, storeName, onClose, onGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const descStr = companyDescription ? ` It is described as: "${companyDescription}".` : '';
    const nameStr = storeName ? ` for a brand called "${storeName}".` : '';

    if (type === 'logo') {
      setPrompt(`A professional, modern, minimalist e-commerce logo${nameStr}${descStr} It should have a clean white background, vibrant central icon, and premium branding aesthetic. No text.`);
    } else {
      setPrompt(`A wide, high-quality e-commerce hero banner${nameStr}${descStr} It should look professional, inviting, well-lit, and suitable for a digital storefront background. No text.`);
    }
  }, [type, companyDescription, storeName]);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      if (!AI_IMAGE_CONFIG.apiKey) {
        throw new Error('AI image generation is not configured. Please set the API key environment variable.');
      }

      const apiUrl = `${AI_IMAGE_CONFIG.baseUrl}/${AI_IMAGE_CONFIG.model}:generateContent?key=${AI_IMAGE_CONFIG.apiKey}`;

      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: type === 'logo' ? '1:1' : '16:9' },
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (!part?.inlineData) {
        throw new Error('No image was generated. Please try a different prompt.');
      }

      onGenerated(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);

    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E3E4] bg-[#F8F8F8]">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#9333EA]" size={18} />
            <h3 className="font-bold text-[#161823]">AI {type === 'logo' ? 'Logo' : 'Banner'} Generator</h3>
          </div>
          <button onClick={onClose} disabled={isGenerating} className="p-2 text-[#8A8B91] hover:text-[#161823] transition-colors rounded-sm hover:bg-white border border-transparent hover:border-[#E3E3E4]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FE2C55]/20 text-[#FE2C55] rounded-sm text-[13px] font-semibold">
              ⚠️ {error}
            </div>
          )}

          <label className="text-[13px] font-semibold text-[#161823] mb-2 block">
            Describe what you want to see:
          </label>
          <textarea
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-all resize-none disabled:opacity-50"
          />
          <p className="text-[11px] text-[#8A8B91] mt-2 leading-relaxed">
            Tip: Be as descriptive as possible. Mention colors, style (e.g., minimalist, vibrant, photorealistic), and specific elements.
          </p>
        </div>

        <div className="px-6 py-4 bg-[#F8F8F8] border-t border-[#E3E3E4] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-[13px] font-semibold text-[#161823] hover:bg-white border border-[#E3E3E4] rounded-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[#9333EA] hover:bg-[#7e22ce] rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating
              ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
              : <><Wand2 size={16} /> Generate Image</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPERS — thin wrappers around the API so the component stays agnostic
// ============================================================================

/** Fetch the current store record from the backend. */
async function fetchStoreData() {
  const response = await fetch(API_ENDPOINTS.store, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  });
  if (!response.ok) throw new Error(`Failed to load store (${response.status})`);
  return response.json(); // { success, store }
}

/** Persist updated store fields to the backend. */
async function saveStoreData(payload) {
  const response = await fetch(API_ENDPOINTS.store, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Save failed (${response.status})`);
  return response.json(); // { success, message? }
}

/** Normalise a raw store API record into local form state. */
function storeToFormData(s) {
  return {
    title:        s.title              || '',
    description:  s.description        || '',
    email:        s.contact?.email     || '',
    phone:        s.contact?.phone     || '',
    address:      s.location?.address  || '',
    domain:       s.domain             || 'my-store.ola.ug',
    customDomain: s.domain && !s.domain.includes('.ola.ug') ? s.domain : '',
    logo:         s.logo               || '',
    banner:       s.banner             || '',
    years:        s.years              || '',
    staff:        s.staff              || '',
    revenue:      s.revenue            || '',
  };
}

/** Serialise local form state into the API payload shape. */
function formDataToPayload(f) {
  return {
    title:       f.title,
    description: f.description,
    domain:      f.customDomain || f.domain,
    logo:        f.logo,
    banner:      f.banner,
    years:       f.years,
    staff:       f.staff,
    revenue:     f.revenue,
    contact:  { email: f.email, phone: f.phone },
    location: { address: f.address },
  };
}

// ============================================================================
// MAIN STORE PROFILE COMPONENT
// ============================================================================
export default function StoreProfile() {
  const [isLoading,   setIsLoading]   = useState(true);
  const [isSaving,    setIsSaving]    = useState(false);
  const [message,     setMessage]     = useState({ type: '', text: '' });
  const [isUploading, setIsUploading] = useState({ logo: false, banner: false });
  const [dragActive,  setDragActive]  = useState({ logo: false, banner: false });
  const [imageErrors, setImageErrors] = useState({ logo: '', banner: '' });
  const [cropConfig,  setCropConfig]  = useState(null);
  const [aiModalConfig, setAiModalConfig] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', email: '', phone: '', address: '',
    domain: 'my-store.ola.ug', customDomain: '', logo: '', banner: '',
    years: '', staff: '', revenue: '',
  });

  // ── 1. Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStoreData()
      .then(result => {
        if (result.success && result.store) {
          setFormData(storeToFormData(result.store));
        }
      })
      .catch(err => {
        console.error('Failed to load store profile:', err);
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── 2. Upload to Firebase Storage ─────────────────────────────────────────
  const uploadToFirebaseAfterCrop = async (file, field) => {
    setCropConfig(null);
    setIsUploading(prev => ({ ...prev, [field]: true }));
    try {
      const downloadURL = await uploadFileToFirebase(file, field);
      setFormData(prev => ({ ...prev, [field]: downloadURL }));
      setImageErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      console.error('Upload error:', error);
      setImageErrors(prev => ({ ...prev, [field]: 'Failed to upload image. Please try again.' }));
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  // ── 3. Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await saveStoreData(formDataToPayload(formData));
      setMessage(
        result.success
          ? { type: 'success', text: 'Store profile updated successfully!' }
          : { type: 'error',   text: result.message || 'Failed to update store.' }
      );
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  // ── Cropper helpers ────────────────────────────────────────────────────────
  const readAndOpenCropper = (file, field, requiredW, requiredH) => {
    setImageErrors(prev => ({ ...prev, [field]: '' }));
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageErrors(prev => ({ ...prev, [field]: 'Please upload a valid image file.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setCropConfig({ src: e.target.result, field, reqW: requiredW, reqH: requiredH });
    reader.readAsDataURL(file);
  };

  const handleDrag = (e, field) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [field]: e.type === 'dragenter' || e.type === 'dragover' }));
  };

  const handleDrop = (e, field, reqW, reqH) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [field]: false }));
    if (e.dataTransfer.files?.[0]) readAndOpenCropper(e.dataTransfer.files[0], field, reqW, reqH);
  };

  const handleAIGenerated = (imageUrl, field, reqW, reqH) => {
    setAiModalConfig(null);
    setCropConfig({ src: imageUrl, field, reqW, reqH });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#161823]" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full">

      {/* ── Modals ── */}
      {cropConfig && (
        <ImageCropperModal
          imageSrc={cropConfig.src}
          reqW={cropConfig.reqW}
          reqH={cropConfig.reqH}
          onCancel={() => setCropConfig(null)}
          onCropComplete={(file) => uploadToFirebaseAfterCrop(file, cropConfig.field)}
        />
      )}

      {aiModalConfig && (
        <AIGenerationModal
          type={aiModalConfig.type}
          companyDescription={formData.description}
          storeName={formData.title}
          onClose={() => setAiModalConfig(null)}
          onGenerated={(url) => handleAIGenerated(url, aiModalConfig.type, aiModalConfig.reqW, aiModalConfig.reqH)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Store Profile</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage details, AI media, and web domains.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isUploading.logo || isUploading.banner}
          className="bg-[#161823] hover:bg-black text-white px-5 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shrink-0"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* ── Status banner ── */}
      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20'
            : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6 w-full">

        {/* ── SECTION 1: General Information ── */}
        <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 w-full">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <Store size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">General Information</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Store Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Acme Electronics"
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">About the Store (Bio)</label>
                <textarea
                  rows="5"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your business, what you sell, your target audience, and your brand vibe..."
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors resize-none"
                />
                <p className="text-[11px] text-[#8A8B91] mt-1.5">Used by our AI to generate matching branding and descriptions.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 flex items-center gap-1.5 block">
                  <Briefcase size={14} className="text-[#8A8B91]" /> Years in Business
                </label>
                <input
                  type="number"
                  value={formData.years}
                  onChange={e => setFormData(p => ({ ...p, years: e.target.value }))}
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Staff Size</label>
                <select
                  value={formData.staff}
                  onChange={e => setFormData(p => ({ ...p, staff: e.target.value }))}
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
                >
                  <option value="">Select size</option>
                  <option value="1-5">1–5 Employees</option>
                  <option value="5-20">5–20 Employees</option>
                  <option value="20+">20+ Employees</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Annual Revenue</label>
                <select
                  value={formData.revenue}
                  onChange={e => setFormData(p => ({ ...p, revenue: e.target.value }))}
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
                >
                  <option value="">Select bracket</option>
                  <option value="Under $50k">Under $50k</option>
                  <option value="$50k - $250k">$50k – $250k</option>
                  <option value="$250k+">$250k+</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Branding & Media ── */}
        <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 w-full" id="media">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <ImageIcon size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">Store Branding & Media</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Logo */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-[13px] font-bold text-[#161823]">Store Logo</h3>
                  <p className="text-[12px] text-[#8A8B91] mt-0.5">Displayed on your profile and products.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiModalConfig({ type: 'logo', reqW: 512, reqH: 512 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#9333EA] hover:bg-[#E9D5FF] rounded-sm text-[12px] font-semibold transition-colors"
                  >
                    <Sparkles size={12} /> Generate
                  </button>
                  <span className="text-[11px] font-semibold text-[#8A8B91] bg-[#F8F8F8] px-2 py-1 rounded-sm border border-[#E3E3E4]">512×512</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <label
                  className={`relative flex flex-col items-center justify-center w-28 h-28 shrink-0 border border-dashed rounded-sm cursor-pointer transition-all overflow-hidden group ${
                    dragActive.logo ? 'border-[#9333EA] bg-[#F3E8FF]' : 'border-[#E3E3E4] hover:border-[#8A8B91] bg-[#F8F8F8]'
                  } ${imageErrors.logo ? 'border-[#FE2C55] bg-[#FEE2E2]/30' : ''}`}
                  onDragEnter={(e) => handleDrag(e, 'logo')}
                  onDragLeave={(e)  => handleDrag(e, 'logo')}
                  onDragOver={(e)   => handleDrag(e, 'logo')}
                  onDrop={(e)       => handleDrop(e, 'logo', 512, 512)}
                >
                  {isUploading.logo ? (
                    <Loader2 size={20} className="text-[#161823] animate-spin" />
                  ) : formData.logo ? (
                    <div className="relative w-full h-full">
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <UploadCloud size={16} className="text-white" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setFormData(p => ({ ...p, logo: '' })); }} className="text-white hover:text-[#FE2C55] transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <UploadCloud size={20} className={`mb-1 ${dragActive.logo ? 'text-[#9333EA]' : 'text-[#8A8B91]'}`} />
                      <p className="text-[10px] font-semibold text-[#8A8B91] uppercase tracking-wider">Upload</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => readAndOpenCropper(e.target.files[0], 'logo', 512, 512)} disabled={isUploading.logo} />
                </label>

                <div className="flex-1 text-center sm:text-left">
                  {imageErrors.logo && <p className="text-[12px] text-[#FE2C55] font-semibold mb-2">⚠️ {imageErrors.logo}</p>}
                  <p className="text-[12px] text-[#8A8B91] leading-relaxed">
                    Drag and drop your existing logo, or use our AI Generator to create a beautiful new one based on your store description. Keep the design simple and recognizable.
                  </p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-[13px] font-bold text-[#161823]">Store Banner</h3>
                  <p className="text-[12px] text-[#8A8B91] mt-0.5">The hero image displayed at the top of your storefront.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiModalConfig({ type: 'banner', reqW: 1200, reqH: 400 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3E8FF] text-[#9333EA] hover:bg-[#E9D5FF] rounded-sm text-[12px] font-semibold transition-colors"
                  >
                    <Sparkles size={12} /> Generate
                  </button>
                  <span className="text-[11px] font-semibold text-[#8A8B91] bg-[#F8F8F8] px-2 py-1 rounded-sm border border-[#E3E3E4]">1200×400</span>
                </div>
              </div>

              <label
                className={`relative flex flex-col items-center justify-center w-full h-36 border border-dashed rounded-sm cursor-pointer transition-all overflow-hidden group ${
                  dragActive.banner ? 'border-[#9333EA] bg-[#F3E8FF]' : 'border-[#E3E3E4] hover:border-[#8A8B91] bg-[#F8F8F8]'
                } ${imageErrors.banner ? 'border-[#FE2C55] bg-[#FEE2E2]/30' : ''}`}
                onDragEnter={(e) => handleDrag(e, 'banner')}
                onDragLeave={(e)  => handleDrag(e, 'banner')}
                onDragOver={(e)   => handleDrag(e, 'banner')}
                onDrop={(e)       => handleDrop(e, 'banner', 1200, 400)}
              >
                {isUploading.banner ? (
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <Loader2 size={24} className="mb-3 text-[#161823] animate-spin" />
                    <p className="text-[12px] font-semibold text-[#161823] uppercase tracking-wider">Uploading...</p>
                  </div>
                ) : formData.banner ? (
                  <div className="relative w-full h-full">
                    <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <div className="text-white text-[12px] font-semibold flex items-center gap-2 bg-black/40 px-4 py-2 rounded-sm border border-white/20">
                        <UploadCloud size={14} /> Replace
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setFormData(p => ({ ...p, banner: '' })); }}
                        className="text-white border border-white/20 bg-black/40 px-4 py-2 rounded-sm text-[12px] font-semibold flex items-center gap-2 hover:bg-[#FE2C55] hover:border-[#FE2C55] transition-colors"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <ImageIcon size={24} className={`mb-2 transition-colors ${dragActive.banner ? 'text-[#9333EA]' : 'text-[#8A8B91]'}`} />
                    <p className="text-[12px] font-semibold text-[#161823] mb-1">Click to upload or drag and drop</p>
                    <p className="text-[11px] text-[#8A8B91]">Upload a cover photo or use the AI generator.</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => readAndOpenCropper(e.target.files[0], 'banner', 1200, 400)} disabled={isUploading.banner} />
              </label>
              {imageErrors.banner && <p className="text-[12px] text-[#FE2C55] mt-2 font-semibold">{imageErrors.banner}</p>}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Contact & Location ── */}
        <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 w-full" id="location">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <MapPin size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">Contact & Location</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Support Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 flex items-center gap-1.5 block">
                  <Phone size={14} className="text-[#8A8B91]" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Physical Business Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="e.g. 123 Kampala Road, Kampala, Uganda"
                className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#8A8B91] mt-1.5">Displayed on order invoices and contact pages.</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Web Addresses ── */}
        <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 w-full">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <Globe size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">Web Addresses</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Default Subdomain</label>
              <div className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#8A8B91] font-medium flex items-center cursor-not-allowed">
                {formData.domain}
              </div>
              <p className="text-[11px] text-[#8A8B91] mt-1.5">This free domain is permanently linked to your store.</p>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 flex justify-between items-center">
                Custom Domain
                <span className="text-[10px] bg-[#F8F8F8] border border-[#E3E3E4] px-1.5 py-0.5 rounded-sm text-[#8A8B91] font-semibold">PRO</span>
              </label>
              <input
                type="text"
                value={formData.customDomain}
                onChange={e => setFormData(p => ({ ...p, customDomain: e.target.value }))}
                placeholder="www.my-brand.com"
                className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#8A8B91] mt-1.5">If configured, traffic will be routed to this custom domain.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}