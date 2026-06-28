import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

// ─────────────────────────────────────────────
// STORE CATEGORY
// ─────────────────────────────────────────────
const StoreCategorySchema = new Schema(
  {
    storeId:   { type: Schema.Types.ObjectId, ref: 'Store',         required: true, index: true },
    parentId:  { type: Schema.Types.ObjectId, ref: 'StoreCategory', default: null },
    name:      { type: String, required: true },
    slug:      { type: String, required: true },
    image:     { type: String },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// STORE COLLECTION
// ─────────────────────────────────────────────
const StoreCollectionSchema = new Schema(
  {
    storeId:      { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    collectionId: { type: String, required: true }, // e.g. 'flash_sale', 'c1'
    name:         { type: String, required: true },
    description:  { type: String },
    enabled:      { type: Boolean, default: false },
    icon:         { type: String },
    color:        { type: String },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────
const StoreSchema = new Schema(
  {
    // A user may own up to 3 stores, so userId is indexed but NOT unique.
    // If you get an E11000 error, you must drop the 'userId_1' index in MongoDB manually.
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, required: true },
    domain:      { type: String, unique: true, sparse: true },

    // This perfectly matches the frontend fix we applied
    businessType: { type: String, enum: ['products', 'services', 'both'], default: 'products' },
    industry:     { type: String, required: true },
    
    // For service/both stores — selects the booking field set.
    serviceType:  { type: String, default: null },

    description:   { type: String },
    themeColor:    { type: String, default: '#161823' },
    layoutStyle:   { type: String, default: 'Classic' }, // 'Classic' | 'Modern' | 'Bold' | 'Custom_AI'
    logo:          { type: String },
    banner:        { type: String },
    bannerImages:  [{ type: String }],
    themeTemplate: { type: String, default: null }, 

    // Structured, config-driven theme.
    theme: {
      mode:      { type: String, enum: ['light', 'dark'], default: 'light' },
      primary:   { type: String },
      onPrimary: { type: String },
      bg:        { type: String },
      surface:   { type: String },
      text:      { type: String },
      muted:     { type: String },
      border:    { type: String },
      radius:    { type: String },
      font:      { type: String },
      sections:  { type: [Schema.Types.Mixed], default: [] },
    },

    // Global marketplace categories this store operates in
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],

    views: { type: Number, default: 0 },

    location: {
      isOnlineOnly: { type: Boolean, default: false },
      address:      { type: String },
      lat:          { type: Number },
      lng:          { type: Number },
    },

    contact: {
      email: { type: String },
      phone: { type: String },
    },

    settings: {
      payments: {
        payoutMethod:       { type: String, enum: ['mobile_money', 'bank'], default: 'mobile_money' },
        mobileMoneyNumber:  { type: String },
        mobileMoneyName:    { type: String },
        bankAccount:        { type: String },
        bankName:           { type: String },
        payoutSchedule:     { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], default: 'weekly' },
      },
      shipping: {
        flatRate:               { type: Number, default: 5000 },
        freeShippingThreshold:  { type: Number, default: 150000 },
        internationalShipping:  { type: Boolean, default: false },
      },
      hours: {
        monday:    { isOpen: { type: Boolean, default: true },  open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
        tuesday:   { isOpen: { type: Boolean, default: true },  open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
        wednesday: { isOpen: { type: Boolean, default: true },  open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
        thursday:  { isOpen: { type: Boolean, default: true },  open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
        friday:    { isOpen: { type: Boolean, default: true },  open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
        saturday:  { isOpen: { type: Boolean, default: true },  open: { type: String, default: '10:00' }, close: { type: String, default: '15:00' } },
        sunday:    { isOpen: { type: Boolean, default: false }, open: { type: String, default: '09:00' }, close: { type: String, default: '18:00' } },
      },
      notifications: {
        emailOrders:    { type: Boolean, default: true },
        emailPayouts:   { type: Boolean, default: true },
        emailMarketing: { type: Boolean, default: false },
        smsAlerts:      { type: Boolean, default: true },
      },
      security: {
        twoFactorAuth: { type: Boolean, default: false },
      },
    },

    features: {
      flashSales: { type: Boolean, default: false },
    },

    verified:      { type: Boolean, default: false },
    years:         { type: Number },
    staff:         { type: String },
    revenue:       { type: String },
    rating:        { type: Number, default: 5.0 },

    capabilities: [{ label: String, value: String }],

    gallery: {
      image: { type: String },
      count: { type: String },
    },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export const StoreCategory   = models.StoreCategory   || model('StoreCategory',   StoreCategorySchema);
export const StoreCollection = models.StoreCollection || model('StoreCollection', StoreCollectionSchema);
export const Store           = models.Store           || model('Store',           StoreSchema);
export default Store;