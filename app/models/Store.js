import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema({
  owner: { type: String, required: true, unique: true }, 
  title: { type: String, required: true },
  domain: { type: String, unique: true, sparse: true },
  description: String,
  themeColor: String,
  layoutStyle: String,
  logo: String, // <-- ADDED: Logo field
  banner: String,
  bannerImages: [String],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory' }],
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  contact: {
    email: String,
    phone: String
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
    categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceCategory' }
  }],
  gallery: {
    image: String,
    count: String
  }
}, { timestamps: true });

export default mongoose.models.Store || mongoose.model('Store', StoreSchema);