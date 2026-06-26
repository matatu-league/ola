"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Truck, Bell, Shield, Save, Smartphone, Building2,
  CheckCircle2, Clock, MapPin, Search, Navigation, Loader2,
  AlertTriangle, Store as StoreIcon, ExternalLink
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const MAPS_LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 };

const TABS = [
  { id: 'payments',      label: 'Payments & Payouts',    icon: CreditCard },
  { id: 'shipping',      label: 'Shipping & Delivery',   icon: Truck },
  { id: 'location',      label: 'Store Location',        icon: MapPin },
  { id: 'hours',         label: 'Business Hours',        icon: Clock },
  { id: 'notifications', label: 'Notifications',         icon: Bell },
  { id: 'security',      label: 'Security & Login',      icon: Shield },
];

const INITIAL_SETTINGS = {
  payoutMethod:           'mobile_money',
  mobileMoneyNumber:      '',
  mobileMoneyName:        '',
  bankAccount:            '',
  bankName:               '',
  payoutSchedule:         'weekly',
  flatRate:               '5000',
  freeShippingThreshold:  '150000',
  internationalShipping:  false,
  emailOrders:            true,
  emailPayouts:           true,
  emailMarketing:         false,
  smsAlerts:              true,
  twoFactorAuth:          false,
  location: {
    isOnlineOnly: false,
    address:      '',
    lat:          DEFAULT_CENTER.lat,
    lng:          DEFAULT_CENTER.lng,
  },
  businessHours: {
    monday:    { isOpen: true,  open: '09:00', close: '18:00' },
    tuesday:   { isOpen: true,  open: '09:00', close: '18:00' },
    wednesday: { isOpen: true,  open: '09:00', close: '18:00' },
    thursday:  { isOpen: true,  open: '09:00', close: '18:00' },
    friday:    { isOpen: true,  open: '09:00', close: '18:00' },
    saturday:  { isOpen: true,  open: '10:00', close: '15:00' },
    sunday:    { isOpen: false, open: '09:00', close: '18:00' },
  },
  googleBusiness: { connected: false, status: 'none' },
};

