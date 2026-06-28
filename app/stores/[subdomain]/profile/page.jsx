"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Globe, MapPin, Save, Loader2, Image as ImageIcon, 
  Briefcase, Phone, UploadCloud, Trash2, X, ZoomIn, Check, Sparkles, Wand2
} from 'lucide-react';
import { storage } from '@/lib/firebaseLib';
import { uploadFileToFirebase, deleteFileFromFirebase } from '@/lib/firebaseLib';

// ============================================================================
// CONFIG
// ============================================================================
const API_ENDPOINTS = {
  store: '/api/stores',
};

const AI_IMAGE_CONFIG = {
  model: process.env.NEXT_PUBLIC_AI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview',
  baseUrl: process.env.NEXT_PUBLIC_AI_IMAGE_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models',
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-none overflow-hidden w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-black">Adjust Image</h3>
            <p className="text-xs text-gray-500 mt-1">Drag to reposition. Output: {reqW}x{reqH}px</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-500 hover:text-black transition-colors rounded-none hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-50 flex-1 flex flex-col items-center justify-center p-8 overflow-hidden touch-none border-b border-gray-200">
          <div
            className="relative bg-white border border-gray-300 overflow-hidden cursor-move"
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
            <ZoomIn size={18} className="text-gray-500" />
            <input
              type="range" min={minScale} max={minScale * 3} step="0.001"
              value={zoom} onChange={handleZoomChange}
              className="flex-1 accent-blue-600"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2.5 rounded-none font-semibold text-sm transition-colors">
              Cancel
            </button>
            <button onClick={generateCroppedImage} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2">
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
      <div className="bg-white border border-gray-200 rounded-none overflow-hidden w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600" size={18} />
            <h3 className="font-bold text-black">AI {type === 'logo' ? 'Logo' : 'Banner'} Generator</h3>
          </div>
          <button onClick={onClose} disabled={isGenerating} className="p-2 text-gray-500 hover:text-black transition-colors rounded-none hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-none text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          <label className="text-sm font-semibold text-black mb-2 block">
            Describe what you want to see:
          </label>
          <textarea
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors resize-none disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Tip: Be as descriptive as possible. Mention colors, style (e.g., minimalist, vibrant, photorealistic), and specific elements.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2.5 rounded-none font-semibold text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
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
// HELPERS
// ============================================================================

async function fetchStoreData() {
  const response = await fetch(API_ENDPOINTS.store, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  });
  if (!response.ok) throw new Error(`Failed to load store (${response.status})`);
  return response.json(); 
}

