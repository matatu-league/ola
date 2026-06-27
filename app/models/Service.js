// app/models/Service.js
// Services offered by a store (businessType 'services' or 'both'). Mirrors the
// shape the seller services dashboard (app/stores/[subdomain]/services/page.js)
// posts/reads. Bookings build on top of this in a later phase.
import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

const BookingDetailsSchema = new Schema(
  {
    cancellationPolicy: { type: String, default: '' },
    requirements:       { type: String, default: '' },
    amenities:          [{ type: String }],
    checkInTime:        { type: String, default: '' },
    checkOutTime:       { type: String, default: '' },
  },
  { _id: false },
);

const ServiceSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    // The dashboard form keeps the selected category in `category` (a Category _id).
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },

    title:       { type: String, required: true, trim: true },
    description: { type: String },
    tags:        { type: String, default: '' },

    images: [{ type: String }],
    image:  { type: String },

    pricingType:     { type: String, enum: ['fixed', 'hourly', 'starting_at', 'contact'], default: 'fixed' },
    price:           { type: String, default: '' },
    enableBooking:   { type: Boolean, default: false },
    durationMinutes: { type: String, default: '60' },

    bookingDetails: { type: BookingDetailsSchema, default: () => ({}) },

    // Carried from the store/category so the storefront can pick the booking UI.
    serviceType: { type: String, default: null },
    status:      { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true },
  },
  { timestamps: true },
);

const Service = models.Service || model('Service', ServiceSchema);
export default Service;
