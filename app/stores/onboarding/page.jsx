"use client";

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Store, Globe, Loader2, Package,
  CalendarCheck, AlertCircle, XCircle, ChevronDown,
  Mail, Phone, Briefcase, Search, Check, ShoppingBag,
  Image as ImageIcon, Palette, Sparkles, UploadCloud, ArrowRight, ArrowLeft, Trash2,
} from 'lucide-react';
import { getCookieRootDomain, getSessionUser, storeDomain } from '@/lib/domain';
import { uploadFileToFirebase } from '@/lib/firebaseLib';

// Maps a category's `kind` to the store's businessType. A `service` category
// where the owner also sells physical items ("I also sell items") is promoted
// to 'both'; `school` categories are 'both' by definition.
function deriveBusinessType(kind, alsoSellsItems) {
  if (kind === 'both') return 'both';
  if (kind === 'service') return alsoSellsItems ? 'both' : 'services';
  return 'products';
}

const MODE_LABELS = {
  products: { label: 'Product Store',  icon: Package,        hint: 'Sell physical products' },
  services: { label: 'Service Booking', icon: CalendarCheck, hint: 'Take bookings & appointments' },
  both:     { label: 'Services + Store', icon: Store,        hint: 'Bookings and physical items' },
};

const BRAND_COLORS = ['#161823', '#2563EB', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#F97316', '#06B6D4'];

const STEPS = [
  { n: 1, label: 'Basics' },
  { n: 2, label: 'Profile' },
  { n: 3, label: 'Design' },
];

export default function StoreOnboarding() {
  const [step, setStep] = useState(1);
  const [createdStore, setCreatedStore] = useState(null); // { id, domain }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [domainStatus, setDomainStatus] = useState('idle'); // idle, checking, available, unavailable, invalid_length
  const [isDomainDirty, setIsDomainDirty] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, banner: false });

  const [formData, setFormData] = useState({
    title: '',
    email: '',
    phone: '',
    domain: '',
    // Mode is decided by the chosen DB category — see deriveBusinessType().
    categoryId: '',
    categoryName: '',
    categoryKind: '',
    serviceType: null,
    alsoSellsItems: false,
    sellsEverything: false, // general store — lists across all categories
    businessType: 'products', // derived; 'products' | 'services' | 'both'
    layoutStyle: 'Classic',
    // ── Step 2 (profile) ──
    description: '',
    logo: '',
    banner: '',
    themeColor: '#161823',
  });

  // Full DB category tree, grouped by top-level parent for the picker.
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [catLoading,     setCatLoading]     = useState(true);
  const [catSearch,      setCatSearch]      = useState('');
  const [pickerOpen,     setPickerOpen]     = useState(false);

  // Load categories from the database — the single source of truth for
  // whether the new tenant is a store, a service, or both.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res  = await fetch('/api/categories', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const json = await res.json();
        if (!active || !json.success) return;

        const cats    = json.data || [];
        const parents = cats.filter(c => !c.parentId);
        const groups  = parents
          .map(p => ({
            ...p,
            children: cats.filter(c => String(c.parentId) === String(p._id)),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        // Never silently drop categories whose parent isn't a returned top-level
        // category — gather them under a fallback group so services always show.
        const placed = new Set();
        groups.forEach(g => {
          placed.add(String(g._id));
          g.children.forEach(c => placed.add(String(c._id)));
        });
        const orphans = cats.filter(c => !placed.has(String(c._id)));
        if (orphans.length) {
          groups.push({ _id: '__other__', name: 'More Categories', synthetic: true, children: orphans });
        }

        setCategoryGroups(groups);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        if (active) setCatLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      sellsEverything: false,
      categoryId:     cat._id,
      categoryName:   cat.name,
      categoryKind:   cat.kind || 'product',
      serviceType:    cat.serviceType || null,
      alsoSellsItems: false,
      businessType:   deriveBusinessType(cat.kind || 'product', false),
    }));
    setPickerOpen(false);
    setCatSearch('');
  };

  const selectEverything = () => {
    setFormData(prev => ({
      ...prev,
      sellsEverything: true,
      categoryId:     '',
      categoryName:   'Everything (general store)',
      categoryKind:   'product',
      serviceType:    null,
      alsoSellsItems: false,
      businessType:   'products',
    }));
    setPickerOpen(false);
    setCatSearch('');
  };

  const toggleAlsoSells = () => {
    setFormData(prev => ({
      ...prev,
      alsoSellsItems: !prev.alsoSellsItems,
      businessType:   deriveBusinessType(prev.categoryKind, !prev.alsoSellsItems),
    }));
  };

  const filteredGroups = categoryGroups
    .map(g => {
      const q = catSearch.trim().toLowerCase();
      if (!q) return g;
      const groupHit = g.name.toLowerCase().includes(q);
      const children = groupHit ? g.children : g.children.filter(c => c.name.toLowerCase().includes(q));
      return (groupHit || children.length) ? { ...g, children } : null;
    })
    .filter(Boolean);

  // Pre-fill from the session cookie — including the registration phone.
  useEffect(() => {
    const parsed = getSessionUser();
    if (!parsed) return;
    setFormData(prev => ({
      ...prev,
      ...(parsed.name ? {
        title:  prev.title  || `${parsed.name}'s Store`,
        domain: prev.domain || parsed.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      } : {}),
      email: prev.email || parsed.email       || '',
      phone: prev.phone || parsed.phoneNumber || '',
    }));
  }, []);

  const generateSubdomain = (text) =>
    text.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Real-time domain availability check
  useEffect(() => {
    const checkDomain = async () => {
      const subdomain = formData.domain;
      if (!subdomain) { setDomainStatus('idle'); return; }
      if (subdomain.length < 3) { setDomainStatus('invalid_length'); return; }

      setDomainStatus('checking');
      try {
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/stores/lookup?domain=${storeDomain(subdomain)}`, {
          cache: 'no-store',
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        if (res.status === 404) { setDomainStatus('available'); return; }
        if (res.status === 200) { setDomainStatus('unavailable'); return; }
        const result = await res.json();
        setDomainStatus(result.available ? 'available' : 'unavailable');
      } catch {
        setDomainStatus('idle');
      }
    };
    const timer = setTimeout(checkDomain, 600);
    return () => clearTimeout(timer);
  }, [formData.domain]);

  const isBasicsValid = Boolean(
    formData.title.trim().length > 0 &&
    (formData.categoryId !== '' || formData.sellsEverything) &&
    formData.domain.length >= 3 &&
    domainStatus === 'available'
  );

  // ── Step 1: create the store, then advance to the profile step ──────────────
  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!isBasicsValid) return;

    setIsSubmitting(true);
    setError('');
    try {
      const fullDomain = storeDomain(formData.domain);
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, domain: fullDomain }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        // Mark the session as having a store so the layout doesn't bounce us.
        try {
          const match = document.cookie.split('; ').find(c => c.startsWith('user_session='));
          if (match) {
            let raw = decodeURIComponent(match.split('=')[1]).replace(/^"|"$/g, '');
            if (raw.startsWith('%7B')) raw = decodeURIComponent(raw);
            const sessionData = JSON.parse(raw);
            sessionData.hasStore = true;
            sessionData.domain = fullDomain;
            const hostname = window.location.hostname;
            const rootDomain = getCookieRootDomain(hostname);
            const domainString = hostname.includes('.') ? `domain=.${rootDomain};` : '';
            const encoded = encodeURIComponent(JSON.stringify(sessionData));
            document.cookie = `user_session=${encoded}; path=/; max-age=604800; ${domainString} SameSite=Lax`;
          }
        } catch (err) { console.error('Failed to update local session cookie', err); }

        setCreatedStore({ id: result.store?._id, domain: fullDomain });
        setStep(2);
      } else {
        setError(result.error || result.message || 'Failed to create store. Please try again.');
      }
    } catch {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Image uploads (logo / banner) ───────────────────────────────────────────
  const handleUpload = async (field, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(u => ({ ...u, [field]: true }));
    setError('');
    try {
      const folder = field === 'logo' ? 'stores/logos' : 'stores/banners';
      const url = await uploadFileToFirebase(file, folder);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (err) {
      console.error('Upload failed', err);
      setError(`Failed to upload ${field}. Please try again.`);
    } finally {
      setUploading(u => ({ ...u, [field]: false }));
    }
  };

  const isProfileValid = Boolean(
    formData.description.trim().length > 0 &&
    formData.logo &&
    formData.banner &&
    formData.themeColor
  );

  // ── Step 2: save the profile, then move to the design step ──────────────────
  const handleSaveProfile = async () => {
    if (!isProfileValid) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          logo:        formData.logo,
          banner:      formData.banner,
          themeColor:  formData.themeColor,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setStep(3);
      } else {
        setError(result.message || 'Failed to save your profile. Please try again.');
      }
    } catch {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3 actions ──────────────────────────────────────────────────────────
  const designWithAI   = () => { window.location.href = `//${createdStore.domain}/theme?onboarding=1`; };
  const skipToDashboard = () => { window.location.href = `//${createdStore.domain}/dashboard`; };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white w-full max-w-xl border border-[#E3E3E4] rounded-sm p-8 shadow-sm">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-[#161823] rounded-sm flex items-center justify-center mb-4 shadow-sm">
            <Store className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-[#161823] tracking-tight">Launch Your Store</h1>
          <p className="text-[14px] text-[#8A8B91] mt-1">A few quick steps to set up your unique storefront.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step > s.n ? 'bg-[#16A34A] text-white' : step === s.n ? 'bg-[#161823] text-white' : 'bg-[#E3E3E4] text-[#8A8B91]'
                }`}>
                  {step > s.n ? <Check size={12} /> : s.n}
                </span>
                <span className={`text-[12px] font-bold ${step >= s.n ? 'text-[#161823]' : 'text-[#8A8B91]'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-[#E3E3E4]" />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#FEE2E2] text-[#FE2C55] rounded-sm text-[13px] font-semibold border border-[#FE2C55]/20 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: BASICS ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleCreateStore} className="space-y-6">

            {/* Category Selection — decides store vs. service vs. both */}
            <div>
              <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} /> What do you offer? <span className="text-[#FE2C55]">*</span>
              </label>

              <button
                type="button"
                onClick={() => setPickerOpen(o => !o)}
                className="w-full flex items-center justify-between bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-4 py-3 text-[14px] font-semibold text-left transition-colors hover:border-[#8A8B91] focus:outline-none focus:border-[#161823]"
              >
                <span className={formData.categoryName ? 'text-[#161823]' : 'text-[#8A8B91]'}>
                  {formData.categoryName || (catLoading ? 'Loading categories…' : 'Choose your category…')}
                </span>
                <ChevronDown size={16} className="text-[#8A8B91] shrink-0" />
              </button>

              {pickerOpen && (
                <div className="mt-2 border border-[#E3E3E4] rounded-sm bg-white shadow-sm overflow-hidden">
                  <div className="relative border-b border-[#E3E3E4]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
                    <input
                      type="text"
                      autoFocus
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder="Search categories…"
                      className="w-full pl-9 pr-3 py-2.5 text-[13px] font-medium text-[#161823] focus:outline-none"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {!catSearch.trim() && (
                      <button
                        type="button"
                        onClick={selectEverything}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#E3E3E4] text-left transition-colors ${
                          formData.sellsEverything ? 'bg-[#FFF0F3]' : 'hover:bg-[#F8F8F8]'
                        }`}
                      >
                        <Globe size={18} className="text-[#161823] shrink-0" />
                        <span className="flex-1">
                          <span className="block text-[13px] font-bold text-[#161823]">I sell everything</span>
                          <span className="block text-[11px] text-[#8A8B91]">General store — list products across all categories</span>
                        </span>
                        {formData.sellsEverything && <Check size={16} className="text-[#16A34A]" />}
                      </button>
                    )}

                    {filteredGroups.length === 0 && (
                      <p className="px-4 py-3 text-[12px] text-[#8A8B91]">No categories found.</p>
                    )}

                    {filteredGroups.map(group => {
                      const selectableParent = !group.synthetic;
                      const parentSelected   = formData.categoryId === group._id;
                      const parentIsService  = group.kind === 'service' || group.kind === 'both';
                      return (
                        <div key={group._id} className="border-b border-[#F0F0F0] last:border-0">
                          {selectableParent ? (
                            <button
                              type="button"
                              onClick={() => selectCategory(group)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                                parentSelected ? 'bg-[#FFF0F3]' : 'bg-[#F8F8F8] hover:bg-[#F0F0F0]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                                parentSelected ? 'bg-[#161823] border-[#161823]' : 'border-[#8A8B91] bg-white'
                              }`}>
                                {parentSelected && <Check size={11} className="text-white" />}
                              </span>
                              <span className="flex-1 text-[12px] font-bold uppercase tracking-wide text-[#161823]">{group.name}</span>
                              {parentIsService && (
                                <span className="text-[9px] font-bold uppercase tracking-wide text-[#161823] bg-[#FFE8EC] px-1.5 py-0.5 rounded-sm">
                                  {group.kind === 'both' ? 'Service + Store' : 'Service'}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-[#8A8B91]">Select all</span>
                            </button>
                          ) : (
                            <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8B91] bg-[#F8F8F8]">
                              {group.name}
                            </p>
                          )}

                          {group.children.map(cat => {
                            const isService = cat.kind === 'service' || cat.kind === 'both';
                            return (
                              <button
                                key={cat._id}
                                type="button"
                                onClick={() => selectCategory(cat)}
                                className="w-full flex items-center justify-between pl-9 pr-4 py-2 text-left hover:bg-[#F8F8F8] transition-colors"
                              >
                                <span className="text-[13px] font-medium text-[#161823]">{cat.name}</span>
                                <span className="flex items-center gap-2">
                                  {isService && (
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-[#161823] bg-[#FFE8EC] px-1.5 py-0.5 rounded-sm">
                                      {cat.kind === 'both' ? 'Service + Store' : 'Service'}
                                    </span>
                                  )}
                                  {formData.categoryId === cat._id && <Check size={14} className="text-[#16A34A]" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Derived mode + "also sell items" promotion */}
              {formData.categoryId && (() => {
                const mode = MODE_LABELS[formData.businessType] || MODE_LABELS.products;
                const ModeIcon = mode.icon;
                return (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm">
                      <ModeIcon size={18} className="text-[#161823] shrink-0" />
                      <div>
                        <p className="text-[12px] font-bold text-[#161823]">{mode.label}</p>
                        <p className="text-[11px] text-[#8A8B91]">{mode.hint}</p>
                      </div>
                    </div>

                    {formData.categoryKind === 'service' && (
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                            formData.alsoSellsItems ? 'bg-[#161823] border-[#161823]' : 'border-[#8A8B91] bg-white'
                          }`}
                          onClick={toggleAlsoSells}
                        >
                          {formData.alsoSellsItems && <Check size={11} className="text-white" />}
                        </span>
                        <span className="text-[12px] font-medium text-[#161823] flex items-center gap-1.5" onClick={toggleAlsoSells}>
                          <ShoppingBag size={13} className="text-[#8A8B91]" />
                          I also sell physical items (e.g. uniforms, products)
                        </span>
                      </label>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest">Store Name <span className="text-[#FE2C55]">*</span></label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setFormData(prev => {
                    const updates = { ...prev, title: newTitle };
                    if (!isDomainDirty) updates.domain = generateSubdomain(newTitle);
                    return updates;
                  });
                }}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-4 py-3 text-[14px] font-semibold text-[#161823] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors"
                placeholder="e.g. Matatu Electronics"
              />
            </div>

            {/* Domain Validation */}
            <div>
              <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
                <Globe size={12} /> Web Address <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#8A8B91] text-[14px] font-medium pointer-events-none">https://</span>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) => {
                    setIsDomainDirty(true);
                    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setFormData({ ...formData, domain: sanitized });
                  }}
                  className={`w-full bg-white border rounded-sm pl-[68px] pr-20 py-3 focus:outline-none text-[14px] font-bold transition-all ${
                    domainStatus === 'unavailable' ? 'border-[#FE2C55] text-[#FE2C55]' :
                    domainStatus === 'available' ? 'border-[#16A34A] text-[#161823]' :
                    'border-[#E3E3E4] focus:border-[#161823] text-[#161823]'
                  }`}
                  placeholder="my-store"
                />
                <span className="absolute right-10 text-[#161823] text-[14px] font-bold pointer-events-none">.ola.ug</span>
                <div className="absolute right-3 flex items-center">
                  {domainStatus === 'checking' && <Loader2 size={16} className="text-[#8A8B91] animate-spin" />}
                  {domainStatus === 'available' && <CheckCircle2 size={18} className="text-[#16A34A]" />}
                  {domainStatus === 'unavailable' && <XCircle size={18} className="text-[#FE2C55]" />}
                </div>
              </div>
              <div className="mt-2 h-4">
                {domainStatus === 'unavailable' && <p className="text-[10px] font-bold text-[#FE2C55]">This address is already taken.</p>}
                {domainStatus === 'invalid_length' && <p className="text-[10px] font-bold text-[#FE2C55]">Must be at least 3 characters long.</p>}
                {domainStatus === 'available' && <p className="text-[10px] font-bold text-[#16A34A]">Web address is available!</p>}
                {domainStatus === 'idle' && <p className="text-[10px] text-[#8A8B91]">Lowercase letters, numbers, and hyphens only.</p>}
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} /> Support Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-4 py-3 text-[14px] font-medium text-[#161823] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors"
                  placeholder="hello@store.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-4 py-3 text-[14px] font-medium text-[#161823] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors"
                  placeholder="+256 700..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[#E3E3E4]">
              <button
                type="submit"
                disabled={isSubmitting || !isBasicsValid}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-sm font-bold text-[15px] transition-all shadow-sm ${
                  isSubmitting || !isBasicsValid ? 'bg-[#E3E3E4] text-[#8A8B91] cursor-not-allowed' : 'bg-[#161823] text-white hover:bg-black active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Creating your store…</>) : (<>Continue <ArrowRight size={18} /></>)}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: PROFILE ────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-[13px] text-[#8A8B91]">
              Tell us about <span className="font-bold text-[#161823]">{formData.title}</span>. We use this to design your site — so the more detail, the better.
            </p>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest">About your business <span className="text-[#FE2C55]">*</span></label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-4 py-3 text-[14px] text-[#161823] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors resize-none"
                placeholder="What you offer, what makes you special, who you serve…"
              />
            </div>

            {/* Brand colour */}
            <div>
              <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
                <Palette size={12} /> Brand Color <span className="text-[#FE2C55]">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, themeColor: c })}
                    className={`w-8 h-8 rounded-sm transition-all ${formData.themeColor === c ? 'ring-2 ring-offset-2 ring-[#161823] scale-110' : 'border border-[#E3E3E4] hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Brand color ${c}`}
                  />
                ))}
                <label className="w-8 h-8 rounded-sm border border-dashed border-[#8A8B91] flex items-center justify-center cursor-pointer">
                  <input type="color" value={formData.themeColor} onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })} className="opacity-0 w-0 h-0" />
                  <Palette size={14} className="text-[#8A8B91]" />
                </label>
              </div>
            </div>

            {/* Logo + Banner uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label="Logo" required field="logo" value={formData.logo}
                uploading={uploading.logo} aspect="aspect-square"
                onSelect={(file) => handleUpload('logo', file)}
                onClear={() => setFormData(p => ({ ...p, logo: '' }))}
              />
              <ImageUpload
                label="Banner" required field="banner" value={formData.banner}
                uploading={uploading.banner} aspect="aspect-video"
                onSelect={(file) => handleUpload('banner', file)}
                onClear={() => setFormData(p => ({ ...p, banner: '' }))}
              />
            </div>

            <div className="pt-6 border-t border-[#E3E3E4] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-sm font-bold text-[14px] text-[#161823] bg-[#F8F8F8] hover:bg-[#E3E3E4] transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSubmitting || !isProfileValid}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-sm font-bold text-[15px] transition-all shadow-sm ${
                  isSubmitting || !isProfileValid ? 'bg-[#E3E3E4] text-[#8A8B91] cursor-not-allowed' : 'bg-[#161823] text-white hover:bg-black active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Saving…</>) : (<>Continue <ArrowRight size={18} /></>)}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: DESIGN ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 mx-auto bg-[#161823] rounded-sm flex items-center justify-center">
              <Sparkles className="text-white" size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#161823]">Design your site</h2>
              <p className="text-[14px] text-[#8A8B91] mt-1">
                Your profile is ready. Generate a unique, on-brand {formData.businessType === 'services' ? 'booking' : formData.businessType === 'both' ? 'service + shop' : 'store'} site with AI — or do it later from your dashboard.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={designWithAI}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-sm font-bold text-[15px] bg-[#161823] text-white hover:bg-black active:scale-[0.98] transition-all shadow-sm"
              >
                <Sparkles size={18} /> Design my site with AI
              </button>
              <button
                type="button"
                onClick={skipToDashboard}
                className="w-full px-6 py-3 rounded-sm font-bold text-[13px] text-[#8A8B91] hover:text-[#161823] transition-colors"
              >
                Skip for now — go to dashboard
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <p className="text-[10px] text-center text-[#8A8B91] mt-4 font-medium">
            By continuing, you agree to Ola.ug&apos;s Merchant Terms of Service.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Reusable image-upload tile ────────────────────────────────────────────────
function ImageUpload({ label, value, uploading, aspect, required, onSelect, onClear }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
        <ImageIcon size={12} /> {label} {required && <span className="text-[#FE2C55]">*</span>}
      </label>
      {value ? (
        <div className={`relative ${aspect} w-full border border-[#E3E3E4] rounded-sm overflow-hidden bg-[#F8F8F8]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 hover:bg-white rounded-sm flex items-center justify-center text-[#FE2C55] shadow-sm"
            aria-label={`Remove ${label}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <label className={`relative ${aspect} w-full border-2 border-dashed border-[#E3E3E4] rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#161823] transition-colors bg-[#F8F8F8]`}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }}
          />
          {uploading ? (
            <Loader2 size={20} className="text-[#8A8B91] animate-spin" />
          ) : (
            <>
              <UploadCloud size={20} className="text-[#8A8B91]" />
              <span className="text-[11px] font-semibold text-[#8A8B91] mt-1">Upload {label.toLowerCase()}</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