async function saveStoreData(payload) {
  const response = await fetch(API_ENDPOINTS.store, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Save failed (${response.status})`);
  return response.json(); 
}

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

// Helper to convert base64 data URL to a File object
const dataURLtoFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

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

  // Track pending uploads (files waiting to be uploaded to Firebase)
  const [pendingUploads, setPendingUploads] = useState({ logo: null, banner: null });
  // Track preview URLs for display before save
  const [previewUrls, setPreviewUrls] = useState({ logo: '', banner: '' });
  // Track original Firebase URLs (so we can delete old files on replace)
  const originalUrlsRef = useRef({ logo: '', banner: '' });

  const [formData, setFormData] = useState({
    title: '', description: '', email: '', phone: '', address: '',
    domain: 'my-store.ola.ug', customDomain: '', logo: '', banner: '',
    years: '', staff: '', revenue: '',
  });

  // Load store data
  useEffect(() => {
    fetchStoreData()
      .then(result => {
        if (result.success && result.store) {
          const storeData = storeToFormData(result.store);
          setFormData(storeData);
          // Store original URLs for cleanup
          originalUrlsRef.current = {
            logo: storeData.logo || '',
            banner: storeData.banner || '',
          };
        }
      })
      .catch(err => {
        console.error('Failed to load store profile:', err);
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrls.logo) URL.revokeObjectURL(previewUrls.logo);
      if (previewUrls.banner) URL.revokeObjectURL(previewUrls.banner);
    };
  }, [previewUrls]);

  /**
   * Handle file upload after cropping.
   * For user-uploaded files: uploads immediately to Firebase.
   * For AI-generated images: stores the file for later upload on save.
   */
  const uploadToFirebaseAfterCrop = async (file, field) => {
    setCropConfig(null);
    setIsUploading(prev => ({ ...prev, [field]: true }));
    setImageErrors(prev => ({ ...prev, [field]: '' }));

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update preview for display
      setPreviewUrls(prev => {
        // Revoke old preview URL if exists
        if (prev[field]) URL.revokeObjectURL(prev[field]);
        return { ...prev, [field]: previewUrl };
      });

      // Store the file for upload on save
      setPendingUploads(prev => ({ ...prev, [field]: file }));
      
      // Clear the stored URL in formData (will be set after save)
      setFormData(prev => ({ ...prev, [field]: '' }));
      
    } catch (error) {
      console.error('Upload preparation error:', error);
      setImageErrors(prev => ({ ...prev, [field]: 'Failed to process image. Please try again.' }));
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  /**
   * Upload pending files to Firebase Storage.
   * Returns the permanent URLs.
   */
  const uploadPendingFiles = async () => {
    const urls = { logo: formData.logo, banner: formData.banner };

    // Upload logo if pending
    if (pendingUploads.logo) {
      setIsUploading(prev => ({ ...prev, logo: true }));
      try {
        const downloadURL = await uploadFileToFirebase(pendingUploads.logo, 'stores/logos');
        urls.logo = downloadURL;
      } catch (error) {
        console.error('Logo upload failed:', error);
        throw new Error('Failed to upload logo to storage. Please try again.');
      } finally {
        setIsUploading(prev => ({ ...prev, logo: false }));
      }
    }

    // Upload banner if pending
    if (pendingUploads.banner) {
      setIsUploading(prev => ({ ...prev, banner: true }));
      try {
        const downloadURL = await uploadFileToFirebase(pendingUploads.banner, 'stores/banners');
        urls.banner = downloadURL;
      } catch (error) {
        console.error('Banner upload failed:', error);
        throw new Error('Failed to upload banner to storage. Please try again.');
      } finally {
        setIsUploading(prev => ({ ...prev, banner: false }));
      }
    }

    return urls;
  };

  /**
   * Delete old Firebase files when they've been replaced.
   */
  const cleanupOldFiles = async (newLogoUrl, newBannerUrl) => {
    const cleanupPromises = [];

    if (originalUrlsRef.current.logo && newLogoUrl !== originalUrlsRef.current.logo) {
      cleanupPromises.push(
        deleteFileFromFirebase(originalUrlsRef.current.logo).catch(err => 
          console.warn('Failed to delete old logo:', err)
        )
      );
    }

    if (originalUrlsRef.current.banner && newBannerUrl !== originalUrlsRef.current.banner) {
      cleanupPromises.push(
        deleteFileFromFirebase(originalUrlsRef.current.banner).catch(err => 
          console.warn('Failed to delete old banner:', err)
        )
      );
    }

    await Promise.allSettled(cleanupPromises);
  };

  /**
   * Main save handler.
   * 1. Upload pending files to Firebase
   * 2. Save URLs to database
   * 3. Clean up old files
   */
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Step 1: Upload any pending files to Firebase
      const uploadedUrls = await uploadPendingFiles();

      // Step 2: Update form data with the new URLs
      const updatedFormData = {
        ...formData,
        logo: uploadedUrls.logo || formData.logo,
        banner: uploadedUrls.banner || formData.banner,
      };

      // Step 3: Save to database
      const result = await saveStoreData(formDataToPayload(updatedFormData));

      if (result.success) {
        // Step 4: Clean up old files from Firebase
        await cleanupOldFiles(uploadedUrls.logo, uploadedUrls.banner);

        // Update local state with new URLs
        setFormData(updatedFormData);
        
        // Update original URLs reference
        originalUrlsRef.current = {
          logo: uploadedUrls.logo || formData.logo,
          banner: uploadedUrls.banner || formData.banner,
        };

        // Clear pending uploads and preview URLs
        if (previewUrls.logo) URL.revokeObjectURL(previewUrls.logo);
        if (previewUrls.banner) URL.revokeObjectURL(previewUrls.banner);
        setPendingUploads({ logo: null, banner: null });
        setPreviewUrls({ logo: '', banner: '' });

        setMessage({ type: 'success', text: 'Store profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update store.' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: err.message || 'A network error occurred.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  /**
   * Remove an image (clear from preview, pending, and form data).
   */
  const handleRemoveImage = (field) => {
    // Revoke preview URL
    if (previewUrls[field]) {
      URL.revokeObjectURL(previewUrls[field]);
    }
    
    setPreviewUrls(prev => ({ ...prev, [field]: '' }));
    setPendingUploads(prev => ({ ...prev, [field]: null }));
    setFormData(prev => ({ ...prev, [field]: '' }));
    setImageErrors(prev => ({ ...prev, [field]: '' }));
  };

  const readAndOpenCropper = (file, field, requiredW, requiredH) => {
    setImageErrors(prev => ({ ...prev, [field]: '' }));
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setImageErrors(prev => ({ ...prev, [field]: 'Please upload a valid image file.' }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageErrors(prev => ({ ...prev, [field]: 'File too large. Maximum 5MB allowed.' }));
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
    // Convert data URL to File object
    const file = dataURLtoFile(imageUrl, `${field}_ai_generated.png`);
    setCropConfig({ src: imageUrl, field, reqW, reqH });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  // Determine what to display for each image field
  const getDisplayUrl = (field) => {
    // Show preview URL first (recent upload)
    if (previewUrls[field]) return previewUrls[field];
    // Then show the saved Firebase URL
    if (formData[field]) return formData[field];
    return '';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8">

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Store Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage details, AI media, and web domains.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isUploading.logo || isUploading.banner}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-none border text-sm font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-red-50 border-red-200 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6 w-full">

        <div className="bg-white border border-gray-200 p-6 w-full">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
            <Store size={18} />
            <h2 className="text-base font-bold">General Information</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">Store Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Acme Electronics"
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">About the Store (Bio)</label>
                <textarea
                  rows="5"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your business, what you sell, your target audience, and your brand vibe..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">Used by our AI to generate matching branding and descriptions.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 block">
                  <Briefcase size={14} className="text-gray-500" /> Years in Business
                </label>
                <input
                  type="number"
                  value={formData.years}
                  onChange={e => setFormData(p => ({ ...p, years: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Staff Size</label>
                <select
                  value={formData.staff}
                  onChange={e => setFormData(p => ({ ...p, staff: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors appearance-none"
                >
                  <option value="">Select size</option>
                  <option value="1-5">1–5 Employees</option>
                  <option value="5-20">5–20 Employees</option>
                  <option value="20+">20+ Employees</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Annual Revenue</label>
                <select
                  value={formData.revenue}
                  onChange={e => setFormData(p => ({ ...p, revenue: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors appearance-none"
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

        <div className="bg-white border border-gray-200 p-6 w-full" id="media">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
            <ImageIcon size={18} />
            <h2 className="text-base font-bold">Store Branding & Media</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Logo Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold">Store Logo</h3>
                  <p className="text-xs text-gray-500 mt-1">Displayed on your profile and products.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiModalConfig({ type: 'logo', reqW: 512, reqH: 512 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-none text-xs font-semibold transition-colors"
                  >
                    <Sparkles size={12} /> Generate
                  </button>
                  <span className="text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50 px-2 py-1 rounded-none">512×512</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <label
                  className={`relative flex flex-col items-center justify-center w-28 h-28 shrink-0 rounded-none border border-dashed cursor-pointer transition-all overflow-hidden group ${
                    dragActive.logo ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                  } ${imageErrors.logo ? 'bg-red-50 border-red-300' : ''}`}
                  onDragEnter={(e) => handleDrag(e, 'logo')}
                  onDragLeave={(e)  => handleDrag(e, 'logo')}
                  onDragOver={(e)   => handleDrag(e, 'logo')}
                  onDrop={(e)       => handleDrop(e, 'logo', 512, 512)}
                >
                  {isUploading.logo ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : getDisplayUrl('logo') ? (
                    <div className="relative w-full h-full">
                      <img src={getDisplayUrl('logo')} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <UploadCloud size={16} className="text-white" />
                        <button 
                          type="button" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation();
                            handleRemoveImage('logo'); 
                          }} 
                          className="text-white hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <UploadCloud size={20} className={`mb-1 ${dragActive.logo ? 'text-blue-600' : 'text-gray-500'}`} />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upload</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => readAndOpenCropper(e.target.files[0], 'logo', 512, 512)} 
                    disabled={isUploading.logo} 
                  />
                </label>

                <div className="flex-1 text-center sm:text-left">
                  {imageErrors.logo && <p className="text-xs text-red-500 font-semibold mb-2">⚠️ {imageErrors.logo}</p>}
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Drag and drop your existing logo, or use our AI Generator to create a beautiful new one based on your store description. Keep the design simple and recognizable.
                  </p>
                </div>
              </div>
            </div>

            {/* Banner Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold">Store Banner</h3>
                  <p className="text-xs text-gray-500 mt-1">The hero image displayed at the top of your storefront.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiModalConfig({ type: 'banner', reqW: 1200, reqH: 400 })}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-none text-xs font-semibold transition-colors"
                  >
                    <Sparkles size={12} /> Generate
                  </button>
                  <span className="text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50 px-2 py-1 rounded-none">1200×400</span>
                </div>
              </div>

              <label
                className={`relative flex flex-col items-center justify-center w-full h-36 rounded-none border border-dashed cursor-pointer transition-all overflow-hidden group ${
                  dragActive.banner ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                } ${imageErrors.banner ? 'bg-red-50 border-red-300' : ''}`}
                onDragEnter={(e) => handleDrag(e, 'banner')}
                onDragLeave={(e)  => handleDrag(e, 'banner')}
                onDragOver={(e)   => handleDrag(e, 'banner')}
                onDrop={(e)       => handleDrop(e, 'banner', 1200, 400)}
              >
                {isUploading.banner ? (
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <Loader2 size={24} className="mb-3 animate-spin" />
                    <p className="text-xs font-semibold uppercase tracking-wider">Uploading...</p>
                  </div>
                ) : getDisplayUrl('banner') ? (
                  <div className="relative w-full h-full">
                    <img src={getDisplayUrl('banner')} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <div className="text-white text-xs font-semibold flex items-center gap-2 bg-black/40 border border-white/20 px-4 py-2 rounded-none">
                        <UploadCloud size={14} /> Replace
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation();
                          handleRemoveImage('banner'); 
                        }}
                        className="text-white bg-red-500 hover:bg-red-600 border border-red-500 px-4 py-2 rounded-none text-xs font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <ImageIcon size={24} className={`mb-2 transition-colors ${dragActive.banner ? 'text-blue-600' : 'text-gray-500'}`} />
                    <p className="text-xs font-semibold mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">Upload a cover photo or use the AI generator.</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => readAndOpenCropper(e.target.files[0], 'banner', 1200, 400)} 
                  disabled={isUploading.banner} 
                />
              </label>
              {imageErrors.banner && <p className="text-xs text-red-500 mt-2 font-semibold">{imageErrors.banner}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 w-full" id="location">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
            <MapPin size={18} />
            <h2 className="text-base font-bold">Contact & Location</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">Support Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-1.5 block">
                  <Phone size={14} className="text-gray-500" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Physical Business Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="e.g. 123 Kampala Road, Kampala, Uganda"
                className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Displayed on order invoices and contact pages.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 w-full">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
            <Globe size={18} />
            <h2 className="text-base font-bold">Web Addresses</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <label className="text-sm font-semibold mb-2 block">Default Subdomain</label>
              <div className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-gray-500 font-medium flex items-center cursor-not-allowed">
                {formData.domain}
              </div>
              <p className="text-xs text-gray-500 mt-2">This free domain is permanently linked to your store.</p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 flex justify-between items-center">
                Custom Domain
                <span className="text-xs bg-gray-50 border border-gray-300 px-1.5 py-0.5 rounded-none text-gray-500 font-semibold">PRO</span>
              </label>
              <input
                type="text"
                value={formData.customDomain}
                onChange={e => setFormData(p => ({ ...p, customDomain: e.target.value }))}
                placeholder="www.my-brand.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">If configured, traffic will be routed to this custom domain.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}