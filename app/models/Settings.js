import mongoose from 'mongoose';

const CourierSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  logo: { type: String },
  active: { type: Boolean, default: true }
});

const GatewaySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  logo: { type: String },
  active: { type: Boolean, default: true }
});

const SettingsSchema = new mongoose.Schema(
  {
    // Singleton Enforcer
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

    // Shipping & Fulfillment
    globalShippingEnabled: { type: Boolean, default: true },
    defaultDomesticRate: { type: Number, default: 15000 },
    enableInternationalShipping: { type: Boolean, default: false },
    fulfillmentCenters: { type: String, default: 'Kampala Main, Entebbe Hub' },

    // Security
    require2FAForAdmins: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 120 },

    // Dynamic Arrays
    couriers: {
      type: [CourierSchema],
      default: [
        { id: 1, name: 'DHL Express', logo: '', active: true },
        { id: 2, name: 'SafeBoda', logo: '', active: true }
      ]
    },
    paymentGateways: {
      type: [GatewaySchema],
      default: [
        { id: 1, name: 'MTN Mobile Money', logo: '', active: true },
        { id: 2, name: 'Airtel Money', logo: '', active: true },
        { id: 3, name: 'Stripe', logo: '', active: false }
      ]
    }
  },
  { timestamps: true }
);

// Prevent hot-reload recompilation errors
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default Settings;