"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Save, UploadCloud, Loader2, Trash2, ChevronDown, 
  ChevronRight, Plus, Image as ImageIcon, Sparkles, Wand2, 
  AlertCircle, Volume2, Palette, Ruler, Box, ListChecks
} from 'lucide-react';

// --- MOCKS FOR STANDALONE RUNNABILITY ---
const useRouter = () => ({ push: (path) => console.log('Routing to:', path) });
const useSearchParams = () => ({ get: () => new URLSearchParams(window.location.search).get('id') });
const Link = ({ children, href, className }) => <a href={href} className={className}>{children}</a>;
const uploadFileToFirebase = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};
// ----------------------------------------

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // --- STANDARD STATES ---
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editId);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState('');
  
  // Dynamic Category States (Fetched from DB)
  const [dbCategories, setDbCategories] = useState([]);
  const [showCategoryCascader, setShowCategoryCascader] = useState(false);
  const [activeParentId, setActiveParentId] = useState(null);
  const cascaderRef = useRef(null);

  // Variant States
  const [hasVariants, setHasVariants] = useState(false);
  const [variantType, setVariantType] = useState('Color'); 
  const [variantsHaveDifferentPrices, setVariantsHaveDifferentPrices] = useState(false);
  const [variants, setVariants] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    comparePrice: '',
    moq: '1',
    sku: '',
    stock: '',
    category: '', 
    tags: '',
    status: 'Active',
    isFlashItem: false,
    discountPercentage: '',
    specifications: [] // Added Specifications Array
  });

  // --- AI STATES ---
  const [aiMode, setAiMode] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [showAiPrompts, setShowAiPrompts] = useState(false);
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  // The requested models
  const MODEL_ID = "gemini-2.5-flash";
  const TTS_MODEL_ID = "gemini-3.1-flash-lite";
  const IMAGE_MODEL_ID = "gemini-3-pro-image-preview";

  // --- DATA FETCHING ---

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await response.json();
        if (result.success && result.data) {
          setDbCategories(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editId) {
      const fetchEditData = async () => {
        try {
          const response = await fetch('/api/products?owner=true&limit=1000', {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          const result = await response.json();
          if (result.success && result.data?.products) {
            const product = result.data.products.find(p => p._id === editId);
            if (product) {
              setFormData({
                title: product.title || '',
                description: product.description || '',
                price: product.price || '',
                comparePrice: product.comparePrice || '',
                moq: product.moq || '1',
                sku: product.sku || '',
                stock: product.stock || '0',
                category: product.categoryRef?._id || product.categoryRef || '',
                status: product.status || 'Active',
                isFlashItem: product.isFlashItem || false,
                discountPercentage: product.discountPercentage || '',
                specifications: product.specifications || []
              });
              setImages(product.images?.length > 0 ? product.images : (product.image ? [product.image] : []));
              setHasVariants(product.hasVariants || false);
              setVariantsHaveDifferentPrices(product.variantsHaveDifferentPrices || false);
              setVariants(product.variants?.map((v, i) => ({ 
                ...v, 
                id: v._id || String(i), 
                isUploading: false 
              })) || []);
            }
          }
        } catch (error) {
          console.error("Failed to load product data:", error);
          setErrorMessage("Failed to load existing product data.");
        } finally {
          setIsLoadingEdit(false);
        }
      };
      fetchEditData();
    }
  }, [editId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cascaderRef.current && !cascaderRef.current.contains(e.target)) {
        setShowCategoryCascader(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- SPECIFICATION HANDLERS ---
  const addSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (index, field, val) => {
    setFormData(prev => {
      const newSpecs = [...prev.specifications];
      newSpecs[index][field] = val;
      return { ...prev, specifications: newSpecs };
    });
  };

  // --- AI HELPER FUNCTIONS ---

  const fetchWithRetry = async (url, options, retries = 5) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        if (i === retries) throw new Error(`API Error: ${response.status}`);
      } catch (err) {
        if (i === retries) throw err;
      }
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
    if (url.startsWith('data:image')) return url.split(',')[1];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await fileToBase64(blob);
    } catch (e) {
      console.error("Failed to extract base64:", e);
      return null;
    }
  };

  // 1. Multimodal Analysis + Category Selection + Specs + Details
  const generateDetailsFromImage = async (file) => {
    if (!aiMode) return;
    setIsAiProcessing(true);
    setAiStatus('AI is analyzing the product listing...');
    
    try {
      const base64Data = await fileToBase64(file);
      const categoryContext = dbCategories.length > 0 
        ? `From this list: [${dbCategories.map(c => `[ID: ${c._id}] ${c.name}`).join(', ')}], select exactly one Category ID. Prefer specific subcategories.`
        : `Return an empty string for category_id.`;
      
      const prompt = `Analyze this product image and provide:
      1. A professional e-commerce title.
      2. A 2-paragraph description.
      3. 5 comma-separated keywords for tags.
      4. ${categoryContext}
      5. Suggest 3 to 5 technical product specifications as key-value pairs (e.g., {"key": "Brand", "value": "Nike"}, or {"key": "Material", "value": "Leather"}).
      
      IMPORTANT: Return ONLY a raw, valid JSON object. Do not include markdown formatting, backticks, or the word 'json'.`;
      
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: file.type, data: base64Data } }
              ]
            }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  description: { type: "STRING" },
                  tags: { type: "STRING" },
                  category_id: { type: "STRING" },
                  specifications: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        key: { type: "STRING" },
                        value: { type: "STRING" }
                      }
                    }
                  }
                }
              }
            }
          })
        }
      );

      // Clean up markdown formatting just in case the AI includes it despite the schema rules
      let responseText = result.candidates[0].content.parts[0].text;
      responseText = responseText.replace(/```json\n?/gi, '').replace(/\n?```/gi, '').trim();
      
      const aiData = JSON.parse(responseText);
      
      setFormData(prev => ({
        ...prev,
        title: aiData.title || prev.title || '',
        description: aiData.description || prev.description || '',
        tags: aiData.tags || prev.tags || '',
        category: aiData.category_id || prev.category,
        specifications: aiData.specifications?.length > 0 ? aiData.specifications : prev.specifications
      }));

      if (aiData.category_id && dbCategories.length > 0) {
        const selectedCat = dbCategories.find(c => c._id === aiData.category_id);
        if (selectedCat?.parentRef) setActiveParentId(selectedCat.parentRef);
        else if (selectedCat) setActiveParentId(selectedCat._id);
      }

      setShowAiPrompts(true);
    } catch (error) {
      console.error("AI Multimodal Analysis Failed:", error);
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  // On-demand Variant Image Generation
  const generateVariantImageAI = async (index) => {
    if (images.length === 0 || !variants[index].name) {
      alert("Please upload a primary image and name the variant first.");
      return;
    }

    setIsAiProcessing(true);
    setAiStatus(`Generating ${variantType} image for "${variants[index].name}"...`);
    
    try {
      const originalBase64 = await extractBase64FromUrl(images[0]);
      const variantName = variants[index].name;
      
      const prompt = `Reference the product in the provided image. Generate a new high-quality photo of the EXACT same product, but modify it to be the ${variantType}: "${variantName}". Do not change the overall design, only the specified attribute.`;
      
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: originalBase64 } }
              ]
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
          })
        }
      );

      const generatedBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedBase64) {
        const newVariants = [...variants];
        newVariants[index].image = `data:image/png;base64,${generatedBase64}`;
        setVariants(newVariants);
      }
    } catch (error) {
      console.error("Variant Image Generation Failed:", error);
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  // 2. Variant Suggestions
  const suggestVariantsAI = async () => {
    setIsAiProcessing(true);
    setAiStatus(`AI is suggesting logical ${variantType} options...`);
    try {
      const prompt = `Based on the product "${formData.title}", suggest 3 logical "${variantType}" options (e.g. specific colors or materials). Return ONLY a raw JSON array of strings.`;
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: { type: "ARRAY", items: { type: "STRING" } }
            }
          })
        }
      );
      
      let responseText = result.candidates[0].content.parts[0].text;
      responseText = responseText.replace(/```json\n?/gi, '').replace(/\n?```/gi, '').trim();
      const suggested = JSON.parse(responseText);
      
      if (Array.isArray(suggested)) {
        setHasVariants(true);
        setVariants(suggested.map((name, i) => ({
          id: Date.now().toString() + i,
          name, price: '', stock: '10', image: '', isUploading: false
        })));
      }
    } catch (error) {
      console.error("Variant Suggestion Failed:", error);
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  // 3. Text-to-Speech Preview
  const playTTS = async (text) => {
    if (!text) return;
    setIsAiProcessing(true);
    setAiStatus('Generating audio preview...');
    try {
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Say enthusiastically: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
            }
          })
        }
      );
      const audioData = result.candidates[0].content.parts[0].inlineData.data;
      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const sampleRate = 24000;
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
      const writeString = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
      writeString(0, 'RIFF'); view.setUint32(4, 36 + bytes.length, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data');
      view.setUint32(40, bytes.length, true);
      
      const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
      new Audio(URL.createObjectURL(blob)).play();
    } catch (error) { console.error(error); } 
    finally { setIsAiProcessing(false); setAiStatus(''); }
  };

  // --- SAVING ---
  const handleSave = async () => {
    setErrorMessage('');
    if (!formData.title.trim() || !formData.price) {
      setErrorMessage('Title and Price are required.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        categoryRef: formData.category, 
        images,
        image: images[0] || '',
        hasVariants,
        variantsHaveDifferentPrices,
        variants: hasVariants ? variants.map(({ id, isUploading, _id, ...rest }) => ({
          name: rest.name, stock: Number(rest.stock) || 0, image: rest.image || '', price: variantsHaveDifferentPrices ? rest.price : ''
        })) : []
      };
      const response = await fetch('/api/products', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) router.push('/seller/products');
      else setErrorMessage(result.message || 'Save failed.');
    } catch (error) { setErrorMessage('Network error.'); } 
    finally { setIsSaving(false); }
  };

  const processImageFile = async (file) => {
    setImageError('');
    if (!file?.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const url = await uploadFileToFirebase(file);
      const isFirst = images.length === 0;
      setImages(prev => [...prev, url]);
      if (aiMode && isFirst) generateDetailsFromImage(file);
    } catch (err) { setImageError("Upload failed."); } 
    finally { setIsUploading(false); }
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

  const handleVariantImageUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVariants(variants.map(v => v.id === id ? { ...v, isUploading: true } : v));
    try {
      const downloadURL = await uploadFileToFirebase(file);
      setVariants(variants.map(v => v.id === id ? { ...v, image: downloadURL, isUploading: false } : v));
    } catch (error) {
      console.error(error);
      setVariants(variants.map(v => v.id === id ? { ...v, isUploading: false } : v));
    }
  };

  if (isLoadingEdit) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-red-500" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#F8F8F8] pt-2 pb-4 border-b border-[#E3E3E4] mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/seller/products" className="p-1.5 border border-[#E3E3E4] bg-white rounded-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-[#161823] tracking-tight">{editId ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-sm border border-[#E3E3E4]">
            <Sparkles size={16} className={aiMode ? "text-[#7C3AED]" : "text-[#8A8B91]"} />
            <span className="text-[13px] font-semibold">AI Copilot</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(!aiMode)} />
              <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#7C3AED] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-[#FE2C55] rounded-sm text-[13px] font-semibold text-white hover:bg-[#e0264b] transition-colors">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-sm text-[13px] font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {isAiProcessing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-sm flex flex-col items-center max-w-sm text-center shadow-xl border">
            <Sparkles size={32} className="text-[#7C3AED] animate-pulse mb-4" />
            <h3 className="font-bold text-[15px]">{aiStatus}</h3>
            <p className="text-[12px] text-gray-500">Processing with {MODEL_ID}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[65%] space-y-6">
          
          {/* Media */}
          <div className={`bg-white border rounded-sm p-5 md:p-6 ${aiMode ? 'border-[#7C3AED]/50' : 'border-[#E3E3E4]'}`}>
            <h2 className="text-[15px] font-bold mb-4">Product Media</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="aspect-square border border-dashed border-[#E3E3E4] rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#7C3AED] transition-colors">
                <UploadCloud size={24} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />
                <span className="text-[11px] font-semibold mt-1">Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => processImageFile(e.target.files[0])} />
              </label>
              {images.map((img, idx) => (
                <div key={idx} className="aspect-square border border-[#E3E3E4] rounded-sm relative group overflow-hidden">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            {showAiPrompts && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-sm flex items-center justify-between animate-in slide-in-from-top-2">
                <p className="text-[12px] font-bold text-purple-900">AI mapped your product! Specifications & details generated.</p>
                <button onClick={() => setShowAiPrompts(false)} className="text-[11px] text-purple-400 hover:text-purple-600 font-bold">Dismiss</button>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5">Product Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]" placeholder="e.g. Vintage Leather Jacket" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[13px] font-semibold">Description</label>
                  {aiMode && formData.description && <button onClick={() => playTTS(formData.description)} className="text-[#7C3AED] text-[11px] font-bold flex items-center gap-1 hover:underline"><Volume2 size={12}/> Listen</button>}
                </div>
                <textarea rows="6" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none resize-none focus:border-[#161823]" placeholder="Describe the item..." />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold flex items-center gap-1.5">
                  Specifications
                  {aiMode && formData.specifications.length > 0 && <Sparkles size={14} className="text-[#7C3AED]" />}
                </h2>
                <p className="text-[11px] text-[#8A8B91] mt-0.5">Key technical details (e.g. Brand, Material, Weight).</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {formData.specifications.map((spec, i) => (
                <div key={i} className="flex gap-2 items-center group">
                  <input 
                    type="text" 
                    value={spec.key} 
                    onChange={e => updateSpecification(i, 'key', e.target.value)} 
                    placeholder="Name (e.g. Brand)" 
                    className="w-1/3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-gray-400 font-semibold"
                  />
                  <input 
                    type="text" 
                    value={spec.value} 
                    onChange={e => updateSpecification(i, 'value', e.target.value)} 
                    placeholder="Value (e.g. Nike)" 
                    className="flex-1 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[12px] outline-none focus:border-gray-400"
                  />
                  <button onClick={() => removeSpecification(i)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addSpecification} className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 hover:text-black transition-colors pt-2">
                <Plus size={14} /> Add Specification
              </button>
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold">Product Variants</h2>
                <p className="text-[11px] text-[#8A8B91] mt-0.5">Define variants manually or use AI to suggest common options.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
                <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#FE2C55] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {hasVariants && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2 p-3 bg-gray-50 rounded-sm border border-[#E3E3E4]">
                  {[
                    { id: 'Color', icon: Palette },
                    { id: 'Size', icon: Ruler },
                    { id: 'Material', icon: Box }
                  ].map(t => (
                    <button key={t.id} onClick={() => setVariantType(t.id)} className={`px-3 py-1.5 text-[11px] font-bold rounded-sm border flex items-center gap-1.5 transition-all ${variantType === t.id ? 'bg-black text-white border-black' : 'bg-white text-gray-500 hover:border-black'}`}>
                      <t.icon size={14} /> {t.id}
                    </button>
                  ))}
                  {aiMode && (formData.title || images.length > 0) && <button onClick={suggestVariantsAI} className="ml-auto text-[#7C3AED] text-[11px] font-bold underline decoration-2">Suggest {variantType}s</button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variants.map((v, i) => (
                    <div key={v.id} className="p-4 border border-[#E3E3E4] rounded-sm bg-[#F8F8F8] flex flex-col gap-3 group transition-all hover:bg-white">
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <label className="w-16 h-16 bg-white border border-[#E3E3E4] rounded-sm relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                            {v.isUploading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-300" />}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(v.id, e)} disabled={v.isUploading} />
                          </label>
                          {aiMode && images.length > 0 && v.name && !v.image && (
                            <button
                              onClick={(e) => { e.preventDefault(); generateVariantImageAI(i); }}
                              className="absolute -top-2 -right-2 bg-[#161823] text-white p-1.5 rounded-full shadow-md hover:bg-[#7C3AED] transition-colors z-10"
                              title={`Generate ${v.name} image via AI`}
                            >
                              <Wand2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">{variantType} Name</label>
                          <input type="text" value={v.name} placeholder={`e.g. ${variantType === 'Color' ? 'Deep Blue' : 'Leather'}`} onChange={e => {
                            const nv = [...variants]; nv[i].name = e.target.value; setVariants(nv);
                          }} className="w-full bg-white border border-gray-200 rounded-sm px-2 py-1.5 text-[12px] outline-none focus:border-[#161823]" />
                        </div>
                        <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input type="number" placeholder="Stock" value={v.stock} onChange={e => {
                          const nv = [...variants]; nv[i].stock = e.target.value; setVariants(nv);
                        }} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[11px] outline-none focus:border-[#161823]" />
                        <input type="number" placeholder="Price" value={v.price} onChange={e => {
                          const nv = [...variants]; nv[i].price = e.target.value; setVariants(nv);
                        }} className="w-full bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[11px] outline-none focus:border-[#161823]" />
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setVariants([...variants, { id: Date.now().toString(), name: '', stock: '10', price: '', image: '', isUploading: false }])} className="w-full py-3 border border-dashed border-[#E3E3E4] bg-[#F8F8F8] text-[12px] font-bold text-gray-400 rounded-sm hover:border-gray-400 hover:text-gray-600 transition-all hover:bg-white">Add Variant</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-[35%] space-y-6">
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4">Organization</h2>
            <div className="relative" ref={cascaderRef}>
              <label className="block text-[13px] font-semibold mb-1.5 flex justify-between">
                Category
                {aiMode && formData.category && <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-sm flex items-center gap-1"><Sparkles size={10} /> AI Picked</span>}
              </label>
              <div onClick={() => setShowCategoryCascader(!showCategoryCascader)} className={`w-full bg-[#F8F8F8] border rounded-sm px-3 py-2 text-[13px] flex justify-between items-center cursor-pointer transition-all ${showCategoryCascader ? 'border-gray-900 ring-2 ring-gray-900/5' : 'border-[#E3E3E4]'}`}>
                <span className={formData.category ? 'text-gray-900 font-medium' : 'text-gray-400'}>{selectedCategoryName}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showCategoryCascader ? 'rotate-180' : ''}`} />
              </div>
              {showCategoryCascader && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-md rounded-sm z-50 flex h-[240px] overflow-hidden">
                  <div className="w-1/2 border-r overflow-y-auto">
                    {categoryTree.length === 0 ? (
                      <div className="p-4 text-[11px] text-gray-400 italic text-center">No categories found</div>
                    ) : (
                      categoryTree.map(p => (
                        <div key={p._id} onMouseEnter={() => setActiveParentId(p._id)} onClick={() => { if(p.subCategories.length === 0) { setFormData({...formData, category: p._id}); setShowCategoryCascader(false); } }} className={`px-3 py-2.5 text-[12px] cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-all ${activeParentId === p._id ? 'bg-red-50 font-bold text-red-500 border-l-4 border-red-500' : ''}`}>
                          {p.name} {p.subCategories.length > 0 && <ChevronRight size={14} />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="w-1/2 overflow-y-auto bg-gray-50/50">
                    {activeParentId && categoryTree.find(p => p._id === activeParentId)?.subCategories.map(sub => (
                      <div key={sub._id} onClick={() => { setFormData({...formData, category: sub._id}); setShowCategoryCascader(false); }} className={`px-4 py-2.5 text-[12px] cursor-pointer hover:text-red-500 transition-all ${formData.category === sub._id ? 'font-bold text-red-500 bg-white' : ''}`}>{sub.name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-[13px] font-semibold mb-1.5 flex justify-between items-center">
                Tags
                {aiMode && formData.tags && <ListChecks size={14} className="text-[#7C3AED]" />}
              </label>
              <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-gray-900" placeholder="e.g. vintage, electronics" />
            </div>
          </div>
          <div className="bg-white border border-[#E3E3E4] rounded-sm p-5 md:p-6">
            <h2 className="text-[15px] font-bold mb-4">Pricing & Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5">Base Price (USh) <span className="text-red-500">*</span></label>
                <input type="number" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]" />
              </div>
              {!hasVariants && (
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5">Global Stock</label>
                  <input type="number" placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}