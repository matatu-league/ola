"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { 
  CheckCircle2, ChevronRight, ShoppingCart,
  CreditCard, Smartphone, Banknote, ShieldCheck,
  Loader2, AlertCircle, Truck, Store, Clock, 
  MapPin, Package, Edit2, Phone, Mail, Navigation, Search
} from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function getCookieValue(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function setWildcardCookie(name, value) {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  const domainString = hostname.includes('.') ? `domain=.${rootDomain};` : '';
  document.cookie = `${name}=${value}; path=/; max-age=604800; ${domainString} SameSite=Lax`;
}

const ICONS = {
  Truck: Truck,
  Clock: Clock,
  Store: Store,
  Package: Package,
  Smartphone: Smartphone,
  CreditCard: CreditCard,
  Banknote: Banknote
};

const MAPS_LIBRARIES = ['places'];

export default function CheckoutClient() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  // App State
  const [user, setUser] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  // Checkout Configuration
  const [shippingOptions, setShippingOptions] = useState([]);
  const [pickupStations, setPickupStations] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [supportInfo, setSupportInfo] = useState({ email: 'support@alxlite.com', phoneNumber: '+256 800 123 456' });
  const [isFetchingConfig, setIsFetchingConfig] = useState(true);
  
  // Form State
  const [shipping, setShipping] = useState({ fullName: '', phoneNumber: '', address: '', city: '', instructions: '' });
  const [shippingError, setShippingError] = useState('');
  
  const [shippingMethod, setShippingMethod] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [methodError, setMethodError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Google Maps Loader
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAPS_LIBRARIES,
  });
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Restore User
    const raw = getCookieValue('user_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw.startsWith('%7B') ? decodeURIComponent(raw) : raw);
        console.log('=======', parsed);
        
        setUser(parsed);
        setShipping(prev => ({ 
          ...prev, 
          fullName: parsed.name || '',
          phoneNumber: parsed.phoneNumber || prev.phoneNumber
        }));
        setActiveStep(2);
      } catch (e) { console.error('Cookie parse error', e); }
    }

    // Fetch Global Settings
    const fetchCheckoutConfig = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        
        if (json.success && json.data) {
          const settings = json.data;
          
          const activeShipping = (settings.shippingMethods || []).filter(m => m.active);
          const activeStations = (settings.pickupStations || []).filter(s => s.active);
          const activePayments = (settings.paymentMethods || []).filter(m => m.active);
          
          setShippingOptions(activeShipping);
          setPickupStations(activeStations);
          setPaymentOptions(activePayments);
          setSupportInfo({
            email: settings.supportEmail || 'support@alxlite.com',
            phoneNumber: settings.supportPhone || '+256 800 123 456'
          });
          
          if (activeShipping.length > 0) setShippingMethod(activeShipping[0].code);
          if (activePayments.length > 0) setPaymentMethod(activePayments[0].code);
        }
      } catch (error) {
        console.error('Failed to fetch checkout config:', error);
      } finally {
        setIsFetchingConfig(false);
      }
    };

    fetchCheckoutConfig();
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: firebaseUser.uid, name: firebaseUser.displayName, 
          email: firebaseUser.email, avatar: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        const sessionData = { 
          id: data.user.id, 
          name: data.user.name, 
          email: data.user.email, 
          avatar: data.user.avatar,
          phoneNumber: data.user.phoneNumber || ''
        };
        setWildcardCookie('user_session', encodeURIComponent(JSON.stringify(sessionData)));
        setUser(sessionData);
        setShipping(prev => ({ 
          ...prev, 
          fullName: sessionData.name,
          phoneNumber: sessionData.phoneNumber || prev.phoneNumber
        }));
        setActiveStep(2);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.address_components) {
        let city = '';
        const address = place.formatted_address || place.name || '';
        
        for (const component of place.address_components) {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
            break;
          }
        }
        
        setShipping(prev => ({
          ...prev,
          address: address,
          city: city || prev.city
        }));
      }
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
    
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (!isMapsLoaded || !window.google) {
          alert('Map services are not loaded yet. Please try again.');
          setIsDetectingLocation(false);
          return;
        }

        try {
          const geocoder = new window.google.maps.Geocoder();
          const response = await geocoder.geocode({ 
            location: { lat: coords.latitude, lng: coords.longitude } 
          });

          if (response.results && response.results[0]) {
            const place = response.results[0];
            let city = '';
            
            for (const component of place.address_components) {
              if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
                break;
              }
            }
            
            setShipping(prev => ({
              ...prev,
              address: place.formatted_address,
              city: city || prev.city
            }));
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          alert('Could not resolve your location address.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.error('Location error:', err);
        alert('Unable to detect location. Check browser permissions.');
        setIsDetectingLocation(false);
      }
    );
  };

  const validateShipping = () => {
    if (!shipping.fullName || !shipping.phoneNumber || !shipping.address || !shipping.city) {
      setShippingError("Please fill in all required shipping details.");
      return false;
    }
    setShippingError("");
    return true;
  };

  const validateShippingMethod = () => {
    if (shippingMethod === 'pickup' && !selectedStation) {
      setMethodError("Please select a pickup station.");
      return false;
    }
    setMethodError("");
    return true;
  };

  const handlePlaceOrder = async () => {
    setGeneralError('');

    if (!validateShipping()) {
      setActiveStep(2); 
      return;
    }
    if (!validateShippingMethod()) {
      setActiveStep(3);
      return;
    }
    if (!user) {
      setGeneralError("Please sign in to place an order.");
      setActiveStep(1);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const activeMethod = shippingOptions.find(m => m.code === shippingMethod);
      const currentShippingFee = activeMethod?.price || 0;
      const finalAmount = cartTotal + currentShippingFee;

      let orderInstructions = shipping.instructions ? `Note: ${shipping.instructions}. ` : '';
      if (shippingMethod === 'pickup') {
        const station = pickupStations.find(s => (s._id === selectedStation || s.code === selectedStation));
        orderInstructions += `| Fulfillment: Pickup Station at ${station?.name} (${station?.address})`;
      } else {
        orderInstructions += `| Fulfillment: ${activeMethod?.title || 'Standard Shipping'}`;
      }

      const orderItems = cartItems.map(item => ({
        product: item.product._id,
        storeId: item.product.storeId,
        name: item.product.title,
        image: item.product.images?.[0] || '',
        price: item.priceAtAddition,
        quantity: item.quantity,
        variants: item.variants || {}
      }));

      const payload = {
        user: user.id,
        items: orderItems,
        shippingAddress: {
          fullName: shipping.fullName,
          phoneNumber: shipping.phoneNumber,
          addressLine1: shipping.address,
          city: shipping.city,
          country: 'Uganda',
          additionalInstructions: orderInstructions
        },
        shippingMethod: activeMethod?.code || 'standard',
        ...(shippingMethod === 'pickup' && selectedStation ? { pickupStationId: selectedStation } : {}),
        subTotal: cartTotal,
        shippingFee: currentShippingFee,
        totalAmount: finalAmount,
        paymentMethod: paymentMethod
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place order');
      }

      clearCart();
      router.push(`/checkout/success?orderId=${data.data._id}`);

    } catch (error) {
      console.error('Checkout Error:', error);
      setGeneralError(error.message || 'An error occurred during checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 flex flex-col items-center text-center bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-24 h-24 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm flex items-center justify-center mb-6">
          <ShoppingCart size={32} className="text-[#8A8B91]" />
        </div>
        <h2 className="text-[18px] font-bold text-[#161823] mb-2 tracking-tight">Your cart is empty</h2>
        <p className="text-[#8A8B91] mb-8 text-[13px]">Looks like you haven't added anything to your cart yet.</p>
        <button onClick={() => router.push('/')} className="bg-[#161823] hover:bg-black text-white px-6 py-2 rounded-sm font-semibold text-[13px] transition-colors tracking-tight">
          Continue Shopping
        </button>
      </div>
    );
  }

  const currentShippingFee = shippingOptions.find(m => m.code === shippingMethod)?.price || 0;
  const grandTotal = cartTotal + currentShippingFee;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12 pt-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {generalError && (
            <div className="flex items-center gap-2 text-[13px] text-[#FE2C55] font-semibold bg-[#FFF0F3] border border-[#FE2C55] p-4 rounded-sm">
              <AlertCircle size={16} />
              {generalError}
            </div>
          )}

          {/* STEP 1: AUTHENTICATION */}
          <div className={`bg-white border rounded-sm transition-all duration-300 ${activeStep === 1 ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4]'}`}>
            <div className={`p-4 md:p-5 flex items-center justify-between bg-white ${activeStep === 1 ? 'border-b border-[#E3E3E4]' : ''} rounded-t-sm`}>
              <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${activeStep > 1 ? 'text-[#8A8B91]' : 'text-[#161823]'}`}>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${activeStep > 1 ? 'bg-[#10B981] text-white' : 'bg-[#161823] text-white'}`}>
                  {activeStep > 1 ? <CheckCircle2 size={14} strokeWidth={3} /> : '1'}
                </span>
                Account Details
              </h3>
            </div>
            
            {activeStep === 1 ? (
              <div className="p-5 md:p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full text-center md:text-left">
                  <h4 className="text-[15px] font-bold text-[#161823] mb-1.5 tracking-tight">Sign in to checkout</h4>
                  <p className="text-[12px] text-[#8A8B91] mb-5 font-medium">Log in to use your saved addresses, track your order, and earn rewards.</p>
                  <button 
                    onClick={handleGoogleLogin} 
                    disabled={isAuthLoading}
                    className="flex items-center justify-center gap-2 w-full md:w-auto bg-white border border-[#E3E3E4] hover:bg-[#F8F8F8] hover:border-[#161823] text-[#161823] rounded-sm px-5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 tracking-tight mx-auto md:mx-0"
                  >
                    {isAuthLoading ? <Loader2 size={16} className="animate-spin text-[#8A8B91]" /> : (
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g>
                      </svg>
                    )}
                    Continue with Google
                  </button>
                </div>
              </div>
            ) : (
              user && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 bg-white rounded-b-sm border-t border-[#E3E3E4] pt-4 ml-[2.25rem]">
                  <h4 className="text-[15px] text-[#161823] mb-1">{user.name}</h4>
                  <p className="text-[13px] text-[#8A8B91]">
                    {user.email} {user.phoneNumber ? `| ${user.phoneNumber}` : ''}
                  </p>
                </div>
              )
            )}
          </div>

          {/* STEP 2: CUSTOMER ADDRESS */}
          <div className={`bg-white border rounded-sm transition-all duration-300 ${activeStep === 2 ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4]'} ${activeStep < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className={`p-4 md:p-5 flex items-center justify-between bg-white ${activeStep === 2 ? 'border-b border-[#E3E3E4]' : ''} rounded-t-sm`}>
              <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${activeStep > 2 ? 'text-[#8A8B91]' : 'text-[#161823]'}`}>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${activeStep > 2 ? 'bg-[#10B981] text-white' : 'bg-[#161823] text-white'}`}>
                  {activeStep > 2 ? <CheckCircle2 size={14} strokeWidth={3} /> : '2'}
                </span>
                Customer Address
              </h3>
              {activeStep > 2 && (
                <button onClick={() => setActiveStep(2)} className="text-[12px] font-bold text-[#8A8B91] hover:text-[#161823] transition-colors flex items-center gap-1.5 bg-[#F8F8F8] border border-[#E3E3E4] hover:border-[#8A8B91] px-3 py-1.5 rounded-sm">
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>

            {activeStep === 2 ? (
              <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#161823]">Full Name <span className="text-[#FE2C55]">*</span></label>
                  <input 
                    type="text" 
                    value={shipping.fullName} 
                    onChange={e => setShipping({...shipping, fullName: e.target.value})} 
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823] placeholder:text-[#8A8B91]" 
                    placeholder="e.g. John Doe" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#161823]">Phone Number <span className="text-[#FE2C55]">*</span></label>
                  <input 
                    type="text" 
                    value={shipping.phoneNumber} 
                    onChange={e => setShipping({...shipping, phoneNumber: e.target.value})} 
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823] placeholder:text-[#8A8B91]" 
                    placeholder="e.g. +256 700 000000" 
                  />
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-semibold text-[#161823] block">Address (Street, Building) <span className="text-[#FE2C55]">*</span></label>
                    <button
                      type="button"
                      onClick={requestBrowserLocation}
                      disabled={isDetectingLocation}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#161823] hover:text-[#FE2C55] transition-colors disabled:opacity-50"
                    >
                      {isDetectingLocation ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                      {isDetectingLocation ? 'Detecting...' : 'Use my location'}
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8B91]" />
                    {isMapsLoaded ? (
                      <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={onPlaceChanged}>
                        <input
                          type="text"
                          value={shipping.address}
                          onChange={(e) => setShipping({...shipping, address: e.target.value})}
                          placeholder="Search for your delivery address..."
                          className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-9 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        value={shipping.address}
                        onChange={(e) => setShipping({...shipping, address: e.target.value})}
                        placeholder="e.g. Plot 12, Kampala Road"
                        className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm pl-9 pr-3 py-2 text-[13px] text-[#161823] focus:border-[#161823] focus:bg-white transition-colors outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-semibold text-[#161823]">City / Town <span className="text-[#FE2C55]">*</span></label>
                  <input 
                    type="text" 
                    value={shipping.city} 
                    onChange={e => setShipping({...shipping, city: e.target.value})} 
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823] placeholder:text-[#8A8B91]" 
                    placeholder="e.g. Kampala" 
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-semibold text-[#161823]">Shipping Instructions (Optional)</label>
                  <textarea 
                    value={shipping.instructions} 
                    onChange={e => setShipping({...shipping, instructions: e.target.value})} 
                    className="w-full bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm px-3 py-2 text-[13px] outline-none focus:border-[#161823] transition-colors text-[#161823] placeholder:text-[#8A8B91] resize-none h-20" 
                    placeholder="Leave at the front desk, call upon arrival, etc." 
                  />
                </div>
                
                {shippingError && (
                  <div className="md:col-span-2 flex items-center gap-2 text-[12px] text-[#FE2C55] font-semibold bg-[#FFF0F3] border border-[#FE2C55] p-3 rounded-sm mt-2">
                    <AlertCircle size={14} />
                    {shippingError}
                  </div>
                )}

                <div className="md:col-span-2 mt-2 flex justify-end">
                  <button 
                    onClick={() => {
                      if (validateShipping()) setActiveStep(3);
                    }}
                    className="w-full md:w-auto bg-[#161823] hover:bg-black text-white px-5 py-2 rounded-sm font-semibold text-[13px] transition-colors flex justify-center items-center gap-2 tracking-tight"
                  >
                    Continue to Shipping Options <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              activeStep > 2 && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 bg-white rounded-b-sm border-t border-[#E3E3E4] pt-4 ml-[2.25rem]">
                  <h4 className="text-[15px] text-[#161823] mb-1">{shipping.fullName}</h4>
                  <p className="text-[13px] text-[#8A8B91]">
                    {shipping.city} | {shipping.address} | {shipping.phoneNumber}
                  </p>
                </div>
              )
            )}
          </div>

          {/* STEP 3: SHIPPING METHOD */}
          <div className={`bg-white border rounded-sm transition-all duration-300 ${activeStep === 3 ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4]'} ${activeStep < 3 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className={`p-4 md:p-5 flex items-center justify-between bg-white ${activeStep === 3 ? 'border-b border-[#E3E3E4]' : ''} rounded-t-sm`}>
              <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${activeStep > 3 ? 'text-[#8A8B91]' : 'text-[#161823]'}`}>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${activeStep > 3 ? 'bg-[#10B981] text-white' : 'bg-[#161823] text-white'}`}>
                  {activeStep > 3 ? <CheckCircle2 size={14} strokeWidth={3} /> : '3'}
                </span>
                Shipping Method
              </h3>
              {activeStep > 3 && (
                <button onClick={() => setActiveStep(3)} className="text-[12px] font-bold text-[#8A8B91] hover:text-[#161823] transition-colors flex items-center gap-1.5 bg-[#F8F8F8] border border-[#E3E3E4] hover:border-[#8A8B91] px-3 py-1.5 rounded-sm">
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>

            {activeStep === 3 ? (
              <div className="p-5 md:p-6">
                {isFetchingConfig ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 size={24} className="animate-spin text-[#8A8B91]" />
                  </div>
                ) : shippingOptions.length === 0 ? (
                   <p className="text-[13px] text-[#8A8B91]">No shipping methods configured yet.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {shippingOptions.map((method) => {
                        const Icon = ICONS[method.iconName] || Truck;
                        const isSelected = shippingMethod === method.code;
                        
                        return (
                          <div 
                            key={method.code}
                            onClick={() => setShippingMethod(method.code)}
                            className={`border rounded-sm p-4 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${isSelected ? 'border-[#161823] bg-[#F8F8F8] ring-1 ring-[#161823]' : 'border-[#E3E3E4] bg-white hover:border-[#161823]'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 overflow-hidden ${isSelected ? 'bg-[#161823] text-white' : 'bg-[#F8F8F8] text-[#8A8B91]'}`}>
                                {method.image ? (
                                  <img src={method.image} alt={method.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Icon size={20} />
                                )}
                              </div>
                              <div>
                                <h4 className={`text-[13px] font-bold text-[#161823]`}>{method.title}</h4>
                                <p className="text-[12px] text-[#8A8B91] mt-0.5">{method.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[13px] font-extrabold tracking-tight text-[#161823]`}>
                                {method.price === 0 ? 'FREE' : `UGX ${method.price.toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {shippingMethod === 'pickup' && (
                      <div className="mt-4 p-4 border border-[#E3E3E4] bg-[#F8F8F8] rounded-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="text-[12px] font-bold text-[#161823] block mb-2">Select your nearest station <span className="text-[#FE2C55]">*</span></label>
                        {pickupStations.length === 0 ? (
                          <p className="text-[12px] text-[#8A8B91]">No pickup stations available.</p>
                        ) : (
                          <div className="space-y-2">
                            {pickupStations.map((station) => {
                              const stationId = station._id || station.code;
                              return (
                                <label 
                                  key={stationId} 
                                  className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${selectedStation === stationId ? 'border-[#161823] bg-white ring-1 ring-[#161823]' : 'border-[#E3E3E4] bg-white hover:border-[#161823]'}`}
                                >
                                  <div className="pt-0.5">
                                    <input 
                                      type="radio" 
                                      name="station" 
                                      value={stationId} 
                                      checked={selectedStation === stationId}
                                      onChange={(e) => setSelectedStation(e.target.value)}
                                      className="w-4 h-4 text-[#161823] focus:ring-[#161823]"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[13px] font-bold text-[#161823] flex items-center gap-1.5">
                                      <MapPin size={14} className="text-[#8A8B91]" /> {station.name}
                                    </p>
                                    <p className="text-[12px] text-[#8A8B91] mt-0.5">{station.address}, {station.city}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {methodError && (
                      <div className="flex items-center gap-2 text-[12px] text-[#FE2C55] font-semibold bg-[#FFF0F3] border border-[#FE2C55] p-3 rounded-sm mt-4">
                        <AlertCircle size={14} />
                        {methodError}
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => {
                          if (validateShippingMethod()) setActiveStep(4);
                        }}
                        className="w-full md:w-auto bg-[#161823] hover:bg-black text-white px-5 py-2 rounded-sm font-semibold text-[13px] transition-colors flex justify-center items-center gap-2 tracking-tight"
                      >
                        Continue to Payment <ChevronRight size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              activeStep > 3 && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 bg-white rounded-b-sm border-t border-[#E3E3E4] pt-4 ml-[2.25rem]">
                  <h4 className="text-[15px] text-[#161823] mb-1">
                    {shippingOptions.find(m => m.code === shippingMethod)?.title || 'Selected Method'}
                  </h4>
                  <p className="text-[13px] text-[#8A8B91]">
                    {shippingMethod === 'pickup' 
                      ? `${pickupStations.find(s => (s._id || s.code) === selectedStation)?.name || ''} - ${pickupStations.find(s => (s._id || s.code) === selectedStation)?.address || ''}`
                      : `Shipping Fee: ${shippingOptions.find(m => m.code === shippingMethod)?.price === 0 ? 'FREE' : 'UGX ' + (shippingOptions.find(m => m.code === shippingMethod)?.price || 0).toLocaleString()}`
                    }
                  </p>
                </div>
              )
            )}
          </div>

          {/* STEP 4: PAYMENT METHOD */}
          <div className={`bg-white border rounded-sm overflow-hidden transition-all duration-300 ${activeStep === 4 ? 'border-[#161823] ring-1 ring-[#161823]' : 'border-[#E3E3E4]'} ${activeStep < 4 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="p-4 md:p-5 flex items-center justify-between bg-white border-b border-[#E3E3E4]">
              <h3 className={`font-bold text-[15px] flex items-center gap-3 tracking-tight uppercase ${activeStep > 4 ? 'text-[#8A8B91]' : 'text-[#161823]'}`}>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${activeStep === 4 ? 'bg-[#161823] text-white' : 'bg-[#E3E3E4] text-[#8A8B91]'}`}>4</span>
                Payment Method
              </h3>
            </div>

            {activeStep === 4 && (
              <div className="p-5 md:p-6">
                {isFetchingConfig ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 size={24} className="animate-spin text-[#8A8B91]" />
                  </div>
                ) : paymentOptions.length === 0 ? (
                   <p className="text-[13px] text-[#8A8B91]">No payment methods available.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                      {paymentOptions.map((method) => {
                        const Icon = ICONS[method.iconName] || CreditCard;
                        const isSelected = paymentMethod === method.code;
                        
                        return (
                          <div 
                            key={method.code}
                            onClick={() => setPaymentMethod(method.code)}
                            className={`border rounded-sm p-4 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden min-h-[100px] ${isSelected ? 'border-[#161823] bg-[#F8F8F8] ring-1 ring-[#161823]' : 'border-[#E3E3E4] bg-white hover:border-[#161823]'}`}
                          >
                            {method.image ? (
                              <img src={method.image} alt={method.title} className="w-8 h-8 object-contain mb-1" />
                            ) : (
                              <Icon size={20} className={isSelected ? 'text-[#161823]' : 'text-[#8A8B91]'} />
                            )}
                            <span className={`text-[13px] font-bold ${isSelected ? 'text-[#161823]' : 'text-[#161823]'}`}>{method.title}</span>
                            <span className="text-[11px] text-[#8A8B91] leading-tight">{method.description}</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-start gap-2 bg-[#F8F8F8] p-3 rounded-sm border border-[#E3E3E4] mb-6">
                      <ShieldCheck size={16} className="text-[#161823] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#8A8B91] font-medium leading-relaxed">
                        {paymentMethod === 'cash_on_delivery' 
                          ? "You will pay the total amount directly to our agent upon successful delivery of your order." 
                          : "Your payment information is encrypted and secure. We do not store your full credit card or PIN details."}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className="w-full md:w-auto bg-[#FE2C55] hover:bg-[#e0264b] text-white px-6 py-2.5 rounded-sm font-semibold text-[13px] transition-colors flex justify-center items-center gap-2 disabled:opacity-50 tracking-tight"
                      >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Place Order'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Wrap for Summary and Support */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 space-y-4">
            
            {/* Order Summary */}
            <div className="bg-white border border-[#E3E3E4] rounded-sm">
              <h3 className="p-4 md:p-5 font-bold text-[15px] text-[#161823] border-b border-[#E3E3E4] bg-[#F8F8F8] tracking-tight flex items-center justify-between uppercase">
                <span>Order Summary</span>
                <span className="text-[12px] font-medium text-[#8A8B91] bg-white border border-[#E3E3E4] px-2 py-0.5 rounded-sm">{cartItems.length} Items</span>
              </h3>
              
              <div className="p-4 md:p-5 max-h-[350px] overflow-y-auto custom-scrollbar border-b border-[#E3E3E4]">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm shrink-0 overflow-hidden">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[18px]">🛍️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-[12px] font-semibold text-[#161823] line-clamp-2 leading-tight mb-1">
                          {item.product.title}
                        </h4>
                        {Object.entries(item.variants || {}).length > 0 && (
                          <p className="text-[10px] text-[#8A8B91] font-medium">
                            {Object.values(item.variants).join(' / ')}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[11px] text-[#8A8B91] font-medium">
                            Qty: <span className="text-[#161823] font-bold">{item.quantity}</span>
                          </span>
                          <span className="text-[12px] font-bold text-[#161823]">
                            UGX {parseFloat(item.priceAtAddition || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 md:p-5 space-y-2.5 bg-white rounded-b-sm">
                <div className="flex justify-between items-center text-[12px] text-[#8A8B91] font-medium">
                  <span>Subtotal</span>
                  <span className="text-[#161823] font-semibold">UGX {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] text-[#8A8B91] font-medium">
                  <span>Shipping Fee</span>
                  <span className="text-[#161823] font-semibold">
                    {currentShippingFee === 0 ? 'FREE' : `UGX ${currentShippingFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="pt-3 mt-1 border-t border-[#E3E3E4] flex justify-between items-center">
                  <span className="text-[13px] font-bold text-[#161823]">Total</span>
                  <span className="text-[18px] font-extrabold text-[#FE2C55] tracking-tight">
                    UGX {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Support Information Box */}
            <div className="bg-[#F8F8F8] border border-[#E3E3E4] rounded-sm p-4 md:p-5">
              <h4 className="text-[13px] font-bold text-[#161823] mb-3 uppercase">Need Help?</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[#8A8B91]">
                  <Phone size={14} className="text-[#161823]" />
                  <span className="text-[13px] font-medium text-[#161823]">{supportInfo.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#8A8B91]">
                  <Mail size={14} className="text-[#161823]" />
                  <span className="text-[13px] font-medium text-[#161823]">{supportInfo.email}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #F8F8F8; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E3E3E4; border-radius: 2px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8A8B91; }
        `}</style>
      </div>
    </div>
  );
}