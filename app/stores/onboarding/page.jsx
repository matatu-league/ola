"use client";

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Store, Globe, Loader2, Package,
  CalendarCheck, AlertCircle, XCircle, ChevronDown,
  Mail, Phone, Briefcase, Search, Check, ShoppingBag,
} from 'lucide-react';
import { getCookieRootDomain, getSessionUser } from '@/lib/domain';

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

export default function StoreOnboarding() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [domainStatus, setDomainStatus] = useState('idle'); // idle, checking, available, unavailable, invalid_length
  const [isDomainDirty, setIsDomainDirty] = useState(false); // Tracks if user has manually overridden the domain

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
    themeColor: '#161823'
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

        // Never silently drop categories: any whose parent isn't a returned
        // top-level category (e.g. service subcategories whose "Services"
        // parent is missing/renamed in the DB) would otherwise vanish from the
        // picker. Gather all such leftovers under a fallback group so every
        // category — including services — is always selectable.
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

  // Choose a category → derive the store mode from its `kind`.
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

  // General store — sells across every category (no single specialization).
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

  // Flattened, search-filtered list for the dropdown.
  const filteredGroups = categoryGroups
    .map(g => {
      const q = catSearch.trim().toLowerCase();
      if (!q) return g;
      const groupHit = g.name.toLowerCase().includes(q);
      const children = groupHit ? g.children : g.children.filter(c => c.name.toLowerCase().includes(q));
      return (groupHit || children.length) ? { ...g, children } : null;
    })
    .filter(Boolean);

  // Pre-fill data from the session cookie — including the phone number the
  // user provided at registration, so service providers don't re-enter it.
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

  // Helper function to generate URL-friendly subdomains
  const generateSubdomain = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters (keep spaces and hyphens)
      .replace(/[\s-]+/g, '-')      // Replace spaces and multiple hyphens with a single hyphen
      .replace(/^-+|-+$/g, '');     // Strip leading and trailing hyphens
  };

  // Real-time domain availability check
  useEffect(() => {
    const checkDomain = async () => {
      const subdomain = formData.domain;
      
      if (!subdomain) {
        setDomainStatus('idle');
        return;
      }
      
      if (subdomain.length < 3) {
        setDomainStatus('invalid_length');
        return;
      }

      setDomainStatus('checking');
      try {
        const baseUrl = window.location.origin;
        const fullDomain = `${subdomain}.ola.ug`;
        const res = await fetch(`${baseUrl}/api/stores/lookup?domain=${fullDomain}`, {
          cache: 'no-store', 
          headers: {
            'ngrok-skip-browser-warning': 'true',
          }
        });
        
        // 404 Not Found means the domain is free to take!
        if (res.status === 404) {
          setDomainStatus('available');
          return;
        }
        
        // If 200 OK, the store exists, so it's unavailable
        if (res.status === 200) {
          setDomainStatus('unavailable');
          return;
        }

        // Fallback parsing
        const result = await res.json();
        setDomainStatus(result.available ? 'available' : 'unavailable');
      } catch (err) {
        setDomainStatus('idle');
      }
    };

    const timer = setTimeout(checkDomain, 600); // Debounce network requests
    return () => clearTimeout(timer);
  }, [formData.domain]);

  // Computed property for strict frontend validation
  const isFormValid = Boolean(
    formData.title.trim().length > 0 &&
    (formData.categoryId !== '' || formData.sellsEverything) &&
    formData.domain.length >= 3 &&
    domainStatus === 'available'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return; 
    
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        domain: `${formData.domain}.ola.ug`
      };

      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // FIX: Update the session cookie immediately before redirecting to prevent loops
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
        
        if (sessionCookie) {
          try {
            const rawValue = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
            let decodedValue = decodeURIComponent(rawValue);
            if (decodedValue.startsWith('%7B')) decodedValue = decodeURIComponent(decodedValue);
            
            const sessionData = JSON.parse(decodedValue);
            sessionData.hasStore = true; // Update flag
            sessionData.domain = payload.domain; // Attach their new domain
            
            // Re-save cookie using the wildcard approach (.ola.ug)
            const hostname = window.location.hostname;
            const rootDomain = getCookieRootDomain(hostname);
            const domainString = hostname.includes('.') ? `domain=.${rootDomain};` : '';
            
            const encoded = encodeURIComponent(JSON.stringify(sessionData));
            document.cookie = `user_session=${encoded}; path=/; max-age=604800; ${domainString} SameSite=Lax`;
          } catch (e) {
            console.error("Failed to update local session cookie", e);
          }
        }

        // Redirect to the new subdomain using a protocol-relative URL to support localhost & production cleanly
        window.location.href = `//${payload.domain}/dashboard`;
      } else {
        setError(result.error || result.message || 'Failed to create store. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('A network error occurred. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white w-full max-w-xl border border-[#E3E3E4] rounded-sm p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-[#161823] rounded-sm flex items-center justify-center mb-4 shadow-sm">
            <Store className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-[#161823] tracking-tight">Launch Your Store</h1>
          <p className="text-[14px] text-[#8A8B91] mt-1">Complete your profile to generate your unique e-commerce site.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-[#FEE2E2] text-[#FE2C55] rounded-sm text-[13px] font-semibold border border-[#FE2C55]/20 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Category Selection — decides store vs. service vs. both */}
          <div>
            <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={12} /> What do you offer? <span className="text-[#FE2C55]">*</span>
            </label>

            {/* Trigger */}
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

            {/* Picker dropdown */}
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
                  {/* General store — sells across every category */}
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
                        {/* Group header — a clear, checkbox-style row that selects
                            the whole parent category. The synthetic "More
                            Categories" group is just a label. */}
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

                        {/* Subcategories */}
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

                  {/* Service categories can also sell physical items → 'both' */}
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
                  // Only auto-populate if the user hasn't manually edited the domain field
                  if (!isDomainDirty) {
                    updates.domain = generateSubdomain(newTitle);
                  }
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
                  setIsDomainDirty(true); // Flag that the user took control of this input
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setFormData({...formData, domain: sanitized})
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
            
            {/* Contextual Error/Success Messages */}
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-4 py-3 text-[14px] font-medium text-[#161823] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors"
                placeholder="+256 700..."
              />
            </div>
          </div>
          
          {/* Submit Action */}
          <div className="pt-6 border-t border-[#E3E3E4]">
            <button 
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-sm font-bold text-[15px] transition-all shadow-sm ${
                isSubmitting || !isFormValid 
                  ? 'bg-[#E3E3E4] text-[#8A8B91] cursor-not-allowed' 
                  : 'bg-[#161823] text-white hover:bg-black active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Launching Your Store...</>
              ) : (
                <><Store size={18} /> Launch Your Store</>
              )}
            </button>
            <p className="text-[10px] text-center text-[#8A8B91] mt-4 font-medium">
              By clicking "Launch Your Store", you agree to Ola.ug's Merchant Terms of Service.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}