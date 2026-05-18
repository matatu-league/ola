import mongoose from 'mongoose';

// --- MAIN CATEGORY SCHEMA (Global Marketplace) ---
const MarketplaceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String },
  description: { type: String },
  parentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory', default: null },
  top_selection: [mongoose.Schema.Types.Mixed] 
}, { timestamps: true });

// --- MARKETPLACE FEED SCHEMAS ---
const TopDealSchema = new mongoose.Schema({
  title: String,
  price: String,
  moq: String,
  image: String
});

const TailoredSelectionSchema = new mongoose.Schema({
  title: String,
  views: String,
  price: String,
  images: [String]
});

// --- VARIANT SCHEMA ---
const VariantSchema = new mongoose.Schema({
  type: { type: String, required: true }, // Added type grouping (e.g., 'Color', 'Size', 'Material')
  name: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: String }, 
  image: { type: String }  
});

// --- REVIEW SCHEMA ---
const ReviewSchema = new mongoose.Schema({
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductGrid', required: true, index: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: { type: String, required: true },
  reviewerCountry: { type: String },
  reviewerFlag: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }],
  variantPurchased: { type: String },
  helpfulCount: { type: Number, default: 0 },
}, { timestamps: true });

// --- MAIN PRODUCT SCHEMA ---
const ProductGridSchema = new mongoose.Schema({
  // Ownership & Organization
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // DUAL CATEGORY SYSTEM
  categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory', index: true }, // Global Taxonomy
  storeCategoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreCategory', index: true },  // <-- ADDED: Merchant's Custom Taxonomy
  
  breadcrumbs: [{ type: String }],
  status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },

  // Basic Info
  title: { type: String, required: true },
  description: { type: String },
  
  // Pricing & Metrics
  price: { type: String, required: true },
  moq: { type: String, default: '1' },
  sold: { type: Number, default: 0 },
  views: { type: Number, default: 0 }, // <-- NEW: Track how many times this product has been viewed
  
  // Cache for Reviews
  rating: { type: Number, default: 0.0 },
  reviewsCount: { type: Number, default: 0 },
  
  // Media / Visuals
  image: { type: String }, // Primary Cover Image
  images: [{ type: String }], // Array of all uploaded images
  
  // Interactive Media Fields
  videoDescription: { type: String }, // URL pointer to Firebase Storage MP4/WebM
  audioDescription: { type: String }, // URL pointer to Firebase Storage MP3/WAV
  
  // Global Inventory
  sku: { type: String },
  stock: { type: Number, default: 0 },
  
  // Promotions / Flash Sales
  isFlashItem: { type: Boolean, default: false },
  discountPercentage: { type: Number },
  
  // Product Variants
  hasVariants: { type: Boolean, default: false },
  variantsHaveDifferentPrices: { type: Boolean, default: false },
  variants: [VariantSchema],

  // Store Front Badges
  verified: { type: Boolean, default: false },
  years: { type: Number, default: 1 },

  // Key Attributes Grid
  attributes: [{
    name: { type: String },  
    value: { type: String }  
  }],
  
  // Packaging Details
  packaging: {
    sellingUnits: { type: String, default: "Single item" },
    packageSize: { type: String },
    grossWeight: { type: String }
  },

  // Customization Options
  customization: [{ type: String }],
  
  // Shipping details
  shipping: {
    fee: { type: String, default: "To be negotiated" },
    note: { type: String, default: "Chat with supplier for delivery details." }
  }

}, { timestamps: true });

const NewArrivalSchema = new mongoose.Schema({
  title: String,
  price: String,
  moq: String,
  tag: String,
  image: String
});

// Export all marketplace models safely
export const TopDeal = mongoose.models.TopDeal || mongoose.model('TopDeal', TopDealSchema);
export const TailoredSelection = mongoose.models.TailoredSelection || mongoose.model('TailoredSelection', TailoredSelectionSchema);
export const ProductGrid = mongoose.models.ProductGrid || mongoose.model('ProductGrid', ProductGridSchema);
export const ProductReview = mongoose.models.ProductReview || mongoose.model('ProductReview', ReviewSchema);
export const NewArrival = mongoose.models.NewArrival || mongoose.model('NewArrival', NewArrivalSchema);
export const MarketplaceCategory = mongoose.models.MarketplaceCategory || mongoose.model('MarketplaceCategory', MarketplaceCategorySchema);