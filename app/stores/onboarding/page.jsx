"use client";

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Store, Globe, Loader2, Package,
  CalendarCheck, AlertCircle, XCircle, ChevronDown,
  Mail, Phone, Briefcase
} from 'lucide-react';
import { getCookieRootDomain } from '@/lib/domain';

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
    businessType: 'products', // products, services, both
    industry: '',
    layoutStyle: 'Classic',   
    themeColor: '#161823'     
  });

  const industries = [
    { value: 'electronics', label: 'Electronics & Gadgets' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'home', label: 'Home & Furniture' },
    { value: 'food', label: 'Food & Groceries' },
    { value: 'hotels', label: 'Hotels & Accommodation' },
    { value: 'medical', label: 'Medical & Healthcare' },
    { value: 'automotive', label: 'Automotive & Parts' },
    { value: 'professional', label: 'Professional Services' },
    { value: 'education', label: 'Education & Learning' }
  ];

  // Pre-fill data from session cookie
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
      
      if (sessionCookie) {
        try {
          const rawValue = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
          let decodedValue = decodeURIComponent(rawValue);
          if (decodedValue.startsWith('%7B')) {
            decodedValue = decodeURIComponent(decodedValue);
          }
          const parsed = JSON.parse(decodedValue);
          
          if (parsed.name) {
            const cleanName = parsed.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            setFormData(prev => ({ 
              ...prev, 
              title: `${parsed.name}'s Store`,
              domain: cleanName,
              email: parsed.email || ''
            }));
          }
        } catch (e) {
          console.error("Failed to parse user session for onboarding", e);
        }
      }
    }
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
    formData.industry !== '' && 
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
          
          {/* Business Model Selection */}
          <div>
            <label className="block text-[11px] font-bold text-[#8A8B91] mb-3 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={12} /> Business Model
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'products', label: 'Products', icon: Package },
                { id: 'services', label: 'Services', icon: CalendarCheck },
                { id: 'both', label: 'Both', icon: Store }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, businessType: type.id })}
                  className={`border rounded-sm p-3.5 flex flex-col items-center justify-center transition-all ${
                    formData.businessType === type.id 
                    ? 'border-[#161823] bg-[#F8F8F8] ring-1 ring-[#161823]' 
                    : 'border-[#E3E3E4] hover:border-[#8A8B91]'
                  }`}
                >
                  <type.icon size={18} className={formData.businessType === type.id ? 'text-[#161823]' : 'text-[#8A8B91]'} />
                  <span className={`mt-2 text-[11px] font-bold ${formData.businessType === type.id ? 'text-[#161823]' : 'text-[#8A8B91]'}`}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Industry Selection */}
          <div>
            <label className="block text-[11px] font-bold text-[#8A8B91] mb-2 uppercase tracking-widest flex items-center gap-2">
              <Store size={12} /> Store Industry <span className="text-[#FE2C55]">*</span>
            </label>
            <div className="relative">
              <select 
                required
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-4 pr-10 py-3 text-[14px] font-semibold text-[#161823] appearance-none focus:outline-none focus:border-[#161823] transition-colors cursor-pointer"
              >
                <option value="" disabled>Choose your industry...</option>
                {industries.map((ind) => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8B91] pointer-events-none" size={16} />
            </div>
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