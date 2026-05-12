import mongoose from 'mongoose';

// --- MAIN CATEGORY SCHEMA ---
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
  name: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: String }, 
  image: { type: String }  
});

// --- NEW: REVIEW SCHEMA ---
// Stored in a separate collection to prevent the product document from getting too large.
const ReviewSchema = new mongoose.Schema({
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductGrid', required: true, index: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: If the reviewer is a registered user
  
  // Denormalized user info for display without needing to populate
  reviewerName: { type: String, required: true },
  reviewerCountry: { type: String }, // e.g., "United States"
  reviewerFlag: { type: String },    // e.g., "🇺🇸"
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }], // Optional review images uploaded by the buyer
  
  variantPurchased: { type: String }, // e.g., "Color: Black, Model: GD-LT-B18"
  helpfulCount: { type: Number, default: 0 }, // How many people found this review helpful
  
}, { timestamps: true });


// --- UPDATED: MAIN PRODUCT SCHEMA ---
const ProductGridSchema = new mongoose.Schema({
  // Ownership & Organization
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory', index: true },
  breadcrumbs: [{ type: String }], // e.g., ['Vehicles & Transportation', 'Tricycles', 'Electric Tricycles']
  status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },

  // Basic Info
  title: { type: String, required: true },
  description: { type: String },
  
  // Pricing & Metrics
  price: { type: String, required: true },
  comparePrice: { type: String },
  moq: { type: String, default: '1' },
  sold: { type: Number, default: 0 }, // Changed to Number for sorting
  
  // Cache for Reviews (prevents needing to query the Review collection for listing pages)
  rating: { type: Number, default: 0.0 },
  reviewsCount: { type: Number, default: 0 },
  
  // Media
  image: { type: String }, // Primary Cover Image
  images: [{ type: String }], // Array of all uploaded images
  
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

  // Store Front Badges (Denormalized for faster loading)
  verified: { type: Boolean, default: false },
  years: { type: Number, default: 1 },

  // --- B2B PRODUCT DETAILS FIELDS ---
  
  // Key Attributes Grid (e.g., Voltage, Payload Capacity)
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

  // Customization Options (e.g., "Logo customization", "Packaging customization")
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
export const ProductReview = mongoose.models.ProductReview || mongoose.model('ProductReview', ReviewSchema); // <-- NEW MODEL
export const NewArrival = mongoose.models.NewArrival || mongoose.model('NewArrival', NewArrivalSchema);
export const MarketplaceCategory = mongoose.models.MarketplaceCategory || mongoose.model('MarketplaceCategory', MarketplaceCategorySchema);