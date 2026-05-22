import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const CategorySchema = new Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, trim: true, index: true },
    image:       { type: String },
    description: { type: String },
    parentId:    { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  },
  { timestamps: true },
);

const COLLECTION_TYPES = [
  'top_deals',
  'tailored_selection',
  'new_arrivals',
  'flash_sale',
  'featured',
  'sponsored',
];

const CollectionSchema = new Schema(
  {
    name:       { type: String, required: true, trim: true },
    slug:       { type: String, required: true, unique: true, index: true },
    type:       { type: String, enum: COLLECTION_TYPES, required: true, index: true },
    label:      { type: String },
    active:     { type: Boolean, default: true, index: true },
    startsAt:   { type: Date },
    endsAt:     { type: Date },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
  },
  { timestamps: true },
);

const VariantSchema = new Schema({
  type:  { type: String, required: true },
  name:  { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  price: { type: String },
  image: { type: String },
});

const ReviewSchema = new Schema(
  {
    productId:       { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId:          { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    reviewerName:    { type: String, required: true },
    reviewerCountry: { type: String },
    reviewerFlag:    { type: String },
    rating:          { type: Number, required: true, min: 1, max: 5 },
    comment:         { type: String, required: true },
    images:          [{ type: String }],
    variantPurchased: { type: String },
    helpfulCount:    { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ProductSchema = new Schema(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User',          required: true, index: true },
    storeId:         { type: Schema.Types.ObjectId, ref: 'Store',         index: true },
    categoryId:      { type: Schema.Types.ObjectId, ref: 'Category',      index: true },
    storeCategoryId: { type: Schema.Types.ObjectId, ref: 'StoreCategory', index: true },
    collections:     [{ type: Schema.Types.ObjectId, ref: 'Collection',   index: true }],
    status:      { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true },
    breadcrumbs: [{ type: String }],
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: String, required: true },
    moq:   { type: String, default: '1' },
    sold:  { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    rating:       { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    image:            { type: String },
    images:           [{ type: String }],
    videoDescription: { type: String },
    audioDescription: { type: String },
    sku:   { type: String, sparse: true, index: true },
    stock: { type: Number, default: 0 },
    isFlashItem:        { type: Boolean, default: false },
    discountPercentage: { type: Number, min: 0, max: 100 },
    hasVariants:                 { type: Boolean, default: false },
    variantsHaveDifferentPrices: { type: Boolean, default: false },
    variants:                    [VariantSchema],
    verified: { type: Boolean, default: false },
    years:    { type: Number, default: 1 },
    attributes: [{ name: { type: String }, value: { type: String } }],
    packaging: {
      sellingUnits: { type: String, default: 'Single item' },
      packageSize:  { type: String },
      grossWeight:  { type: String },
    },
    customization: [{ type: String }],
    shipping: {
      fee:  { type: String, default: 'To be negotiated' },
      note: { type: String, default: 'Chat with supplier for delivery details.' },
    },
  },
  { timestamps: true },
);

// Sub-schema for items in the cart
const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  // To handle products with variations (color, size, etc)
  variants: {
    type: Map,
    of: String,
    default: {}
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity can not be less then 1.'],
    default: 1
  },
  // Store price to prevent user manipulation during checkout
  priceAtAddition: {
    type: Number,
    required: true
  }
}, { _id: true }); // Enable _id for easy array manipulation (removing specific items)

const CartSchema = new Schema({
  // Tied to user if authenticated
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  // Tied to session if anonymous/guest
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  items: [CartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Calculate totals dynamically before saving to DB
CartSchema.pre('save', function(next) {
  this.totalQuantity = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.totalPrice = this.items.reduce((acc, item) => acc + (item.priceAtAddition * item.quantity), 0);
  next();
});


// ----------------------------------------------------------------------------
// LOGISTICS MODELS (NEW)
// ----------------------------------------------------------------------------

const ShippingMethodSchema = new Schema({
  code: { type: String, required: true, unique: true }, // e.g., 'standard', 'express', 'pickup'
  title: { type: String, required: true }, // e.g., 'Standard Delivery'
  price: { type: Number, required: true, default: 0 },
  description: { type: String }, // e.g., 'Delivery in 2-3 business days'
  iconName: { type: String }, // string reference for frontend icon (e.g., 'Truck', 'Clock', 'Store')
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

const PickupStationSchema = new Schema({
  code: { type: String, required: true, unique: true }, // e.g., 'kla-hub'
  name: { type: String, required: true }, // e.g., 'Kampala Central Hub'
  address: { type: String, required: true }, // e.g., 'Plot 12, Kampala Road'
  city: { type: String }, // e.g., 'Kampala'
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });


// ----------------------------------------------------------------------------
// ORDER MODELS
// ----------------------------------------------------------------------------

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  storeId:         { type: Schema.Types.ObjectId, ref: 'Store',         index: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variants: { type: Map, of: String }
});

const ShippingAddressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, default: 'Uganda' },
  additionalInstructions: { type: String }
});

const OrderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  
  // NEW: Direct Database References for Logistics
  shippingMethod: { type: String, required: true }, // code: 'standard', 'express', 'pickup'
  pickupStationId: { type: Schema.Types.ObjectId, ref: 'PickupStation' }, // Populated if shippingMethod === 'pickup'
  
  subTotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'card', 'cash_on_delivery'],
    required: true
  },
  
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'processing',
    index: true
  },
  
  // Tracking number for order shipment details
  trackingNumber: { type: String }
}, { timestamps: true });

export const Category       = models.Category       || model('Category',       CategorySchema);
export const Collection     = models.Collection     || model('Collection',     CollectionSchema);
export const Product        = models.Product        || model('Product',        ProductSchema);
export const ProductReview  = models.ProductReview  || model('ProductReview',  ReviewSchema);
export const Cart           = models.Cart           || model('Cart',           CartSchema);
export const Order          = models.Order          || model('Order',          OrderSchema);

// NEW EXPORTS
export const ShippingMethod = models.ShippingMethod || model('ShippingMethod', ShippingMethodSchema);
export const PickupStation  = models.PickupStation  || model('PickupStation',  PickupStationSchema);