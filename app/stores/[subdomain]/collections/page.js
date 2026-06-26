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

  const [categories,  setCategories]  = useState([]);
  const [collections, setCollections] = useState([]);

  const [newCategory,      setNewCategory]      = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [editingId,        setEditingId]        = useState(null);
  const [editValue,        setEditValue]        = useState('');
  const [editImage,        setEditImage]        = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [dbCategories,   setDbCategories]   = useState([]);
  const [selectedMktCat, setSelectedMktCat] = useState('');
  const [showCascader,   setShowCascader]   = useState(false);
  const [activeParentId, setActiveParentId] = useState(null);
  const cascaderRef = useRef(null);

  const [aiSuggestions,  setAiSuggestions]  = useState([]);
  const [isSuggestingAI, setIsSuggestingAI] = useState(false);
  const [aiMode,         setAiMode]         = useState(true);

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
    const parents = dbCategories.filter(c => !c.parentId || c.parentId === '');
    return parents.map(p => {
      const pIdStr = String(p._id);
      const subCats = dbCategories.filter(c => {
        if (!c.parentId || c.parentId === '') return false;
        return String(c.parentId._id || c.parentId) === pIdStr;
      });
      return { ...p, subCategories: subCats.sort((a, b) => a.name.localeCompare(b.name)) };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [dbCategories]);

  const selectedMktCatName = useMemo(() => {
    const cat = dbCategories.find(c => c._id === selectedMktCat);
    if (!cat) return 'Select marketplace category (optional)';
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim(), image: editImage }),
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus }),
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Grouping &amp; Hierarchy</h1>
          <p className="text-sm text-gray-500 mt-1">Manage custom categories and smart collections for your storefront.</p>
        </div>
        {/* AI toggle — matches the blue-accent pattern of the profile page */}
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white self-start sm:self-auto">
          <Sparkles size={14} className={aiMode ? 'text-blue-600' : 'text-gray-400'} />
          <span className="text-sm font-semibold">AI Suggestions</span>
          <label className="relative inline-flex items-center cursor-pointer ml-1">
            <input type="checkbox" className="sr-only peer" checked={aiMode} onChange={() => setAiMode(p => !p)} />
            <div className="w-9 h-5 bg-gray-200 rounded-none peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-none border text-sm font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 size={16} />
            : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ════════════════════════════════════════════════════════════════════
            CATEGORIES
        ════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 p-6 w-full flex flex-col gap-5">

          {/* Card header */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <FolderTree size={18} />
            <div>
              <h2 className="text-base font-bold">Store Categories</h2>
              <p className="text-xs text-gray-500 mt-0.5">Custom groupings you assign to your products.</p>
            </div>
          </div>

          {/* ── Marketplace Category Cascader ── */}
          <div ref={cascaderRef} className="relative z-50">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Link to Marketplace Category
              <span className="ml-1.5 normal-case font-normal text-gray-400">(optional — used for AI suggestions)</span>
            </label>
            <div
              onClick={() => setShowCascader(p => !p)}
              className={`w-full bg-white border rounded-none px-3 py-2 text-sm flex justify-between items-center cursor-pointer transition-colors ${
                showCascader ? 'border-black' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className={selectedMktCat ? 'text-black font-medium' : 'text-gray-400'}>
                {selectedMktCatName}
              </span>
              <div className="flex items-center gap-1.5">
                {selectedMktCat && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedMktCat('');
                      setActiveParentId(null);
                      setAiSuggestions([]);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showCascader ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {showCascader && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-sm z-50 flex h-64 overflow-hidden">
                {/* Left: Parents */}
                <div className="w-1/2 border-r border-gray-200 overflow-y-auto flex flex-col bg-white">
                  {categoryTree.length === 0 && (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">No categories found</div>
                  )}
                  {categoryTree.map(p => {
                    const isSelected = selectedMktCat === p._id;
                    const isActive   = activeParentId === p._id;
                    const hasSubs    = p.subCategories.length > 0;
                    return (
                      <div
                        key={p._id}
                        onMouseEnter={() => setActiveParentId(p._id)}
                        onClick={() => {
                          setActiveParentId(p._id);
                          if (!hasSubs) { setSelectedMktCat(p._id); setShowCascader(false); }
                        }}
                        className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm transition-colors border-l-2 ${
                          isActive
                            ? 'bg-gray-50 border-black font-semibold text-black'
                            : isSelected
                            ? 'bg-white border-blue-600 font-semibold text-blue-600'
                            : 'bg-white border-transparent text-black hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        {hasSubs && <ChevronRight size={14} className={isActive ? 'text-black' : 'text-gray-400'} />}
                      </div>
                    );
                  })}
                </div>

                {/* Right: Sub-categories */}
                <div className="w-1/2 overflow-y-auto bg-gray-50 flex flex-col">
                  {activeParentId ? (() => {
                    const parent = categoryTree.find(p => p._id === activeParentId);
                    if (!parent) return null;
                    return (
                      <>
                        <div
                          onClick={() => { setSelectedMktCat(parent._id); setShowCascader(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer border-b border-gray-200 flex items-center justify-between transition-colors ${
                            selectedMktCat === parent._id
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'bg-gray-50 text-black hover:bg-white font-medium'
                          }`}
                        >
                          <span className="truncate">✓ Select "{parent.name}"</span>
                          {selectedMktCat === parent._id && <Check size={14} className="text-blue-600 shrink-0" />}
                        </div>
                        {parent.subCategories.map(sub => (
                          <div
                            key={sub._id}
                            onClick={() => { setSelectedMktCat(sub._id); setShowCascader(false); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                              selectedMktCat === sub._id
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-black hover:bg-white'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            {selectedMktCat === sub._id && <Check size={14} className="text-blue-600 shrink-0" />}
                          </div>
                        ))}
                      </>
                    );
                  })() : (
                    <div className="flex items-center justify-center h-full p-4 text-center">
                      <span className="text-xs text-gray-400">Hover or tap a category to view subcategories</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── AI Suggestions ── */}
          {aiMode && (
            <div className={`transition-all duration-300 ${
              isSuggestingAI || aiSuggestions.length > 0
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none h-0 overflow-hidden'
            }`}>
              <div className="p-3 bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-1.5 mb-2">
                  {isSuggestingAI
                    ? <Loader2 size={12} className="animate-spin text-blue-600" />
                    : <Wand2 size={12} className="text-blue-600" />}
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
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
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-600 text-blue-600 rounded-none text-xs font-semibold transition-colors hover:bg-blue-50 disabled:opacity-50"
                      >
                        <Plus size={10} /> {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Add Category Input ── */}
          <div className="flex gap-2 items-center">
            <label className="w-10 h-10 shrink-0 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors relative overflow-hidden group">
              {isUploadingImage && newCategory === '' ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
              ) : newCategoryImage ? (
                <>
                  <img src={newCategoryImage} alt="Category" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                    <UploadCloud size={14} className="text-white" />
                  </div>
                </>
              ) : (
                <ImageIcon size={16} className="text-gray-400 group-hover:text-black transition-colors" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, setNewCategoryImage)}
                disabled={isUploadingImage}
              />
            </label>

            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder="e.g. Winter Collection..."
              disabled={isActionLoading || isUploadingImage}
              className="flex-1 bg-white border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors disabled:opacity-50 h-10"
            />
            <button
              onClick={() => handleAddCategory()}
              disabled={!newCategory.trim() || isActionLoading || isUploadingImage}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-sm font-semibold transition-colors disabled:opacity-50 h-10"
            >
              {isActionLoading && newCategory.trim()
                ? <Loader2 size={14} className="animate-spin" />
                : <Plus size={14} />}
              Add
            </button>
          </div>

          {/* ── Category List ── */}
          <div className="border border-gray-200 overflow-hidden">
            {categories.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
                <FolderTree size={28} className="text-gray-200 mb-2" />
                <p className="text-sm font-semibold text-black">No categories yet</p>
                <p className="text-xs text-gray-500 mt-0.5">Add a category above to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {categories.map(cat => (
                  <div
                    key={cat._id}
                    className="bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    {/* Editing Mode */}
                    {editingId === cat._id ? (
                      <div className="flex items-center gap-2 w-full">
                        <label className="w-8 h-8 shrink-0 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors relative overflow-hidden group/edit">
                          {isUploadingImage ? (
                            <Loader2 size={12} className="animate-spin text-gray-400" />
                          ) : editImage ? (
                            <img src={editImage} alt="Edit" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={12} className="text-gray-400 group-hover/edit:text-black transition-colors" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setEditImage)}
                            disabled={isUploadingImage}
                          />
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                          disabled={isActionLoading || isUploadingImage}
                          className="flex-1 bg-white border border-black rounded-none px-3 py-1.5 text-sm text-black focus:outline-none"
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={isActionLoading || isUploadingImage}
                          className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-none transition-colors disabled:opacity-50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditImage(''); }}
                          disabled={isActionLoading || isUploadingImage}
                          className="p-1.5 bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-none transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              className="w-8 h-8 shrink-0 object-cover border border-gray-200"
                              alt={cat.name}
                            />
                          ) : (
                            <div className="w-8 h-8 shrink-0 bg-gray-50 border border-gray-200 flex items-center justify-center">
                              <ImageIcon size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-black truncate">{cat.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-1.5 py-0.5 font-semibold leading-none">
                                {cat.productCount || 0} items
                              </span>
                              {cat.parentCategory && (() => {
                                const linked = dbCategories.find(d => String(d._id) === String(cat.parentCategory));
                                return linked ? (
                                  <span className="shrink-0 text-xs bg-blue-50 border border-blue-200 text-blue-600 px-1.5 py-0.5 font-semibold truncate max-w-[120px] leading-none">
                                    Market: {linked.name}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingId(cat._id); setEditValue(cat.name); setEditImage(cat.image || ''); }}
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-none transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id, cat.image)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SMART COLLECTIONS
        ════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 p-6 w-full flex flex-col gap-5">

          {/* Card header */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Layers size={18} />
            <div>
              <h2 className="text-base font-bold">Smart Collections</h2>
              <p className="text-xs text-gray-500 mt-0.5">Automated groups generated based on rules.</p>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="flex-1 border border-dashed border-gray-300 p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
              <Sparkles size={28} className="text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-black">No collections yet</p>
              <p className="text-xs text-gray-500 mt-1 mb-5 max-w-xs">
                Initialize default smart collections like New Arrivals and Best Sellers.
              </p>
              <button
                onClick={handleInitializeCollections}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-sm font-semibold transition-colors disabled:opacity-70"
              >
                {isActionLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <RefreshCw size={14} />}
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
                    className={`border p-4 transition-all duration-200 ${
                      collection.enabled
                        ? 'border-gray-300 bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* Collection icon */}
                        <div
                          className="w-9 h-9 flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: collection.enabled ? `${collection.color}15` : '#f9fafb',
                            borderColor:     collection.enabled ? `${collection.color}30` : '#e5e7eb',
                            color:           collection.enabled ? collection.color : '#9ca3af',
                          }}
                        >
                          <Icon size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold mb-0.5 ${collection.enabled ? 'text-black' : 'text-gray-400'}`}>
                            {collection.name}
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed">{collection.description}</p>
                          {collection.enabled && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Active
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggle switch — same square style as store profile */}
                      <button
                        type="button"
                        onClick={() => handleToggleCollection(collection._id, collection.enabled)}
                        disabled={isActionLoading}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-none border transition-colors duration-200 outline-none mt-1 ${
                          collection.enabled
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-gray-100 border-gray-300'
                        } disabled:opacity-50`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            collection.enabled ? 'translate-x-2' : '-translate-x-2'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Info note */}
              <div className="mt-2 bg-gray-50 border border-gray-200 p-4 flex items-start gap-3">
                <AlertCircle size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Smart collections update automatically. Enable "Flash Sale" and any product with a discount will appear there instantly — no manual tagging needed.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}