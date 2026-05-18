"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Truck, 
  Bell, 
  Shield, 
  Save, 
  Smartphone, 
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Navigation,
  Loader2,
  AlertTriangle,
  Store as StoreIcon,
  ExternalLink
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const API_ENDPOINTS = {
  store: '/api/seller/store',
  googleAuth: '/api/seller/google-business/auth',
};

// Google Maps Configuration libraries needed for Places autocomplete
const MAPS_LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 }; // Kampala, Uganda fallback default

// Custom Flat Toggle Component
const FlatToggle = ({ enabled, onChange, label, description, disabled = false }) => (
  <div className={`flex items-start justify-between py-3 border-b border-[#E3E3E4] last:border-0 last:pb-0 ${disabled ? 'opacity-50' : ''}`}>
    <div className="pr-4">
      <h4 className="text-[13px] font-semibold text-[#161823]">{label}</h4>
      {description && <p className="text-[11px] text-[#8A8B91] mt-0.5">{description}</p>}
    </div>
    <button 
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-200 ease-in-out outline-none ${
        enabled ? 'bg-[#161823] border-[#161823]' : 'bg-[#F8F8F8] border-[#E3E3E4]'
      } ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">Use setting</span>
      <span 
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-sm bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-2' : '-translate-x-2'
        }`} 
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('payments');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingGBP, setIsConnectingGBP] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const autocompleteRef = useRef(null);

  // Load the Google Maps script
  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAPS_LIBRARIES,
  });

  // Comprehensive Flat Settings State (Matches UI)
  const [settings, setSettings] = useState({
    payoutMethod: 'mobile_money',
    mobileMoneyNumber: '',
    mobileMoneyName: '',
    bankAccount: '',
    bankName: '',
    payoutSchedule: 'weekly',
    
    flatRate: '5000',
    freeShippingThreshold: '150000',
    internationalShipping: false,
    
    emailOrders: true,
    emailPayouts: true,
    emailMarketing: false,
    smsAlerts: true,
    
    twoFactorAuth: false,
    
    location: {
      isOnlineOnly: false,
      address: '',
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng
    },
    
    businessHours: {
      monday: { isOpen: true, open: '09:00', close: '18:00' },
      tuesday: { isOpen: true, open: '09:00', close: '18:00' },
      wednesday: { isOpen: true, open: '09:00', close: '18:00' },
      thursday: { isOpen: true, open: '09:00', close: '18:00' },
      friday: { isOpen: true, open: '09:00', close: '18:00' },
      saturday: { isOpen: true, open: '10:00', close: '15:00' },
      sunday: { isOpen: false, open: '09:00', close: '18:00' },
    },

    googleBusiness: {
      connected: false,
      status: 'none'
    }
  });

  // 1. FETCH - Map Nested DB Schema -> Flat UI State
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(API_ENDPOINTS.store, {
          method: 'GET',
          cache: 'no-store', // CRITICAL: Force fresh fetch
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'ngrok-skip-browser-warning': 'true' 
          }
        });
        const result = await response.json();
        
        if (result.success && result.store) {
          const dbSettings = result.store.settings || {};
          const dbLocation = result.store.location || {};
          
          setSettings(prev => ({
            ...prev,
            
            payoutMethod: dbSettings.payments?.payoutMethod || 'mobile_money',
            mobileMoneyNumber: dbSettings.payments?.mobileMoneyNumber || '',
            mobileMoneyName: dbSettings.payments?.mobileMoneyName || '',
            bankAccount: dbSettings.payments?.bankAccount || '',
            bankName: dbSettings.payments?.bankName || '',
            payoutSchedule: dbSettings.payments?.payoutSchedule || 'weekly',
            
            flatRate: dbSettings.shipping?.flatRate?.toString() || '5000',
            freeShippingThreshold: dbSettings.shipping?.freeShippingThreshold?.toString() || '150000',
            internationalShipping: dbSettings.shipping?.internationalShipping ?? false,
            
            emailOrders: dbSettings.notifications?.emailOrders ?? true,
            emailPayouts: dbSettings.notifications?.emailPayouts ?? true,
            emailMarketing: dbSettings.notifications?.emailMarketing ?? false,
            smsAlerts: dbSettings.notifications?.smsAlerts ?? true,
            
            twoFactorAuth: dbSettings.security?.twoFactorAuth ?? false,
            
            location: {
              isOnlineOnly: dbLocation.isOnlineOnly ?? false,
              address: dbLocation.address || '',
              lat: Number(dbLocation.lat) || DEFAULT_CENTER.lat,
              lng: Number(dbLocation.lng) || DEFAULT_CENTER.lng,
            },
            
            businessHours: {
              ...prev.businessHours,
              ...(dbSettings.hours || {})
            },

            googleBusiness: {
              ...prev.googleBusiness,
              ...(dbSettings.googleBusiness || {})
            }
          }));
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setMessage({ type: 'error', text: 'Failed to fetch settings from server.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // 2. PUT - Map Flat UI State -> Nested DB Schema
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        location: {
          isOnlineOnly: settings.location.isOnlineOnly,
          address: settings.location.address,
          lat: settings.location.lat,
          lng: settings.location.lng,
        },
        settings: {
          payments: {
            payoutMethod: settings.payoutMethod,
            mobileMoneyNumber: settings.mobileMoneyNumber,
            mobileMoneyName: settings.mobileMoneyName,
            bankAccount: settings.bankAccount,
            bankName: settings.bankName,
            payoutSchedule: settings.payoutSchedule,
          },
          shipping: {
            flatRate: Number(settings.flatRate),
            freeShippingThreshold: Number(settings.freeShippingThreshold),
            internationalShipping: settings.internationalShipping,
          },
          hours: settings.businessHours,
          notifications: {
            emailOrders: settings.emailOrders,
            emailPayouts: settings.emailPayouts,
            emailMarketing: settings.emailMarketing,
            smsAlerts: settings.smsAlerts,
          },
          security: {
            twoFactorAuth: settings.twoFactorAuth,
          },
          googleBusiness: settings.googleBusiness
        }
      };

      const response = await fetch(API_ENDPOINTS.store, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Store configurations saved successfully!' });
      } else {
        throw new Error(result.message || 'Failed to update store configurations.');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'A transmission error occurred.' });
    } finally {
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  // Google Business Auth Trigger
  const handleConnectGoogleBusiness = async () => {
    setIsConnectingGBP(true);
    try {
      const response = await fetch(API_ENDPOINTS.googleAuth);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        throw new Error("Failed to generate Google Login URL");
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to initiate Google connection.' });
      setIsConnectingGBP(false);
    }
  };

  // Browser Geolocation API Handler
  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser software.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings(prev => ({
          ...prev,
          location: {
            ...prev.location,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
      },
      (error) => {
        console.error("Location request blocked/failed:", error);
        alert("Unable to grab device location. Verify permission settings.");
      }
    );
  };

  // Google Autocomplete Change Target
  const onAutocompleteLoad = (autocompleteInstance) => {
    autocompleteRef.current = autocompleteInstance;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        setSettings(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: place.formatted_address || place.name || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        }));
      }
    }
  };

  // Marker Drag End Handling
  const handleMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSettings(prev => ({
      ...prev,
      location: { ...prev.location, lat, lng }
    }));
  };

  const tabs = [
    { id: 'payments', label: 'Payments & Payouts', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'location', label: 'Store Location', icon: MapPin },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Login', icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#161823]" size={32} />
      </div>
    );
  }

  const currentMapPosition = {
    lat: Number(settings.location.lat) || DEFAULT_CENTER.lat,
    lng: Number(settings.location.lng) || DEFAULT_CENTER.lng
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Store Settings</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage backoffice adjustments, operational hours, and logistical logic.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#FE2C55] rounded-sm text-[13px] font-semibold text-white hover:bg-[#e0264b] transition-colors disabled:opacity-70 shrink-0"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Message Banners */}
      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-sm text-[13px] font-semibold border flex items-center gap-2 ${
          message.type === 'success' ? 'bg-[#E6F4EA] text-[#16A34A] border-[#16A34A]/20' : 'bg-[#FEE2E2] text-[#FE2C55] border-[#FE2C55]/20'
        }`}>
          {message.type === 'success' && <CheckCircle2 size={16} />}
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 w-full">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-[240px] shrink-0">
          <div className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden flex flex-row md:flex-col overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 text-[13px] font-semibold transition-colors border-b border-[#E3E3E4] last:border-0 whitespace-nowrap md:whitespace-normal text-left
                  ${activeTab === tab.id 
                    ? 'bg-[#F8F8F8] text-[#161823] border-l-2 border-l-[#161823]' 
                    : 'bg-white text-[#8A8B91] hover:bg-[#F8F8F8] hover:text-[#161823] border-l-2 border-l-transparent'
                  }
                `}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-[#161823]' : 'text-[#8A8B91]'} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configurations Dynamic Screen */}
        <div className="flex-1 space-y-6">
          
          {/* PAYMENTS PANEL */}
          {activeTab === 'payments' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Payout Method</h3>
                <p className="text-[12px] text-[#8A8B91] mb-5">Select your primary vector to safely collect accrued marketplace performance capital.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div 
                    onClick={() => setSettings({...settings, payoutMethod: 'mobile_money'})}
                    className={`border rounded-sm p-4 cursor-pointer transition-colors ${
                      settings.payoutMethod === 'mobile_money' ? 'border-[#161823] bg-[#F8F8F8]' : 'border-[#E3E3E4] hover:border-[#8A8B91]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Smartphone size={18} className={settings.payoutMethod === 'mobile_money' ? 'text-[#161823]' : 'text-[#8A8B91]'} />
                      {settings.payoutMethod === 'mobile_money' && <CheckCircle2 size={16} className="text-[#161823]" />}
                    </div>
                    <h4 className="text-[13px] font-bold text-[#161823]">Mobile Money</h4>
                    <p className="text-[11px] text-[#8A8B91] mt-0.5">MTN MoMo or Airtel Money payouts</p>
                  </div>
                  
                  <div 
                    onClick={() => setSettings({...settings, payoutMethod: 'bank'})}
                    className={`border rounded-sm p-4 cursor-pointer transition-colors ${
                      settings.payoutMethod === 'bank' ? 'border-[#161823] bg-[#F8F8F8]' : 'border-[#E3E3E4] hover:border-[#8A8B91]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Building2 size={18} className={settings.payoutMethod === 'bank' ? 'text-[#161823]' : 'text-[#8A8B91]'} />
                      {settings.payoutMethod === 'bank' && <CheckCircle2 size={16} className="text-[#161823]" />}
                    </div>
                    <h4 className="text-[13px] font-bold text-[#161823]">Bank Transfer</h4>
                    <p className="text-[11px] text-[#8A8B91] mt-0.5">EFT direct deposit routing</p>
                  </div>
                </div>

                {settings.payoutMethod === 'mobile_money' && (
                  <div className="space-y-4 pt-4 border-t border-[#E3E3E4]">
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Mobile Money Phone Line</label>
                      <input 
                        type="text" 
                        value={settings.mobileMoneyNumber || ''}
                        placeholder="e.g. +256 770 000 000"
                        onChange={(e) => setSettings({...settings, mobileMoneyNumber: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Registered Account Legal Name</label>
                      <input 
                        type="text" 
                        value={settings.mobileMoneyName || ''}
                        placeholder="e.g. JOHN DOE ENTERPRISES"
                        onChange={(e) => setSettings({...settings, mobileMoneyName: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                  </div>
                )}

                {settings.payoutMethod === 'bank' && (
                  <div className="space-y-4 pt-4 border-t border-[#E3E3E4]">
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Bank Corporate Identity Name</label>
                      <input 
                        type="text" 
                        value={settings.bankName || ''}
                        placeholder="e.g. Stanbic Bank, Absa Bank"
                        onChange={(e) => setSettings({...settings, bankName: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Account Serial Number</label>
                      <input 
                        type="text" 
                        value={settings.bankAccount || ''}
                        placeholder="e.g. 9030001234567"
                        onChange={(e) => setSettings({...settings, bankAccount: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Payout Release Schedule</h3>
                <select 
                  value={settings.payoutSchedule || 'weekly'}
                  onChange={(e) => setSettings({...settings, payoutSchedule: e.target.value})}
                  className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] font-semibold focus:border-[#161823] outline-none"
                >
                  <option value="daily">Daily (Manual Performance Claims Request)</option>
                  <option value="weekly">Weekly Automated Run (Every Monday)</option>
                  <option value="biweekly">Bi-weekly Scheduled Execution (1st & 15th)</option>
                  <option value="monthly">Monthly Full Reconciliation Cycle (1st of Month)</option>
                </select>
              </div>
            </div>
          )}

          {/* SHIPPING PANEL */}
          {activeTab === 'shipping' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Logistics Rules</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Standard Baseline Flat Rate</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91] text-[13px] font-semibold">UGX</span>
                      <input 
                        type="number" 
                        value={settings.flatRate || ''}
                        placeholder="5000"
                        onChange={(e) => setSettings({...settings, flatRate: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-14 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Free Shipping Threshold Trigger Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91] text-[13px] font-semibold">UGX</span>
                      <input 
                        type="number" 
                        value={settings.freeShippingThreshold || ''}
                        placeholder="150000"
                        onChange={(e) => setSettings({...settings, freeShippingThreshold: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-14 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <FlatToggle 
                      label="International Cross-Border Fulfillment" 
                      description="Accept order pipelines generated by web buyers localized outside national borders."
                      enabled={settings.internationalShipping}
                      onChange={(val) => setSettings({...settings, internationalShipping: val})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STORE LOCATION PANEL */}
          {activeTab === 'location' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Physical Deployment & Geolocation</h3>
                
                <div className="mb-6">
                  <FlatToggle 
                    label="Purely Digital / Online Operation"
                    description="I execute completely online without customer-facing physical outlets or fulfillment warehouses."
                    enabled={settings.location.isOnlineOnly}
                    onChange={(val) => setSettings({
                      ...settings, 
                      location: { ...settings.location, isOnlineOnly: val }
                    })}
                  />
                </div>

                {!settings.location.isOnlineOnly && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Interactive Map Interface */}
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
                        <div>
                          <label className="text-[12px] font-semibold text-[#161823] block">Precision Pin Location</label>
                          <p className="text-[11px] text-[#8A8B91] mt-0.5">Drag the active map marker pin directly to your warehouse/shop entrance.</p>
                        </div>
                        <button
                          type="button"
                          onClick={requestBrowserLocation}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#E3E3E4] bg-white rounded-sm text-[12px] font-semibold text-[#161823] hover:bg-[#F8F8F8] transition-colors whitespace-nowrap"
                        >
                          <Navigation size={13} /> Detect Device Location
                        </button>
                      </div>

                      {/* Google Maps Viewport Wrapper */}
                      <div className="w-full h-64 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm overflow-hidden relative flex items-center justify-center">
                        {!isMapsLoaded ? (
                          mapsLoadError ? (
                            <div className="text-center p-4 text-[#FE2C55] flex flex-col items-center gap-2">
                              <AlertTriangle size={24} />
                              <p className="text-[12px] font-semibold">Google Maps environment loading failure.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-[#8A8B91]">
                              <Loader2 size={24} className="animate-spin" />
                              <p className="text-[12px]">Initializing Map API Engine...</p>
                            </div>
                          )
                        ) : (
                          <GoogleMap
                            mapContainerClassName="w-full h-full"
                            center={currentMapPosition}
                            zoom={14}
                            options={{
                              disableDefaultUI: true,
                              zoomControl: true,
                              streetViewControl: false
                            }}
                          >
                            <Marker
                              position={currentMapPosition}
                              draggable={true}
                              onDragEnd={handleMarkerDragEnd}
                            />
                          </GoogleMap>
                        )}
                      </div>

                      {/* Explicit Coordinate Debug Display */}
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8B91] block mb-1">Geographic Latitude</span>
                          <div className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-1.5 text-[12px] text-[#161823] font-mono select-all">
                            {settings.location.lat.toFixed(6)}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8B91] block mb-1">Geographic Longitude</span>
                          <div className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-1.5 text-[12px] text-[#161823] font-mono select-all">
                            {settings.location.lng.toFixed(6)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Places Autocomplete Input */}
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Search Structural Address</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]">
                          <Search size={14} />
                        </span>
                        
                        {isMapsLoaded ? (
                          <Autocomplete
                            onLoad={onAutocompleteLoad}
                            onPlaceChanged={onPlaceChanged}
                          >
                            <input 
                              type="text" 
                              value={settings.location.address || ''}
                              onChange={(e) => setSettings({
                                ...settings,
                                location: { ...settings.location, address: e.target.value }
                              })}
                              placeholder="Type complex layout details, street numbers, town centers, regions..."
                              className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-9 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                            />
                          </Autocomplete>
                        ) : (
                          <input 
                            type="text" 
                            value={settings.location.address || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              location: { ...settings.location, address: e.target.value }
                            })}
                            placeholder="Type complex layout details, street numbers, town centers, regions..."
                            className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-9 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                          />
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Google Business Registration Promotion (Restored Design) */}
              <div className="bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-6 shadow-sm flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-white p-3 rounded-full border border-[#E3E3E4] shrink-0 drop-shadow-sm">
                  <StoreIcon size={24} className="text-[#4285F4]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#161823]">Google Business Profile</h3>
                    {settings.googleBusiness?.connected && (
                      <span className="text-[10px] font-bold text-[#16A34A] bg-[#E6F4EA] px-2 py-0.5 rounded-sm border border-[#16A34A]/20 uppercase tracking-wider">
                        Connected ({settings.googleBusiness.status})
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#8A8B91] mt-1 mb-4 leading-relaxed">
                    Connect your store to Google Maps and Google Search. This helps local customers find your business easily, leave reviews, and view your catalog directly from search results.
                  </p>
                  
                  {!settings.googleBusiness?.connected ? (
                    <button 
                      type="button"
                      onClick={handleConnectGoogleBusiness}
                      disabled={isConnectingGBP}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E3E3E4] hover:border-[#161823] text-[13px] font-semibold text-[#161823] rounded-sm transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {isConnectingGBP ? <Loader2 size={14} className="animate-spin" /> : null}
                      {isConnectingGBP ? 'Connecting...' : 'Setup Google Business'} 
                      {!isConnectingGBP && <ExternalLink size={14} />}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                       <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E3E3E4] hover:border-[#161823] text-[12px] font-semibold text-[#161823] rounded-sm transition-colors shadow-sm">
                         Manage Listing
                       </button>
                       <button type="button" className="text-[12px] font-bold text-[#FE2C55] hover:underline">
                         Disconnect
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS HOURS PANEL */}
          {activeTab === 'hours' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Store Open Hours</h3>
                <p className="text-[12px] text-[#8A8B91] mb-5">Set your regular business hours. This lets customers know when you're available to process orders and respond to messages.</p>
                
                <div className="space-y-0">
                  {Object.entries(settings.businessHours).map(([day, schedule]) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-[#E3E3E4] last:border-0 gap-3 sm:gap-0 hover:bg-[#F8F8F8] -mx-4 px-4 transition-colors">
                      <div className="flex items-center gap-4 w-[140px] shrink-0">
                        <button 
                          type="button"
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              businessHours: {
                                ...prev.businessHours,
                                [day]: { ...schedule, isOpen: !schedule.isOpen }
                              }
                            }));
                          }}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-200 ease-in-out outline-none ${
                            schedule.isOpen ? 'bg-[#161823] border-[#161823]' : 'bg-[#E3E3E4] border-[#E3E3E4]'
                          }`}
                        >
                          <span 
                            className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-sm bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              schedule.isOpen ? 'translate-x-1.5' : '-translate-x-1.5'
                            }`} 
                          />
                        </button>
                        <span className={`text-[13px] font-semibold capitalize ${schedule.isOpen ? 'text-[#161823]' : 'text-[#8A8B91]'}`}>{day}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {schedule.isOpen ? (
                          <>
                            <input 
                              type="time" 
                              value={schedule.open || ''}
                              onChange={(e) => {
                                setSettings(prev => ({
                                  ...prev,
                                  businessHours: {
                                    ...prev.businessHours,
                                    [day]: { ...schedule, open: e.target.value }
                                  }
                                }));
                              }}
                              className="bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[12px] font-medium text-[#161823] focus:border-[#161823] outline-none w-[110px]"
                            />
                            <span className="text-[#8A8B91] text-[11px] font-semibold uppercase tracking-wider">to</span>
                            <input 
                              type="time" 
                              value={schedule.close || ''}
                              onChange={(e) => {
                                setSettings(prev => ({
                                  ...prev,
                                  businessHours: {
                                    ...prev.businessHours,
                                    [day]: { ...schedule, close: e.target.value }
                                  }
                                }));
                              }}
                              className="bg-white border border-[#E3E3E4] rounded-sm px-2 py-1.5 text-[12px] font-medium text-[#161823] focus:border-[#161823] outline-none w-[110px]"
                            />
                          </>
                        ) : (
                          <div className="text-[12px] font-semibold text-[#8A8B91] bg-[#F8F8F8] border border-[#E3E3E4] px-3 py-1.5 rounded-sm w-[238px] text-center">
                            Closed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS PANEL (Restored fully) */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Email Notifications</h3>
                <div className="space-y-1">
                  <FlatToggle 
                    label="New Orders" 
                    description="Receive an email whenever a customer places a new order."
                    enabled={settings.emailOrders}
                    onChange={(val) => setSettings({...settings, emailOrders: val})}
                  />
                  <FlatToggle 
                    label="Payout Updates" 
                    description="Get notified when a payout is processed to your account."
                    enabled={settings.emailPayouts}
                    onChange={(val) => setSettings({...settings, emailPayouts: val})}
                  />
                  <FlatToggle 
                    label="Marketing & Tips" 
                    description="Receive weekly tips on how to improve your store sales."
                    enabled={settings.emailMarketing}
                    onChange={(val) => setSettings({...settings, emailMarketing: val})}
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 mt-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">SMS Alerts</h3>
                <FlatToggle 
                  label="Critical SMS Alerts" 
                  description="Get text messages for urgent matters like account security or failed payouts."
                  enabled={settings.smsAlerts}
                  onChange={(val) => setSettings({...settings, smsAlerts: val})}
                />
              </div>
            </div>
          )}

          {/* SECURITY PANEL (Restored fully) */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 mb-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Two-Factor Authentication</h3>
                <div className="bg-[#FFFBEB] border border-[#FCD34D] p-4 rounded-sm mb-5">
                  <p className="text-[12px] text-[#92400E] font-medium">Adding 2FA protects your earnings and customer data from unauthorized access.</p>
                </div>
                <FlatToggle 
                  label="Enable App Authenticator" 
                  description="Require a code from an app like Google Authenticator when logging in."
                  enabled={settings.twoFactorAuth}
                  onChange={(val) => setSettings({...settings, twoFactorAuth: val})}
                />
              </div>

              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Account Access</h3>
                <div className="flex items-center justify-between py-3 border-b border-[#E3E3E4]">
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#161823]">TikTok Connection</h4>
                    <p className="text-[11px] text-[#8A8B91] mt-0.5">Your store is linked to your TikTok identity.</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#16A34A] bg-[#E6F4EA] px-2 py-1 rounded-sm border border-[#16A34A]/20">Connected</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
