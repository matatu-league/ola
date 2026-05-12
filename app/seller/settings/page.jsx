"use client";

import React, { useState } from 'react';
import { 
  CreditCard, 
  Truck, 
  Bell, 
  Shield, 
  FileText, 
  Save, 
  Smartphone, 
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Custom Flat Toggle Component
const FlatToggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-start justify-between py-3 border-b border-[#E3E3E4] last:border-0 last:pb-0">
    <div className="pr-4">
      <h4 className="text-[13px] font-semibold text-[#161823]">{label}</h4>
      {description && <p className="text-[11px] text-[#8A8B91] mt-0.5">{description}</p>}
    </div>
    <button 
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-200 ease-in-out outline-none ${
        enabled ? 'bg-[#161823] border-[#161823]' : 'bg-[#F8F8F8] border-[#E3E3E4]'
      }`}
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
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock State for Settings
  const [settings, setSettings] = useState({
    // Payments
    payoutMethod: 'mobile_money',
    mobileMoneyNumber: '+256 700 000000',
    mobileMoneyName: 'MATATU ELECTRONICS',
    bankAccount: '',
    bankName: '',
    payoutSchedule: 'weekly',
    
    // Shipping
    flatRate: '5000',
    freeShippingThreshold: '150000',
    internationalShipping: false,
    
    // Notifications
    emailOrders: true,
    emailPayouts: true,
    emailMarketing: false,
    smsAlerts: true,
    
    // Security
    twoFactorAuth: false,
    
    // Business Hours
    businessHours: {
      monday: { isOpen: true, open: '09:00', close: '18:00' },
      tuesday: { isOpen: true, open: '09:00', close: '18:00' },
      wednesday: { isOpen: true, open: '09:00', close: '18:00' },
      thursday: { isOpen: true, open: '09:00', close: '18:00' },
      friday: { isOpen: true, open: '09:00', close: '18:00' },
      saturday: { isOpen: true, open: '10:00', close: '15:00' },
      sunday: { isOpen: false, open: '09:00', close: '18:00' },
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API Call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'payments', label: 'Payments & Payouts', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Login', icon: Shield },
    { id: 'policies', label: 'Store Policies', icon: FileText },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#161823] tracking-tight">Store Settings</h1>
          <p className="text-[13px] text-[#8A8B91] mt-0.5">Manage payments, shipping rules, and security preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          {showSuccess && (
            <span className="text-[12px] font-semibold text-[#16A34A] flex items-center gap-1">
              <CheckCircle2 size={14} /> Saved successfully
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#FE2C55] rounded-sm text-[13px] font-semibold text-white hover:bg-[#e0264b] transition-colors disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[240px] shrink-0">
          <div className="bg-white border border-[#E3E3E4] rounded-sm overflow-hidden flex flex-row md:flex-col overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
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

        {/* Right Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* PAYMENTS SECTION */}
          {activeTab === 'payments' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6 mb-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Payout Method</h3>
                <p className="text-[12px] text-[#8A8B91] mb-5">Choose how you want to receive your earnings from sales.</p>
                
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
                    <p className="text-[11px] text-[#8A8B91] mt-0.5">MTN MoMo or Airtel Money</p>
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
                    <p className="text-[11px] text-[#8A8B91] mt-0.5">Direct to your bank account</p>
                  </div>
                </div>

                {settings.payoutMethod === 'mobile_money' && (
                  <div className="space-y-4 pt-4 border-t border-[#E3E3E4]">
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Mobile Money Number</label>
                      <input 
                        type="text" 
                        value={settings.mobileMoneyNumber}
                        onChange={(e) => setSettings({...settings, mobileMoneyNumber: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Registered Name</label>
                      <input 
                        type="text" 
                        value={settings.mobileMoneyName}
                        onChange={(e) => setSettings({...settings, mobileMoneyName: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Payout Schedule</h3>
                <div>
                  <select 
                    value={settings.payoutSchedule}
                    onChange={(e) => setSettings({...settings, payoutSchedule: e.target.value})}
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] text-[#161823] font-semibold focus:border-[#161823] outline-none"
                  >
                    <option value="daily">Daily (Manual Request)</option>
                    <option value="weekly">Weekly (Every Monday)</option>
                    <option value="biweekly">Bi-weekly (1st & 15th)</option>
                    <option value="monthly">Monthly (1st of month)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING SECTION */}
          {activeTab === 'shipping' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Domestic Shipping Rules</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Default Flat Rate (UGX)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91] text-[13px] font-semibold">UGX</span>
                      <input 
                        type="number" 
                        value={settings.flatRate}
                        onChange={(e) => setSettings({...settings, flatRate: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-12 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-[#8A8B91] mt-1.5">Standard shipping fee charged to customers within the country.</p>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-[#161823] mb-1.5 block">Free Shipping Threshold (UGX)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91] text-[13px] font-semibold">UGX</span>
                      <input 
                        type="number" 
                        value={settings.freeShippingThreshold}
                        onChange={(e) => setSettings({...settings, freeShippingThreshold: e.target.value})}
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-12 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-[#8A8B91] mt-1.5">Orders over this amount automatically get free shipping. Set to 0 to disable.</p>
                  </div>

                  <div className="pt-2">
                    <FlatToggle 
                      label="International Shipping" 
                      description="Allow customers outside your country to place orders. Additional rates apply."
                      enabled={settings.internationalShipping}
                      onChange={(val) => setSettings({...settings, internationalShipping: val})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS HOURS SECTION */}
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
                              value={schedule.open}
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
                              value={schedule.close}
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

          {/* NOTIFICATIONS SECTION */}
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

          {/* SECURITY SECTION */}
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

          {/* POLICIES SECTION */}
          {activeTab === 'policies' && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white border border-[#E3E3E4] rounded-sm p-6">
                <h3 className="text-base font-bold text-[#161823] mb-4">Store Policies</h3>
                <p className="text-[12px] text-[#8A8B91] mb-5">These policies will be displayed to customers during checkout.</p>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[12px] font-semibold text-[#161823] mb-1.5 flex items-center justify-between">
                      Refund Policy 
                      <button className="text-[#FE2C55] font-bold text-[11px]">Generate Template</button>
                    </label>
                    <textarea 
                      rows="4"
                      className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[12px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none resize-none"
                      placeholder="e.g. We accept returns within 14 days of delivery..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="text-[12px] font-semibold text-[#161823] mb-1.5 flex items-center justify-between">
                      Shipping Policy
                    </label>
                    <textarea 
                      rows="4"
                      className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2.5 text-[12px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none resize-none"
                      placeholder="e.g. Orders are processed within 2-3 business days..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}