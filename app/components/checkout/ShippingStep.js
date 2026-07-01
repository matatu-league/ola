"use client";

import { Truck, Clock, Store, Package, CheckCircle2, Edit2, MapPin, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

const ICONS = { Truck, Clock, Store, Package };

export default function ShippingStep({
  activeStep,
  shippingOptions,
  pickupStations,
  shippingMethod,
  setShippingMethod,
  selectedStation,
  setSelectedStation,
  methodError,
  isFetchingConfig,
  onContinue,
  onEdit,
}) {
  const isActive = activeStep === 3;
  const isDone = activeStep > 3;
  const isLocked = activeStep < 3;

  const activeOption = shippingOptions.find(m => m.code === shippingMethod);

  return (
    <div className={`bg-white border rounded-[var(--s-radius,0.125rem)] transition-all duration-300
      ${isActive ? 'border-[var(--s-text,#161823)] ring-1 ring-[var(--s-primary,#161823)]' : 'border-[var(--s-border,#E3E3E4)]'}
      ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* Header */}
      <div className={`p-4 md:p-5 flex items-center justify-between ${isActive ? 'border-b border-[var(--s-border,#E3E3E4)]' : ''}`}>
        <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${isDone ? 'text-[var(--s-muted,#8A8B91)]' : 'text-[var(--s-text,#161823)]'}`}>
          <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${isDone ? 'bg-[#10B981] text-white' : 'bg-[var(--s-primary,#161823)] text-white'}`}>
            {isDone ? <CheckCircle2 size={14} strokeWidth={3} /> : '3'}
          </span>
          Shipping Method
        </h3>
        {isDone && (
          <button onClick={onEdit} className="text-[12px] font-bold text-[var(--s-muted,#8A8B91)] hover:text-[var(--s-text,#161823)] flex items-center gap-1.5 bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] hover:border-[var(--s-muted,#8A8B91)] px-3 py-1.5 rounded-[var(--s-radius,0.125rem)] transition-colors">
            <Edit2 size={12} /> Edit
          </button>
        )}
      </div>

      {/* Active */}
      {isActive && (
        <div className="p-5 md:p-6">
          {isFetchingConfig ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[var(--s-muted,#8A8B91)]" /></div>
          ) : shippingOptions.length === 0 ? (
            <p className="text-[13px] text-[var(--s-muted,#8A8B91)]">No shipping methods configured.</p>
          ) : (
            <>
              <div className="space-y-3">
                {shippingOptions.map(method => {
                  const Icon = ICONS[method.iconName] || Truck;
                  const isSelected = shippingMethod === method.code;
                  return (
                    <div
                      key={method.code}
                      onClick={() => setShippingMethod(method.code)}
                      className={`border rounded-[var(--s-radius,0.125rem)] p-4 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4
                        ${isSelected ? 'border-[var(--s-text,#161823)] bg-[var(--s-surface,#F8F8F8)] ring-1 ring-[var(--s-primary,#161823)]' : 'border-[var(--s-border,#E3E3E4)] bg-white hover:border-[var(--s-text,#161823)]'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-[var(--s-radius,0.125rem)] flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--s-primary,#161823)] text-white' : 'bg-[var(--s-surface,#F8F8F8)] text-[var(--s-muted,#8A8B91)]'}`}>
                          {method.image
                            ? <img src={method.image} alt={method.title} className="w-full h-full object-cover" />
                            : <Icon size={20} />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[var(--s-text,#161823)]">{method.title}</p>
                          <p className="text-[12px] text-[var(--s-muted,#8A8B91)] mt-0.5">{method.description}</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-extrabold text-[var(--s-text,#161823)] shrink-0">
                        {method.price === 0 ? 'FREE' : `UGX ${method.price.toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pickup stations */}
              {shippingMethod === 'pickup' && (
                <div className="mt-4 p-4 border border-[var(--s-border,#E3E3E4)] bg-[var(--s-surface,#F8F8F8)] rounded-[var(--s-radius,0.125rem)] animate-in fade-in duration-200">
                  <p className="text-[12px] font-bold text-[var(--s-text,#161823)] mb-2">Select your nearest station <span className="text-[var(--s-primary,#FE2C55)]">*</span></p>
                  {pickupStations.length === 0
                    ? <p className="text-[12px] text-[var(--s-muted,#8A8B91)]">No pickup stations available.</p>
                    : (
                      <div className="space-y-2">
                        {pickupStations.map(station => {
                          const id = station._id || station.code;
                          return (
                            <label
                              key={id}
                              className={`flex items-start gap-3 p-3 border rounded-[var(--s-radius,0.125rem)] cursor-pointer transition-colors
                                ${selectedStation === id ? 'border-[var(--s-text,#161823)] bg-white ring-1 ring-[var(--s-primary,#161823)]' : 'border-[var(--s-border,#E3E3E4)] bg-white hover:border-[var(--s-text,#161823)]'}`}
                            >
                              <input
                                type="radio"
                                name="station"
                                value={id}
                                checked={selectedStation === id}
                                onChange={e => setSelectedStation(e.target.value)}
                                className="mt-0.5 w-4 h-4 text-[var(--s-text,#161823)] focus:ring-[var(--s-primary,#161823)]"
                              />
                              <div>
                                <p className="text-[13px] font-bold text-[var(--s-text,#161823)] flex items-center gap-1.5">
                                  <MapPin size={13} className="text-[var(--s-muted,#8A8B91)]" /> {station.name}
                                </p>
                                <p className="text-[12px] text-[var(--s-muted,#8A8B91)] mt-0.5">{station.address}, {station.city}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}

              {methodError && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--s-primary,#FE2C55)] font-semibold bg-[#FFF0F3] border border-[var(--s-primary,#FE2C55)] p-3 rounded-[var(--s-radius,0.125rem)] mt-4">
                  <AlertCircle size={14} /> {methodError}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={onContinue}
                  className="w-full md:w-auto bg-[var(--s-primary,#161823)] hover:bg-black text-white px-5 py-2 rounded-[var(--s-radius,0.125rem)] font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 tracking-tight"
                >
                  Continue to Payment <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Collapsed summary */}
      {isDone && activeOption && (
        <div className="px-4 md:px-5 pb-4 pt-4 border-t border-[var(--s-border,#E3E3E4)] ml-9">
          <p className="text-[14px] font-semibold text-[var(--s-text,#161823)] mb-0.5">{activeOption.title}</p>
          <p className="text-[12px] text-[var(--s-muted,#8A8B91)]">
            {shippingMethod === 'pickup'
              ? (() => {
                  const s = pickupStations.find(x => (x._id || x.code) === selectedStation);
                  return s ? `${s.name} — ${s.address}` : 'Pickup selected';
                })()
              : activeOption.price === 0 ? 'FREE' : `UGX ${activeOption.price.toLocaleString()}`
            }
          </p>
        </div>
      )}
    </div>
  );
}
