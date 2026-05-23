import mongoose from 'mongoose';

const ShippingMethodSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  description: { type: String },
  iconName: { type: String },
  image: { type: String },
  active: { type: Boolean, default: true }
});

const PickupStationSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  active: { type: Boolean, default: true }
});

const PaymentMethodSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  iconName: { type: String },
  image: { type: String },
  provider: { type: String }, // 'stripe' | 'paypal' | 'flutterwave' | 'razorpay' | 'mobile_money' | 'cash'
  active: { type: Boolean, default: true }
});

const CourierSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  logo: { type: String },
  active: { type: Boolean, default: true }
});

const SettingsSchema = new mongoose.Schema(
  {
    isGlobal: { type: Boolean, default: true, unique: true },

    // General
    platformName: { type: String, default: 'AlxLite B2B Marketplace' },
    supportEmail: { type: String, default: 'support@alxlite.com' },
    supportPhone: { type: String, default: '+256 800 123 456' },
    maintenanceMode: { type: Boolean, default: false },

    // Vendors & Stores
    storeApprovalRequired: { type: Boolean, default: true },
    maxStoresPerUser: { type: Number, default: 3 },
    globalCommissionRate: { type: Number, default: 12.5 },
    minimumPayoutThreshold: { type: Number, default: 50000 },

    // Payments
    baseCurrency: { type: String, default: 'UGX' },
    enableMobileMoney: { type: Boolean, default: true },
    enableCreditCards: { type: Boolean, default: true },
    payoutSchedule: { type: String, default: 'weekly', enum: ['daily', 'weekly', 'biweekly', 'monthly'] },

    // Shipping
    globalShippingEnabled: { type: Boolean, default: true },
    defaultDomesticRate: { type: Number, default: 15000 },
    enableInternationalShipping: { type: Boolean, default: false },
    fulfillmentCenters: { type: String, default: 'Kampala Main, Entebbe Hub' },

    // Security
    require2FAForAdmins: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 120 },

    // Shipping Methods
    shippingMethods: {
      type: [ShippingMethodSchema],
      default: [
        { code: 'standard', title: 'Standard Delivery', price: 5000, description: 'Delivery in 2-3 business days', iconName: 'Truck', active: true },
        { code: 'express', title: 'Express Delivery', price: 15000, description: 'Same day delivery (Order before 2 PM)', iconName: 'Clock', active: true },
        { code: 'pickup', title: 'Pickup Station', price: 2000, description: 'Collect from a nearby station', iconName: 'Store', active: true }
      ]
    },

    // Pickup Stations
    pickupStations: {
      type: [PickupStationSchema],
      default: [
        { code: 'kla-hub', name: 'Kampala Central Hub', address: 'Plot 12, Kampala Road, Kampala', city: 'Kampala', active: true },
        { code: 'hoima-main', name: 'Hoima City Hub', address: 'Main Street, Opposite Central Market', city: 'Hoima', active: true }
      ]
    },

    // Payment Methods — all major gateways + mobile money + cash
    paymentMethods: {
      type: [PaymentMethodSchema],
      default: [
        {
          code: 'mobile_money',
          title: 'Mobile Money',
          description: 'Pay via MTN or Airtel Money',
          iconName: 'Smartphone',
          provider: 'mobile_money',
          active: true
        },
        {
          code: 'flutterwave',
          title: 'Flutterwave',
          description: 'Card, Mobile Money & more via Flutterwave',
          iconName: 'CreditCard',
          provider: 'flutterwave',
          active: true
        },
        {
          code: 'stripe',
          title: 'Stripe',
          description: 'Pay securely with Visa / Mastercard via Stripe',
          iconName: 'CreditCard',
          provider: 'stripe',
          active: true
        },
        {
          code: 'paypal',
          title: 'PayPal',
          description: 'Pay with your PayPal account or card',
          iconName: 'CreditCard',
          provider: 'paypal',
          active: true
        },
        {
          code: 'razorpay',
          title: 'Razorpay',
          description: 'UPI, cards, wallets via Razorpay',
          iconName: 'CreditCard',
          provider: 'razorpay',
          active: true
        },
        {
          code: 'cash_on_delivery',
          title: 'Cash on Delivery',
          description: 'Pay cash when your order arrives',
          iconName: 'Banknote',
          provider: 'cash',
          active: true
        }
      ]
    },

    couriers: {
      type: [CourierSchema],
      default: [
        { id: 1, name: 'DHL Express', logo: '', active: true },
        { id: 2, name: 'SafeBoda', logo: '', active: true }
      ]
    }
  },
  { timestamps: true }
);

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export default Settings;