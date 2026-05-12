"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Globe, MapPin, Save, Loader2, Image as ImageIcon, 
  Briefcase, Phone, UploadCloud, Trash2, X, ZoomIn, Check
} from 'lucide-react';

// Mocking Firebase Auth and Storage for the sandbox preview so the app compiles.
// Make sure to swap these back to your actual imports when moving to your project:
// import { signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
// import { auth, uploadFileToFirebase } from '@/lib/firebaseLib';

const auth = { currentUser: { uid: 'mock-user-id' } };
const signInWithCustomToken = async () => ({ user: auth.currentUser });
const signInAnonymously = async () => ({ user: auth.currentUser });
const onAuthStateChanged = (authObj, cb) => {
  cb(authObj.currentUser);
  return () => {};
};
const uploadFileToFirebase = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(URL.createObjectURL(file));
    }, 1500);
  });
};

// ============================================================================
// CUSTOM IMAGE CROPPER MODAL
// A self-contained, high-performance canvas-based cropper.
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

  // Load image and calculate initial optimal scale to cover the crop area
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const aspect = reqW / reqH;
      const MAX_WIDTH = 500;
      let bW = MAX_WIDTH; 
      let bH = MAX_WIDTH / aspect;
      
      // Constrain height if it gets too tall (e.g. for logos)
      if (bH > 400) { 
        bH = 400; 
        bW = 400 * aspect; 
      }

      const minS = Math.max(bW / img.width, bH / img.height);
      
      setNatSize({ w: img.width, h: img.height });
      setMinScale(minS);
      setZoom(minS);
      
      // Center the image initially
      setPos({
        x: (bW - img.width * minS) / 2,
        y: (bH - img.height * minS) / 2
      });
      
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

    // Constrain to edges
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
    
    // Zoom relative to center of the crop box
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

    // Calculate source coordinates mapping from UI to original image pixels
    const sx = -pos.x / zoom;
    const sy = -pos.y / zoom;
    const sW = boxSize.w / zoom;
    const sH = boxSize.h / zoom;

    ctx.drawImage(imgObj, sx, sy, sW, sH, 0, 0, reqW, reqH);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped_image.png', { type: 'image/png' });
        onCropComplete(file);
      }
    }, 'image/png', 1);
  };

  if (!imgObj) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden w-full max-w-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E3E4]">
          <div>
            <h3 className="font-bold text-[#161823]">Crop Image</h3>
            <p className="text-[12px] text-[#8A8B91] mt-0.5">Drag to reposition. Output: {reqW}x{reqH}px</p>
          </div>
          <button onClick={onCancel} className="p-2 text-[#8A8B91] hover:text-[#161823] transition-colors rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Workspace */}
        <div className="bg-[#F8F8F8] flex-1 flex flex-col items-center justify-center p-8 overflow-hidden touch-none">
          <div 
            className="relative bg-white shadow-sm overflow-hidden ring-1 ring-black/5 cursor-move"
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
              style={{
                width: natSize.w * zoom,
                height: natSize.h * zoom,
                left: pos.x,
                top: pos.y,
              }}
            />
            {/* Grid overlay for better UX */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-black/10">
              <div className="border-r border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-r border-b border-black/10"></div>
              <div className="border-b border-black/10"></div>
              <div className="border-r border-black/10"></div>
              <div className="border-r border-black/10"></div>
              <div></div>
            </div>
          </div>
        </div>

        {/* Controls & Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E3E3E4]">
          <div className="flex items-center gap-4 mb-6 px-4">
            <ZoomIn size={18} className="text-[#8A8B91]" />
            <input 
              type="range" 
              min={minScale} 
              max={minScale * 3} 
              step="0.001" 
              value={zoom} 
              onChange={handleZoomChange}
              className="flex-1 accent-[#FE2C55]"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-5 py-2 text-[13px] font-semibold text-[#161823] hover:bg-gray-100 rounded-sm transition-colors">
              Cancel
            </button>
            <button onClick={generateCroppedImage} className="px-5 py-2 text-[13px] font-semibold text-white bg-[#FE2C55] hover:bg-[#e0264b] rounded-sm transition-colors flex items-center gap-2">
              <Check size={16} /> Confirm & Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN STORE PROFILE COMPONENT
// ============================================================================
export default function StoreProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [userAuth, setUserAuth] = useState(null);
  const [dragActive, setDragActive] = useState({ logo: false, banner: false });
  const [isUploading, setIsUploading] = useState({ logo: false, banner: false });
  const [imageErrors, setImageErrors] = useState({ logo: '', banner: '' });

  // Cropper State
  const [cropConfig, setCropConfig] = useState(null); // { src, field, reqW, reqH }

  const [formData, setFormData] = useState({
    title: '', description: '', email: '', phone: '', address: '', 
    domain: '', customDomain: '', logo: '', banner: '', years: '', staff: '', revenue: '',
  });

  // 1. Initialize Firebase Auth
  useEffect(() => {
    if (!auth) return;
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase auth failed:", err);
      }
    };
    
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUserAuth);
    return () => unsubscribe();
  }, []);

  // 2. Fetch Existing Store Data
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch('/api/seller/store', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await response.json();
        
        if (result.success && result.store) {
          const s = result.store;
          setFormData({
            title: s.title || '',
            description: s.description || '',
            email: s.contact?.email || '',
            phone: s.contact?.phone || '',
            address: s.location?.address || '',
            domain: s.domain || '',
            customDomain: !s.domain?.includes('.ola.ug') ? s.domain : '', 
            logo: s.logo || '', 
            banner: s.banner || '',
            years: s.years || '',
            staff: s.staff || '',
            revenue: s.revenue || '',
          });
        }
      } catch (error) {
        console.error("Failed to load store profile", error);
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStore();
  }, []);

  const uploadToFirebaseAfterCrop = async (file, field) => {
    setCropConfig(null); // Close modal
    
    if (!auth || !userAuth) {
      setImageErrors(prev => ({ ...prev, [field]: 'Storage connection or authentication failed.' }));
      return;
    }
    
    setIsUploading(prev => ({ ...prev, [field]: true }));
    try {
      const downloadURL = await uploadFileToFirebase(file, field, userAuth);
      setFormData(prev => ({ ...prev, [field]: downloadURL }));
      setImageErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      console.error("Upload error:", error);
      setImageErrors(prev => ({ ...prev, [field]: 'Failed to upload image.' }));
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const readAndOpenCropper = (file, field, requiredW, requiredH) => {
    setImageErrors(prev => ({ ...prev, [field]: '' }));
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageErrors(prev => ({ ...prev, [field]: 'Please upload a valid image file.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Instead of checking dimensions strictly, we open the cropper!
      setCropConfig({
        src: e.target.result,
        field: field,
        reqW: requiredW,
        reqH: requiredH
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [field]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleDrop = (e, field, reqW, reqH) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [field]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readAndOpenCropper(e.dataTransfer.files[0], field, reqW, reqH);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      title: formData.title,
      description: formData.description,
      domain: formData.customDomain || formData.domain,
      logo: formData.logo,
      banner: formData.banner,
      years: formData.years,
      staff: formData.staff,
      revenue: formData.revenue,
      contact: {
        email: formData.email,
        phone: formData.phone
      },
      location: {
        address: formData.address
      }
    };

    try {
      const response = await fetch('/api/seller/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Store profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update store.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'A network error occurred.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#161823]" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto p-6 pb-10">
      
      {/* CROPPER MODAL RENDER */}
      {cropConfig && (
        <ImageCropperModal
          imageSrc={cropConfig.src}
          reqW={cropConfig.reqW}
          reqH={cropConfig.reqH}
          onCancel={() => setCropConfig(null)}
          onCropComplete={(file) => uploadToFirebaseAfterCrop(file, cropConfig.field)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Store Profile</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage your storefront details, media, and web domains.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || isUploading.logo || isUploading.banner}
          className="bg-[#FE2C55] hover:bg-[#e0264b] text-white px-6 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        
        {/* SECTION 1: General Details */}
        <section className="bg-white border border-[#E3E3E4] rounded-sm p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <Store size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">General Information</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Store Name</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">About the Store (Bio)</label>
              <textarea 
                rows="3"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Tell customers what you sell..."
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 flex items-center gap-1.5 block"><Briefcase size={14}/> Years in Business</label>
                <input 
                  type="number" 
                  value={formData.years}
                  onChange={e => setFormData({...formData, years: e.target.value})}
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Staff Size</label>
                <select 
                  value={formData.staff}
                  onChange={e => setFormData({...formData, staff: e.target.value})}
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]"
                >
                  <option value="">Select size</option>
                  <option value="1-5">1-5 Employees</option>
                  <option value="5-20">5-20 Employees</option>
                  <option value="20+">20+ Employees</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Annual Revenue</label>
                <select 
                  value={formData.revenue}
                  onChange={e => setFormData({...formData, revenue: e.target.value})}
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]"
                >
                  <option value="">Select bracket</option>
                  <option value="Under $50k">Under $50k</option>
                  <option value="$50k - $250k">$50k - $250k</option>
                  <option value="$250k+">$250k+</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Media */}
        <section className="bg-white border border-[#E3E3E4] rounded-sm p-6" id="media">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <ImageIcon size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">Store Media</h2>
          </div>
          
          <div className="space-y-8">
            
            {/* Logo Upload */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] font-semibold text-[#161823]">Store Logo</label>
                <span className="text-[11px] font-semibold text-[#8A8B91] bg-[#F8F8F8] px-2 py-0.5 rounded-sm border border-[#E3E3E4]">Output: 512x512px</span>
              </div>
              <div className="flex items-center gap-6">
                <label 
                  className={`relative flex flex-col items-center justify-center w-32 h-32 shrink-0 border-2 border-dashed rounded-sm cursor-pointer transition-colors overflow-hidden group ${
                    dragActive.logo ? 'border-[#161823] bg-[#F8F8F8]' : 'border-[#E3E3E4] hover:border-[#8A8B91] bg-white'
                  } ${imageErrors.logo ? 'border-[#FE2C55] bg-[#FEE2E2]/30' : ''}`}
                  onDragEnter={(e) => handleDrag(e, 'logo')}
                  onDragLeave={(e) => handleDrag(e, 'logo')}
                  onDragOver={(e) => handleDrag(e, 'logo')}
                  onDrop={(e) => handleDrop(e, 'logo', 512, 512)}
                >
                  {isUploading.logo ? (
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <Loader2 size={24} className="mb-2 text-[#161823] animate-spin" />
                      <p className="text-[11px] font-semibold text-[#161823] leading-tight">Uploading...</p>
                    </div>
                  ) : formData.logo ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-[#F8F8F8]">
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <UploadCloud size={20} className="text-white" />
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setFormData({...formData, logo: ''}); }}
                          className="text-[#FE2C55] hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3">
                      <UploadCloud size={24} className={`mb-2 ${dragActive.logo ? 'text-[#161823]' : 'text-[#8A8B91]'}`} />
                      <p className="text-[11px] font-semibold text-[#161823] leading-tight">Upload Logo</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => readAndOpenCropper(e.target.files[0], 'logo', 512, 512)} disabled={isUploading.logo} />
                </label>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-[#161823] mb-1">Square Logo</p>
                  <p className="text-[11px] text-[#8A8B91] leading-relaxed max-w-sm mb-2">
                    Upload any image. You will be able to crop it to the perfect 1:1 square ratio.
                  </p>
                  {imageErrors.logo && <p className="text-[11px] text-[#FE2C55] font-semibold flex items-start gap-1.5 mt-1">⚠️ {imageErrors.logo}</p>}
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-semibold text-[#161823]">Store Banner</label>
                <span className="text-[11px] font-semibold text-[#8A8B91] bg-[#F8F8F8] px-2 py-0.5 rounded-sm border border-[#E3E3E4]">Output: 1200x400px</span>
              </div>
              <label 
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-sm cursor-pointer transition-colors overflow-hidden group ${
                  dragActive.banner ? 'border-[#161823] bg-[#F8F8F8]' : 'border-[#E3E3E4] hover:border-[#8A8B91] bg-white'
                } ${imageErrors.banner ? 'border-[#FE2C55] bg-[#FEE2E2]/30' : ''}`}
                onDragEnter={(e) => handleDrag(e, 'banner')}
                onDragLeave={(e) => handleDrag(e, 'banner')}
                onDragOver={(e) => handleDrag(e, 'banner')}
                onDrop={(e) => handleDrop(e, 'banner', 1200, 400)}
              >
                {isUploading.banner ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center px-4">
                    <Loader2 size={32} className="mb-3 text-[#161823] animate-spin" />
                    <p className="text-[13px] font-semibold text-[#161823] mb-1">Uploading Image to Cloud...</p>
                  </div>
                ) : formData.banner ? (
                  <div className="relative w-full h-full">
                    <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <div className="text-white text-[12px] font-semibold flex items-center gap-1.5"><UploadCloud size={16}/> Replace</div>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); setFormData({...formData, banner: ''}); }}
                        className="text-[#FE2C55] bg-white px-2 py-1.5 rounded-sm text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#FEE2E2] transition-colors"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center px-4">
                    <ImageIcon size={32} className={`mb-3 transition-colors ${dragActive.banner ? 'text-[#161823]' : 'text-[#8A8B91]'}`} />
                    <p className="text-[13px] font-semibold text-[#161823] mb-1">Click to upload or drag and drop</p>
                    <p className="text-[11px] text-[#8A8B91]">Upload any image and crop it perfectly for your storefront banner.</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => readAndOpenCropper(e.target.files[0], 'banner', 1200, 400)} disabled={isUploading.banner} />
              </label>
              {imageErrors.banner && <p className="text-[11px] text-[#FE2C55] mt-1.5 font-semibold">{imageErrors.banner}</p>}
            </div>
          </div>
        </section>

        {/* SECTION 3: Contact & Location */}
        <section className="bg-white border border-[#E3E3E4] rounded-sm p-6" id="location">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <MapPin size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">Contact & Location</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Support Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]"
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 flex items-center gap-1.5 block"><Phone size={14}/> Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]"
              />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Physical Business Address</label>
            <input 
              type="text" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="e.g. 123 Kampala Road, Kampala, Uganda"
              className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]"
            />
          </div>
        </section>

        {/* SECTION 4: Domains */}
        <section className="bg-white border border-[#E3E3E4] rounded-sm p-6">
          <div className="flex items-center gap-2 mb-5 border-b border-[#E3E3E4] pb-3">
            <Globe size={18} className="text-[#161823]" />
            <h2 className="text-base font-bold text-[#161823]">Web Addresses</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block">Ola Subdomain (Default)</label>
              <div className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[13px] text-[#8A8B91] font-medium flex items-center cursor-not-allowed">
                {formData.domain.includes('.ola.ug') ? formData.domain : 'Not configured'}
              </div>
              <p className="text-[11px] text-[#8A8B91] mt-1.5">This free domain is permanently linked to your store.</p>
            </div>
            
            <div>
              <label className="text-[13px] font-semibold text-[#161823] mb-1.5 block text-[#FE2C55]">Custom Domain (Pro)</label>
              <input 
                type="text" 
                value={formData.customDomain}
                onChange={e => setFormData({...formData, customDomain: e.target.value})}
                placeholder="www.my-brand.com"
                className="w-full bg-white border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#FE2C55] focus:ring-1 focus:ring-[#FE2C55]/20 transition-colors outline-none"
              />
              <p className="text-[11px] text-[#8A8B91] mt-1.5">If configured, traffic will be routed to this custom domain.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}