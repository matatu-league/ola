"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Edit2, Trash2, FolderTree, X, Loader2,
  AlertCircle, PlusSquare, MinusSquare, Sparkles, ImageIcon,
  UploadCloud, Wand2, Image as ImageIconLucide
} from 'lucide-react';

import { uploadFileToFirebase, deleteFileFromFirebase } from '@/lib/firebaseLib';
import { fetchWithRetry, fileToBase64 } from '@/lib/ai';

const geminiApiKey   = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const TEXT_MODEL_ID  = 'gemini-2.5-flash';

const safeExtractJSON = (apiResult) => {
  const text = apiResult?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty or blocked AI response.');
  try {
    const match = text.match(/[\{\[][\s\S]*[\}\]]/);
    const clean = match ? match[0] : text.replace(/```(?:json)?\n?/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(clean);
  } catch {
    console.error('AI JSON parse failed. Raw:', text);
    throw new Error('AI returned a malformed response.');
  }
};

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const StatusBadge = ({ status }) =>
  (!status || status === 'Active') ? (
    <span className="flex items-center gap-1.5 text-[13px] text-gray-700">
      <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a]" /> Active
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-[13px] text-gray-700">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Draft
    </span>
  );

const ImageUploadField = ({ value, onChange, label = 'Category Image', isDisabled, categoryName }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const url = await uploadFileToFirebase(file, 'categories/images', false);
      onChange(url);
    } catch (err) {
      console.error('Category image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value?.includes('firebasestorage')) await deleteFileFromFirebase(value);
    onChange('');
  };

  const handleAIGenerate = async () => {
    if (!categoryName) return alert('Please enter a category Name first to generate an image.');
    setIsAiGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const placeholderUrl = `https://placehold.co/400x400/f3e8ff/7c3aed?text=${encodeURIComponent(categoryName)}`;
      onChange(placeholderUrl);
    } catch (err) {
      console.error('AI Image generation failed:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[13px] text-gray-700">{label}</label>
        {!value && (
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={isDisabled || isAiGenerating || !categoryName}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#7C3AED] bg-[#F3E8FF] border border-[#7C3AED]/20 rounded-sm hover:bg-[#e9d5ff] transition-colors disabled:opacity-50"
          >
            {isAiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {isAiGenerating ? 'Generating...' : 'AI Generate'}
          </button>
        )}
      </div>

      <div className="flex gap-4 items-start">
        {value ? (
          <div className="relative w-28 h-28 rounded-md overflow-hidden border border-gray-200 group bg-gray-50 flex-shrink-0">
            <img src={value} alt="category" className="w-full h-full object-cover aspect-square" />
            <button
              type="button"
              onClick={handleRemove}
              disabled={isDisabled}
              className="absolute top-1 right-1 bg-white/90 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
            >
              <X size={14} className="text-red-500" />
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed rounded-md cursor-pointer transition-colors flex-shrink-0 ${isDisabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-[#1677ff] hover:bg-blue-50/30'}`}>
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-[#1677ff]" />
            ) : (
              <>
                <UploadCloud size={20} className="text-gray-400 mb-1.5" />
                <span className="text-[11px] font-medium text-gray-500">1:1 Ratio</span>
              </>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={isDisabled || isUploading} />
          </label>
        )}
        <div className="flex flex-col justify-center text-[11px] text-gray-400 gap-1 mt-2">
          <p>• Recommended size: 400x400px</p>
          <p>• Max file size: 2MB</p>
          <p>• Format: JPG, PNG</p>
        </div>
      </div>
    </div>
  );
};

const AiSubcategoryPanel = ({ parentName, onSelect, isSaving }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [fetched, setFetched]         = useState(false);

  const fetchSuggestions = async () => {
    if (!parentName) return;
    setIsLoading(true);
    try {
      const prompt = `You are an e-commerce catalog expert. Given the parent category "${parentName}", suggest exactly 5 relevant subcategory names that would logically belong under it. Return ONLY a raw JSON array of strings with no explanation.`;
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_ID}:generateContent?key=${geminiApiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          }),
        }
      );
      const parsed = safeExtractJSON(result);
      if (Array.isArray(parsed)) setSuggestions(parsed);
    } catch (e) {
      console.error('AI suggestion failed:', e);
    } finally {
      setIsLoading(false);
      setFetched(true);
    }
  };

  useEffect(() => { fetchSuggestions(); }, [parentName]);

  if (!parentName) return null;

  return (
    <div className="rounded-md border border-[#e6f4ff] bg-[#f0f7ff] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#1677ff]" />
          <span className="text-[12px] font-semibold text-[#1677ff]">AI Suggestions</span>
          <span className="text-[11px] text-gray-400">for "{parentName}"</span>
        </div>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={isLoading || isSaving}
          className="text-[11px] text-[#1677ff] hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
          {isLoading ? 'Thinking...' : 'Regenerate'}
        </button>
      </div>

      {isLoading && !fetched ? (
        <div className="flex items-center gap-2 text-[12px] text-gray-400 py-1">
          <Loader2 size={13} className="animate-spin" /> Generating suggestions...
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              disabled={isSaving}
              onClick={() => onSelect(sug)}
              className="px-2.5 py-1 text-[12px] font-medium bg-white text-[#1677ff] border border-[#91caff] rounded-full hover:bg-[#1677ff] hover:text-white hover:border-[#1677ff] transition-colors disabled:opacity-50"
            >
              + {sug}
            </button>
          ))}
        </div>
      ) : fetched ? (
        <p className="text-[12px] text-gray-400">No suggestions available.</p>
      ) : null}
    </div>
  );
};

