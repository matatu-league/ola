"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Copy, MessageSquare, ShieldCheck, 
  MapPin, ShoppingCart, Inbox, User, LogOut, LayoutDashboard, 
  Loader2, Package, CreditCard, Store, Info, MoreHorizontal,
  FileText, CheckCircle2, History, DollarSign
} from 'lucide-react';

// ==========================================
// 0. BUYER TOP NAV (Reused for completeness)
// ==========================================
const BuyerTopNav = () => {
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
      if (sessionCookie) {
        try {
          let decoded = decodeURIComponent(sessionCookie.substring(sessionCookie.indexOf('=') + 1));
          if (decoded.startsWith('%7B')) decoded = decodeURIComponent(decoded);
          setUser(JSON.parse(decoded));
        } catch (e) {}
      }
    }
  }, []);

  return (
    <header className="bg-white flex flex-col w-full z-50 border-b border-gray-200 shrink-0">
      <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between gap-6 lg:gap-10">
        <div className="shrink-0 cursor-pointer select-none">
          <a href="/"><span className="text-3xl font-extrabold text-[#FE2C55] tracking-tighter">Ola<span className="text-gray-900">.com</span></span></a>
        </div>
        <div className="shrink-0 flex items-center gap-5 lg:gap-7">
          <div className="hidden lg:flex items-center gap-2 cursor-pointer group">
            <MapPin size={18} className="text-gray-400 group-hover:text-[#FE2C55]" />
            <div className="flex flex-col"><span className="text-[10px] text-gray-500 leading-none mb-0.5">Deliver to</span><span className="text-[12px] font-bold text-gray-900 leading-none">Uganda</span></div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group relative py-2" onMouseEnter={() => setShowAccountMenu(true)} onMouseLeave={() => setShowAccountMenu(false)}>
            {user?.avatar ? <img src={user.avatar} className="w-6 h-6 rounded-full border border-gray-200 object-cover" /> : <User size={22} className="text-gray-700 group-hover:text-[#FE2C55]" />}
            <div className="hidden md:flex flex-col"><span className="text-[10px] text-gray-500 leading-none mb-0.5">{user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign In'}</span><span className="text-[12px] font-bold text-gray-900 flex items-center leading-none">Account <ChevronRight size={12} className="ml-0.5 rotate-90" /></span></div>
            {showAccountMenu && (
              <div className="absolute top-full right-0 w-64 bg-white border border-gray-200 shadow-xl py-2 z-50">
                {user && (
                  <div className="py-2">
                    <a href="/seller/dashboard" className="px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2"><LayoutDashboard size={14} /> My Seller Portal</a>
                  </div>
                )}
              </div>
            )}
          </div>
          <a href="/messages" className="flex flex-col items-center cursor-pointer group">
            <MessageSquare size={22} className="text-gray-700 group-hover:text-[#FE2C55]" /><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Messages</span>
          </a>
          <a href="/orders" className="flex flex-col items-center cursor-pointer relative">
            <Inbox size={22} className="text-[#FE2C55]" /><span className="text-[11px] font-bold text-[#FE2C55] mt-1 hidden md:block">Orders</span>
          </a>
          <div className="flex flex-col items-center cursor-pointer group relative">
            <ShoppingCart size={22} className="text-gray-700 group-hover:text-[#FE2C55]" /><span className="text-[11px] font-medium text-gray-700 mt-1 hidden md:block">Cart</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// MAIN ORDER DETAILS PAGE
// ==========================================
export default function OrderDetailsPage() {
  
  // Mock Data mimicking the screenshot
  const orderData = {
    id: "217216550501024429",
    date: "2024-07-11 18:46:08",
    status: "Waiting for payment",
    amountDue: "56.00",
    supplier: {
      name: "Linyi Polaris International Trade Co., Ltd.",
      contactName: "Jenkin zhang",
      phone: "15318239157",
      email: "davidzhang@chinapolaris.com",
      address: "CN, Shandong, Linyi, Zhupan Village, Baishabu"
    },
    product: {
      name: "Semi-automatic Welding Machine MIG-350 MIG/Lift TIG/MMA Flux Welding 3 in 1 Gasless MIG Welding No reviews yet",
      specs: "Power: 4500W, Input Voltage: 220V, Duty Cycle: 60%, Welding Process: Flux Core (FCAW), For Material Type: Steel",
      unitPrice: "55.0000",
      quantity: "1.00",
      total: "55.00",
      image: "https://s.alicdn.com/@sc04/kf/H75677d704bb945d7a8d5db3214b7ec80j.jpg_120x120.jpg"
    },
    shipping: {
      status: "Waiting for supplier to ship",
      address: "黄莉子 +86 18975747906, 飞翔国际供应链, 深圳市宝安区福海街道宝祥和工业区第二栋一楼101-102仓, Shenzhen, Guangdong Province, 518101, China",
      shipFrom: "CN 🇨🇳",
      method: "Express",
      incoterms: "EXW"
    },
    payment: {
      itemSubtotal: "55.00",
      shippingFee: "1.00",
      subtotal: "56.00",
      total: "56.00"
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-sans">
      <BuyerTopNav />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
          <a href="/" className="hover:text-[#FE2C55]">Home</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard" className="hover:text-[#FE2C55]">My Ola</a>
          <span className="text-gray-300">/</span>
          <a href="/orders" className="hover:text-[#FE2C55]">Order Management</a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">Order details</span>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-[24px] font-extrabold text-gray-900 mb-3 tracking-tight">Order details</h1>
          <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-gray-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <span>Order number:</span>
                <ShieldCheck size={14} className="text-[#FF9900] fill-[#FF9900]/20" />
                <span className="font-bold text-gray-900">#{orderData.id}</span>
                <button className="text-blue-600 hover:underline">Copy</button>
              </div>
              <div>Order Date: {orderData.date}</div>
            </div>
            <button className="text-blue-600 hover:underline font-medium">Download details</button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-10 px-4 md:px-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -z-10 -translate-y-1/2"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
              <div className="w-4 h-4 rounded-full bg-gray-900 ring-4 ring-white"></div>
              <span className="text-[13px] font-bold text-gray-900">Order</span>
            </div>
            
            <div className="flex-1 h-[2px] bg-gray-900 z-0 relative top-[-10px]"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
              <div className="w-4 h-4 rounded-full bg-gray-900 ring-4 ring-white"></div>
              <span className="text-[13px] font-bold text-gray-900">Payment</span>
            </div>

            <div className="flex-1 h-[2px] bg-gray-200 z-0 relative top-[-10px]"></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
              <div className="w-4 h-4 rounded-full bg-gray-300 ring-4 ring-white"></div>
              <span className="text-[13px] text-gray-400">Dispatch</span>
            </div>

            <div className="flex-1 h-[2px] bg-gray-200 z-0 relative top-[-10px]"></div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
              <div className="w-4 h-4 rounded-full bg-gray-300 ring-4 ring-white"></div>
              <span className="text-[13px] text-gray-400">Delivery</span>
            </div>

            <div className="flex-1 h-[2px] bg-gray-200 z-0 relative top-[-10px]"></div>

            {/* Step 5 */}
            <div className="flex flex-col items-center gap-2 bg-white px-2 z-10">
              <div className="w-4 h-4 rounded-full bg-gray-300 ring-4 ring-white"></div>
              <span className="text-[13px] text-gray-400">Review</span>
            </div>
          </div>
        </div>

        {/* Status & Actions Box */}
        <div className="py-8 border-b border-gray-200">
          <h2 className="text-[18px] font-extrabold text-gray-900 mb-4">{orderData.status}</h2>
          
          <div className="bg-[#F8F9FA] rounded-md p-4 mb-4 space-y-2 text-[13px] text-gray-800">
            <div className="flex items-start gap-2">
              <FileText size={16} className="text-gray-500 shrink-0 mt-0.5" />
              <span>
                Keep production on schedule and prevent quality issues by applying for <a href="#" className="text-blue-600 hover:underline">inspection and production monitoring services</a>
                <span className="inline-flex gap-1 ml-2 opacity-60">🛡️ 📦 🔍</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-gray-500 shrink-0" />
              <span>Your payment amount: <strong className="text-gray-900 text-[14px]">USD {orderData.amountDue}</strong></span>
            </div>
          </div>

          <div className="text-[12px] text-gray-500 space-y-1 mb-6">
            <p>1. If you are concerned about the order terms or Trade Assurance terms (shown below), please contact your supplier to modify the order.</p>
            <p>2. Please make sure to make payment to the bank account designated by Ola.com to get protection from Ola.com.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="bg-[#E04006] hover:bg-[#c93905] text-white text-[13px] font-bold px-6 py-2.5 rounded-full transition-colors">
              Make payment
            </button>
            <button className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-[13px] font-bold px-6 py-2.5 rounded-full transition-colors">
              Request modification
            </button>
            <button className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-[13px] font-bold px-6 py-2.5 rounded-full transition-colors">
              Cancel order
            </button>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="py-8 border-b border-gray-200 overflow-hidden">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-gray-500" /> Product details
          </h3>
          
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 text-[13px]">
            <div className="flex items-center gap-1 text-gray-600">
              Sold by: <a href="#" className="font-bold text-gray-900 hover:underline">{orderData.supplier.name}</a>
            </div>
            <button className="flex items-center gap-1.5 font-bold text-gray-800 hover:text-black">
              <MessageSquare size={16} /> Chat now
            </button>
          </div>

          {/* Product Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 text-[12px] font-bold text-gray-500 pb-3 border-b border-gray-100 mb-4">
            <div className="col-span-5">Product name</div>
            <div className="col-span-3">Spec/Specs</div>
            <div className="col-span-2">Unit price</div>
            <div className="col-span-1">Quantity</div>
            <div className="col-span-1 text-right">Total</div>
          </div>

          {/* Product Item Row */}
          <div className="flex flex-col md:grid md:grid-cols-12 gap-4 text-[13px] text-gray-800 items-start mb-6">
            <div className="col-span-5 flex gap-4">
              <div className="w-16 h-16 bg-[#F8F9FA] rounded border border-gray-100 overflow-hidden shrink-0">
                <img src={orderData.product.image} className="w-full h-full object-cover mix-blend-multiply" alt="Product"/>
              </div>
              <div className="leading-snug">{orderData.product.name}</div>
            </div>
            <div className="col-span-3 text-gray-500 text-[12px] flex items-start gap-2">
              <SettingsIcon />
              <span className="leading-snug">{orderData.product.specs}</span>
            </div>
            <div className="col-span-2">USD {orderData.product.unitPrice} /Sets</div>
            <div className="col-span-1">{orderData.product.quantity}</div>
            <div className="col-span-1 text-right font-medium">USD {orderData.product.total}</div>
          </div>

          {/* Product Summary */}
          <div className="flex items-center justify-end gap-6 pt-4 border-t border-gray-100 text-[13px] text-gray-800">
            <span>Product Quantity: <strong className="font-bold text-gray-900">{orderData.product.quantity}</strong></span>
            <span>Total Price: <strong className="font-extrabold text-[15px] text-gray-900">USD {orderData.product.total}</strong></span>
          </div>
        </div>

        {/* Shipment Details Section */}
        <div className="py-8 border-b border-gray-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TruckIcon /> Shipment details
          </h3>

          <div className="bg-[#F8F9FA] px-4 py-3 rounded-md flex items-center justify-between text-[13px] font-bold text-gray-900 mb-6">
            {orderData.shipping.status}
            <button className="text-gray-600 hover:text-black flex items-center gap-1 font-medium transition-colors">
              Track shipment(s) <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[13px]">
            <div className="md:col-span-1">
              <div className="font-bold text-gray-900 mb-2">Shipping address</div>
              <div className="text-gray-600 leading-relaxed max-w-[250px] break-words">
                {orderData.shipping.address}
              </div>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Ship from</div>
              <div className="text-gray-600">{orderData.shipping.shipFrom}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Shipping method</div>
              <div className="text-gray-600">{orderData.shipping.method}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Incoterms and duties</div>
              <div className="text-gray-600 flex items-center gap-1">
                {orderData.shipping.incoterms} <Info size={14} className="text-gray-400"/>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="py-8 border-b border-gray-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard size={18} className="text-gray-500" /> Payment details
          </h3>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left: Status */}
            <div className="flex-1">
              <div className="font-bold text-[13px] text-gray-900 mb-2">Payment status</div>
              <div className="text-[13px] text-gray-800 mb-3">Full payment (USD {orderData.payment.total})</div>
              
              <div className="border-l-2 border-gray-200 pl-3 py-1 text-[12px] text-gray-400 mb-6 italic">
                No payment record yet
              </div>

              <div className="flex items-center gap-2">
                <button className="bg-white border border-gray-300 text-gray-800 text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
                  Payment history
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:text-black transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Right: Summary */}
            <div className="flex-1 bg-[#F8F9FA] rounded-md p-5 text-[13px]">
              <div className="font-bold text-gray-900 mb-4">Summary</div>
              
              <div className="space-y-3 mb-4 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Item subtotal</span>
                  <span className="font-medium text-gray-900">USD {orderData.payment.itemSubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping fee</span>
                  <span className="font-medium text-gray-900">USD {orderData.payment.shippingFee}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900">Subtotal</span>
                <span className="font-bold text-gray-900">USD {orderData.payment.subtotal}</span>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="font-extrabold text-[14px] text-gray-900">Total *</span>
                <span className="font-extrabold text-[16px] text-gray-900">USD {orderData.payment.total}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                * A payment processing fee may be charged upon completion of each payment depending on the method
              </p>
            </div>
          </div>
        </div>

        {/* Supplier Details Section */}
        <div className="py-8 border-b border-gray-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store size={18} className="text-gray-500" /> Supplier details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 text-[13px]">
            <div>
              <div className="font-bold text-gray-900 mb-2">Supplier</div>
              <div className="text-gray-600 mb-2">{orderData.supplier.name}</div>
              <a href="#" className="text-blue-600 font-medium hover:underline">Visit store</a>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Contact name</div>
              <div className="text-gray-600 mb-2">{orderData.supplier.contactName}</div>
              <a href="#" className="text-blue-600 font-medium hover:underline">Chat now</a>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Company phone number</div>
              <div className="text-gray-600">{orderData.supplier.phone}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Company email</div>
              <div className="text-gray-600 break-all">{orderData.supplier.email}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-2">Company address</div>
              <div className="text-gray-600 leading-snug">{orderData.supplier.address}</div>
            </div>
          </div>
        </div>

        {/* Order Protection Section */}
        <div className="py-8 border-b border-gray-200">
          <h3 className="text-[16px] font-bold text-gray-900 mb-5 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#FF9900]" /> Ola.com order protection
          </h3>

          <div className="space-y-4">
            <ProtectionItem 
              title="Secure payments" 
              desc="Every payment you make on Ola.com is secured with strict SSL encryption and PCI DSS data protection protocols"
            />
            <ProtectionItem 
              title="On-time Dispatch Guarantee" 
              desc="Dispatched within 60 days of payment or receive a 10% delay compensation"
            />
            <ProtectionItem 
              title="Money-back protection" 
              desc="Claim a refund if your order doesn't ship, is missing, or arrives with product issues"
            />
            <ProtectionItem 
              title="24/7 support" 
              desc="Access our virtual help center 24/7 or connect with live agents for assistance"
            />
            <div>
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-900 mb-1">
                <CheckCircle2 size={14} className="text-[#00A651]" /> Data privacy
              </div>
              <div className="text-[12px] text-gray-600 pl-5">
                Your data privacy is protected across Ola.com with built-in security <a href="#" className="text-blue-600 hover:underline">View details</a>
              </div>
              <div className="text-[11px] text-gray-400 pl-5 mt-1 flex items-center gap-1">
                Only orders placed and paid through Ola.com can enjoy free protection by <ShieldCheck size={12} className="text-[#FF9900] fill-[#FF9900]/20" /> <strong className="text-gray-700">Trade Assurance</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Add Services Card */}
        <div className="py-8 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-[13px] text-gray-900 mb-1">
              <FileText size={16} className="text-gray-500" />
              Production Monitoring & Inspection Services
              <span className="flex gap-1 text-[14px]">🛡️ 📦 🔍</span>
            </div>
            <div className="text-[12px] text-gray-600 mb-2">To help reduce risks in production delay and product conformity</div>
            <div className="text-[11px] text-gray-400 italic">
              * Please make sure to select and pay for the service at least <strong className="text-gray-600">7 working days before the shipment date</strong>.
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <button className="bg-white border border-gray-900 text-gray-900 font-bold px-6 py-2 rounded-full text-[13px] hover:bg-gray-50 transition-colors mb-1">
              Add services
            </button>
            <div className="text-[11px] text-gray-500">as low as <strong className="text-gray-900 text-[13px]">USD 48.00</strong></div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-4 py-8 mb-10">
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-800 px-6 py-2.5 rounded-full text-[13px] font-bold hover:bg-gray-50 transition-colors">
            <History size={16} /> Operation history
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-800 px-6 py-2.5 rounded-full text-[13px] font-bold hover:bg-gray-50 transition-colors">
            <FileText size={16} /> View contract
          </button>
        </div>

      </main>
    </div>
  );
}

// Subcomponent for Order Protection list items
const ProtectionItem = ({ title, desc }) => (
  <div>
    <div className="flex items-center gap-2 text-[13px] font-bold text-gray-900 mb-1">
      <CheckCircle2 size={14} className="text-[#00A651]" /> {title}
    </div>
    <div className="text-[12px] text-gray-600 pl-5">
      {desc} <a href="#" className="text-blue-600 hover:underline">View details</a>
    </div>
  </div>
);

// Custom SVG Icons
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mt-0.5 shrink-0">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  );
}