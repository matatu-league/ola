"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import AccountStep  from './AccountStep';
import { setWildcardCookie } from '@/lib/cookies';
import { useUser }  from '@/contexts/UserContext';
import AddressStep  from './AddressStep';
import ShippingStep from './ShippingStep';
import PaymentStep  from './PaymentStep';
import OrderSummary from './OrderSummary';

// ─── Firebase ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app            = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth           = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Cookie helpers removed — user managed by UserContext

// ─── Component ────────────────────────────────────────────────────────────────
export default function CheckoutClient() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart, isHydrated } = useCart();

  // ── Wizard state
  const [activeStep,    setActiveStep]    = useState(1);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [generalError,  setGeneralError]  = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ── First-time sign-in: collect a phone number before continuing ──────────
  const [needsPhone,  setNeedsPhone]  = useState(false);
  const [phoneValue,  setPhoneValue]  = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError,  setPhoneError]  = useState('');

  // ── Config from backend
  const [shippingOptions,  setShippingOptions]  = useState([]);
  const [pickupStations,   setPickupStations]   = useState([]);
  const [paymentOptions,   setPaymentOptions]   = useState([]);
  const [supportInfo,      setSupportInfo]      = useState({ email: 'support@alxlite.com', phoneNumber: '+256 800 123 456' });
  const [isFetchingConfig, setIsFetchingConfig] = useState(true);

  // ── User from central context (no local cookie parsing)
  const { user, refreshUser } = useUser();

  // ── Form state
  const [shipping, setShipping] = useState({ fullName: '', phoneNumber: '', address: '', city: '', instructions: '' });
  const [shippingError, setShippingError] = useState('');

  const [shippingMethod,  setShippingMethod]  = useState(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [methodError,     setMethodError]     = useState('');
  const [paymentMethod,   setPaymentMethod]   = useState(null);

  // ── Pending order — created before gateway opens, confirmed after payment ────
  // This gives gateways like Flutterwave a real orderId before the modal opens.
  const [pendingOrderId, setPendingOrderId] = useState(null);

  // ── Bootstrap
  useEffect(() => {
    // User is provided by UserContext — no cookie parsing here

    // Pre-fill shipping fields when user loads
    if (user) {
      setShipping(p => ({
        ...p,
        fullName:    p.fullName    || user.name        || '',
        phoneNumber: p.phoneNumber || user.phoneNumber || '',
      }));
      setActiveStep(prev => prev === 1 ? 2 : prev);
    }

    (async () => {
      try {
        const res  = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.settings) {
          const s = json.settings;
          const activeShipping = (s.shippingMethods || []).filter(m => m.active);
          const activeStations = (s.pickupStations  || []).filter(x => x.active);
          const activePayments = (s.paymentMethods  || []).filter(m => m.active);
          setShippingOptions(activeShipping);
          setPickupStations(activeStations);
          setPaymentOptions(activePayments);
          setSupportInfo({ email: s.supportEmail || 'support@alxlite.com', phoneNumber: s.supportPhone || '+256 800 123 456' });
          setShippingMethod(p => p ?? (activeShipping[0]?.code || null));
          setPaymentMethod(p  => p ?? (activePayments[0]?.code || null));
        }
      } catch (err) {
        console.error('Failed to fetch checkout config:', err);
      } finally {
        setIsFetchingConfig(false);
      }
    })();
  }, []);

  // ── Auth
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const result       = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const res  = await fetch('/api/auth/google', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id: firebaseUser.uid, name: firebaseUser.displayName,
          email: firebaseUser.email, avatar: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          role: 'buyer', // signing in from checkout → this is a shopper
        }),
      });
      const data = await res.json();
      if (data.success) {
        const session = {
          id: data.user.id, name: data.user.name, email: data.user.email,
          avatar: data.user.avatar, phoneNumber: data.user.phoneNumber || '',
          role: data.user.role || 'buyer', hasStore: data.user.hasStore,
        };
        setWildcardCookie('user_session', encodeURIComponent(JSON.stringify(session)));
        refreshUser(); // re-read cookie into UserContext
        setShipping(p => ({ ...p, fullName: session.name, phoneNumber: session.phoneNumber || p.phoneNumber }));

        // First-time buyers usually have no phone yet — require it before
        // continuing (we need it for delivery + order contact).
        if (!session.phoneNumber) {
          setPhoneValue(firebaseUser.phoneNumber || '');
          setNeedsPhone(true);
        } else {
          setActiveStep(2);
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsAuthLoading(false); }
  };

  // ── Save the phone for a first-time user, persist to the session, continue ──
  const handleSavePhone = async () => {
    const phone = phoneValue.trim();
    // Lightweight phone check — at least 9 digits, allow + and spaces.
    if (!phone || phone.replace(/[^0-9]/g, '').length < 9) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }
    if (!user?.id) { setNeedsPhone(false); setActiveStep(2); return; }

    setPhoneSaving(true);
    setPhoneError('');
    try {
      const res  = await fetch('/api/user/phone', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id, phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save your phone number.');

      // Persist the phone into the shared session cookie so it sticks across
      // pages / the vendor site, and prefill the shipping form.
      const nextSession = { ...(user || {}), id: user.id, phoneNumber: data.phoneNumber || phone };
      setWildcardCookie('user_session', encodeURIComponent(JSON.stringify(nextSession)));
      refreshUser();
      setShipping(p => ({ ...p, phoneNumber: p.phoneNumber || data.phoneNumber || phone }));
      setNeedsPhone(false);
      setActiveStep(2);
    } catch (err) {
      setPhoneError(err.message || 'Could not save your phone number. Please try again.');
    } finally {
      setPhoneSaving(false);
    }
  };

  // ── Validation
  const validateShipping = () => {
    if (!shipping.fullName || !shipping.phoneNumber || !shipping.address || !shipping.city) {
      setShippingError('Please fill in all required shipping details.');
      return false;
    }
    setShippingError('');
    return true;
  };

  const validateMethod = () => {
    if (shippingMethod === 'pickup' && !selectedStation) {
      setMethodError('Please select a pickup station.');
      return false;
    }
    setMethodError('');
    return true;
  };

  // ── Build the order payload (shared between createPendingOrder + confirmOrder)
  const buildOrderPayload = ({ paymentReference = null, paymentProvider = null, paymentStatus = 'pending' } = {}) => {
    const activeMethod = shippingOptions.find(m => m.code === shippingMethod);
    const shippingFee  = activeMethod?.price || 0;
    const totalAmount  = cartTotal + shippingFee;

    let orderInstructions = shipping.instructions ? `Note: ${shipping.instructions}. ` : '';
    if (shippingMethod === 'pickup') {
      const station = pickupStations.find(s => (s._id || s.code) === selectedStation);
      orderInstructions += `| Pickup: ${station?.name} (${station?.address})`;
    } else {
      orderInstructions += `| ${activeMethod?.title || 'Standard Shipping'}`;
    }

    return {
      user:  user.id,
      items: cartItems.map(item => ({
        product:  item.product._id,
        storeId:  item.product.storeId,
        name:     item.product.title,
        image:    item.product.images?.[0] || '',
        price:    item.priceAtAddition,
        quantity: item.quantity,
        variants: item.variants || {},
      })),
      shippingAddress: {
        fullName:               shipping.fullName,
        phone:                  shipping.phoneNumber, // ShippingAddressSchema field is 'phone'
        addressLine1:           shipping.address,
        city:                   shipping.city,
        country:                'Uganda',
        additionalInstructions: orderInstructions,
      },
      shippingMethod:   activeMethod?.code || 'standard',
      ...(shippingMethod === 'pickup' && selectedStation ? { pickupStationId: selectedStation } : {}),
      subTotal:         cartTotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentProvider,
      paymentReference,
      paymentStatus,
    };
  };

  // ── STEP A: Create a pending order BEFORE opening the payment gateway ─────────
  // Called when user clicks Pay — gives Flutterwave (and others) a real orderId.
  // The order is saved with paymentStatus: 'pending' and updated after success.
  const createPendingOrder = async () => {
    setGeneralError('');

    if (!validateShipping())  { setActiveStep(2); return null; }
    if (!validateMethod())    { setActiveStep(3); return null; }
    if (!user)                { setGeneralError('Please sign in to place an order.'); setActiveStep(1); return null; }

    // Return existing pending order if already created (e.g. user retries)
    if (pendingOrderId) return pendingOrderId;

    try {
      const res  = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildOrderPayload({ paymentStatus: 'pending' })),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create order');

      const newOrderId = data.data._id;
      setPendingOrderId(newOrderId);
      return newOrderId;
    } catch (err) {
      console.error('Create pending order error:', err);
      setGeneralError(err.message || 'Failed to prepare order. Please try again.');
      return null;
    }
  };

  // ── STEP B: Confirm order AFTER gateway succeeds ───────────────────────────
  // Updates the pending order with payment details and marks it paid.
  // For COD, creates and confirms in one shot.
  const handlePlaceOrder = async ({ paymentReference, paymentProvider }) => {
    setGeneralError('');
    setIsSubmitting(true);

    try {
      if (paymentProvider === 'cash') {
        // COD — create + confirm in one request (no gateway involved)
        const res  = await fetch('/api/orders', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(buildOrderPayload({
            paymentProvider:  'cash',
            paymentReference: null,
            paymentStatus:    'pending',
          })),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to place order');
        clearCart();
        router.push(`/checkout/success?orderId=${data.data._id}`);
        return;
      }

      // Gateway payments — update the pending order with payment confirmation
      const orderId = pendingOrderId;
      if (!orderId) {
        throw new Error('Order reference lost. Please try again.');
      }

      const res  = await fetch(`/api/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          paymentStatus:    'paid',
          paymentReference: paymentReference || null,
          paymentProvider:  paymentProvider,
          paidAt:           new Date().toISOString(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to confirm order');

      clearCart();
      router.push(`/checkout/success?orderId=${orderId}`);

    } catch (err) {
      console.error('Checkout error:', err);
      setGeneralError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ── Loading: wait for the cart to hydrate before judging it empty. Without
  //    this guard a fresh navigation (e.g. storefront → /checkout) flashes the
  //    empty state during the localStorage/backend load and feels unstable.
  if (!isHydrated && cartItems.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-center text-center bg-white">
        <Loader2 size={28} className="animate-spin text-[var(--s-muted,#8A8B91)] mb-4" />
        <p className="text-[13px] text-[var(--s-muted,#8A8B91)] font-medium">Loading your cart…</p>
      </div>
    );
  }

  // ── Empty cart (only once we KNOW it's empty)
  if (cartItems.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 flex flex-col items-center text-center bg-white">
        <div className="w-24 h-24 bg-[var(--s-surface,#F8F8F8)] border border-[var(--s-border,#E3E3E4)] rounded-sm flex items-center justify-center mb-6">
          <ShoppingCart size={32} className="text-[var(--s-muted,#8A8B91)]" />
        </div>
        <h2 className="text-[18px] font-bold text-[var(--s-text,#161823)] mb-2 tracking-tight">Your cart is empty</h2>
        <p className="text-[var(--s-muted,#8A8B91)] mb-8 text-[13px]">Add some items before checking out.</p>
        <button onClick={() => router.push('/')} className="bg-[var(--s-primary,#161823)] hover:bg-black text-white px-6 py-2 rounded-sm font-semibold text-[13px] transition-colors tracking-tight">
          Continue Shopping
        </button>
      </div>
    );
  }

  const activeShippingOption = shippingOptions.find(m => m.code === shippingMethod);
  const currentShippingFee   = activeShippingOption?.price ?? 0;
  const grandTotal           = cartTotal + currentShippingFee;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* ── LEFT: Steps ─────────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">

          {/* Global error banner */}
          {generalError && (
            <div className="flex items-center gap-2 text-[13px] text-[var(--s-primary,#FE2C55)] font-semibold bg-[#FFF0F3] border border-[var(--s-primary,#FE2C55)] p-4 rounded-sm">
              <AlertCircle size={16} /> {generalError}
            </div>
          )}

          <AccountStep
            activeStep={activeStep}
            user={user}
            isAuthLoading={isAuthLoading}
            onGoogleLogin={handleGoogleLogin}
            needsPhone={needsPhone}
            phoneValue={phoneValue}
            setPhoneValue={setPhoneValue}
            onSavePhone={handleSavePhone}
            phoneSaving={phoneSaving}
            phoneError={phoneError}
          />

          <AddressStep
            activeStep={activeStep}
            shipping={shipping}
            setShipping={setShipping}
            shippingError={shippingError}
            onContinue={() => { if (validateShipping()) setActiveStep(3); }}
            onEdit={() => setActiveStep(2)}
          />

          <ShippingStep
            activeStep={activeStep}
            shippingOptions={shippingOptions}
            pickupStations={pickupStations}
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            methodError={methodError}
            isFetchingConfig={isFetchingConfig}
            onContinue={() => { if (validateMethod()) setActiveStep(4); }}
            onEdit={() => setActiveStep(3)}
          />

          <PaymentStep
            activeStep={activeStep}
            paymentOptions={paymentOptions}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isFetchingConfig={isFetchingConfig}
            amount={grandTotal}
            user={user}
            pendingOrderId={pendingOrderId}
            createPendingOrder={createPendingOrder}   // ← PaymentStep calls this before opening gateway
            onPlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            generalError={generalError}
            setGeneralError={setGeneralError}
          />
        </div>

        {/* ── RIGHT: Order summary ─────────────────────── */}
        <div className="lg:col-span-5 xl:col-span-4">
          <OrderSummary
            cartItems={cartItems}
            cartTotal={cartTotal}
            shippingFee={currentShippingFee}
            isFetchingConfig={isFetchingConfig}
            supportInfo={supportInfo}
          />
        </div>

      </div>
    </div>
  );
}
