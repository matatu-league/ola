import mongoose from 'mongoose';

// --- STORE CATEGORY SCHEMA ---
// This handles the custom/scoped navigation tree for individual merchants
const StoreCategorySchema = new mongoose.Schema({
  storeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String },
  // Allows merchants to have subcategories (e.g., "Lathes" under "Heavy Machinery")
  parentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreCategory', default: null } 
}, { timestamps: true });

// --- MAIN STORE SCHEMA ---
const StoreSchema = new mongoose.Schema({
  owner: { type: String, required: true, unique: true }, 
  title: { type: String, required: true },
  domain: { type: String, unique: true, sparse: true },
  description: String,
  themeColor: String,
  layoutStyle: String,
  logo: String,
  banner: String,
  bannerImages: [String],
  
  // Global categories this store operates in
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory' }],
  // --- NEW: Analytics / Metrics ---
  views: { type: Number, default: 0 }, 
  
  // Base location (mirrored in UI under Store Location)
  location: {
    isOnlineOnly: { type: Boolean, default: false },
    address: String,
    lat: Number, // Latitude
    lng: Number  // Longitude
  },
  contact: {
    email: String,
    phone: String
  },
  
  // --- NEW: App Settings mirroring frontend StoreSettings UI ---
  settings: {
    payments: {
      payoutMethod: { type: String, enum: ['mobile_money', 'bank'], default: 'mobile_money' },
      mobileMoneyNumber: String,
      mobileMoneyName: String,
      bankAccount: String,
      bankName: String,
      payoutSchedule: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], default: 'weekly' }
    },
    shipping: {
      flatRate: { type: Number, default: 5000 },
      freeShippingThreshold: { type: Number, default: 150000 },
      internationalShipping: { type: Boolean, default: false }
    },
    hours: {
      monday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
      tuesday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
      wednesday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
      thursday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
      friday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
      saturday: { isOpen: { type: Boolean, default: true }, open: { type: String, default: '10:00' }, close: { type: String, default: '15:00' } },
      sunday: { isOpen: { type: Boolean, default: false }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } }
    },
    notifications: {
      emailOrders: { type: Boolean, default: true },
      emailPayouts: { type: Boolean, default: true },
      emailMarketing: { type: Boolean, default: false },
      smsAlerts: { type: Boolean, default: true }
    },
    security: {
      twoFactorAuth: { type: Boolean, default: false }
    }
  },

  // Store Component Visibility & Features
  features: {
    flashSales: { type: Boolean, default: false }
  },
  verified: { type: Boolean, default: false },
  years: Number,
  staff: String,
  revenue: String,
  rating: { type: Number, default: 5.0 },
  capabilities: [{
    label: String,
    value: String
  }],
  
  products: [{
    title: String,
    price: String,
    moq: String,
    image: String,
    // Dual-Category References for quick inline display
    categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory' }, // Global
    storeCategoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreCategory' }  // Store Custom
  }],
  
  gallery: {
    image: String,
    count: String
  }
}, { timestamps: true });

// Export models safely to prevent overwrite errors in Next.js/Serverless environments
export const StoreCategory = mongoose.models.StoreCategory || mongoose.model('StoreCategory', StoreCategorySchema);
export default mongoose.models.Store || mongoose.model('Store', StoreSchema);