const POPOVER_WIDTH = 360;

const CategoryPopover = ({ popover, onClose, onFormChange, onSave, onDelete, isSaving, onImageChange }) => {
  if (!popover.isOpen) return null;

  const { type, position, formData, error, parentCategory } = popover;
  const isAddSub = type === 'addSubcategory';
  const isSubcategory = isAddSub || (type === 'edit' && formData.parentRef != null);

  const handleSelectSuggestion = (name) => {
    onFormChange({ target: { name: 'name', value: name } });
  };

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div
        className="fixed z-[101] bg-white rounded-sm  border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
        style={{
          ...(position.placement === 'top' ? { bottom: position.y } : { top: position.y }),
          left:      position.x,
          transform: 'translateX(-100%)',
          width:     `${POPOVER_WIDTH}px`,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {position.placement === 'top' ? (
          <div className="absolute -bottom-[5px] right-6 w-2.5 h-2.5 bg-white border-b border-r border-gray-100 rotate-45" />
        ) : (
          <div className="absolute -top-[5px] right-6 w-2.5 h-2.5 bg-white border-t border-l border-gray-100 rotate-45" />
        )}

        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">
              {type === 'create'         && 'New Category'}
              {type === 'edit'           && 'Edit Category'}
              {type === 'addSubcategory' && `Add Subcategory`}
              {type === 'delete'         && 'Confirm Deletion'}
            </h4>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-1">
              <X size={14} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-[#fff2f0] border border-[#ffccc7] rounded-md text-[#ff4d4f] text-[13px] flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {type === 'delete' ? (
            <div>
              <div className="flex items-start gap-3 mb-6 bg-orange-50 p-3 rounded-md border border-orange-100">
                <AlertCircle className="text-[#faad14] shrink-0 mt-0.5" size={16} />
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold">{formData.name}</span>? Any associated products may lose their categorization.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} disabled={isSaving} className="px-4 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={onDelete} disabled={isSaving} className="px-4 py-1.5 text-[13px] font-medium bg-[#ff4d4f] text-white rounded-md hover:bg-[#ff7875] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm">
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-4">
              {isAddSub && parentCategory && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                  <FolderTree size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Parent Directory</span>
                    <span className="text-[13px] font-medium text-gray-700">{parentCategory.name}</span>
                  </div>
                </div>
              )}

              {isAddSub && <AiSubcategoryPanel parentName={parentCategory?.name} onSelect={handleSelectSuggestion} isSaving={isSaving} />}

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Name <span className="text-[#ff4d4f]">*</span></label>
                <input type="text" name="name" required autoFocus disabled={isSaving} value={formData.name} onChange={onFormChange} placeholder={isAddSub ? 'e.g., Smartphones' : 'e.g., Electronics'} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-[14px] focus:outline-none focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] transition-all disabled:bg-gray-50" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">URL Slug <span className="text-[#ff4d4f]">*</span></label>
                <input type="text" name="slug" required disabled={isSaving} value={formData.slug} onChange={onFormChange} placeholder="auto-generated" className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-[13px] font-mono focus:outline-none focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] transition-all disabled:bg-gray-100 text-gray-600" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Status</label>
                <select name="status" value={formData.status} onChange={onFormChange} disabled={isSaving} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-[14px] focus:outline-none focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] transition-all disabled:bg-gray-50 cursor-pointer">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {!isSubcategory && (
                <div className="pt-2 border-t border-gray-100">
                  <ImageUploadField value={formData.image} onChange={(url) => onImageChange(url)} isDisabled={isSaving} categoryName={formData.name} />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-[13px] font-medium bg-[#1677ff] text-white rounded-md hover:bg-[#4096ff] transition-colors flex items-center gap-1.5  disabled:opacity-50">
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

const INITIAL_FORM = { id: '', name: '', slug: '', status: 'Active', image: '', parentRef: null };

export default function CategoriesPage() {
  const [categories, setCategories]             = useState([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [isSaving, setIsSaving]                 = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const [popover, setPopover] = useState({
    isOpen: false,
    type: null,
    targetId: null,
    parentCategory: null,
    position: { x: 0, y: 0, placement: 'bottom' },
    formData: { ...INITIAL_FORM },
    error: '',
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res    = await fetch('/api/categories', { headers: { 'ngrok-skip-browser-warning': 'true' } });
      const result = await res.json();
      if (result.success && result.data) {
        const all     = result.data;
        const parents = all.filter(c => !c.parentRef);
        setCategories(parents.map(p => ({
          ...p,
          subcategories: all.filter(s => s.parentRef === p._id),
        })));
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpand = (id) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openPopover = (e, type, category = null, parent = null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.right;
    let y = rect.bottom + 8;
    let placement = 'bottom';
    
    if (y + 500 > window.innerHeight && rect.top > 300) {
      y = window.innerHeight - rect.top + 8; 
      placement = 'top';
    }

    if (window.innerWidth - x < POPOVER_WIDTH + 20) x = window.innerWidth - 20;

    setPopover({
      isOpen: true,
      type,
      targetId: category?._id ?? null,
      parentCategory: parent,
      position: { x, y, placement },
      formData: category && type !== 'delete'
        ? { 
            id: category._id, name: category.name, slug: category.slug, 
            status: category.status || 'Active', image: category.image || '', parentRef: category.parentRef || null 
          }
        : { ...INITIAL_FORM },
      error: '',
    });
  };

  const closePopover = () => setPopover(p => ({ ...p, isOpen: false, error: '' }));

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPopover(p => ({
      ...p,
      error: '',
      formData: {
        ...p.formData,
        [name]: value,
        ...(name === 'name' ? { slug: slugify(value) } : {}),
      },
    }));
  };

  const handleImageChange = (url) => setPopover(p => ({ ...p, formData: { ...p.formData, image: url } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const { name, slug, status, image, id } = popover.formData;

    if (!name || !slug) return setPopover(p => ({ ...p, error: 'Name and Slug are required.' }));

    setIsSaving(true);
    try {
      const isEditing = popover.type === 'edit';
      const payload   = {
        name, slug, status,
        image: image || '',
        parentRef: popover.type === 'addSubcategory' ? popover.parentCategory._id : null,
      };

      const url    = isEditing ? `/api/categories/${id}` : '/api/categories';
      const method = isEditing ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();

      if (json.success) {
        await fetchCategories();
        if (popover.type === 'addSubcategory') setExpandedCategories(p => new Set(p).add(popover.parentCategory._id));
        closePopover();
      } else {
        setPopover(p => ({ ...p, error: json.error || 'Failed to save category.' }));
      }
    } catch (e) {
      setPopover(p => ({ ...p, error: 'An unexpected network error occurred.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    const { targetId } = popover;
    const parent = categories.find(c => c._id === targetId);
    if (parent?.subcategories?.length > 0) return setPopover(p => ({ ...p, error: 'Cannot delete a category that has subcategories.' }));

    setIsSaving(true);
    try {
      const res  = await fetch(`/api/categories/${targetId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (json.success) {
        await fetchCategories();
        closePopover();
      } else {
        setPopover(p => ({ ...p, error: json.error || 'Failed to delete category.' }));
      }
    } catch (e) {
      setPopover(p => ({ ...p, error: 'Network error. Failed to delete.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subcategories?.some(sub => sub.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 sm:p-8 font-sans text-gray-800">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight tracking-tight">Categories</h1>
          <p className="text-[14px] text-gray-500 mt-1">Manage your product classification and hierarchy.</p>
        </div>
        <button
          onClick={e => openPopover(e, 'create')}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#1677ff] text-white text-[13px] font-semibold hover:bg-[#4096ff] transition-colors rounded-md shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-none border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-[13px] rounded-md focus:outline-none focus:border-[#1677ff] focus:bg-white focus:ring-1 focus:ring-[#1677ff] transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 size={32} className="animate-spin mb-4 text-[#1677ff]" />
            <span className="text-[14px] font-medium">Loading catalog data...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <FolderTree size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">No categories found</p>
            <p className="text-gray-500 text-[13px]">Start building your catalog by adding a new parent category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#fafafa] border-b border-gray-200 text-gray-600 font-semibold text-[13px]">
                <tr>
                  <th className="px-5 py-3.5 w-[35%]">Category</th>
                  <th className="px-5 py-3.5">Products</th>
                  <th className="px-5 py-3.5">URL Slug</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map(category => {
                  const hasSubs    = category.subcategories?.length > 0;
                  const isExpanded = expandedCategories.has(category._id);

                  return (
                    <React.Fragment key={category._id}>
                      {}
                      <tr className="hover:bg-blue-50/30 transition-colors bg-white group">
                        
                        {/* New Unified "Category" Column: Toggle -> Image -> Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleExpand(category._id)}
                              disabled={!hasSubs}
                              className={`w-4 h-4 shrink-0 flex items-center justify-center border rounded-[3px] transition-colors focus:outline-none focus:border-[#1677ff] focus:text-[#1677ff]
                                ${hasSubs ? 'border-gray-300 text-gray-500 hover:border-[#1677ff] hover:text-[#1677ff] bg-white' : 'border-transparent text-transparent cursor-default'}`}
                            >
                              {hasSubs && (isExpanded ? <MinusSquare size={14} /> : <PlusSquare size={14} />)}
                            </button>
                            
                            {category.image
                              ? <img src={category.image} alt={category.name} className="w-8 h-8 shrink-0 rounded-md object-cover border border-gray-200 aspect-square" />
                              : <div className="w-8 h-8 shrink-0 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100"><ImageIconLucide size={14} className="text-gray-300" /></div>
                            }
                            
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{category.name}</span>
                              {hasSubs && (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200">
                                  {category.subcategories.length} subs
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* New Products Count Column */}
                        <td className="px-5 py-3.5 font-medium text-gray-700">
                          {category.productCount || 0}
                        </td>
                        
                        <td className="px-5 py-3.5 text-gray-500 font-mono text-[13px]">{category.slug}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={category.status} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3.5">
                            <button onClick={e => openPopover(e, 'addSubcategory', null, category)} className="text-[12px] text-[#1677ff] hover:text-[#4096ff] font-semibold bg-blue-50 px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              + Subcategory
                            </button>
                            <div className="w-px h-4 bg-gray-200" />
                            <button onClick={e => openPopover(e, 'edit', category)} className="text-gray-400 hover:text-[#1677ff] transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={e => openPopover(e, 'delete', category)} className="text-gray-400 hover:text-[#ff4d4f] transition-colors" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>

                      {}
                      {isExpanded && category.subcategories?.map((sub, idx) => {
                        const isLast = idx === category.subcategories.length - 1;
                        return (
                          <tr key={sub._id} className="hover:bg-gray-100 transition-colors bg-[#fafafa] group">
                            
                            {/* Indented Unified Column */}
                            <td className="px-5 py-2.5 relative">
                              {/* Tree lines connected precisely to the parent toggle icon center (px-5 + w-2 = 28px) */}
                              <div className={`absolute left-[27px] top-0 w-px bg-gray-300 ${isLast ? 'h-[26px]' : 'h-full'}`} />
                              <div className="absolute left-[27px] top-[26px] w-[14px] h-px bg-gray-300" />
                              
                              {/* Content spaced out to align with parent image & text */}
                              <div className="flex items-center gap-3 pl-[30px]">
                                {/* Empty space strictly aligned with the parent's image dimensions */}
                                <div className="w-8 h-8 shrink-0 flex items-center justify-center text-gray-300">-</div>
                                <span className="text-gray-600 font-medium">{sub.name}</span>
                              </div>
                            </td>

                            <td className="px-5 py-2.5 text-gray-600 font-medium">
                              {sub.productCount || 0}
                            </td>

                            <td className="px-5 py-2.5 text-gray-400 font-mono text-[12px]">{sub.slug}</td>
                            <td className="px-5 py-2.5"><StatusBadge status={sub.status} /></td>
                            <td className="px-5 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-3.5">
                                <button onClick={e => openPopover(e, 'edit', sub, category)} className="text-gray-400 hover:text-[#1677ff] transition-colors" title="Edit"><Edit2 size={15} /></button>
                                <button onClick={e => openPopover(e, 'delete', sub)} className="text-gray-400 hover:text-[#ff4d4f] transition-colors" title="Delete"><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryPopover
        popover={popover}
        onClose={closePopover}
        onFormChange={handleFormChange}
        onSave={handleSave}
        onDelete={executeDelete}
        onImageChange={handleImageChange}
        isSaving={isSaving}
      />
    </div>
  );
}