const FlatToggle = ({ enabled, onChange, label, description, disabled = false, isDanger = false }) => (
  <div className={`flex items-start justify-between py-3 border-b border-gray-200 last:border-0 last:pb-0 ${disabled ? 'opacity-50' : ''}`}>
    <div className="pr-4">
      <h4 className="text-sm font-semibold text-black">{label}</h4>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">Toggle setting</span>
      <div className={`w-9 h-5 rounded-none transition-colors duration-200 ease-in-out ${
        isDanger ? (enabled ? 'bg-red-500' : 'bg-gray-200') : (enabled ? 'bg-blue-600' : 'bg-gray-200')
      }`}>
        <div className={`absolute top-[2px] left-[2px] bg-white rounded-none h-4 w-4 transition-all duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </div>
    </button>
  </div>
);

export default function StoreSettingsPage() {
  const [activeTab,        setActiveTab]        = useState('payments');
  const [isLoading,        setIsLoading]        = useState(true);
  const [isSaving,         setIsSaving]         = useState(false);
  const [isConnectingGBP,  setIsConnectingGBP]  = useState(false);
  const [message,          setMessage]          = useState({ type: '', text: '' });
  const [settings,         setSettings]         = useState(INITIAL_SETTINGS);
  const autocompleteRef = useRef(null);

  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAPS_LIBRARIES,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res    = await fetch('/api/stores', { cache: 'no-store' });
        const result = await res.json();

        if (result.success && result.store) {
          const db  = result.store.settings || {};
          const loc = result.store.location  || {};

          setSettings((prev) => ({
            ...prev,
            payoutMethod:          db.payments?.payoutMethod          || 'mobile_money',
            mobileMoneyNumber:     db.payments?.mobileMoneyNumber     || '',
            mobileMoneyName:       db.payments?.mobileMoneyName       || '',
            bankAccount:           db.payments?.bankAccount           || '',
            bankName:              db.payments?.bankName              || '',
            payoutSchedule:        db.payments?.payoutSchedule        || 'weekly',
            flatRate:              db.shipping?.flatRate?.toString()  || '5000',
            freeShippingThreshold: db.shipping?.freeShippingThreshold?.toString() || '150000',
            internationalShipping: db.shipping?.internationalShipping ?? false,
            emailOrders:           db.notifications?.emailOrders      ?? true,
            emailPayouts:          db.notifications?.emailPayouts      ?? true,
            emailMarketing:        db.notifications?.emailMarketing    ?? false,
            smsAlerts:             db.notifications?.smsAlerts         ?? true,
            twoFactorAuth:         db.security?.twoFactorAuth          ?? false,
            location: {
              isOnlineOnly: loc.isOnlineOnly ?? false,
              address:      loc.address      || '',
              lat:          Number(loc.lat)  || DEFAULT_CENTER.lat,
              lng:          Number(loc.lng)  || DEFAULT_CENTER.lng,
            },
            businessHours:  { ...prev.businessHours,  ...(db.hours          || {}) },
            googleBusiness: { ...prev.googleBusiness, ...(db.googleBusiness || {}) },
          }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setMessage({ type: 'error', text: 'Failed to load settings.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        location: settings.location,
        settings: {
          payments: {
            payoutMethod:      settings.payoutMethod,
            mobileMoneyNumber: settings.mobileMoneyNumber,
            mobileMoneyName:   settings.mobileMoneyName,
            bankAccount:       settings.bankAccount,
            bankName:          settings.bankName,
            payoutSchedule:    settings.payoutSchedule,
          },
          shipping: {
            flatRate:              Number(settings.flatRate),
            freeShippingThreshold: Number(settings.freeShippingThreshold),
            internationalShipping: settings.internationalShipping,
          },
          hours:         settings.businessHours,
          notifications: {
            emailOrders:    settings.emailOrders,
            emailPayouts:   settings.emailPayouts,
            emailMarketing: settings.emailMarketing,
            smsAlerts:      settings.smsAlerts,
          },
          security:       { twoFactorAuth: settings.twoFactorAuth },
          googleBusiness: settings.googleBusiness,
        },
      };

      const res    = await fetch('/api/stores', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error(result.message || 'Failed to save settings.');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleConnectGoogleBusiness = async () => {
    setIsConnectingGBP(true);
    try {
      const res  = await fetch('/api/seller/google-business/auth');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to generate Google login URL.');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to initiate Google connection.' });
      setIsConnectingGBP(false);
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setSettings((prev) => ({
        ...prev,
        location: { ...prev.location, lat: coords.latitude, lng: coords.longitude },
      })),
      (err) => {
        console.error('Location error:', err);
        alert('Unable to detect location. Check browser permissions.');
      },
    );
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setSettings((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          address: place.formatted_address || place.name || '',
          lat:     place.geometry.location.lat(),
          lng:     place.geometry.location.lng(),
        },
      }));
    }
  };

  const handleMarkerDragEnd = (e) => {
    setSettings((prev) => ({
      ...prev,
      location: { ...prev.location, lat: e.latLng.lat(), lng: e.latLng.lng() },
    }));
  };

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const setLocation = (key, value) =>
    setSettings((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));

  const setHour = (day, key, value) =>
    setSettings((prev) => ({
      ...prev,
      businessHours: { ...prev.businessHours, [day]: { ...prev.businessHours[day], [key]: value } },
    }));

  const currentMapPosition = {
    lat: Number(settings.location.lat) || DEFAULT_CENTER.lat,
    lng: Number(settings.location.lng) || DEFAULT_CENTER.lng,
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-black" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10 w-full bg-white text-black min-h-screen p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage payments, shipping, hours, and more.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-none border text-sm font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-red-50 border-red-200 text-red-500'
        }`}>
          {message.type === 'success' && <CheckCircle2 size={16} />}
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 w-full">

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-gray-200 rounded-none overflow-hidden flex flex-row md:flex-col overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors border-b border-gray-200 last:border-0 whitespace-nowrap md:whitespace-normal text-left border-l-4 ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-black border-l-blue-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-black border-l-transparent'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 space-y-6">

          {/* PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <CreditCard size={18} className="text-black" />
                  <h2 className="text-base font-bold">Payout Method</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">Choose how you want to receive your earnings.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { value: 'mobile_money', icon: Smartphone, label: 'Mobile Money', desc: 'MTN MoMo or Airtel Money' },
                    { value: 'bank',         icon: Building2,  label: 'Bank Transfer', desc: 'EFT direct deposit' },
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <div
                      key={value}
                      onClick={() => set('payoutMethod', value)}
                      className={`border rounded-none p-4 cursor-pointer transition-colors ${
                        settings.payoutMethod === value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Icon size={18} className={settings.payoutMethod === value ? 'text-blue-600' : 'text-gray-500'} />
                        {settings.payoutMethod === value && <CheckCircle2 size={16} className="text-blue-600" />}
                      </div>
                      <h4 className="text-sm font-bold text-black">{label}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>

                {settings.payoutMethod === 'mobile_money' && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    {[
                      { label: 'Mobile Money Phone Number', key: 'mobileMoneyNumber', placeholder: 'e.g. +256 770 000 000' },
                      { label: 'Registered Account Name',   key: 'mobileMoneyName',   placeholder: 'e.g. JOHN DOE' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-sm font-semibold text-black mb-1.5 block">{label}</label>
                        <input
                          type="text"
                          value={settings[key]}
                          placeholder={placeholder}
                          onChange={(e) => set(key, e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {settings.payoutMethod === 'bank' && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    {[
                      { label: 'Bank Name',       key: 'bankName',    placeholder: 'e.g. Stanbic Bank' },
                      { label: 'Account Number',  key: 'bankAccount', placeholder: 'e.g. 9030001234567' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="text-sm font-semibold text-black mb-1.5 block">{label}</label>
                        <input
                          type="text"
                          value={settings[key]}
                          placeholder={placeholder}
                          onChange={(e) => set(key, e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Clock size={18} className="text-black" />
                  <h2 className="text-base font-bold">Payout Schedule</h2>
                </div>
                <select
                  value={settings.payoutSchedule}
                  onChange={(e) => set('payoutSchedule', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Every Monday)</option>
                  <option value="biweekly">Bi-weekly (1st & 15th)</option>
                  <option value="monthly">Monthly (1st of Month)</option>
                </select>
              </div>
            </div>
          )}

          {/* SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Truck size={18} className="text-black" />
                  <h2 className="text-base font-bold">Shipping Rules</h2>
                </div>
                <div className="space-y-5">
                  {[
                    { label: 'Flat Rate',               key: 'flatRate',              placeholder: '5000' },
                    { label: 'Free Shipping Threshold', key: 'freeShippingThreshold', placeholder: '150000' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="text-sm font-semibold text-black mb-1.5 block">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">UGX</span>
                        <input
                          type="number"
                          value={settings[key]}
                          placeholder={placeholder}
                          onChange={(e) => set(key, e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-none pl-14 pr-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <FlatToggle
                      label="International Shipping"
                      description="Accept orders from buyers outside Uganda."
                      enabled={settings.internationalShipping}
                      onChange={(val) => set('internationalShipping', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <MapPin size={18} className="text-black" />
                  <h2 className="text-base font-bold">Store Location</h2>
                </div>

                <div className="mb-6">
                  <FlatToggle
                    label="Online Only"
                    description="My store operates fully online with no physical location."
                    enabled={settings.location.isOnlineOnly}
                    onChange={(val) => setLocation('isOnlineOnly', val)}
                  />
                </div>

                {!settings.location.isOnlineOnly && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
                        <div>
                          <label className="text-sm font-semibold text-black block">Pin Location</label>
                          <p className="text-xs text-gray-500 mt-0.5">Drag the marker to your store entrance.</p>
                        </div>
                        <button
                          type="button"
                          onClick={requestBrowserLocation}
                          className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-1.5"
                        >
                          <Navigation size={13} /> Detect My Location
                        </button>
                      </div>

                      <div className="w-full h-64 bg-gray-50 border border-gray-200 rounded-none overflow-hidden relative flex items-center justify-center">
                        {!isMapsLoaded ? (
                          mapsLoadError ? (
                            <div className="text-center p-4 text-red-500 flex flex-col items-center gap-2">
                              <AlertTriangle size={24} />
                              <p className="text-sm font-semibold">Failed to load Google Maps.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Loader2 size={24} className="animate-spin" />
                              <p className="text-sm">Loading map...</p>
                            </div>
                          )
                        ) : (
                          <GoogleMap
                            mapContainerClassName="w-full h-full"
                            center={currentMapPosition}
                            zoom={14}
                            options={{ disableDefaultUI: true, zoomControl: true }}
                          >
                            <Marker
                              position={currentMapPosition}
                              draggable={true}
                              onDragEnd={handleMarkerDragEnd}
                            />
                          </GoogleMap>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        {[
                          { label: 'Latitude',  key: 'lat' },
                          { label: 'Longitude', key: 'lng' },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{label}</span>
                            <div className="w-full bg-gray-50 border border-gray-300 rounded-none px-3 py-1.5 text-xs text-black font-mono select-all">
                              {settings.location[key].toFixed(6)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-black mb-1.5 block">Search Address</label>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        {isMapsLoaded ? (
                          <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={onPlaceChanged}>
                            <input
                              type="text"
                              value={settings.location.address}
                              onChange={(e) => setLocation('address', e.target.value)}
                              placeholder="Search for your store address..."
                              className="w-full bg-gray-50 border border-gray-300 rounded-none pl-9 pr-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                            />
                          </Autocomplete>
                        ) : (
                          <input
                            type="text"
                            value={settings.location.address}
                            onChange={(e) => setLocation('address', e.target.value)}
                            placeholder="Search for your store address..."
                            className="w-full bg-gray-50 border border-gray-300 rounded-none pl-9 pr-3 py-2 text-sm text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Google Business */}
              <div className="bg-white border border-gray-200 p-6 flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-white p-3 rounded-none border border-gray-200 shrink-0">
                  <StoreIcon size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-black">Google Business Profile</h3>
                    {settings.googleBusiness?.connected && (
                      <span className="bg-green-50 text-green-600 border border-green-200 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Connect your store to Google Maps and Search so local customers can find you, leave reviews, and view your catalog.
                  </p>
                  {!settings.googleBusiness?.connected ? (
                    <button
                      type="button"
                      onClick={handleConnectGoogleBusiness}
                      disabled={isConnectingGBP}
                      className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2.5 rounded-none font-semibold text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isConnectingGBP ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                      {isConnectingGBP ? 'Connecting...' : 'Connect Google Business'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button type="button" className="bg-white border border-gray-200 hover:border-black text-black px-5 py-2.5 rounded-none font-semibold text-sm transition-colors">
                        Manage Listing
                      </button>
                      <button type="button" className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HOURS */}
          {activeTab === 'hours' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Clock size={18} className="text-black" />
                  <h2 className="text-base font-bold">Business Hours</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">Set when your store is open so customers know when to reach you.</p>
                <div className="space-y-0">
                  {Object.entries(settings.businessHours).map(([day, schedule]) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 last:border-0 gap-3 sm:gap-0 hover:bg-gray-50 -mx-4 px-4 transition-colors">
                      <div className="flex items-center gap-4 w-36 shrink-0">
                        <button
                          type="button"
                          onClick={() => setHour(day, 'isOpen', !schedule.isOpen)}
                          className="relative inline-flex items-center cursor-pointer"
                        >
                          <span className="sr-only">Toggle {day}</span>
                          <div className={`w-9 h-5 rounded-none transition-colors duration-200 ${
                            schedule.isOpen ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                            <div className={`absolute top-[2px] left-[2px] bg-white rounded-none h-4 w-4 transition-all duration-200 ${
                              schedule.isOpen ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </div>
                        </button>
                        <span className={`text-sm font-semibold capitalize ${schedule.isOpen ? 'text-black' : 'text-gray-500'}`}>
                          {day}
                        </span>
                      </div>

                      {schedule.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.open}
                            onChange={(e) => setHour(day, 'open', e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-none px-2 py-1.5 text-sm font-medium text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none w-[110px]"
                          />
                          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">to</span>
                          <input
                            type="time"
                            value={schedule.close}
                            onChange={(e) => setHour(day, 'close', e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-none px-2 py-1.5 text-sm font-medium text-black focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none w-[110px]"
                          />
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-300 px-3 py-1.5 rounded-none w-[238px] text-center">
                          Closed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Bell size={18} className="text-black" />
                  <h2 className="text-base font-bold">Email Notifications</h2>
                </div>
                <FlatToggle label="New Orders"      description="Get notified when a customer places an order."          enabled={settings.emailOrders}    onChange={(val) => set('emailOrders',    val)} />
                <FlatToggle label="Payout Updates"  description="Get notified when a payout is processed."               enabled={settings.emailPayouts}   onChange={(val) => set('emailPayouts',   val)} />
                <FlatToggle label="Marketing & Tips" description="Weekly tips on how to improve your store performance." enabled={settings.emailMarketing} onChange={(val) => set('emailMarketing', val)} />
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Smartphone size={18} className="text-black" />
                  <h2 className="text-base font-bold">SMS Alerts</h2>
                </div>
                <FlatToggle label="Critical SMS Alerts" description="Get texts for urgent matters like failed payouts or security issues." enabled={settings.smsAlerts} onChange={(val) => set('smsAlerts', val)} />
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Shield size={18} className="text-black" />
                  <h2 className="text-base font-bold">Two-Factor Authentication</h2>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-none mb-5">
                  <p className="text-sm text-yellow-600 font-medium">2FA protects your earnings and customer data from unauthorized access.</p>
                </div>
                <FlatToggle
                  label="Enable Authenticator App"
                  description="Require a code from Google Authenticator or similar when logging in."
                  enabled={settings.twoFactorAuth}
                  onChange={(val) => set('twoFactorAuth', val)}
                />
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-gray-200 pb-3">
                  <Shield size={18} className="text-black" />
                  <h2 className="text-base font-bold">Account Access</h2>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="text-sm font-semibold text-black">TikTok Connection</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Your store is linked to your TikTok identity.</p>
                  </div>
                  <span className="bg-green-50 text-green-600 border border-green-200 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5">Connected</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
