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
    productId:        { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId:           { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    reviewerName:     { type: String, required: true },
    reviewerCountry:  { type: String },
    reviewerFlag:     { type: String },
    rating:           { type: Number, required: true, min: 1, max: 5 },
    comment:          { type: String, required: true },
    images:           [{ type: String }],
    variantPurchased: { type: String },
    helpfulCount:     { type: Number, default: 0 },
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

// ─── Product View History ──────────────────────────────────────────────────────

const ProductViewSchema = new Schema(
  {
    // Identity — one of these is set (mirrors the Cart pattern)
    user:      { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, default: null, index: true },

    product:      { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    viewCount:    { type: Number, default: 1 },             // times this viewer opened this product
    lastViewedAt: { type: Date,   default: Date.now },
  },
  { timestamps: true },
);

// One history row per viewer per product. Partial filters keep anonymous rows
// (user: null) from colliding on the user index, and vice-versa.
ProductViewSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } },
);
ProductViewSchema.index(
  { sessionId: 1, product: 1 },
  { unique: true, partialFilterExpression: { sessionId: { $type: 'string' } } },
);

// For the "recently viewed" listing
ProductViewSchema.index({ user: 1,      lastViewedAt: -1 });
ProductViewSchema.index({ sessionId: 1, lastViewedAt: -1 });

// ─── Cart ─────────────────────────────────────────────────────────────────────

const CartItemSchema = new Schema({
  product: {
    type:     Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  variants: {
    type: Map,
    of:   String,
    default: {},
  },
  quantity: {
    type:     Number,
    required: true,
    min:      [1, 'Quantity cannot be less than 1.'],
    default:  1,
  },
  priceAtAddition: {
    type:     Number,
    required: true,
  },
}, { _id: true });

const CartSchema = new Schema({
  // Identity — one of these must be set
  user:      { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  sessionId: { type: String, default: null, index: true },

  items:         { type: [CartItemSchema], default: [] },
  totalQuantity: { type: Number, default: 0 },
  totalPrice:    { type: Number, default: 0 },

  // ── Abandoned cart tracking ──────────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['active', 'abandoned', 'converted', 'merged'],
    default: 'active',
    index:   true,
  },
  lastActivityAt: { type: Date, default: Date.now },  // updated on every cart mutation
  abandonedAt:    { type: Date, default: null },       // set when cron marks abandoned
  convertedAt:    { type: Date, default: null },       // set when order is placed
  convertedOrderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },

  // Recovery email tracking
  recoverySentAt: { type: Date,   default: null },  // when last recovery email was sent
  recoveryCount:  { type: Number, default: 0    },  // how many recovery emails sent
  recoveryToken:  { type: String, default: null, index: true }, // unique token in recovery link

  // Traffic source
  source:  { type: String, default: null },   // 'web' | 'mobile' | 'email-recovery'
  utmData: { type: Schema.Types.Mixed, default: {} },

}, { timestamps: true });

// Compound indexes for cron job queries
CartSchema.index({ status: 1, lastActivityAt: 1 });
CartSchema.index({ status: 1, abandonedAt: 1, recoveryCount: 1 });

// Calculate totals + update lastActivityAt before every save
CartSchema.pre('save', function (next) {
  this.totalQuantity = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.totalPrice    = this.items.reduce((acc, item) => acc + (item.priceAtAddition * item.quantity), 0);
  this.lastActivityAt = new Date();
  next();
});

// ─── Logistics ────────────────────────────────────────────────────────────────

const ShippingMethodSchema = new Schema({
  code:        { type: String, required: true, unique: true },
  title:       { type: String, required: true },
  price:       { type: Number, required: true, default: 0 },
  description: { type: String },
  iconName:    { type: String },
  active:      { type: Boolean, default: true, index: true },
}, { timestamps: true });

const PickupStationSchema = new Schema({
  code:    { type: String, required: true, unique: true },
  name:    { type: String, required: true },
  address: { type: String, required: true },
  city:    { type: String },
  active:  { type: Boolean, default: true, index: true },
}, { timestamps: true });

// ─── Orders ───────────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema({
  product:  { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  storeId:  { type: Schema.Types.ObjectId, ref: 'Store', index: true },
  name:     { type: String, required: true },
  image:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true },
  variants: { type: Map, of: String },
});

const ShippingAddressSchema = new Schema({
  fullName:               { type: String, required: true },
  phone:                  { type: String, required: true }, // field name is 'phone' in this schema
  addressLine1:           { type: String, required: true },
  city:                   { type: String, required: true },
  country:                { type: String, default: 'Uganda' },
  additionalInstructions: { type: String },
});

const OrderSchema = new Schema({
  user: {
    type:     Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  orderNumber: { type: String, required: true, unique: true },
  items:           [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  shippingMethod:  { type: String, required: true }, // code: 'standard' | 'express' | 'pickup'
  pickupStationId: { type: Schema.Types.ObjectId, ref: 'PickupStation' },

  subTotal:    { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  // ── Payment ──────────────────────────────────────────────────────────────
  paymentStatus: {
    type:    String,
    enum:    ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index:   true,
  },
  // The gateway/method the user selected at checkout
  paymentMethod: {
    type: String,
    enum: [
      'mobile_money',    // MTN / Airtel direct USSD
      'flutterwave',     // Flutterwave hosted checkout
      'stripe',          // Stripe card
      'paypal',          // PayPal
      'razorpay',        // Razorpay (UPI / Indian cards)
      'cash_on_delivery',
    ],
    required: true,
  },
  // The provider that actually processed the payment (may differ — e.g. flutterwave processes momo)
  paymentProvider:  { type: String, default: null },
  // Gateway's transaction/capture ID — used for refunds and support
  paymentReference: { type: String, default: null, index: true },
  // When payment was confirmed by the gateway
  paidAt:           { type: Date, default: null },

  // ── Fulfilment ────────────────────────────────────────────────────────────
  orderStatus: {
    type:    String,
    enum:    ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'processing',
    index:   true,
  },
  trackingNumber: { type: String },

}, { timestamps: true });

// ─── Exports ──────────────────────────────────────────────────────────────────
export const Category       = models.Category       || model('Category',       CategorySchema);
export const Collection     = models.Collection     || model('Collection',     CollectionSchema);
export const Product        = models.Product        || model('Product',        ProductSchema);
export const ProductReview  = models.ProductReview  || model('ProductReview',  ReviewSchema);
export const ProductView    = models.ProductView    || model('ProductView',    ProductViewSchema);
export const Cart           = models.Cart           || model('Cart',           CartSchema);
export const Order          = models.Order          || model('Order',          OrderSchema);
export const ShippingMethod = models.ShippingMethod || model('ShippingMethod', ShippingMethodSchema);
export const PickupStation  = models.PickupStation  || model('PickupStation',  PickupStationSchema);