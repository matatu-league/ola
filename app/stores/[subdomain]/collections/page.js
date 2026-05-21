"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers, FolderTree, Plus, Edit2, Trash2, Check, X,
  Loader2, Sparkles, TrendingUp, Zap, Tag, DollarSign,
  AlertCircle, CheckCircle2, AlertTriangle, RefreshCw,
  ChevronDown, ChevronRight, Wand2, Image as ImageIcon, UploadCloud
} from 'lucide-react';

import { suggestStoreCategoriesAI } from '@/lib/ai';
import { uploadFileToFirebase, deleteFileFromFirebase } from '@/lib/firebaseLib';

const ICON_MAP = { Sparkles, TrendingUp, Zap, Tag, DollarSign };

export default function CollectionsPage() {
  const [isLoading,       setIsLoading]       = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [message,         setMessage]         = useState({ type: '', text: '' });

  // ── Store data ──────────────────────────────────────────────────────────────
  const [categories,  setCategories]  = useState([]);
  const [collections, setCollections] = useState([]);
  
  // ── Add/Edit Category State ─────────────────────────────────────────────────
  const [newCategory,      setNewCategory]      = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [editingId,        setEditingId]        = useState(null);
  const [editValue,        setEditValue]        = useState('');
  const [editImage,        setEditImage]        = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── Marketplace (global) categories ────────────────────────────────────────
  const [dbCategories,    setDbCategories]    = useState([]);
  const [selectedMktCat,  setSelectedMktCat]  = useState('');
  const [showCascader,    setShowCascader]    = useState(false);
  const [activeParentId,  setActiveParentId]  = useState(null); // Track selected parent for 2-pane cascader
  const cascaderRef = useRef(null);

  // ── AI suggestions ──────────────────────────────────────────────────────────
  const [aiSuggestions,     setAiSuggestions]     = useState([]);
  const [isSuggestingAI,    setIsSuggestingAI]    = useState(false);
  const [aiMode,            setAiMode]            = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [catRes, colRes, mktRes] = await Promise.all([
          fetch('/api/stores/categories'),
          fetch('/api/stores/collections'),
          fetch('/api/categories', { headers: { 'ngrok-skip-browser-warning': 'true' } }),
        ]);
        const [catResult, colResult, mktResult] = await Promise.all([
          catRes.json(), colRes.json(), mktRes.json(),
        ]);
        if (catResult.success) setCategories(catResult.data);
        if (colResult.success) setCollections(colResult.data);
        if (mktResult.success && mktResult.data) setDbCategories(mktResult.data);
      } catch (err) {
        console.error('Failed to load store data:', err);
        showMessage('error', 'Failed to load store data.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Close cascader on outside click
  useEffect(() => {
    const handler = (e) => {
      if (cascaderRef.current && !cascaderRef.current.contains(e.target)) {
        setShowCascader(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!selectedMktCat || !aiMode) { setAiSuggestions([]); return; }
    const cat = dbCategories.find(c => c._id === selectedMktCat);
    if (!cat) return;
    const tid = setTimeout(async () => {
      setIsSuggestingAI(true);
      try {
        const suggestions = await suggestStoreCategoriesAI(cat.name);
        if (Array.isArray(suggestions)) setAiSuggestions(suggestions);
      } catch (e) { console.error('AI suggestion failed', e); }
      finally { setIsSuggestingAI(false); }
    }, 600);
    return () => clearTimeout(tid);
  }, [selectedMktCat, aiMode, dbCategories]);

  const categoryTree = useMemo(() => {
    // 1. Identify pure parents safely (no parentId or empty string)
    const parents = dbCategories.filter(c => !c.parentId || c.parentId === '');
    
    return parents.map(p => {
      const pIdStr = String(p._id);
      
      // 2. Identify subcategories that map to this parent, strictly converting IDs to strings
      const subCats = dbCategories.filter(c => {
        if (!c.parentId || c.parentId === '') return false;
        const currentParentIdStr = String(c.parentId._id || c.parentId);
        return currentParentIdStr === pIdStr;
      });

      // Sort alphabetically for a better UI experience
      return { 
        ...p, 
        subCategories: subCats.sort((a, b) => a.name.localeCompare(b.name)) 
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [dbCategories]);

  // Label for the selected marketplace category
  const selectedMktCatName = useMemo(() => {
    const cat = dbCategories.find(c => c._id === selectedMktCat);
    if (!cat) return 'Select marketplace category (optional)';
    
    // Safely look up parent name if this is a subcategory
    const pId = cat.parentId?._id || cat.parentId;
    const parent = dbCategories.find(p => String(p._id) === String(pId));
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  }, [selectedMktCat, dbCategories]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleImageUpload = async (e, setUrlCallback) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadFileToFirebase(file, 'categories', true);
      setUrlCallback(url);
    } catch (err) {
      console.error('Image upload failed:', err);
      showMessage('error', 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddCategory = async (nameOverride) => {
    const name = (nameOverride ?? newCategory).trim();
    if (!name) return;
    setIsActionLoading(true);
    try {
      const body = { name, image: newCategoryImage };
      if (selectedMktCat) body.parentCategory = selectedMktCat;

      const res = await fetch('/api/stores/categories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        setCategories(prev => [result.data, ...prev]);
        setNewCategory('');
        setNewCategoryImage('');
        setAiSuggestions([]);
        showMessage('success', 'Category created.');
      } else {
        showMessage('error', result.error || 'Failed to create category.');
      }
    } catch {
      showMessage('error', 'Network error. Failed to create category.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || !editingId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/stores/categories/${editingId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: editValue.trim(), image: editImage }),
      });
      const result = await res.json();
      if (result.success) {
        setCategories(prev => prev.map(c => c._id === editingId ? result.data : c));
        setEditingId(null); 
        setEditValue('');
        setEditImage('');
        showMessage('success', 'Category updated.');
      } else {
        showMessage('error', result.error || 'Failed to update category.');
      }
    } catch {
      showMessage('error', 'Network error. Failed to update category.');
    } finally { setIsActionLoading(false); }
  };

  const handleDeleteCategory = async (id, imageUrl) => {
    if (!confirm('Delete this category? Products linked to it will lose their category association.')) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/stores/categories/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setCategories(prev => prev.filter(c => c._id !== id));
        if (imageUrl) await deleteFileFromFirebase(imageUrl);
        showMessage('success', 'Category deleted.');
      } else {
        showMessage('error', result.error || 'Failed to delete category.');
      }
    } catch {
      showMessage('error', 'Network error. Failed to delete category.');
    } finally { setIsActionLoading(false); }
  };

  const handleToggleCollection = async (id, currentStatus) => {
    setCollections(prev => prev.map(c => c._id === id ? { ...c, enabled: !currentStatus } : c));
    try {
      const res = await fetch(`/api/stores/collections/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled: !currentStatus }),
      });
      const result = await res.json();
      if (!result.success) {
        setCollections(prev => prev.map(c => c._id === id ? { ...c, enabled: currentStatus } : c));
        showMessage('error', result.error || 'Failed to update collection.');
      }
    } catch {
      setCollections(prev => prev.map(c => c._id === id ? { ...c, enabled: currentStatus } : c));
      showMessage('error', 'Network error. Failed to update collection.');
    }
  };

  const handleInitializeCollections = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/stores/categories/collections', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setCollections(result.data);
        showMessage('success', 'Default collections initialized.');
      } else {
        showMessage('error', result.error || 'Failed to initialize collections.');
      }
    } catch {
      showMessage('error', 'Network error. Failed to initialize collections.');
    } finally { setIsActionLoading(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center w-full">
        <Loader2 className="animate-spin text-[#161823] mb-2" size={24} />
        <p className="text-[13px] text-[#8A8B91]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Grouping & Hierarchy</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage custom categories and smart collections for your storefront.</p>
        </div>
        {/* AI toggle */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#E3E3E4] self-start sm:self-auto">
          <Sparkles size={14} className={aiMode ? 'text-[#7C3AED]' : 'text-[#8A8B91]'} />
          <span className="text-[13px] font-semibold text-[#161823]">AI Suggestions</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(p => !p)} />
            <div className="w-9 h-5 bg-[#E3E3E4] rounded-sm peer peer-checked:bg-[#7C3AED] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </div>

      {/* Toast message */}
      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E3E3E4] rounded-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3E3E4] flex items-center gap-3 bg-[#F8F8F8]">
            <FolderTree size={16} className="text-[#161823]" />
            <div>
              <h2 className="text-[14px] font-bold text-[#161823]">Store Categories</h2>
              <p className="text-[11px] text-[#8A8B91] mt-0.5">Custom groupings you assign to your products.</p>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col gap-4">

            {}
            {/* ── Marketplace Category Tree Selector ── */}
            <div ref={cascaderRef} className="relative z-50">
              <label className="block text-[12px] font-semibold mb-1.5 text-[#8A8B91] uppercase tracking-wider">
                Link to Marketplace Category
                <span className="ml-1.5 text-[10px] font-normal normal-case text-[#8A8B91]">(optional — used for AI suggestions)</span>
              </label>
              <div
                onClick={() => setShowCascader(p => !p)}
                className={`w-full bg-[#F8F8F8] border rounded-sm px-3 py-2 text-[13px] flex justify-between items-center cursor-pointer transition-colors ${
                  showCascader ? 'border-[#161823]' : 'border-[#E3E3E4] hover:border-[#161823]'
                }`}
              >
                <span className={selectedMktCat ? 'text-[#161823] font-medium' : 'text-[#8A8B91]'}>
                  {selectedMktCatName}
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedMktCat && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setSelectedMktCat(''); setActiveParentId(null); setAiSuggestions([]); }}
                      className="text-[#8A8B91] hover:text-[#FE2C55] transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <ChevronDown size={14} className={`text-[#8A8B91] transition-transform duration-200 ${showCascader ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {showCascader && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E3E4] shadow-sm rounded-sm z-50 flex h-[260px] overflow-hidden">
                  {/* Left Panel: Parents */}
                  <div className="w-1/2 border-r border-[#E3E3E4] overflow-y-auto bg-white flex flex-col">
                    {categoryTree.length === 0 && (
                      <div className="px-4 py-3 text-[12px] text-[#8A8B91] text-center">No categories found</div>
                    )}
                    {categoryTree.map(p => {
                      const isSelected = selectedMktCat === p._id;
                      const isActive = activeParentId === p._id;
                      const hasSubs = p.subCategories.length > 0;

                      return (
                        <div
                          key={p._id}
                          onMouseEnter={() => setActiveParentId(p._id)}
                          onClick={() => {
                            setActiveParentId(p._id);
                            if (!hasSubs) {
                              setSelectedMktCat(p._id);
                              setShowCascader(false);
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-[12px] transition-colors border-l-2 ${
                            isActive
                              ? 'bg-[#F8F8F8] border-[#161823] font-semibold text-[#161823]'
                              : isSelected
                              ? 'bg-white border-[#7C3AED] font-semibold text-[#7C3AED]'
                              : 'bg-white border-transparent text-[#161823] hover:bg-[#F8F8F8]'
                          }`}
                        >
                          <span className="truncate pr-2">{p.name}</span>
                          {hasSubs && <ChevronRight size={14} className={isActive ? 'text-[#161823]' : 'text-[#8A8B91]'} />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Panel: Subcategories (or select parent) */}
                  <div className="w-1/2 overflow-y-auto bg-[#F8F8F8] flex flex-col">
                    {activeParentId ? (() => {
                      const parent = categoryTree.find(p => p._id === activeParentId);
                      if (!parent) return null;
                      return (
                        <>
                          {/* Option to select the parent category itself */}
                          <div
                            onClick={() => { setSelectedMktCat(parent._id); setShowCascader(false); }}
                            className={`px-4 py-2.5 text-[12px] cursor-pointer border-b border-[#E3E3E4] flex items-center justify-between transition-colors ${
                              selectedMktCat === parent._id ? 'bg-[#F3E8FF] text-[#7C3AED] font-bold' : 'bg-[#F8F8F8] text-[#161823] hover:bg-white font-medium'
                            }`}
                          >
                            <span className="truncate">✓ Select "{parent.name}"</span>
                            {selectedMktCat === parent._id && <Check size={14} className="text-[#7C3AED] shrink-0" />}
                          </div>

                          {/* Subcategories */}
                          {parent.subCategories.map(sub => (
                            <div
                              key={sub._id}
                              onClick={() => { setSelectedMktCat(sub._id); setShowCascader(false); }}
                              className={`px-4 py-2.5 text-[12px] cursor-pointer flex items-center justify-between transition-colors ${
                                selectedMktCat === sub._id ? 'bg-[#F3E8FF] text-[#7C3AED] font-bold' : 'text-[#161823] hover:bg-white'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              {selectedMktCat === sub._id && <Check size={14} className="text-[#7C3AED] shrink-0" />}
                            </div>
                          ))}
                        </>
                      );
                    })() : (
                      <div className="flex items-center justify-center h-full p-4 text-center">
                        <span className="text-[12px] text-[#8A8B91]">Hover or tap a category to view subcategories</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── AI Suggestions Banner ── */}
            {aiMode && (
              <div className={`transition-all duration-300 ${
                isSuggestingAI || aiSuggestions.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'
              }`}>
                <div className="p-3 bg-[#F3E8FF] border border-[#7C3AED]/20 rounded-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    {isSuggestingAI
                      ? <Loader2 size={11} className="animate-spin text-[#7C3AED]" />
                      : <Wand2 size={11} className="text-[#7C3AED]" />
                    }
                    <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider">
                      {isSuggestingAI ? 'AI is thinking...' : 'AI Suggested Names'}
                    </span>
                  </div>
                  {!isSuggestingAI && aiSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAddCategory(sug)}
                          disabled={isActionLoading || isUploadingImage}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#7C3AED]/30 hover:border-[#7C3AED] text-[#7C3AED] rounded-sm text-[11px] font-semibold transition-colors hover:bg-[#F3E8FF] disabled:opacity-50"
                        >
                          <Plus size={10} /> {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {}
            {/* ── Add Category Input (With Image) ── */}
            <div className="flex gap-2 items-center">
              <label className="w-[42px] h-[42px] shrink-0 border border-dashed border-[#E3E3E4] bg-[#F8F8F8] rounded-sm flex items-center justify-center cursor-pointer hover:border-[#161823] transition-colors relative overflow-hidden group">
                {isUploadingImage && newCategory === '' ? (
                  <Loader2 size={16} className="animate-spin text-[#8A8B91]" />
                ) : newCategoryImage ? (
                  <>
                    <img src={newCategoryImage} alt="Category" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                      <UploadCloud size={14} className="text-white" />
                    </div>
                  </>
                ) : (
                  <ImageIcon size={16} className="text-[#8A8B91] group-hover:text-[#161823]" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setNewCategoryImage)} disabled={isUploadingImage} />
              </label>

              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                placeholder="e.g. Winter Collection..."
                disabled={isActionLoading || isUploadingImage}
                className="flex-1 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white focus:outline-none transition-colors disabled:opacity-50 h-[42px]"
              />
              <button
                onClick={() => handleAddCategory()}
                disabled={!newCategory.trim() || isActionLoading || isUploadingImage}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#161823] text-white rounded-sm text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50 h-[42px]"
              >
                {isActionLoading && newCategory.trim() ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add
              </button>
            </div>

            {}
            {/* ── Category List ── */}
            <div className="flex-1 border border-[#E3E3E4] rounded-sm overflow-hidden z-0">
              {categories.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
                  <FolderTree size={28} className="text-[#E3E3E4] mb-2" />
                  <p className="text-[13px] font-semibold text-[#161823]">No categories yet</p>
                  <p className="text-[12px] text-[#8A8B91] mt-0.5">Add a category above to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E3E3E4]">
                  {categories.map(cat => (
                    <div key={cat._id} className="bg-white px-4 py-3 flex items-center justify-between hover:bg-[#F8F8F8] transition-colors group">
                      
                      {/* Editing Mode */}
                      {editingId === cat._id ? (
                        <div className="flex items-center gap-2 w-full">
                          <label className="w-8 h-8 shrink-0 border border-dashed border-[#E3E3E4] bg-[#F8F8F8] rounded-sm flex items-center justify-center cursor-pointer hover:border-[#161823] transition-colors relative overflow-hidden group/edit">
                            {isUploadingImage ? (
                              <Loader2 size={12} className="animate-spin text-[#8A8B91]" />
                            ) : editImage ? (
                              <img src={editImage} alt="Edit Category" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={12} className="text-[#8A8B91] group-hover/edit:text-[#161823]" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setEditImage)} disabled={isUploadingImage} />
                          </label>

                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                            disabled={isActionLoading || isUploadingImage}
                            className="flex-1 bg-white border border-[#161823] rounded-sm px-3 py-1.5 text-[13px] text-[#161823] outline-none"
                          />
                          <button onClick={handleSaveEdit} disabled={isActionLoading || isUploadingImage} className="p-1.5 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-sm transition-colors disabled:opacity-50"><Check size={14} /></button>
                          <button onClick={() => { setEditingId(null); setEditImage(''); }} disabled={isActionLoading || isUploadingImage} className="p-1.5 bg-[#F8F8F8] hover:bg-[#E3E3E4] text-[#161823] border border-[#E3E3E4] rounded-sm transition-colors"><X size={14} /></button>
                        </div>
                      ) : (
                        
                        /* View Mode */
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Display thumbnail if available */}
                            {cat.image ? (
                               <img src={cat.image} className="w-8 h-8 shrink-0 rounded-sm object-cover border border-[#E3E3E4]" alt={cat.name} />
                            ) : (
                               <div className="w-8 h-8 shrink-0 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center">
                                  <ImageIcon size={14} className="text-[#8A8B91]" />
                               </div>
                            )}

                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] font-semibold text-[#161823] truncate">{cat.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] bg-[#F8F8F8] border border-[#E3E3E4] text-[#8A8B91] px-1.5 py-0.5 rounded-sm font-semibold leading-none">
                                  {cat.itemCount || 0} items
                                </span>
                                {cat.parentCategory && (() => {
                                  const linked = dbCategories.find(d => String(d._id) === String(cat.parentCategory));
                                  return linked ? (
                                    <span className="shrink-0 text-[10px] bg-[#F3E8FF] border border-[#7C3AED]/20 text-[#7C3AED] px-1.5 py-0.5 rounded-sm font-semibold truncate max-w-[120px] leading-none">
                                      Market: {linked.name}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingId(cat._id); setEditValue(cat.name); setEditImage(cat.image || ''); }} className="p-1.5 text-[#8A8B91] hover:text-[#161823] hover:bg-[#E3E3E4] rounded-sm transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteCategory(cat._id, cat.image)} className="p-1.5 text-[#8A8B91] hover:text-[#FE2C55] hover:bg-[#FEE2E2] rounded-sm transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── COLLECTIONS ──────────────────────────────────────── */}
        <div className="bg-white border border-[#E3E3E4] rounded-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E3E3E4] flex items-center gap-3 bg-[#F8F8F8]">
            <Layers size={16} className="text-[#161823]" />
            <div>
              <h2 className="text-[14px] font-bold text-[#161823]">Smart Collections</h2>
              <p className="text-[11px] text-[#8A8B91] mt-0.5">Automated groups generated based on rules.</p>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {collections.length === 0 ? (
              <div className="flex-1 border border-dashed border-[#E3E3E4] rounded-sm p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
                <Sparkles size={28} className="text-[#8A8B91] mb-2" />
                <p className="text-[13px] font-semibold text-[#161823]">No collections yet</p>
                <p className="text-[12px] text-[#8A8B91] mt-0.5 mb-5 max-w-xs">
                  Initialize default smart collections like New Arrivals and Best Sellers.
                </p>
                <button
                  onClick={handleInitializeCollections}
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#161823] text-white rounded-sm text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-70"
                >
                  {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Initialize Defaults
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {collections.map(collection => {
                  const Icon = ICON_MAP[collection.icon] || Sparkles;
                  return (
                    <div
                      key={collection._id}
                      className={`border rounded-sm p-4 transition-all duration-200 ${
                        collection.enabled ? 'border-[#161823] bg-white' : 'border-[#E3E3E4] bg-[#F8F8F8] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: collection.enabled ? `${collection.color}15` : '#E3E3E4',
                              borderColor:     collection.enabled ? `${collection.color}30` : 'transparent',
                              color:           collection.enabled ? collection.color : '#8A8B91',
                            }}
                          >
                            <Icon size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className={`text-[13px] font-bold mb-0.5 ${collection.enabled ? 'text-[#161823]' : 'text-[#8A8B91]'}`}>
                              {collection.name}
                            </h3>
                            <p className="text-[12px] text-[#8A8B91] leading-relaxed">{collection.description}</p>
                            {collection.enabled && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#E6F4EA] border border-[#16A34A]/20 text-[#16A34A] text-[10px] font-bold rounded-sm uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
                                Active
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCollection(collection._id, collection.enabled)}
                          disabled={isActionLoading}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-200 outline-none mt-1 ${
                            collection.enabled ? 'bg-[#161823] border-[#161823]' : 'bg-[#F8F8F8] border-[#E3E3E4]'
                          } disabled:opacity-50`}
                        >
                          <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-sm bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            collection.enabled ? 'translate-x-2' : '-translate-x-2'
                          }`} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-4 flex items-start gap-3">
                  <AlertCircle size={14} className="text-[#8A8B91] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#8A8B91] leading-relaxed">
                    Smart collections update automatically. Enable "Flash Sale" and any product with a discount will appear there instantly — no manual tagging needed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}