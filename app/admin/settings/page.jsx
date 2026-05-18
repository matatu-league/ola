"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, Store, CreditCard, Truck, Shield, Bell, Save, 
  Globe, Mail, DollarSign, Percent, Lock, Smartphone, Check, HelpCircle,
  Upload, Plus, Trash2, Image as ImageIcon, Loader2
} from 'lucide-react';

// Import your centralized Firebase library
import { uploadFileToFirebase, deleteFileFromFirebase } from '@/lib/firebaseLib';

export default function MasterSettingsPage() {
  const [activeTab, setActiveTab] = useState('General');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Global state for all settings
  const [formData, setFormData] = useState({
    platformName: '', supportEmail: '', supportPhone: '', maintenanceMode: false,
    storeApprovalRequired: true, maxStoresPerUser: 3, globalCommissionRate: 12.5, minimumPayoutThreshold: 50000,
    baseCurrency: 'UGX', enableMobileMoney: true, enableCreditCards: true, payoutSchedule: 'weekly',
    globalShippingEnabled: true, defaultDomesticRate: 15000, enableInternationalShipping: false, fulfillmentCenters: '',
    require2FAForAdmins: true, sessionTimeout: 120, couriers: [], paymentGateways: []
  });

  // Fetch from Database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (data.success && data.settings) {
          setFormData({
            ...data.settings,
            couriers: data.settings.couriers || [],
            paymentGateways: data.settings.paymentGateways || []
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const menuItems = [
    { id: 'General', icon: Settings, label: 'General Info' },
    { id: 'Vendors', icon: Store, label: 'Vendors & Stores' },
    { id: 'Payments', icon: CreditCard, label: 'Payments & Gateways' },
    { id: 'Shipping', icon: Truck, label: 'Shipping & Couriers' },
    { id: 'Security', icon: Shield, label: 'Security & Access' },
    { id: 'Notifications', icon: Bell, label: 'System Alerts' }
  ];

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (data.success) {
        setFormData(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
      case 'UGX': return 'UGX';
      case 'KES': return 'KSh';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currencyCode;
    }
  };

  // HTML5 Canvas utility to scale down images before uploading to Firebase
  const scaleImage = (file, maxWidth = 400, maxHeight = 400) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert scaled canvas back to a Blob/File
          canvas.toBlob((blob) => {
            if (blob) {
              const scaledFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(scaledFile);
            } else {
              reject(new Error('Canvas serialization failed'));
            }
          }, file.type, 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e, arrayName, itemId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Set item to 'uploading' state temporarily if you wish, 
    // for now we'll just await the upload
    try {
      // 1. Scale down the image client-side
      const scaledFile = await scaleImage(file, 400, 400);

      // 2. Upload using your centralized library function
      // We pass false for isTemp because settings logos are permanent immediately
      const downloadURL = await uploadFileToFirebase(scaledFile, `settings/${arrayName}`, false);

      // 3. Update form state
      setFormData(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].map(item => 
          item.id === itemId ? { ...item, logo: downloadURL } : item
        )
      }));
    } catch (error) {
      console.error(`Failed to upload image for ${arrayName}:`, error);
      alert('Failed to upload image. Please check your connection and Firebase permissions.');
    }
  };

  const addArrayItem = (arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { id: Date.now().toString(), name: '', logo: '', active: true }]
    }));
  };

  const removeArrayItem = async (arrayName, itemId) => {
    // Optionally delete from Firebase if a logo exists!
    const itemToRemove = formData[arrayName].find(item => item.id === itemId);
    if (itemToRemove && itemToRemove.logo) {
      try {
        await deleteFileFromFirebase(itemToRemove.logo);
      } catch (err) {
        console.error('Failed to cleanup file from Firebase:', err);
      }
    }

    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter(item => item.id !== itemId)
    }));
  };

  const toggleArrayItem = (arrayName, itemId) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map(item => 
        item.id === itemId ? { ...item, active: !item.active } : item
      )
    }));
  };

  const handleArrayTextChange = (arrayName, itemId, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map(item => 
        item.id === itemId ? { ...item, name: value } : item
      )
    }));
  };

  const Toggle = ({ active, onClick }) => (
    <button 
      onClick={onClick}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ease-in-out focus:outline-none shrink-0 ${active ? 'bg-[#FE2C55]' : 'bg-[#E3E3E4]'}`}
    >
      <span className={`absolute left-[2px] top-[2px] bg-white w-[18px] h-[18px] rounded-full transition-transform duration-200 ease-in-out shadow-sm ${active ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  );

  const DynamicListManager = ({ title, description, arrayName }) => (
    <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden mt-6">
      <div className="p-5 border-b border-[#E3E3E4] flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[#161823]">{title}</h3>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">{description}</p>
        </div>
        <button 
          onClick={() => addArrayItem(arrayName)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F8F8] hover:bg-[#E3E3E4] border border-[#E3E3E4] rounded text-[13px] font-semibold text-[#161823] transition-colors"
        >
          <Plus size={14} /> Add New
        </button>
      </div>
      <div className="p-5 flex flex-col gap-3">
        {formData[arrayName]?.length === 0 && (
          <div className="text-center py-6 text-[13px] text-[#8A8B91]">
            No items added yet. Click "Add New" to begin.
          </div>
        )}
        {formData[arrayName]?.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-[#F8F8F8] border border-[#E3E3E4] rounded-md transition-colors hover:border-[#161823]/20">
            {/* Image Upload/Preview */}
            <div className="relative group shrink-0">
              <label className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white border border-[#E3E3E4] rounded overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, arrayName, item.id)}
                />
                {item.logo ? (
                  <img src={item.logo} alt={item.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon size={18} className="text-[#8A8B91] group-hover:text-[#161823] transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={14} className="text-white" />
                </div>
              </label>
            </div>
            
            {/* Name Input */}
            <div className="flex-1">
              <input 
                type="text" 
                value={item.name}
                onChange={(e) => handleArrayTextChange(arrayName, item.id, e.target.value)}
                placeholder="Enter name (e.g. DHL, MTN Mobile Money)"
                className="w-full px-3 py-1.5 bg-white border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823]"
              />
            </div>
            
            {/* Status & Actions */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#8A8B91]">{item.active ? 'Active' : 'Inactive'}</span>
                <Toggle active={item.active} onClick={() => toggleArrayItem(arrayName, item.id)} />
              </div>
              <button 
                onClick={() => removeArrayItem(arrayName, item.id)}
                className="p-1.5 text-[#8A8B91] hover:text-[#FE2C55] hover:bg-[#FEE2E2] rounded transition-colors"
                title="Remove Item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-[#8A8B91]">
          <Loader2 size={32} className="animate-spin text-[#161823]" />
          <p className="text-[14px] font-medium">Loading settings framework...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#161823] tracking-tight">Master Settings</h1>
          <p className="text-[14px] text-[#8A8B91] mt-1">Configure global platform rules, gateways, and limits.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-[14px] font-semibold transition-colors ${
            saveSuccess 
              ? 'bg-[#16A34A] text-white'
              : 'bg-[#FE2C55] hover:bg-[#E6284B] text-white disabled:opacity-70'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : (saveSuccess ? <Check size={16} /> : <Save size={16} />)}
          {isSaving ? 'Saving...' : (saveSuccess ? 'Saved Successfully!' : 'Save Changes')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="sticky top-6 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-semibold transition-colors ${
                    isActive 
                      ? 'bg-[#161823] text-white' 
                      : 'text-[#8A8B91] hover:bg-[#F8F8F8] hover:text-[#161823]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-[#8A8B91]'} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Pane */}
        <div className="flex-1 max-w-4xl">
          {activeTab === 'General' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden">
                <div className="p-5 border-b border-[#E3E3E4]">
                  <h3 className="text-[15px] font-semibold text-[#161823]">Platform Identity</h3>
                  <p className="text-[13px] text-[#8A8B91] mt-0.5">Basic information about your marketplace.</p>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#161823] mb-2">Platform Name</label>
                    <input type="text" name="platformName" value={formData.platformName} onChange={handleChange} className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Global Support Email</label>
                      <input type="email" name="supportEmail" value={formData.supportEmail} onChange={handleChange} className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Global Support Phone</label>
                      <input type="tel" name="supportPhone" value={formData.supportPhone} onChange={handleChange} className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden">
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#161823] flex items-center gap-2">
                      Maintenance Mode <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${formData.maintenanceMode ? 'bg-[#FEE2E2] text-[#FE2C55]' : 'bg-[#E6F4EA] text-[#16A34A]'}`}>{formData.maintenanceMode ? 'Active' : 'Off'}</span>
                    </h3>
                    <p className="text-[13px] text-[#8A8B91] mt-1 max-w-xl">Enable this to restrict access to the marketplace for buyers and sellers. Only administrators will be able to log in. Use during major upgrades.</p>
                  </div>
                  <Toggle active={formData.maintenanceMode} onClick={() => handleToggle('maintenanceMode')} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Vendors' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden">
                <div className="p-5 border-b border-[#E3E3E4]">
                  <h3 className="text-[15px] font-semibold text-[#161823]">Store & Vendor Limits</h3>
                  <p className="text-[13px] text-[#8A8B91] mt-0.5">Control how vendors interact with your platform.</p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#161823]">Require Admin Approval</p>
                      <p className="text-[12px] text-[#8A8B91] mt-0.5">New stores must be verified before they can publish products.</p>
                    </div>
                    <Toggle active={formData.storeApprovalRequired} onClick={() => handleToggle('storeApprovalRequired')} />
                  </div>
                  <hr className="border-[#E3E3E4]" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Max Stores per User</label>
                      <input type="number" name="maxStoresPerUser" value={formData.maxStoresPerUser} onChange={handleChange} min="1" className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Global Commission Rate (%)</label>
                      <div className="relative">
                        <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
                        <input type="number" name="globalCommissionRate" value={formData.globalCommissionRate} onChange={handleChange} step="0.1" min="0" max="100" className="w-full pl-8 pr-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Payments' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden">
                <div className="p-5 border-b border-[#E3E3E4]">
                  <h3 className="text-[15px] font-semibold text-[#161823]">Financial Configuration</h3>
                  <p className="text-[13px] text-[#8A8B91] mt-0.5">Base currencies and payout rules.</p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Base Platform Currency</label>
                      <select name="baseCurrency" value={formData.baseCurrency} onChange={handleChange} className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors">
                        <option value="UGX">UGX - Ugandan Shilling</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="RWF">RWF - Rwandan Franc</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="USD">USD - US Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Minimum Payout Threshold</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#8A8B91]">{getCurrencySymbol(formData.baseCurrency)}</span>
                        <input type="number" name="minimumPayoutThreshold" value={formData.minimumPayoutThreshold} onChange={handleChange} min="0" className="w-full pl-12 pr-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Vendor Payout Schedule</label>
                      <select name="payoutSchedule" value={formData.payoutSchedule} onChange={handleChange} className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="manual">Manual Request Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Gateways List */}
              <DynamicListManager 
                title="Payment Gateways" 
                description="Manage available checkout providers (e.g. Flutterwave, Paystack, MTN MoMo)." 
                arrayName="paymentGateways" 
              />
            </div>
          )}

          {activeTab === 'Shipping' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden">
                <div className="p-5 border-b border-[#E3E3E4]">
                  <h3 className="text-[15px] font-semibold text-[#161823]">Delivery Rules</h3>
                  <p className="text-[13px] text-[#8A8B91] mt-0.5">Configure global shipping constraints.</p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#161823]">Enable Global Shipping Infrastructure</p>
                      <p className="text-[12px] text-[#8A8B91] mt-0.5">Allow platform-wide courier options at checkout.</p>
                    </div>
                    <Toggle active={formData.globalShippingEnabled} onClick={() => handleToggle('globalShippingEnabled')} />
                  </div>
                  <hr className="border-[#E3E3E4]" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#161823] mb-2">Default Domestic Base Rate</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#8A8B91]">{getCurrencySymbol(formData.baseCurrency)}</span>
                        <input type="number" name="defaultDomesticRate" value={formData.defaultDomesticRate} onChange={handleChange} className="w-full pl-12 pr-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Couriers List */}
              <DynamicListManager 
                title="Delivery Couriers" 
                description="Manage integrated logistics providers (e.g. DHL, SafeBoda, FedEx)." 
                arrayName="couriers" 
              />
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E3E3E4] rounded-lg overflow-hidden">
                <div className="p-5 border-b border-[#E3E3E4]">
                  <h3 className="text-[15px] font-semibold text-[#161823]">Admin Security</h3>
                  <p className="text-[13px] text-[#8A8B91] mt-0.5">Protect dashboard access.</p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#161823]">Require 2FA for Admin Roles</p>
                      <p className="text-[12px] text-[#8A8B91] mt-0.5">Force two-factor authentication for sensitive accounts.</p>
                    </div>
                    <Toggle active={formData.require2FAForAdmins} onClick={() => handleToggle('require2FAForAdmins')} />
                  </div>
                  <hr className="border-[#E3E3E4]" />
                  <div>
                    <label className="block text-[13px] font-semibold text-[#161823] mb-2">Session Timeout (Minutes)</label>
                    <input type="number" name="sessionTimeout" value={formData.sessionTimeout} onChange={handleChange} min="5" className="w-full max-w-xs px-3 py-2 bg-[#F8F8F8] border border-[#E3E3E4] rounded text-[13px] focus:outline-none focus:border-[#161823] focus:bg-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'Notifications' && (
            <div className="bg-white border border-[#E3E3E4] rounded-lg p-8 text-center">
              <div className="mx-auto w-12 h-12 bg-[#F8F8F8] rounded-full flex items-center justify-center mb-3">
                <Bell size={20} className="text-[#8A8B91]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#161823]">System Alerts Setup</h3>
              <p className="text-[13px] text-[#8A8B91] mt-1 max-w-sm mx-auto">
                Email template customization and push notification rules are managed in the specialized Communications module.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}