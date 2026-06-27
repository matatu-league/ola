"use client";

import { useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import {
  CheckCircle2, ChevronRight, Edit2, AlertCircle,
  Navigation, Search, Loader2
} from 'lucide-react';

const MAPS_LIBRARIES = ['places'];

export default function AddressStep({ activeStep, shipping, setShipping, shippingError, onContinue, onEdit }) {
  const isActive = activeStep === 2;
  const isDone = activeStep > 2;
  const isLocked = activeStep < 2;

  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAPS_LIBRARIES,
  });
  const autocompleteRef = useRef(null);

  const [isDetectingLocation, setIsDetectingLocation] = [false, () => {}];
  // Use a local state via a trick — we need useState here
  // We pass down the handler from parent instead to keep state in parent
  
  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place?.address_components) return;

    let city = '';
    const address = place.formatted_address || place.name || '';
    for (const c of place.address_components) {
      if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) {
        city = c.long_name;
        break;
      }
    }
    setShipping(prev => ({ ...prev, address, city: city || prev.city }));
  };

  return (
    <div className={`bg-white border rounded-sm transition-all duration-300
      ${isActive ? 'border-[var(--s-text,#161823)] ring-1 ring-[var(--s-primary,#161823)]' : 'border-[var(--s-border,#E3E3E4)]'}
      ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* Header */}
      <div className={`p-4 md:p-5 flex items-center justify-between ${isActive ? 'border-b border-[var(--s-border,#E3E3E4)]' : ''}`}>
        <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${isDone ? 'text-[var(--s-muted,#8A8B91)]' : 'text-[var(--s-text,#161823)]'}`}>
          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${isDone ? 'bg-[#10B981] text-white' : 'bg-[var(--s-primary,#161823)] text-white'}`}>
            {isDone ? <CheckCircle2 size={14} strokeWidth={3} /> : '2'}
          </span>
          Customer Address
        </h3>
        {isDone && (
          <button onClick={onEdit} className="text-[12px] font-bold text-[var(--s-muted,#8A8B91)] hover:text-[var(--s-text,#161823)] flex items-center gap-1.5 bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] hover:border-[var(--s-muted,#8A8B91)] px-3 py-1.5 rounded-sm transition-colors">
            <Edit2 size={12} /> Edit
          </button>
        )}
      </div>

      {/* Active form */}
      {isActive && (
        <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[var(--s-text,#161823)]">Full Name <span className="text-[var(--s-primary,#FE2C55)]">*</span></label>
            <input
              type="text"
              value={shipping.fullName}
              onChange={e => setShipping(p => ({ ...p, fullName: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[var(--s-text,#161823)] transition-colors text-[var(--s-text,#161823)] placeholder:text-[var(--s-muted,#8A8B91)]"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[var(--s-text,#161823)]">Phone Number <span className="text-[var(--s-primary,#FE2C55)]">*</span></label>
            <input
              type="text"
              value={shipping.phoneNumber}
              onChange={e => setShipping(p => ({ ...p, phoneNumber: e.target.value }))}
              placeholder="e.g. +256 700 000000"
              className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[var(--s-text,#161823)] transition-colors text-[var(--s-text,#161823)] placeholder:text-[var(--s-muted,#8A8B91)]"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[12px] font-semibold text-[var(--s-text,#161823)]">
              Address (Street, Building) <span className="text-[var(--s-primary,#FE2C55)]">*</span>
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--s-muted,#8A8B91)] z-10" />
              {isMapsLoaded ? (
                <Autocomplete onLoad={ref => (autocompleteRef.current = ref)} onPlaceChanged={onPlaceChanged}>
                  <input
                    type="text"
                    value={shipping.address}
                    onChange={e => setShipping(p => ({ ...p, address: e.target.value }))}
                    placeholder="Search for your delivery address..."
                    className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm pl-9 pr-3 py-2 text-[13px] text-[var(--s-text,#161823)] focus:border-[var(--s-text,#161823)] focus:bg-white transition-colors outline-none"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  value={shipping.address}
                  onChange={e => setShipping(p => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. Plot 12, Kampala Road"
                  className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm pl-9 pr-3 py-2 text-[13px] text-[var(--s-text,#161823)] focus:border-[var(--s-text,#161823)] transition-colors outline-none"
                />
              )}
            </div>
          </div>

          {/* City */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[12px] font-semibold text-[var(--s-text,#161823)]">City / Town <span className="text-[var(--s-primary,#FE2C55)]">*</span></label>
            <input
              type="text"
              value={shipping.city}
              onChange={e => setShipping(p => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Kampala"
              className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[var(--s-text,#161823)] transition-colors text-[var(--s-text,#161823)] placeholder:text-[var(--s-muted,#8A8B91)]"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[12px] font-semibold text-[var(--s-text,#161823)]">Shipping Instructions <span className="text-[var(--s-muted,#8A8B91)] font-normal">(Optional)</span></label>
            <textarea
              value={shipping.instructions}
              onChange={e => setShipping(p => ({ ...p, instructions: e.target.value }))}
              placeholder="Leave at the front desk, call upon arrival, etc."
              className="w-full bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[var(--s-text,#161823)] transition-colors text-[var(--s-text,#161823)] placeholder:text-[var(--s-muted,#8A8B91)] resize-none h-20"
            />
          </div>

          {shippingError && (
            <div className="md:col-span-2 flex items-center gap-2 text-[12px] text-[var(--s-primary,#FE2C55)] font-semibold bg-[#FFF0F3] border border-[var(--s-primary,#FE2C55)] p-3 rounded-sm">
              <AlertCircle size={14} /> {shippingError}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              onClick={onContinue}
              className="w-full md:w-auto bg-[var(--s-primary,#161823)] hover:bg-black text-white px-5 py-2 rounded-sm font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 tracking-tight"
            >
              Continue to Shipping <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Collapsed summary */}
      {isDone && (
        <div className="px-4 md:px-5 pb-4 pt-4 border-t border-[var(--s-border,#E3E3E4)] ml-9">
          <p className="text-[14px] font-semibold text-[var(--s-text,#161823)] mb-0.5">{shipping.fullName}</p>
          <p className="text-[12px] text-[var(--s-muted,#8A8B91)]">{shipping.city} · {shipping.address} · {shipping.phoneNumber}</p>
        </div>
      )}
    </div>
  );
}
