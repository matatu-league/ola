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

export const Category      = models.Category      || model('Category',      CategorySchema);
export const Collection    = models.Collection    || model('Collection',    CollectionSchema);
export const Product       = models.Product       || model('Product',       ProductSchema);
export const ProductReview = models.ProductReview || model('ProductReview', ReviewSchema);